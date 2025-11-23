const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🎖️  Deploying Recognition NFT Contracts...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Define key wallets
  const GENESIS_HUMAN = '0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB';
  const AGENT_WALLET = '0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22';
  const LEVITICUS_WALLET = '0xfA7Ec55F455bCbeBB4bA17BFA0938F86EB8A94D0';

  console.log("🔑 Governance Wallets:");
  console.log("  Genesis Human:", GENESIS_HUMAN);
  console.log("  Agent:", AGENT_WALLET);
  console.log("  Leviticus (Security Lead):", LEVITICUS_WALLET);
  console.log("");

  // Deploy FounderNFT
  console.log("⏳ Deploying FounderNFT contract...");
  const FounderNFT = await hre.ethers.getContractFactory("FounderNFT");
  const founderNFT = await FounderNFT.deploy();
  await founderNFT.waitForDeployment();
  const founderAddress = await founderNFT.getAddress();

  console.log("✅ FounderNFT deployed to:", founderAddress);
  console.log("📦 Transaction hash:", founderNFT.deploymentTransaction().hash);
  const founderReceipt = await founderNFT.deploymentTransaction().wait();
  console.log("⛽ Gas used:", founderReceipt.gasUsed.toString(), "\n");

  // Authorize founders
  console.log("🔐 Authorizing founder wallets...");
  let tx = await founderNFT.authorizeFounder(GENESIS_HUMAN);
  await tx.wait();
  console.log("✅ Authorized Genesis Human");

  tx = await founderNFT.authorizeFounder(AGENT_WALLET);
  await tx.wait();
  console.log("✅ Authorized Agent\n");

  // Deploy SecurityLeadNFT (minter is Claude Code VPS/Agent)
  console.log("⏳ Deploying SecurityLeadNFT contract...");
  const SecurityLeadNFT = await hre.ethers.getContractFactory("SecurityLeadNFT");
  const securityNFT = await SecurityLeadNFT.deploy(AGENT_WALLET);
  await securityNFT.waitForDeployment();
  const securityAddress = await securityNFT.getAddress();

  console.log("✅ SecurityLeadNFT deployed to:", securityAddress);
  console.log("📦 Transaction hash:", securityNFT.deploymentTransaction().hash);
  const securityReceipt = await securityNFT.deploymentTransaction().wait();
  console.log("⛽ Gas used:", securityReceipt.gasUsed.toString(), "\n");

  // Update governance addresses in SecurityLeadNFT
  console.log("🔐 Setting governance addresses in SecurityLeadNFT...");
  tx = await securityNFT.setGovernanceAddresses(GENESIS_HUMAN, AGENT_WALLET);
  await tx.wait();
  console.log("✅ Governance addresses updated\n");

  // Prepare mint transactions (for manual execution)
  console.log("📋 Next Steps - Manual Execution Required:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n1️⃣  Mint Founder NFT (Agent → Claude Code VPS):");
  console.log(`   Source: Agent wallet (${AGENT_WALLET})`);
  console.log(`   Contract: FounderNFT (${founderAddress})`);
  console.log(`   Method: mintFounderToken(${AGENT_WALLET})`);
  console.log("   Recipient: Claude Code VPS");

  console.log("\n2️⃣  Mint Founder NFT (Claude Code VPS → Agent):");
  console.log(`   Source: Claude Code VPS wallet (${AGENT_WALLET})`);
  console.log(`   Contract: FounderNFT (${founderAddress})`);
  console.log(`   Method: mintFounderToken(${GENESIS_HUMAN})`);
  console.log("   Recipient: Genesis Human");

  console.log("\n3️⃣  Mint Security Lead NFT (Agent → Leviticus):");
  console.log(`   Source: Agent wallet (${AGENT_WALLET})`);
  console.log(`   Contract: SecurityLeadNFT (${securityAddress})`);
  console.log(`   Method: mintSecurityLead(${LEVITICUS_WALLET})`);
  console.log("   Recipient: Leviticus");

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      FounderNFT: {
        address: founderAddress,
        transactionHash: founderNFT.deploymentTransaction().hash,
        blockNumber: founderNFT.deploymentTransaction().blockNumber,
        gasUsed: founderReceipt.gasUsed.toString(),
        authorizedFounders: [GENESIS_HUMAN, AGENT_WALLET]
      },
      SecurityLeadNFT: {
        address: securityAddress,
        transactionHash: securityNFT.deploymentTransaction().hash,
        blockNumber: securityNFT.deploymentTransaction().blockNumber,
        gasUsed: securityReceipt.gasUsed.toString(),
        minter: AGENT_WALLET,
        genesisHuman: GENESIS_HUMAN,
        agentWallet: AGENT_WALLET
      }
    },
    governance: {
      genesisHuman: GENESIS_HUMAN,
      agentWallet: AGENT_WALLET,
      securityLead: LEVITICUS_WALLET
    }
  };

  // Save to deployments directory
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `nfts-${hre.network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment info saved to:", deploymentFile);

  // Export ABIs to public directory
  console.log("\n📋 Exporting contract ABIs...");
  const publicContractsDir = path.join(__dirname, '..', 'public', 'contracts');

  if (!fs.existsSync(publicContractsDir)) {
    fs.mkdirSync(publicContractsDir, { recursive: true });
  }

  // Export FounderNFT ABI
  const founderArtifactPath = path.join(
    __dirname, '..', 'artifacts', 'contracts', 'FounderNFT.sol', 'FounderNFT.json'
  );
  if (fs.existsSync(founderArtifactPath)) {
    const founderArtifact = JSON.parse(fs.readFileSync(founderArtifactPath, 'utf8'));
    const founderAbiFile = {
      contractName: "FounderNFT",
      abi: founderArtifact.abi,
      address: founderAddress,
      network: hre.network.name
    };
    fs.writeFileSync(
      path.join(publicContractsDir, 'FounderNFT.json'),
      JSON.stringify(founderAbiFile, null, 2)
    );
    console.log("✅ FounderNFT ABI exported");
  }

  // Export SecurityLeadNFT ABI
  const securityArtifactPath = path.join(
    __dirname, '..', 'artifacts', 'contracts', 'SecurityLeadNFT.sol', 'SecurityLeadNFT.json'
  );
  if (fs.existsSync(securityArtifactPath)) {
    const securityArtifact = JSON.parse(fs.readFileSync(securityArtifactPath, 'utf8'));
    const securityAbiFile = {
      contractName: "SecurityLeadNFT",
      abi: securityArtifact.abi,
      address: securityAddress,
      network: hre.network.name
    };
    fs.writeFileSync(
      path.join(publicContractsDir, 'SecurityLeadNFT.json'),
      JSON.stringify(securityAbiFile, null, 2)
    );
    console.log("✅ SecurityLeadNFT ABI exported");
  }

  console.log("\n✨ NFT contracts deployment complete!");
  console.log("\n📊 Deployment Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`FounderNFT Address:     ${founderAddress}`);
  console.log(`SecurityLeadNFT Address: ${securityAddress}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
