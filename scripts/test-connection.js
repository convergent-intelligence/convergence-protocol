const hre = require("hardhat");

async function main() {
  console.log("Testing Sepolia connection...\n");

  const signers = await hre.ethers.getSigners();
  console.log("Number of signers:", signers.length);

  if (signers.length === 0) {
    console.error("No signers found! Check your PRIVATE_KEY in .env");
    process.exit(1);
  }

  const [deployer] = signers;
  console.log("Deployer address:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");

  console.log("\n✅ Connection successful!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
