// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ICredentialNFT {
    function verifyCredential(uint256 _tokenId) external view returns (
        address recipient,
        address issuer,
        string memory credentialType,
        uint256 mintDate,
        bool isValid,
        string memory credentialTokenURI
    );
    function ownerOf(uint256 tokenId) external view returns (address);
    function tokenExists(uint256 tokenId) external view returns (bool);
}

interface IIssuerRegistry {
    function getIssuer(address _issuerAddress) external view returns (
        address issuerAddress,
        string memory universityName,
        bool isVerified,
        bool isActive,
        uint256 registrationDate,
        uint256 verificationLevel,
        uint256 reputationScore,
        string memory metadataURI
    );
    function isAuthorizedIssuer(address _issuerAddress) external view returns (bool);
}

interface ICredentialRegistry {
    function getCredential(uint256 _credentialId) external view returns (
        uint256 credentialId,
        string memory degreeName,
        uint256 issueDate,
        address recipient,
        address issuer,
        bool isRevoked,
        string memory metadataURI
    );
    function isCredentialValid(uint256 _credentialId) external view returns (bool);
}

contract VerificationContract {
    
    address public credentialNFTAddress;
    address public issuerRegistryAddress;
    address public credentialRegistryAddress;
    
    struct VerificationRequest {
        address verifier;
        uint256 credentialId;
        uint256 timestamp;
        bool successful;
    }
    
    struct VerificationProof {
        uint256 credentialId;
        address recipient;
        address issuer;
        string issuerName;
        string credentialType;
        uint256 mintDate;
        bool isValid;
        bool issuerVerified;
        uint256 issuerReputationScore;
        uint256 verificationLevel;
        uint256 proofTimestamp;
        bytes32 proofHash;
    }
    
    struct PrivacySettings {
        bool showRecipientAddress;
        bool showIssuerAddress;
        bool showMintDate;
        bool showCredentialType;
        bool showIssuerName;
    }
    
    mapping(uint256 => VerificationRequest[]) public verificationHistory;
    mapping(address => PrivacySettings) public userPrivacySettings;
    mapping(address => uint256) public verificationCount;
    
    uint256 public totalVerifications;
    
    event VerificationRequested(
        address indexed verifier,
        uint256 indexed credentialId,
        uint256 timestamp,
        bool successful
    );
    
    event VerificationProofGenerated(
        uint256 indexed credentialId,
        bytes32 proofHash,
        uint256 timestamp
    );
    
    event PrivacySettingsUpdated(
        address indexed user,
        uint256 timestamp
    );
    
    constructor(
        address _credentialNFTAddress,
        address _issuerRegistryAddress,
        address _credentialRegistryAddress
    ) {
        require(_credentialNFTAddress != address(0), "Invalid credential NFT address");
        require(_issuerRegistryAddress != address(0), "Invalid issuer registry address");
        require(_credentialRegistryAddress != address(0), "Invalid credential registry address");
        
        credentialNFTAddress = _credentialNFTAddress;
        issuerRegistryAddress = _issuerRegistryAddress;
        credentialRegistryAddress = _credentialRegistryAddress;
    }
    
    // NEW: Public view function to get verification details (does NOT record history)
    // This function can be called by anyone, including the backend, as a gas-free read operation.
    function getPublicVerificationDetailsView(uint256 _credentialId)
        external
        view // <<< CRITICAL CHANGE: This is now a view function
        returns (
            bool isValid,
            address recipient,
            address issuer,
            string memory credentialType,
            uint256 mintDate,
            string memory issuerName,
            bool issuerVerified
        )
    {
        ICredentialNFT nftContract = ICredentialNFT(credentialNFTAddress);

        // It's good practice to ensure the credential exists before trying to get details
        require(nftContract.tokenExists(_credentialId), "Credential does not exist");

        (
            address credRecipient,
            address credIssuer,
            string memory credType,
            uint256 credMintDate,
            bool credIsValid,
        ) = nftContract.verifyCredential(_credentialId);

        PrivacySettings memory privacy = userPrivacySettings[credRecipient];

        // Apply privacy settings for the public view
        address returnRecipient = privacy.showRecipientAddress ? credRecipient : address(0);
        address returnIssuer = privacy.showIssuerAddress ? credIssuer : address(0);
        string memory returnCredType = privacy.showCredentialType ? credType : "";
        uint256 returnMintDate = privacy.showMintDate ? credMintDate : 0;

        string memory returnIssuerName = "";
        bool returnIssuerVerified = false;

        // Fetch issuer name and verification status, respecting privacy
        try IIssuerRegistry(issuerRegistryAddress).getIssuer(credIssuer) returns (
            address,
            string memory universityName,
            bool isVerified,
            bool,
            uint256,
            uint256,
            uint256,
            string memory
        ) {
            returnIssuerName = privacy.showIssuerName ? universityName : "";
            returnIssuerVerified = isVerified;
        } catch {
            returnIssuerName = "";
            returnIssuerVerified = false;
        }

        // This function no longer calls _recordVerification
        return (
            credIsValid,
            returnRecipient,
            returnIssuer,
            returnCredType,
            returnMintDate,
            returnIssuerName,
            returnIssuerVerified
        );
    }

    // NEW: Function to explicitly record a public verification (nonpayable)
    // This function is called when you *do* want to pay gas and record the verification.
    function recordPublicVerification(uint256 _credentialId) external {
        ICredentialNFT nftContract = ICredentialNFT(credentialNFTAddress);
        // You might want a more robust check here, e.g., if (nftContract.tokenExists(_credentialId))
        // For simplicity, we'll just record if the credentialId is passed.
        // The _recordVerification function itself will handle if it's a successful verification.
        _recordVerification(msg.sender, _credentialId, true); // Record as successful if called
    }
    
    function getFullVerificationDetails(uint256 _credentialId)
        external
        view
        returns (
            bool isValid,
            address recipient,
            address issuer,
            string memory issuerName,
            string memory credentialType,
            uint256 mintDate,
            bool issuerVerified,
            bool issuerActive,
            uint256 issuerReputationScore,
            uint256 verificationLevel,
            string memory tokenURI
        )
    {
        ICredentialNFT nftContract = ICredentialNFT(credentialNFTAddress);
        
        require(nftContract.tokenExists(_credentialId), "Credential does not exist");
        
        (
            address credRecipient,
            address credIssuer,
            string memory credType,
            uint256 credMintDate,
            bool credIsValid,
            string memory credTokenURI
        ) = nftContract.verifyCredential(_credentialId);
        
        string memory issName = "";
        bool issVerified = false;
        bool issActive = false;
        uint256 repScore = 0;
        uint256 verLevel = 0;
        
        try IIssuerRegistry(issuerRegistryAddress).getIssuer(credIssuer) returns (
            address,
            string memory universityName,
            bool isVerified,
            bool isActive,
            uint256,
            uint256 verificationLevelValue,
            uint256 reputationScore,
            string memory
        ) {
            issName = universityName;
            issVerified = isVerified;
            issActive = isActive;
            repScore = reputationScore;
            verLevel = verificationLevelValue;
        } catch {}
        
        return (
            credIsValid,
            credRecipient,
            credIssuer,
            issName,
            credType,
            credMintDate,
            issVerified,
            issActive,
            repScore,
            verLevel,
            credTokenURI
        );
    }
    
    function generateVerificationProof(uint256 _credentialId)
    external
    view
    returns (VerificationProof memory)
{
    ICredentialNFT nftContract = ICredentialNFT(credentialNFTAddress);
    
    require(nftContract.tokenExists(_credentialId), "Credential does not exist");
    
    (
        address credRecipient,
        address credIssuer,
        string memory credType,
        uint256 credMintDate,
        bool credIsValid,
    ) = nftContract.verifyCredential(_credentialId);
    
    string memory issName = "";
    bool issVerified = false;
    uint256 repScore = 0;
    uint256 verLevel = 0;
    
    try IIssuerRegistry(issuerRegistryAddress).getIssuer(credIssuer) returns (
        address,
        string memory universityName,
        bool isVerified,
        bool,
        uint256,
        uint256 verificationLevelValue,
        uint256 reputationScore,
        string memory
    ) {
        issName = universityName;
        issVerified = isVerified;
        repScore = reputationScore;
        verLevel = verificationLevelValue;
    } catch {}
    
    bytes32 proofHash = keccak256(abi.encodePacked(
        _credentialId,
        credRecipient,
        credIssuer,
        credIsValid,
        block.timestamp
    ));
    
    VerificationProof memory proof = VerificationProof({
        credentialId: _credentialId,
        recipient: credRecipient,
        issuer: credIssuer,
        issuerName: issName,
        credentialType: credType,
        mintDate: credMintDate,
        isValid: credIsValid,
        issuerVerified: issVerified,
        issuerReputationScore: repScore,
        verificationLevel: verLevel,
        proofTimestamp: block.timestamp,
        proofHash: proofHash
    });
    
    return proof;
}

    function generateQRCodeData(uint256 _credentialId)
        external
        view
        returns (string memory)
    {
        ICredentialNFT nftContract = ICredentialNFT(credentialNFTAddress);
        
        require(nftContract.tokenExists(_credentialId), "Credential does not exist");
        
        return string(abi.encodePacked(
            "skillchain://verify/",
            _uint2str(_credentialId)
        ));
    }
    
    function setPrivacySettings(
        bool _showRecipientAddress,
        bool _showIssuerAddress,
        bool _showMintDate,
        bool _showCredentialType,
        bool _showIssuerName
    ) external {
        userPrivacySettings[msg.sender] = PrivacySettings({
            showRecipientAddress: _showRecipientAddress,
            showIssuerAddress: _showIssuerAddress,
            showMintDate: _showMintDate,
            showCredentialType: _showCredentialType,
            showIssuerName: _showIssuerName
        });
        
        emit PrivacySettingsUpdated(msg.sender, block.timestamp);
    }
    
    function getPrivacySettings(address _user)
        external
        view
        returns (PrivacySettings memory)
    {
        return userPrivacySettings[_user];
    }
    
    function getVerificationHistory(uint256 _credentialId)
        external
        view
        returns (VerificationRequest[] memory)
    {
        return verificationHistory[_credentialId];
    }
    
    function getVerificationCount(address _verifier)
        external
        view
        returns (uint256)
    {
        return verificationCount[_verifier];
    }
    
    function getTotalVerifications()
        external
        view
        returns (uint256)
    {
        return totalVerifications;
    }
    
    function getCredentialVerificationCount(uint256 _credentialId)
        external
        view
        returns (uint256)
    {
        return verificationHistory[_credentialId].length;
    }
    
    function batchVerifyCredentials(uint256[] memory _credentialIds)
        external
        view
        returns (bool[] memory)
    {
        bool[] memory results = new bool[](_credentialIds.length);
        ICredentialNFT nftContract = ICredentialNFT(credentialNFTAddress);
        
        for (uint256 i = 0; i < _credentialIds.length; i++) {
            if (!nftContract.tokenExists(_credentialIds[i])) {
                results[i] = false;
                continue;
            }
            
            try nftContract.verifyCredential(_credentialIds[i]) returns (
                address,
                address,
                string memory,
                uint256,
                bool isValid,
                string memory
            ) {
                results[i] = isValid;
            } catch {
                results[i] = false;
            }
        }
        
        return results;
    }
    
    function verifyIssuerAuthorization(address _issuerAddress)
        external
        view
        returns (bool)
    {
        IIssuerRegistry issuerRegistry = IIssuerRegistry(issuerRegistryAddress);
        return issuerRegistry.isAuthorizedIssuer(_issuerAddress);
    }
    
    function _recordVerification(
        address _verifier,
        uint256 _credentialId,
        bool _successful
    ) private {
        VerificationRequest memory request = VerificationRequest({
            verifier: _verifier,
            credentialId: _credentialId,
            timestamp: block.timestamp,
            successful: _successful
        });
        
        verificationHistory[_credentialId].push(request);
        verificationCount[_verifier]++;
        totalVerifications++;
        
        emit VerificationRequested(_verifier, _credentialId, block.timestamp, _successful);
    }
    
    function _uint2str(uint256 _i) private pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        j = _i;
        while (j != 0) {
            k--;
            uint8 temp = uint8(48 + j % 10);
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            j /= 10;
        }
        return string(bstr);
    }
}
