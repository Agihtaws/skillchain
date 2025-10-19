// app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const adminRoutes = require('./routes/adminRoutes');
const issuerRoutes = require('./routes/issuerRoutes');
const studentRoutes = require('./routes/studentRoutes');
const { adminWallet, issuerRegistryContract } = require('./config/blockchain');

const app = express();
const PORT = process.env.PORT || 3000;

// --- CORS Configuration --- // <<< UPDATED CORS BLOCK
const frontendUrl = process.env.FRONTEND_URL;
if (!frontendUrl) {
  console.error('FRONTEND_URL environment variable is not set. CORS might not work correctly.');
  // Fallback to allow all for local development, but warn
  app.use(cors());
} else {
  const corsOptions = {
    origin: frontendUrl,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Allow cookies, if any are used (though not in this DApp)
    optionsSuccessStatus: 204
  };
  app.use(cors(corsOptions));
  console.log(`CORS enabled for origin: ${frontendUrl}`);
}
// --- End CORS Configuration ---

app.use(express.json());

// --- Routes ---
app.use('/admin', adminRoutes);
app.use('/issuer', issuerRoutes);
app.use('/student', studentRoutes);

// Optional: Add a simple root route for status if you want
app.get('/', (req, res) => {
  res.status(200).send('SkillChain Backend API is running!');
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Admin backend server running on port ${PORT}`);
    console.log(`Admin wallet address: ${adminWallet.address}`);
    console.log(`IssuerRegistry Contract Address: ${issuerRegistryContract.target}`);
});
