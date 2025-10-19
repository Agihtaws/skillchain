// src/components/PublicVerifier.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFullVerificationDetails, getPublicVerificationDetails, getVerificationHistory } from '../api/api';
import { formatTimestamp, shortenAddress, parseIpfsUrl, fetchIpfsJson } from '../utils/helpers';
import QRCode from "react-qr-code";
import { ethers } from 'ethers';

 // For displaying QR code if generated elsewhere

const PublicVerifier = () => {
  const { id: urlId } = useParams();
  const navigate = useNavigate();
  const [credentialId, setCredentialId] = useState(urlId || '');
  const [verificationResult, setVerificationResult] = useState(null);
  const [fullDetails, setFullDetails] = useState(null);
  const [issuerInfo, setIssuerInfo] = useState(null); // Issuer details from IssuerRegistry
  const [ipfsMetadata, setIpfsMetadata] = useState(null); // Credential metadata from IPFS
  const [verificationHistory, setVerificationHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleVerify = async (e) => {
    e?.preventDefault(); // Prevent form default if called from form
    if (!credentialId) {
      setError("Please enter a credential ID.");
      return;
    }
    setLoading(true);
    setError('');
    setVerificationResult(null);
    setFullDetails(null);
    setIssuerInfo(null);
    setIpfsMetadata(null);
    setVerificationHistory([]);
    setMessage({ type: '', text: '' });

    try {
      // First, get public details (respects recipient's privacy settings)
      const publicRes = await getPublicVerificationDetails(credentialId);
      setVerificationResult(publicRes);

      if (!publicRes.isValid) {
        setError("Credential is not valid or does not exist.");
        setLoading(false);
        return;
      }

      // Then, get full details (for more comprehensive info about issuer/credential)
      const fullRes = await getFullVerificationDetails(credentialId);
      setFullDetails(fullRes);

      // Fetch IPFS metadata for the credential
      if (fullRes.tokenURI) { // tokenURI is always available in full details
        const metadata = await fetchIpfsJson(fullRes.tokenURI);
        setIpfsMetadata(metadata);
      }

      // Fetch verification history
      const history = await getVerificationHistory(credentialId);
      setVerificationHistory(history);

      setMessage({ type: 'success', text: 'Credential verified successfully!' });

    } catch (err) {
      console.error("Error verifying credential:", err);
      setError(err.response?.data?.message || err.message || "Failed to verify credential. It might not exist or there was a network error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlId) {
      setCredentialId(urlId);
      handleVerify(); // Auto-verify if ID is in URL
    }
  }, [urlId]); // Only run once on mount if urlId exists


  return (
    <div className="public-verifier-container">
      <h2>Public Credential Verifier</h2>
      <p>Enter a credential ID to verify its authenticity.</p>

      <form onSubmit={handleVerify}>
        <div className="form-group">
          <label htmlFor="credentialId">Credential ID:</label>
          <input
            type="text"
            id="credentialId"
            value={credentialId}
            onChange={(e) => setCredentialId(e.target.value)}
            placeholder="Enter Credential ID (e.g., 1, 2, ...)"
            required
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading || !credentialId}>
          {loading ? 'Verifying...' : 'Verify Credential'}
        </button>
      </form>

      {error && <p className="message error">{error}</p>}
      {message.text && <p className={`message ${message.type}`}>{message.text}</p>}

      {verificationResult && (
        <div className="details-section">
          <h3>Verification Result (Public View)</h3>
          <p><strong>Credential Valid:</strong> {verificationResult.isValid ? 'Yes' : 'No'}</p>
          <p><strong>Recipient Address:</strong> {verificationResult.recipient !== ethers.ZeroAddress ? shortenAddress(verificationResult.recipient) : 'Hidden by recipient'}</p>
          <p><strong>Issuer Address:</strong> {verificationResult.issuer !== ethers.ZeroAddress ? shortenAddress(verificationResult.issuer) : 'Hidden by recipient'}</p>
          <p><strong>Credential Type:</strong> {verificationResult.credentialType || 'Hidden by recipient'}</p>
          <p><strong>Mint Date:</strong> {verificationResult.mintDate > 0 ? formatTimestamp(verificationResult.mintDate) : 'Hidden by recipient'}</p>
          <p><strong>Issuer Name:</strong> {verificationResult.issuerName || 'Hidden by recipient'}</p>
          <p><strong>Issuer Verified:</strong> {verificationResult.issuerVerified ? 'Yes' : 'No'}</p>
        </div>
      )}

      {fullDetails && (
        <div className="details-section">
          <h3>Full Details (Backend Fetched)</h3>
          <p><strong>Recipient Address (Full):</strong> {shortenAddress(fullDetails.recipient)}</p>
          <p><strong>Issuer Address (Full):</strong> {shortenAddress(fullDetails.issuer)}</p>
          <p><strong>Issuer Name (Full):</strong> {fullDetails.issuerName}</p>
          <p><strong>Issuer Active:</strong> {fullDetails.issuerActive ? 'Yes' : 'No'}</p>
          <p><strong>Issuer Reputation Score:</strong> {fullDetails.issuerReputationScore}</p>
          <p><strong>Issuer Verification Level:</strong> {fullDetails.verificationLevel}</p>
          <p><strong>Credential Type (Full):</strong> {fullDetails.credentialType}</p>
          <p><strong>Mint Date (Full):</strong> {formatTimestamp(fullDetails.mintDate)}</p>
          <p><strong>Token/Metadata URI:</strong> {fullDetails.tokenURI || 'N/A'}</p>

          {ipfsMetadata && ipfsMetadata.files && ipfsMetadata.files.length > 0 && (
            <div className="credential-display" style={{marginTop: '1.5rem'}}>
              <h4>Credential Content Preview</h4>
              <img src={parseIpfsUrl(ipfsMetadata.files[0])} alt="Credential Preview" style={{maxWidth: '300px', maxHeight: '200px', objectFit: 'contain'}} />
            </div>
          )}
        </div>
      )}

      {verificationHistory.length > 0 && (
        <div className="details-section">
          <h3>Verification History</h3>
          {verificationHistory.map((entry, index) => (
            <p key={index}>
              Verifier: {shortenAddress(entry.verifier)},
              Timestamp: {formatTimestamp(entry.timestamp)},
              Successful: {entry.successful ? 'Yes' : 'No'}
            </p>
          ))}
        </div>
      )}

      {/* Link to go back or home, if needed */}
      <div className="button-group" style={{ marginTop: '2rem' }}>
        <button onClick={() => navigate('/')}>Go to Home</button>
      </div>
    </div>
  );
};

export default PublicVerifier;
