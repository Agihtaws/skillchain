const { ethers } = require('ethers');
const { provider, issuerRegistryContract, credentialNFTContract, credentialRegistryContract } = require('../config/blockchain');
const ipfsService = require('./ipfsService');

// --- Authorization Check ---
async function checkIssuerAuthorization(issuerAddress) {
    if (!ethers.isAddress(issuerAddress)) {
        throw new Error("Invalid issuer address format for authorization check.");
    }
    return issuerRegistryContract.isAuthorizedIssuer(issuerAddress);
}

// --- CredentialNFT Functions (Backend for IPFS, Frontend for Transaction) ---

async function prepareMintCredentialNFT(issuerAddress, recipientAddress, credentialType, credentialFiles) {
    if (!ethers.isAddress(recipientAddress)) {
        throw new Error("Invalid recipient address.");
    }
    if (!credentialType || credentialType.trim() === '') {
        throw new Error("Credential type cannot be empty.");
    }
    if (!credentialFiles || credentialFiles.length === 0) {
        throw new Error("At least one credential file (image/document) is required for metadata.");
    }

    const ipfsHashes = await Promise.all(
        credentialFiles.map(file => ipfsService.uploadFileToIPFS(file.buffer, file.originalname))
    );

    const metadata = {
        recipient: recipientAddress, // This can be included in metadata for off-chain context
        issuer: issuerAddress,     // This can be included in metadata for off-chain context
        credentialType: credentialType,
        files: ipfsHashes, // Array of IPFS hashes for uploaded files
        mintDate: new Date().toISOString()
    };

    const tokenURI = await ipfsService.uploadJsonToIPFS(metadata, `NFTCredentialMetadata-${credentialType}-${Date.now()}.json`);

    // The backend's role is to prepare the IPFS URI. The frontend will then call mintCredential.
    return { tokenURI };
}

async function prepareBatchMintCredentialNFTs(issuerAddress, recipients, credentialTypes, credentialFilesBatches) {
    if (!recipients || recipients.length === 0) {
        throw new Error("Recipients array cannot be empty.");
    }
    if (recipients.length !== credentialTypes.length) {
        throw new Error("Recipients and credential types arrays must have the same length.");
    }
    // credentialFilesBatches is expected to be an array of arrays of files, matching recipients.
    if (credentialFilesBatches.length !== recipients.length) {
        throw new Error("Credential files batches array must match recipients array length.");
    }

    const tokenURIs = await Promise.all(
        recipients.map(async (recipient, index) => {
            const files = credentialFilesBatches[index];
            const type = credentialTypes[index];

            const ipfsHashes = files && files.length > 0
                ? await Promise.all(files.map(file => ipfsService.uploadFileToIPFS(file.buffer, file.originalname)))
                : [];

            const metadata = {
                recipient: recipient,
                issuer: issuerAddress,
                credentialType: type,
                files: ipfsHashes,
                mintDate: new Date().toISOString()
            };
            return ipfsService.uploadJsonToIPFS(metadata, `NFTCredentialMetadata-${type}-${Date.now()}-${index}.json`);
        })
    );

    return { tokenURIs };
}


// Revoke functions now only receive the issuerAddress (for auth check on frontend) and tokenId.
// The frontend will perform the actual on-chain revoke call using its connected wallet.
async function prepareRevokeCredentialNFT(issuerAddress, tokenId) {
    // No backend processing needed beyond validation if desired
    if (tokenId === undefined || tokenId === null) {
        throw new Error("Token ID is required for revocation.");
    }
    // Frontend will call credentialNFTContract.revokeCredential(tokenId)
    return { success: true, message: "Ready for frontend revocation." };
}


async function getIssuerNFTCredentials(issuerAddress) {
    if (!ethers.isAddress(issuerAddress)) {
        throw new Error("Invalid issuer address format.");
    }
    return credentialNFTContract.getIssuerCredentials(issuerAddress);
}

async function getNFTCredentialDetails(tokenId) {
    if (tokenId === undefined || tokenId === null) {
        throw new Error("Token ID is required to get details.");
    }
    const metadata = await credentialNFTContract.getCredentialMetadata(tokenId);
    const tokenURI = await credentialNFTContract.tokenURI(tokenId);
    return {
        tokenId: metadata[0].toString(), // Convert BigInt to string
        recipient: metadata[1],
        issuer: metadata[2],
        mintDate: metadata[3].toString(), // Convert BigInt to string
        credentialType: metadata[4],
        isValid: metadata[5],
        tokenURI: tokenURI
    };
}

// --- CredentialRegistry Functions (Backend for IPFS, Frontend for Transaction) ---

async function prepareIssueGeneralCredential(issuerAddress, recipientAddress, degreeName, credentialFiles) {
    if (!ethers.isAddress(recipientAddress)) {
        throw new Error("Invalid recipient address.");
    }
    if (!degreeName || degreeName.trim() === '') {
        throw new Error("Degree name cannot be empty.");
    }
    if (!credentialFiles || credentialFiles.length === 0) {
        throw new Error("At least one credential file (image/document) is required for metadata.");
    }

    const ipfsHashes = await Promise.all(
        credentialFiles.map(file => ipfsService.uploadFileToIPFS(file.buffer, file.originalname))
    );

    const metadata = {
        recipient: recipientAddress,
        issuer: issuerAddress,
        degreeName: degreeName,
        files: ipfsHashes,
        issueDate: new Date().toISOString()
    };

    const metadataURI = await ipfsService.uploadJsonToIPFS(metadata, `GeneralCredentialMetadata-${degreeName}-${Date.now()}.json`);

    // The backend's role is to prepare the IPFS URI. The frontend will then call issueCredential.
    return { metadataURI };
}

async function prepareRevokeGeneralCredential(issuerAddress, credentialId) {
    // No backend processing needed beyond validation if desired
    if (credentialId === undefined || credentialId === null) {
        throw new Error("Credential ID is required for revocation.");
    }
    // Frontend will call credentialRegistryContract.revokeCredential(credentialId)
    return { success: true, message: "Ready for frontend revocation." };
}

async function getIssuerGeneralCredentials(issuerAddress) {
    if (!ethers.isAddress(issuerAddress)) {
        throw new Error("Invalid issuer address format.");
    }
    return credentialRegistryContract.getIssuerCredentials(issuerAddress);
}

async function getGeneralCredentialDetails(credentialId) {
    if (credentialId === undefined || credentialId === null) {
        throw new Error("Credential ID is required to get details.");
    }
    const credential = await credentialRegistryContract.getCredential(credentialId);
    return {
        credentialId: credential[0].toString(), // Convert BigInt to string
        degreeName: credential[1],
        issueDate: credential[2].toString(), // Convert BigInt to string
        recipient: credential[3],
        issuer: credential[4],
        isRevoked: credential[5],
        metadataURI: credential[6]
    };
}

module.exports = {
    checkIssuerAuthorization,
    prepareMintCredentialNFT,
    prepareBatchMintCredentialNFTs,
    prepareRevokeCredentialNFT,
    getIssuerNFTCredentials,
    getNFTCredentialDetails,
    prepareIssueGeneralCredential,
    prepareRevokeGeneralCredential,
    getIssuerGeneralCredentials,
    getGeneralCredentialDetails
};
