// src/components/AddIssuerForm.jsx
import React, { useState } from 'react';
import { registerIssuer } from '../api/api';
import { useNavigate } from 'react-router-dom';

const AddIssuerForm = () => {
  const navigate = useNavigate();
  const [issuerAddress, setIssuerAddress] = useState('');
  const [universityName, setUniversityName] = useState('');
  const [collegeAddress, setCollegeAddress] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('issuerAddress', issuerAddress);
      formData.append('universityName', universityName);
      formData.append('collegeAddress', collegeAddress);
      if (logoFile) {
        formData.append('logo', logoFile);
      }
      imageFiles.forEach((file) => {
        formData.append('images', file);
      });

      const result = await registerIssuer(formData);
      setMessage({ type: 'success', text: `Issuer registered! Tx Hash: ${result.transactionHash}` });
      // Optionally navigate back to dashboard or issuer details
      setTimeout(() => navigate('/'), 3000);
    } catch (error) {
      console.error("Error registering issuer:", error);
      setMessage({ type: 'error', text: error.response?.data?.message || error.message || "Failed to register issuer." });
    } finally {
      setLoading(false);
    }
  };

  return (
        <div className="add-issuer-form-page container">
      <h2>Add New Issuer</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="issuerAddress">Issuer Wallet Address:</label>
          <input
            type="text"
            id="issuerAddress"
            value={issuerAddress}
            onChange={(e) => setIssuerAddress(e.target.value)}
            placeholder="e.g., 0x..."
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="universityName">University Name:</label>
          <input
            type="text"
            id="universityName"
            value={universityName}
            onChange={(e) => setUniversityName(e.target.value)}
            placeholder="e.g., SkillChain University"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="collegeAddress">College Physical Address (Optional):</label>
          <input
            type="text"
            id="collegeAddress"
            value={collegeAddress}
            onChange={(e) => setCollegeAddress(e.target.value)}
            placeholder="e.g., 123 Main St, City, Country"
          />
        </div>
        <div className="form-group">
          <label htmlFor="logoFile">Logo (Image File):</label>
          <input
            type="file"
            id="logoFile"
            accept="image/*"
            onChange={(e) => setLogoFile(e.target.files[0])}
          />
        </div>
        <div className="form-group">
          <label htmlFor="imageFiles">Additional Images (Optional):</label>
          <input
            type="file"
            id="imageFiles"
            accept="image/*"
            multiple
            onChange={(e) => setImageFiles(Array.from(e.target.files))}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register Issuer'}
        </button>
      </form>
      {message.text && <p className={`message ${message.type}`}>{message.text}</p>}
      <button onClick={() => navigate('/')}>Back to Dashboard</button>
    </div>
  );
};

export default AddIssuerForm;
