// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { checkAdminStatus, checkIssuerAuthorization } from './api/api';

import AdminDashboard from './components/AdminDashboard';
import AdminSettings from './components/AdminSettings';
import AddIssuerForm from './components/AddIssuerForm';
import IssuerDetails from './components/AdminIssuerDetails';
import Header from './components/Header';

// Layouts
import IssuerLayout from './layouts/IssuerLayout';

// ISSUER COMPONENTS
import IssuerDashboard from './components/IssuerDashboard';
import IssuerProfile from './components/IssuerProfile';
import MintNFTCredentialForm from './components/MintNFTCredentialForm';
import BatchMintNFTCredentialsForm from './components/BatchMintNFTCredentialsForm';
import IssueGeneralCredentialForm from './components/IssueGeneralCredentialForm';
import IssuerCredentialDetails from './components/IssuerCredentialDetails';

// STUDENT COMPONENTS
import StudentDashboard from './components/StudentDashboard';
import StudentCredentialDetails from './components/StudentCredentialDetails';
import PrivacySettings from './components/PrivacySettings';
import PublicVerifier from './components/PublicVerifier';

function AppContent() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthorizedIssuer, setIsAuthorizedIssuer] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);

  // Effect to verify user roles - runs on mount or when address/isConnected change
  useEffect(() => {
    let isMounted = true;

    const verifyUserRoles = async () => {
      if (!isMounted) return;

      setLoadingRoles(true);
      console.log("AppContent: verifyUserRoles started. isConnected:", isConnected, "Address:", address);

      let currentAdminStatus = false;
      let currentIssuerStatus = false;
      let currentStudentStatus = false;

      if (isConnected && address) {
        try {
          currentAdminStatus = await checkAdminStatus(address);
          currentIssuerStatus = await checkIssuerAuthorization(address);
          currentStudentStatus = true;
        } catch (error) {
          console.error('AppContent: Error checking user roles:', error);
        }
      }

      if (isMounted) {
        setIsAdmin(currentAdminStatus);
        setIsAuthorizedIssuer(currentIssuerStatus);
        setIsStudent(currentStudentStatus);
        setLoadingRoles(false);
      }
      console.log("AppContent: verifyUserRoles finished. isAdmin:", currentAdminStatus, "isAuthorizedIssuer:", currentIssuerStatus, "isStudent:", currentStudentStatus, "loadingRoles:", false);
    };

    verifyUserRoles();

    return () => {
      isMounted = false;
    };
  }, [address, isConnected]);

  // Effect for redirect logic - runs when roles are loaded or path changes
  useEffect(() => {
    if (loadingRoles) return;

    const matchesPathPrefix = (prefix, path) => {
        return path === prefix || path.startsWith(prefix + '/');
    };

    const adminOnlyPaths = ['/admin-settings', '/add-issuer', '/admin-issuer'];
    const issuerOnlyPaths = ['/issuer-dashboard', '/issuer-profile', '/mint-nft', '/batch-mint-nft', '/issue-general', '/my-credential'];
    const studentOnlyPaths = ['/student-dashboard', '/my-credentials', '/privacy-settings'];
    const currentPath = window.location.pathname;

    console.log("AppContent: Redirect check - currentPath:", currentPath, "isConnected:", isConnected);

    // Admin redirect
    if (!isAdmin && adminOnlyPaths.some(path => matchesPathPrefix(path, currentPath))) {
      console.warn("AppContent: Redirecting to / - Admin unauthorized.");
      navigate('/');
      return;
    }

    // Issuer redirect
    if (
      !isAuthorizedIssuer &&
      issuerOnlyPaths.some(path => matchesPathPrefix(path, currentPath)) &&
      !matchesPathPrefix('/my-credentials', currentPath)
    ) {
      console.warn("AppContent: Redirecting to / - Issuer unauthorized.");
      navigate('/');
      return;
    }

    // Student redirect (if disconnected)
    if (!isConnected && studentOnlyPaths.some(path => matchesPathPrefix(path, currentPath))) {
      console.warn("AppContent: Redirecting to / - Student path accessed while disconnected.");
      navigate('/');
      return;
    }
  }, [loadingRoles, isAdmin, isAuthorizedIssuer, isConnected, navigate, window.location.pathname]);

  if (loadingRoles) {
    console.log("AppContent: Displaying global loading message for roles.");
    return (
      <div className="container">
        <h2 className="text-center">Checking wallet connection and user roles...</h2>
        <p className="text-center">Please wait...</p>
      </div>
    );
  }

  const ProtectedRouteWrapper = ({ children, requiredRole }) => {
    console.log("ProtectedRouteWrapper: Rendering for requiredRole:", requiredRole, "isConnected:", isConnected, "isAdmin:", isAdmin, "isAuthorizedIssuer:", isAuthorizedIssuer, "isStudent:", isStudent);

    if (!isConnected) {
      console.warn("ProtectedRouteWrapper: Wallet not connected, showing connect prompt.");
      return (
        <div className="container">
          <h2>Connect Your Wallet</h2>
          <p>Please connect your wallet to proceed.</p>
          <p>You must be {requiredRole === 'admin' ? 'an admin' : requiredRole === 'issuer' ? 'an authorized issuer' : 'connected'} to access this page.</p>
          <ConnectButton />
        </div>
      );
    }
    if (requiredRole === 'admin' && !isAdmin) {
      console.warn("ProtectedRouteWrapper: User is connected but not admin.");
      return <div className="container message info">You are connected, but not authorized as an admin.</div>;
    }
    if (requiredRole === 'issuer' && !isAuthorizedIssuer) {
      console.warn("ProtectedRouteWrapper: User is connected but not authorized issuer.");
      return <div className="container message info">You are connected, but not authorized as an issuer.</div>;
    }
    console.log("ProtectedRouteWrapper: User authorized for role:", requiredRole);
    return children;
  };

  return (
    <>
      {isConnected && <Header isAdmin={isAdmin} isAuthorizedIssuer={isAuthorizedIssuer} isStudent={isStudent} />}
      <Routes>
        <Route
          path="/"
          element={
            isConnected ? (
              isAdmin ? <AdminDashboard /> : isAuthorizedIssuer ? (
                <IssuerLayout><IssuerDashboard /></IssuerLayout>
              ) : isStudent ? <StudentDashboard /> : (
                <div className="container message info">
                  You are connected, but not authorized as an Admin, Issuer, or Student.
                </div>
              )
            ) : (
              // Enhanced Landing Page Content when not connected
              <div className="landing-page-unconnected container">
                <h1 className="text-center">Welcome to SkillChain DApp</h1>
                <p className="text-center lead-text">
                  Your secure gateway to managing and verifying academic and professional credentials on the blockchain.
                </p>

                <div className="landing-features">
                  <div className="feature-item">
                    <h3>Decentralized & Tamper-Proof</h3>
                    <p>Credentials are stored on the blockchain and IPFS, ensuring authenticity and immutability.</p>
                  </div>
                  <div className="feature-item">
                    <h3>Empowering Students</h3>
                    <p>Take full control of your digital qualifications and manage your privacy settings with ease.</p>
                  </div>
                  <div className="feature-item">
                    <h3>Trusted Issuance</h3>
                    <p>For institutions, issue verifiable NFT or general credentials with transparent administration.</p>
                  </div>
                  <div className="feature-item">
                    <h3>Instant Verification</h3>
                    <p>Anyone can instantly verify credentials with a simple ID, respecting recipient privacy.</p>
                  </div>
                </div>

                <h2 className="text-center call-to-action">Connect Your Wallet to Get Started</h2>
                
                <p className="text-center">
                  Access your personalized dashboard as a Student, Issuer, or Admin and unlock the full potential of SkillChain.
                </p>
                <ConnectButton />
              </div>
            )
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin-settings"
          element={<ProtectedRouteWrapper requiredRole="admin"><AdminSettings /></ProtectedRouteWrapper>}
        />
        <Route
          path="/add-issuer"
          element={<ProtectedRouteWrapper requiredRole="admin"><AddIssuerForm /></ProtectedRouteWrapper>}
        />
        <Route
          path="/admin-issuer/:address"
          element={<ProtectedRouteWrapper requiredRole="admin"><IssuerDetails /></ProtectedRouteWrapper>}
        />

        {/* Issuer Routes - now wrapped with IssuerLayout */}
        <Route
          path="/issuer-dashboard"
          element={<ProtectedRouteWrapper requiredRole="issuer"><IssuerLayout><IssuerDashboard /></IssuerLayout></ProtectedRouteWrapper>}
        />
        <Route
          path="/issuer-profile"
          element={<ProtectedRouteWrapper requiredRole="issuer"><IssuerLayout><IssuerProfile /></IssuerLayout></ProtectedRouteWrapper>}
        />
        <Route
          path="/mint-nft"
          element={<ProtectedRouteWrapper requiredRole="issuer"><IssuerLayout><MintNFTCredentialForm /></IssuerLayout></ProtectedRouteWrapper>}
        />
        <Route
          path="/batch-mint-nft"
          element={<ProtectedRouteWrapper requiredRole="issuer"><IssuerLayout><BatchMintNFTCredentialsForm /></IssuerLayout></ProtectedRouteWrapper>}
        />
        <Route
          path="/issue-general"
          element={<ProtectedRouteWrapper requiredRole="issuer"><IssuerLayout><IssueGeneralCredentialForm /></IssuerLayout></ProtectedRouteWrapper>}
        />
        <Route
          path="/my-credential/:type/:id"
          element={<ProtectedRouteWrapper requiredRole="issuer"><IssuerLayout><IssuerCredentialDetails /></IssuerLayout></ProtectedRouteWrapper>}
        />

        {/* Student Routes */}
        <Route
          path="/student-dashboard"
          element={<ProtectedRouteWrapper requiredRole="student"><StudentDashboard /></ProtectedRouteWrapper>}
        />
        <Route
          path="/my-credentials/:type/:id"
          element={<ProtectedRouteWrapper requiredRole="student"><StudentCredentialDetails /></ProtectedRouteWrapper>}
        />
        <Route
          path="/privacy-settings"
          element={<ProtectedRouteWrapper requiredRole="student"><PrivacySettings /></ProtectedRouteWrapper>}
        />

        {/* Public Verifier Route (no wallet connection required) */}
        <Route
          path="/verify/:id?"
          element={<PublicVerifier />}
        />

        {/* Catch-all for unknown routes */}
        <Route
          path="*"
          element={
            <div className="container message info">Page not found.</div>
          }
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
