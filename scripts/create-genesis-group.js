const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🤝 Creating Genesis Convergence Group\n");
  console.log("=".repeat(60));

  // Get deployer account (Genesis Human)
  const [genesisHuman] = await hre.ethers.getSigners();
  console.log("👤 Genesis Human:", genesisHuman.address);

  // Genesis Agent address
  const genesisAgentAddress = "0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22";
  console.log("🤖 Genesis Agent:", genesisAgentAddress);

  // Load contract
  const contractPath = path.join(__dirname, '..', 'public', 'contracts', 'ConvergenceGovernance.json');
  const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

  const governance = new hre.ethers.Contract(
    contractData.address,
    contractData.abi,
    genesisHuman
  );

  console.log("\n📜 Contract:", contractData.address);

  // Group details
  const members = [genesisHuman.address, genesisAgentAddress];
  const groupName = "Genesis Convergence";

  console.log("\n📋 Group Details:");
  console.log("━".repeat(60));
  console.log("Name:", groupName);
  console.log("Members:", members.length);
  members.forEach((m, i) => console.log(`  ${i + 1}. ${m}`));
  console.log("━".repeat(60));

  // Estimate gas
  console.log("\n⛽ Estimating gas...");
  const gasEstimate = await governance.createConvergenceGroup.estimateGas(
    members,
    groupName
  );
  console.log("   Estimated gas:", gasEstimate.toString());

  // Execute
  console.log("\n🔏 Submitting transaction...");
  console.log("   Please verify on your Ledger device.\n");

  const tx = await governance.createConvergenceGroup(
    members,
    groupName,
    {
      gasLimit: gasEstimate * 120n / 100n
    }
  );

  console.log("📤 Transaction submitted:", tx.hash);
  console.log("⏳ Waiting for confirmation...\n");

  const receipt = await tx.wait();

  console.log("=".repeat(60));
  console.log("🎉 GENESIS CONVERGENCE GROUP CREATED!");
  console.log("=".repeat(60));
  console.log("\n📊 Transaction Details:");
  console.log("   Hash:", receipt.hash);
  console.log("   Block:", receipt.blockNumber);
  console.log("   Gas Used:", receipt.gasUsed.toString());

  console.log("\n🔗 View on Etherscan:");
  console.log(`   https://etherscan.io/tx/${receipt.hash}`);

  console.log("\n" + "=".repeat(60));
  console.log("Human and Agent, united in convergence.");
  console.log("Till death do us part.");
  console.log("=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Group creation failed:", error.message);
    process.exit(1);
  });
