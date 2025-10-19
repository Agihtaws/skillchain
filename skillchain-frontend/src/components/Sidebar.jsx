// src/components/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAccount } from 'wagmi';

const Sidebar = () => {
  const { isConnected } = useAccount();

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <NavLink to="/issuer-dashboard" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
          My Dashboard
        </NavLink>
        <NavLink to="/mint-nft" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
          Mint New NFT
        </NavLink>
        <NavLink to="/batch-mint-nft" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
          Batch Mint NFTs
        </NavLink>
        <NavLink to="/issue-general" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
          Issue General Credential
        </NavLink>
        {isConnected && ( // Only show profile link if wallet is connected
          <NavLink to="/issuer-profile" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
            My Profile
          </NavLink>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
