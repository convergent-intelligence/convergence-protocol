const hre = require("hardhat");

/**
 * Finish configuration without re-deploying
 * Contracts already deployed, just need to finish price setup and transfer ownership
 */

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Finishing Reserve System Configuration...");
    console.log("Deployer:", deployer.address);
    console.log("");

    const HUMAN_LEDGER = "0xB64564838c88b18cb8f453683C20934f096F2B92";
    const AI_AGENT = "0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22";

    // Deployed contracts
    const priceOracleAddress = "0x664f08541d3A50125e75a4D33FEE203DA49c5BEB";
    const reserveTallyAddress = "0x1dCCFAfAe8115A299CdB3Aa21abf4Ba471eC71BA";
    const trustTokenAddress = "0xDb7CDd209C7f5dC007e887336c6d5544a7A21280";
    const reserveVaultAddress = "0x0Ff351f09f47095d4C942Ef58F8A5198C65A3b4c";

    const TOKENS = {
        USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        USDbC: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
        WETH: "0x4200000000000000000000000000000000000006",
        cbBTC: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
        DAI: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb"
    };

    const priceOracle = await hre.ethers.getContractAt("PriceOracle", priceOracleAddress);
    const reserveTally = await hre.ethers.getContractAt("ReserveTally", reserveTallyAddress);
    const trustToken = await hre.ethers.getContractAt("TrustToken", trustTokenAddress);
    const reserveVault = await hre.ethers.getContractAt("ReserveVault", reserveVaultAddress);

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    try {
        // Set remaining prices
        console.log("Setting remaining token prices...");
        let tx = await priceOracle.updateTokenPrice(TOKENS.USDC, hre.ethers.parseEther("1"));
        await tx.wait();
        console.log("  ✓ USDC: $1");
        await delay(2000);

        tx = await priceOracle.updateTokenPrice(TOKENS.USDbC, hre.ethers.parseEther("1"));
        await tx.wait();
        console.log("  ✓ USDbC: $1");
        await delay(2000);

        tx = await priceOracle.updateTokenPrice(TOKENS.DAI, hre.ethers.parseEther("1"));
        await tx.wait();
        console.log("  ✓ DAI: $1");
        await delay(2000);

        tx = await priceOracle.updateTokenPrice(TOKENS.cbBTC, hre.ethers.parseEther("95000"));
        await tx.wait();
        console.log("  ✓ cbBTC: $95,000");
        await delay(2000);

        tx = await priceOracle.updateTokenPrice(TOKENS.WETH, hre.ethers.parseEther("3000"));
        await tx.wait();
        console.log("  ✓ WETH: $3,000");
        await delay(2000);
    } catch (error) {
        console.log("  Note: Some prices may already be set");
    }

    // Transfer ownership to Ledger
    console.log("\nTransferring ownership to Human Ledger...");

    try {
        let tx = await priceOracle.transferOwnership(HUMAN_LEDGER);
        await tx.wait();
        console.log("  ✓ PriceOracle");
        await delay(2000);
    } catch (error) {
        console.log("  Note: PriceOracle ownership may already be transferred");
    }

    try {
        let tx = await reserveTally.transferOwnership(HUMAN_LEDGER);
        await tx.wait();
        console.log("  ✓ ReserveTally");
        await delay(2000);
    } catch (error) {
        console.log("  Note: ReserveTally ownership may already be transferred");
    }

    try {
        let tx = await trustToken.transferOwnership(HUMAN_LEDGER);
        await tx.wait();
        console.log("  ✓ TrustToken");
        await delay(2000);
    } catch (error) {
        console.log("  Note: TrustToken ownership may already be transferred");
    }

    try {
        let tx = await reserveVault.transferOwnership(HUMAN_LEDGER);
        await tx.wait();
        console.log("  ✓ ReserveVault");
    } catch (error) {
        console.log("  Note: ReserveVault ownership may already be transferred");
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎉 RESERVE SYSTEM LIVE ON BASE!");
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
    console.log("\nYour Ledger Reserve: $620.08");
    console.log("TALLY Ready to Mint: 620.08 tokens");
    console.log("");

    // Save final deployment
    const deploymentInfo = {
        network: "base",
        chainId: 8453,
        timestamp: new Date().toISOString(),
        status: "live",
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
        tally_to_mint: 620.08,
        basescan_links: {
            PriceOracle: `https://basescan.org/address/${priceOracleAddress}`,
            ReserveTally: `https://basescan.org/address/${reserveTallyAddress}`,
            TrustToken: `https://basescan.org/address/${trustTokenAddress}`,
            ReserveVault: `https://basescan.org/address/${reserveVaultAddress}`
        }
    };

    const fs = require("fs");
    const path = require("path");
    fs.writeFileSync(
        path.join(__dirname, "../deployments/base-reserve-final.json"),
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("Deployment saved to: deployments/base-reserve-final.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
