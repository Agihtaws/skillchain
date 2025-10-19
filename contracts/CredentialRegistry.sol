// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IIssuerRegistry {
    function isAuthorizedIssuer(address _issuerAddress) external view returns (bool);
}

contract CredentialRegistry {
    
    struct Credential {
        uint256 credentialId;
        string degreeName;
        uint256 issueDate;
        address recipient;
        address issuer;
        bool isRevoked;
        string metadataURI;
    }
    
    uint256 private credentialCounter;
    address public issuerRegistryAddress; // Added to store the IssuerRegistry address
    
    mapping(uint256 => Credential) public credentials;
    mapping(address => uint256[]) public recipientCredentials;
    mapping(address => uint256[]) public issuerCredentials;
    mapping(uint256 => bool) public credentialExists;
    
    event CredentialIssued(
        uint256 indexed credentialId,
        address indexed recipient,
        address indexed issuer,
        string degreeName,
        uint256 issueDate,
        string metadataURI
    );
    
    event CredentialRevoked(
        uint256 indexed credentialId,
        address indexed issuer,
        uint256 revokedDate
    );
    
    modifier onlyIssuer(uint256 _credentialId) {
        require(credentialExists[_credentialId], "Credential does not exist");
        require(credentials[_credentialId].issuer == msg.sender, "Only issuer can perform this action");
        _;
    }
    
    modifier credentialNotRevoked(uint256 _credentialId) {
        require(!credentials[_credentialId].isRevoked, "Credential is already revoked");
        _;
    }

    // New modifier to check if the caller is an authorized issuer
    modifier onlyAuthorizedIssuer() {
        require(IIssuerRegistry(issuerRegistryAddress).isAuthorizedIssuer(msg.sender), "Caller is not an authorized issuer");
        _;
    }

    // Constructor to set the IssuerRegistry address
    constructor(address _issuerRegistryAddress) {
        require(_issuerRegistryAddress != address(0), "Invalid issuer registry address");
        issuerRegistryAddress = _issuerRegistryAddress;
    }
    
    function issueCredential(
        address _recipient,
        string memory _degreeName,
        string memory _metadataURI
    ) external onlyAuthorizedIssuer returns (uint256) { // Applied the new modifier
        require(_recipient != address(0), "Invalid recipient address");
        require(bytes(_degreeName).length > 0, "Degree name cannot be empty");
        require(bytes(_metadataURI).length > 0, "Metadata URI cannot be empty");
        
        credentialCounter++;
        uint256 newCredentialId = credentialCounter;
        
        Credential memory newCredential = Credential({
            credentialId: newCredentialId,
            degreeName: _degreeName,
            issueDate: block.timestamp,
            recipient: _recipient,
            issuer: msg.sender,
            isRevoked: false,
            metadataURI: _metadataURI
        });
        
        credentials[newCredentialId] = newCredential;
        credentialExists[newCredentialId] = true;
        recipientCredentials[_recipient].push(newCredentialId);
        issuerCredentials[msg.sender].push(newCredentialId);
        
        emit CredentialIssued(
            newCredentialId,
            _recipient,
            msg.sender,
            _degreeName,
            block.timestamp,
            _metadataURI
        );
        
        return newCredentialId;
    }
    
    function revokeCredential(uint256 _credentialId) 
        external 
        onlyIssuer(_credentialId) 
        credentialNotRevoked(_credentialId) 
    {
        credentials[_credentialId].isRevoked = true;
        
        emit CredentialRevoked(
            _credentialId,
            msg.sender,
            block.timestamp
        );
    }
    
    function getCredential(uint256 _credentialId) 
        external 
        view 
        returns (
            uint256 credentialId,
            string memory degreeName,
            uint256 issueDate,
            address recipient,
            address issuer,
            bool isRevoked,
            string memory metadataURI
        ) 
    {
        require(credentialExists[_credentialId], "Credential does not exist");
        
        Credential memory cred = credentials[_credentialId];
        
        return (
            cred.credentialId,
            cred.degreeName,
            cred.issueDate,
            cred.recipient,
            cred.issuer,
            cred.isRevoked,
            cred.metadataURI
        );
    }
    
    function getRecipientCredentials(address _recipient) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return recipientCredentials[_recipient];
    }
    
    function getIssuerCredentials(address _issuer) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return issuerCredentials[_issuer];
    }
    
    function getTotalCredentials() external view returns (uint256) {
        return credentialCounter;
    }
    
    function isCredentialValid(uint256 _credentialId) 
        external 
        view 
        returns (bool) 
    {
        if (!credentialExists[_credentialId]) {
            return false;
        }
        return !credentials[_credentialId].isRevoked;
    }
}
