const hre = require("hardhat");
const ethers = hre.ethers;

async function main() {
  const governanceAddress = "0x049FE653a386c203feb75351A7840194B99Ac2d9";
  const provider = hre.ethers.provider;
  
  console.log("Searching for ConvergenceGroupCreated events...\n");
  
  // Get contract
  const ConvergenceGovernance = await ethers.getContractFactory("ConvergenceGovernance");
  const governance = ConvergenceGovernance.attach(governanceAddress);
  
  // Search for group creation events
  const filter = governance.filters.ConvergenceGroupCreated();
  const events = await governance.queryFilter(filter, 0, 'latest');
  
  for (const event of events) {
    const block = await provider.getBlock(event.blockNumber);
    console.log("Group created:", event.args.groupId.toString());
    console.log("  Block:", event.blockNumber);
    console.log("  Timestamp:", block.timestamp, "(" + new Date(block.timestamp * 1000).toISOString() + ")");
    console.log("  Members:", event.args.members);
    console.log("  Name:", event.args.name);
    console.log();
  }
  
  console.log("Vote timestamps:");
  console.log("  Member 1: 1763181360 (" + new Date(1763181360 * 1000).toISOString() + ")");
  console.log("  Member 3: 1763225580 (" + new Date(1763225580 * 1000).toISOString() + ")");
  console.log("  Member 2: 1763225868 (" + new Date(1763225868 * 1000).toISOString() + ")");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
