// controllers/adminController.js
const issuerService = require('../services/issuerService');

async function checkAdmin(req, res) {
    try {
        const { walletAddress } = req.params;
        const isAdmin = await issuerService.checkAdminStatus(walletAddress);
        res.status(200).json({ isAdmin });
    } catch (error) {
        console.error("Error in checkAdmin:", error);
        res.status(500).json({ message: "Failed to check admin status", error: error.message });
    }
}

async function getIssuer(req, res) {
    try {
        const { issuerAddress } = req.params;
        const issuerDetails = await issuerService.getIssuerDetails(issuerAddress);
        if (!issuerDetails) {
            return res.status(404).json({ message: "Issuer not found" });
        }
        res.status(200).json(issuerDetails);
    } catch (error) {
        console.error("Error in getIssuer:", error);
        res.status(500).json({ message: "Failed to fetch issuer details", error: error.message });
    }
}

async function getAllIssuersData(req, res) {
    try {
        const issuersData = await issuerService.getAllIssuers();
        res.status(200).json(issuersData);
    } catch (error) {
        console.error("Error in getAllIssuersData:", error);
        res.status(500).json({ message: "Failed to fetch all issuers", error: error.message });
    }
}

async function getTotalIssuersCount(req, res) {
    try {
        const totalIssuers = await issuerService.getTotalIssuers();
        res.status(200).json({ totalIssuers });
    } catch (error) {
        console.error("Error in getTotalIssuersCount:", error);
        res.status(500).json({ message: "Failed to fetch total issuers count", error: error.message });
    }
}

async function getActiveIssuersData(req, res) {
    try {
        const activeIssuersData = await issuerService.getActiveIssuers();
        res.status(200).json(activeIssuersData);
    } catch (error) {
        console.error("Error in getActiveIssuersData:", error);
        res.status(500).json({ message: "Failed to fetch active issuers", error: error.message });
    }
}

async function getVerifiedIssuersData(req, res) {
    try {
        const verifiedIssuersData = await issuerService.getVerifiedIssuers();
        res.status(200).json(verifiedIssuersData);
    } catch (error) {
        console.error("Error in getVerifiedIssuersData:", error);
        res.status(500).json({ message: "Failed to fetch verified issuers", error: error.message });
    }
}

async function registerNewIssuer(req, res) {
    try {
        const { issuerAddress, universityName, collegeAddress } = req.body;
        const logoFile = req.files && req.files['logo'] ? req.files['logo'][0] : null;
        const imageFiles = req.files && req.files['images'] ? req.files['images'] : [];

        const result = await issuerService.registerIssuer(issuerAddress, universityName, collegeAddress, logoFile, imageFiles);
        res.status(201).json({ message: "Issuer registered successfully", ...result });
    } catch (error) {
        console.error("Error in registerNewIssuer:", error);
        res.status(500).json({ message: "Failed to register issuer", error: error.message });
    }
}

async function verifyExistingIssuer(req, res) {
    try {
        const { issuerAddress, verificationLevel } = req.body;
        const result = await issuerService.verifyIssuer(issuerAddress, verificationLevel);
        res.status(200).json({ message: "Issuer verified successfully", ...result });
    } catch (error) {
        console.error("Error in verifyExistingIssuer:", error);
        res.status(500).json({ message: "Failed to verify issuer", error: error.message });
    }
}

async function updateIssuerReputation(req, res) {
    try {
        const { issuerAddress, newScore } = req.body;
        const result = await issuerService.updateReputationScore(issuerAddress, newScore);
        res.status(200).json({ message: "Reputation score updated successfully", ...result });
    } catch (error) {
        console.error("Error in updateIssuerReputation:", error);
        res.status(500).json({ message: "Failed to update reputation score", error: error.message });
    }
}

async function updateIssuerVerificationLevel(req, res) {
    try {
        const { issuerAddress, newLevel } = req.body;
        const result = await issuerService.updateVerificationLevel(issuerAddress, newLevel);
        res.status(200).json({ message: "Verification level updated successfully", ...result });
    } catch (error) {
        console.error("Error in updateIssuerVerificationLevel:", error);
        res.status(500).json({ message: "Failed to update verification level", error: error.message });
    }
}

async function deactivateExistingIssuer(req, res) {
    try {
        const { issuerAddress } = req.body;
        const result = await issuerService.deactivateIssuer(issuerAddress);
        res.status(200).json({ message: "Issuer deactivated successfully", ...result });
    } catch (error) {
        console.error("Error in deactivateExistingIssuer:", error);
        res.status(500).json({ message: "Failed to deactivate issuer", error: error.message });
    }
}

async function reactivateExistingIssuer(req, res) {
    try {
        const { issuerAddress } = req.body;
        const result = await issuerService.reactivateIssuer(issuerAddress);
        res.status(200).json({ message: "Issuer reactivated successfully", ...result });
    } catch (error) {
        console.error("Error in reactivateExistingIssuer:", error);
        res.status(500).json({ message: "Failed to reactivate issuer", error: error.message });
    }
}

async function removeExistingIssuer(req, res) {
    try {
        const { issuerAddress } = req.body;
        const result = await issuerService.removeIssuer(issuerAddress);
        res.status(200).json({ message: "Issuer removed successfully", ...result });
    } catch (error) {
        console.error("Error in removeExistingIssuer:", error);
        res.status(500).json({ message: "Failed to remove issuer", error: error.message });
    }
}

async function transferAdminRole(req, res) {
    try {
        const { newAdminAddress } = req.body;
        const result = await issuerService.transferAdmin(newAdminAddress);
        res.status(200).json({ message: "Admin role transferred successfully", ...result });
    } catch (error) {
        console.error("Error in transferAdminRole:", error);
        res.status(500).json({ message: "Failed to transfer admin role", error: error.message });
    }
}

module.exports = {
    checkAdmin,
    getIssuer,
    getAllIssuersData,
    getTotalIssuersCount,
    getActiveIssuersData,
    getVerifiedIssuersData,
    registerNewIssuer,
    verifyExistingIssuer,
    updateIssuerReputation,
    updateIssuerVerificationLevel,
    deactivateExistingIssuer,
    reactivateExistingIssuer,
    removeExistingIssuer,
    transferAdminRole
};
