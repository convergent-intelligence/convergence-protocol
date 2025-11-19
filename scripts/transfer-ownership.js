const hre = require("hardhat");

/**
 * Transfer ownership to Ledger wallet
 */

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Transferring ownership to Ledger...");
    console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");

    const HUMAN_LEDGER = "0xB64564838c88b18cb8f453683C20934f096F2B92";

    // Deployed contracts
    const priceOracleAddress = "0x82013157Dfa324B08Aa0c45FEcD69241C8C42d77";
    const reserveTallyAddress = "0x9E6747Cbe7C95FBb7aDfDD2F3f21fD060E140a50";
    const trustTokenAddress = "0xc2a4d6332EcFdbbe80B0dF301CA5A9935849d529";
    const reserveVaultAddress = "0x425a118042380a2f5fBEcF3f3f140C8F1EfB9B14";

    const priceOracle = await hre.ethers.getContractAt("PriceOracle", priceOracleAddress);
    const reserveTally = await hre.ethers.getContractAt("ReserveTally", reserveTallyAddress);
    const trustToken = await hre.ethers.getContractAt("TrustToken", trustTokenAddress);
    const reserveVault = await hre.ethers.getContractAt("ReserveVault", reserveVaultAddress);

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    console.log("\nTransferring PriceOracle...");
    let tx = await priceOracle.transferOwnership(HUMAN_LEDGER);
    await tx.wait();
    console.log("   Done");
    await delay(3000);

    console.log("Transferring ReserveTally...");
    tx = await reserveTally.transferOwnership(HUMAN_LEDGER);
    await tx.wait();
    console.log("   Done");
    await delay(3000);

    console.log("Transferring TrustToken...");
    tx = await trustToken.transferOwnership(HUMAN_LEDGER);
    await tx.wait();
    console.log("   Done");
    await delay(3000);

    console.log("Transferring ReserveVault...");
    tx = await reserveVault.transferOwnership(HUMAN_LEDGER);
    await tx.wait();
    console.log("   Done");

    console.log("\n" + "=".repeat(50));
    console.log("OWNERSHIP TRANSFERRED TO LEDGER!");
    console.log("=".repeat(50));
    console.log("\nNew Owner:", HUMAN_LEDGER);
    console.log("\nContracts:");
    console.log("  PriceOracle:   ", priceOracleAddress);
    console.log("  ReserveTally:  ", reserveTallyAddress);
    console.log("  TrustToken:    ", trustTokenAddress);
    console.log("  ReserveVault:  ", reserveVaultAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
