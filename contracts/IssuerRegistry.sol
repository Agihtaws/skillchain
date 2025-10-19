// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract IssuerRegistry {
    
    struct Issuer {
        address issuerAddress;
        string universityName;
        bool isVerified;
        bool isActive;
        uint256 registrationDate;
        uint256 verificationLevel;
        uint256 reputationScore;
        string metadataURI;
    }
    
    address public admin;
    uint256 public totalIssuers; // This will now represent truly unique active/registered issuers
    
    mapping(address => Issuer) public issuers;
    // Removed isRegistered mapping as it becomes redundant with the new logic
    address[] public uniqueIssuerAddresses; // This array will hold only unique addresses that are currently 'registered'
    // Added a helper mapping to quickly find the index of an address in uniqueIssuerAddresses
    mapping(address => uint256) private _indexOfUniqueIssuerAddress;
    mapping(address => bool) private _isCurrentlyInUniqueList; // To track if an address is in uniqueIssuerAddresses

    event IssuerRegistered(
        address indexed issuerAddress,
        string universityName,
        uint256 registrationDate,
        string metadataURI
    );
    
    event IssuerVerified(
        address indexed issuerAddress,
        uint256 verificationLevel,
        uint256 verifiedDate
    );
    
    event IssuerRemoved(
        address indexed issuerAddress,
        uint256 removedDate
    );
    
    event IssuerDeactivated(
        address indexed issuerAddress,
        uint256 deactivatedDate
    );
    
    event IssuerReactivated(
        address indexed issuerAddress,
        uint256 reactivatedDate
    );
    
    event ReputationScoreUpdated(
        address indexed issuerAddress,
        uint256 oldScore,
        uint256 newScore,
        uint256 updatedDate
    );
    
    event VerificationLevelUpdated(
        address indexed issuerAddress,
        uint256 oldLevel,
        uint256 newLevel,
        uint256 updatedDate
    );
    
    event AdminTransferred(
        address indexed previousAdmin,
        address indexed newAdmin,
        uint256 transferDate
    );
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    // Updated modifier to check if issuer has a record (even if inactive)
    modifier issuerHasRecord(address _issuerAddress) {
        require(issuers[_issuerAddress].issuerAddress != address(0), "Issuer not found or never registered");
        _;
    }
    
    // New modifier to check if issuer is currently in the unique list
    modifier issuerIsInUniqueList(address _issuerAddress) {
        require(_isCurrentlyInUniqueList[_issuerAddress], "Issuer is not in the unique registered list");
        _;
    }

    constructor() {
        admin = msg.sender;
    }
    
    function registerIssuer(
        address _issuerAddress,
        string memory _universityName,
        string memory _metadataURI
    ) external onlyAdmin {
        require(_issuerAddress != address(0), "Invalid issuer address");
        require(bytes(_universityName).length > 0, "University name cannot be empty");
        require(bytes(_metadataURI).length > 0, "Metadata URI cannot be empty");
        
        if (issuers[_issuerAddress].issuerAddress != address(0)) {
            // Issuer has been registered before (might be removed or deactivated)
            // Update its details and reactivate
            issuers[_issuerAddress].universityName = _universityName;
            issuers[_issuerAddress].metadataURI = _metadataURI;
            issuers[_issuerAddress].isActive = true;
            issuers[_issuerAddress].isVerified = false; // Reset verification on re-registration
            issuers[_issuerAddress].registrationDate = block.timestamp; // Update registration date
            issuers[_issuerAddress].verificationLevel = 0; // Reset level
            issuers[_issuerAddress].reputationScore = 0; // Reset score

            // If it's not currently in the unique list, add it back
            if (!_isCurrentlyInUniqueList[_issuerAddress]) {
                uniqueIssuerAddresses.push(_issuerAddress);
                _indexOfUniqueIssuerAddress[_issuerAddress] = uniqueIssuerAddresses.length - 1;
                _isCurrentlyInUniqueList[_issuerAddress] = true;
                totalIssuers++; // Increment only if it was truly added back to the unique list
            }
            emit IssuerReactivated(_issuerAddress, block.timestamp);
        } else {
            // Truly a new issuer
            Issuer memory newIssuer = Issuer({
                issuerAddress: _issuerAddress,
                universityName: _universityName,
                isVerified: false,
                isActive: true,
                registrationDate: block.timestamp,
                verificationLevel: 0,
                reputationScore: 0,
                metadataURI: _metadataURI
            });
            
            issuers[_issuerAddress] = newIssuer;
            uniqueIssuerAddresses.push(_issuerAddress);
            _indexOfUniqueIssuerAddress[_issuerAddress] = uniqueIssuerAddresses.length - 1;
            _isCurrentlyInUniqueList[_issuerAddress] = true;
            totalIssuers++;
            
            emit IssuerRegistered(
                _issuerAddress,
                _universityName,
                block.timestamp,
                _metadataURI
            );
        }
    }
    
    function verifyIssuer(
        address _issuerAddress,
        uint256 _verificationLevel
    ) external onlyAdmin issuerHasRecord(_issuerAddress) { // Changed modifier
        require(_verificationLevel > 0 && _verificationLevel <= 5, "Verification level must be between 1 and 5");
        require(!issuers[_issuerAddress].isVerified, "Issuer is already verified");
        
        issuers[_issuerAddress].isVerified = true;
        issuers[_issuerAddress].verificationLevel = _verificationLevel;
        
        emit IssuerVerified(
            _issuerAddress,
            _verificationLevel,
            block.timestamp
        );
    }
    
    function removeIssuer(address _issuerAddress) 
        external 
        onlyAdmin 
        issuerHasRecord(_issuerAddress) // Changed modifier
        issuerIsInUniqueList(_issuerAddress) // Ensure it's in the unique list to remove
    {
        // Mark as inactive, unverified
        issuers[_issuerAddress].isActive = false;
        issuers[_issuerAddress].isVerified = false;
        
        // Remove from the uniqueIssuerAddresses array efficiently
        uint256 index = _indexOfUniqueIssuerAddress[_issuerAddress];
        uint256 lastIndex = uniqueIssuerAddresses.length - 1;

        if (index != lastIndex) {
            address lastIssuer = uniqueIssuerAddresses[lastIndex];
            uniqueIssuerAddresses[index] = lastIssuer;
            _indexOfUniqueIssuerAddress[lastIssuer] = index;
        }
        uniqueIssuerAddresses.pop();
        delete _indexOfUniqueIssuerAddress[_issuerAddress]; // Clear index
        _isCurrentlyInUniqueList[_issuerAddress] = false; // Mark as removed from the list
        totalIssuers--; // Decrement total unique issuers
        
        emit IssuerRemoved(_issuerAddress, block.timestamp);
    }
    
    function deactivateIssuer(address _issuerAddress) 
        external 
        onlyAdmin 
        issuerHasRecord(_issuerAddress) // Changed modifier
    {
        require(issuers[_issuerAddress].isActive, "Issuer is already deactivated");
        
        issuers[_issuerAddress].isActive = false;
        
        emit IssuerDeactivated(_issuerAddress, block.timestamp);
    }
    
    function reactivateIssuer(address _issuerAddress) 
        external 
        onlyAdmin 
        issuerHasRecord(_issuerAddress) // Changed modifier
    {
        require(!issuers[_issuerAddress].isActive, "Issuer is already active");
        
        issuers[_issuerAddress].isActive = true;

        // If reactivating and not in unique list, add it back
        if (!_isCurrentlyInUniqueList[_issuerAddress]) {
            uniqueIssuerAddresses.push(_issuerAddress);
            _indexOfUniqueIssuerAddress[_issuerAddress] = uniqueIssuerAddresses.length - 1;
            _isCurrentlyInUniqueList[_issuerAddress] = true;
            totalIssuers++;
        }
        
        emit IssuerReactivated(_issuerAddress, block.timestamp);
    }
    
    function updateReputationScore(
        address _issuerAddress,
        uint256 _newScore
    ) external onlyAdmin issuerHasRecord(_issuerAddress) { // Changed modifier
        require(_newScore <= 100, "Reputation score must be between 0 and 100");
        
        uint256 oldScore = issuers[_issuerAddress].reputationScore;
        issuers[_issuerAddress].reputationScore = _newScore;
        
        emit ReputationScoreUpdated(
            _issuerAddress,
            oldScore,
            _newScore,
            block.timestamp
        );
    }
    
    function updateVerificationLevel(
        address _issuerAddress,
        uint256 _newLevel
    ) external onlyAdmin issuerHasRecord(_issuerAddress) { // Changed modifier
        require(_newLevel > 0 && _newLevel <= 5, "Verification level must be between 1 and 5");
        require(issuers[_issuerAddress].isVerified, "Issuer must be verified first");
        
        uint256 oldLevel = issuers[_issuerAddress].verificationLevel;
        issuers[_issuerAddress].verificationLevel = _newLevel;
        
        emit VerificationLevelUpdated(
            _issuerAddress,
            oldLevel,
            _newLevel,
            block.timestamp
        );
    }
    
    function transferAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "Invalid new admin address");
        require(_newAdmin != admin, "New admin is the same as current admin");
        
        address previousAdmin = admin;
        admin = _newAdmin;
        
        emit AdminTransferred(previousAdmin, _newAdmin, block.timestamp);
    }
    
    function getIssuer(address _issuerAddress) 
        external 
        view 
        issuerHasRecord(_issuerAddress) // Changed modifier
        returns (
            address issuerAddress,
            string memory universityName,
            bool isVerified,
            bool isActive,
            uint256 registrationDate,
            uint256 verificationLevel,
            uint256 reputationScore,
            string memory metadataURI
        ) 
    {
        Issuer memory issuer = issuers[_issuerAddress];
        
        return (
            issuer.issuerAddress,
            issuer.universityName,
            issuer.isVerified,
            issuer.isActive,
            issuer.registrationDate,
            issuer.verificationLevel,
            issuer.reputationScore,
            issuer.metadataURI
        );
    }
    
    function isAuthorizedIssuer(address _issuerAddress) 
        external 
        view 
        returns (bool) 
    {
        // Check if the issuer has a record and is currently in the unique list, verified, and active
        return issuers[_issuerAddress].issuerAddress != address(0) && 
               _isCurrentlyInUniqueList[_issuerAddress] && // Important: Check if it's in the unique list
               issuers[_issuerAddress].isVerified && 
               issuers[_issuerAddress].isActive;
    }
    
    // This function now returns only the unique, currently registered issuer addresses
    function getAllIssuers() external view returns (address[] memory) {
        return uniqueIssuerAddresses;
    }
    
    function getActiveIssuers() external view returns (address[] memory) {
        uint256 activeCount = 0;
        
        // Iterate over the uniqueIssuerAddresses array
        for (uint256 i = 0; i < uniqueIssuerAddresses.length; i++) {
            address currentAddress = uniqueIssuerAddresses[i];
            if (issuers[currentAddress].isActive) { // No need to check isRegistered, as it's implicitly true if in uniqueIssuerAddresses
                activeCount++;
            }
        }
        
        address[] memory activeIssuers = new address[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < uniqueIssuerAddresses.length; i++) {
            address currentAddress = uniqueIssuerAddresses[i];
            if (issuers[currentAddress].isActive) {
                activeIssuers[index] = currentAddress;
                index++;
            }
        }
        
        return activeIssuers;
    }
    
    function getVerifiedIssuers() external view returns (address[] memory) {
        uint256 verifiedCount = 0;
        
        // Iterate over the uniqueIssuerAddresses array
        for (uint256 i = 0; i < uniqueIssuerAddresses.length; i++) {
            address currentAddress = uniqueIssuerAddresses[i];
            if (issuers[currentAddress].isVerified) { // No need to check isRegistered
                verifiedCount++;
            }
        }
        
        address[] memory verifiedIssuers = new address[](verifiedCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < uniqueIssuerAddresses.length; i++) {
            address currentAddress = uniqueIssuerAddresses[i];
            if (issuers[currentAddress].isVerified) {
                verifiedIssuers[index] = currentAddress;
                index++;
            }
        }
        
        return verifiedIssuers;
    }
    
    function getIssuerReputationScore(address _issuerAddress) 
        external 
        view 
        issuerHasRecord(_issuerAddress) // Changed modifier
        returns (uint256) 
    {
        return issuers[_issuerAddress].reputationScore;
    }
    
    function getIssuerVerificationLevel(address _issuerAddress) 
        external 
        view 
        issuerHasRecord(_issuerAddress) // Changed modifier
        returns (uint256) 
    {
        return issuers[_issuerAddress].verificationLevel;
    }
}
