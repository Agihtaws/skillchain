// src/api/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000'; // Your backend URL

const api = axios.create({
  baseURL: API_BASE_URL,
});

// --- Admin API Calls ---
export const checkAdminStatus = async (walletAddress) => {
  const response = await api.get(`/admin/check-admin/${walletAddress}`);
  return response.data.isAdmin;
};

export const getIssuerDetails = async (issuerAddress) => {
  const response = await api.get(`/admin/issuer/${issuerAddress}`);
  return response.data;
};

export const getAllIssuers = async () => {
  const response = await api.get('/admin/issuers');
  return response.data;
};

export const getTotalIssuersCount = async () => {
  const response = await api.get('/admin/total-issuers');
  return response.data.totalIssuers;
};

export const getActiveIssuers = async () => {
  const response = await api.get('/admin/active-issuers');
  return response.data;
};

export const getVerifiedIssuers = async () => {
  const response = await api.get('/admin/verified-issuers');
  return response.data;
};

export const registerIssuer = async (formData) => {
  const response = await api.post('/admin/register-issuer', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const verifyIssuer = async (issuerAddress, verificationLevel) => {
  const response = await api.post('/admin/verify-issuer', { issuerAddress, verificationLevel });
  return response.data;
};

export const updateReputationScore = async (issuerAddress, newScore) => {
  const response = await api.post('/admin/update-reputation', { issuerAddress, newScore });
  return response.data;
};

export const updateVerificationLevel = async (issuerAddress, newLevel) => {
  const response = await api.post('/admin/update-verification-level', { issuerAddress, newLevel });
  return response.data;
};

export const deactivateIssuer = async (issuerAddress) => {
  const response = await api.post('/admin/deactivate-issuer', { issuerAddress });
  return response.data;
};

export const reactivateIssuer = async (issuerAddress) => {
  const response = await api.post('/admin/reactivate-issuer', { issuerAddress });
  return response.data;
};

export const removeIssuer = async (issuerAddress) => {
  const response = await api.post('/admin/remove-issuer', { issuerAddress });
  return response.data;
};

export const transferAdmin = async (newAdminAddress) => {
  const response = await api.post('/admin/transfer-admin', { newAdminAddress });
  return response.data;
};


// --- Issuer API Calls ---
export const checkIssuerAuthorization = async (issuerAddress) => {
  const response = await api.get(`/issuer/check-authorization/${issuerAddress}`);
  return response.data.isAuthorized;
};

// NFT Credentials
export const prepareMintNFTCredential = async (formData) => {
  const response = await api.post('/issuer/nft/prepare-mint-single', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const prepareBatchMintNFTCredentials = async (formData) => {
  const response = await api.post('/issuer/nft/prepare-mint-batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getIssuerNFTCredentials = async (issuerAddress) => {
  const response = await api.get(`/issuer/nft/list-by-issuer/${issuerAddress}`);
  return response.data;
};

export const getNFTCredentialDetails = async (tokenId) => {
  const response = await api.get(`/issuer/nft/details/${tokenId}`);
  return response.data;
};

// General Credentials
export const prepareIssueGeneralCredential = async (formData) => {
  const response = await api.post('/issuer/general/prepare-issue-single', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getIssuerGeneralCredentials = async (issuerAddress) => {
  const response = await api.get(`/issuer/general/list-by-issuer/${issuerAddress}`);
  return response.data;
};

export const getGeneralCredentialDetails = async (credentialId) => {
  const response = await api.get(`/issuer/general/details/${credentialId}`);
  return response.data;
};


// --- Student API Calls ---
export const getRecipientNFTCredentials = async (recipientAddress) => {
  const response = await api.get(`/student/credentials/nft/${recipientAddress}`);
  return response.data;
};

export const getRecipientGeneralCredentials = async (recipientAddress) => {
  const response = await api.get(`/student/credentials/general/${recipientAddress}`);
  return response.data;
};

export const getCombinedRecipientCredentials = async (recipientAddress) => {
  const response = await api.get(`/student/credentials/all/${recipientAddress}`);
  return response.data;
};

export const getStudentNFTCredentialDetails = async (tokenId) => {
  const response = await api.get(`/student/nft/details/${tokenId}`);
  return response.data;
};

export const getStudentGeneralCredentialDetails = async (credentialId) => {
  const response = await api.get(`/student/general/details/${credentialId}`);
  return response.data;
};

export const getPublicVerificationDetails = async (credentialId) => {
  const response = await api.get(`/student/verify/public/${credentialId}`);
  return response.data;
};

export const getFullVerificationDetails = async (credentialId) => {
  const response = await api.get(`/student/verify/full/${credentialId}`);
  return response.data;
};

export const generateVerificationProof = async (credentialId) => {
  const response = await api.get(`/student/verify/proof/${credentialId}`);
  return response.data;
};

export const generateQRCodeData = async (credentialId) => {
  const response = await api.get(`/student/verify/qrcode/${credentialId}`);
  return response.data.qrCodeData;
};

export const getPrivacySettings = async (userAddress) => {
  const response = await api.get(`/student/privacy-settings/${userAddress}`);
  return response.data;
};

export const prepareSetPrivacySettings = async (userAddress, settings) => {
  const response = await api.post('/student/privacy-settings/prepare-set', { userAddress, settings });
  return response.data;
};

export const getVerificationHistory = async (credentialId) => {
  const response = await api.get(`/student/verification/history/${credentialId}`);
  return response.data;
};
