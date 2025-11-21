const hre = require("hardhat");

/**
 * Continue deployment after partial success
 * PriceOracle already deployed at: 0x82013157Dfa324B08Aa0c45FEcD69241C8C42d77
 */

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Continuing 3rd Leg Reserve System deployment...");
    console.log("Deployer:", deployer.address);
    console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");
    console.log("");

    // Trinity addresses
    const HUMAN_LEDGER = "0xB64564838c88b18cb8f453683C20934f096F2B92";
    const AI_AGENT = "0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22";

    // Already deployed
    const priceOracleAddress = "0x82013157Dfa324B08Aa0c45FEcD69241C8C42d77";
    console.log("Using existing PriceOracle:", priceOracleAddress);

    // Known token addresses on Base
    const TOKENS = {
        USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        USDbC: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
        WETH: "0x4200000000000000000000000000000000000006",
        cbBTC: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
        DAI: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb"
    };

    // Get current nonce
    const nonce = await deployer.getNonce();
    console.log("Current nonce:", nonce);

    // Gas settings for Base
    const gasSettings = {
        gasLimit: 3000000,
        maxFeePerGas: hre.ethers.parseUnits("0.1", "gwei"),
        maxPriorityFeePerGas: hre.ethers.parseUnits("0.1", "gwei")
    };

    // 1. Deploy ReserveTally
    console.log("\n1. Deploying ReserveTally...");
    const ReserveTally = await hre.ethers.getContractFactory("ReserveTally");
    const reserveTally = await ReserveTally.deploy({ ...gasSettings, nonce: nonce });
    await reserveTally.waitForDeployment();
    const reserveTallyAddress = await reserveTally.getAddress();
    console.log("   ReserveTally deployed to:", reserveTallyAddress);

    // 2. Deploy TrustToken
    console.log("2. Deploying TrustToken...");
    const TrustToken = await hre.ethers.getContractFactory("TrustToken");
    const trustToken = await TrustToken.deploy(deployer.address, { ...gasSettings, nonce: nonce + 1 });
    await trustToken.waitForDeployment();
    const trustTokenAddress = await trustToken.getAddress();
    console.log("   TrustToken deployed to:", trustTokenAddress);

    // 3. Deploy ReserveVault
    console.log("3. Deploying ReserveVault...");
    const ReserveVault = await hre.ethers.getContractFactory("ReserveVault");
    const reserveVault = await ReserveVault.deploy(
        reserveTallyAddress,
        trustTokenAddress,
        priceOracleAddress,
        AI_AGENT,
        { ...gasSettings, nonce: nonce + 2 }
    );
    await reserveVault.waitForDeployment();
    const reserveVaultAddress = await reserveVault.getAddress();
    console.log("   ReserveVault deployed to:", reserveVaultAddress);

    console.log("\n4. Configuring contracts...");

    // Smaller gas for config txs
    const configGas = {
        gasLimit: 100000,
        maxFeePerGas: hre.ethers.parseUnits("0.1", "gwei"),
        maxPriorityFeePerGas: hre.ethers.parseUnits("0.1", "gwei")
    };

    // Add ReserveVault as minter for ReserveTally
    console.log("   - Adding ReserveVault as TALLY minter...");
    let tx = await reserveTally.addMinter(reserveVaultAddress, configGas);
    await tx.wait();

    // Add ReserveTally as minter for TrustToken (for burn rewards)
    console.log("   - Adding ReserveTally as Trust minter...");
    tx = await trustToken.addMinter(reserveTallyAddress, configGas);
    await tx.wait();

    // Set TrustToken address in ReserveTally
    console.log("   - Setting Trust accumulator...");
    tx = await reserveTally.setTrustAccumulator(trustTokenAddress, configGas);
    await tx.wait();

    // Get PriceOracle contract
    const priceOracle = await hre.ethers.getContractAt("PriceOracle", priceOracleAddress);

    // Add AI agent as price updater
    console.log("   - Adding AI agent as price updater...");
    tx = await priceOracle.addUpdater(AI_AGENT, configGas);
    await tx.wait();

    // Approve tokens for reserve
    console.log("   - Approving reserve tokens...");
    tx = await reserveVault.approveToken(TOKENS.USDC, 1, configGas);  // STABLE
    await tx.wait();
    tx = await reserveVault.approveToken(TOKENS.USDbC, 1, configGas); // STABLE
    await tx.wait();
    tx = await reserveVault.approveToken(TOKENS.DAI, 1, configGas);   // STABLE
    await tx.wait();
    tx = await reserveVault.approveToken(TOKENS.cbBTC, 2, configGas); // BTC
    await tx.wait();
    tx = await reserveVault.approveToken(TOKENS.WETH, 3, configGas);  // ETH
    await tx.wait();

    // Set initial prices
    console.log("   - Setting initial prices...");
    tx = await priceOracle.updateETHPrice(hre.ethers.parseEther("3000"), configGas);
    await tx.wait();
    tx = await priceOracle.updateTokenPrice(TOKENS.USDC, hre.ethers.parseEther("1"), configGas);
    await tx.wait();
    tx = await priceOracle.updateTokenPrice(TOKENS.cbBTC, hre.ethers.parseEther("90000"), configGas);
    await tx.wait();

    // Transfer ownership to Ledger
    console.log("   - Transferring ownership to Ledger...");
    tx = await priceOracle.transferOwnership(HUMAN_LEDGER, configGas);
    await tx.wait();
    tx = await reserveTally.transferOwnership(HUMAN_LEDGER, configGas);
    await tx.wait();
    tx = await trustToken.transferOwnership(HUMAN_LEDGER, configGas);
    await tx.wait();
    tx = await reserveVault.transferOwnership(HUMAN_LEDGER, configGas);
    await tx.wait();

    console.log("\n" + "=".repeat(50));
    console.log("DEPLOYMENT COMPLETE");
    console.log("=".repeat(50));
    console.log("\nContract Addresses:");
    console.log("  PriceOracle:   ", priceOracleAddress);
    console.log("  ReserveTally:  ", reserveTallyAddress);
    console.log("  TrustToken:    ", trustTokenAddress);
    console.log("  ReserveVault:  ", reserveVaultAddress);
    console.log("\nTrinity:");
    console.log("  1st Leg (Human/Ledger): ", HUMAN_LEDGER);
    console.log("  2nd Leg (AI Agent):     ", AI_AGENT);
    console.log("  3rd Leg (Contracts):    ", reserveVaultAddress);

    // Save for reference
    const deployment = {
        network: "base",
        timestamp: new Date().toISOString(),
        contracts: {
            PriceOracle: priceOracleAddress,
            ReserveTally: reserveTallyAddress,
            TrustToken: trustTokenAddress,
            ReserveVault: reserveVaultAddress
        }
    };
    console.log("\nDeployment JSON:");
    console.log(JSON.stringify(deployment, null, 2));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
