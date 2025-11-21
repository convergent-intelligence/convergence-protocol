const hre = require("hardhat");

/**
 * Configure the deployed reserve contracts
 */

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Configuring Reserve System...");
    console.log("Deployer:", deployer.address);
    console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");

    // Trinity addresses
    const HUMAN_LEDGER = "0xB64564838c88b18cb8f453683C20934f096F2B92";
    const AI_AGENT = "0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22";

    // Deployed contracts
    const priceOracleAddress = "0x82013157Dfa324B08Aa0c45FEcD69241C8C42d77";
    const reserveTallyAddress = "0x9E6747Cbe7C95FBb7aDfDD2F3f21fD060E140a50";
    const trustTokenAddress = "0xc2a4d6332EcFdbbe80B0dF301CA5A9935849d529";
    const reserveVaultAddress = "0x425a118042380a2f5fBEcF3f3f140C8F1EfB9B14";

    // Known token addresses on Base
    const TOKENS = {
        USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        USDbC: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
        WETH: "0x4200000000000000000000000000000000000006",
        cbBTC: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
        DAI: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb"
    };

    // Get contracts
    const priceOracle = await hre.ethers.getContractAt("PriceOracle", priceOracleAddress);
    const reserveTally = await hre.ethers.getContractAt("ReserveTally", reserveTallyAddress);
    const trustToken = await hre.ethers.getContractAt("TrustToken", trustTokenAddress);
    const reserveVault = await hre.ethers.getContractAt("ReserveVault", reserveVaultAddress);

    console.log("\nConfiguring...");

    // 1. Add ReserveVault as minter for ReserveTally
    console.log("1. Adding ReserveVault as TALLY minter...");
    let tx = await reserveTally.addMinter(reserveVaultAddress);
    await tx.wait();
    console.log("   Done");

    // 2. Add ReserveTally as minter for TrustToken
    console.log("2. Adding ReserveTally as Trust minter...");
    tx = await trustToken.addMinter(reserveTallyAddress);
    await tx.wait();
    console.log("   Done");

    // 3. Set TrustToken in ReserveTally
    console.log("3. Setting Trust accumulator...");
    tx = await reserveTally.setTrustAccumulator(trustTokenAddress);
    await tx.wait();
    console.log("   Done");

    // 4. Add AI agent as price updater
    console.log("4. Adding AI agent as price updater...");
    tx = await priceOracle.addUpdater(AI_AGENT);
    await tx.wait();
    console.log("   Done");

    // 5. Approve tokens
    console.log("5. Approving reserve tokens...");
    tx = await reserveVault.approveToken(TOKENS.USDC, 1);
    await tx.wait();
    tx = await reserveVault.approveToken(TOKENS.USDbC, 1);
    await tx.wait();
    tx = await reserveVault.approveToken(TOKENS.DAI, 1);
    await tx.wait();
    tx = await reserveVault.approveToken(TOKENS.cbBTC, 2);
    await tx.wait();
    tx = await reserveVault.approveToken(TOKENS.WETH, 3);
    await tx.wait();
    console.log("   Done");

    // 6. Set initial prices
    console.log("6. Setting initial prices...");
    tx = await priceOracle.updateETHPrice(hre.ethers.parseEther("3000"));
    await tx.wait();
    tx = await priceOracle.updateTokenPrice(TOKENS.USDC, hre.ethers.parseEther("1"));
    await tx.wait();
    tx = await priceOracle.updateTokenPrice(TOKENS.cbBTC, hre.ethers.parseEther("90000"));
    await tx.wait();
    console.log("   Done");

    // 7. Transfer ownership to Ledger
    console.log("7. Transferring ownership to Ledger...");
    tx = await priceOracle.transferOwnership(HUMAN_LEDGER);
    await tx.wait();
    tx = await reserveTally.transferOwnership(HUMAN_LEDGER);
    await tx.wait();
    tx = await trustToken.transferOwnership(HUMAN_LEDGER);
    await tx.wait();
    tx = await reserveVault.transferOwnership(HUMAN_LEDGER);
    await tx.wait();
    console.log("   Done");

    console.log("\n" + "=".repeat(50));
    console.log("CONFIGURATION COMPLETE");
    console.log("=".repeat(50));
    console.log("\nOwnership transferred to:", HUMAN_LEDGER);
    console.log("AI Agent authorized at:", AI_AGENT);
    console.log("\nReserve Vault ready to accept deposits at:");
    console.log(reserveVaultAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
