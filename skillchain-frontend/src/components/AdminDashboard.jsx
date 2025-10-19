// src/components/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllIssuers, getTotalIssuersCount } from '../api/api';
import { parseIpfsUrl, fetchIpfsJson } from '../utils/helpers';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [issuers, setIssuers] = useState([]);
  const [totalIssuers, setTotalIssuers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'verified'
  const [searchTerm, setSearchTerm] = useState('');

  const fetchIssuers = async () => {
    setLoading(true);
    setError('');
    try {
      let fetchedIssuers = await getAllIssuers(); // Fetch all to allow client-side filtering/searching
      setTotalIssuers(await getTotalIssuersCount());

      // Fetch IPFS metadata for each issuer
      const issuersWithMetadata = await Promise.all(
        fetchedIssuers.map(async (issuer) => {
          if (issuer.metadataURI) {
            const metadata = await fetchIpfsJson(issuer.metadataURI);
            return { ...issuer, ipfsMetadata: metadata };
          }
          return issuer;
        })
      );
      setIssuers(issuersWithMetadata);

    } catch (err) {
      console.error("Error fetching issuers:", err);
      setError(err.response?.data?.message || err.message || "Failed to fetch issuers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssuers();
  }, []);

  const filteredIssuers = issuers.filter(issuer => {
    // Filter by status
    if (filter === 'active' && !issuer.isActive) return false;
    if (filter === 'verified' && !issuer.isVerified) return false;

    // Filter by search term
    if (searchTerm && !issuer.universityName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !issuer.issuerAddress.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
        <div className="admin-dashboard-page container">
      <h2>Admin Dashboard</h2>
      {error && <p className="message error">{error}</p>}

            <div className="admin-controls-top">
        <button onClick={() => navigate('/add-issuer')}>Add New Issuer</button>
        <p>Total Registered Issuers: <strong>{totalIssuers}</strong></p>
      </div>


            <div className="admin-filter-search-group">
        <input
          type="text"
          placeholder="Search by name or address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-search"
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="select-filter">
          <option value="all">All Issuers</option>
          <option value="active">Active Issuers</option>
          <option value="verified">Verified Issuers</option>
        </select>
        <button onClick={fetchIssuers} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh List'}
        </button>
      </div>


      {loading && <p>Loading issuers...</p>}
      {!loading && filteredIssuers.length === 0 && <p>No issuers found matching your criteria.</p>}

      <div className="grid-container">
        {filteredIssuers.map((issuer) => (
          <div key={issuer.issuerAddress} className="card" onClick={() => navigate(`/admin-issuer/${issuer.issuerAddress}`)}>
            {issuer.ipfsMetadata?.logo ? (
              <img src={parseIpfsUrl(issuer.ipfsMetadata.logo)} alt={`${issuer.universityName} Logo`} className="card-image" />
            ) : (
              <div className="card-image" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888'}}>No Logo</div>
            )}
            <h3>{issuer.universityName}</h3>
            <p>Address: {issuer.issuerAddress}</p>
            <p>Verified: {issuer.isVerified ? 'Yes' : 'No'}</p>
            <p>Active: {issuer.isActive ? 'Yes' : 'No'}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
