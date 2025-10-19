// routes/adminRoutes.js
const express = require('express');
const multer = require('multer');
const adminController = require('../controllers/adminController');

const router = express.Router();
const upload = multer(); // For handling file uploads

// --- Admin Dashboard & Issuer Information ---
router.get('/check-admin/:walletAddress', adminController.checkAdmin);
router.get('/issuer/:issuerAddress', adminController.getIssuer);
router.get('/issuers', adminController.getAllIssuersData);
router.get('/total-issuers', adminController.getTotalIssuersCount);
router.get('/active-issuers', adminController.getActiveIssuersData);
router.get('/verified-issuers', adminController.getVerifiedIssuersData);

// --- Admin Actions ---
router.post(
    '/register-issuer',
    upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'images', maxCount: 5 }]),
    adminController.registerNewIssuer
);
router.post('/verify-issuer', adminController.verifyExistingIssuer);
router.post('/update-reputation', adminController.updateIssuerReputation);
router.post('/update-verification-level', adminController.updateIssuerVerificationLevel);
router.post('/deactivate-issuer', adminController.deactivateExistingIssuer);
router.post('/reactivate-issuer', adminController.reactivateExistingIssuer);
router.post('/remove-issuer', adminController.removeExistingIssuer);
router.post('/transfer-admin', adminController.transferAdminRole);

module.exports = router;
