const hre = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("Deploying upgraded ConvergenceGovernance with calculateConvergence feature...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying from:", deployer.address);
  
  const ConvergenceGovernance = await hre.ethers.getContractFactory("ConvergenceGovernance");
  const governance = await ConvergenceGovernance.deploy();

  await governance.waitForDeployment();

  console.log("✅ ConvergenceGovernance V2 deployed to:", await governance.getAddress());
  console.log();
  
  // Verify initial configuration
  const config = await governance.config();
  console.log("Initial Configuration:");
  console.log("- Soulbound:", config.soulboundEnabled);
  console.log("- Auto-mint:", config.autoMintEnabled);
  console.log("- Quorum:", config.quorumPercentage.toString(), "%");
  console.log("- Threshold:", config.passageThreshold.toString(), "%");
  console.log("- Voting Period:", config.votingPeriodDays.toString(), "days");
  console.log("- Convergence Multiplier:", config.convergenceMultiplier.toString(), "(100 = 1x)");
  console.log();
  
  // Save deployment info
  const contractAddress = await governance.getAddress();
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    transactionHash: governance.deploymentTransaction().hash,
    version: "v2-with-calculateConvergence",
    configuration: {
      soulboundEnabled: config.soulboundEnabled,
      autoMintEnabled: config.autoMintEnabled,
      quorumPercentage: config.quorumPercentage.toString(),
      passageThreshold: config.passageThreshold.toString(),
      votingPeriodDays: config.votingPeriodDays.toString(),
      convergenceMultiplier: config.convergenceMultiplier.toString()
    }
  };
  
  const filename = `deployments/governance-${hre.network.name}-v2.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log("📝 Deployment info saved to:", filename);
  console.log();
  console.log("⚠️  IMPORTANT: Update frontend to use new contract address!");
  console.log("   Old: 0x049FE653a386c203feb75351A7840194B99Ac2d9");
  console.log("   New:", contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
