// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

interface IIssuerRegistry {
    function isAuthorizedIssuer(address _issuerAddress) external view returns (bool);
}

contract CredentialNFT is ERC721, ERC721URIStorage {
    
    uint256 private tokenIdCounter;
    address public issuerRegistryAddress;
    
    struct CredentialMetadata {
        uint256 tokenId;
        address recipient;
        address issuer;
        uint256 mintDate;
        string credentialType;
        bool isValid;
    }
    
    mapping(uint256 => CredentialMetadata) public credentialMetadata;
    mapping(address => uint256[]) public recipientTokens;
    mapping(address => uint256[]) public issuerTokens;
    mapping(uint256 => bool) public tokenExists;
    
    event CredentialMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        address indexed issuer,
        string credentialType,
        string tokenURI,
        uint256 mintDate
    );
    
    event BatchCredentialsMinted(
        address indexed issuer,
        uint256[] tokenIds,
        address[] recipients,
        uint256 mintDate
    );
    
    event CredentialRevoked(
        uint256 indexed tokenId,
        uint256 revokedDate
    );
    
    modifier onlyIssuer(uint256 _tokenId) {
        require(tokenExists[_tokenId], "Token does not exist");
        require(credentialMetadata[_tokenId].issuer == msg.sender, "Only issuer can perform this action");
        _;
    }

    modifier onlyAuthorizedIssuer() {
        require(IIssuerRegistry(issuerRegistryAddress).isAuthorizedIssuer(msg.sender), "Caller is not an authorized issuer");
        _;
    }
    
    constructor(address _issuerRegistryAddress) ERC721("SkillChain Credential", "SKILL") {
        require(_issuerRegistryAddress != address(0), "Invalid issuer registry address");
        issuerRegistryAddress = _issuerRegistryAddress;
    }
    
    function mintCredential(
        address _recipient,
        string memory _credentialType,
        string memory _tokenURI
    ) external onlyAuthorizedIssuer returns (uint256) {
        require(_recipient != address(0), "Invalid recipient address");
        require(bytes(_credentialType).length > 0, "Credential type cannot be empty");
        require(bytes(_tokenURI).length > 0, "Token URI cannot be empty");
        
        tokenIdCounter++;
        uint256 newTokenId = tokenIdCounter;
        
        _safeMint(_recipient, newTokenId);
        _setTokenURI(newTokenId, _tokenURI);
        
        CredentialMetadata memory metadata = CredentialMetadata({
            tokenId: newTokenId,
            recipient: _recipient,
            issuer: msg.sender,
            mintDate: block.timestamp,
            credentialType: _credentialType,
            isValid: true
        });
        
        credentialMetadata[newTokenId] = metadata;
        tokenExists[newTokenId] = true;
        recipientTokens[_recipient].push(newTokenId);
        issuerTokens[msg.sender].push(newTokenId);
        
        emit CredentialMinted(
            newTokenId,
            _recipient,
            msg.sender,
            _credentialType,
            _tokenURI,
            block.timestamp
        );
        
        return newTokenId;
    }
    
    function batchMintCredentials(
        address[] memory _recipients,
        string[] memory _credentialTypes,
        string[] memory _tokenURIs
    ) external onlyAuthorizedIssuer returns (uint256[] memory) {
        require(_recipients.length > 0, "Recipients array cannot be empty");
        require(_recipients.length == _credentialTypes.length, "Arrays length mismatch");
        require(_recipients.length == _tokenURIs.length, "Arrays length mismatch");
        
        uint256[] memory tokenIds = new uint256[](_recipients.length);
        
        for (uint256 i = 0; i < _recipients.length; i++) {
            require(_recipients[i] != address(0), "Invalid recipient address");
            require(bytes(_credentialTypes[i]).length > 0, "Credential type cannot be empty");
            require(bytes(_tokenURIs[i]).length > 0, "Token URI cannot be empty");
            
            tokenIdCounter++;
            uint256 newTokenId = tokenIdCounter;
            
            _safeMint(_recipients[i], newTokenId);
            _setTokenURI(newTokenId, _tokenURIs[i]);
            
            CredentialMetadata memory metadata = CredentialMetadata({
                tokenId: newTokenId,
                recipient: _recipients[i],
                issuer: msg.sender,
                mintDate: block.timestamp,
                credentialType: _credentialTypes[i],
                isValid: true
            });
            
            credentialMetadata[newTokenId] = metadata;
            tokenExists[newTokenId] = true;
            recipientTokens[_recipients[i]].push(newTokenId);
            issuerTokens[msg.sender].push(newTokenId);
            
            tokenIds[i] = newTokenId;
            
            emit CredentialMinted(
                newTokenId,
                _recipients[i],
                msg.sender,
                _credentialTypes[i],
                _tokenURIs[i],
                block.timestamp
            );
        }
        
        emit BatchCredentialsMinted(
            msg.sender,
            tokenIds,
            _recipients,
            block.timestamp
        );
        
        return tokenIds;
    }
    
    function revokeCredential(uint256 _tokenId) 
        external 
        onlyIssuer(_tokenId) 
    {
        require(credentialMetadata[_tokenId].isValid, "Credential is already revoked");
        
        credentialMetadata[_tokenId].isValid = false;
        
        emit CredentialRevoked(_tokenId, block.timestamp);
    }
    
    function transferFrom(
        address,
        address,
        uint256
    ) public pure override(ERC721, IERC721) {
        revert("Credentials are non-transferable (soulbound)");
    }
    
    function safeTransferFrom(
        address,
        address,
        uint256,
        bytes memory
    ) public pure override(ERC721, IERC721) {
        revert("Credentials are non-transferable (soulbound)");
    }
    
    function safeTransferFrom(
        address,
        address,
        uint256
    ) public pure override(ERC721, IERC721) {
        revert("Credentials are non-transferable (soulbound)");
    }
    
    function approve(address, uint256) public pure override(ERC721, IERC721) {
        revert("Credentials are non-transferable (soulbound)");
    }
    
    function setApprovalForAll(address, bool) public pure override(ERC721, IERC721) {
        revert("Credentials are non-transferable (soulbound)");
    }
    
    function getApproved(uint256) public pure override(ERC721, IERC721) returns (address) {
        return address(0);
    }
    
    function isApprovedForAll(address, address) public pure override(ERC721, IERC721) returns (bool) {
        return false;
    }
    
    function verifyCredential(uint256 _tokenId) 
        external 
        view 
        returns (
            address recipient,
            address issuer,
            string memory credentialType,
            uint256 mintDate,
            bool isValid,
            string memory credentialTokenURI
        ) 
    {
        require(tokenExists[_tokenId], "Token does not exist");
        
        CredentialMetadata memory metadata = credentialMetadata[_tokenId];
        
        return (
            metadata.recipient,
            metadata.issuer,
            metadata.credentialType,
            metadata.mintDate,
            metadata.isValid,
            tokenURI(_tokenId)
        );
    }
    
    function getRecipientCredentials(address _recipient) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return recipientTokens[_recipient];
    }
    
    function getIssuerCredentials(address _issuer) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return issuerTokens[_issuer];
    }
    
    function getTotalCredentials() external view returns (uint256) {
        return tokenIdCounter;
    }
    
    function isCredentialValid(uint256 _tokenId) 
        external 
        view 
        returns (bool) 
    {
        if (!tokenExists[_tokenId]) {
            return false;
        }
        return credentialMetadata[_tokenId].isValid;
    }
    
    function getCredentialMetadata(uint256 _tokenId) 
        external 
        view 
        returns (
            uint256 tokenId,
            address recipient,
            address issuer,
            uint256 mintDate,
            string memory credentialType,
            bool isValid
        ) 
    {
        require(tokenExists[_tokenId], "Token does not exist");
        
        CredentialMetadata memory metadata = credentialMetadata[_tokenId];
        
        return (
            metadata.tokenId,
            metadata.recipient,
            metadata.issuer,
            metadata.mintDate,
            metadata.credentialType,
            metadata.isValid
        );
    }
    
    function tokenURI(uint256 _tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(_tokenId);
    }
    
    function _burn(uint256 _tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(_tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
