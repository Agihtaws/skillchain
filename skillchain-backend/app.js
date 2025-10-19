// app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const adminRoutes = require('./routes/adminRoutes');
const issuerRoutes = require('./routes/issuerRoutes');
const studentRoutes = require('./routes/studentRoutes'); // <<< ADD THIS IMPORT
const { adminWallet, issuerRegistryContract } = require('./config/blockchain'); // Import blockchain config

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors()); // Enable CORS for frontend interaction
app.use(express.json()); // For parsing application/json

// --- Routes ---
app.use('/admin', adminRoutes);
app.use('/issuer', issuerRoutes);
app.use('/student', studentRoutes); // <<< ADD THIS ROUTE

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Admin backend server running on port ${PORT}`);
    console.log(`Admin wallet address: ${adminWallet.address}`);
    console.log(`IssuerRegistry Contract Address: ${issuerRegistryContract.target}`);
});

