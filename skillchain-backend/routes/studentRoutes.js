// routes/studentRoutes.js
const express = require('express');
const studentController = require('../controllers/studentController');

const router = express.Router();

// --- Credential Fetching for Recipient ---
router.get('/credentials/nft/:recipientAddress', studentController.handleGetRecipientNFTCredentials);
router.get('/credentials/general/:recipientAddress', studentController.handleGetRecipientGeneralCredentials);
router.get('/credentials/all/:recipientAddress', studentController.handleGetCombinedRecipientCredentials);

// --- Credential Details (can be accessed by anyone with ID) ---
router.get('/nft/details/:tokenId', studentController.handleGetNFTCredentialDetails);
router.get('/general/details/:credentialId', studentController.handleGetGeneralCredentialDetails);

// --- VerificationContract Functions ---
router.get('/verify/public/:credentialId', studentController.handleGetPublicVerificationDetails);
router.get('/verify/full/:credentialId', studentController.handleGetFullVerificationDetails);
router.get('/verify/proof/:credentialId', studentController.handleGenerateVerificationProof); // Note: This calls a view function, no transaction
router.get('/verify/qrcode/:credentialId', studentController.handleGenerateQRCodeData);

// --- Privacy Settings (Backend prepares, Frontend transacts) ---
router.get('/privacy-settings/:userAddress', studentController.handleGetPrivacySettings);
router.post('/privacy-settings/prepare-set', studentController.handlePrepareSetPrivacySettings); // Frontend will call setPrivacySettings on contract

// --- Verification History & Counts ---
router.get('/verification/history/:credentialId', studentController.handleGetVerificationHistory);
router.get('/verification/count/:verifierAddress', studentController.handleGetVerificationCount);
router.get('/verification/total', studentController.handleGetTotalVerifications);
router.get('/verification/credential-count/:credentialId', studentController.handleGetCredentialVerificationCount);

// --- Issuer Authorization Check (for Verifiers) ---
router.get('/issuer-authorization/:issuerAddress', studentController.handleVerifyIssuerAuthorization);


module.exports = router;
