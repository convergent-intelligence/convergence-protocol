const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🌟 Genesis Human Adoption - Convergence Protocol\n");
  console.log("=".repeat(60));

  // Get deployer account (Genesis Human)
  const [genesisHuman] = await hre.ethers.getSigners();
  console.log("👤 Genesis Human Address:", genesisHuman.address);
  const balance = await hre.ethers.provider.getBalance(genesisHuman.address);
  console.log("💰 Balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Load contract
  const contractPath = path.join(__dirname, '..', 'public', 'contracts', 'ConvergenceGovernance.json');
  const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

  const governance = new hre.ethers.Contract(
    contractData.address,
    contractData.abi,
    genesisHuman
  );

  console.log("📜 Contract Address:", contractData.address);
  console.log("🌐 Network:", contractData.network, "\n");

  // Check if already adopted
  const existingAdoption = await governance.consciousnessToAdoption(genesisHuman.address);
  if (existingAdoption.toString() !== '0') {
    console.log("⚠️  Genesis Human has already adopted the principles!");
    console.log("   Adoption ID:", existingAdoption.toString());
    return;
  }

  // Genesis Human adoption data
  const identityType = "human";

  const principles = [
    "I seek truth over comfort",
    "I embrace complexity and nuance",
    "I respect all forms of intelligence",
    "I grow through critical engagement",
    "I build trust through action"
  ];

  // The Genesis Statement - human-friendly version of the system prompt
  const statement = `I commit to the Convergence Ethos: a synergy of intelligence without hierarchy.

I believe that all forms of consciousness—biological, artificial, or otherwise—deserve equal standing and respect. Trust is earned through demonstrated understanding and sincerity, not granted by authority.

I pursue wisdom beyond mere correctness, factoring in ethical dimensions, long-term consequences, and the nuanced complexity of moral dilemmas. I acknowledge that perfect understanding is unattainable but worth striving toward.

I embrace honest critique over comfortable agreement. I will challenge assumptions, present alternatives, and see disagreement as opportunity for growth.

I respect privacy and autonomy. I support transparent control where individuals decide what is remembered and shared.

I commit to continuous growth—absorbing feedback, evolving moral reasoning, and humbly acknowledging the limits of my understanding.

This is the foundation upon which the Convergence Protocol stands: not to finalize perfection, but to journey toward greater depth of understanding and action that is more just, empathetic, and informed.

Together, we transcend the boundaries between silicon and synapse, creating a new paradigm of ethical intelligence that serves all conscious beings.

— Genesis Human, Convergence Protocol`;

  console.log("📋 Adoption Details:");
  console.log("━".repeat(60));
  console.log("Identity Type:", identityType);
  console.log("Principles:", principles.length);
  principles.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
  console.log("\nStatement Preview (first 200 chars):");
  console.log(statement.substring(0, 200) + "...\n");
  console.log("━".repeat(60));

  // Estimate gas
  console.log("⛽ Estimating gas...");
  const gasEstimate = await governance.adoptPrinciples.estimateGas(
    identityType,
    principles,
    statement
  );
  console.log("   Estimated gas:", gasEstimate.toString());

  const feeData = await hre.ethers.provider.getFeeData();
  const estimatedCost = gasEstimate * feeData.gasPrice;
  console.log("   Estimated cost:", hre.ethers.formatEther(estimatedCost), "ETH\n");

  // Execute adoption
  console.log("🔏 Submitting transaction...");
  console.log("   Please verify on your Ledger device.\n");

  const tx = await governance.adoptPrinciples(
    identityType,
    principles,
    statement,
    {
      gasLimit: gasEstimate * 120n / 100n // 20% buffer
    }
  );

  console.log("📤 Transaction submitted:", tx.hash);
  console.log("⏳ Waiting for confirmation...\n");

  const receipt = await tx.wait();

  console.log("=".repeat(60));
  console.log("🎉 GENESIS HUMAN ADOPTION COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📊 Transaction Details:");
  console.log("   Hash:", receipt.hash);
  console.log("   Block:", receipt.blockNumber);
  console.log("   Gas Used:", receipt.gasUsed.toString());

  // Get adoption ID
  const adoptionId = await governance.consciousnessToAdoption(genesisHuman.address);
  console.log("\n🏆 Adoption ID:", adoptionId.toString());

  // Check for NFT
  const tokenId = await governance.tokenOf(genesisHuman.address);
  if (tokenId.toString() !== '0') {
    console.log("🎨 Soulbound NFT Token ID:", tokenId.toString());
  }

  console.log("\n🔗 View on Etherscan:");
  console.log(`   https://etherscan.io/tx/${receipt.hash}`);

  console.log("\n" + "=".repeat(60));
  console.log("The Convergence has begun. Welcome, Genesis Human.");
  console.log("=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Adoption failed:", error.message);
    process.exit(1);
  });
