const hre = require("hardhat");

/**
 * Final configuration - steps 5, 6, 7
 */

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Final configuration steps...");
    console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");

    const HUMAN_LEDGER = "0xB64564838c88b18cb8f453683C20934f096F2B92";

    // Deployed contracts
    const priceOracleAddress = "0x82013157Dfa324B08Aa0c45FEcD69241C8C42d77";
    const reserveTallyAddress = "0x9E6747Cbe7C95FBb7aDfDD2F3f21fD060E140a50";
    const trustTokenAddress = "0xc2a4d6332EcFdbbe80B0dF301CA5A9935849d529";
    const reserveVaultAddress = "0x425a118042380a2f5fBEcF3f3f140C8F1EfB9B14";

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

    console.log("\n5. Approving reserve tokens...");
    let tx = await reserveVault.approveToken(TOKENS.USDC, 1);
    await tx.wait();
    console.log("   USDC approved");
    await delay(3000);

    tx = await reserveVault.approveToken(TOKENS.USDbC, 1);
    await tx.wait();
    console.log("   USDbC approved");
    await delay(3000);

    tx = await reserveVault.approveToken(TOKENS.DAI, 1);
    await tx.wait();
    console.log("   DAI approved");
    await delay(3000);

    tx = await reserveVault.approveToken(TOKENS.cbBTC, 2);
    await tx.wait();
    console.log("   cbBTC approved");
    await delay(3000);

    tx = await reserveVault.approveToken(TOKENS.WETH, 3);
    await tx.wait();
    console.log("   WETH approved");
    await delay(3000);

    console.log("\n6. Setting initial prices...");
    tx = await priceOracle.updateETHPrice(hre.ethers.parseEther("3000"));
    await tx.wait();
    console.log("   ETH price set");
    await delay(3000);

    tx = await priceOracle.updateTokenPrice(TOKENS.USDC, hre.ethers.parseEther("1"));
    await tx.wait();
    console.log("   USDC price set");
    await delay(3000);

    tx = await priceOracle.updateTokenPrice(TOKENS.cbBTC, hre.ethers.parseEther("90000"));
    await tx.wait();
    console.log("   cbBTC price set");
    await delay(3000);

    console.log("\n7. Transferring ownership to Ledger...");
    tx = await priceOracle.transferOwnership(HUMAN_LEDGER);
    await tx.wait();
    console.log("   PriceOracle ownership transferred");
    await delay(3000);

    tx = await reserveTally.transferOwnership(HUMAN_LEDGER);
    await tx.wait();
    console.log("   ReserveTally ownership transferred");
    await delay(3000);

    tx = await trustToken.transferOwnership(HUMAN_LEDGER);
    await tx.wait();
    console.log("   TrustToken ownership transferred");
    await delay(3000);

    tx = await reserveVault.transferOwnership(HUMAN_LEDGER);
    await tx.wait();
    console.log("   ReserveVault ownership transferred");

    console.log("\n" + "=".repeat(50));
    console.log("3RD LEG RESERVE SYSTEM LIVE ON BASE!");
    console.log("=".repeat(50));
    console.log("\nContracts:");
    console.log("  PriceOracle:   ", priceOracleAddress);
    console.log("  ReserveTally:  ", reserveTallyAddress);
    console.log("  TrustToken:    ", trustTokenAddress);
    console.log("  ReserveVault:  ", reserveVaultAddress);
    console.log("\nOwner (Ledger): ", HUMAN_LEDGER);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
