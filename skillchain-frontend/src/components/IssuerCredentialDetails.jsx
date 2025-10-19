// src/components/IssuerCredentialDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { getNFTCredentialDetails, getGeneralCredentialDetails } from '../api/api';
import { useContractWrite } from '../hooks/useContractWrite';
import { formatTimestamp, shortenAddress, parseIpfsUrl, fetchIpfsJson } from '../utils/helpers';
import ConfirmationModal from './ConfirmationModal';

const IssuerCredentialDetails = () => {
  const navigate = useNavigate();
  const { type, id } = useParams(); // 'nft' or 'general'
  const { address: connectedIssuerAddress } = useAccount();
  const [credential, setCredential] = useState(null);
  const [ipfsMetadata, setIpfsMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' }); // Added message state

  // Wagmi hook for revoke operation
  const { execute: revokeNFT, status: revokeNFTStatus, message: revokeNFTMessage, isLoading: revokeNFTLoading, isSuccess: revokeNFTSuccess } = useContractWrite('CredentialNFT', 'revokeCredential');
  const { execute: revokeGeneral, status: revokeGeneralStatus, message: revokeGeneralMessage, isLoading: revokeGeneralLoading, isSuccess: revokeGeneralSuccess } = useContractWrite('CredentialRegistry', 'revokeCredential');

  // State for confirmation modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    confirmButtonClass: 'button-primary'
  });

  const fetchCredentialDetails = async () => {
    if (!connectedIssuerAddress) {
      setError("Wallet not connected.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      let details = null;
      if (type === 'nft') {
        details = await getNFTCredentialDetails(id);
      } else if (type === 'general') {
        details = await getGeneralCredentialDetails(id);
      } else {
        throw new Error("Invalid credential type.");
      }

      // Check if the connected user is the issuer of this credential
      if (details && details.issuer.toLowerCase() !== connectedIssuerAddress.toLowerCase()) {
          setError("You are not the issuer of this credential.");
          setCredential(null);
          return;
      }

      setCredential(details);

      if (details && (details.tokenURI || details.metadataURI)) {
        const metadata = await fetchIpfsJson(details.tokenURI || details.metadataURI);
        setIpfsMetadata(metadata);
      } else {
        setIpfsMetadata(null);
      }
    } catch (err) {
      console.error("Error fetching credential details:", err);
      setError(err.response?.data?.message || err.message || "Failed to fetch credential details.");
      setCredential(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentialDetails();
  }, [type, id, connectedIssuerAddress]); // Re-fetch if type/id or connected address changes

  const handleRevoke = async () => {
    setIsModalOpen(false); // Close modal immediately
    setError(''); // Clear previous error
    setMessage({ type: 'info', text: 'Confirming revocation in wallet...' });

    try {
      if (type === 'nft') {
        await revokeNFT(BigInt(id)); // Pass BigInt for tokenId
      } else if (type === 'general') {
        await revokeGeneral(BigInt(id)); // Pass BigInt for credentialId
      }
    } catch (err) {
      console.error("Error initiating revoke:", err);
      setMessage({ type: 'error', text: err.message || "Failed to initiate revocation." });
    }
  };

  useEffect(() => {
    const currentStatus = type === 'nft' ? revokeNFTStatus : revokeGeneralStatus;
    const currentMessage = type === 'nft' ? revokeNFTMessage : revokeGeneralMessage;
    const currentSuccess = type === 'nft' ? revokeNFTSuccess : revokeGeneralSuccess;

    if (currentSuccess) {
      setMessage({ type: 'success', text: currentMessage + ' Refreshing details...' });
      setTimeout(() => fetchCredentialDetails(), 2000); // Refresh after revoke
    } else if (currentStatus === 'error') {
      setMessage({ type: 'error', text: currentMessage });
    } else if (currentStatus === 'loading') {
      setMessage({ type: 'info', text: currentMessage });
    }
  }, [revokeNFTStatus, revokeNFTMessage, revokeNFTSuccess, revokeGeneralStatus, revokeGeneralMessage, revokeGeneralSuccess, type]);


  const openConfirmationModal = (title, msg, onConfirmFn, confirmTxt, confirmBtnClass) => {
    setModalContent({ title, message: msg, onConfirm: onConfirmFn, confirmText: confirmTxt, confirmButtonClass: confirmBtnClass });
    setIsModalOpen(true);
  };

  const closeConfirmationModal = () => {
    setIsModalOpen(false);
  };

  if (loading) return <div className="container">Loading credential details...</div>;
  if (error) return <div className="container message error">{error}</div>;
  if (!credential) return <div className="container message error">Credential not found or not issued by you.</div>;

  const isRevoked = type === 'nft' ? !credential.isValid : credential.isRevoked;
  const loadingRevoke = type === 'nft' ? revokeNFTLoading : revokeGeneralLoading;

  return (
        <div className="issuer-credential-details-page container">
      <h2>Credential Details</h2>
      {message.text && <p className={`message ${message.type}`}>{message.text}</p>}

      <div className="credential-info">
        <p><strong>Type:</strong> {type === 'nft' ? 'NFT Credential' : 'General Credential'}</p>
        <p><strong>ID:</strong> {credential.tokenId || credential.credentialId}</p>
        <p><strong>Name/Type:</strong> {credential.credentialType || credential.degreeName}</p>
        <p><strong>Recipient:</strong> {shortenAddress(credential.recipient)}</p>
        <p><strong>Issuer:</strong> {shortenAddress(credential.issuer)}</p>
        <p><strong>Date:</strong> {formatTimestamp(credential.mintDate || credential.issueDate)}</p>
        <p><strong>Status:</strong> {isRevoked ? 'Revoked' : 'Valid'}</p>
        <p><strong>URI:</strong> {credential.tokenURI || credential.metadataURI || 'N/A'}</p>
      </div>

      {ipfsMetadata && (
        <div className="credential-display">
          <h3>Credential Content</h3>
          {ipfsMetadata.files && ipfsMetadata.files.length > 0 ? (
            ipfsMetadata.files.map((fileUri, index) => (
              <img key={index} src={parseIpfsUrl(fileUri)} alt={`Credential ${index + 1}`} />
            ))
          ) : (
            <p>No preview available for this credential.</p>
          )}
        </div>
      )}

      {!isRevoked && (
        <div className="button-group" style={{ marginTop: '2rem' }}>
          <button
            onClick={() => openConfirmationModal(
              'Revoke Credential',
              `Are you sure you want to revoke this credential (${credential.tokenId || credential.credentialId})? This action cannot be undone.`,
              handleRevoke,
              'Revoke',
              'button-danger'
            )}
            disabled={loadingRevoke}
            className="button-danger"
          >
            {loadingRevoke ? 'Revoking...' : 'Revoke Credential'}
          </button>
        </div>
      )}

      <div className="button-group" style={{ marginTop: '2rem' }}>
        <button onClick={() => navigate('/issuer-dashboard')}>Back to Dashboard</button>
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

export default IssuerCredentialDetails;
