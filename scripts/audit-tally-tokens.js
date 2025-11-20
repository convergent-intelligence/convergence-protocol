const { ethers } = require("hardhat");

async function main() {
    console.log("=== TALLY Token Audit ===\n");

    // Contract addresses from mainnet deployment
    const TALLY_ADDRESS = "0xb8c4682644BAb1900A8B67C3295b8Ce525F3e35d";
    const TRUST_ADDRESS = "0x4A2178b300556e20569478bfed782bA02BFaD778";
    const VOUCHER_ADDRESS = "0x69e4D4B1835dDEeFc56234E959102c17CF7816dC";

    const trinityMembers = [
        "0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb", // Kristopher
        "0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22", // Agent
        "0x8ffa5caabe8ee3d9019865120a654464bc4654cd"  // Third member
    ];

    // Get contract instances
    const tallyABI = [
        "function balanceOf(address) view returns (uint256)",
        "function totalSupply() view returns (uint256)",
        "function hasMinted(address) view returns (bool)",
        "function trinityMembers(uint256) view returns (address)",
        "event TallyMinted(address indexed minter, address indexed recipient, uint256 amount)",
        "event Transfer(address indexed from, address indexed to, uint256 value)"
    ];

    const tally = new ethers.Contract(TALLY_ADDRESS, tallyABI, ethers.provider);

    // 1. Check total supply
    const totalSupply = await tally.totalSupply();
    console.log("Total TALLY Supply:", ethers.formatEther(totalSupply), "TALLY");
    console.log("");

    // 2. Check Trinity minting status
    console.log("=== Trinity Minting Status ===");
    for (let i = 0; i < trinityMembers.length; i++) {
        const member = trinityMembers[i];
        const hasMinted = await tally.hasMinted(member);
        const balance = await tally.balanceOf(member);
        console.log(`Member ${i + 1}: ${member}`);
        console.log(`  Has Minted: ${hasMinted}`);
        console.log(`  Balance: ${ethers.formatEther(balance)} TALLY`);
    }
    console.log("");

    // 3. Query TallyMinted events
    console.log("=== TallyMinted Events ===");
    const mintFilter = tally.filters.TallyMinted();
    const mintEvents = await tally.queryFilter(mintFilter, 0, "latest");

    if (mintEvents.length === 0) {
        console.log("No TallyMinted events found");
    } else {
        for (const event of mintEvents) {
            const { minter, recipient, amount } = event.args;
            console.log(`Minter: ${minter}`);
            console.log(`Recipient: ${recipient}`);
            console.log(`Amount: ${ethers.formatEther(amount)} TALLY`);
            console.log(`Block: ${event.blockNumber}`);
            console.log(`Tx: ${event.transactionHash}`);
            console.log("---");
        }
    }
    console.log("");

    // 4. Query all Transfer events to find all holders
    console.log("=== All TALLY Transfers ===");
    const transferFilter = tally.filters.Transfer();
    const transferEvents = await tally.queryFilter(transferFilter, 0, "latest");

    // Track unique addresses that received TALLY
    const holders = new Set();
    for (const event of transferEvents) {
        const { from, to, value } = event.args;
        if (to !== ethers.ZeroAddress) {
            holders.add(to.toLowerCase());
        }
        console.log(`From: ${from}`);
        console.log(`To: ${to}`);
        console.log(`Amount: ${ethers.formatEther(value)} TALLY`);
        console.log(`Block: ${event.blockNumber}`);
        console.log(`Tx: ${event.transactionHash}`);
        console.log("---");
    }
    console.log("");

    // 5. Check balances of all holders
    console.log("=== Current TALLY Balances ===");
    for (const holder of holders) {
        const balance = await tally.balanceOf(holder);
        if (balance > 0n) {
            console.log(`${holder}: ${ethers.formatEther(balance)} TALLY`);
        }
    }
    console.log("");

    // 6. Check ETH sent to contracts
    console.log("=== Contract ETH Balances ===");
    const tallyETH = await ethers.provider.getBalance(TALLY_ADDRESS);
    const voucherETH = await ethers.provider.getBalance(VOUCHER_ADDRESS);
    console.log(`TallyToken: ${ethers.formatEther(tallyETH)} ETH`);
    console.log(`TallyVoucher: ${ethers.formatEther(voucherETH)} ETH`);

    // 7. Summary
    console.log("\n=== Summary ===");
    console.log(`Total Supply: ${ethers.formatEther(totalSupply)} TALLY`);
    console.log(`Mint Events: ${mintEvents.length}`);
    console.log(`Transfer Events: ${transferEvents.length}`);
    console.log(`Unique Holders: ${holders.size}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
