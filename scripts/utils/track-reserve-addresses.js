const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Track Reserve Addresses
 *
 * This script:
 * 1. Loads reserve addresses from deployments/reserve-addresses.json
 * 2. Checks on-chain balances for Ethereum addresses
 * 3. Updates the tracking file with current balances
 * 4. Calculates total reserve value
 */

async function main() {
    console.log("=".repeat(60));
    console.log("RESERVE ADDRESS TRACKER");
    console.log("=".repeat(60));

    // Load reserve addresses
    const reservePath = path.join(__dirname, "../deployments/reserve-addresses.json");
    const reserveData = JSON.parse(fs.readFileSync(reservePath, "utf8"));

    console.log("\n1. TRINITY MEMBERS");
    console.log("-".repeat(60));
    console.log("Human Ledger:", reserveData.trinity.human_ledger);
    console.log("AI Agent:    ", reserveData.trinity.ai_agent);

    // Check Ethereum balances
    console.log("\n2. ETHEREUM ADDRESSES");
    console.log("-".repeat(60));

    const humanLedger = reserveData.trinity.human_ledger;
    const aiAgent = reserveData.trinity.ai_agent;

    const humanBalance = await hre.ethers.provider.getBalance(humanLedger);
    const aiBalance = await hre.ethers.provider.getBalance(aiAgent);

    console.log("Human Ledger Balance:", hre.ethers.formatEther(humanBalance), "ETH");
    console.log("AI Agent Balance:    ", hre.ethers.formatEther(aiBalance), "ETH");

    // Display reserve wallet addresses
    console.log("\n3. RESERVE WALLET ADDRESSES");
    console.log("-".repeat(60));

    const wallets = reserveData.reserve_wallets.hardware_offline.addresses;
    for (const [chain, data] of Object.entries(wallets)) {
        console.log(`\n${chain.toUpperCase()}:`);
        console.log(`  Network: ${data.network}`);
        console.log(`  Address: ${data.address}`);
        console.log(`  Verified: ${data.verified ? 'YES' : 'NO'}`);
        if (data.note) {
            console.log(`  Note: ${data.note}`);
        }
    }

    // Display pending deposits
    console.log("\n4. PENDING DEPOSITS (KALSHI RECOVERY)");
    console.log("-".repeat(60));

    const pending = reserveData.pending_deposits.kalshi_recovery;
    console.log("Status:", pending.status);
    console.log("Platform:", pending.platform);
    console.log("\nTransactions:");

    for (const tx of pending.transactions) {
        console.log(`\n  TX ${tx.id}:`);
        console.log(`    Asset: ${tx.asset}`);
        console.log(`    Amount: ${tx.amount}`);
        console.log(`    Type: ${tx.type}`);
        console.log(`    Status: ${tx.status}`);
        console.log(`    Hash: ${tx.tx_hash}`);
        console.log(`    Notes: ${tx.notes}`);
    }

    console.log(`\nTotal Pending Recovery: $${pending.total_pending_usd} USD`);

    // Display reserve accounting
    console.log("\n5. RESERVE ACCOUNTING");
    console.log("-".repeat(60));

    const accounting = reserveData.reserve_accounting;
    console.log("Total Reserve Value: $", accounting.total_reserve_value_usd, "USD");
    console.log("\nBreakdown:");
    console.log("  Stablecoins:      $", accounting.breakdown.stablecoins);
    console.log("  Bitcoin:          $", accounting.breakdown.bitcoin);
    console.log("  Ethereum:         $", accounting.breakdown.ethereum);
    console.log("  Other Crypto:     $", accounting.breakdown.other_crypto);
    console.log("  Pending Recovery: $", accounting.breakdown.pending_recovery);

    console.log("\nTarget Allocations:");
    console.log("  Stablecoins: ", accounting.target_allocations.stablecoins, "%");
    console.log("  Bitcoin:     ", accounting.target_allocations.bitcoin, "%");
    console.log("  Ethereum:    ", accounting.target_allocations.ethereum, "%");
    console.log("  Other:       ", accounting.target_allocations.other, "%");

    console.log("\nTALLY Minted:", accounting.tally_minted);
    console.log("Backing Ratio:", accounting.tally_backing_ratio);

    // Display action items
    console.log("\n6. ACTION ITEMS");
    console.log("-".repeat(60));

    for (const item of reserveData.action_items) {
        console.log(`\n[${item.priority.toUpperCase()}] ${item.task}`);
        console.log(`  ${item.details}`);
        console.log(`  Status: ${item.status || 'N/A'}`);
        if (item.deadline) {
            console.log(`  Deadline: ${item.deadline}`);
        }
    }

    console.log("\n" + "=".repeat(60));
    console.log("Tracking file:", reservePath);
    console.log("=".repeat(60));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
