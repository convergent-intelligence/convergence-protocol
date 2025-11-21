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
    console.log("=== Bible Book Wallet Addresses ===\n");

    // Get seed phrase from env
    const seedPhrase = process.env.EXODUS_SEED;
    if (!seedPhrase) {
        throw new Error("EXODUS_SEED not found in .env");
    }

    // Generate HD wallet from seed - use Mnemonic to get proper root
    const mnemonic = ethers.Mnemonic.fromPhrase(seedPhrase);
    const hdNode = ethers.HDNodeWallet.fromMnemonic(mnemonic);

    // Generate addresses for all 66 books
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

    // Save to file
    const fs = require('fs');
    const addressData = {
        seed: "EXODUS_SEED (from .env)",
        generated: new Date().toISOString(),
        totalBooks: BIBLE_BOOKS.length,
        books: bibleWallets
    };
    fs.writeFileSync(
        './deployments/bible-book-addresses.json',
        JSON.stringify(addressData, null, 2)
    );
    console.log("\n✓ Addresses saved to deployments/bible-book-addresses.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
