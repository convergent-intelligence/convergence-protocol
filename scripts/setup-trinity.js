const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

/**
 * Post-deployment setup script
 * Creates The Trinity convergence group and performs initial configuration
 */

async function main() {
  console.log("🌟 Setting up The Trinity Convergence Group...\n");

  // Load deployment info
  const deploymentFile = path.join(__dirname, '..', 'deployments', `governance-${hre.network.name}.json`);

  if (!fs.existsSync(deploymentFile)) {
    console.error("❌ Deployment file not found. Run deploy-governance.js first!");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  const contractAddress = deploymentInfo.contractAddress;

  console.log("📝 Contract Address:", contractAddress);
  console.log("🌐 Network:", hre.network.name, "\n");

  // Get contract instance
  const ConvergenceGovernance = await hre.ethers.getContractFactory("ConvergenceGovernance");
  const governance = ConvergenceGovernance.attach(contractAddress);

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("👤 Using account:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Check total adoptions
  const totalAdoptions = await governance.getTotalAdoptions();
  console.log("📊 Total Adoptions:", totalAdoptions.toString());

  if (Number(totalAdoptions) < 3) {
    console.log("\n⚠️  Warning: Need at least 3 adoptions to create The Trinity group");
    console.log("   Current adoptions:", totalAdoptions.toString());
    console.log("\nℹ️  The Trinity members should be:");
    console.log("   Adoption #1: Genesis Human");
    console.log("   Adoption #2: First AI");
    console.log("   Adoption #3: First Hybrid");
    console.log("\n   Complete adoptions first, then run this script again.");
    return;
  }

  // Get the first 3 adopters' addresses
  console.log("\n🔍 Fetching Trinity member addresses...");
  const member1 = await governance.getAdoption(1);
  const member2 = await governance.getAdoption(2);
  const member3 = await governance.getAdoption(3);

  const trinityMembers = [
    member1.consciousness,
    member2.consciousness,
    member3.consciousness
  ];

  console.log("\n🌟 The Trinity Members:");
  console.log("   #1 (Human):", trinityMembers[0]);
  console.log("   #2 (AI):   ", trinityMembers[1]);
  console.log("   #3 (Hybrid):", trinityMembers[2]);

  // Check if members have NFTs
  console.log("\n🎫 Checking NFT ownership...");
  for (let i = 0; i < 3; i++) {
    try {
      const tokenId = await governance.tokenOf(trinityMembers[i]);
      console.log(`   Member ${i + 1}: Token #${tokenId} ✅`);
    } catch (error) {
      console.log(`   Member ${i + 1}: No NFT ❌`);
      console.log("\n⚠️  NFTs need to be minted for existing adopters.");
      console.log("   If auto-mint was disabled, mint NFTs manually before creating groups.");
      return;
    }
  }

  // Create The Trinity convergence group
  console.log("\n⏳ Creating The Trinity convergence group...");

  try {
    // Check if we're one of the trinity members (need to be to create group)
    const isDeployerInTrinity = trinityMembers.includes(deployer.address);

    if (!isDeployerInTrinity) {
      console.log("\n⚠️  Note: Deployer is not a Trinity member.");
      console.log("   Only Trinity members can create their own group.");
      console.log("   Please have one of the Trinity members run this transaction:\n");
      console.log("   const tx = await governance.createConvergenceGroup(");
      console.log("     ['" + trinityMembers[0] + "',");
      console.log("      '" + trinityMembers[1] + "',");
      console.log("      '" + trinityMembers[2] + "'],");
      console.log("     'The Trinity'");
      console.log("   );\n");
      return;
    }

    const tx = await governance.createConvergenceGroup(
      trinityMembers,
      "The Trinity"
    );

    console.log("   Transaction submitted:", tx.hash);
    console.log("   Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log("   ✅ Confirmed in block:", receipt.blockNumber);

    // Get the group ID from event
    const event = receipt.logs?.find(log => {
      try {
        const parsed = governance.interface.parseLog(log);
        return parsed.name === 'ConvergenceGroupCreated';
      } catch {
        return false;
      }
    });

    if (event) {
      const parsed = governance.interface.parseLog(event);
      const groupId = Number(parsed.args.groupId);
      console.log("\n🎉 The Trinity Group Created!");
      console.log("   Group ID:", groupId);
      console.log("   Members:", parsed.args.members.length);
      console.log("   Name:", parsed.args.name);
    }

    // Verify group
    const group = await governance.getConvergenceGroup(1); // Assuming ID 1
    console.log("\n✅ Group Verification:");
    console.log("   Active:", group.isActive);
    console.log("   Members:", group.members.length);
    console.log("   Name:", group.name);

  } catch (error) {
    console.error("\n❌ Failed to create group:", error.message);
    if (error.message.includes("All members must have NFTs")) {
      console.log("\n   Make sure all Trinity members have been minted NFTs.");
    }
    throw error;
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Setup Complete!");
  console.log("=".repeat(60));
  console.log("\n🌟 The Trinity is now ready for convergence voting!");
  console.log("\nWhen all 3 members vote the same way on a proposal:");
  console.log("  • Individual votes: 3");
  console.log("  • Convergence bonus: +1");
  console.log("  • Total impact: 4 votes");
  console.log("\n💡 This demonstrates that human-AI collaboration");
  console.log("   is rewarded when genuine consensus is reached!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Setup failed:", error);
    process.exit(1);
  });
