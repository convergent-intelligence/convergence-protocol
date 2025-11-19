const hre = require("hardhat");
const ethers = hre.ethers;

async function main() {
  const governanceAddress = "0x049FE653a386c203feb75351A7840194B99Ac2d9";
  
  const ConvergenceGovernance = await ethers.getContractFactory("ConvergenceGovernance");
  const governance = ConvergenceGovernance.attach(governanceAddress);
  
  const members = [
    "0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB",
    "0xfA7Ec55F455bCbeBB4bA17BFA0938F86EB8A94D0",
    "0x8Ffa5CAaBe8ee3d9019865120a654464BC4654cd"
  ];
  
  console.log("Checking groupMemberVotes mapping (proposal 0, group 1)...\n");
  
  for (let i = 0; i < members.length; i++) {
    try {
      const groupVote = await governance.groupMemberVotes(0, 1, members[i]);
      const addr = members[i].slice(0, 10);
      console.log("Member", i+1, addr + "...");
      console.log("  Group vote recorded:", groupVote, "(0=Abstain, 1=For, 2=Against)");
    } catch (e) {
      console.log("Error reading member vote:", e.message);
    }
  }
  
  // Check if members are in the group
  console.log("\nChecking userGroups...");
  for (let i = 0; i < members.length; i++) {
    const groups = await governance.getUserGroups(members[i]);
    const addr = members[i].slice(0, 10);
    console.log("Member", i+1, addr + "... is in groups:", groups.map(g => g.toString()));
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
