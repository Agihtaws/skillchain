// src/components/StudentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { getCombinedRecipientCredentials } from '../api/api';
import { formatTimestamp, shortenAddress, parseIpfsUrl, fetchIpfsJson } from '../utils/helpers';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { address: connectedStudentAddress } = useAccount();
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCredentials = async () => {
    if (!connectedStudentAddress) {
      setError("Wallet not connected.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const fetchedCredentials = await getCombinedRecipientCredentials(connectedStudentAddress);

      // Fetch IPFS metadata for each credential
      const credentialsWithMetadata = await Promise.all(
        fetchedCredentials.map(async (cred) => {
          const uri = cred.type === 'nft' ? cred.tokenURI : cred.metadataURI;
          let ipfsMetadata = null;
          if (uri) {
            ipfsMetadata = await fetchIpfsJson(uri);
          }
          return { ...cred, ipfsMetadata };
        })
      );
      // Sort by most recent first
      credentialsWithMetadata.sort((a, b) => {
        const dateA = parseInt(a.mintDate || a.issueDate);
        const dateB = parseInt(b.mintDate || b.issueDate);
        return dateB - dateA;
      });

      setCredentials(credentialsWithMetadata);

    } catch (err) {
      console.error("Error fetching student credentials:", err);
      setError(err.response?.data?.message || err.message || "Failed to fetch credentials.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, [connectedStudentAddress]);

  if (loading) return <div className="container">Loading your credentials...</div>;
  if (error) return <div className="container message error">{error}</div>;

  return (
    <div className="container">
      {/* New wrapper div for the heading and refresh button */}
      <div className="dashboard-header-controls">
        <h2>My Credentials</h2>
        
        <button onClick={fetchCredentials} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Credentials'}
        </button>
      </div>

      <h3>My Received Credentials ({credentials.length})</h3>
      {credentials.length === 0 && <p className="message info">You have not received any credentials yet.</p>}

      <div className="grid-container">
        {credentials.map((cred) => (
          <div
            key={cred.type === 'nft' ? cred.id : cred.id}
            className="card"
            onClick={() => navigate(`/my-credentials/${cred.type}/${cred.id}`)}
          >
            {cred.ipfsMetadata?.files?.[0] ? (
              <img src={parseIpfsUrl(cred.ipfsMetadata.files[0])} alt="Credential Image" className="card-image" />
            ) : (
              <div className="card-image" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888'}}>No Preview</div>
            )}
            <h3>{cred.credentialType || cred.degreeName}</h3>
            <p>Type: {cred.type === 'nft' ? 'NFT Credential' : 'General Credential'}</p>
            <p>ID: {shortenAddress(cred.id)}</p>
            <p>Issuer: {shortenAddress(cred.issuer)}</p>
            <p>Valid: {cred.type === 'nft' ? (cred.isValid ? 'Yes' : 'No') : (!cred.isRevoked ? 'Yes' : 'No')}</p>
            <p>Date: {formatTimestamp(cred.mintDate || cred.issueDate)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentDashboard;
