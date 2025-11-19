const hre = require("hardhat");

/**
 * Deploy the 3rd Leg Reserve System to Base
 *
 * Contracts:
 * 1. PriceOracle - Asset valuation
 * 2. ReserveTally - Reserve-backed TALLY token
 * 3. ReserveVault - Main reserve manager
 *
 * Trinity Addresses:
 * - 1st Leg (Human/Ledger): 0xB64564838c88b18cb8f453683C20934f096F2B92
 * - 2nd Leg (AI Agent): 0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22
 * - 3rd Leg (Contracts): Deployed addresses
 */

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Deploying 3rd Leg Reserve System...");
    console.log("Deployer:", deployer.address);
    console.log("Network:", hre.network.name);
    console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");
    console.log("");

    // Trinity addresses
    const HUMAN_LEDGER = "0xB64564838c88b18cb8f453683C20934f096F2B92";
    const AI_AGENT = "0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22";

    // Known token addresses on Base
    const TOKENS = {
        USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        USDbC: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
        WETH: "0x4200000000000000000000000000000000000006",
        cbBTC: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
        DAI: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb"
    };

    // 1. Deploy PriceOracle
    console.log("1. Deploying PriceOracle...");
    const PriceOracle = await hre.ethers.getContractFactory("PriceOracle");
    const priceOracle = await PriceOracle.deploy();
    await priceOracle.waitForDeployment();
    const priceOracleAddress = await priceOracle.getAddress();
    console.log("   PriceOracle deployed to:", priceOracleAddress);

    // 2. Deploy ReserveTally
    console.log("2. Deploying ReserveTally...");
    const ReserveTally = await hre.ethers.getContractFactory("ReserveTally");
    const reserveTally = await ReserveTally.deploy();
    await reserveTally.waitForDeployment();
    const reserveTallyAddress = await reserveTally.getAddress();
    console.log("   ReserveTally deployed to:", reserveTallyAddress);

    // 3. Deploy TrustToken (using existing contract)
    console.log("3. Deploying TrustToken...");
    const TrustToken = await hre.ethers.getContractFactory("TrustToken");
    const trustToken = await TrustToken.deploy(deployer.address);
    await trustToken.waitForDeployment();
    const trustTokenAddress = await trustToken.getAddress();
    console.log("   TrustToken deployed to:", trustTokenAddress);

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
    console.log("   ReserveVault deployed to:", reserveVaultAddress);

    console.log("");
    console.log("5. Configuring contracts...");

    // Add ReserveVault as minter for ReserveTally
    console.log("   - Adding ReserveVault as TALLY minter...");
    await reserveTally.addMinter(reserveVaultAddress);

    // Add ReserveTally as minter for TrustToken
    console.log("   - Adding ReserveTally as Trust minter...");
    await trustToken.addMinter(reserveTallyAddress);

    // Set TrustToken as accumulator for ReserveTally
    console.log("   - Setting Trust accumulator...");
    await reserveTally.setTrustAccumulator(trustTokenAddress);

    // Add AI agent as price updater
    console.log("   - Adding AI agent as price updater...");
    await priceOracle.addUpdater(AI_AGENT);

    // Approve tokens for reserve
    console.log("   - Approving reserve tokens...");
    await reserveVault.approveToken(TOKENS.USDC, 1);  // STABLE
    await reserveVault.approveToken(TOKENS.USDbC, 1); // STABLE
    await reserveVault.approveToken(TOKENS.DAI, 1);   // STABLE
    await reserveVault.approveToken(TOKENS.cbBTC, 2); // BTC
    await reserveVault.approveToken(TOKENS.WETH, 3);  // ETH

    // Set initial prices (will be updated by AI agent)
    console.log("   - Setting initial prices...");
    await priceOracle.updateETHPrice(hre.ethers.parseEther("3000")); // $3000
    await priceOracle.updateTokenPrice(TOKENS.USDC, hre.ethers.parseEther("1"));
    await priceOracle.updateTokenPrice(TOKENS.USDbC, hre.ethers.parseEther("1"));
    await priceOracle.updateTokenPrice(TOKENS.DAI, hre.ethers.parseEther("1"));
    await priceOracle.updateTokenPrice(TOKENS.cbBTC, hre.ethers.parseEther("90000")); // $90k
    await priceOracle.updateTokenPrice(TOKENS.WETH, hre.ethers.parseEther("3000"));

    // Transfer ownership to Ledger (human)
    console.log("   - Transferring ownership to Ledger...");
    await priceOracle.transferOwnership(HUMAN_LEDGER);
    await reserveTally.transferOwnership(HUMAN_LEDGER);
    await trustToken.transferOwnership(HUMAN_LEDGER);
    await reserveVault.transferOwnership(HUMAN_LEDGER);

    console.log("");
    console.log("=".repeat(50));
    console.log("DEPLOYMENT COMPLETE");
    console.log("=".repeat(50));
    console.log("");
    console.log("Contract Addresses:");
    console.log("  PriceOracle:   ", priceOracleAddress);
    console.log("  ReserveTally:  ", reserveTallyAddress);
    console.log("  TrustToken:    ", trustTokenAddress);
    console.log("  ReserveVault:  ", reserveVaultAddress);
    console.log("");
    console.log("Trinity Configuration:");
    console.log("  1st Leg (Human/Ledger): ", HUMAN_LEDGER);
    console.log("  2nd Leg (AI Agent):     ", AI_AGENT);
    console.log("  3rd Leg (Contracts):    ", reserveVaultAddress);
    console.log("");
    console.log("Approved Reserve Tokens:");
    console.log("  USDC:  ", TOKENS.USDC);
    console.log("  USDbC: ", TOKENS.USDbC);
    console.log("  DAI:   ", TOKENS.DAI);
    console.log("  cbBTC: ", TOKENS.cbBTC);
    console.log("  WETH:  ", TOKENS.WETH);
    console.log("");
    console.log("Next Steps:");
    console.log("  1. Bridge ETH from mainnet to Base for gas");
    console.log("  2. Create Gnosis Safe multisig (optional for extra security)");
    console.log("  3. AI agent begins price updates");
    console.log("  4. Accept first deposits");
    console.log("");

    // Save deployment info
    const deploymentInfo = {
        network: hre.network.name,
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
        tokens: TOKENS
    };

    console.log("Deployment Info (save this):");
    console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
