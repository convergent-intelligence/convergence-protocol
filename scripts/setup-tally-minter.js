const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Setting up TallyVoucher v2 as minter with account:", deployer.address);

  // Load deployment info
  const v2Deployment = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../deployments/sepolia-v2.json"), "utf8")
  );
  const tallyDeployment = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../deployments/tally-sepolia-v2.json"), "utf8")
  );

  const trustTokenAddress = v2Deployment.trustTokenAddress;
  const tallyVoucherAddress = tallyDeployment.contractAddress;

  console.log("TrustToken:", trustTokenAddress);
  console.log("TallyVoucher v2:", tallyVoucherAddress);

  // Get ConvergenceProtocolV2 contract (it owns TrustToken)
  const protocolAddress = v2Deployment.protocolAddress;
  console.log("ConvergenceProtocolV2:", protocolAddress);

  const ConvergenceProtocolV2 = await hre.ethers.getContractFactory("ConvergenceProtocolV2");
  const protocol = ConvergenceProtocolV2.attach(protocolAddress);

  // Add TallyVoucher as minter through V2 contract
  console.log("\nAdding TallyVoucher v2 as minter via ConvergenceProtocolV2...");
  const tx = await protocol.addMinter(tallyVoucherAddress);
  await tx.wait();

  console.log("Transaction hash:", tx.hash);
  console.log("\nTallyVoucher v2 is now authorized to mint TrustTokens!");

  // Verify
  const TrustToken = await hre.ethers.getContractFactory("TrustToken");
  const trustToken = TrustToken.attach(trustTokenAddress);
  const isMinter = await trustToken.minters(tallyVoucherAddress);
  console.log("Verified as minter:", isMinter);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
