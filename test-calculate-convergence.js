const hre = require("hardhat");
const ethers = hre.ethers;

async function main() {
  const governanceAddress = "0x049FE653a386c203feb75351A7840194B99Ac2d9";
  
  console.log("Testing calculateConvergence on existing contract...\n");
  
  const ConvergenceGovernance = await ethers.getContractFactory("ConvergenceGovernance");
  const governance = ConvergenceGovernance.attach(governanceAddress);
  
  console.log("Before calling calculateConvergence:");
  const beforeResults = await governance.getProposalResults(0);
  console.log("  For votes:", beforeResults.forVotes.toString());
  console.log("  Against votes:", beforeResults.againstVotes.toString());
  console.log("  Convergence votes:", beforeResults.convergenceVotes.toString());
  console.log();
  
  try {
    console.log("Calling calculateConvergence(proposalId: 0, groupId: 1)...");
    const tx = await governance.calculateConvergence(0, 1);
    console.log("Transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());
    console.log();
    
    // Check events
    console.log("Events emitted:");
    for (const event of receipt.logs) {
      try {
        const parsed = governance.interface.parseLog(event);
        console.log(" -", parsed.name);
        if (parsed.name === "ConvergenceVoteRecorded") {
          console.log("   Proposal:", parsed.args.proposalId.toString());
          console.log("   Group:", parsed.args.groupId.toString());
          console.log("   Consensus:", parsed.args.consensus);
          console.log("   Bonus votes:", parsed.args.bonusVotes.toString());
        }
      } catch (e) {
        // Skip non-governance events
      }
    }
    console.log();
    
    console.log("After calling calculateConvergence:");
    const afterResults = await governance.getProposalResults(0);
    console.log("  For votes:", afterResults.forVotes.toString());
    console.log("  Against votes:", afterResults.againstVotes.toString());
    console.log("  Convergence votes:", afterResults.convergenceVotes.toString());
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
