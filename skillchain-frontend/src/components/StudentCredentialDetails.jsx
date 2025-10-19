// src/components/StudentCredentialDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import QRCode from 'react-qr-code';

import {
  getStudentNFTCredentialDetails,
  getStudentGeneralCredentialDetails,
  getFullVerificationDetails,
  generateVerificationProof,
  generateQRCodeData,
  getVerificationHistory,
  getPrivacySettings,
  getIssuerDetails
} from '../api/api';
import { formatTimestamp, shortenAddress, parseIpfsUrl, fetchIpfsJson } from '../utils/helpers';

const StudentCredentialDetails = () => {
  const navigate = useNavigate();
  const { type, id } = useParams(); // 'nft' or 'general'
  const { address: connectedStudentAddress } = useAccount();
  const [credential, setCredential] = useState(null);
  const [ipfsMetadata, setIpfsMetadata] = useState(null);
  const [issuerInfo, setIssuerInfo] = useState(null);
  const [verificationDetails, setVerificationDetails] = useState(null);
  const [qrCodeString, setQrCodeString] = useState('');
  const [generatedProof, setGeneratedProof] = useState(null); // NEW: Store generated proof
  const [verificationHistory, setVerificationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  console.log("StudentCredentialDetails: Component rendered.");
  console.log("StudentCredentialDetails: Params - Type:", type, "ID:", id);
  console.log("StudentCredentialDetails: Connected Student Address (from wagmi):", connectedStudentAddress);

  const fetchCredentialDetails = async () => {
    console.log("StudentCredentialDetails: fetchCredentialDetails called.");
    if (!connectedStudentAddress) {
      console.error("StudentCredentialDetails: Wallet not connected in fetchCredentialDetails.");
      setError("Wallet not connected.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      let details = null;
      if (type === 'nft') {
        details = await getStudentNFTCredentialDetails(id);
      } else if (type === 'general') {
        details = await getStudentGeneralCredentialDetails(id);
      } else {
        console.error("StudentCredentialDetails: Invalid credential type:", type);
        throw new Error("Invalid credential type.");
      }

      console.log("StudentCredentialDetails: Fetched Credential Details:", details);

      // Authorization Check
      if (details && details.recipient && connectedStudentAddress) {
          console.log("StudentCredentialDetails: Recipient from fetched details:", details.recipient.toLowerCase());
          console.log("StudentCredentialDetails: Current connected student address:", connectedStudentAddress.toLowerCase());
          if (details.recipient.toLowerCase() !== connectedStudentAddress.toLowerCase()) {
              console.error("StudentCredentialDetails: Authorization failed - Connected wallet is not the recipient.");
              setError("You are not the recipient of this credential.");
              setCredential(null);
              setLoading(false);
              return;
          }
      } else {
          console.error("StudentCredentialDetails: Missing recipient or connected address for authorization check.");
          setError("Could not verify recipient or wallet connection.");
          setCredential(null);
          setLoading(false);
          return;
      }

      setCredential(details);

      if (details && (details.tokenURI || details.metadataURI)) {
        const metadata = await fetchIpfsJson(details.tokenURI || details.metadataURI);
        setIpfsMetadata(metadata);
      } else {
        setIpfsMetadata(null);
      }

      // Fetch issuer information
      if (details && details.issuer) {
        const issuerData = await getIssuerDetails(details.issuer);
        setIssuerInfo(issuerData);
      }

      // Fetch full verification details
      const fullVerify = await getFullVerificationDetails(id);
      setVerificationDetails(fullVerify);

      // Fetch verification history
      const history = await getVerificationHistory(id);
      setVerificationHistory(history);

    } catch (err) {
      console.error("StudentCredentialDetails: Error fetching credential details:", err);
      setError(err.response?.data?.message || err.message || "Failed to fetch credential details.");
      setCredential(null);
    } finally {
      setLoading(false);
      console.log("StudentCredentialDetails: Loading set to false after fetch.");
    }
  };

  useEffect(() => {
    console.log("StudentCredentialDetails: useEffect triggered for fetchCredentialDetails.");
    fetchCredentialDetails();
  }, [type, id, connectedStudentAddress]);

  const handleGenerateProof = async () => {
    setMessage({ type: 'info', text: 'Generating verification proof...' });
    setGeneratedProof(null); // Clear any previous proof
    try {
      const proof = await generateVerificationProof(id);
      setGeneratedProof(proof); // Store the proof
      setMessage({ type: 'success', text: `Proof generated! Hash: ${shortenAddress(proof.proofHash)}` });
      console.log("Verification Proof:", proof);
    } catch (err) {
      console.error("StudentCredentialDetails: Error generating proof:", err);
      setMessage({ type: 'error', text: err.response?.data?.message || err.message || "Failed to generate proof." });
    }
  };

  const handleGenerateQRCode = async () => {
    setMessage({ type: 'info', text: 'Generating QR Code...' });
    try {
      const qrData = await generateQRCodeData(id);
      setQrCodeString(qrData);
      setMessage({ type: 'success', text: 'QR Code generated!' });
    } catch (err) {
      console.error("StudentCredentialDetails: Error generating QR code:", err);
      setMessage({ type: 'error', text: err.response?.data?.message || err.message || "Failed to generate QR Code." });
    }
  };

  if (loading) {
    console.log("StudentCredentialDetails: Displaying loading message.");
    return <div className="container">Loading credential details...</div>;
  }
  if (error) {
    console.log("StudentCredentialDetails: Displaying error message:", error);
    return <div className="container message error">{error}</div>;
  }
  if (!credential) {
    console.log("StudentCredentialDetails: Credential is null, displaying not found message.");
    return <div className="container message error">Credential not found or not issued to your wallet.</div>;
  }

  const isValid = type === 'nft' ? credential.isValid : !credential.isRevoked;

  return (
    <div className="container">
      <h2>My Credential Details</h2>
      {message.text && <p className={`message ${message.type}`}>{message.text}</p>}

      <div className="credential-info">
        <p><strong>Type:</strong> {type === 'nft' ? 'NFT Credential' : 'General Credential'}</p>
        <p><strong>ID:</strong> {credential.tokenId || credential.credentialId}</p>
        <p><strong>Name/Type:</strong> {credential.credentialType || credential.degreeName}</p>
        <p><strong>Recipient:</strong> {shortenAddress(credential.recipient)}</p>
        <p><strong>Issuer:</strong> {shortenAddress(credential.issuer)} ({issuerInfo?.universityName || 'Unknown'})</p>
        <p><strong>Date:</strong> {formatTimestamp(credential.mintDate || credential.issueDate)}</p>
        <p><strong>Status:</strong> {isValid ? 'Valid' : 'Revoked'}</p>
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

      <div className="verification-output">
        <h3>Verification Tools</h3>
        <div className="button-group">
            <button onClick={handleGenerateProof}>Generate Verification Proof</button>
            <button onClick={handleGenerateQRCode}>Generate QR Code</button>
            <button onClick={() => navigate(`/verify/${id}`)}>View Public Verification Page</button>
        </div>

        {qrCodeString && (
            <div className="qr-code-container">
                <QRCode value={qrCodeString} size={256} />
            </div>
        )}

        {generatedProof && (
            <div className="details-section" style={{textAlign: 'left', marginTop: '1.5rem'}}>
                <h4>Generated Proof Details</h4>
                <p><strong>Proof Hash:</strong> {generatedProof.proofHash}</p>
                <p><strong>Proof Timestamp:</strong> {formatTimestamp(generatedProof.proofTimestamp)}</p>
                <p><strong>Credential ID:</strong> {generatedProof.credentialId}</p>
                <p><strong>Recipient:</strong> {shortenAddress(generatedProof.recipient)}</p>
                <p><strong>Issuer:</strong> {shortenAddress(generatedProof.issuer)}</p>
                <p><strong>Issuer Name:</strong> {generatedProof.issuerName || 'N/A'}</p>
                <p><strong>Credential Type:</strong> {generatedProof.credentialType || 'N/A'}</p>
                <p><strong>Valid at Proof Time:</strong> {generatedProof.isValid ? 'Yes' : 'No'}</p>
                <p><strong>Issuer Verified:</strong> {generatedProof.issuerVerified ? 'Yes' : 'No'}</p>
                <p><strong>Issuer Reputation Score:</strong> {generatedProof.issuerReputationScore}</p>
                <p><strong>Verification Level:</strong> {generatedProof.verificationLevel}</p>
                <p className="message info" style={{marginTop: '1rem'}}>
                    Share this Proof Hash and Credential ID for verifiable offline proof.
                </p>
            </div>
        )}
      </div>

      {verificationDetails && (
        <div className="details-section">
          <h3>Full Verification Details</h3>
          <p><strong>Credential Valid:</strong> {verificationDetails.isValid ? 'Yes' : 'No'}</p>
          <p><strong>Issuer Name:</strong> {verificationDetails.issuerName || 'N/A'}</p>
          <p><strong>Issuer Verified:</strong> {verificationDetails.issuerVerified ? 'Yes' : 'No'}</p>
          <p><strong>Issuer Active:</strong> {verificationDetails.issuerActive ? 'Yes' : 'No'}</p>
          <p><strong>Issuer Reputation:</strong> {verificationDetails.issuerReputationScore}</p>
          <p><strong>Verification Level:</strong> {verificationDetails.verificationLevel}</p>
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

      <div className="button-group" style={{ marginTop: '2rem' }}>
        <button onClick={() => navigate('/student-dashboard')}>Back to My Credentials</button>
      </div>
    </div>
  );
};

export default StudentCredentialDetails;
