const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VerificationContract", function () {
  let verificationContract;
  let credentialNFT;
  let issuerRegistry;
  let credentialRegistry;
  let admin;
  let issuer1;
  let issuer2;
  let recipient1;
  let recipient2;
  let verifier1;
  let verifier2;

  beforeEach(async function () {
    [admin, issuer1, issuer2, recipient1, recipient2, verifier1, verifier2] = await ethers.getSigners();
    
    const IssuerRegistry = await ethers.getContractFactory("IssuerRegistry");
    issuerRegistry = await IssuerRegistry.deploy();
    await issuerRegistry.waitForDeployment();
    
    const CredentialRegistry = await ethers.getContractFactory("CredentialRegistry");
    credentialRegistry = await CredentialRegistry.deploy();
    await credentialRegistry.waitForDeployment();
    
    const CredentialNFT = await ethers.getContractFactory("CredentialNFT");
    credentialNFT = await CredentialNFT.deploy(await issuerRegistry.getAddress());
    await credentialNFT.waitForDeployment();
    
    const VerificationContract = await ethers.getContractFactory("VerificationContract");
    verificationContract = await VerificationContract.deploy(
      await credentialNFT.getAddress(),
      await issuerRegistry.getAddress(),
      await credentialRegistry.getAddress()
    );
    await verificationContract.waitForDeployment();
    
    await issuerRegistry.connect(admin).registerIssuer(
      issuer1.address,
      "Harvard University",
      "ipfs://QmHarvard"
    );
    
    await issuerRegistry.connect(admin).verifyIssuer(issuer1.address, 5);
    await issuerRegistry.connect(admin).updateReputationScore(issuer1.address, 95);
    
    await credentialNFT.connect(issuer1).mintCredential(
      recipient1.address,
      "Bachelor of Computer Science",
      "ipfs://QmBachelorCS"
    );
  });

  describe("1. Provides public verification functions that anyone can call", function () {
    it("Should allow anyone to verify a credential publicly", async function () {
      const result = await verificationContract.connect(verifier1).verifyCredentialPublic.staticCall(1);
      
      expect(result[0]).to.equal(true); // isValid
    });

    it("Should allow multiple different verifiers to verify same credential", async function () {
      await verificationContract.connect(verifier1).verifyCredentialPublic(1);
      await verificationContract.connect(verifier2).verifyCredentialPublic(1);
      
      const history = await verificationContract.getVerificationHistory(1);
      expect(history.length).to.equal(2);
      expect(history[0].verifier).to.equal(verifier1.address);
      expect(history[1].verifier).to.equal(verifier2.address);
    });

    it("Should allow verification without authentication", async function () {
      const [, , , , , , , publicUser] = await ethers.getSigners();
      
      const result = await verificationContract.connect(publicUser).verifyCredentialPublic.staticCall(1);
      expect(result[0]).to.equal(true); // isValid
    });

    it("Should handle verification of non-existent credential", async function () {
      const result = await verificationContract.connect(verifier1).verifyCredentialPublic.staticCall(999);
      
      expect(result[0]).to.equal(false); // isValid
      expect(result[1]).to.equal(ethers.ZeroAddress); // recipient
      expect(result[2]).to.equal(ethers.ZeroAddress); // issuer
    });

    it("Should provide batch verification functionality", async function () {
      await credentialNFT.connect(issuer1).mintCredential(
        recipient1.address,
        "Master Degree",
        "ipfs://QmMaster"
      );
      
      await credentialNFT.connect(issuer1).mintCredential(
        recipient2.address,
        "PhD Degree",
        "ipfs://QmPhD"
      );
      
      const results = await verificationContract.batchVerifyCredentials([1, 2, 3]);
      
      expect(results[0]).to.equal(true);
      expect(results[1]).to.equal(true);
      expect(results[2]).to.equal(true);
    });

    it("Should handle batch verification with invalid credentials", async function () {
      const results = await verificationContract.batchVerifyCredentials([1, 999, 888]);
      
      expect(results[0]).to.equal(true);
      expect(results[1]).to.equal(false);
      expect(results[2]).to.equal(false);
    });
  });

  describe("2. Returns credential validity, issuer information, and recipient details", function () {
    it("Should return credential validity status", async function () {
      const result = await verificationContract.connect(verifier1).verifyCredentialPublic.staticCall(1);
      
      expect(result[0]).to.equal(true); // isValid
    });

    it("Should return issuer information", async function () {
      await verificationContract.connect(recipient1).setPrivacySettings(
        true, true, true, true, true
      );
      
      const result = await verificationContract.connect(verifier1).verifyCredentialPublic.staticCall(1);
      
      expect(result[2]).to.equal(issuer1.address); // issuer
      expect(result[5]).to.equal("Harvard University"); // issuerName
      expect(result[6]).to.equal(true); // issuerVerified
    });

    it("Should return recipient details", async function () {
      await verificationContract.connect(recipient1).setPrivacySettings(
        true, true, true, true, true
      );
      
      const result = await verificationContract.connect(verifier1).verifyCredentialPublic.staticCall(1);
      
      expect(result[1]).to.equal(recipient1.address); // recipient
    });

    it("Should return credential type", async function () {
      await verificationContract.connect(recipient1).setPrivacySettings(
        true, true, true, true, true
      );
      
      const result = await verificationContract.connect(verifier1).verifyCredentialPublic.staticCall(1);
      
      expect(result[3]).to.equal("Bachelor of Computer Science"); // credentialType
    });

    it("Should return mint date", async function () {
      await verificationContract.connect(recipient1).setPrivacySettings(
        true, true, true, true, true
      );
      
      const result = await verificationContract.connect(verifier1).verifyCredentialPublic.staticCall(1);
      
      expect(result[4]).to.be.greaterThan(0); // mintDate
    });

    it("Should return full verification details", async function () {
      const details = await verificationContract.getFullVerificationDetails(1);
      
      expect(details.isValid).to.equal(true);
      expect(details.recipient).to.equal(recipient1.address);
      expect(details.issuer).to.equal(issuer1.address);
      expect(details.issuerName).to.equal("Harvard University");
      expect(details.credentialType).to.equal("Bachelor of Computer Science");
      expect(details.issuerVerified).to.equal(true);
      expect(details.issuerActive).to.equal(true);
      expect(details.issuerReputationScore).to.equal(95);
      expect(details.verificationLevel).to.equal(5);
    });

    it("Should verify issuer authorization status", async function () {
      const isAuthorized = await verificationContract.verifyIssuerAuthorization(issuer1.address);
      expect(isAuthorized).to.equal(true);
    });

    it("Should return false for unauthorized issuer", async function () {
      const isAuthorized = await verificationContract.verifyIssuerAuthorization(recipient1.address);
      expect(isAuthorized).to.equal(false);
    });
  });

  describe("3. Generates verification proofs or QR code data", function () {
    it("Should generate verification proof with all details", async function () {
      const proof = await verificationContract.connect(verifier1).generateVerificationProof.staticCall(1);
      
      expect(proof.credentialId).to.equal(1);
      expect(proof.recipient).to.equal(recipient1.address);
      expect(proof.issuer).to.equal(issuer1.address);
      expect(proof.issuerName).to.equal("Harvard University");
      expect(proof.credentialType).to.equal("Bachelor of Computer Science");
      expect(proof.isValid).to.equal(true);
      expect(proof.issuerVerified).to.equal(true);
      expect(proof.issuerReputationScore).to.equal(95);
      expect(proof.verificationLevel).to.equal(5);
      expect(proof.proofTimestamp).to.be.greaterThan(0);
      expect(proof.proofHash).to.not.equal(ethers.ZeroHash);
    });

    it("Should emit VerificationProofGenerated event", async function () {
      await expect(
        verificationContract.connect(verifier1).generateVerificationProof(1)
      ).to.emit(verificationContract, "VerificationProofGenerated");
    });

    it("Should generate unique proof hash for each verification", async function () {
      const proof1 = await verificationContract.connect(verifier1).generateVerificationProof.staticCall(1);
      
      await ethers.provider.send("evm_increaseTime", [100]);
      await ethers.provider.send("evm_mine");
      
      const proof2 = await verificationContract.connect(verifier1).generateVerificationProof.staticCall(1);
      
      expect(proof1.proofHash).to.not.equal(proof2.proofHash);
    });

    it("Should generate QR code data for credential", async function () {
      const qrData = await verificationContract.generateQRCodeData(1);
      
      expect(qrData).to.equal("skillchain://verify/1");
    });

    it("Should generate different QR codes for different credentials", async function () {
      await credentialNFT.connect(issuer1).mintCredential(
        recipient2.address,
        "Master Degree",
        "ipfs://QmMaster"
      );
      
      const qrData1 = await verificationContract.generateQRCodeData(1);
      const qrData2 = await verificationContract.generateQRCodeData(2);
      
      expect(qrData1).to.equal("skillchain://verify/1");
      expect(qrData2).to.equal("skillchain://verify/2");
    });

    it("Should reject generating proof for non-existent credential", async function () {
      await expect(
        verificationContract.generateVerificationProof(999)
      ).to.be.revertedWith("Credential does not exist");
    });

    it("Should reject generating QR code for non-existent credential", async function () {
      await expect(
        verificationContract.generateQRCodeData(999)
      ).to.be.revertedWith("Credential does not exist");
    });
  });

  describe("4. Tracks verification requests for analytics", function () {
    it("Should track verification requests", async function () {
      await verificationContract.connect(verifier1).verifyCredentialPublic(1);
      
      const history = await verificationContract.getVerificationHistory(1);
      
      expect(history.length).to.equal(1);
      expect(history[0].verifier).to.equal(verifier1.address);
      expect(history[0].credentialId).to.equal(1);
      expect(history[0].successful).to.equal(true);
      expect(history[0].timestamp).to.be.greaterThan(0);
    });

    it("Should track multiple verification requests", async function () {
      await verificationContract.connect(verifier1).verifyCredentialPublic(1);
      await verificationContract.connect(verifier2).verifyCredentialPublic(1);
      await verificationContract.connect(verifier1).verifyCredentialPublic(1);
      
      const history = await verificationContract.getVerificationHistory(1);
      
      expect(history.length).to.equal(3);
    });

    it("Should emit VerificationRequested event", async function () {
      await expect(
        verificationContract.connect(verifier1).verifyCredentialPublic(1)
      )
        .to.emit(verificationContract, "VerificationRequested")
        .withArgs(
          verifier1.address,
          1,
          await ethers.provider.getBlock('latest').then(b => b.timestamp + 1),
          true
        );
    });

    it("Should track failed verification attempts", async function () {
      await verificationContract.connect(verifier1).verifyCredentialPublic(999);
      
      const history = await verificationContract.getVerificationHistory(999);
      
      expect(history.length).to.equal(1);
      expect(history[0].successful).to.equal(false);
    });

    it("Should count verifications per verifier", async function () {
      await verificationContract.connect(verifier1).verifyCredentialPublic(1);
      await verificationContract.connect(verifier1).verifyCredentialPublic(1);
      
      await credentialNFT.connect(issuer1).mintCredential(
        recipient2.address,
        "Another Degree",
        "ipfs://QmAnother"
      );
      
      await verificationContract.connect(verifier1).verifyCredentialPublic(2);
      
      const count = await verificationContract.getVerificationCount(verifier1.address);
      expect(count).to.equal(3);
    });

    it("Should track total verifications across all credentials", async function () {
      await verificationContract.connect(verifier1).verifyCredentialPublic(1);
      await verificationContract.connect(verifier2).verifyCredentialPublic(1);
      
      const total = await verificationContract.getTotalVerifications();
      expect(total).to.equal(2);
    });

    it("Should get verification count for specific credential", async function () {
      await verificationContract.connect(verifier1).verifyCredentialPublic(1);
      await verificationContract.connect(verifier2).verifyCredentialPublic(1);
      await verificationContract.connect(verifier1).verifyCredentialPublic(1);
      
      const count = await verificationContract.getCredentialVerificationCount(1);
      expect(count).to.equal(3);
    });

    it("Should track verifications when generating proof", async function () {
      await verificationContract.connect(verifier1).generateVerificationProof(1);
      
      const count = await verificationContract.getCredentialVerificationCount(1);
      expect(count).to.equal(1);
    });
  });

  describe("5. Implements privacy features so users can choose what information to reveal", function () {
    it("Should allow users to set privacy settings", async function () {
      await verificationContract.connect(recipient1).setPrivacySettings(
        true,
        false,
        true,
        false,
        true
      );
      
      const settings = await verificationContract.getPrivacySettings(recipient1.address);
      
      expect(settings.showRecipientAddress).to.equal(true);
      expect(settings.showIssuerAddress).to.equal(false);
      expect(settings.showMintDate).to.equal(true);
      expect(settings.showCredentialType).to.equal(false);
      expect(settings.showIssuerName).to.equal(true);
    });

    it("Should emit PrivacySettingsUpdated event", async function () {
      await expect(
        verificationContract.connect(recipient1).setPrivacySettings(true, true, true, true, true)
      )
        .to.emit(verificationContract, "PrivacySettingsUpdated")
        .withArgs(
          recipient1.address,
          await ethers.provider.getBlock('latest').then(b => b.timestamp + 1)
        );
    });

    it("Should hide recipient address based on privacy settings", async function () {
      await verificationContract.connect(recipient1).setPrivacySettings(
        false, // showRecipientAddress
        true,
        true,
        true,
        true
      );
      
      const result = await verificationContract.connect(verifier1).verifyCredentialPublic.staticCall(1);
      
      expect(result[1]).to.equal(ethers.ZeroAddress); // recipient
    });

    it("Should hide issuer address based on privacy settings", async function () {
      await verificationContract.connect(recipient1).setPrivacySettings(
        true,
        false, // showIssuerAddress
        true,
        true,
        true
      );
      
      const result = await verificationContract.connect(verifier1).verifyCredentialPublic.staticCall(1);
      
      expect(result[2]).to.equal(ethers.ZeroAddress); // issuer
    });

    it("Should hide mint date based on privacy settings", async function () {
      await verificationContract.connect(recipient1).setPrivacySettings(
        true,
        true,
        false, // showMintDate
        true,
        true
      );
      
      const result = await verificationContract.connect(verifier1).verifyCredentialPublic.staticCall(1);
      
      expect(result[4]).to.equal(0); // mintDate
    });

    it("Should hide credential type based on privacy settings", async function () {
      await verificationContract.connect(recipient1).setPrivacySettings(
        true,
        true,
        true,
        false, // showCredentialType
        true
      );
      
      const result = await verificationContract.connect(verifier1).verifyCredentialPublic.staticCall(1);
      
      expect(result[3]).to.equal(""); // credentialType
    });

    it("Should hide issuer name based on privacy settings", async function () {
      await verificationContract.connect(recipient1).setPrivacySettings(
        true,
        true,
        true,
        true,
        false // showIssuerName
      );
      
      const result = await verificationContract.connect(verifier1).verifyCredentialPublic.staticCall(1);
      
      expect(result[5]).to.equal(""); // issuerName
    });

    it("Should default privacy settings to all hidden if not set", async function () {
      // recipient2 has not set any privacy settings
      await credentialNFT.connect(issuer1).mintCredential(
        recipient2.address,
        "Recipient2 Degree",
        "ipfs://QmR2Degree"
      );

      const result = await verificationContract.connect(verifier1).verifyCredentialPublic.staticCall(2);
      
      expect(result[1]).to.equal(ethers.ZeroAddress); // recipient
      expect(result[2]).to.equal(ethers.ZeroAddress); // issuer
      expect(result[4]).to.equal(0); // mintDate
      expect(result[3]).to.equal(""); // credentialType
      expect(result[5]).to.equal(""); // issuerName
    });

    it("Should allow multiple users to have independent privacy settings", async function () {
      await verificationContract.connect(recipient1).setPrivacySettings(
        true, false, true, false, true
      );
      
      await credentialNFT.connect(issuer1).mintCredential(
        recipient2.address,
        "Another Degree",
        "ipfs://QmAnother"
      );

      await verificationContract.connect(recipient2).setPrivacySettings(
        false, true, false, true, false
      );

      const result1 = await verificationContract.connect(verifier1).verifyCredentialPublic.staticCall(1);
      expect(result1[1]).to.equal(recipient1.address); // recipient shown
      expect(result1[2]).to.equal(ethers.ZeroAddress); // issuer hidden
      
      const result2 = await verificationContract.connect(verifier1).verifyCredentialPublic.staticCall(2);
      expect(result2[1]).to.equal(ethers.ZeroAddress); // recipient hidden
      expect(result2[2]).to.equal(issuer1.address); // issuer shown
    });
  });

  describe("Constructor and deployment", function () {
    it("Should reject deployment with zero address for CredentialNFT", async function () {
      const VerificationContract = await ethers.getContractFactory("VerificationContract");
      await expect(
        VerificationContract.deploy(
          ethers.ZeroAddress,
          await issuerRegistry.getAddress(),
          await credentialRegistry.getAddress()
        )
      ).to.be.revertedWith("Invalid credential NFT address");
    });

    it("Should reject deployment with zero address for IssuerRegistry", async function () {
      const VerificationContract = await ethers.getContractFactory("VerificationContract");
      await expect(
        VerificationContract.deploy(
          await credentialNFT.getAddress(),
          ethers.ZeroAddress,
          await credentialRegistry.getAddress()
        )
      ).to.be.revertedWith("Invalid issuer registry address");
    });

    it("Should reject deployment with zero address for CredentialRegistry", async function () {
      const VerificationContract = await ethers.getContractFactory("VerificationContract");
      await expect(
        VerificationContract.deploy(
          await credentialNFT.getAddress(),
          await issuerRegistry.getAddress(),
          ethers.ZeroAddress
        )
      ).to.be.revertedWith("Invalid credential registry address");
    });

    it("Should store correct contract addresses upon deployment", async function () {
      const nftAddress = await credentialNFT.getAddress();
      const irAddress = await issuerRegistry.getAddress();
      const crAddress = await credentialRegistry.getAddress();

      const VerificationContract = await ethers.getContractFactory("VerificationContract");
      const deployedContract = await VerificationContract.deploy(
        nftAddress,
        irAddress,
        crAddress
      );
      await deployedContract.waitForDeployment();

      expect(await deployedContract.credentialNFTAddress()).to.equal(nftAddress);
      expect(await deployedContract.issuerRegistryAddress()).to.equal(irAddress);
      expect(await deployedContract.credentialRegistryAddress()).to.equal(crAddress);
    });
  });
});
