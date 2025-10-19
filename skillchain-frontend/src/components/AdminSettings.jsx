// src/components/AdminSettings.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import { transferAdmin } from '../api/api'; // <-- We no longer call the backend's transferAdmin directly for on-chain action
import ConfirmationModal from './ConfirmationModal';
import { useContractWrite } from '../hooks/useContractWrite'; // <<< This is key

const AdminSettings = () => {
  const navigate = useNavigate();
  const [newAdminAddress, setNewAdminAddress] = useState('');
  // const [actionLoading, setActionLoading] = useState(false); // No longer strictly needed as wagmi hook provides loading state
  const [message, setMessage] = useState({ type: '', text: '' });

  // Wagmi hook for contract write operation specifically for transferAdmin
  // It targets the 'IssuerRegistry' contract and the 'transferAdmin' function
  const {
    execute: transferAdminTx, // Renamed to clearly indicate it's the transaction initiator
    status: transferStatus,
    message: transferTxMessage, // Renamed to avoid confusion with local 'message' state
    isLoading: transferLoading,
    isSuccess: transferSuccess,
    isError: transferError // Added isError for more robust error handling
  } = useContractWrite('IssuerRegistry', 'transferAdmin'); // <<< This is where the magic starts

  // State for confirmation modal (this is for the UI, before the MetaMask popup)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: '',
    message: '',
    onConfirm: () => {}, // This will be set to call handleTransferAdminTx
    confirmText: 'Confirm',
    confirmButtonClass: 'button-primary'
  });

  const openConfirmationModal = (title, msg, onConfirmFn, confirmTxt, confirmBtnClass) => {
    setModalContent({ title, message: msg, onConfirm: onConfirmFn, confirmText: confirmTxt, confirmButtonClass: confirmBtnClass });
    setIsModalOpen(true);
  };

  const closeConfirmationModal = () => {
    setIsModalOpen(false);
  };

  // This function is triggered AFTER the user confirms in YOUR frontend modal
  const handleTransferAdminTx = async () => {
    // setActionLoading(true); // Local loading can be synced to transferLoading from hook
    setMessage({ type: 'info', text: 'Preparing transaction...' }); // Initial message before MetaMask popup
    closeConfirmationModal(); // Close your custom modal immediately

    try {
      // This line calls the wagmi hook's execute function,
      // which then triggers the MetaMask popup for the user to sign.
      await transferAdminTx(newAdminAddress); // <<< THIS IS THE TRANSACTION CALL
      // The rest of the success/error/loading flow is handled by the useEffect below
      // watching 'transferStatus'
    } catch (error) {
      // This catch block would primarily handle errors *before* MetaMask opens (e.g., invalid address)
      console.error("Error initiating admin role transfer:", error);
      setMessage({ type: 'error', text: error.message || "Failed to initiate admin role transfer." });
      // setActionLoading(false); // Reset local loading if an error occurred before wagmi
    }
  };

  // This useEffect watches the status of the wagmi transaction
  useEffect(() => {
    if (transferLoading) {
      setMessage({ type: 'info', text: transferTxMessage }); // Message from wagmi hook
    } else if (transferSuccess) {
      setMessage({ type: 'success', text: transferTxMessage + ' Redirecting to dashboard...' });
      setTimeout(() => navigate('/'), 3000); // Redirect after successful transfer
    } else if (transferError) { // Use transferError directly for robust error handling
      setMessage({ type: 'error', text: transferTxMessage }); // Message from wagmi hook
    }
    // setActionLoading(transferLoading); // Sync local loading state with wagmi's isLoading
  }, [transferStatus, transferTxMessage, transferSuccess, transferLoading, transferError, navigate]);


  return (
        <div className="add-issuer-form-page container">
      <h2>Admin Settings</h2>
      {message.text && <p className={`message ${message.type}`}>{message.text}</p>}

      <div className="action-card">
        <h4>Transfer Admin Role</h4>
        <p>This action is irreversible and transfers full control of the `IssuerRegistry` contract to a new address.</p>
        <input
          type="text"
          placeholder="New Admin Wallet Address"
          value={newAdminAddress}
          onChange={(e) => setNewAdminAddress(e.target.value)}
          disabled={transferLoading} // Disable input while transaction is processing
        />
        <button
          onClick={() => openConfirmationModal(
            'Transfer Admin Role',
            `WARNING: Are you sure you want to transfer the admin role to ${newAdminAddress}? This action is irreversible and transfers full control to the new address.`,
            handleTransferAdminTx, // Call the function that initiates the wagmi transaction
            'Transfer Admin',
            'button-danger'
          )}
          disabled={transferLoading || !newAdminAddress} // Disable button while loading or if address is empty
          className="button-danger"
        >
          {transferLoading ? 'Transferring...' : 'Transfer Admin'}
        </button>
        {/* ... rest of the component */}
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

export default AdminSettings;
