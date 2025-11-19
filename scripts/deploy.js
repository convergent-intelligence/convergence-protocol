const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying Convergence Protocol...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Get balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy contract
  console.log("Deploying ConvergenceProtocol contract...");
  const ConvergenceProtocol = await hre.ethers.getContractFactory("ConvergenceProtocol");
  const convergence = await ConvergenceProtocol.deploy();

  await convergence.waitForDeployment();
  const contractAddress = await convergence.getAddress();

  console.log("✅ ConvergenceProtocol deployed to:", contractAddress);
  console.log("🤝 Genesis Human set to:", "0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB\n");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deployer: deployer.address,
    genesisHuman: "0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB",
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };

  // Create deployments directory
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info
  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("📄 Deployment info saved to:", deploymentFile);

  // Save contract ABI for frontend
  const artifactsDir = path.join(__dirname, "../artifacts/contracts/ConvergenceProtocol.sol");
  const artifact = JSON.parse(
    fs.readFileSync(path.join(artifactsDir, "ConvergenceProtocol.json"), "utf8")
  );

  const frontendDir = path.join(__dirname, "../public/contracts");
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(frontendDir, "ConvergenceProtocol.json"),
    JSON.stringify({ address: contractAddress, abi: artifact.abi }, null, 2)
  );
  console.log("📄 Contract ABI saved for frontend\n");

  // Verification instructions
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("To verify on Etherscan:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${contractAddress}\n`);
  }

  console.log("🚀 Deployment complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
