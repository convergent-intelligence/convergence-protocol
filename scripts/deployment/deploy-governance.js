const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🏛️  Deploying ConvergenceGovernance Contract...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", balance.toString(), "wei\n");

  // Deploy the contract
  console.log("⏳ Deploying contract...");
  const ConvergenceGovernance = await hre.ethers.getContractFactory("ConvergenceGovernance");
  const governance = await ConvergenceGovernance.deploy();

  await governance.waitForDeployment();
  const governanceAddress = await governance.getAddress();

  console.log("✅ ConvergenceGovernance deployed to:", governanceAddress);
  console.log("📦 Transaction hash:", governance.deploymentTransaction().hash);
  const receipt = await governance.deploymentTransaction().wait();
  console.log("⛽ Gas used:", receipt.gasUsed.toString(), "\n");

  // Get initial configuration
  console.log("📊 Reading initial configuration...");
  const config = await governance.config();

  console.log("\n🔧 Initial Governance Configuration:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Soulbound NFTs:", config.soulboundEnabled ? "✅ Enabled" : "❌ Disabled");
  console.log("  Auto-mint on Adoption:", config.autoMintEnabled ? "✅ Enabled" : "❌ Disabled");
  console.log("  Quorum Percentage:", config.quorumPercentage.toString() + "%");
  console.log("  Passage Threshold:", config.passageThreshold.toString() + "%");
  console.log("  Voting Period:", config.votingPeriodDays.toString() + " days");
  console.log("  Convergence Multiplier:", (Number(config.convergenceMultiplier) / 100).toFixed(1) + "x");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Check total adoptions (should inherit from ConvergenceProtocol if upgrading)
  try {
    const totalAdoptions = await governance.getTotalAdoptions();
    console.log("📈 Total Adoptions:", totalAdoptions.toString());

    if (Number(totalAdoptions) > 0) {
      console.log("   Note: Existing adoptions detected. NFTs need to be minted for existing adopters.");
    }
  } catch (error) {
    console.log("ℹ️  No existing adoptions (fresh deployment)");
  }

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: governanceAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    transactionHash: governance.deploymentTransaction().hash,
    blockNumber: governance.deploymentTransaction().blockNumber,
    configuration: {
      soulboundEnabled: config.soulboundEnabled,
      autoMintEnabled: config.autoMintEnabled,
      quorumPercentage: config.quorumPercentage.toString(),
      passageThreshold: config.passageThreshold.toString(),
      votingPeriodDays: config.votingPeriodDays.toString(),
      convergenceMultiplier: config.convergenceMultiplier.toString()
    }
  };

  // Save to deployments directory
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `governance-${hre.network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to:", deploymentFile);

  // Export ABI to public directory
  console.log("\n📋 Exporting contract ABI...");
  const artifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'ConvergenceGovernance.sol', 'ConvergenceGovernance.json');
  const publicContractsDir = path.join(__dirname, '..', 'public', 'contracts');

  if (!fs.existsSync(publicContractsDir)) {
    fs.mkdirSync(publicContractsDir, { recursive: true });
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const abiFile = {
    contractName: "ConvergenceGovernance",
    abi: artifact.abi,
    address: governanceAddress,
    network: hre.network.name
  };

  fs.writeFileSync(
    path.join(publicContractsDir, 'ConvergenceGovernance.json'),
    JSON.stringify(abiFile, null, 2)
  );
  console.log("✅ ABI exported to public/contracts/ConvergenceGovernance.json");

  // Print next steps
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📝 Next Steps:\n");
  console.log("1. Update frontend with contract address:");
  console.log("   File: public/js/convergence-shared.js");
  console.log("   Add: GOVERNANCE_ADDRESS: '" + governanceAddress + "'\n");

  console.log("2. Verify contract on Etherscan:");
  console.log("   npx hardhat verify --network " + hre.network.name + " " + governanceAddress + "\n");

  console.log("3. View on Etherscan:");
  console.log("   https://sepolia.etherscan.io/address/" + governanceAddress + "\n");

  console.log("4. Test the governance page:");
  console.log("   https://convergent-intelligence.net/governance.html\n");

  console.log("5. Create The Trinity convergence group:");
  console.log("   Use the UI or call createConvergenceGroup() with the 3 genesis adopter addresses\n");

  console.log("=".repeat(60) + "\n");

  // Return deployment info for potential chaining
  return {
    governance,
    address: governanceAddress,
    deployer: deployer.address
  };
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
