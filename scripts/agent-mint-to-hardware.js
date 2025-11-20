const { ethers } = require("hardhat");

async function main() {
    console.log("=== Agent Minting TALLY to Hardware Wallet ===\n");

    const TALLY_ADDRESS = "0xb8c4682644BAb1900A8B67C3295b8Ce525F3e35d";
    const HARDWARE_WALLET = "0xB64564838c88b18cb8f453683C20934f096F2B92";

    // Get agent signer
    const agentPrivateKey = process.env.AGENT_PRIVATE_KEY;
    const agent = new ethers.Wallet(agentPrivateKey, ethers.provider);

    console.log("Agent address:", agent.address);
    console.log("Minting to Hardware wallet:", HARDWARE_WALLET);

    // TallyToken ABI
    const tallyABI = [
        "function mintTally(address to) external",
        "function hasMinted(address) view returns (bool)",
        "function balanceOf(address) view returns (uint256)"
    ];

    const tally = new ethers.Contract(TALLY_ADDRESS, tallyABI, agent);

    // Check if agent already minted
    const hasMinted = await tally.hasMinted(agent.address);
    if (hasMinted) {
        console.log("Agent has already used its minting allotment!");
        return;
    }

    // Check balances before
    const hwBalanceBefore = await tally.balanceOf(HARDWARE_WALLET);
    console.log("\nHardware wallet balance before:", ethers.formatEther(hwBalanceBefore), "TALLY");

    // Mint
    console.log("\nMinting 1 TALLY to Hardware wallet...");
    const tx = await tally.mintTally(HARDWARE_WALLET);
    console.log("Transaction hash:", tx.hash);

    const receipt = await tx.wait();
    console.log("Confirmed in block:", receipt.blockNumber);

    // Check balances after
    const hwBalanceAfter = await tally.balanceOf(HARDWARE_WALLET);
    console.log("\nHardware wallet balance after:", ethers.formatEther(hwBalanceAfter), "TALLY");

    console.log("\n✓ Mint complete!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
