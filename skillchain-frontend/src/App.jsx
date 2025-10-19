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
  const [loadingRoles, setLoadingRoles] = useState(true); // Initial state is loading

  // Effect to verify user roles - runs on mount or when address/isConnected change
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates on unmounted component

    const verifyUserRoles = async () => {
      if (!isMounted) return; // Prevent updating state if component unmounted

      setLoadingRoles(true); // Show global loading while roles are being determined
      console.log("AppContent: verifyUserRoles started. isConnected:", isConnected, "Address:", address);

      let currentAdminStatus = false;
      let currentIssuerStatus = false;
      let currentStudentStatus = false;

      if (isConnected && address) {
        try {
          currentAdminStatus = await checkAdminStatus(address);
          currentIssuerStatus = await checkIssuerAuthorization(address);
          currentStudentStatus = true; // Any connected user is considered a student/recipient
        } catch (error) {
          console.error('AppContent: Error checking user roles:', error);
        }
      }

      if (isMounted) { // Only update state if still mounted
        setIsAdmin(currentAdminStatus);
        setIsAuthorizedIssuer(currentIssuerStatus);
        setIsStudent(currentStudentStatus);
        setLoadingRoles(false); // Hide global loading after roles are determined
      }
      console.log("AppContent: verifyUserRoles finished. isAdmin:", currentAdminStatus, "isAuthorizedIssuer:", currentIssuerStatus, "isStudent:", currentStudentStatus, "loadingRoles:", false);
    };

    verifyUserRoles();

    // Cleanup function: runs when component unmounts or before re-running effect
    return () => {
      isMounted = false;
    };
  }, [address, isConnected]); // ONLY re-run when address or isConnected change

  // Effect for redirect logic - runs when roles are loaded or path changes
  useEffect(() => {
    if (loadingRoles) return; // Don't redirect until roles are loaded

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
  }, [loadingRoles, isAdmin, isAuthorizedIssuer, isConnected, navigate, window.location.pathname]); // Add window.location.pathname to ensure redirect logic reacts to path changes

  if (loadingRoles) {
    console.log("AppContent: Displaying global loading message for roles.");
    return (
      <div className="container">
        <h2 className="text-center">Checking wallet connection and user roles...</h2>
        <p className="text-center">Please wait...</p>
      </div>
    );
  }

  // A generic wrapper for protected routes (admin or issuer or student)
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
              <div className="container">
                <h2>Connect Your Wallet</h2>
                <p>Please connect your wallet to proceed.</p>
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
