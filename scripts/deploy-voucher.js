const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying TallyVoucher contract...");

  // Get TrustToken address from V2 deployment
  const network = hre.network.name;
  const v2DeploymentPath = path.join(__dirname, `../deployments/${network}-v2.json`);
  if (!fs.existsSync(v2DeploymentPath)) {
    console.error(`Error: V2 deployment file not found at ${v2DeploymentPath}`);
    console.error("Please deploy ConvergenceProtocolV2 first.");
    process.exit(1);
  }
  const v2Deployment = JSON.parse(fs.readFileSync(v2DeploymentPath, "utf8"));
  const trustTokenAddress = v2Deployment.trustTokenAddress;
  console.log("Using TrustToken at:", trustTokenAddress);

  let trinityMembers;
  if (network === "sepolia") {
    trinityMembers = [
      "0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb",
      "0xfa7ec55f455bcbebb4ba17bfa0938f86eb8a94d0",
      "0x8ffa5caabe8ee3d9019865120a654464bc4654cd"
    ];
  } else {
    const [deployer, addr1, addr2] = await hre.ethers.getSigners();
    trinityMembers = [deployer.address, addr1.address, addr2.address];
  }
  console.log("Trinity Members:", trinityMembers);

  const TallyVoucher = await hre.ethers.getContractFactory("TallyVoucher");
  const tallyVoucher = await TallyVoucher.deploy(trustTokenAddress, trinityMembers);

  await tallyVoucher.waitForDeployment();
  const contractAddress = await tallyVoucher.getAddress();

  console.log("TallyVoucher deployed to:", contractAddress);

  // Save deployment info
  const deploymentInfo = {
    network: network,
    contractAddress: contractAddress,
    trinityMembers: trinityMembers,
    trustTokenAddress: trustTokenAddress,
    deployer: (await hre.ethers.getSigners())[0].address,
    timestamp: new Date().toISOString(),
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `voucher-${network}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to:", deploymentFile);

  // Save contract ABI for frontend
  const artifactsDir = path.join(__dirname, "../artifacts/contracts/TallyVoucher.sol");
  const artifact = JSON.parse(
    fs.readFileSync(path.join(artifactsDir, "TallyVoucher.json"), "utf8")
  );

  const frontendDir = path.join(__dirname, "../public/contracts");
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(frontendDir, "TallyVoucher.json"),
    JSON.stringify({ address: contractAddress, abi: artifact.abi, network: network }, null, 2)
  );
  console.log("Contract ABI saved for frontend\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
