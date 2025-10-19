const hre = require("hardhat");
require("dotenv").config(); // Ensure dotenv is configured to load environment variables

async function main() {
  console.log("Starting SkillChain deployment to Base Sepolia...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy IssuerRegistry
  console.log("Deploying IssuerRegistry...");
  const IssuerRegistry = await hre.ethers.getContractFactory("IssuerRegistry");
  const issuerRegistry = await IssuerRegistry.deploy();
  await issuerRegistry.waitForDeployment();
  const issuerRegistryAddress = await issuerRegistry.getAddress();
  console.log("IssuerRegistry deployed to:", issuerRegistryAddress);
  console.log("Waiting for block confirmations...\n");
  await issuerRegistry.deploymentTransaction().wait(5);

  // Deploy CredentialRegistry
  console.log("Deploying CredentialRegistry...");
  const CredentialRegistry = await hre.ethers.getContractFactory("CredentialRegistry");
  // Pass the issuerRegistryAddress to the CredentialRegistry constructor
  const credentialRegistry = await CredentialRegistry.deploy(issuerRegistryAddress);
  await credentialRegistry.waitForDeployment();
  const credentialRegistryAddress = await credentialRegistry.getAddress();
  console.log("CredentialRegistry deployed to:", credentialRegistryAddress);
  console.log("Waiting for block confirmations...\n");
  await credentialRegistry.deploymentTransaction().wait(5);

  // Deploy CredentialNFT
  console.log("Deploying CredentialNFT...");
  const CredentialNFT = await hre.ethers.getContractFactory("CredentialNFT");
  const credentialNFT = await CredentialNFT.deploy(issuerRegistryAddress);
  await credentialNFT.waitForDeployment();
  const credentialNFTAddress = await credentialNFT.getAddress();
  console.log("CredentialNFT deployed to:", credentialNFTAddress);
  console.log("Waiting for block confirmations...\n");
  await credentialNFT.deploymentTransaction().wait(5);

  // Deploy VerificationContract
  const FRONTEND_RENDER_URL = process.env.FRONTEND_RENDER_URL; // <<< Read from .env
  if (!FRONTEND_RENDER_URL) {
    throw new Error("FRONTEND_RENDER_URL not set in .env file.");
  }
  console.log("Deploying VerificationContract...");
  const VerificationContract = await hre.ethers.getContractFactory("VerificationContract");
  const verificationContract = await VerificationContract.deploy(
    credentialNFTAddress,
    issuerRegistryAddress,
    credentialRegistryAddress,
    FRONTEND_RENDER_URL // <<< Pass the frontend URL here
  );
  await verificationContract.waitForDeployment();
  const verificationContractAddress = await verificationContract.getAddress();
  console.log("VerificationContract deployed to:", verificationContractAddress);
  console.log("Waiting for block confirmations...\n");
  await verificationContract.deploymentTransaction().wait(5);

  // Summary
  console.log("\n====================================================");
  console.log("DEPLOYMENT SUMMARY");
  console.log("====================================================");
  console.log("IssuerRegistry:", issuerRegistryAddress);
  console.log("CredentialRegistry:", credentialRegistryAddress);
  console.log("CredentialNFT:", credentialNFTAddress);
  console.log("VerificationContract:", verificationContractAddress);
  console.log("====================================================\n");

  // Save deployment addresses to file
  const fs = require("fs");
  const deploymentInfo = {
    network: "baseSepolia",
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      IssuerRegistry: issuerRegistryAddress,
      CredentialRegistry: credentialRegistryAddress,
      CredentialNFT: credentialNFTAddress,
      VerificationContract: verificationContractAddress
    }
  };

  fs.writeFileSync(
    "deployment-addresses.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("Deployment addresses saved to deployment-addresses.json\n");

  console.log("Deployment completed successfully!");
  console.log("\nNext steps:");
  console.log("1. Add FRONTEND_RENDER_URL='https://skillchain-frontend-kcoy.onrender.com' to your .env file.");
  console.log("2. Verify contracts on BaseScan");
  console.log("3. Register first issuer using IssuerRegistry.registerIssuer()");
  console.log("4. Verify issuer using IssuerRegistry.verifyIssuer()");
  console.log("5. Start minting credentials using CredentialNFT.mintCredential()");
  console.log("   (Note: You can also use CredentialRegistry.issueCredential() if you prefer)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
