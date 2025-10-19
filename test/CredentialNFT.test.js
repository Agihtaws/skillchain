const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CredentialNFT", function () {
  let credentialNFT;
  let issuerRegistry;
  let owner;
  let issuer1;
  let issuer2;
  let recipient1;
  let recipient2;
  let recipient3;

  beforeEach(async function () {
    [owner, issuer1, issuer2, recipient1, recipient2, recipient3] = await ethers.getSigners();
    
    const IssuerRegistry = await ethers.getContractFactory("IssuerRegistry");
    issuerRegistry = await IssuerRegistry.deploy();
    await issuerRegistry.waitForDeployment();
    
    const CredentialNFT = await ethers.getContractFactory("CredentialNFT");
    credentialNFT = await CredentialNFT.deploy(await issuerRegistry.getAddress());
    await credentialNFT.waitForDeployment();
  });

  describe("1. Mints each credential as a unique NFT", function () {
    it("Should mint a single credential NFT", async function () {
      const tokenId = await credentialNFT.connect(issuer1).mintCredential(
        recipient1.address,
        "Bachelor of Science",
        "ipfs://QmBachelorScience"
      );

      expect(await credentialNFT.ownerOf(1)).to.equal(recipient1.address);
      expect(await credentialNFT.getTotalCredentials()).to.equal(1);
    });

    it("Should mint multiple unique credentials with incremental token IDs", async function () {
      await credentialNFT.connect(issuer1).mintCredential(
        recipient1.address,
        "Degree 1",
        "ipfs://Qm1"
      );

      await credentialNFT.connect(issuer1).mintCredential(
        recipient2.address,
        "Degree 2",
        "ipfs://Qm2"
      );

      await credentialNFT.connect(issuer2).mintCredential(
        recipient1.address,
        "Degree 3",
        "ipfs://Qm3"
      );

      expect(await credentialNFT.ownerOf(1)).to.equal(recipient1.address);
      expect(await credentialNFT.ownerOf(2)).to.equal(recipient2.address);
      expect(await credentialNFT.ownerOf(3)).to.equal(recipient1.address);
      expect(await credentialNFT.getTotalCredentials()).to.equal(3);
    });

    it("Should emit CredentialMinted event with correct parameters", async function () {
      await expect(
        credentialNFT.connect(issuer1).mintCredential(
          recipient1.address,
          "Master Degree",
          "ipfs://QmMaster"
        )
      )
        .to.emit(credentialNFT, "CredentialMinted")
        .withArgs(
          1,
          recipient1.address,
          issuer1.address,
          "Master Degree",
          "ipfs://QmMaster",
          await ethers.provider.getBlock('latest').then(b => b.timestamp + 1)
        );
    });

    it("Should store correct metadata for each minted credential", async function () {
      await credentialNFT.connect(issuer1).mintCredential(
        recipient1.address,
        "PhD Degree",
        "ipfs://QmPhD"
      );

      const metadata = await credentialNFT.getCredentialMetadata(1);
      expect(metadata.tokenId).to.equal(1);
      expect(metadata.recipient).to.equal(recipient1.address);
      expect(metadata.issuer).to.equal(issuer1.address);
      expect(metadata.credentialType).to.equal("PhD Degree");
      expect(metadata.isValid).to.equal(true);
      expect(metadata.mintDate).to.be.greaterThan(0);
    });

    it("Should mark token as existing after minting", async function () {
      await credentialNFT.connect(issuer1).mintCredential(
        recipient1.address,
        "Certificate",
        "ipfs://QmCert"
      );

      expect(await credentialNFT.tokenExists(1)).to.equal(true);
      expect(await credentialNFT.tokenExists(999)).to.equal(false);
    });
  });

  describe("2. Links to credential metadata stored on IPFS", function () {
    it("Should store IPFS URI correctly", async function () {
      const ipfsURI = "ipfs://QmSpecificHashABC123";
      
      await credentialNFT.connect(issuer1).mintCredential(
        recipient1.address,
        "Blockchain Certificate",
        ipfsURI
      );

      const uri = await credentialNFT.tokenURI(1);
      expect(uri).to.equal(ipfsURI);
    });

    it("Should link different IPFS URIs for different credentials", async function () {
      await credentialNFT.connect(issuer1).mintCredential(
        recipient1.address,
        "Degree 1",
        "ipfs://QmHash1"
      );

      await credentialNFT.connect(issuer1).mintCredential(
        recipient2.address,
        "Degree 2",
        "ipfs://QmHash2"
      );

      expect(await credentialNFT.tokenURI(1)).to.equal("ipfs://QmHash1");
      expect(await credentialNFT.tokenURI(2)).to.equal("ipfs://QmHash2");
    });

    it("Should retrieve metadata URI through verifyCredential function", async function () {
      const ipfsURI = "ipfs://QmVerificationTest";
      
      await credentialNFT.connect(issuer1).mintCredential(
        recipient1.address,
        "Test Credential",
        ipfsURI
      );

      const verification = await credentialNFT.verifyCredential(1);
      expect(verification.credentialTokenURI).to.equal(ipfsURI);
    });

    it("Should reject minting with empty token URI", async function () {
      await expect(
        credentialNFT.connect(issuer1).mintCredential(
          recipient1.address,
          "Valid Degree",
          ""
        )
      ).to.be.revertedWith("Token URI cannot be empty");
    });
  });

  describe("3. Ensures credentials are non-transferable (soulbound)", function () {
    beforeEach(async function () {
      await credentialNFT.connect(issuer1).mintCredential(
        recipient1.address,
        "Soulbound Degree",
        "ipfs://QmSoulbound"
      );
    });

    it("Should prevent transferFrom", async function () {
      await expect(
        credentialNFT.connect(recipient1).transferFrom(
          recipient1.address,
          recipient2.address,
          1
        )
      ).to.be.revertedWith("Credentials are non-transferable (soulbound)");
    });

    it("Should prevent safeTransferFrom with data", async function () {
      await expect(
        credentialNFT.connect(recipient1)["safeTransferFrom(address,address,uint256,bytes)"](
          recipient1.address,
          recipient2.address,
          1,
          "0x"
        )
      ).to.be.revertedWith("Credentials are non-transferable (soulbound)");
    });

    it("Should prevent safeTransferFrom without data", async function () {
      await expect(
        credentialNFT.connect(recipient1)["safeTransferFrom(address,address,uint256)"](
          recipient1.address,
          recipient2.address,
          1
        )
      ).to.be.revertedWith("Credentials are non-transferable (soulbound)");
    });

    it("Should prevent approve", async function () {
      await expect(
        credentialNFT.connect(recipient1).approve(recipient2.address, 1)
      ).to.be.revertedWith("Credentials are non-transferable (soulbound)");
    });

    it("Should prevent setApprovalForAll", async function () {
      await expect(
        credentialNFT.connect(recipient1).setApprovalForAll(recipient2.address, true)
      ).to.be.revertedWith("Credentials are non-transferable (soulbound)");
    });

    it("Should return zero address for getApproved", async function () {
      const approved = await credentialNFT.getApproved(1);
      expect(approved).to.equal(ethers.ZeroAddress);
    });

    it("Should return false for isApprovedForAll", async function () {
      const isApproved = await credentialNFT.isApprovedForAll(recipient1.address, recipient2.address);
      expect(isApproved).to.equal(false);
    });

    it("Should keep credential with original owner permanently", async function () {
      expect(await credentialNFT.ownerOf(1)).to.equal(recipient1.address);
      
      await expect(
        credentialNFT.connect(recipient1).transferFrom(
          recipient1.address,
          recipient2.address,
          1
        )
      ).to.be.revertedWith("Credentials are non-transferable (soulbound)");
      
      expect(await credentialNFT.ownerOf(1)).to.equal(recipient1.address);
    });
  });

  describe("4. Handles batch minting for institutions", function () {
    it("Should batch mint multiple credentials at once", async function () {
      const recipients = [recipient1.address, recipient2.address, recipient3.address];
      const types = ["Degree 1", "Degree 2", "Degree 3"];
      const uris = ["ipfs://Qm1", "ipfs://Qm2", "ipfs://Qm3"];

      const tx = await credentialNFT.connect(issuer1).batchMintCredentials(
        recipients,
        types,
        uris
      );

      const receipt = await tx.wait();
      
      expect(await credentialNFT.ownerOf(1)).to.equal(recipient1.address);
      expect(await credentialNFT.ownerOf(2)).to.equal(recipient2.address);
      expect(await credentialNFT.ownerOf(3)).to.equal(recipient3.address);
      expect(await credentialNFT.getTotalCredentials()).to.equal(3);
    });

    it("Should emit BatchCredentialsMinted event", async function () {
      const recipients = [recipient1.address, recipient2.address];
      const types = ["Batch Degree 1", "Batch Degree 2"];
      const uris = ["ipfs://QmBatch1", "ipfs://QmBatch2"];

      await expect(
        credentialNFT.connect(issuer1).batchMintCredentials(recipients, types, uris)
      ).to.emit(credentialNFT, "BatchCredentialsMinted");
    });

    it("Should emit individual CredentialMinted events for each credential in batch", async function () {
      const recipients = [recipient1.address, recipient2.address];
      const types = ["Individual 1", "Individual 2"];
      const uris = ["ipfs://QmInd1", "ipfs://QmInd2"];

      const tx = await credentialNFT.connect(issuer1).batchMintCredentials(recipients, types, uris);
      const receipt = await tx.wait();
      
      const mintEvents = receipt.logs.filter(log => {
        try {
          const parsed = credentialNFT.interface.parseLog(log);
          return parsed && parsed.name === "CredentialMinted";
        } catch {
          return false;
        }
      });

      expect(mintEvents.length).to.equal(2);
    });

    it("Should return array of minted token IDs from batch mint", async function () {
      const recipients = [recipient1.address, recipient2.address, recipient3.address];
      const types = ["Type 1", "Type 2", "Type 3"];
      const uris = ["ipfs://Qm1", "ipfs://Qm2", "ipfs://Qm3"];

      const tx = await credentialNFT.connect(issuer1).batchMintCredentials(recipients, types, uris);
      const receipt = await tx.wait();
      
      expect(await credentialNFT.getTotalCredentials()).to.equal(3);
    });

    it("Should reject batch mint with empty recipients array", async function () {
      await expect(
        credentialNFT.connect(issuer1).batchMintCredentials([], [], [])
      ).to.be.revertedWith("Recipients array cannot be empty");
    });

    it("Should reject batch mint with mismatched array lengths", async function () {
      const recipients = [recipient1.address, recipient2.address];
      const types = ["Type 1"];
      const uris = ["ipfs://Qm1", "ipfs://Qm2"];

      await expect(
        credentialNFT.connect(issuer1).batchMintCredentials(recipients, types, uris)
      ).to.be.revertedWith("Arrays length mismatch");
    });

    it("Should reject batch mint with invalid recipient address", async function () {
      const recipients = [recipient1.address, ethers.ZeroAddress];
      const types = ["Type 1", "Type 2"];
      const uris = ["ipfs://Qm1", "ipfs://Qm2"];

      await expect(
        credentialNFT.connect(issuer1).batchMintCredentials(recipients, types, uris)
      ).to.be.revertedWith("Invalid recipient address");
    });

    it("Should batch mint large number of credentials efficiently", async function () {
      const count = 10;
      const recipients = Array(count).fill(recipient1.address);
      const types = Array(count).fill(0).map((_, i) => `Degree ${i + 1}`);
      const uris = Array(count).fill(0).map((_, i) => `ipfs://Qm${i + 1}`);

      await credentialNFT.connect(issuer1).batchMintCredentials(recipients, types, uris);

      expect(await credentialNFT.getTotalCredentials()).to.equal(count);
      expect(await credentialNFT.balanceOf(recipient1.address)).to.equal(count);
    });

    it("Should track all batch minted credentials for issuer", async function () {
      const recipients = [recipient1.address, recipient2.address, recipient3.address];
      const types = ["Degree 1", "Degree 2", "Degree 3"];
      const uris = ["ipfs://Qm1", "ipfs://Qm2", "ipfs://Qm3"];

      await credentialNFT.connect(issuer1).batchMintCredentials(recipients, types, uris);

      const issuerCreds = await credentialNFT.getIssuerCredentials(issuer1.address);
      expect(issuerCreds.length).to.equal(3);
      expect(issuerCreds[0]).to.equal(1);
      expect(issuerCreds[1]).to.equal(2);
      expect(issuerCreds[2]).to.equal(3);
    });
  });

  describe("5. Implements view functions for easy verification by employers", function () {
    beforeEach(async function () {
      await credentialNFT.connect(issuer1).mintCredential(
        recipient1.address,
        "Computer Science Degree",
        "ipfs://QmCSdegree"
      );

      await credentialNFT.connect(issuer1).mintCredential(
        recipient1.address,
        "Mathematics Degree",
        "ipfs://QmMathDegree"
      );

      await credentialNFT.connect(issuer2).mintCredential(
        recipient2.address,
        "Engineering Degree",
        "ipfs://QmEngDegree"
      );
    });

    it("Should verify credential with all details", async function () {
      const verification = await credentialNFT.verifyCredential(1);
      
      expect(verification.recipient).to.equal(recipient1.address);
      expect(verification.issuer).to.equal(issuer1.address);
      expect(verification.credentialType).to.equal("Computer Science Degree");
      expect(verification.isValid).to.equal(true);
      expect(verification.credentialTokenURI).to.equal("ipfs://QmCSdegree");
      expect(verification.mintDate).to.be.greaterThan(0);
    });

    it("Should get all credentials for a recipient", async function () {
      const recipientCreds = await credentialNFT.getRecipientCredentials(recipient1.address);
      
      expect(recipientCreds.length).to.equal(2);
      expect(recipientCreds[0]).to.equal(1);
      expect(recipientCreds[1]).to.equal(2);
    });

    it("Should get all credentials issued by an issuer", async function () {
      const issuerCreds = await credentialNFT.getIssuerCredentials(issuer1.address);
      
      expect(issuerCreds.length).to.equal(2);
      expect(issuerCreds[0]).to.equal(1);
      expect(issuerCreds[1]).to.equal(2);
    });

    it("Should check if credential is valid", async function () {
      const isValid = await credentialNFT.isCredentialValid(1);
      expect(isValid).to.equal(true);
    });

    it("Should return false for non-existent credential validity check", async function () {
      const isValid = await credentialNFT.isCredentialValid(999);
      expect(isValid).to.equal(false);
    });

    it("Should get complete credential metadata", async function () {
      const metadata = await credentialNFT.getCredentialMetadata(1);
      
      expect(metadata.tokenId).to.equal(1);
      expect(metadata.recipient).to.equal(recipient1.address);
      expect(metadata.issuer).to.equal(issuer1.address);
      expect(metadata.credentialType).to.equal("Computer Science Degree");
      expect(metadata.isValid).to.equal(true);
      expect(metadata.mintDate).to.be.greaterThan(0);
    });

    it("Should get total number of credentials minted", async function () {
      const total = await credentialNFT.getTotalCredentials();
      expect(total).to.equal(3);
    });

    it("Should allow employers to verify multiple credentials for a candidate", async function () {
      const recipientCreds = await credentialNFT.getRecipientCredentials(recipient1.address);
      
      for (let i = 0; i < recipientCreds.length; i++) {
        const verification = await credentialNFT.verifyCredential(recipientCreds[i]);
        expect(verification.recipient).to.equal(recipient1.address);
        expect(verification.isValid).to.equal(true);
      }
    });

    it("Should verify credential from different issuers", async function () {
      const cred1 = await credentialNFT.verifyCredential(1);
      const cred3 = await credentialNFT.verifyCredential(3);
      
      expect(cred1.issuer).to.equal(issuer1.address);
      expect(cred3.issuer).to.equal(issuer2.address);
      expect(cred1.issuer).to.not.equal(cred3.issuer);
    });

    it("Should return empty array for recipient with no credentials", async function () {
      const noCreds = await credentialNFT.getRecipientCredentials(recipient3.address);
      expect(noCreds).to.be.an('array').that.is.empty;
    });

    it("Should return empty array for issuer with no credentials", async function () {
      const [, , , , , , noIssuer] = await ethers.getSigners();
      const noCreds = await credentialNFT.getIssuerCredentials(noIssuer.address);
      expect(noCreds).to.be.an('array').that.is.empty;
    });

    it("Should allow public verification without authentication", async function () {
      const [, , , , , , publicVerifier] = await ethers.getSigners();
      
      const verification = await credentialNFT.connect(publicVerifier).verifyCredential(1);
      expect(verification.recipient).to.equal(recipient1.address);
      expect(verification.isValid).to.equal(true);
    });
  });

  describe("Credential revocation functionality", function () {
    beforeEach(async function () {
      await credentialNFT.connect(issuer1).mintCredential(
        recipient1.address,
        "Revocable Degree",
        "ipfs://QmRevocable"
      );
    });

    it("Should allow issuer to revoke their credential", async function () {
      expect(await credentialNFT.isCredentialValid(1)).to.equal(true);
      
      await credentialNFT.connect(issuer1).revokeCredential(1);
      
      expect(await credentialNFT.isCredentialValid(1)).to.equal(false);
    });

    it("Should emit CredentialRevoked event", async function () {
      await expect(
        credentialNFT.connect(issuer1).revokeCredential(1)
      )
        .to.emit(credentialNFT, "CredentialRevoked")
        .withArgs(
          1,
          await ethers.provider.getBlock('latest').then(b => b.timestamp + 1)
        );
    });

    it("Should prevent non-issuer from revoking credential", async function () {
      await expect(
        credentialNFT.connect(issuer2).revokeCredential(1)
      ).to.be.revertedWith("Only issuer can perform this action");
    });

    it("Should prevent revoking already revoked credential", async function () {
      await credentialNFT.connect(issuer1).revokeCredential(1);
      
      await expect(
        credentialNFT.connect(issuer1).revokeCredential(1)
      ).to.be.revertedWith("Credential is already revoked");
    });

    it("Should show revoked status in verification", async function () {
      await credentialNFT.connect(issuer1).revokeCredential(1);
      
      const verification = await credentialNFT.verifyCredential(1);
      expect(verification.isValid).to.equal(false);
    });

    it("Should maintain credential ownership after revocation", async function () {
      await credentialNFT.connect(issuer1).revokeCredential(1);
      
      expect(await credentialNFT.ownerOf(1)).to.equal(recipient1.address);
    });
  });

  describe("Edge cases and validation", function () {
    it("Should reject minting with zero address recipient", async function () {
      await expect(
        credentialNFT.connect(issuer1).mintCredential(
          ethers.ZeroAddress,
          "Invalid Degree",
          "ipfs://QmInvalid"
        )
      ).to.be.revertedWith("Invalid recipient address");
    });

    it("Should reject minting with empty credential type", async function () {
      await expect(
        credentialNFT.connect(issuer1).mintCredential(
          recipient1.address,
          "",
          "ipfs://QmValid"
        )
      ).to.be.revertedWith("Credential type cannot be empty");
    });

    it("Should reject minting with empty token URI", async function () {
      await expect(
        credentialNFT.connect(issuer1).mintCredential(
          recipient1.address,
          "Valid Degree",
          ""
        )
      ).to.be.revertedWith("Token URI cannot be empty");
    });

    it("Should reject verifying non-existent credential", async function () {
      await expect(
        credentialNFT.verifyCredential(999)
      ).to.be.revertedWith("Token does not exist");
    });

    it("Should reject getting metadata for non-existent credential", async function () {
      await expect(
        credentialNFT.getCredentialMetadata(999)
      ).to.be.revertedWith("Token does not exist");
    });

    it("Should reject revoking non-existent credential", async function () {
      await expect(
        credentialNFT.connect(issuer1).revokeCredential(999)
      ).to.be.revertedWith("Token does not exist");
    });

    it("Should handle multiple credentials for same recipient from different issuers", async function () {
      await credentialNFT.connect(issuer1).mintCredential(
        recipient1.address,
        "Degree from Issuer 1",
        "ipfs://Qm1"
      );

      await credentialNFT.connect(issuer2).mintCredential(
        recipient1.address,
        "Degree from Issuer 2",
        "ipfs://Qm2"
      );

      const recipientCreds = await credentialNFT.getRecipientCredentials(recipient1.address);
      expect(recipientCreds.length).to.equal(2);

      const cred1 = await credentialNFT.verifyCredential(recipientCreds[0]);
      const cred2 = await credentialNFT.verifyCredential(recipientCreds[1]);

      expect(cred1.issuer).to.equal(issuer1.address);
      expect(cred2.issuer).to.equal(issuer2.address);
    });

    it("Should correctly track balanceOf for recipients", async function () {
      await credentialNFT.connect(issuer1).mintCredential(
        recipient1.address,
        "Degree 1",
        "ipfs://Qm1"
      );

      await credentialNFT.connect(issuer1).mintCredential(
        recipient1.address,
        "Degree 2",
        "ipfs://Qm2"
      );

      expect(await credentialNFT.balanceOf(recipient1.address)).to.equal(2);
      expect(await credentialNFT.balanceOf(recipient2.address)).to.equal(0);
    });

    it("Should support ERC721 interface", async function () {
      const ERC721InterfaceId = "0x80ac58cd";
      expect(await credentialNFT.supportsInterface(ERC721InterfaceId)).to.equal(true);
    });

    it("Should reject deployment with zero address issuer registry", async function () {
      const CredentialNFT = await ethers.getContractFactory("CredentialNFT");
      
      await expect(
        CredentialNFT.deploy(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid issuer registry address");
    });

    it("Should store issuer registry address correctly", async function () {
      const registryAddress = await credentialNFT.issuerRegistryAddress();
      expect(registryAddress).to.equal(await issuerRegistry.getAddress());
    });
  });

  describe("Integration scenarios", function () {
    it("Should handle complete workflow: mint, verify, revoke", async function () {
      const tx = await credentialNFT.connect(issuer1).mintCredential(
        recipient1.address,
        "Full Workflow Degree",
        "ipfs://QmWorkflow"
      );
      await tx.wait();

      expect(await credentialNFT.ownerOf(1)).to.equal(recipient1.address);
      expect(await credentialNFT.isCredentialValid(1)).to.equal(true);

      const verification = await credentialNFT.verifyCredential(1);
      expect(verification.recipient).to.equal(recipient1.address);
      expect(verification.issuer).to.equal(issuer1.address);
      expect(verification.isValid).to.equal(true);

      await credentialNFT.connect(issuer1).revokeCredential(1);
      expect(await credentialNFT.isCredentialValid(1)).to.equal(false);

      const verificationAfterRevoke = await credentialNFT.verifyCredential(1);
      expect(verificationAfterRevoke.isValid).to.equal(false);
    });

    it("Should handle employer verification workflow", async function () {
      await credentialNFT.connect(issuer1).mintCredential(
        recipient1.address,
        "Bachelor Degree",
        "ipfs://QmBachelor"
      );

      await credentialNFT.connect(issuer2).mintCredential(
        recipient1.address,
        "Master Degree",
        "ipfs://QmMaster"
      );

      const allCreds = await credentialNFT.getRecipientCredentials(recipient1.address);
      expect(allCreds.length).to.equal(2);

      for (let tokenId of allCreds) {
        const verification = await credentialNFT.verifyCredential(tokenId);
        expect(verification.recipient).to.equal(recipient1.address);
        expect(verification.isValid).to.equal(true);
        expect(verification.credentialTokenURI).to.include("ipfs://");
      }
    });
  });
});
