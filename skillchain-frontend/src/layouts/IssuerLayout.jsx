// src/layouts/IssuerLayout.jsx
import React from 'react';
import Sidebar from '../components/Sidebar'; // Adjust path if Sidebar is elsewhere

const IssuerLayout = ({ children }) => {
  return (
    <div className="issuer-page-layout">
      <Sidebar />
      <main className="issuer-content-area">
        {children}
      </main>
    </div>
  );
};

export default IssuerLayout;
