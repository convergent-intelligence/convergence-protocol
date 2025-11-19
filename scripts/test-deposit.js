const hre = require("hardhat");

/**
 * Test deposit ETH into ReserveVault
 */

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Testing ETH deposit to ReserveVault...");
    console.log("Depositor:", deployer.address);
    console.log("Balance before:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");

    const reserveVaultAddress = "0x425a118042380a2f5fBEcF3f3f140C8F1EfB9B14";
    const reserveTallyAddress = "0x9E6747Cbe7C95FBb7aDfDD2F3f21fD060E140a50";

    const reserveVault = await hre.ethers.getContractAt("ReserveVault", reserveVaultAddress);
    const reserveTally = await hre.ethers.getContractAt("ReserveTally", reserveTallyAddress);

    // Check TALLY balance before
    const tallyBefore = await reserveTally.balanceOf(deployer.address);
    console.log("TALLY balance before:", hre.ethers.formatEther(tallyBefore));

    // Deposit 0.001 ETH
    const depositAmount = hre.ethers.parseEther("0.001");
    console.log("\nDepositing", hre.ethers.formatEther(depositAmount), "ETH...");

    const tx = await reserveVault.depositETH({ value: depositAmount });
    console.log("Transaction hash:", tx.hash);

    const receipt = await tx.wait();
    console.log("Confirmed in block:", receipt.blockNumber);

    // Check balances after
    const tallyAfter = await reserveTally.balanceOf(deployer.address);
    const vaultBalance = await hre.ethers.provider.getBalance(reserveVaultAddress);
    const deployerBalance = await hre.ethers.provider.getBalance(deployer.address);

    console.log("\n" + "=".repeat(50));
    console.log("DEPOSIT SUCCESSFUL!");
    console.log("=".repeat(50));
    console.log("\nTALLY minted:", hre.ethers.formatEther(tallyAfter - tallyBefore));
    console.log("Total TALLY balance:", hre.ethers.formatEther(tallyAfter));
    console.log("Vault ETH balance:", hre.ethers.formatEther(vaultBalance), "ETH");
    console.log("Deployer ETH balance:", hre.ethers.formatEther(deployerBalance), "ETH");

    // Check reserve health
    const health = await reserveVault.getReserveHealth();
    console.log("\nReserve Health:");
    console.log("  Total Value (USD):", hre.ethers.formatEther(health[0]));
    console.log("  TALLY Supply:", hre.ethers.formatEther(health[1]));
    console.log("  Backing Ratio:", Number(health[2]) / 100, "%");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
