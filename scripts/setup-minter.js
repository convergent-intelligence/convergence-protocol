const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Setting up TallyVoucher as a minter on TrustToken...");

  const network = hre.network.name;

  // Get ConvergenceProtocolV2 address
  const v2DeploymentPath = path.join(__dirname, `../deployments/${network}-v2.json`);
  if (!fs.existsSync(v2DeploymentPath)) {
    console.error(`Error: V2 deployment file not found at ${v2DeploymentPath}`);
    process.exit(1);
  }
  const v2Deployment = JSON.parse(fs.readFileSync(v2DeploymentPath, "utf8"));
  const protocolAddress = v2Deployment.protocolAddress;
  console.log("Using ConvergenceProtocolV2 at:", protocolAddress);

  // Get TallyVoucher address
  const voucherDeploymentPath = path.join(__dirname, `../deployments/voucher-${network}.json`);
  if (!fs.existsSync(voucherDeploymentPath)) {
    console.error(`Error: Voucher deployment file not found at ${voucherDeploymentPath}`);
    process.exit(1);
  }
  const voucherDeployment = JSON.parse(fs.readFileSync(voucherDeploymentPath, "utf8"));
  const voucherAddress = voucherDeployment.contractAddress;
  console.log("Using TallyVoucher at:", voucherAddress);

  // Get the ConvergenceProtocolV2 contract instance
  const ConvergenceProtocolV2 = await hre.ethers.getContractFactory("ConvergenceProtocolV2");
  const protocol = ConvergenceProtocolV2.attach(protocolAddress);

  // Add TallyVoucher as a minter
  console.log("Adding TallyVoucher as a minter on TrustToken...");
  const tx = await protocol.addMinter(voucherAddress);
  await tx.wait();

  console.log("✅ TallyVoucher is now a minter on TrustToken.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
