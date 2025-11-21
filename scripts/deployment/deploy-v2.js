const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying Convergence Protocol V2...\n");

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());
  console.log();

  // Deploy ConvergenceProtocolV2 (which deploys TrustToken internally)
  console.log("📜 Deploying ConvergenceProtocolV2...");
  const ConvergenceProtocolV2 = await hre.ethers.getContractFactory("ConvergenceProtocolV2");
  const protocol = await ConvergenceProtocolV2.deploy();

  await protocol.waitForDeployment();
  const protocolAddress = await protocol.getAddress();

  console.log("✅ ConvergenceProtocolV2 deployed to:", protocolAddress);

  // Get TrustToken address
  const trustTokenAddress = await protocol.getTrustTokenAddress();
  console.log("✅ TrustToken deployed to:", trustTokenAddress);
  console.log();

  // Get deployment transaction details
  const deploymentTx = protocol.deploymentTransaction();
  const receipt = await deploymentTx.wait();

  console.log("📊 Deployment Details:");
  console.log("  Block Number:", receipt.blockNumber);
  console.log("  Gas Used:", receipt.gasUsed.toString());
  console.log("  Transaction Hash:", deploymentTx.hash);
  console.log();

  // Verify constants
  const genesisHuman = await protocol.GENESIS_HUMAN();
  const initialReward = await protocol.INITIAL_ADOPTION_REWARD();
  const genesisBonus = await protocol.GENESIS_BONUS();

  console.log("🔧 Contract Configuration:");
  console.log("  Genesis Human:", genesisHuman);
  console.log("  Initial Adoption Reward:", hre.ethers.formatEther(initialReward), "TRUST");
  console.log("  Genesis Bonus:", hre.ethers.formatEther(genesisBonus), "TRUST");
  console.log();

  // Save deployment info
  const network = hre.network.name;
  const deploymentInfo = {
    network: network,
    protocolAddress: protocolAddress,
    trustTokenAddress: trustTokenAddress,
    genesisHuman: genesisHuman,
    deployer: deployer.address,
    blockNumber: receipt.blockNumber,
    transactionHash: deploymentTx.hash,
    timestamp: new Date().toISOString(),
    gasUsed: receipt.gasUsed.toString(),
    version: "2.0.0",
    contracts: {
      ConvergenceProtocolV2: protocolAddress,
      TrustToken: trustTokenAddress
    }
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const deploymentPath = path.join(deploymentsDir, `${network}-v2.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

  console.log("💾 Deployment info saved to:", deploymentPath);
  console.log();

  // Save contract ABI for frontend
  const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "ConvergenceProtocolV2.sol", "ConvergenceProtocolV2.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const trustTokenArtifactPath = path.join(__dirname, "..", "artifacts", "contracts", "ConvergenceProtocolV2.sol", "TrustToken.json");
  const trustTokenArtifact = JSON.parse(fs.readFileSync(trustTokenArtifactPath, "utf8"));

  const publicContractsDir = path.join(__dirname, "..", "public", "contracts");
  if (!fs.existsSync(publicContractsDir)) {
    fs.mkdirSync(publicContractsDir, { recursive: true });
  }

  // Save Protocol ABI
  const publicAbiPath = path.join(publicContractsDir, "ConvergenceProtocolV2.json");
  fs.writeFileSync(publicAbiPath, JSON.stringify({
    address: protocolAddress,
    abi: artifact.abi,
    network: network
  }, null, 2));

  // Save TrustToken ABI
  const publicTrustTokenPath = path.join(publicContractsDir, "TrustToken.json");
  fs.writeFileSync(publicTrustTokenPath, JSON.stringify({
    address: trustTokenAddress,
    abi: trustTokenArtifact.abi,
    network: network
  }, null, 2));

  console.log("📄 Contract ABIs saved to /public/contracts/");
  console.log();

  console.log("✨ Deployment Complete!");
  console.log();
  console.log("🔗 Next Steps:");
  console.log("  1. Verify contract on Etherscan:");
  console.log(`     https://sepolia.etherscan.io/address/${protocolAddress}#code`);
  console.log("  2. Make Genesis Adoption (you'll receive 600 TRUST tokens!)");
  console.log("  3. Update frontend to use V2 contract");
  console.log();
  console.log("💡 V2 Features:");
  console.log("  ✅ Soulbound Covenant NFTs (non-transferable governance rights)");
  console.log("  ✅ TRUST Tokens (transferable reputation tokens)");
  console.log("  ✅ Dual-token system for governance + access");
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
