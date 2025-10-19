// src/components/AdminIssuerDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getIssuerDetails,
  verifyIssuer,
  updateReputationScore,
  updateVerificationLevel,
  deactivateIssuer,
  reactivateIssuer,
  removeIssuer,
} from '../api/api';
import { formatTimestamp, parseIpfsUrl, fetchIpfsJson } from '../utils/helpers';
import ConfirmationModal from './ConfirmationModal';

const AdminIssuerDetails = () => { // <<< Changed from IssuerDetails
  const { address } = useParams();
  const navigate = useNavigate();
  const [issuer, setIssuer] = useState(null);
  const [ipfsMetadata, setIpfsMetadata] = useState(null);
  const [loading, setLoading] = useState(true); // For initial page load
  const [message, setMessage] = useState({ type: '', text: '' });

  // Individual loading states for each action
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [updateReputationLoading, setUpdateReputationLoading] = useState(false);
  const [updateVerificationLevelLoading, setUpdateVerificationLevelLoading] = useState(false);
  const [deactivateLoading, setDeactivateLoading] = useState(false);
  const [reactivateLoading, setReactivateLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);

  // Form states for actions
  const [newVerificationLevel, setNewVerificationLevel] = useState('');
  const [newReputationScore, setNewReputationScore] = useState('');

  // State for confirmation modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    confirmButtonClass: 'button-primary'
  });

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const details = await getIssuerDetails(address);
      setIssuer(details);

      if (details && details.metadataURI) { // Check if details exist before accessing metadataURI
        const metadata = await fetchIpfsJson(details.metadataURI);
        setIpfsMetadata(metadata);
      } else {
        setIpfsMetadata(null); // Clear metadata if not present
      }
    } catch (error) {
      console.error("Error fetching issuer details:", error);
      setMessage({ type: 'error', text: error.response?.data?.message || error.message || "Failed to fetch issuer details." });
      setIssuer(null); // Ensure issuer is null on error to show "not found"
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [address]);

  // Unified action handler for all contract interactions
  const handleAction = async (actionFn, setLoadingFn, redirectOnSuccess, ...args) => {
    setLoadingFn(true); // Set specific action loading to true
    setMessage({ type: '', text: '' }); // Clear previous messages
    try {
      const result = await actionFn(...args);
      setMessage({ type: 'success', text: result.message || 'Action successful!' });
      if (redirectOnSuccess) {
        setTimeout(() => navigate('/'), 1500); // Redirect after a short delay
      } else {
        await fetchDetails(); // Refresh details after action
      }
    } catch (error) {
      console.error("Error performing action:", error);
      setMessage({ type: 'error', text: error.response?.data?.message || error.message || "Failed to perform action." });
    } finally {
      setLoadingFn(false); // Reset specific action loading
      setIsModalOpen(false); // Close modal after action attempt
    }
  };

  const openConfirmationModal = (title, message, onConfirm, confirmText, confirmButtonClass) => {
    setModalContent({ title, message, onConfirm, confirmText, confirmButtonClass });
    setIsModalOpen(true);
  };

  const closeConfirmationModal = () => {
    setIsModalOpen(false);
  };

  if (loading) return <div className="container">Loading issuer details...</div>;
  if (!issuer) return <div className="container message error">Issuer not found or error loading.</div>;

  return (
        <div className="admin-issuer-details-page container">
      <h2>Issuer Details</h2>
      {message.text && <p className={`message ${message.type}`}>{message.text}</p>}

      <div className="details-section">
        <h3>Basic Information</h3>
        <p><strong>Address:</strong> {issuer.issuerAddress}</p>
        <p><strong>University Name:</strong> {issuer.universityName}</p>
        <p><strong>Is Verified:</strong> {issuer.isVerified ? 'Yes' : 'No'}</p>
        <p><strong>Is Active:</strong> {issuer.isActive ? 'Yes' : 'No'}</p>
        <p><strong>Registration Date:</strong> {formatTimestamp(issuer.registrationDate)}</p>
        <p><strong>Verification Level:</strong> {issuer.verificationLevel}</p>
        <p><strong>Reputation Score:</strong> {issuer.reputationScore}</p>
        <p><strong>Metadata URI:</strong> {issuer.metadataURI || 'N/A'}</p>

        {ipfsMetadata && (
          <>
            <p><strong>College Physical Address:</strong> {ipfsMetadata.collegeAddress || 'N/A'}</p>
            {ipfsMetadata.logo && (
              <div>
                <strong>Logo:</strong>
                <img src={parseIpfsUrl(ipfsMetadata.logo)} alt={`${issuer.universityName} Logo`} className="issuer-images-logo" style={{maxWidth: '100px', maxHeight: '100px', objectFit: 'contain'}} />
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

      <h3>Admin Actions</h3>

      {/* Verify Issuer */}
      {!issuer.isVerified && (
        <div className="action-card">
          <h4>Verify Issuer</h4>
          <input
            type="number"
            min="1"
            max="5"
            placeholder="Verification Level (1-5)"
            value={newVerificationLevel}
            onChange={(e) => setNewVerificationLevel(e.target.value)}
            disabled={verifyLoading}
          />
          <button
            onClick={() => handleAction(verifyIssuer, setVerifyLoading, false, address, parseInt(newVerificationLevel))}
            disabled={verifyLoading || !newVerificationLevel}
          >
            {verifyLoading ? 'Verifying...' : 'Verify Issuer'}
          </button>
        </div>
      )}

      {/* Update Reputation Score */}
      <div className="action-card">
        <h4>Update Reputation Score</h4>
        <input
          type="number"
          min="0"
          max="100"
          placeholder="New Score (0-100)"
          value={newReputationScore}
          onChange={(e) => setNewReputationScore(e.target.value)}
          disabled={updateReputationLoading}
        />
        <button
          onClick={() => handleAction(updateReputationScore, setUpdateReputationLoading, false, address, parseInt(newReputationScore))}
          disabled={updateReputationLoading || !newReputationScore}
        >
          {updateReputationLoading ? 'Updating...' : 'Update Score'}
        </button>
      </div>

      {/* Update Verification Level */}
      {issuer.isVerified && (
        <div className="action-card">
          <h4>Update Verification Level</h4>
          <input
            type="number"
            min="1"
            max="5"
            placeholder="New Level (1-5)"
            value={newVerificationLevel}
            onChange={(e) => setNewVerificationLevel(e.target.value)}
            disabled={updateVerificationLevelLoading}
          />
          <button
            onClick={() => handleAction(updateVerificationLevel, setUpdateVerificationLevelLoading, false, address, parseInt(newVerificationLevel))}
            disabled={updateVerificationLevelLoading || !newVerificationLevel}
          >
            {updateVerificationLevelLoading ? 'Updating...' : 'Update Level'}
          </button>
        </div>
      )}

      {/* Deactivate / Reactivate Issuer */}
      <div className="action-card">
        <h4>Change Active Status</h4>
        {issuer.isActive ? (
          <button
            onClick={() => openConfirmationModal(
              'Deactivate Issuer',
              `Are you sure you want to deactivate ${issuer.universityName}? This will make the issuer inactive.`,
              () => handleAction(deactivateIssuer, setDeactivateLoading, false, address),
              'Deactivate',
              'button-danger'
            )}
            disabled={deactivateLoading}
          >
            {deactivateLoading ? 'Deactivating...' : 'Deactivate Issuer'}
          </button>
        ) : (
          <button
            onClick={() => openConfirmationModal(
              'Reactivate Issuer',
              `Are you sure you want to reactivate ${issuer.universityName}? This will make the issuer active again.`,
              () => handleAction(reactivateIssuer, setReactivateLoading, false, address),
              'Reactivate',
              'button-primary'
            )}
            disabled={reactivateLoading}
          >
            {reactivateLoading ? 'Reactivating...' : 'Reactivate Issuer'}
          </button>
        )}
      </div>

      {/* Remove Issuer */}
      <div className="action-card">
        <h4>Remove Issuer</h4>
        <p>This will set the issuer as inactive, unverified, and remove it from the unique registered list.</p>
        <button
          onClick={() => openConfirmationModal(
            'Remove Issuer Permanently',
            `WARNING: This action will permanently remove ${issuer.universityName} from the active registry. This action cannot be undone.`,
            () => handleAction(removeIssuer, setRemoveLoading, true, address), // Redirect to dashboard after removal
            'Remove Permanently',
            'button-danger'
          )}
          disabled={removeLoading}
          style={{backgroundColor: 'var(--error-color)', borderColor: 'var(--error-color)'}}
        >
          {removeLoading ? 'Removing...' : 'Remove Issuer'}
        </button>
      </div>

      {/* "Back to Dashboard" button at the very bottom */}
      <div className="button-group" style={{ marginTop: '2rem' }}>
        <button onClick={() => navigate('/')}>Back to Dashboard</button>
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        title={modalContent.title}
        message={modalContent.message}
        onConfirm={modalContent.onConfirm}
        onCancel={closeConfirmationModal}
        confirmText={modalContent.confirmText}
        confirmButtonClass={modalContent.confirmButtonClass}
      />
    </div>
  );
};

export default AdminIssuerDetails; // <<< Changed from IssuerDetails
