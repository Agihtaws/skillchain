// src/components/IssuerProfile.jsx
import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { getIssuerDetails } from '../api/api';
import { formatTimestamp, parseIpfsUrl, fetchIpfsJson } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';

const IssuerProfile = () => {
  const navigate = useNavigate();
  const { address: connectedAddress } = useAccount();
  const [issuerProfile, setIssuerProfile] = useState(null);
  const [ipfsMetadata, setIpfsMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  console.log("IssuerProfile: Component rendered.");

  useEffect(() => {
    const fetchProfile = async () => {
      console.log("IssuerProfile: fetchProfile called. Connected Address:", connectedAddress);
      if (!connectedAddress) {
        console.log("IssuerProfile: Wallet not connected, setting error and loading to false.");
        setError("Wallet not connected.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        console.log("IssuerProfile: Calling getIssuerDetails with address:", connectedAddress);
        const details = await getIssuerDetails(connectedAddress);
        console.log("IssuerProfile: Received issuer details:", details);
        setIssuerProfile(details);

        if (details && details.metadataURI) {
          console.log("IssuerProfile: Fetching IPFS metadata from URI:", details.metadataURI);
          const metadata = await fetchIpfsJson(details.metadataURI);
          console.log("IssuerProfile: Received IPFS metadata:", metadata);
          setIpfsMetadata(metadata);
        } else {
          console.log("IssuerProfile: No metadataURI found or details are null.");
          setIpfsMetadata(null);
        }
      } catch (err) {
        console.error("IssuerProfile: Error fetching issuer profile:", err);
        setError(err.response?.data?.message || err.message || "Failed to fetch issuer profile.");
        setIssuerProfile(null);
      } finally {
        setLoading(false);
        console.log("IssuerProfile: Loading set to false.");
      }
    };
    fetchProfile();
  }, [connectedAddress]);

  if (loading) {
    console.log("IssuerProfile: Displaying loading message.");
    return <div className="container">Loading issuer profile...</div>;
  }
  if (error) {
    console.log("IssuerProfile: Displaying error message:", error);
    return <div className="container message error">{error}</div>;
  }
  if (!issuerProfile) {
    console.log("IssuerProfile: No issuer profile found, displaying info message.");
    return <div className="container message info">No issuer profile found for your connected address.</div>;
  }

  return (
        <div className="issuer-profile-page container">
      <h2>My Issuer Profile</h2>
      <div className="details-section">
        <h3>Information</h3>
        <p><strong>Address:</strong> {issuerProfile.issuerAddress}</p>
        <p><strong>University Name:</strong> {issuerProfile.universityName}</p>
        <p><strong>Is Verified:</strong> {issuerProfile.isVerified ? 'Yes' : 'No'}</p>
        <p><strong>Is Active:</strong> {issuerProfile.isActive ? 'Yes' : 'No'}</p>
        <p><strong>Registration Date:</strong> {formatTimestamp(issuerProfile.registrationDate)}</p>
        <p><strong>Verification Level:</strong> {issuerProfile.verificationLevel}</p>
        <p><strong>Reputation Score:</strong> {issuerProfile.reputationScore}</p>
        <p><strong>Metadata URI:</strong> {issuerProfile.metadataURI || 'N/A'}</p>

        {ipfsMetadata && (
          <>
            <p><strong>College Physical Address:</strong> {ipfsMetadata.collegeAddress || 'N/A'}</p>
            {ipfsMetadata.logo && (
              <div>
                <strong>Logo:</strong>
                <img src={parseIpfsUrl(ipfsMetadata.logo)} alt="Issuer Logo" className="issuer-images-logo" style={{maxWidth: '100px', maxHeight: '100px', objectFit: 'contain'}} />
              </div>
            )}
            {ipfsMetadata.images && ipfsMetadata.images.length > 0 && (
              <div>
                <strong>Additional Images:</strong>
                <div className="issuer-images">
                  {ipfsMetadata.images.map((img, index) => (
                    <img key={index} src={parseIpfsUrl(img)} alt={`Issuer Image ${index + 1}`} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <div className="button-group">
        <button onClick={() => {
          console.log("IssuerProfile: Navigating back to /issuer-dashboard");
          navigate('/issuer-dashboard');
        }}>Back to Dashboard</button>
      </div>
    </div>
  );
};

export default IssuerProfile;
