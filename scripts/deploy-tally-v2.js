const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying TallyVoucher v2 with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Trinity members with NEW agent address
  const GENESIS_HUMAN = "0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb";
  const AGENT_WALLET = "0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22"; // New server-native agent
  const SHARED_WALLET = "0x8ffa5caabe8ee3d9019865120a654464bc4654cd";

  const trinityMembers = [GENESIS_HUMAN, AGENT_WALLET, SHARED_WALLET];

  console.log("\nTrinity Members:");
  console.log("  [0] Genesis Human:", GENESIS_HUMAN);
  console.log("  [1] Agent Wallet:", AGENT_WALLET, "(NEW)");
  console.log("  [2] Shared Wallet:", SHARED_WALLET);

  // Get TrustToken address from V2 deployment
  const v2Deployment = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../deployments/sepolia-v2.json"), "utf8")
  );
  const trustTokenAddress = v2Deployment.trustTokenAddress;

  console.log("\nUsing TrustToken:", trustTokenAddress);

  // Deploy new TallyVoucher
  const TallyVoucher = await hre.ethers.getContractFactory("TallyVoucher");
  const tallyVoucher = await TallyVoucher.deploy(trustTokenAddress, trinityMembers);
  await tallyVoucher.waitForDeployment();

  const contractAddress = await tallyVoucher.getAddress();
  console.log("\nTallyVoucher v2 deployed to:", contractAddress);

  // Save deployment info
  const deployment = {
    network: hre.network.name,
    contractAddress: contractAddress,
    trinityMembers: trinityMembers,
    trustTokenAddress: trustTokenAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    note: "Updated with server-native agent wallet and updateTrinityMember function"
  };

  const deploymentPath = path.join(__dirname, `../deployments/tally-${hre.network.name}-v2.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log("Deployment saved to:", deploymentPath);

  // Copy ABI to public folder
  const artifactPath = path.join(__dirname, "../artifacts/contracts/TallyVoucher.sol/TallyVoucher.json");
  const publicPath = path.join(__dirname, "../public/contracts/TallyVoucher.json");
  fs.copyFileSync(artifactPath, publicPath);
  console.log("ABI copied to public/contracts/");

  console.log("\n--- IMPORTANT ---");
  console.log("The new TallyVoucher needs to be added as a minter to TrustToken.");
  console.log("Run this from the Genesis Human wallet:");
  console.log(`  trustToken.addMinter("${contractAddress}")`);

  return deployment;
}

main()
  .then((deployment) => {
    console.log("\nDeployment complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
