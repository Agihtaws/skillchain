const issuerCredentialService = require('../services/issuerCredentialService');
const multer = require('multer');
const upload = multer(); // For handling file uploads

// Middleware to check if the caller is an authorized issuer
// This middleware assumes the issuerAddress is passed as a param or in the body
// This check is mainly for frontend display logic or prior to actual on-chain calls.
// The actual on-chain transaction will be signed by the frontend's connected wallet
// and the smart contract's `onlyAuthorizedIssuer` modifier will perform the final validation.
async function checkIssuerAuthMiddleware(req, res, next) {
    try {
        const issuerAddress = req.params.issuerAddress || req.body.issuerAddress || req.query.issuerAddress;
        if (!issuerAddress) {
            return res.status(400).json({ message: "Issuer address is required for authorization check." });
        }
        const isAuthorized = await issuerCredentialService.checkIssuerAuthorization(issuerAddress);
        if (!isAuthorized) {
            return res.status(403).json({ message: "Caller is not an authorized issuer." });
        }
        req.isAuthorizedIssuer = true; // Attach flag to request for subsequent handlers
        next();
    } catch (error) {
        console.error("Error in issuer authorization middleware:", error);
        res.status(500).json({ message: "Failed to verify issuer authorization.", error: error.message });
    }
}

// --- Authorization ---
async function checkAuthorization(req, res) {
    try {
        const { issuerAddress } = req.params;
        const isAuthorized = await issuerCredentialService.checkIssuerAuthorization(issuerAddress);
        res.status(200).json({ isAuthorized });
    } catch (error) {
        console.error("Error in checkAuthorization:", error);
        res.status(500).json({ message: "Failed to check issuer authorization.", error: error.message });
    }
}


// --- CredentialNFT Controllers ---

async function handlePrepareMintCredentialNFT(req, res) {
    try {
        const { issuerAddress, recipientAddress, credentialType } = req.body;
        const credentialFiles = req.files['credentialFiles'] || [];

        if (!issuerAddress || !recipientAddress || !credentialType) {
            return res.status(400).json({ message: "Issuer address, recipient address, and credential type are required." });
        }

        const result = await issuerCredentialService.prepareMintCredentialNFT(
            issuerAddress,
            recipientAddress,
            credentialType,
            credentialFiles
        );
        // Returns the tokenURI. Frontend will use this to call the smart contract.
        res.status(200).json({ message: "NFT Credential metadata prepared.", tokenURI: result.tokenURI });
    } catch (error) {
        console.error("Error preparing NFT credential metadata:", error);
        res.status(500).json({ message: "Failed to prepare NFT credential metadata.", error: error.message });
    }
}

async function handlePrepareBatchMintCredentialNFTs(req, res) {
    try {
        const { issuerAddress, recipients, credentialTypes } = req.body;
        // req.files will now be an array of all files if upload.any() is used
        const allUploadedFiles = req.files || []; 

        // Parse recipients and credentialTypes from JSON strings
        const parsedRecipients = JSON.parse(recipients);
        const parsedCredentialTypes = JSON.parse(credentialTypes);

        if (!issuerAddress || !parsedRecipients || !parsedCredentialTypes || !Array.isArray(parsedRecipients) || !Array.isArray(parsedCredentialTypes)) {
            return res.status(400).json({ message: "Issuer address, recipients (array), and credential types (array) are required." });
        }
        if (parsedRecipients.length !== parsedCredentialTypes.length) {
             return res.status(400).json({ message: "Recipients and credential types arrays must have the same length." });
        }

        // Reconstruct formattedFileBatches based on the fieldname (e.g., "credentialFilesBatches[0]")
        const formattedFileBatches = parsedRecipients.map((_, index) => {
            return allUploadedFiles.filter(file => file.fieldname === `credentialFilesBatches[${index}]`);
        });

        const result = await issuerCredentialService.prepareBatchMintCredentialNFTs(
            issuerAddress,
            parsedRecipients, // Use parsed recipients
            parsedCredentialTypes, // Use parsed credential types
            formattedFileBatches
        );
        res.status(200).json({ message: "NFT Credentials metadata prepared for batch.", tokenURIs: result.tokenURIs });
    } catch (error) {
        console.error("Error preparing NFT credentials metadata for batch:", error);
        res.status(500).json({ message: "Failed to prepare NFT credentials metadata for batch.", error: error.message });
    }
}


async function handlePrepareRevokeCredentialNFT(req, res) {
    try {
        const { issuerAddress, tokenId } = req.body;
        if (!issuerAddress || !tokenId) {
            return res.status(400).json({ message: "Issuer address and token ID are required." });
        }
        const result = await issuerCredentialService.prepareRevokeCredentialNFT(issuerAddress, tokenId);
        res.status(200).json({ message: result.message });
    } catch (error) {
        console.error("Error preparing NFT credential revocation:", error);
        res.status(500).json({ message: "Failed to prepare NFT credential revocation.", error: error.message });
    }
}

async function handleGetIssuerNFTCredentials(req, res) {
    try {
        const { issuerAddress } = req.params;
        const tokenIds = await issuerCredentialService.getIssuerNFTCredentials(issuerAddress);
        
        // Convert BigInts in the tokenIds array to strings
        const stringifiedTokenIds = tokenIds.map(id => id.toString());

        res.status(200).json(stringifiedTokenIds); // Send the stringified token IDs
    } catch (error) {
        console.error("Error fetching issuer's NFT credentials:", error);
        res.status(500).json({ message: "Failed to fetch issuer's NFT credentials.", error: error.message });
    }
}

async function handleGetNFTCredentialDetails(req, res) {
    try {
        const { tokenId } = req.params;
        const details = await issuerCredentialService.getNFTCredentialDetails(tokenId);
        // The service function now returns stringified BigInts, so no further conversion needed here.
        res.status(200).json(details);
    } catch (error) {
        console.error("Error fetching NFT credential details:", error);
        res.status(500).json({ message: "Failed to fetch NFT credential details.", error: error.message });
    }
}

// --- CredentialRegistry Controllers ---

async function handlePrepareIssueGeneralCredential(req, res) {
    try {
        const { issuerAddress, recipientAddress, degreeName } = req.body;
        const credentialFiles = req.files['credentialFiles'] || [];

        if (!issuerAddress || !recipientAddress || !degreeName) {
            return res.status(400).json({ message: "Issuer address, recipient address, and degree name are required." });
        }

        const result = await issuerCredentialService.prepareIssueGeneralCredential(
            issuerAddress,
            recipientAddress,
            degreeName,
            credentialFiles
        );
        res.status(200).json({ message: "General Credential metadata prepared.", metadataURI: result.metadataURI });
    } catch (error) {
        console.error("Error preparing general credential metadata:", error);
        res.status(500).json({ message: "Failed to prepare general credential metadata.", error: error.message });
    }
}

async function handlePrepareRevokeGeneralCredential(req, res) {
    try {
        const { issuerAddress, credentialId } = req.body;
        if (!issuerAddress || !credentialId) {
            return res.status(400).json({ message: "Issuer address and credential ID are required." });
        }
        const result = await issuerCredentialService.prepareRevokeGeneralCredential(issuerAddress, credentialId);
        res.status(200).json({ message: result.message });
    } catch (error) {
        console.error("Error preparing general credential revocation:", error);
        res.status(500).json({ message: "Failed to prepare general credential revocation.", error: error.message });
    }
}

async function handleGetIssuerGeneralCredentials(req, res) {
    try {
        const { issuerAddress } = req.params;
        const credentialIds = await issuerCredentialService.getIssuerGeneralCredentials(issuerAddress);
        // Convert BigInts in the credentialIds array to strings
        const stringifiedCredentialIds = credentialIds.map(id => id.toString());
        res.status(200).json(stringifiedCredentialIds); // Send the stringified credential IDs
    } catch (error) {
        console.error("Error fetching issuer's general credentials:", error);
        res.status(500).json({ message: "Failed to fetch issuer's general credentials.", error: error.message });
    }
}

async function handleGetGeneralCredentialDetails(req, res) {
    try {
        const { credentialId } = req.params;
        const details = await issuerCredentialService.getGeneralCredentialDetails(credentialId);
        // The service function now returns stringified BigInts, so no further conversion needed here.
        res.status(200).json(details);
    } catch (error) {
        console.error("Error fetching general credential details:", error);
        res.status(500).json({ message: "Failed to fetch general credential details.", error: error.message });
    }
}


module.exports = {
    checkIssuerAuthMiddleware,
    checkAuthorization,
    handlePrepareMintCredentialNFT,
    handlePrepareBatchMintCredentialNFTs,
    handlePrepareRevokeCredentialNFT,
    handleGetIssuerNFTCredentials,
    handleGetNFTCredentialDetails,
    handlePrepareIssueGeneralCredential,
    handlePrepareRevokeGeneralCredential,
    handleGetIssuerGeneralCredentials,
    handleGetGeneralCredentialDetails
};
