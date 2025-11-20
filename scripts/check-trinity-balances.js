const { ethers } = require("hardhat");

async function main() {
    console.log("=== Trinity Wallet Balances (Mainnet) ===\n");

    const trinityMembers = [
        { name: "Kristopher (Trinity)", address: "0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb" },
        { name: "Agent", address: "0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22" },
        { name: "Third Member", address: "0x8ffa5caabe8ee3d9019865120a654464bc4654cd" },
        { name: "Hardware Wallet", address: "0xB64564838c88b18cb8f453683C20934f096F2B92" }
    ];

    let totalETH = 0n;

    for (const member of trinityMembers) {
        const balance = await ethers.provider.getBalance(member.address);
        totalETH += balance;
        console.log(`${member.name}:`);
        console.log(`  Address: ${member.address}`);
        console.log(`  ETH: ${ethers.formatEther(balance)}`);
        console.log("");
    }

    console.log("=== Summary ===");
    console.log(`Total ETH across Trinity: ${ethers.formatEther(totalETH)} ETH`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
