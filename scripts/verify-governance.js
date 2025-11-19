const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🔍 Verifying ConvergenceGovernance Contract on Etherscan...\n");

  // Load deployment info
  const deploymentFile = path.join(__dirname, '..', 'deployments', `governance-${hre.network.name}.json`);

  if (!fs.existsSync(deploymentFile)) {
    console.error("❌ Deployment file not found:", deploymentFile);
    console.log("   Run deploy-governance.js first!");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  const contractAddress = deploymentInfo.contractAddress;

  console.log("📝 Contract Address:", contractAddress);
  console.log("🌐 Network:", hre.network.name);
  console.log("");

  try {
    // Verify the contract
    console.log("⏳ Submitting verification request to Etherscan...");
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [], // ConvergenceGovernance has no constructor args
    });

    console.log("\n✅ Contract verified successfully!");
    console.log("🔗 View on Etherscan: https://sepolia.etherscan.io/address/" + contractAddress + "#code");

  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("\n✅ Contract already verified!");
      console.log("🔗 View on Etherscan: https://sepolia.etherscan.io/address/" + contractAddress + "#code");
    } else {
      console.error("\n❌ Verification failed:", error.message);
      console.log("\nTry manual verification:");
      console.log("1. Go to https://sepolia.etherscan.io/address/" + contractAddress + "#code");
      console.log("2. Click 'Verify and Publish'");
      console.log("3. Select: Solidity (Single file)");
      console.log("4. Compiler: v0.8.19");
      console.log("5. MIT License");
      console.log("6. Upload: contracts/ConvergenceGovernance.sol");
      process.exit(1);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
