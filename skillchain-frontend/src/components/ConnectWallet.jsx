// src/components/ConnectWallet.jsx
import React, { useState } from 'react';
import { ethers } from 'ethers';

const ConnectWallet = ({ onConnect }) => { // Removed onAdminCheck
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const connectWallet = async () => {
    setLoading(true);
    setError('');
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed. Please install it to connect.");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // Pass connected address and provider back to App.jsx
      onConnect(address, provider);

    } catch (err) {
      console.error("Wallet connection failed:", err);
      setError(err.message || "Failed to connect wallet. Please ensure MetaMask is unlocked and connected.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Connect Your Wallet</h2>
      <p>Please connect your MetaMask wallet to proceed.</p>
      <button onClick={connectWallet} disabled={loading}>
        {loading ? 'Connecting...' : 'Connect MetaMask'}
      </button>
      {error && <p className="message error">{error}</p>}
    </div>
  );
};

export default ConnectWallet;
