const hre = require("hardhat");
const ethers = hre.ethers;

async function main() {
  const governanceAddress = "0x049FE653a386c203feb75351A7840194B99Ac2d9";
  
  const ConvergenceGovernance = await ethers.getContractFactory("ConvergenceGovernance");
  const governance = ConvergenceGovernance.attach(governanceAddress);
  
  console.log("Checking convergence groups...\n");
  
  // Check group 1 (groups start at ID 1)
  try {
    const group1 = await governance.getConvergenceGroup(1);
    console.log("Group 1:");
    console.log("- Members:", group1.members);
    console.log("- Active:", group1.isActive);
    console.log("- Name:", group1.name);
  } catch (e) {
    console.log("Group 1 does not exist");
  }
  
  console.log("\nChecking proposal 0...");
  const proposal = await governance.getProposal(0);
  console.log("For votes:", proposal.forVotes.toString());
  console.log("Against votes:", proposal.againstVotes.toString());
  console.log("Convergence votes:", proposal.convergenceVotes.toString());
  console.log("Status:", proposal.status);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
