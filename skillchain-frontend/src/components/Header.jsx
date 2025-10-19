// src/components/Header.jsx
import React, { useState } from 'react';
import { shortenAddress } from '../utils/helpers';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance } from 'wagmi';
import { useNavigate } from 'react-router-dom';

const Header = ({ isAdmin, isAuthorizedIssuer, isStudent }) => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { data: balanceData } = useBalance({ address });
  const [copySuccess, setCopySuccess] = useState('');

  const copyToClipboard = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    }
  };

  return (
    <div className="header-bar">
      <div className="header-left">
        <h2 onClick={() => navigate('/')} style={{cursor: 'pointer'}}>SkillChain DApp</h2>
        {isConnected && isAdmin && <span className="admin-badge">Admin</span>}
        {isConnected && isAuthorizedIssuer && !isAdmin && <span className="admin-badge" style={{backgroundColor: '#007bff'}}>Issuer</span>}
        {isConnected && isStudent && !isAdmin && !isAuthorizedIssuer && <span className="admin-badge" style={{backgroundColor: '#17a2b8'}}>Student</span>}
      </div>
      <div className="header-right">
        {isConnected && (
            <>
                {/* Admin Settings Button (ONLY for Admin role) */}
                {isAdmin && (
                <button onClick={() => navigate('/admin-settings')} className="settings-button" title="Admin Settings">
                    ⚙️
                </button>
                )}
                {/* Issuer Dashboard Button (ONLY for Authorized Issuer role, not if also Admin) */}
                {isAuthorizedIssuer && !isAdmin && (
                    <button onClick={() => navigate('/issuer-dashboard')} className="settings-button" title="Issuer Dashboard">
                        💼
                    </button>
                )}
                {/* Student Dashboard Button (ONLY for Student role, not if also Admin/Issuer) */}
                {isStudent && !isAdmin && !isAuthorizedIssuer && (
                    <button onClick={() => navigate('/student-dashboard')} className="settings-button" title="My Credentials">
                        🎓
                    </button>
                )}
{isConnected && isStudent && !isAdmin && !isAuthorizedIssuer && ( // Only if purely a student
    <button onClick={() => navigate('/privacy-settings')} className="settings-button" title="Privacy Settings">
        🔒
    </button>
)}

            </>
        )}
        {isConnected && address ? (
          <div className="wallet-info">
            <span className="wallet-address">{shortenAddress(address)}</span>
            <button onClick={copyToClipboard} className="copy-button">
              {copySuccess ? '✔️' : '📋'}
            </button>
            {balanceData && <span>Balance: {parseFloat(balanceData.formatted).toFixed(4)} {balanceData.symbol}</span>}
            <ConnectButton />
          </div>
        ) : (
          <ConnectButton />
        )}
      </div>
    </div>
  );
};

export default Header;
