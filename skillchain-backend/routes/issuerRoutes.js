const express = require('express');
const multer = require('multer');
const issuerController = require('../controllers/issuerController');

const router = express.Router();
const upload = multer(); // For handling file uploads

// --- Authorization Check ---
router.get('/check-authorization/:issuerAddress', issuerController.checkAuthorization);

// --- CredentialNFT Routes (Soulbound Credentials) ---
// Frontend will call this to get tokenURI, then call smart contract directly
router.post(
    '/nft/prepare-mint-single',
    upload.fields([{ name: 'credentialFiles', maxCount: 5 }]), // Allow multiple files for metadata
    issuerController.checkIssuerAuthMiddleware, // Pre-check authorization
    issuerController.handlePrepareMintCredentialNFT
);

// Frontend will call this to get tokenURIs, then call smart contract directly
router.post(
    '/nft/prepare-mint-batch',
    upload.any(), // <--- CHANGED: Use upload.any() to accept dynamic file field names
    issuerController.checkIssuerAuthMiddleware, // Pre-check authorization
    issuerController.handlePrepareBatchMintCredentialNFTs
);

// Frontend will call this to prepare for revocation (e.g., frontend validation), then call smart contract directly
router.post(
    '/nft/prepare-revoke',
    issuerController.checkIssuerAuthMiddleware, // Pre-check authorization
    issuerController.handlePrepareRevokeCredentialNFT
);

router.get(
    '/nft/list-by-issuer/:issuerAddress',
    issuerController.checkIssuerAuthMiddleware,
    issuerController.handleGetIssuerNFTCredentials
);

router.get(
    '/nft/details/:tokenId',
    issuerController.handleGetNFTCredentialDetails
);


// --- CredentialRegistry Routes (General Credentials) ---
// Frontend will call this to get metadataURI, then call smart contract directly
router.post(
    '/general/prepare-issue-single',
    upload.fields([{ name: 'credentialFiles', maxCount: 5 }]),
    issuerController.checkIssuerAuthMiddleware,
    issuerController.handlePrepareIssueGeneralCredential
);

// Frontend will call this to prepare for revocation, then call smart contract directly
router.post(
    '/general/prepare-revoke',
    issuerController.checkIssuerAuthMiddleware,
    issuerController.handlePrepareRevokeGeneralCredential
);

router.get(
    '/general/list-by-issuer/:issuerAddress',
    issuerController.checkIssuerAuthMiddleware,
    issuerController.handleGetIssuerGeneralCredentials
);

router.get(
    '/general/details/:credentialId',
    issuerController.handleGetGeneralCredentialDetails
);


module.exports = router;
