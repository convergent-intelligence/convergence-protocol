#!/usr/bin/env node

/**
 * Show Partner Seed - Display & Format the 12-word Governance Seed
 *
 * Allows authorized users (Genesis, Agent, Partners) to view the partner seed
 * in various formats suitable for etching, memorization, and sharing
 *
 * Usage:
 *   node show-partner-seed.js <wallet> [format]
 *
 * Formats:
 *   - plain      : Simple newline-separated words (default)
 *   - numbered   : Words with numbers 1-12
 *   - grid       : 4x3 grid format (ideal for memorization)
 *   - etch       : Large format with checksums for physical etching
 *   - json       : JSON format for programmatic use
 *   - all        : All formats combined
 */

const PartnerSeedGenerator = require('./generate-partner-seed.js');

const args = process.argv.slice(2);

if (args.length < 1) {
  console.error('\n❌ Missing wallet address\n');
  console.error('Usage: node show-partner-seed.js <wallet> [format]');
  console.error('\nFormats:');
  console.error('  plain       - Simple words (default)');
  console.error('  numbered    - Words with numbers 1-12');
  console.error('  grid        - 4x3 grid (best for memorization)');
  console.error('  etch        - Large format for physical etching');
  console.error('  json        - JSON format');
  console.error('  all         - All formats combined\n');
  process.exit(1);
}

const wallet = args[0];
const format = (args[1] || 'plain').toLowerCase();

try {
  const generator = new PartnerSeedGenerator();

  // Get the seed (with authorization check)
  const result = generator.getPartnerSeed(wallet);

  const seed = result.seed;

  if (!seed || seed === '[REDACTED]' || seed.includes('REDACTED')) {
    console.error('\n❌ ERROR: Seed file not initialized\n');
    console.error('The partner seed has been generated but the actual seed value was not');
    console.error('stored in the secure key file. This can happen if:');
    console.error('  1. The seed was generated in a previous session and not backed up');
    console.error('  2. The seed file was lost or corrupted\n');
    console.error('SOLUTION: If you have the original 12-word seed phrase, you can restore it:\n');
    console.error('  node scripts/governance/import-partner-seed.js <your-wallet> "<word1 word2 ... word12>"\n');
    console.error('Otherwise, you will need to contact the Genesis Human (seed generator)');
    console.error('to obtain the original seed phrase.\n');
    process.exit(1);
  }

  const words = seed.split(' ');

  if (words.length !== 12) {
    throw new Error(`Invalid seed: expected 12 words, got ${words.length}`);
  }

  // Display header
  console.log('\n🔐 PARTNER GOVERNANCE SEED PHRASE');
  console.log('═'.repeat(50));
  console.log(`Accessed: ${result.accessedAt}`);
  console.log(`⚠️  ${result.warning}\n`);

  // Format and display
  switch(format) {
    case 'plain':
      displayPlain(words);
      break;
    case 'numbered':
      displayNumbered(words);
      break;
    case 'grid':
      displayGrid(words);
      break;
    case 'etch':
      displayEtch(words);
      break;
    case 'json':
      displayJSON(words);
      break;
    case 'all':
      displayPlain(words);
      console.log('\n' + '─'.repeat(50) + '\n');
      displayNumbered(words);
      console.log('\n' + '─'.repeat(50) + '\n');
      displayGrid(words);
      console.log('\n' + '─'.repeat(50) + '\n');
      displayEtch(words);
      console.log('\n' + '─'.repeat(50) + '\n');
      displayJSON(words);
      break;
    default:
      console.error(`\n❌ Unknown format: ${format}`);
      console.error('Supported formats: plain, numbered, grid, etch, json, all\n');
      process.exit(1);
  }

  // Display instructions
  console.log('\n' + '═'.repeat(50));
  displayInstructions(format);
  console.log('═'.repeat(50) + '\n');

} catch (error) {
  console.error(`\n❌ Error: ${error.message}\n`);
  process.exit(1);
}

/**
 * Plain format: one word per line
 */
function displayPlain(words) {
  console.log('PLAIN FORMAT:');
  console.log('─'.repeat(50));
  words.forEach(word => {
    console.log(word);
  });
}

/**
 * Numbered format: numbered list
 */
function displayNumbered(words) {
  console.log('NUMBERED FORMAT:');
  console.log('─'.repeat(50));
  words.forEach((word, idx) => {
    const num = (idx + 1).toString().padStart(2, ' ');
    console.log(`${num}. ${word}`);
  });
}

/**
 * Grid format: 4x3 grid for memorization
 */
function displayGrid(words) {
  console.log('MEMORIZATION GRID (4 columns × 3 rows):');
  console.log('─'.repeat(50));

  // Group into 4 columns
  const colWidth = 12;

  for (let row = 0; row < 3; row++) {
    let line = '';
    for (let col = 0; col < 4; col++) {
      const idx = col + (row * 4);
      const num = (idx + 1).toString().padStart(2, ' ');
      const word = words[idx].padEnd(10);
      line += `${num}.${word} `;
    }
    console.log(line);
  }
}

/**
 * Etch format: Large display ideal for physically etching
 */
function displayEtch(words) {
  console.log('ETCHING FORMAT (large, clear):');
  console.log('─'.repeat(50));
  console.log('\n╔═ PARTNER SEED ═══════════════════════════╗');
  console.log('║                                          ║');

  for (let i = 0; i < words.length; i++) {
    const num = (i + 1).toString().padStart(2, ' ');
    const word = words[i].padEnd(28);
    console.log(`║  ${num}. ${word} ║`);
  }

  console.log('║                                          ║');
  console.log('╚════════════════════════════════════════╝');

  // Add word count verification
  console.log(`\n✓ Word Count: ${words.length}`);

  // Add checksum for verification
  const checksum = calculateWordChecksum(words);
  console.log(`✓ Checksum: ${checksum}`);
  console.log('  (Use this to verify all 12 words are correct)\n');
}

/**
 * JSON format: Structured data
 */
function displayJSON(words) {
  console.log('JSON FORMAT:');
  console.log('─'.repeat(50));
  const data = {
    wordCount: 12,
    words: words,
    checksum: calculateWordChecksum(words),
    format: 'BIP39 mnemonic',
    purpose: 'Partner governance collective',
    accessedAt: new Date().toISOString()
  };
  console.log(JSON.stringify(data, null, 2));
}

/**
 * Calculate a simple checksum for the word list
 */
function calculateWordChecksum(words) {
  let checksum = 0;
  words.forEach((word, idx) => {
    const wordValue = word.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    checksum += wordValue * (idx + 1);
  });
  return (checksum % 999999).toString().padStart(6, '0');
}

/**
 * Display format-specific instructions
 */
function displayInstructions(format) {
  const instructions = {
    plain: `
PLAIN FORMAT INSTRUCTIONS:
• Copy words in order
• One word per line makes it easy to transcribe
• Good for digital backup
• Use with numbered format for physical storage`,

    numbered: `
NUMBERED FORMAT INSTRUCTIONS:
• Numbers help verify correct order
• Ideal for checklist when memorizing
• Print and laminate for physical vault
• Double-check numbers match when etching`,

    grid: `
MEMORIZATION GRID INSTRUCTIONS:
• Read left-to-right, top-to-bottom
• Group words mentally (top 4, middle 4, bottom 4)
• Practice reading the grid multiple times
• Once memorized, numbers provide recall verification`,

    etch: `
ETCHING INSTRUCTIONS:
• Print this page on archival paper
• Etch onto metal plate or steel card using:
  - Metal stamp kit, or
  - Professional engraving service, or
  - Thermal etching pen
• Use checksum to verify all 12 words are correct
• Store in vault or fireproof safe
• Keep laminated copy in secondary location`,

    json: `
JSON FORMAT INSTRUCTIONS:
• Use for programmatic backup
• Store in encrypted vault
• Include checksum for data integrity verification
• Export format for secure cold storage`,

    all: `
DISPLAYING ALL FORMATS:
• Plain: Simple transcription
• Numbered: Organized list with verification
• Grid: Memorization structure
• Etch: Physical vault preparation
• JSON: Digital secure backup

Choose the format best suited for your storage method.`
  };

  console.log(instructions[format] || instructions.plain);
  console.log('\n⚠️  SECURITY REMINDERS:');
  console.log('  • Never store digitally without encryption');
  console.log('  • Keep physical copies in separate secure locations');
  console.log('  • Memorize key words for emergency access');
  console.log('  • Share with approved partners only');
  console.log('  • All access is logged and audited\n');
}

module.exports = { displayPlain, displayNumbered, displayGrid, displayEtch, displayJSON };
