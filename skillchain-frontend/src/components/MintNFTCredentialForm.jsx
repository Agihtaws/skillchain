// src/components/MintNFTCredentialForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { prepareMintNFTCredential } from '../api/api';
import { useContractWrite } from '../hooks/useContractWrite';

const MintNFTCredentialForm = () => {
  const navigate = useNavigate();
  const { address: connectedIssuerAddress } = useAccount();
  const [recipientAddress, setRecipientAddress] = useState('');
  const [credentialType, setCredentialType] = useState('');
  const [credentialFiles, setCredentialFiles] = useState([]);
  const [loadingBackend, setLoadingBackend] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Wagmi hook for contract write operation
  const { execute: mintNFT, status: mintStatus, message: mintMessage, isLoading: mintLoading, isSuccess: mintSuccess } = useContractWrite('CredentialNFT', 'mintCredential');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!connectedIssuerAddress) {
      setMessage({ type: 'error', text: 'Please connect your wallet.' });
      return;
    }
    setLoadingBackend(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('issuerAddress', connectedIssuerAddress); // Backend needs this for auth check
      formData.append('recipientAddress', recipientAddress);
      formData.append('credentialType', credentialType);
      credentialFiles.forEach((file) => {
        formData.append('credentialFiles', file);
      });

      const backendResult = await prepareMintNFTCredential(formData);
      const tokenURI = backendResult.tokenURI;

      setMessage({ type: 'info', text: 'Metadata uploaded to IPFS. Confirming transaction in wallet...' });

      // Now call the smart contract directly from the frontend
      await mintNFT(recipientAddress, credentialType, tokenURI);

      // The useContractWrite hook will update status and message
      // No need for a separate success message here, it comes from the hook's useEffect
    } catch (error) {
      console.error("Error minting NFT credential:", error);
      setMessage({ type: 'error', text: error.response?.data?.message || error.message || "Failed to prepare credential for minting." });
    } finally {
      setLoadingBackend(false);
    }
  };

  useEffect(() => {
    if (mintSuccess) {
      setMessage({ type: 'success', text: mintMessage + ' Redirecting to dashboard...' });
      setTimeout(() => navigate('/issuer-dashboard'), 3000);
    } else if (mintStatus === 'error') {
      setMessage({ type: 'error', text: mintMessage });
    } else if (mintStatus === 'loading') {
      setMessage({ type: 'info', text: mintMessage });
    }
  }, [mintStatus, mintMessage, mintSuccess, navigate]);


  return (
        <div className="mint-nft-credential-form-page container">
      <h2>Mint New NFT Credential</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="recipientAddress">Recipient Wallet Address:</label>
          <input
            type="text"
            id="recipientAddress"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="e.g., 0x..."
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="credentialType">Credential Type:</label>
          <input
            type="text"
            id="credentialType"
            value={credentialType}
            onChange={(e) => setCredentialType(e.target.value)}
            placeholder="e.g., Bachelor of Science in CS"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="credentialFiles">Credential Files (e.g., PDF, Image):</label>
          <input
            type="file"
            id="credentialFiles"
            accept="image/*,application/pdf"
            multiple
            onChange={(e) => setCredentialFiles(Array.from(e.target.files))}
          />
        </div>
        <button type="submit" disabled={loadingBackend || mintLoading}>
          {(loadingBackend || mintLoading) ? 'Processing...' : 'Mint Credential'}
        </button>
      </form>
      {message.text && <p className={`message ${message.type}`}>{message.text}</p>}
      <button onClick={() => navigate('/issuer-dashboard')}>Back to Dashboard</button>
    </div>
  );
};

export default MintNFTCredentialForm;
