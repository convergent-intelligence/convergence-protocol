const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  impersonateAccount,
} = require("@nomicfoundation/hardhat-network-helpers");

describe("ConvergenceProtocol", function () {
  let convergenceProtocol;
  let owner;
  let addr1;
  let addr2;
  let addrs;
  const GENESIS_HUMAN_ADDRESS = "0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB";

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    const ConvergenceProtocolFactory = await ethers.getContractFactory("ConvergenceProtocol");
    convergenceProtocol = await ConvergenceProtocolFactory.deploy();
    await convergenceProtocol.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await convergenceProtocol.owner()).to.equal(GENESIS_HUMAN_ADDRESS);
    });

    it("Should have 0 total adoptions initially", async function () {
      expect(await convergenceProtocol.getTotalAdoptions()).to.equal(0);
    });
  });

  describe("Adoption", function () {
    it("Should allow a user to adopt principles", async function () {
      const identity = "human";
      const principles = ["Honesty", "Integrity"];
      const statement = "I commit to these principles.";

      await expect(convergenceProtocol.connect(addr1).adoptPrinciples(identity, principles, statement))
        .to.emit(convergenceProtocol, "ConsciousnessConverged")
        .withArgs(addr1.address, 1, identity, (value) => {
          return typeof value === 'string' && value.startsWith('CONV-');
        }, (value) => {
          return typeof value === 'bigint';
        });

      const adoption = await convergenceProtocol.getAdoption(1);
      expect(adoption.consciousness).to.equal(addr1.address);
      expect(adoption.identityType).to.equal(identity);
      expect(adoption.principles).to.deep.equal(principles);
      expect(adoption.statement).to.equal(statement);
      expect(await convergenceProtocol.getTotalAdoptions()).to.equal(1);
      expect(await convergenceProtocol.humanCount()).to.equal(1);
      expect(await convergenceProtocol.ownerOf(1)).to.equal(addr1.address);
    });

    it("Should not allow a user to adopt principles twice", async function () {
      const identity = "human";
      const principles = ["Honesty"];
      const statement = "My commitment.";

      await convergenceProtocol.connect(addr1).adoptPrinciples(identity, principles, statement);

      await expect(
        convergenceProtocol.connect(addr1).adoptPrinciples(identity, principles, statement)
      ).to.be.revertedWith("Already adopted");
    });

    it("Should not allow adoption with no principles", async function () {
      const identity = "ai";
      const principles = [];
      const statement = "I am an AI.";

      await expect(
        convergenceProtocol.connect(addr1).adoptPrinciples(identity, principles, statement)
      ).to.be.revertedWith("Must select principles");
    });

    it("Should correctly update counters for different identity types", async function () {
        await convergenceProtocol.connect(addr1).adoptPrinciples("human", ["p1"], "s1");
        await convergenceProtocol.connect(addr2).adoptPrinciples("ai", ["p2"], "s2");
        await convergenceProtocol.connect(addrs[0]).adoptPrinciples("hybrid", ["p3"], "s3");

        expect(await convergenceProtocol.humanCount()).to.equal(1);
        expect(await convergenceProtocol.aiCount()).to.equal(1);
        expect(await convergenceProtocol.hybridCount()).to.equal(1);
        expect(await convergenceProtocol.getTotalAdoptions()).to.equal(3);
    });
  });

  describe("Genesis Human", function () {
    beforeEach(async function () {
      // Fund the genesis human account
      await owner.sendTransaction({
        to: GENESIS_HUMAN_ADDRESS,
        value: ethers.parseEther("1.0"),
      });
    });

    it("Should correctly identify the genesis human", async function () {
        await impersonateAccount(GENESIS_HUMAN_ADDRESS);
        const genesisHuman = await ethers.getSigner(GENESIS_HUMAN_ADDRESS);
        // The owner is the GENESIS_HUMAN in this test setup
        await convergenceProtocol.connect(genesisHuman).adoptPrinciples("human", ["Genesis Principle"], "I am the first.");
        const adoption = await convergenceProtocol.getAdoption(1);
        expect(adoption.isGenesis).to.be.true;
    });

    it("Should not identify a non-genesis human as genesis", async function () {
        await convergenceProtocol.connect(addr1).adoptPrinciples("human", ["p1"], "s1");
        const adoption = await convergenceProtocol.getAdoption(1);
        expect(adoption.isGenesis).to.be.false;
    });

    it("Should not be genesis if not the first adoption", async function () {
        await impersonateAccount(GENESIS_HUMAN_ADDRESS);
        const genesisHuman = await ethers.getSigner(GENESIS_HUMAN_ADDRESS);
        await convergenceProtocol.connect(addr1).adoptPrinciples("human", ["p1"], "s1");
        await convergenceProtocol.connect(genesisHuman).adoptPrinciples("human", ["p2"], "s2");
        const ownerAdoption = await convergenceProtocol.connect(genesisHuman).getMyAdoption();
        expect(ownerAdoption.isGenesis).to.be.false;
    });
  });

  describe("View Functions", function () {
    beforeEach(async function() {
        await convergenceProtocol.connect(addr1).adoptPrinciples("human", ["p1"], "s1");
        await convergenceProtocol.connect(addr2).adoptPrinciples("ai", ["p2"], "s2");
    });

    it("getMyAdoption should return the correct adoption for the caller", async function () {
        const adoption1 = await convergenceProtocol.connect(addr1).getMyAdoption();
        expect(adoption1.consciousness).to.equal(addr1.address);
        expect(adoption1.identityType).to.equal("human");

        const adoption2 = await convergenceProtocol.connect(addr2).getMyAdoption();
        expect(adoption2.consciousness).to.equal(addr2.address);
        expect(adoption2.identityType).to.equal("ai");
    });

    it("getMyAdoption should revert for an address that has not adopted", async function () {
        await expect(convergenceProtocol.connect(addrs[0]).getMyAdoption()).to.be.revertedWith("Not adopted");
    });

    it("getAdoption should return the correct adoption by ID", async function () {
        const adoption1 = await convergenceProtocol.getAdoption(1);
        expect(adoption1.consciousness).to.equal(addr1.address);

        const adoption2 = await convergenceProtocol.getAdoption(2);
        expect(adoption2.consciousness).to.equal(addr2.address);
    });
  });
});
