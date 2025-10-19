// src/components/IssueGeneralCredentialForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { prepareIssueGeneralCredential } from '../api/api';
import { useContractWrite } from '../hooks/useContractWrite';

const IssueGeneralCredentialForm = () => {
  const navigate = useNavigate();
  const { address: connectedIssuerAddress } = useAccount();
  const [recipientAddress, setRecipientAddress] = useState('');
  const [degreeName, setDegreeName] = useState('');
  const [credentialFiles, setCredentialFiles] = useState([]);
  const [loadingBackend, setLoadingBackend] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Wagmi hook for contract write operation
  const { execute: issueGeneral, status: issueStatus, message: issueMessage, isLoading: issueLoading, isSuccess: issueSuccess } = useContractWrite('CredentialRegistry', 'issueCredential');

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
      formData.append('degreeName', degreeName);
      credentialFiles.forEach((file) => {
        formData.append('credentialFiles', file);
      });

      const backendResult = await prepareIssueGeneralCredential(formData);
      const metadataURI = backendResult.metadataURI;

      setMessage({ type: 'info', text: 'Metadata uploaded to IPFS. Confirming transaction in wallet...' });

      // Now call the smart contract directly from the frontend
      await issueGeneral(recipientAddress, degreeName, metadataURI);

    } catch (error) {
      console.error("Error issuing general credential:", error);
      setMessage({ type: 'error', text: error.response?.data?.message || error.message || "Failed to prepare general credential for issuing." });
    } finally {
      setLoadingBackend(false);
    }
  };

  useEffect(() => {
    if (issueSuccess) {
      setMessage({ type: 'success', text: issueMessage + ' Redirecting to dashboard...' });
      setTimeout(() => navigate('/issuer-dashboard'), 3000);
    } else if (issueStatus === 'error') {
      setMessage({ type: 'error', text: issueMessage });
    } else if (issueStatus === 'loading') {
      setMessage({ type: 'info', text: issueMessage });
    }
  }, [issueStatus, issueMessage, issueSuccess, navigate]);

  return (
        <div className="issue-general-credential-form-page container">
      <h2>Issue New General Credential</h2>
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
          <label htmlFor="degreeName">Degree/Credential Name:</label>
          <input
            type="text"
            id="degreeName"
            value={degreeName}
            onChange={(e) => setDegreeName(e.target.value)}
            placeholder="e.g., Master of Arts in History"
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
        <button type="submit" disabled={loadingBackend || issueLoading}>
          {(loadingBackend || issueLoading) ? 'Processing...' : 'Issue Credential'}
        </button>
      </form>
      {message.text && <p className={`message ${message.type}`}>{message.text}</p>}
      <button onClick={() => navigate('/issuer-dashboard')}>Back to Dashboard</button>
    </div>
  );
};

export default IssueGeneralCredentialForm;
