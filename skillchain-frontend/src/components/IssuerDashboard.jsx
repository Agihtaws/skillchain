// src/components/IssuerDashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { getIssuerNFTCredentials, getIssuerGeneralCredentials, getNFTCredentialDetails, getGeneralCredentialDetails } from '../api/api';
import { formatTimestamp, shortenAddress, parseIpfsUrl, fetchIpfsJson } from '../utils/helpers';

const IssuerDashboard = () => {
  const navigate = useNavigate();
  const { address: connectedAddress } = useAccount();
  const [nftCredentials, setNftCredentials] = useState([]);
  const [generalCredentials, setGeneralCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'nft', 'general'
  const [searchTerm, setSearchTerm] = useState('');

  console.log("IssuerDashboard: Component rendered.");

  const fetchCredentials = async () => {
    console.log("IssuerDashboard: fetchCredentials called.");
    if (!connectedAddress) {
      console.log("IssuerDashboard: Wallet not connected, setting error and loading to false.");
      setError("Wallet not connected.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    console.log("IssuerDashboard: Attempting to fetch credentials for address:", connectedAddress);
    try {
      // Fetch NFT Credentials
      const nftTokenIds = await getIssuerNFTCredentials(connectedAddress);
      console.log("IssuerDashboard: Fetched NFT Token IDs:", nftTokenIds);
      const fetchedNftCredentials = await Promise.all(
        nftTokenIds.map(async (tokenId) => {
          const details = await getNFTCredentialDetails(tokenId);
          let ipfsMetadata = null;
          if (details.tokenURI) {
            ipfsMetadata = await fetchIpfsJson(details.tokenURI);
          }
          return { ...details, type: 'nft', ipfsMetadata };
        })
      );
      setNftCredentials(fetchedNftCredentials);
      console.log("IssuerDashboard: Fetched NFT Credentials:", fetchedNftCredentials);


      // Fetch General Credentials
      const generalCredentialIds = await getIssuerGeneralCredentials(connectedAddress);
      console.log("IssuerDashboard: Fetched General Credential IDs:", generalCredentialIds);
      const fetchedGeneralCredentials = await Promise.all(
        generalCredentialIds.map(async (credentialId) => {
          const details = await getGeneralCredentialDetails(credentialId);
          let ipfsMetadata = null;
          if (details.metadataURI) {
            ipfsMetadata = await fetchIpfsJson(details.metadataURI);
          }
          return { ...details, type: 'general', ipfsMetadata };
        })
      );
      setGeneralCredentials(fetchedGeneralCredentials);
      console.log("IssuerDashboard: Fetched General Credentials:", fetchedGeneralCredentials);

    } catch (err) {
      console.error("IssuerDashboard: Error fetching issuer credentials:", err);
      setError(err.response?.data?.message || err.message || "Failed to fetch credentials.");
    } finally {
      setLoading(false);
      console.log("IssuerDashboard: Loading set to false.");
    }
  };

  useEffect(() => {
    console.log("IssuerDashboard: useEffect triggered. Connected Address:", connectedAddress);
    fetchCredentials();
  }, [connectedAddress]);

  // Combine and filter credentials based on type and search term
  const allCredentials = useMemo(() => {
    const combined = [...nftCredentials, ...generalCredentials];

    let filtered = combined;

    // Filter by type
    if (filterType === 'nft') {
      filtered = filtered.filter(cred => cred.type === 'nft');
    } else if (filterType === 'general') {
      filtered = filtered.filter(cred => cred.type === 'general');
    }

    // Filter by search term (recipient address)
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(cred =>
        (cred.recipient && cred.recipient.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }

    // Sort by most recent first
    return filtered.sort((a, b) => {
      const dateA = parseInt(a.mintDate || a.issueDate);
      const dateB = parseInt(b.mintDate || b.issueDate);
      return dateB - dateA;
    });
  }, [nftCredentials, generalCredentials, filterType, searchTerm]);


  if (loading) {
    console.log("IssuerDashboard: Displaying loading message.");
    return <div className="dashboard-content-container">Loading your credentials...</div>;
  }
  if (error) {
    console.log("IssuerDashboard: Displaying error message:", error);
    return <div className="dashboard-content-container message error">{error}</div>;
  }

  return (
    <div className="dashboard-content-container"> {/* This div will be the main content area */}
      <div className="dashboard-header-controls">
        <h2>My Issued Credentials</h2>
        <button onClick={fetchCredentials} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Credentials'}
        </button>
      </div>

      <div className="filter-and-search-group" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {/* Filter by Type */}
        <div className="form-group" style={{ flex: 1 }}>
          <label htmlFor="credentialTypeFilter">Filter by Type:</label>
          <select
            id="credentialTypeFilter"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="select-filter"
          >
            <option value="all">All Credentials</option>
            <option value="nft">NFT Credentials</option>
            <option value="general">General Credentials</option>
          </select>
        </div>

        {/* Search by Recipient Address */}
        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="searchRecipient">Search by Recipient Address:</label>
          <input
            type="text"
            id="searchRecipient"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search recipient address (e.g., 0x...)"
            className="input-search"
          />
        </div>
      </div>

      <h3>My Issued Credentials ({allCredentials.length})</h3> {/* This h3 is for the list, the previous h2 is the page title */}
      {allCredentials.length === 0 && <p className="message info">No credentials found matching your criteria.</p>}

      <div className="grid-container">
        {allCredentials.map((cred) => (
          <div
            key={`${cred.type}-${cred.tokenId || cred.credentialId}`}
            className="card"
            onClick={() => navigate(`/my-credential/${cred.type}/${cred.type === 'nft' ? cred.tokenId : cred.credentialId}`)}
          >
            {cred.ipfsMetadata?.files?.[0] ? (
              <img src={parseIpfsUrl(cred.ipfsMetadata.files[0])} alt="Credential Image" className="card-image" />
            ) : (
              <div className="card-image" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888'}}>No Preview</div>
            )}
            <h3>{cred.credentialType || cred.degreeName}</h3>
            <p>Type: {cred.type === 'nft' ? 'NFT Credential' : 'General Credential'}</p>
            <p>ID: {shortenAddress(cred.tokenId || cred.credentialId)}</p>
            <p>Recipient: {shortenAddress(cred.recipient)}</p>
            <p>Valid: {cred.isValid === undefined ? (!cred.isRevoked ? 'Yes' : 'No') : (cred.isValid ? 'Yes' : 'No')}</p>
            <p>Date: {formatTimestamp(cred.mintDate || cred.issueDate)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IssuerDashboard;
