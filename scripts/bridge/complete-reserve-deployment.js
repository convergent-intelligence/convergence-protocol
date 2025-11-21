const hre = require("hardhat");

/**
 * Complete Reserve System Deployment
 * Continues from PriceOracle already deployed at: 0x664f08541d3A50125e75a4D33FEE203DA49c5BEB
 */

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("=".repeat(60));
    console.log("COMPLETING RESERVE SYSTEM DEPLOYMENT");
    console.log("=".repeat(60));
    console.log("Deployer:", deployer.address);
    console.log("Network:", hre.network.name);
    console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");
    console.log("");

    // Trinity addresses
    const HUMAN_LEDGER = "0xB64564838c88b18cb8f453683C20934f096F2B92";
    const AI_AGENT = "0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22";

    // Already deployed
    const priceOracleAddress = "0x664f08541d3A50125e75a4D33FEE203DA49c5BEB";
    console.log("✅ PriceOracle (already deployed):", priceOracleAddress);

    // Known token addresses on Base
    const TOKENS = {
        USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        USDbC: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
        WETH: "0x4200000000000000000000000000000000000006",
        cbBTC: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
        DAI: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb"
    };

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // 2. Deploy ReserveTally
    console.log("\n2. Deploying ReserveTally...");
    const ReserveTally = await hre.ethers.getContractFactory("ReserveTally");
    const reserveTally = await ReserveTally.deploy();
    await reserveTally.waitForDeployment();
    const reserveTallyAddress = await reserveTally.getAddress();
    console.log("   ✅ ReserveTally deployed:", reserveTallyAddress);
    await delay(3000);

    // 3. Deploy TrustToken
    console.log("3. Deploying TrustToken...");
    const TrustToken = await hre.ethers.getContractFactory("TrustToken");
    const trustToken = await TrustToken.deploy(deployer.address);
    await trustToken.waitForDeployment();
    const trustTokenAddress = await trustToken.getAddress();
    console.log("   ✅ TrustToken deployed:", trustTokenAddress);
    await delay(3000);

    // 4. Deploy ReserveVault
    console.log("4. Deploying ReserveVault...");
    const ReserveVault = await hre.ethers.getContractFactory("ReserveVault");
    const reserveVault = await ReserveVault.deploy(
        reserveTallyAddress,
        trustTokenAddress,
        priceOracleAddress,
        AI_AGENT
    );
    await reserveVault.waitForDeployment();
    const reserveVaultAddress = await reserveVault.getAddress();
    console.log("   ✅ ReserveVault deployed:", reserveVaultAddress);
    await delay(3000);

    console.log("\n5. Configuring contracts...");

    // Add ReserveVault as minter for ReserveTally
    console.log("   - Adding ReserveVault as TALLY minter...");
    let tx = await reserveTally.addMinter(reserveVaultAddress);
    await tx.wait();
    await delay(2000);

    // Add ReserveTally as minter for TrustToken
    console.log("   - Adding ReserveTally as Trust minter...");
    tx = await trustToken.addMinter(reserveTallyAddress);
    await tx.wait();
    await delay(2000);

    // Set TrustToken as accumulator for ReserveTally
    console.log("   - Setting Trust accumulator...");
    tx = await reserveTally.setTrustAccumulator(trustTokenAddress);
    await tx.wait();
    await delay(2000);

    // Get PriceOracle contract
    const priceOracle = await hre.ethers.getContractAt("PriceOracle", priceOracleAddress);

    // Add AI agent as price updater
    console.log("   - Adding AI agent as price updater...");
    tx = await priceOracle.addUpdater(AI_AGENT);
    await tx.wait();
    await delay(2000);

    // Approve tokens for reserve
    console.log("   - Approving reserve tokens...");
    tx = await reserveVault.approveToken(TOKENS.USDC, 1);  // STABLE
    await tx.wait();
    console.log("     ✓ USDC");
    await delay(2000);

    tx = await reserveVault.approveToken(TOKENS.USDbC, 1); // STABLE
    await tx.wait();
    console.log("     ✓ USDbC");
    await delay(2000);

    tx = await reserveVault.approveToken(TOKENS.DAI, 1);   // STABLE
    await tx.wait();
    console.log("     ✓ DAI");
    await delay(2000);

    tx = await reserveVault.approveToken(TOKENS.cbBTC, 2); // BTC
    await tx.wait();
    console.log("     ✓ cbBTC");
    await delay(2000);

    tx = await reserveVault.approveToken(TOKENS.WETH, 3);  // ETH
    await tx.wait();
    console.log("     ✓ WETH");
    await delay(2000);

    // Set initial prices (will be updated by AI agent)
    console.log("   - Setting initial prices...");
    tx = await priceOracle.updateETHPrice(hre.ethers.parseEther("3000"));
    await tx.wait();
    console.log("     ✓ ETH: $3,000");
    await delay(2000);

    tx = await priceOracle.updateTokenPrice(TOKENS.USDC, hre.ethers.parseEther("1"));
    await tx.wait();
    console.log("     ✓ USDC: $1");
    await delay(2000);

    tx = await priceOracle.updateTokenPrice(TOKENS.USDbC, hre.ethers.parseEther("1"));
    await tx.wait();
    console.log("     ✓ USDbC: $1");
    await delay(2000);

    tx = await priceOracle.updateTokenPrice(TOKENS.DAI, hre.ethers.parseEther("1"));
    await tx.wait();
    console.log("     ✓ DAI: $1");
    await delay(2000);

    tx = await priceOracle.updateTokenPrice(TOKENS.cbBTC, hre.ethers.parseEther("95000"));
    await tx.wait();
    console.log("     ✓ cbBTC: $95,000");
    await delay(2000);

    tx = await priceOracle.updateTokenPrice(TOKENS.WETH, hre.ethers.parseEther("3000"));
    await tx.wait();
    console.log("     ✓ WETH: $3,000");
    await delay(2000);

    // Transfer ownership to Ledger (human)
    console.log("\n6. Transferring ownership to Human Ledger...");
    tx = await priceOracle.transferOwnership(HUMAN_LEDGER);
    await tx.wait();
    console.log("   ✓ PriceOracle");
    await delay(2000);

    tx = await reserveTally.transferOwnership(HUMAN_LEDGER);
    await tx.wait();
    console.log("   ✓ ReserveTally");
    await delay(2000);

    tx = await trustToken.transferOwnership(HUMAN_LEDGER);
    await tx.wait();
    console.log("   ✓ TrustToken");
    await delay(2000);

    tx = await reserveVault.transferOwnership(HUMAN_LEDGER);
    await tx.wait();
    console.log("   ✓ ReserveVault");

    console.log("\n" + "=".repeat(60));
    console.log("🎉 RESERVE SYSTEM DEPLOYMENT COMPLETE!");
    console.log("=".repeat(60));
    console.log("\nContract Addresses:");
    console.log("  PriceOracle:   ", priceOracleAddress);
    console.log("  ReserveTally:  ", reserveTallyAddress);
    console.log("  TrustToken:    ", trustTokenAddress);
    console.log("  ReserveVault:  ", reserveVaultAddress);
    console.log("\nTrinity Configuration:");
    console.log("  1st Leg (Human/Ledger): ", HUMAN_LEDGER);
    console.log("  2nd Leg (AI Agent):     ", AI_AGENT);
    console.log("  3rd Leg (Contracts):    ", reserveVaultAddress);
    console.log("\nApproved Reserve Tokens on Base:");
    console.log("  USDC:  ", TOKENS.USDC);
    console.log("  USDbC: ", TOKENS.USDbC);
    console.log("  DAI:   ", TOKENS.DAI);
    console.log("  cbBTC: ", TOKENS.cbBTC);
    console.log("  WETH:  ", TOKENS.WETH);
    console.log("\nYour Ledger Reserve Value: $620.08");
    console.log("TALLY Ready to Mint: 620.08 TALLY tokens");
    console.log("\nNext Steps:");
    console.log("  1. AI agent monitors prices and updates oracle");
    console.log("  2. Begin depositing reserve assets to mint TALLY");
    console.log("  3. Users can burn TALLY to earn Trust tokens");
    console.log("");

    // Save deployment info
    const deploymentInfo = {
        network: "base",
        chainId: 8453,
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            PriceOracle: priceOracleAddress,
            ReserveTally: reserveTallyAddress,
            TrustToken: trustTokenAddress,
            ReserveVault: reserveVaultAddress
        },
        trinity: {
            human: HUMAN_LEDGER,
            agent: AI_AGENT,
            contracts: reserveVaultAddress
        },
        tokens: TOKENS,
        reserve_value_usd: 620.08,
        tally_to_mint: 620.08
    };

    const fs = require("fs");
    const path = require("path");
    fs.writeFileSync(
        path.join(__dirname, "../deployments/base-reserve-complete.json"),
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("Deployment saved to: deployments/base-reserve-complete.json");
    console.log("");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
