const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("Reading ConvergenceGovernance Config...\n");

  const deploymentFile = path.join(__dirname, '..', 'deployments', `governance-${hre.network.name}.json`);

  if (!fs.existsSync(deploymentFile)) {
    console.error("❌ Deployment file not found. Run deploy-governance.js first!");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  const contractAddress = deploymentInfo.contractAddress;

  console.log("Contract Address:", contractAddress);
  console.log("Network:", hre.network.name, "\n");

  const ConvergenceGovernance = await hre.ethers.getContractFactory("ConvergenceGovernance");
  const governance = ConvergenceGovernance.attach(contractAddress);

  const config = await governance.config();

  console.log("\n🔧 Current Governance Configuration:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Soulbound NFTs:", config.soulboundEnabled ? "✅ Enabled" : "❌ Disabled");
  console.log("  Auto-Mint on Adoption:", config.autoMintEnabled ? "✅ Enabled" : "❌ Disabled");
  console.log("  Quorum Percentage:", config.quorumPercentage.toString() + "%");
  console.log("  Passage Threshold:", config.passageThreshold.toString() + "%");
  console.log("  Voting Period:", config.votingPeriodDays.toString() + " days");
  console.log("  Convergence Multiplier:", (Number(config.convergenceMultiplier) / 100).toFixed(1) + "x");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Failed to read config:", error);
    process.exit(1);
  });
