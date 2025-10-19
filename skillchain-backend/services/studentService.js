// services/studentService.js
const { ethers } = require('ethers');
const {
    provider,
    issuerRegistryContract,
    credentialNFTContract,
    credentialRegistryContract,
    verificationContract
} = require('../config/blockchain');
const ipfsService = require('./ipfsService');

// Helper to safely convert BigInt to string, handling potential undefined/null
const safeBigIntToString = (value) => {
    if (value !== undefined && value !== null && typeof value === 'bigint') {
        return value.toString();
    }
    return '0';
};

// Helper to safely convert address to string, handling potential undefined/null
const safeAddressToString = (value) => {
    if (value !== undefined && value !== null && typeof value === 'string' && ethers.isAddress(value)) {
        return value;
    }
    return ethers.ZeroAddress;
};

// Helper to safely convert string, handling potential undefined/null
const safeString = (value) => {
    if (value !== undefined && value !== null && typeof value === 'string') {
        return value;
    }
    return '';
};

// --- Credential Fetching for Recipient ---

async function getRecipientNFTCredentials(recipientAddress) {
    if (!ethers.isAddress(recipientAddress)) {
        throw new Error("Invalid recipient address format.");
    }
    const tokenIds = await credentialNFTContract.getRecipientCredentials(recipientAddress);
    const detailedNFTs = await Promise.all(tokenIds.map(async (tokenId) => {
        const metadata = await credentialNFTContract.getCredentialMetadata(tokenId);
        const tokenURI = await credentialNFTContract.tokenURI(tokenId);
        return {
            id: safeBigIntToString(metadata[0]),
            type: 'nft',
            recipient: safeAddressToString(metadata[1]),
            issuer: safeAddressToString(metadata[2]),
            credentialType: safeString(metadata[4]),
            mintDate: safeBigIntToString(metadata[3]),
            isValid: metadata[5],
            tokenURI: safeString(tokenURI),
        };
    }));
    return detailedNFTs;
}

async function getRecipientGeneralCredentials(recipientAddress) {
    if (!ethers.isAddress(recipientAddress)) {
        throw new Error("Invalid recipient address format.");
    }
    const credentialIds = await credentialRegistryContract.getRecipientCredentials(recipientAddress);
    const detailedGeneralCredentials = await Promise.all(credentialIds.map(async (credentialId) => {
        const credential = await credentialRegistryContract.getCredential(credentialId);
        return {
            id: safeBigIntToString(credentialId),
            type: 'general',
            recipient: safeAddressToString(credential[3]),
            issuer: safeAddressToString(credential[4]),
            degreeName: safeString(credential[1]),
            issueDate: safeBigIntToString(credential[2]),
            isRevoked: credential[5],
            metadataURI: safeString(credential[6]),
        };
    }));
    return detailedGeneralCredentials;
}

async function getCombinedRecipientCredentials(recipientAddress) {
    const nftCredentials = await getRecipientNFTCredentials(recipientAddress);
    const generalCredentials = await getRecipientGeneralCredentials(recipientAddress);
    return [...nftCredentials, ...generalCredentials];
}

// --- Credential Details ---

async function getNFTCredentialDetails(tokenId) {
    if (tokenId === undefined || tokenId === null) {
        throw new Error("Token ID is required to get details.");
    }
    const metadata = await credentialNFTContract.getCredentialMetadata(tokenId);
    const tokenURI = await credentialNFTContract.tokenURI(tokenId);
    return {
        tokenId: safeBigIntToString(metadata[0]),
        recipient: safeAddressToString(metadata[1]),
        issuer: safeAddressToString(metadata[2]),
        mintDate: safeBigIntToString(metadata[3]),
        credentialType: safeString(metadata[4]),
        isValid: metadata[5],
        tokenURI: safeString(tokenURI)
    };
}

async function getGeneralCredentialDetails(credentialId) {
    if (credentialId === undefined || credentialId === null) {
        throw new Error("Credential ID is required to get details.");
    }
    const credential = await credentialRegistryContract.getCredential(credentialId);
    return {
        credentialId: safeBigIntToString(credential[0]),
        degreeName: safeString(credential[1]),
        issueDate: safeBigIntToString(credential[2]),
        recipient: safeAddressToString(credential[3]),
        issuer: safeAddressToString(credential[4]),
        isRevoked: credential[5],
        metadataURI: safeString(credential[6])
    };
}

// --- VerificationContract Functions ---

async function getPublicVerificationDetails(credentialId) {
    if (credentialId === undefined || credentialId === null) {
        throw new Error("Credential ID is required for public verification.");
    }
    const details = await verificationContract.getPublicVerificationDetailsView(BigInt(credentialId));

    return {
        isValid: details[0],
        recipient: safeAddressToString(details[1]),
        issuer: safeAddressToString(details[2]),
        credentialType: safeString(details[3]),
        mintDate: safeBigIntToString(details[4]),
        issuerName: safeString(details[5]),
        issuerVerified: details[6],
    };
}

async function getFullVerificationDetails(credentialId) {
    if (credentialId === undefined || credentialId === null) {
        throw new Error("Credential ID is required for full verification.");
    }
    const details = await verificationContract.getFullVerificationDetails(BigInt(credentialId));
    return {
        isValid: details[0],
        recipient: safeAddressToString(details[1]),
        issuer: safeAddressToString(details[2]),
        issuerName: safeString(details[3]),
        credentialType: safeString(details[4]),
        mintDate: safeBigIntToString(details[5]),
        issuerVerified: details[6],
        issuerActive: details[7],
        issuerReputationScore: safeBigIntToString(details[8]),
        verificationLevel: safeBigIntToString(details[9]),
        tokenURI: safeString(details[10]),
    };
}

async function generateVerificationProof(credentialId) {
    if (credentialId === undefined || credentialId === null) {
        throw new Error("Credential ID is required to generate proof.");
    }
    const proof = await verificationContract.generateVerificationProof(BigInt(credentialId));

    return {
        credentialId: safeBigIntToString(proof[0]),
        recipient: safeAddressToString(proof[1]),
        issuer: safeAddressToString(proof[2]),
        issuerName: safeString(proof[3]),
        credentialType: safeString(proof[4]),
        mintDate: safeBigIntToString(proof[5]),
        isValid: proof[6],
        issuerVerified: proof[7],
        issuerReputationScore: safeBigIntToString(proof[8]),
        verificationLevel: safeBigIntToString(proof[9]),
        proofTimestamp: safeBigIntToString(proof[10]),
        proofHash: safeString(proof[11]),
    };
}

async function generateQRCodeData(credentialId) {
    if (credentialId === undefined || credentialId === null) {
        throw new Error("Credential ID is required to generate QR code data.");
    }
    return verificationContract.generateQRCodeData(BigInt(credentialId));
}

async function getPrivacySettings(userAddress) {
    if (!ethers.isAddress(userAddress)) {
        throw new Error("Invalid user address format.");
    }
    const settings = await verificationContract.getPrivacySettings(userAddress);
    return {
        showRecipientAddress: settings[0],
        showIssuerAddress: settings[1],
        showMintDate: settings[2],
        showCredentialType: settings[3],
        showIssuerName: settings[4],
    };
}

async function prepareSetPrivacySettings(userAddress, settings) {
    if (!ethers.isAddress(userAddress)) {
        throw new Error("Invalid user address format.");
    }
    if (typeof settings.showRecipientAddress !== 'boolean' ||
        typeof settings.showIssuerAddress !== 'boolean' ||
        typeof settings.showMintDate !== 'boolean' ||
        typeof settings.showCredentialType !== 'boolean' ||
        typeof settings.showIssuerName !== 'boolean') {
        throw new Error("All privacy settings must be boolean values.");
    }
    return { success: true, message: "Ready for frontend privacy settings update." };
}

async function getVerificationHistory(credentialId) {
    if (credentialId === undefined || credentialId === null) {
        throw new Error("Credential ID is required to get verification history.");
    }
    const history = await verificationContract.getVerificationHistory(BigInt(credentialId));
    return history.map(entry => ({
        verifier: safeAddressToString(entry[0]),
        credentialId: safeBigIntToString(entry[1]),
        timestamp: safeBigIntToString(entry[2]),
        successful: entry[3],
    }));
}

async function getVerificationCount(verifierAddress) {
    if (!ethers.isAddress(verifierAddress)) {
        throw new Error("Invalid verifier address format.");
    }
    const count = await verificationContract.getVerificationCount(verifierAddress);
    return safeBigIntToString(count);
}

async function getTotalVerifications() {
    const total = await verificationContract.getTotalVerifications();
    return safeBigIntToString(total);
}

async function getCredentialVerificationCount(credentialId) {
    if (credentialId === undefined || credentialId === null) {
        throw new Error("Credential ID is required to get verification count.");
    }
    const count = await verificationContract.getCredentialVerificationCount(BigInt(credentialId));
    return safeBigIntToString(count);
}

async function verifyIssuerAuthorization(issuerAddress) {
    if (!ethers.isAddress(issuerAddress)) {
        throw new Error("Invalid issuer address format.");
    }
    return verificationContract.verifyIssuerAuthorization(issuerAddress);
}

module.exports = {
    getRecipientNFTCredentials,
    getRecipientGeneralCredentials,
    getCombinedRecipientCredentials,
    getNFTCredentialDetails,
    getGeneralCredentialDetails,
    getPublicVerificationDetails,
    getFullVerificationDetails,
    generateVerificationProof,
    generateQRCodeData,
    getPrivacySettings,
    prepareSetPrivacySettings,
    getVerificationHistory,
    getVerificationCount,
    getTotalVerifications,
    getCredentialVerificationCount,
    verifyIssuerAuthorization
};
