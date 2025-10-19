const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CredentialRegistry", function () {
  let credentialRegistry;
  let issuer;
  let recipient;
  let anotherIssuer;
  let anotherRecipient;

  beforeEach(async function () {
    [issuer, recipient, anotherIssuer, anotherRecipient] = await ethers.getSigners();
    
    const CredentialRegistry = await ethers.getContractFactory("CredentialRegistry");
    credentialRegistry = await CredentialRegistry.deploy();
    await credentialRegistry.waitForDeployment();
  });

  describe("1. Stores all issued credentials on-chain", function () {
    it("Should store credential with all details on-chain", async function () {
      const degreeName = "Bachelor of Computer Science";
      const metadataURI = "ipfs://QmTest123";

      await credentialRegistry.connect(issuer).issueCredential(
        recipient.address,
        degreeName,
        metadataURI
      );

      const credential = await credentialRegistry.getCredential(1);
      
      expect(credential.credentialId).to.equal(1);
      expect(credential.degreeName).to.equal(degreeName);
      expect(credential.recipient).to.equal(recipient.address);
      expect(credential.issuer).to.equal(issuer.address);
      expect(credential.isRevoked).to.equal(false);
      expect(credential.metadataURI).to.equal(metadataURI);
      expect(credential.issueDate).to.be.greaterThan(0);
    });

    it("Should store multiple credentials on-chain", async function () {
      await credentialRegistry.connect(issuer).issueCredential(
        recipient.address,
        "Bachelor of Science",
        "ipfs://QmTest1"
      );

      await credentialRegistry.connect(issuer).issueCredential(
        anotherRecipient.address,
        "Master of Arts",
        "ipfs://QmTest2"
      );

      await credentialRegistry.connect(anotherIssuer).issueCredential(
        recipient.address,
        "PhD in Physics",
        "ipfs://QmTest3"
      );

      const totalCredentials = await credentialRegistry.getTotalCredentials();
      expect(totalCredentials).to.equal(3);

      const cred1 = await credentialRegistry.getCredential(1);
      const cred2 = await credentialRegistry.getCredential(2);
      const cred3 = await credentialRegistry.getCredential(3);

      expect(cred1.degreeName).to.equal("Bachelor of Science");
      expect(cred2.degreeName).to.equal("Master of Arts");
      expect(cred3.degreeName).to.equal("PhD in Physics");
    });

    it("Should verify credential exists on-chain", async function () {
      await credentialRegistry.connect(issuer).issueCredential(
        recipient.address,
        "Certificate",
        "ipfs://QmTest"
      );

      const exists = await credentialRegistry.credentialExists(1);
      expect(exists).to.equal(true);

      const notExists = await credentialRegistry.credentialExists(999);
      expect(notExists).to.equal(false);
    });
  });

  describe("2. Maps credential IDs to their metadata", function () {
    it("Should correctly map credential ID to degree name", async function () {
      await credentialRegistry.connect(issuer).issueCredential(
        recipient.address,
        "Bachelor of Engineering",
        "ipfs://QmEngineering"
      );

      const credential = await credentialRegistry.getCredential(1);
      expect(credential.degreeName).to.equal("Bachelor of Engineering");
    });

    it("Should correctly map credential ID to issue date", async function () {
      const tx = await credentialRegistry.connect(issuer).issueCredential(
        recipient.address,
        "Master Degree",
        "ipfs://QmMaster"
      );
      
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      const credential = await credentialRegistry.getCredential(1);
      expect(credential.issueDate).to.equal(block.timestamp);
    });

    it("Should correctly map credential ID to recipient address", async function () {
      await credentialRegistry.connect(issuer).issueCredential(
        recipient.address,
        "Diploma",
        "ipfs://QmDiploma"
      );

      const credential = await credentialRegistry.getCredential(1);
      expect(credential.recipient).to.equal(recipient.address);
    });

    it("Should correctly map credential ID to issuer address", async function () {
      await credentialRegistry.connect(issuer).issueCredential(
        recipient.address,
        "Certificate",
        "ipfs://QmCert"
      );

      const credential = await credentialRegistry.getCredential(1);
      expect(credential.issuer).to.equal(issuer.address);
    });

    it("Should correctly map credential ID to metadata URI", async function () {
      const metadataURI = "ipfs://QmSpecificHash123456";
      
      await credentialRegistry.connect(issuer).issueCredential(
        recipient.address,
        "Advanced Certificate",
        metadataURI
      );

      const credential = await credentialRegistry.getCredential(1);
      expect(credential.metadataURI).to.equal(metadataURI);
    });
  });

  describe("3. Maintains record of which institutions issued which credentials", function () {
    it("Should track all credentials issued by a specific issuer", async function () {
      await credentialRegistry.connect(issuer).issueCredential(
        recipient.address,
        "Degree 1",
        "ipfs://Qm1"
      );

      await credentialRegistry.connect(issuer).issueCredential(
        anotherRecipient.address,
        "Degree 2",
        "ipfs://Qm2"
      );

      await credentialRegistry.connect(issuer).issueCredential(
        recipient.address,
        "Degree 3",
        "ipfs://Qm3"
      );

      const issuerCreds = await credentialRegistry.getIssuerCredentials(issuer.address);
      expect(issuerCreds.length).to.equal(3);
      expect(issuerCreds[0]).to.equal(1);
      expect(issuerCreds[1]).to.equal(2);
      expect(issuerCreds[2]).to.equal(3);
    });

    it("Should maintain separate records for different issuers", async function () {
      await credentialRegistry.connect(issuer).issueCredential(
        recipient.address,
        "Issuer1 Degree 1",
        "ipfs://Issuer1_1"
      );

      await credentialRegistry.connect(issuer).issueCredential(
        recipient.address,
        "Issuer1 Degree 2",
        "ipfs://Issuer1_2"
      );

      await credentialRegistry.connect(anotherIssuer).issueCredential(
        recipient.address,
        "Issuer2 Degree 1",
        "ipfs://Issuer2_1"
      );

      const issuer1Creds = await credentialRegistry.getIssuerCredentials(issuer.address);
      const issuer2Creds = await credentialRegistry.getIssuerCredentials(anotherIssuer.address);

      expect(issuer1Creds.length).to.equal(2);
      expect(issuer2Creds.length).to.equal(1);

      const cred1 = await credentialRegistry.getCredential(issuer1Creds[0]);
      const cred2 = await credentialRegistry.getCredential(issuer2Creds[0]);

      expect(cred1.issuer).to.equal(issuer.address);
      expect(cred2.issuer).to.equal(anotherIssuer.address);
    });

    it("Should track all credentials received by a specific recipient", async function () {
      await credentialRegistry.connect(issuer).issueCredential(
        recipient.address,
        "Degree 1",
        "ipfs://Qm1"
      );

      await credentialRegistry.connect(anotherIssuer).issueCredential(
        recipient.address,
        "Degree 2",
        "ipfs://Qm2"
      );

      const recipientCreds = await credentialRegistry.getRecipientCredentials(recipient.address);
      expect(recipientCreds.length).to.equal(2);
      expect(recipientCreds[0]).to.equal(1);
      expect(recipientCreds[1]).to.equal(2);
    });

    it("Should verify issuer of specific credential", async function () {
      await credentialRegistry.connect(issuer).issueCredential(
        recipient.address,
        "University Degree",
        "ipfs://QmUniversity"
      );

      const credential = await credentialRegistry.getCredential(1);
      expect(credential.issuer).to.equal(issuer.address);
      expect(credential.issuer).to.not.equal(anotherIssuer.address);
    });
  });

  describe("4. Handles credential revocation", function () {
    it("Should allow issuer to revoke their own credential", async function () {
      await credentialRegistry.connect(issuer).issueCredential(
        recipient.address,
        "Revocable Degree",
        "ipfs://QmRevoke"
      );

      const credBefore = await credentialRegistry.getCredential(1);
      expect(credBefore.isRevoked).to.equal(false);

      await credentialRegistry.connect(issuer).revokeCredential(1);

      const credAfter = await credentialRegistry.getCredential(1);
      expect(credAfter.isRevoked).to.equal(true);
    });

    it("Should prevent non-issuer from revoking credential", async function () {
      await credentialRegistry.connect(issuer).issueCredential(
        recipient.address,
        "Protected Degree",
        "ipfs://QmProtected"
      );

      await expect(
        credentialRegistry.connect(anotherIssuer).revokeCredential(1)
      ).to.be.revertedWith("Only issuer can perform this action");
    });

    it("Should prevent revoking already revoked credential", async function () {
      await credentialRegistry.connect(issuer).issueCredential(
        recipient.address,
        "Degree",
        "ipfs://Qm"
      );

      await credentialRegistry.connect(issuer).revokeCredential(1);

      await expect(
        credentialRegistry.connect(issuer).revokeCredential(1)
      ).to.be.revertedWith("Credential is already revoked");
    });

    it("Should mark revoked credential as invalid", async function () {
      await credentialRegistry.connect(issuer).issueCredential(
        recipient.address,
        "Degree",
        "ipfs://Qm"
      );

      const validBefore = await credentialRegistry.isCredentialValid(1);
      expect(validBefore).to.equal(true);

      await credentialRegistry.connect(issuer).revokeCredential(1);

      const validAfter = await credentialRegistry.isCredentialValid(1);
      expect(validAfter).to.equal(false);
    });

    it("Should handle revocation for degree withdrawal case", async function () {
      await credentialRegistry.connect(issuer).issueCredential(
        recipient.address,
        "Bachelor Degree - Academic Misconduct Case",
        "ipfs://QmMisconduct"
      );

      const credential = await credentialRegistry.getCredential(1);
      expect(credential.isRevoked).to.equal(false);

      await credentialRegistry.connect(issuer).revokeCredential(1);

      const revokedCredential = await credentialRegistry.getCredential(1);
      expect(revokedCredential.isRevoked).to.equal(true);
      expect(revokedCredential.degreeName).to.equal("Bachelor Degree - Academic Misconduct Case");
      expect(revokedCredential.recipient).to.equal(recipient.address);
    });
  });

  describe("5. Emits events when credentials are issued or revoked", function () {
    it("Should emit CredentialIssued event with correct parameters", async function () {
      const degreeName = "Event Test Degree";
      const metadataURI = "ipfs://QmEventTest";

      await expect(
        credentialRegistry.connect(issuer).issueCredential(
          recipient.address,
          degreeName,
          metadataURI
        )
      )
        .to.emit(credentialRegistry, "CredentialIssued")
        .withArgs(
          1,
          recipient.address,
          issuer.address,
          degreeName,
          await ethers.provider.getBlock('latest').then(b => b.timestamp + 1),
          metadataURI
        );
    });

    it("Should emit CredentialRevoked event with correct parameters", async function () {
      await credentialRegistry.connect(issuer).issueCredential(
        recipient.address,
        "Revoke Event Test",
        "ipfs://QmRevokeEvent"
      );

      await expect(
        credentialRegistry.connect(issuer).revokeCredential(1)
      )
        .to.emit(credentialRegistry, "CredentialRevoked")
        .withArgs(
          1,
          issuer.address,
          await ethers.provider.getBlock('latest').then(b => b.timestamp + 1)
        );
    });

    it("Should emit multiple CredentialIssued events for batch issuance", async function () {
      const tx1 = credentialRegistry.connect(issuer).issueCredential(
        recipient.address,
        "Degree 1",
        "ipfs://Qm1"
      );

      const tx2 = credentialRegistry.connect(issuer).issueCredential(
        anotherRecipient.address,
        "Degree 2",
        "ipfs://Qm2"
      );

      await expect(tx1).to.emit(credentialRegistry, "CredentialIssued");
      await expect(tx2).to.emit(credentialRegistry, "CredentialIssued");
    });

    it("Should track events for monitoring and analytics", async function () {
      await credentialRegistry.connect(issuer).issueCredential(
        recipient.address,
        "Trackable Degree",
        "ipfs://QmTrack"
      );

      const filter = credentialRegistry.filters.CredentialIssued();
      const events = await credentialRegistry.queryFilter(filter);

      expect(events.length).to.equal(1);
      expect(events[0].args.credentialId).to.equal(1);
      expect(events[0].args.recipient).to.equal(recipient.address);
      expect(events[0].args.issuer).to.equal(issuer.address);
    });
  });

  describe("Additional validation and edge cases", function () {
    it("Should reject credential with empty degree name", async function () {
      await expect(
        credentialRegistry.connect(issuer).issueCredential(
          recipient.address,
          "",
          "ipfs://Qm"
        )
      ).to.be.revertedWith("Degree name cannot be empty");
    });

    it("Should reject credential with empty metadata URI", async function () {
      await expect(
        credentialRegistry.connect(issuer).issueCredential(
          recipient.address,
          "Valid Degree",
          ""
        )
      ).to.be.revertedWith("Metadata URI cannot be empty");
    });

    it("Should reject credential with zero address recipient", async function () {
      await expect(
        credentialRegistry.connect(issuer).issueCredential(
          ethers.ZeroAddress,
                    "Valid Degree",
          "ipfs://QmValid"
        )
      ).to.be.revertedWith("Invalid recipient address");
    });

    it("Should revert when trying to get a non-existent credential", async function () {
      await expect(
        credentialRegistry.getCredential(999)
      ).to.be.revertedWith("Credential does not exist");
    });

    it("Should correctly return an empty array for recipient with no credentials", async function () {
      const recipientCreds = await credentialRegistry.getRecipientCredentials(anotherRecipient.address);
      expect(recipientCreds).to.be.an('array').that.is.empty;
    });

    it("Should correctly return an empty array for issuer with no credentials", async function () {
      const issuerCreds = await credentialRegistry.getIssuerCredentials(anotherIssuer.address);
      expect(issuerCreds).to.be.an('array').that.is.empty;
    });

    it("Should return false for isCredentialValid for a non-existent credential", async function () {
      const isValid = await credentialRegistry.isCredentialValid(999);
      expect(isValid).to.equal(false);
    });

    it("Should increment totalCredentials correctly upon issuing", async function () {
      expect(await credentialRegistry.getTotalCredentials()).to.equal(0);

      await credentialRegistry.connect(issuer).issueCredential(
        recipient.address,
        "Degree 1",
        "ipfs://Qm1"
      );
      expect(await credentialRegistry.getTotalCredentials()).to.equal(1);

      await credentialRegistry.connect(issuer).issueCredential(
        anotherRecipient.address,
        "Degree 2",
        "ipfs://Qm2"
      );
      expect(await credentialRegistry.getTotalCredentials()).to.equal(2);
    });
  });
});
