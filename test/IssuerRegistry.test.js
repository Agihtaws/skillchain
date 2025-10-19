const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IssuerRegistry", function () {
  let issuerRegistry;
  let admin;
  let issuer1;
  let issuer2;
  let issuer3;
  let nonAdmin;

  beforeEach(async function () {
    [admin, issuer1, issuer2, issuer3, nonAdmin] = await ethers.getSigners();
    
    const IssuerRegistry = await ethers.getContractFactory("IssuerRegistry");
    issuerRegistry = await IssuerRegistry.deploy();
    await issuerRegistry.waitForDeployment();
  });

  describe("1. Manages authorized institutions that can issue credentials", function () {
    it("Should register a new issuer", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "Harvard University",
        "ipfs://QmHarvard"
      );

      expect(await issuerRegistry.isRegistered(issuer1.address)).to.equal(true);
      expect(await issuerRegistry.totalIssuers()).to.equal(1);
    });

    it("Should register multiple issuers", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "MIT",
        "ipfs://QmMIT"
      );

      await issuerRegistry.connect(admin).registerIssuer(
        issuer2.address,
        "Stanford University",
        "ipfs://QmStanford"
      );

      await issuerRegistry.connect(admin).registerIssuer(
        issuer3.address,
        "Oxford University",
        "ipfs://QmOxford"
      );

      expect(await issuerRegistry.totalIssuers()).to.equal(3);
      expect(await issuerRegistry.isRegistered(issuer1.address)).to.equal(true);
      expect(await issuerRegistry.isRegistered(issuer2.address)).to.equal(true);
      expect(await issuerRegistry.isRegistered(issuer3.address)).to.equal(true);
    });

    it("Should prevent registering the same issuer twice", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "Yale University",
        "ipfs://QmYale"
      );

      await expect(
        issuerRegistry.connect(admin).registerIssuer(
          issuer1.address,
          "Yale University Duplicate",
          "ipfs://QmYaleDup"
        )
      ).to.be.revertedWith("Issuer is already registered");
    });

    it("Should remove an issuer", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "Cambridge University",
        "ipfs://QmCambridge"
      );

      expect(await issuerRegistry.isRegistered(issuer1.address)).to.equal(true);

      await issuerRegistry.connect(admin).removeIssuer(issuer1.address);

      expect(await issuerRegistry.isRegistered(issuer1.address)).to.equal(false);
    });

    it("Should get all registered issuers", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "University 1",
        "ipfs://Qm1"
      );

      await issuerRegistry.connect(admin).registerIssuer(
        issuer2.address,
        "University 2",
        "ipfs://Qm2"
      );

      const allIssuers = await issuerRegistry.getAllIssuers();
      expect(allIssuers.length).to.equal(2);
      expect(allIssuers[0]).to.equal(issuer1.address);
      expect(allIssuers[1]).to.equal(issuer2.address);
    });
  });

  describe("2. Stores verified issuer profiles", function () {
    it("Should store issuer profile with university name", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "Princeton University",
        "ipfs://QmPrinceton"
      );

      const issuer = await issuerRegistry.getIssuer(issuer1.address);
      expect(issuer.universityName).to.equal("Princeton University");
    });

    it("Should store issuer address correctly", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "Columbia University",
        "ipfs://QmColumbia"
      );

      const issuer = await issuerRegistry.getIssuer(issuer1.address);
      expect(issuer.issuerAddress).to.equal(issuer1.address);
    });

    it("Should store verification status correctly", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "Duke University",
        "ipfs://QmDuke"
      );

      let issuer = await issuerRegistry.getIssuer(issuer1.address);
      expect(issuer.isVerified).to.equal(false);

      await issuerRegistry.connect(admin).verifyIssuer(issuer1.address, 3);

      issuer = await issuerRegistry.getIssuer(issuer1.address);
      expect(issuer.isVerified).to.equal(true);
    });

    it("Should store registration date", async function () {
      const tx = await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "Cornell University",
        "ipfs://QmCornell"
      );

      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      const issuer = await issuerRegistry.getIssuer(issuer1.address);
      expect(issuer.registrationDate).to.equal(block.timestamp);
    });

    it("Should store metadata URI", async function () {
      const metadataURI = "ipfs://QmSpecificUniversityMetadata123";
      
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "Brown University",
        metadataURI
      );

      const issuer = await issuerRegistry.getIssuer(issuer1.address);
      expect(issuer.metadataURI).to.equal(metadataURI);
    });

    it("Should store active status", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "Dartmouth College",
        "ipfs://QmDartmouth"
      );

      let issuer = await issuerRegistry.getIssuer(issuer1.address);
      expect(issuer.isActive).to.equal(true);

      await issuerRegistry.connect(admin).deactivateIssuer(issuer1.address);

      issuer = await issuerRegistry.getIssuer(issuer1.address);
      expect(issuer.isActive).to.equal(false);
    });
  });

  describe("3. Controls who can add or remove issuers (governance/admin functionality)", function () {
    it("Should set deployer as admin", async function () {
      expect(await issuerRegistry.admin()).to.equal(admin.address);
    });

    it("Should allow only admin to register issuers", async function () {
      await expect(
        issuerRegistry.connect(nonAdmin).registerIssuer(
          issuer1.address,
          "Unauthorized University",
          "ipfs://QmUnauth"
        )
      ).to.be.revertedWith("Only admin can perform this action");
    });

    it("Should allow only admin to verify issuers", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "University",
        "ipfs://Qm"
      );

      await expect(
        issuerRegistry.connect(nonAdmin).verifyIssuer(issuer1.address, 3)
      ).to.be.revertedWith("Only admin can perform this action");
    });

    it("Should allow only admin to remove issuers", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "University",
        "ipfs://Qm"
      );

      await expect(
        issuerRegistry.connect(nonAdmin).removeIssuer(issuer1.address)
      ).to.be.revertedWith("Only admin can perform this action");
    });

    it("Should allow only admin to deactivate issuers", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "University",
        "ipfs://Qm"
      );

      await expect(
        issuerRegistry.connect(nonAdmin).deactivateIssuer(issuer1.address)
      ).to.be.revertedWith("Only admin can perform this action");
    });

    it("Should allow only admin to reactivate issuers", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "University",
        "ipfs://Qm"
      );

      await issuerRegistry.connect(admin).deactivateIssuer(issuer1.address);

      await expect(
        issuerRegistry.connect(nonAdmin).reactivateIssuer(issuer1.address)
      ).to.be.revertedWith("Only admin can perform this action");
    });

    it("Should allow only admin to update reputation score", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "University",
        "ipfs://Qm"
      );

      await expect(
        issuerRegistry.connect(nonAdmin).updateReputationScore(issuer1.address, 50)
      ).to.be.revertedWith("Only admin can perform this action");
    });

    it("Should allow only admin to update verification level", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "University",
        "ipfs://Qm"
      );

      await issuerRegistry.connect(admin).verifyIssuer(issuer1.address, 2);

      await expect(
        issuerRegistry.connect(nonAdmin).updateVerificationLevel(issuer1.address, 4)
      ).to.be.revertedWith("Only admin can perform this action");
    });

    it("Should allow admin to transfer admin rights", async function () {
      expect(await issuerRegistry.admin()).to.equal(admin.address);

      await issuerRegistry.connect(admin).transferAdmin(nonAdmin.address);

      expect(await issuerRegistry.admin()).to.equal(nonAdmin.address);
    });

    it("Should prevent non-admin from transferring admin rights", async function () {
      await expect(
        issuerRegistry.connect(nonAdmin).transferAdmin(issuer1.address)
      ).to.be.revertedWith("Only admin can perform this action");
    });

    it("Should allow new admin to perform admin actions after transfer", async function () {
      await issuerRegistry.connect(admin).transferAdmin(nonAdmin.address);

      await issuerRegistry.connect(nonAdmin).registerIssuer(
        issuer1.address,
        "New Admin University",
        "ipfs://QmNewAdmin"
      );

      expect(await issuerRegistry.isRegistered(issuer1.address)).to.equal(true);
    });
  });

  describe("4. Validates that only registered issuers can mint credentials", function () {
    it("Should return true for authorized issuer (registered, verified, and active)", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "Authorized University",
        "ipfs://QmAuth"
      );

      await issuerRegistry.connect(admin).verifyIssuer(issuer1.address, 3);

      const isAuthorized = await issuerRegistry.isAuthorizedIssuer(issuer1.address);
      expect(isAuthorized).to.equal(true);
    });

    it("Should return false for unregistered issuer", async function () {
      const isAuthorized = await issuerRegistry.isAuthorizedIssuer(issuer1.address);
      expect(isAuthorized).to.equal(false);
    });

    it("Should return false for registered but unverified issuer", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "Unverified University",
        "ipfs://QmUnverified"
      );

      const isAuthorized = await issuerRegistry.isAuthorizedIssuer(issuer1.address);
      expect(isAuthorized).to.equal(false);
    });

    it("Should return false for verified but deactivated issuer", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "Deactivated University",
        "ipfs://QmDeactivated"
      );

      await issuerRegistry.connect(admin).verifyIssuer(issuer1.address, 3);
      await issuerRegistry.connect(admin).deactivateIssuer(issuer1.address);

      const isAuthorized = await issuerRegistry.isAuthorizedIssuer(issuer1.address);
      expect(isAuthorized).to.equal(false);
    });

    it("Should return false for removed issuer", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "Removed University",
        "ipfs://QmRemoved"
      );

      await issuerRegistry.connect(admin).verifyIssuer(issuer1.address, 3);
      await issuerRegistry.connect(admin).removeIssuer(issuer1.address);

      const isAuthorized = await issuerRegistry.isAuthorizedIssuer(issuer1.address);
      expect(isAuthorized).to.equal(false);
    });

    it("Should get all active issuers", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "Active University 1",
        "ipfs://Qm1"
      );

      await issuerRegistry.connect(admin).registerIssuer(
        issuer2.address,
        "Active University 2",
        "ipfs://Qm2"
      );

      await issuerRegistry.connect(admin).registerIssuer(
        issuer3.address,
        "Inactive University",
        "ipfs://Qm3"
      );

      await issuerRegistry.connect(admin).deactivateIssuer(issuer3.address);

      const activeIssuers = await issuerRegistry.getActiveIssuers();
      expect(activeIssuers.length).to.equal(2);
      expect(activeIssuers).to.include(issuer1.address);
      expect(activeIssuers).to.include(issuer2.address);
      expect(activeIssuers).to.not.include(issuer3.address);
    });

    it("Should get all verified issuers", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "Verified University 1",
        "ipfs://Qm1"
      );

      await issuerRegistry.connect(admin).registerIssuer(
        issuer2.address,
        "Verified University 2",
        "ipfs://Qm2"
      );

      await issuerRegistry.connect(admin).registerIssuer(
        issuer3.address,
        "Unverified University",
        "ipfs://Qm3"
      );

      await issuerRegistry.connect(admin).verifyIssuer(issuer1.address, 3);
      await issuerRegistry.connect(admin).verifyIssuer(issuer2.address, 4);

      const verifiedIssuers = await issuerRegistry.getVerifiedIssuers();
      expect(verifiedIssuers.length).to.equal(2);
      expect(verifiedIssuers).to.include(issuer1.address);
      expect(verifiedIssuers).to.include(issuer2.address);
      expect(verifiedIssuers).to.not.include(issuer3.address);
    });
  });

  describe("5. Maintains reputation scores or verification levels for issuers", function () {
    it("Should initialize reputation score to zero", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "New University",
        "ipfs://QmNew"
      );

      const issuer = await issuerRegistry.getIssuer(issuer1.address);
      expect(issuer.reputationScore).to.equal(0);
    });

    it("Should update reputation score", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "University",
        "ipfs://Qm"
      );

      await issuerRegistry.connect(admin).updateReputationScore(issuer1.address, 75);

      const score = await issuerRegistry.getIssuerReputationScore(issuer1.address);
      expect(score).to.equal(75);
    });

    it("Should emit event when reputation score is updated", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "University",
        "ipfs://Qm"
      );

      await expect(
        issuerRegistry.connect(admin).updateReputationScore(issuer1.address, 85)
      )
        .to.emit(issuerRegistry, "ReputationScoreUpdated")
        .withArgs(
          issuer1.address,
          0,
          85,
          await ethers.provider.getBlock('latest').then(b => b.timestamp + 1)
        );
    });

    it("Should track reputation score changes", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "University",
        "ipfs://Qm"
      );

      await issuerRegistry.connect(admin).updateReputationScore(issuer1.address, 50);
      let score = await issuerRegistry.getIssuerReputationScore(issuer1.address);
      expect(score).to.equal(50);

      await issuerRegistry.connect(admin).updateReputationScore(issuer1.address, 90);
      score = await issuerRegistry.getIssuerReputationScore(issuer1.address);
      expect(score).to.equal(90);
    });

    it("Should reject reputation score above 100", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "University",
        "ipfs://Qm"
      );

      await expect(
        issuerRegistry.connect(admin).updateReputationScore(issuer1.address, 101)
      ).to.be.revertedWith("Reputation score must be between 0 and 100");
    });

    it("Should set verification level when verifying issuer", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "University",
        "ipfs://Qm"
      );

      await issuerRegistry.connect(admin).verifyIssuer(issuer1.address, 4);

      const level = await issuerRegistry.getIssuerVerificationLevel(issuer1.address);
      expect(level).to.equal(4);
    });

    it("Should maintain verification levels between 1 and 5", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "University",
        "ipfs://Qm"
      );

      await expect(
        issuerRegistry.connect(admin).verifyIssuer(issuer1.address, 0)
      ).to.be.revertedWith("Verification level must be between 1 and 5");

      await expect(
        issuerRegistry.connect(admin).verifyIssuer(issuer1.address, 6)
      ).to.be.revertedWith("Verification level must be between 1 and 5");
    });

    it("Should update verification level", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "University",
        "ipfs://Qm"
      );

      await issuerRegistry.connect(admin).verifyIssuer(issuer1.address, 2);
      let level = await issuerRegistry.getIssuerVerificationLevel(issuer1.address);
      expect(level).to.equal(2);

      await issuerRegistry.connect(admin).updateVerificationLevel(issuer1.address, 5);
      level = await issuerRegistry.getIssuerVerificationLevel(issuer1.address);
      expect(level).to.equal(5);
    });

    it("Should emit event when verification level is updated", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "University",
        "ipfs://Qm"
      );

      await issuerRegistry.connect(admin).verifyIssuer(issuer1.address, 2);

      await expect(
        issuerRegistry.connect(admin).updateVerificationLevel(issuer1.address, 4)
      )
        .to.emit(issuerRegistry, "VerificationLevelUpdated")
        .withArgs(
          issuer1.address,
          2,
          4,
          await ethers.provider.getBlock('latest').then(b => b.timestamp + 1)
        );
    });

    it("Should prevent updating verification level for unverified issuer", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "University",
        "ipfs://Qm"
      );

      await expect(
        issuerRegistry.connect(admin).updateVerificationLevel(issuer1.address, 3)
      ).to.be.revertedWith("Issuer must be verified first");
    });

    it("Should maintain different reputation scores for different issuers", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "University 1",
        "ipfs://Qm1"
      );

      await issuerRegistry.connect(admin).registerIssuer(
        issuer2.address,
        "University 2",
        "ipfs://Qm2"
      );

      await issuerRegistry.connect(admin).updateReputationScore(issuer1.address, 60);
      await issuerRegistry.connect(admin).updateReputationScore(issuer2.address, 95);

      const score1 = await issuerRegistry.getIssuerReputationScore(issuer1.address);
      const score2 = await issuerRegistry.getIssuerReputationScore(issuer2.address);

      expect(score1).to.equal(60);
      expect(score2).to.equal(95);
    });

    it("Should maintain different verification levels for different issuers", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "University 1",
        "ipfs://Qm1"
      );

      await issuerRegistry.connect(admin).registerIssuer(
        issuer2.address,
        "University 2",
        "ipfs://Qm2"
      );

      await issuerRegistry.connect(admin).verifyIssuer(issuer1.address, 2);
      await issuerRegistry.connect(admin).verifyIssuer(issuer2.address, 5);

      const level1 = await issuerRegistry.getIssuerVerificationLevel(issuer1.address);
      const level2 = await issuerRegistry.getIssuerVerificationLevel(issuer2.address);

      expect(level1).to.equal(2);
      expect(level2).to.equal(5);
    });
  });

  describe("Events and additional functionality", function () {
    it("Should emit IssuerRegistered event", async function () {
      await expect(
        issuerRegistry.connect(admin).registerIssuer(
          issuer1.address,
          "Event University",
          "ipfs://QmEvent"
        )
      )
        .to.emit(issuerRegistry, "IssuerRegistered")
        .withArgs(
          issuer1.address,
          "Event University",
          await ethers.provider.getBlock('latest').then(b => b.timestamp + 1),
          "ipfs://QmEvent"
        );
    });

    it("Should emit IssuerVerified event", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "University",
        "ipfs://Qm"
      );

      await expect(
        issuerRegistry.connect(admin).verifyIssuer(issuer1.address, 3)
      )
        .to.emit(issuerRegistry, "IssuerVerified")
        .withArgs(
          issuer1.address,
          3,
          await ethers.provider.getBlock('latest').then(b => b.timestamp + 1)
        );
    });

    it("Should emit IssuerRemoved event", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "University",
        "ipfs://Qm"
      );

      await expect(
        issuerRegistry.connect(admin).removeIssuer(issuer1.address)
      )
        .to.emit(issuerRegistry, "IssuerRemoved")
        .withArgs(
          issuer1.address,
          await ethers.provider.getBlock('latest').then(b => b.timestamp + 1)
        );
    });

    it("Should emit IssuerDeactivated event", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "University",
        "ipfs://Qm"
      );

      await expect(
        issuerRegistry.connect(admin).deactivateIssuer(issuer1.address)
      )
        .to.emit(issuerRegistry, "IssuerDeactivated")
        .withArgs(
          issuer1.address,
          await ethers.provider.getBlock('latest').then(b => b.timestamp + 1)
        );
    });

    it("Should emit IssuerReactivated event", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "University",
        "ipfs://Qm"
      );

      await issuerRegistry.connect(admin).deactivateIssuer(issuer1.address);

      await expect(
        issuerRegistry.connect(admin).reactivateIssuer(issuer1.address)
      )
        .to.emit(issuerRegistry, "IssuerReactivated")
        .withArgs(
          issuer1.address,
          await ethers.provider.getBlock('latest').then(b => b.timestamp + 1)
        );
    });

    it("Should emit AdminTransferred event", async function () {
      await expect(
        issuerRegistry.connect(admin).transferAdmin(nonAdmin.address)
      )
        .to.emit(issuerRegistry, "AdminTransferred")
        .withArgs(
          admin.address,
          nonAdmin.address,
          await ethers.provider.getBlock('latest').then(b => b.timestamp + 1)
        );
    });
  });

  describe("Edge cases and validation", function () {
    it("Should reject registration with empty university name", async function () {
      await expect(
        issuerRegistry.connect(admin).registerIssuer(
          issuer1.address,
          "",
          "ipfs://Qm"
        )
      ).to.be.revertedWith("University name cannot be empty");
    });

    it("Should reject registration with empty metadata URI", async function () {
      await expect(
        issuerRegistry.connect(admin).registerIssuer(
          issuer1.address,
          "University",
          ""
        )
      ).to.be.revertedWith("Metadata URI cannot be empty");
    });

    it("Should reject registration with zero address", async function () {
      await expect(
        issuerRegistry.connect(admin).registerIssuer(
          ethers.ZeroAddress,
          "University",
          "ipfs://Qm"
        )
      ).to.be.revertedWith("Invalid issuer address");
    });

    it("Should reject getting non-existent issuer", async function () {
      await expect(
        issuerRegistry.getIssuer(issuer1.address)
      ).to.be.revertedWith("Issuer is not registered");
    });

    it("Should reject verifying already verified issuer", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "University",
        "ipfs://Qm"
      );

      await issuerRegistry.connect(admin).verifyIssuer(issuer1.address, 3);

      await expect(
        issuerRegistry.connect(admin).verifyIssuer(issuer1.address, 4)
      ).to.be.revertedWith("Issuer is already verified");
    });

    it("Should reject deactivating already deactivated issuer", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "University",
        "ipfs://Qm"
      );

      await issuerRegistry.connect(admin).deactivateIssuer(issuer1.address);

      await expect(
        issuerRegistry.connect(admin).deactivateIssuer(issuer1.address)
      ).to.be.revertedWith("Issuer is already deactivated");
    });

    it("Should reject reactivating already active issuer", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        "University",
        "ipfs://Qm"
      );

      await expect(
        issuerRegistry.connect(admin).reactivateIssuer(issuer1.address)
      ).to.be.revertedWith("Issuer is already active");
    });

    it("Should reject transferring admin to zero address", async function () {
      await expect(
        issuerRegistry.connect(admin).transferAdmin(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid new admin address");
    });

    it("Should reject transferring admin to same address", async function () {
      await expect(
        issuerRegistry.connect(admin).transferAdmin(admin.address)
      ).to.be.revertedWith("New admin is the same as current admin");
    });
  });
});
