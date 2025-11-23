const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("👥 Deploying UserStatusTracker Contract...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Get token contract addresses from environment or config
  const trustTokenAddress = process.env.TRUST_TOKEN_ADDRESS || '0x4A2178b300556e20569478bfed782bA02BFaD778';
  const tallyTokenAddress = process.env.TALLY_TOKEN_ADDRESS || '0xb8c4682644BAb1900A8B67C3295b8Ce525F3e35d';

  console.log("📋 Token Contract Addresses:");
  console.log("  TrustToken:", trustTokenAddress);
  console.log("  TallyToken:", tallyTokenAddress);
  console.log("");

  // Deploy UserStatusTracker
  console.log("⏳ Deploying UserStatusTracker contract...");
  const UserStatusTracker = await hre.ethers.getContractFactory("UserStatusTracker");
  const tracker = await UserStatusTracker.deploy(trustTokenAddress, tallyTokenAddress);

  await tracker.waitForDeployment();
  const trackerAddress = await tracker.getAddress();

  console.log("✅ UserStatusTracker deployed to:", trackerAddress);
  console.log("📦 Transaction hash:", tracker.deploymentTransaction().hash);
  const receipt = await tracker.deploymentTransaction().wait();
  console.log("⛽ Gas used:", receipt.gasUsed.toString(), "\n");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contract: {
      name: "UserStatusTracker",
      address: trackerAddress,
      transactionHash: tracker.deploymentTransaction().hash,
      blockNumber: tracker.deploymentTransaction().blockNumber,
      gasUsed: receipt.gasUsed.toString()
    },
    tokens: {
      trustToken: trustTokenAddress,
      tallyToken: tallyTokenAddress
    }
  };

  // Save to deployments directory
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `user-status-tracker-${hre.network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment info saved to:", deploymentFile);

  // Export ABI to public directory
  console.log("\n📋 Exporting contract ABI...");
  const publicContractsDir = path.join(__dirname, '..', 'public', 'contracts');

  if (!fs.existsSync(publicContractsDir)) {
    fs.mkdirSync(publicContractsDir, { recursive: true });
  }

  const artifactPath = path.join(
    __dirname, '..', 'artifacts', 'contracts', 'UserStatusTracker.sol', 'UserStatusTracker.json'
  );

  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const abiFile = {
      contractName: "UserStatusTracker",
      abi: artifact.abi,
      address: trackerAddress,
      network: hre.network.name
    };

    fs.writeFileSync(
      path.join(publicContractsDir, 'UserStatusTracker.json'),
      JSON.stringify(abiFile, null, 2)
    );
    console.log("✅ UserStatusTracker ABI exported\n");
  }

  console.log("✨ UserStatusTracker deployment complete!");
  console.log("\n📊 Deployment Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`UserStatusTracker: ${trackerAddress}`);
  console.log(`Monitors: TrustToken & TallyToken`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n🔗 Integration:");
  console.log("  1. Add UserStatusTracker as minter to TrustToken");
  console.log("  2. Grant admin role to UserStatusTracker");
  console.log("  3. Connect with Bible Wallet System for user registration");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
