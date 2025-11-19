const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TallyToken", function () {
  let TallyToken, tallyToken, owner, addr1, addr2, addr3, addrs;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
    const trinityMembers = [owner.address, addr1.address, addr2.address];
    TallyToken = await ethers.getContractFactory("TallyToken");
    tallyToken = await TallyToken.deploy(trinityMembers);
    await tallyToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right trinity members", async function () {
      expect(await tallyToken.trinityMembers(0)).to.equal(owner.address);
      expect(await tallyToken.trinityMembers(1)).to.equal(addr1.address);
      expect(await tallyToken.trinityMembers(2)).to.equal(addr2.address);
    });
  });

  describe("Minting", function () {
    it("Should allow a trinity member to mint once", async function () {
      await expect(tallyToken.connect(owner).mintTally(addr3.address))
        .to.emit(tallyToken, "TallyMinted")
        .withArgs(owner.address, addr3.address, ethers.parseEther("1"));
      expect(await tallyToken.balanceOf(addr3.address)).to.equal(ethers.parseEther("1"));
    });

    it("Should not allow a trinity member to mint more than once", async function () {
      await tallyToken.connect(owner).mintTally(addr3.address);
      await expect(tallyToken.connect(owner).mintTally(addrs[0].address)).to.be.revertedWith(
        "You have already used your one-time mint."
      );
    });

    it("Should not allow a non-trinity member to mint", async function () {
      await expect(tallyToken.connect(addr3).mintTally(addrs[0].address)).to.be.revertedWith(
        "Only a Trinity member can mint."
      );
    });

    it("Should not allow a trinity member to mint to themselves", async function () {
        await expect(tallyToken.connect(owner).mintTally(owner.address)).to.be.revertedWith(
            "You cannot mint to yourself."
        );
    });
  });

  describe("Burning", function () {
    beforeEach(async function() {
        await tallyToken.connect(addr1).mintTally(addr3.address);
    });

    it("Should allow a trinity member to burn tokens from another address", async function () {
        await expect(tallyToken.connect(owner).burnTally(addr3.address, ethers.parseEther("0.5")))
            .to.emit(tallyToken, "TallyBurned")
            .withArgs(owner.address, addr3.address, ethers.parseEther("0.5"));
        expect(await tallyToken.balanceOf(addr3.address)).to.equal(ethers.parseEther("0.5"));
    });

    it("Should not allow a trinity member to burn more than 1 token in total from an address", async function () {
        await tallyToken.connect(owner).burnTally(addr3.address, ethers.parseEther("0.5"));
        await tallyToken.connect(owner).burnTally(addr3.address, ethers.parseEther("0.5"));
        await expect(tallyToken.connect(owner).burnTally(addr3.address, ethers.parseEther("0.1"))).to.be.revertedWith(
            "You can burn a maximum of 1 Tally from this address."
        );
    });

    it("Should not allow a non-trinity member to burn", async function () {
        await expect(tallyToken.connect(addr3).burnTally(addrs[0].address, ethers.parseEther("0.5"))).to.be.revertedWith(
            "Only a Trinity member can burn."
        );
    });

    it("Should not allow a trinity member to burn their own tokens", async function () {
        await expect(tallyToken.connect(owner).burnTally(owner.address, ethers.parseEther("0.5"))).to.be.revertedWith(
            "You cannot burn your own tokens."
        );
    });
  });
});
