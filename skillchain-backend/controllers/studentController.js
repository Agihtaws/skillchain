// controllers/studentController.js
const studentService = require('../services/studentService');

// --- Credential Fetching for Recipient ---

async function handleGetRecipientNFTCredentials(req, res) {
    try {
        const { recipientAddress } = req.params;
        const credentials = await studentService.getRecipientNFTCredentials(recipientAddress);
        res.status(200).json(credentials);
    } catch (error) {
        console.error("Error fetching recipient's NFT credentials:", error);
        res.status(500).json({ message: "Failed to fetch recipient's NFT credentials.", error: error.message });
    }
}

async function handleGetRecipientGeneralCredentials(req, res) {
    try {
        const { recipientAddress } = req.params;
        const credentials = await studentService.getRecipientGeneralCredentials(recipientAddress);
        res.status(200).json(credentials);
    } catch (error) {
        console.error("Error fetching recipient's general credentials:", error);
        res.status(500).json({ message: "Failed to fetch recipient's general credentials.", error: error.message });
    }
}

async function handleGetCombinedRecipientCredentials(req, res) {
    try {
        const { recipientAddress } = req.params;
        const credentials = await studentService.getCombinedRecipientCredentials(recipientAddress);
        res.status(200).json(credentials);
    } catch (error) {
        console.error("Error fetching all recipient's credentials:", error);
        res.status(500).json({ message: "Failed to fetch all recipient's credentials.", error: error.message });
    }
}

// --- Credential Details ---

async function handleGetNFTCredentialDetails(req, res) {
    try {
        const { tokenId } = req.params;
        const details = await studentService.getNFTCredentialDetails(tokenId);
        res.status(200).json(details);
    } catch (error) {
        console.error("Error fetching NFT credential details:", error);
        res.status(500).json({ message: "Failed to fetch NFT credential details.", error: error.message });
    }
}

async function handleGetGeneralCredentialDetails(req, res) {
    try {
        const { credentialId } = req.params;
        const details = await studentService.getGeneralCredentialDetails(credentialId);
        res.status(200).json(details);
    } catch (error) {
        console.error("Error fetching general credential details:", error);
        res.status(500).json({ message: "Failed to fetch general credential details.", error: error.message });
    }
}

// --- VerificationContract Controllers ---

async function handleGetPublicVerificationDetails(req, res) {
    try {
        const { credentialId } = req.params;
        const details = await studentService.getPublicVerificationDetails(credentialId);
        res.status(200).json(details);
    } catch (error) {
        console.error("Error fetching public verification details:", error);
        res.status(500).json({ message: "Failed to fetch public verification details.", error: error.message });
    }
}

async function handleGetFullVerificationDetails(req, res) {
    try {
        const { credentialId } = req.params;
        const details = await studentService.getFullVerificationDetails(credentialId);
        res.status(200).json(details);
    } catch (error) {
        console.error("Error fetching full verification details:", error);
        res.status(500).json({ message: "Failed to fetch full verification details.", error: error.message });
    }
}

async function handleGenerateVerificationProof(req, res) {
    try {
        const { credentialId } = req.params;
        const proof = await studentService.generateVerificationProof(credentialId);
        res.status(200).json(proof);
    } catch (error) {
        console.error("Error generating verification proof:", error);
        res.status(500).json({ message: "Failed to generate verification proof.", error: error.message });
    }
}

async function handleGenerateQRCodeData(req, res) {
    try {
        const { credentialId } = req.params;
        const qrCodeData = await studentService.generateQRCodeData(credentialId);
        res.status(200).json({ qrCodeData });
    } catch (error) {
        console.error("Error generating QR code data:", error);
        res.status(500).json({ message: "Failed to generate QR code data.", error: error.message });
    }
}

async function handleGetPrivacySettings(req, res) {
    try {
        const { userAddress } = req.params;
        const settings = await studentService.getPrivacySettings(userAddress);
        res.status(200).json(settings);
    } catch (error) {
        console.error("Error fetching privacy settings:", error);
        res.status(500).json({ message: "Failed to fetch privacy settings.", error: error.message });
    }
}

async function handlePrepareSetPrivacySettings(req, res) {
    try {
        const { userAddress, settings } = req.body;
        const result = await studentService.prepareSetPrivacySettings(userAddress, settings);
        res.status(200).json({ message: result.message });
    } catch (error) {
        console.error("Error preparing privacy settings:", error);
        res.status(500).json({ message: "Failed to prepare privacy settings.", error: error.message });
    }
}

async function handleGetVerificationHistory(req, res) {
    try {
        const { credentialId } = req.params;
        const history = await studentService.getVerificationHistory(credentialId);
        res.status(200).json(history);
    } catch (error) {
        console.error("Error fetching verification history:", error);
        res.status(500).json({ message: "Failed to fetch verification history.", error: error.message });
    }
}

async function handleGetVerificationCount(req, res) {
    try {
        const { verifierAddress } = req.params;
        const count = await studentService.getVerificationCount(verifierAddress);
        res.status(200).json({ count });
    } catch (error) {
        console.error("Error fetching verification count:", error);
        res.status(500).json({ message: "Failed to fetch verification count.", error: error.message });
    }
}

async function handleGetTotalVerifications(req, res) {
    try {
        const total = await studentService.getTotalVerifications();
        res.status(200).json({ totalVerifications: total });
    } catch (error) {
        console.error("Error fetching total verifications:", error);
        res.status(500).json({ message: "Failed to fetch total verifications.", error: error.message });
    }
}

async function handleGetCredentialVerificationCount(req, res) {
    try {
        const { credentialId } = req.params;
        const count = await studentService.getCredentialVerificationCount(credentialId);
        res.status(200).json({ count });
    } catch (error) {
        console.error("Error fetching credential verification count:", error);
        res.status(500).json({ message: "Failed to fetch credential verification count.", error: error.message });
    }
}

async function handleVerifyIssuerAuthorization(req, res) {
    try {
        const { issuerAddress } = req.params;
        const isAuthorized = await studentService.verifyIssuerAuthorization(issuerAddress);
        res.status(200).json({ isAuthorized });
    } catch (error) {
        console.error("Error verifying issuer authorization:", error);
        res.status(500).json({ message: "Failed to verify issuer authorization.", error: error.message });
    }
}


module.exports = {
    handleGetRecipientNFTCredentials,
    handleGetRecipientGeneralCredentials,
    handleGetCombinedRecipientCredentials,
    handleGetNFTCredentialDetails,
    handleGetGeneralCredentialDetails,
    handleGetPublicVerificationDetails,
    handleGetFullVerificationDetails,
    handleGenerateVerificationProof,
    handleGenerateQRCodeData,
    handleGetPrivacySettings,
    handlePrepareSetPrivacySettings,
    handleGetVerificationHistory,
    handleGetVerificationCount,
    handleGetTotalVerifications,
    handleGetCredentialVerificationCount,
    handleVerifyIssuerAuthorization
};
