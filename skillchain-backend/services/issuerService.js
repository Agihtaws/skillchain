// services/issuerService.js
const { issuerRegistryContract } = require('../config/blockchain');
const ipfsService = require('./ipfsService');
const { ethers } = require('ethers'); // For address validation

async function getAdminAddress() {
    return issuerRegistryContract.admin();
}

async function checkAdminStatus(walletAddress) {
    const currentAdmin = await getAdminAddress();
    return currentAdmin.toLowerCase() === walletAddress.toLowerCase();
}

async function getIssuerDetails(issuerAddress) {
    try {
        // The contract's 'getIssuer' function now has an 'issuerHasRecord' modifier
        // that handles the existence check. We rely on that.
        const issuerDetails = await issuerRegistryContract.getIssuer(issuerAddress);
        
        // If getIssuer succeeds, it means the record exists and is valid according to the contract's modifier.
        return {
            issuerAddress: issuerDetails[0],
            universityName: issuerDetails[1],
            isVerified: issuerDetails[2],
            isActive: issuerDetails[3],
            registrationDate: issuerDetails[4].toString(),
            verificationLevel: issuerDetails[5].toString(),
            reputationScore: issuerDetails[6].toString(),
            metadataURI: issuerDetails[7]
        };
    } catch (error) {
        // If getIssuer reverts (e.g., due to the 'issuerHasRecord' modifier failing),
        // it means the issuer doesn't exist or doesn't have a valid record.
        // We catch this specific revert reason and return null.
        if (error.reason && error.reason.includes("Issuer not found or never registered")) {
            return null; // Issuer does not have a valid record in the contract
        }
        throw error; // Re-throw any other unexpected errors
    }
}

async function getAllIssuers() {
    // This now calls the updated getAllIssuers on the contract,
    // which returns the uniqueIssuerAddresses array (only currently registered ones).
    const issuerAddresses = await issuerRegistryContract.getAllIssuers();
    const issuersData = await Promise.all(
        issuerAddresses.map(async (addr) => {
            // getIssuerDetails now handles the existence check based on the contract's new logic.
            // It will return null if an issuer record is not found.
            const details = await getIssuerDetails(addr);
            return details;
        })
    );
    return issuersData.filter(Boolean); // Filter out any null entries that getIssuerDetails might return
}

async function getTotalIssuers() {
    // This will now call the updated totalIssuers on the contract,
    // which represents the count of unique, currently registered issuers.
    const total = await issuerRegistryContract.totalIssuers();
    return total.toString();
}

async function getActiveIssuers() {
    // This calls the updated getActiveIssuers on the contract.
    const activeAddresses = await issuerRegistryContract.getActiveIssuers();
    const activeIssuersData = await Promise.all(
        activeAddresses.map(addr => getIssuerDetails(addr))
    );
    return activeIssuersData.filter(Boolean);
}

async function getVerifiedIssuers() {
    // This calls the updated getVerifiedIssuers on the contract.
    const verifiedAddresses = await issuerRegistryContract.getVerifiedIssuers();
    const verifiedIssuersData = await Promise.all(
        verifiedAddresses.map(addr => getIssuerDetails(addr))
    );
    return verifiedIssuersData.filter(Boolean);
}

async function registerIssuer(issuerAddress, universityName, collegeAddress, logoFile, imageFiles) {
    if (!ethers.isAddress(issuerAddress)) {
        throw new Error("Invalid issuer address.");
    }
    if (!universityName || universityName.trim() === '') {
        throw new Error("University name cannot be empty.");
    }

    let logoIpfsHash = '';
    if (logoFile) {
        logoIpfsHash = await ipfsService.uploadFileToIPFS(logoFile.buffer, logoFile.originalname);
    }

    const otherImagesIpfsHashes = await Promise.all(
        imageFiles.map(file => ipfsService.uploadFileToIPFS(file.buffer, file.originalname))
    );

    const metadata = {
        universityName,
        collegeAddress: collegeAddress || '',
        logo: logoIpfsHash,
        images: otherImagesIpfsHashes,
        timestamp: new Date().toISOString()
    };

    const metadataURI = await ipfsService.uploadJsonToIPFS(metadata, `IssuerMetadata-${universityName}-${Date.now()}.json`);

    const tx = await issuerRegistryContract.registerIssuer(issuerAddress, universityName, metadataURI);
    await tx.wait();
    return { transactionHash: tx.hash, metadataURI };
}

async function verifyIssuer(issuerAddress, verificationLevel) {
    if (!ethers.isAddress(issuerAddress)) {
        throw new Error("Invalid issuer address.");
    }
    if (verificationLevel < 1 || verificationLevel > 5) {
        throw new Error("Verification level must be between 1 and 5.");
    }
    const tx = await issuerRegistryContract.verifyIssuer(issuerAddress, verificationLevel);
    await tx.wait();
    return { transactionHash: tx.hash };
}

async function updateReputationScore(issuerAddress, newScore) {
    if (!ethers.isAddress(issuerAddress)) {
        throw new Error("Invalid issuer address.");
    }
    if (newScore < 0 || newScore > 100) {
        throw new Error("Reputation score must be between 0 and 100.");
    }
    const tx = await issuerRegistryContract.updateReputationScore(issuerAddress, newScore);
    await tx.wait();
    return { transactionHash: tx.hash };
}

async function updateVerificationLevel(issuerAddress, newLevel) {
    if (!ethers.isAddress(issuerAddress)) {
        throw new Error("Invalid issuer address.");
    }
    if (newLevel < 1 || newLevel > 5) {
        throw new Error("Verification level must be between 1 and 5.");
    }
    const tx = await issuerRegistryContract.updateVerificationLevel(issuerAddress, newLevel);
    await tx.wait();
    return { transactionHash: tx.hash };
}

async function deactivateIssuer(issuerAddress) {
    if (!ethers.isAddress(issuerAddress)) {
        throw new Error("Invalid issuer address.");
    }
    const tx = await issuerRegistryContract.deactivateIssuer(issuerAddress);
    await tx.wait();
    return { transactionHash: tx.hash };
}

async function reactivateIssuer(issuerAddress) {
    if (!ethers.isAddress(issuerAddress)) {
        throw new Error("Invalid issuer address.");
    }
    const tx = await issuerRegistryContract.reactivateIssuer(issuerAddress);
    await tx.wait();
    return { transactionHash: tx.hash };
}

async function removeIssuer(issuerAddress) {
    if (!ethers.isAddress(issuerAddress)) {
        throw new Error("Invalid issuer address.");
    }
    const tx = await issuerRegistryContract.removeIssuer(issuerAddress);
    await tx.wait();
    return { transactionHash: tx.hash };
}

async function transferAdmin(newAdminAddress) {
    if (!ethers.isAddress(newAdminAddress)) {
        throw new Error("Invalid new admin address.");
    }
    const tx = await issuerRegistryContract.transferAdmin(newAdminAddress);
    await tx.wait();
    return { transactionHash: tx.hash };
}

module.exports = {
    getAdminAddress,
    checkAdminStatus,
    getIssuerDetails,
    getAllIssuers,
    getTotalIssuers,
    getActiveIssuers,
    getVerifiedIssuers,
    registerIssuer,
    verifyIssuer,
    updateReputationScore,
    updateVerificationLevel,
    deactivateIssuer,
    reactivateIssuer,
    removeIssuer,
    transferAdmin
};
