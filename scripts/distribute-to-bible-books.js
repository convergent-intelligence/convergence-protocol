const { ethers } = require("hardhat");

// All 66 books of the Bible in canonical order
const BIBLE_BOOKS = [
    // Old Testament (39 books)
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
    "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
    "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra",
    "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
    "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations",
    "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
    "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk",
    "Zephaniah", "Haggai", "Zechariah", "Malachi",
    // New Testament (27 books)
    "Matthew", "Mark", "Luke", "John", "Acts",
    "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
    "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy",
    "2 Timothy", "Titus", "Philemon", "Hebrews", "James",
    "1 Peter", "2 Peter", "1 John", "2 John", "3 John",
    "Jude", "Revelation"
];

async function main() {
    console.log("=== Generating Bible Book Wallets & Distributing TALLY ===\n");

    const TALLY_ADDRESS = "0xb8c4682644BAb1900A8B67C3295b8Ce525F3e35d";

    // Get seed phrase from env
    const seedPhrase = process.env.EXODUS_SEED;
    if (!seedPhrase) {
        throw new Error("EXODUS_SEED not found in .env");
    }

    // Generate HD wallet from seed - use Mnemonic to get proper root
    const mnemonic = ethers.Mnemonic.fromPhrase(seedPhrase);
    const hdNode = ethers.HDNodeWallet.fromMnemonic(mnemonic);

    // Generate addresses for all 66 books
    console.log("=== Bible Book Addresses ===\n");
    const bibleWallets = [];

    for (let i = 0; i < BIBLE_BOOKS.length; i++) {
        const path = `44'/60'/0'/0/${i}`;
        const wallet = hdNode.derivePath(path);
        bibleWallets.push({
            index: i,
            book: BIBLE_BOOKS[i],
            address: wallet.address,
            path: `m/${path}`
        });
        console.log(`${i.toString().padStart(2, '0')}. ${BIBLE_BOOKS[i].padEnd(20)} ${wallet.address}`);
    }

    // Get agent signer for transfers
    const agentPrivateKey = process.env.AGENT_PRIVATE_KEY;
    const agent = new ethers.Wallet(agentPrivateKey, ethers.provider);

    // TallyToken contract
    const tallyABI = [
        "function transfer(address to, uint256 amount) returns (bool)",
        "function balanceOf(address) view returns (uint256)"
    ];
    const tally = new ethers.Contract(TALLY_ADDRESS, tallyABI, agent);

    // Check agent's TALLY balance
    const agentBalance = await tally.balanceOf(agent.address);
    console.log("\n=== Agent TALLY Balance ===");
    console.log(`Balance: ${ethers.formatEther(agentBalance)} TALLY`);

    if (agentBalance === 0n) {
        console.log("\nAgent has no TALLY to distribute!");
        return;
    }

    // Calculate amount per book (divide evenly among 66 books)
    const amountPerBook = agentBalance / 66n;
    console.log(`Amount per book: ${ethers.formatEther(amountPerBook)} TALLY`);
    console.log(`Total to distribute: ${ethers.formatEther(amountPerBook * 66n)} TALLY`);

    // Confirm before proceeding
    console.log("\n=== Starting Distribution ===\n");

    // Distribute to all 66 books
    for (let i = 0; i < bibleWallets.length; i++) {
        const wallet = bibleWallets[i];
        try {
            console.log(`Sending to ${wallet.book} (${wallet.address.slice(0, 10)}...)...`);
            const tx = await tally.transfer(wallet.address, amountPerBook);
            await tx.wait();
            console.log(`  ✓ Sent ${ethers.formatEther(amountPerBook)} TALLY`);
        } catch (error) {
            console.log(`  ✗ Failed: ${error.message}`);
        }
    }

    // Final balance check
    const finalBalance = await tally.balanceOf(agent.address);
    console.log("\n=== Distribution Complete ===");
    console.log(`Agent remaining balance: ${ethers.formatEther(finalBalance)} TALLY`);

    // Save addresses to file for reference
    const fs = require('fs');
    const addressData = {
        seed: "EXODUS_SEED (12 words)",
        generated: new Date().toISOString(),
        books: bibleWallets.map(w => ({
            index: w.index,
            book: w.book,
            address: w.address,
            path: w.path
        }))
    };
    fs.writeFileSync(
        './deployments/bible-book-addresses.json',
        JSON.stringify(addressData, null, 2)
    );
    console.log("\nAddresses saved to deployments/bible-book-addresses.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
