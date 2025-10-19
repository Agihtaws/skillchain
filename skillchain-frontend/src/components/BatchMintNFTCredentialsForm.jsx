// src/components/BatchMintNFTCredentialsForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { prepareBatchMintNFTCredentials } from '../api/api';
import { useContractWrite } from '../hooks/useContractWrite';

const BatchMintNFTCredentialsForm = () => {
  const navigate = useNavigate();
  const { address: connectedIssuerAddress } = useAccount();
  const [entries, setEntries] = useState([{ recipient: '', type: '', files: [] }]);
  const [loadingBackend, setLoadingBackend] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Wagmi hook for contract write operation
  const { execute: batchMintNFT, status: batchMintStatus, message: batchMintMessage, isLoading: batchMintLoading, isSuccess: batchMintSuccess } = useContractWrite('CredentialNFT', 'batchMintCredentials');

  const addEntry = () => {
    setEntries([...entries, { recipient: '', type: '', files: [] }]);
  };

  const removeEntry = (index) => {
    const newEntries = entries.filter((_, i) => i !== index);
    setEntries(newEntries);
  };

  const updateEntry = (index, field, value) => {
    const newEntries = [...entries];
    newEntries[index][field] = value;
    setEntries(newEntries);
  };

  const handleFileChange = (index, selectedFiles) => {
    const newEntries = [...entries];
    newEntries[index].files = Array.from(selectedFiles);
    setEntries(newEntries);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!connectedIssuerAddress) {
      setMessage({ type: 'error', text: 'Please connect your wallet.' });
      return;
    }
    if (entries.some(entry => !entry.recipient || !entry.type)) {
      setMessage({ type: 'error', text: 'All recipient addresses and credential types must be filled.' });
      return;
    }
    setLoadingBackend(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('issuerAddress', connectedIssuerAddress);
      formData.append('recipients', JSON.stringify(entries.map(e => e.recipient)));
      formData.append('credentialTypes', JSON.stringify(entries.map(e => e.type)));

      // Append files for each entry. Backend expects 'credentialFilesBatches' as an array of arrays.
      // This is a simplified approach, a robust solution might use a naming convention or a single CSV with IPFS hashes.
      entries.forEach((entry, index) => {
        entry.files.forEach(file => {
          formData.append(`credentialFilesBatches[${index}]`, file);
        });
      });

      const backendResult = await prepareBatchMintNFTCredentials(formData);
      const tokenURIs = backendResult.tokenURIs;

      setMessage({ type: 'info', text: 'Metadata uploaded to IPFS. Confirming transaction in wallet...' });

      // Now call the smart contract directly from the frontend
      const recipientsArray = entries.map(e => e.recipient);
      const typesArray = entries.map(e => e.type);
      await batchMintNFT(recipientsArray, typesArray, tokenURIs);

    } catch (error) {
      console.error("Error batch minting NFT credentials:", error);
      setMessage({ type: 'error', text: error.response?.data?.message || error.message || "Failed to prepare credentials for batch minting." });
    } finally {
      setLoadingBackend(false);
    }
  };

  useEffect(() => {
    if (batchMintSuccess) {
      setMessage({ type: 'success', text: batchMintMessage + ' Redirecting to dashboard...' });
      setTimeout(() => navigate('/issuer-dashboard'), 3000);
    } else if (batchMintStatus === 'error') {
      setMessage({ type: 'error', text: batchMintMessage });
    } else if (batchMintStatus === 'loading') {
      setMessage({ type: 'info', text: batchMintMessage });
    }
  }, [batchMintStatus, batchMintMessage, batchMintSuccess, navigate]);

  return (
        <div className="batch-mint-nft-form-page container">
      <h2>Batch Mint NFT Credentials</h2>
      <form onSubmit={handleSubmit}>
        {entries.map((entry, index) => (
          <div key={index} className="batch-entry">
            <h4>Credential #{index + 1}
              {entries.length > 1 && <button type="button" onClick={() => removeEntry(index)} className="remove-entry">Remove</button>}
            </h4>
            <div className="form-group">
              <label htmlFor={`recipient-${index}`}>Recipient Wallet Address:</label>
              <input
                type="text"
                id={`recipient-${index}`}
                value={entry.recipient}
                onChange={(e) => updateEntry(index, 'recipient', e.target.value)}
                placeholder="0x..."
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor={`type-${index}`}>Credential Type:</label>
              <input
                type="text"
                id={`type-${index}`}
                value={entry.type}
                onChange={(e) => updateEntry(index, 'type', e.target.value)}
                placeholder="e.g., Course Completion"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor={`files-${index}`}>Credential Files (Optional):</label>
              <input
                type="file"
                id={`files-${index}`}
                accept="image/*,application/pdf"
                multiple
                onChange={(e) => handleFileChange(index, e.target.files)}
              />
            </div>
          </div>
        ))}
        <button type="button" onClick={addEntry} style={{marginBottom: '1rem'}}>Add Another Credential</button>
        <br />
        <button type="submit" disabled={loadingBackend || batchMintLoading}>
          {(loadingBackend || batchMintLoading) ? 'Processing...' : 'Batch Mint Credentials'}
        </button>
      </form>
      {message.text && <p className={`message ${message.type}`}>{message.text}</p>}
      <button onClick={() => navigate('/issuer-dashboard')}>Back to Dashboard</button>
    </div>
  );
};

export default BatchMintNFTCredentialsForm;
