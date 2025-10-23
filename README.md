# SkillChain DApp: Decentralized Verifiable Credentials

<p align="center">
  <img src="https://github.com/Agihtaws/skillchain/blob/main/skillchain-frontend/public/Design%20a%20professiona.png" 
       alt="SkillChain DApp Screenshot" width ="1000" height="400">
</p>


## 🚀 Project Overview

**SkillChain DApp** is a robust decentralized platform designed to revolutionize how digital credentials are issued, managed, and verified using cutting-edge blockchain technology. Developed as a full-stack application, it features a dynamic React (Vite.js) frontend and a powerful Node.js/Express backend, all interacting with Solidity smart contracts deployed on the Base Sepolia network.

The core objective is to empower individuals with true, immutable ownership of their academic, professional, and personal achievements, while providing institutions with a secure, transparent, and efficient system for credentialing.

## ✨ Features

SkillChain DApp supports three distinct user roles, each with tailored functionalities:

### 1. Administrator (Admin)
*   **Role:** Manages the entire SkillChain ecosystem.
*   **Key Features:**
    *   **Issuer Registration & Verification:** Onboard new educational institutions or companies as authorized credential issuers, assigning them verification levels.
    *   **Issuer Management:** Update issuer details, adjust reputation scores, and manage their operational status (deactivate, reactivate, or remove).
    *   **Admin Role Transfer:** Securely transfer the administrative control of the platform to a new address.
    *   **Comprehensive Oversight:** View all registered issuers and their current statuses.

### 2. Issuer (Institutions & Companies)
*   **Role:** Authorized entities responsible for issuing credentials.
*   **Key Features:**
    *   **Profile Management:** View their registered profile details, including verification status and reputation.
    *   **NFT Credential Minting:**
        *   **Single Mint:** Issue unique, non-transferable (soulbound) ERC-721 NFT credentials (e.g., degrees, high-value certifications) to individual recipients.
        *   **Batch Mint:** Efficiently issue multiple NFT credentials to many recipients in a single blockchain transaction.
    *   **General Credential Issuance:** Issue verifiable records (e.g., course completion certificates, participation awards) via a dedicated registry.
    *   **Credential Revocation:** Invalidate any credential they previously issued.
    *   **Credential Tracking:** View all credentials issued by their institution.

### 3. Recipient (Students & Employees)
*   **Role:** Individuals who receive and own the digital credentials.
*   **Key Features:**
    *   **Personalized Credential Dashboard:** A central hub to view all NFT and General credentials issued to their connected Web3 wallet.
    *   **Credential Details:** Access comprehensive information for each credential, including issuer details and associated content from IPFS.
    *   **Privacy Settings:** Granular control over what information (e.g., recipient address, issuer name, credential type) is publicly visible during verification.
    *   **Verification Tools:**
        *   **Generate Verification Proof:** Create a cryptographic proof of a credential's validity at a specific point in time.
        *   **Generate QR Code:** Instantly generate a scannable QR code that links directly to the public verification page for their credential.
    *   **Public Verification Page:** A publicly accessible portal where anyone can verify a credential using its ID, respecting the recipient's privacy preferences.

## 🛠️ Technologies Used

**Blockchain:**
*   **Ethereum (Base Sepolia Testnet):** The blockchain network for smart contract deployment.
*   **Solidity:** Programming language for smart contracts.
*   **Hardhat:** Ethereum development environment for compiling, deploying, and testing contracts.
*   **Ethers.js:** Library for interacting with the Ethereum blockchain.

**Frontend:**
*   **React.js:** JavaScript library for building user interfaces (managed by Vite.js).
*   **React Router DOM:** For declarative routing.
*   **Axios:** Promise-based HTTP client for API requests.
*   **Wagmi:** React Hooks for Ethereum, simplifying blockchain interaction.
*   **RainbowKit:** React component library for connecting wallets.
*   **QRCode.react:** Component for generating QR codes.
*   **Custom CSS:** For styling and responsive design.

**Backend:**
*   **Node.js:** JavaScript runtime environment.
*   **Express.js:** Web framework for Node.js to build RESTful APIs.
*   **Dotenv:** For managing environment variables.
*   **Cors:** Middleware for enabling Cross-Origin Resource Sharing.
*   **Multer:** Middleware for handling `multipart/form-data` (file uploads).
*   **Pinata SDK:** For interacting with the Pinata IPFS service.

**Off-Chain Storage:**
*   **IPFS (via Pinata):** Decentralized file storage for credential metadata (logos, images, PDFs).

**Deployment:**
*   **Render:** Cloud platform for deploying web services (backend) and static sites (frontend).

**Version Control:**
*   **Git, GitHub:** For source code management.

## ⚙️ Local Development Setup

To run SkillChain DApp locally, follow these steps:

### Prerequisites

*   **Node.js (v18 or higher) & npm:** [Download Node.js](https://nodejs.org/)
*   **MetaMask browser extension:** Installed and configured for Base Sepolia.
*   **WalletConnect Project ID:** Obtain one from [cloud.walletconnect.com](https://cloud.walletconnect.com/).
*   **Pinata API Key, Secret API Key, and JWT:** Obtain from [pinata.cloud](https://pinata.cloud/).

### 1️⃣ Clone the Repository

First, clone the repository and navigate into the project folder:

```bash
git clone https://github.com/Agihtaws/skillchain.git
cd skillchain
```

2️⃣ Smart Contract Setup (Hardhat Project)
Navigate to your Hardhat project directory (this is the skillchain root folder).

A. Environment Variables (.env)
Create a .env file in your Hardhat project root with the following (replace placeholders with your actual values):
```bash
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
DEPLOYER_PRIVATE_KEY=0xYOUR_ADMIN_WALLET_PRIVATE_KEY_HERE
FRONTEND_RENDER_URL=https://skillchain-frontend-kcoy.onrender.com # Your deployed frontend URL
```

B. Install Dependencies
```bash
npm install # or yarn install
```

C. Compile Contracts
```bash
npx hardhat compile
```

D. Deploy Contracts
Deploy your contracts to the Base Sepolia testnet. This will output the deployed contract addresses.
```bash
npx hardhat run scripts/deploy.js --network baseSepolia
```

E. Note Contract Addresses
Crucially, save these deployed contract addresses:

```
IssuerRegistry: 0x4b0989065f79128D4a537283AA05d8555F132F82
CredentialRegistry: 0x4Df9A6FE9A806CfDb87eDf49995F8636Ae2FF5Ea
CredentialNFT: 0xFc419383BdfE4d550d913d3f7c418ef05487f84e
VerificationContract: 0x3F52de984aBf402a0c01d687888bD62d0537aB3F
```

You'll need them for the backend and frontend .env files in the next steps.

3️⃣ Backend Setup (skillchain-backend)
Open a new terminal tab/window and navigate to the backend directory:
```bash
cd skillchain-backend
```

A. Environment Variables (.env)
Create a .env file in skillchain-backend with the following (replace placeholders and contract addresses from your deployment):
```bash
PORT=3000
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
ISSUER_REGISTRY_ADDRESS=0x4b0989065f79128D4a537283AA05d8555F132F82
CREDENTIAL_REGISTRY_ADDRESS=0x4Df9A6FE9A806CfDb87eDf49995F8636Ae2FF5Ea
CREDENTIAL_NFT_ADDRESS=0xFc419383BdfE4d550d913d3f7c418ef05487f84e
VERIFICATION_CONTRACT_ADDRESS=0x3F52de984aBf402a0c01d687888bD62d0537aB3F
ADMIN_PRIVATE_KEY=0xYOUR_ADMIN_WALLET_PRIVATE_KEY_HERE # Same as DEPLOYER_PRIVATE_KEY
PINATA_API_KEY=YOUR_PINATA_API_KEY
PINATA_SECRET_API_KEY=YOUR_PINATA_SECRET_API_KEY
PINATA_JWT=YOUR_PINATA_JWT_TOKEN
FRONTEND_URL=http://localhost:5173 # Local frontend URL for CORS during development
```

B. Install Dependencies
```bash
npm install # or yarn install
```

C. Run Backend
```bash
npm start
```

The backend will run on http://localhost:3000. You can test a GET endpoint like http://localhost:3000/admin/total-issuers in your browser.

4️⃣ Frontend Setup (skillchain-frontend)
Open another new terminal tab/window and navigate to the frontend directory:
```bash
cd skillchain-frontend
```

A. Environment Variables (.env)
Create a .env file in skillchain-frontend with the following (replace placeholders and contract addresses):
```bash
VITE_BACKEND_API_URL=http://localhost:3000 # Your local backend URL for development
VITE_ISSUER_REGISTRY_ADDRESS=0x4b0989065f79128D4a537283AA05d8555F132F82
VITE_CREDENTIAL_REGISTRY_ADDRESS=0x4Df9A6FE9A806CfDb87eDf49995F8636Ae2FF5Ea
VITE_CREDENTIAL_NFT_ADDRESS=0xFc419383BdfE4d550d913d3f7c418ef05487f84e
VITE_VERIFICATION_CONTRACT_ADDRESS=0x3F52de984aBf402a0c01d687888bD62d0537aB3F
VITE_WALLETCONNECT_PROJECT_ID=YOUR_WALLETCONNECT_PROJECT_ID
```

B. Install Dependencies
```bash
npm install # or yarn install
```

C. Run Frontend
```bash
npm run dev
```

Open your browser at http://localhost:5173.

## ☁️ Deployment
Both the frontend and backend of SkillChain DApp are deployed on Render.

### Frontend Deployment (Static Site)

*   Service Type: Static Site
*   GitHub Repository: Agihtaws/skillchain
*   Root Directory: skillchain-frontend
*   Build Command: npm install && npm run build
*   Publish Directory: dist
*   Environment Variables: Set all VITE_ variables from your frontend's .env on Render. Crucially, VITE_BACKEND_API_URL should be set to your deployed backend API URL (e.g., https://skillchain-backend-5wu8.onrender.com).

### Backend Deployment (Web Service)

*   Service Type: Web Service
*   GitHub Repository: Agihtaws/skillchain
*   Root Directory: skillchain-backend
*   Build Command: npm install
*   Start Command: npm start
*   Environment Variables: Set all variables from your backend's .env on Render. Crucially, FRONTEND_URL should be set to your deployed frontend URL (e.g., https://skillchain-frontend-kcoy.onrender.com).

## 🎥 Demo Video

[![Watch the Demo](https://img.youtube.com/vi/SmBYU4qDSSo/maxresdefault.jpg)](https://www.youtube.com/watch?v=SmBYU4qDSSo)

🔗 Live Application Links

*   Live Frontend: https://skillchain-frontend-kcoy.onrender.com/
*   Live Backend API: https://skillchain-backend-5wu8.onrender.com/
*   GitHub Repository: https://github.com/Agihtaws/skillchain

## 📈 Future Enhancements

*  *Advanced Credential Types*: Support for more complex credential data structures or verifiable credentials standards (W3C VC).
*  *Recipient Profile Pages*: Allow recipients to build public profiles showcasing their credentials.
*  *Search & Filtering*: Enhanced search capabilities for credentials and issuers.
*  *Notification System*: On-chain event notifications for credential issuance/revocation.
*  *Integration with Identity Solutions*: Deeper integration with decentralized identity (DID) solutions.
*  *Multi-chain Support*: Extend to other EVM-compatible blockchains.
*  *Admin Analytics Dashboard*: Visualizations for total issuers, credentials, and verification trends.

## 👤 Author

*Swathiga Ganesh*

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
