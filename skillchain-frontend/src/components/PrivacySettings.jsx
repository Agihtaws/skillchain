// src/components/PrivacySettings.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { getPrivacySettings, prepareSetPrivacySettings } from '../api/api';
import { useContractWrite } from '../hooks/useContractWrite';

const PrivacySettings = () => {
  const navigate = useNavigate();
  const { address: connectedUserAddress } = useAccount();
  const [settings, setSettings] = useState({
    showRecipientAddress: true,
    showIssuerAddress: true,
    showMintDate: true,
    showCredentialType: true,
    showIssuerName: true,
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Wagmi hook for contract write operation
  const { execute: setPrivacy, status: privacyStatus, message: privacyMessage, isLoading: privacyLoading, isSuccess: privacySuccess } = useContractWrite('VerificationContract', 'setPrivacySettings');

  useEffect(() => {
    const fetchCurrentSettings = async () => {
      if (!connectedUserAddress) {
        setError("Wallet not connected.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setMessage({ type: '', text: '' });
      try {
        const currentSettings = await getPrivacySettings(connectedUserAddress);
        setSettings(currentSettings);
      } catch (err) {
        console.error("Error fetching privacy settings:", err);
        setMessage({ type: 'error', text: err.response?.data?.message || err.message || "Failed to fetch privacy settings." });
      } finally {
        setLoading(false);
      }
    };
    fetchCurrentSettings();
  }, [connectedUserAddress]);

  const handleChange = (e) => {
    const { name, checked } = e.target;
    setSettings(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!connectedUserAddress) {
      setMessage({ type: 'error', text: 'Please connect your wallet.' });
      return;
    }
    setLoading(true); // For backend preparation
    setMessage({ type: '', text: '' });

    try {
      // Backend doesn't do much here, just validates and confirms readiness
      await prepareSetPrivacySettings(connectedUserAddress, settings);

      setMessage({ type: 'info', text: 'Preparing settings update. Confirming transaction in wallet...' });

      // Call the smart contract directly from the frontend
      await setPrivacy(
        settings.showRecipientAddress,
        settings.showIssuerAddress,
        settings.showMintDate,
        settings.showCredentialType,
        settings.showIssuerName
      );

    } catch (error) {
      console.error("Error updating privacy settings:", error);
      setMessage({ type: 'error', text: error.response?.data?.message || error.message || "Failed to prepare privacy settings update." });
    } finally {
      setLoading(false); // Reset backend loading after prepare call
    }
  };

  useEffect(() => {
    if (privacySuccess) {
      setMessage({ type: 'success', text: privacyMessage + ' Settings updated!' });
      // No redirect needed, stay on page to see changes
    } else if (privacyStatus === 'error') {
      setMessage({ type: 'error', text: privacyMessage });
    } else if (privacyStatus === 'loading') {
      setMessage({ type: 'info', text: privacyMessage });
    }
  }, [privacyStatus, privacyMessage, privacySuccess]);


  if (loading) return <div className="container">Loading privacy settings...</div>;

  return (
    <div className="container">
      <h2>Manage Privacy Settings</h2>
      {message.text && <p className={`message ${message.type}`}>{message.text}</p>}

      <form onSubmit={handleSubmit}>
        <div className="privacy-settings-group">
          <p>Control what information is visible when others verify your credentials:</p>
          <label>
            <input
              type="checkbox"
              name="showRecipientAddress"
              checked={settings.showRecipientAddress}
              onChange={handleChange}
              disabled={privacyLoading}
            />
            Show My Wallet Address (as Recipient)
          </label>
          <label>
            <input
              type="checkbox"
              name="showIssuerAddress"
              checked={settings.showIssuerAddress}
              onChange={handleChange}
              disabled={privacyLoading}
            />
            Show Issuer's Wallet Address
          </label>
          <label>
            <input
              type="checkbox"
              name="showMintDate"
              checked={settings.showMintDate}
              onChange={handleChange}
              disabled={privacyLoading}
            />
            Show Credential Mint/Issue Date
          </label>
          <label>
            <input
              type="checkbox"
              name="showCredentialType"
              checked={settings.showCredentialType}
              onChange={handleChange}
              disabled={privacyLoading}
            />
            Show Credential Type/Name
          </label>
          <label>
            <input
              type="checkbox"
              name="showIssuerName"
              checked={settings.showIssuerName}
              onChange={handleChange}
              disabled={privacyLoading}
            />
            Show Issuer's University Name
          </label>
        </div>
        <button type="submit" disabled={loading || privacyLoading}>
          {(loading || privacyLoading) ? 'Saving...' : 'Save Privacy Settings'}
        </button>
      </form>
      <div className="button-group" style={{ marginTop: '2rem' }}>
        <button onClick={() => navigate('/student-dashboard')}>Back to My Credentials</button>
      </div>
    </div>
  );
};

export default PrivacySettings;
