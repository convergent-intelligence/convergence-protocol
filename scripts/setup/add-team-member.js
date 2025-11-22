#!/usr/bin/env node

/**
 * Add Team Member Credentials
 * Script to securely add a team member's SSH key and credentials to the system
 *
 * Usage: node add-team-member.js
 *        (follows interactive prompts)
 *
 * Or: node add-team-member.js --wallet 0x... --role "Role Name" --key-file path/to/key --server 66.179.95.72
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const CredentialManager = require('../utils/credential-manager.js');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║        Add Team Member Credentials to Convergence Protocol     ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  try {
    const credentialManager = new CredentialManager();

    // Get wallet address
    const wallet = (await question('Team member wallet address: ')).toLowerCase().trim();

    if (!wallet.match(/^0x[a-f0-9]{40}$/i)) {
      console.error('❌ Invalid Ethereum address');
      process.exit(1);
    }

    // Get role
    const role = await question('Role name (e.g., "Leviticus", "Guardian", etc.): ');

    if (!role || role.trim().length === 0) {
      console.error('❌ Role cannot be empty');
      process.exit(1);
    }

    // Get description
    const description = await question(
      'Role description (e.g., "Human Security & Threat Assessment Officer"): '
    );

    // Get server address
    const serverAddress = await question('Server address (default: 66.179.95.72): ') || '66.179.95.72';

    // Get username
    const username = await question('SSH username (default: same as role lowercase): ') || role.toLowerCase();

    // Get port
    const portInput = await question('SSH port (default: 22): ') || '22';
    const port = parseInt(portInput, 10);

    if (isNaN(port) || port < 1 || port > 65535) {
      console.error('❌ Invalid port number');
      process.exit(1);
    }

    // Get SSH key file path
    const keyFilePath = await question('Path to SSH private key file: ');

    if (!fs.existsSync(keyFilePath)) {
      console.error('❌ SSH key file not found:', keyFilePath);
      process.exit(1);
    }

    const sshKeyContent = fs.readFileSync(keyFilePath, 'utf8');

    // Get setup instructions
    const instructions = await question(
      'Setup instructions (e.g., paste from PAUL_SSH_KEY_SETUP.txt or custom): '
    );

    // Confirm before saving
    console.log('\n📋 Team Member Information:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Wallet:       ${wallet}`);
    console.log(`  Role:         ${role}`);
    console.log(`  Description:  ${description}`);
    console.log(`  Server:       ${serverAddress}:${port}`);
    console.log(`  Username:     ${username}`);
    console.log(`  SSH Key:      [${sshKeyContent.split('\n').length} lines]`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const confirm = await question('✓ Save credentials? (yes/no): ');

    if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
      console.log('❌ Cancelled');
      process.exit(0);
    }

    // Add team member
    const result = credentialManager.addTeamMember(wallet, {
      role,
      description,
      ssh_key: sshKeyContent,
      server_address: serverAddress,
      username,
      port,
      instructions,
      status: 'active'
    });

    console.log('\n✅ Team member added successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Wallet:  ${result.wallet}`);
    console.log(`  Role:    ${result.role}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📌 Next steps:');
    console.log('  1. Share the onboarding link: https://[your-domain]/leviticus-onboarding.html');
    console.log('  2. Team member connects their wallet');
    console.log('  3. They can retrieve their SSH key from the credential portal');
    console.log('  4. They follow the setup instructions to configure their access\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
