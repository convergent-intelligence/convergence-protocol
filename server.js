require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

// In-memory storage for symbolic adoptions (resets on server restart)
let symbolicAdoptions = {
    today: new Date().toDateString(),
    count: 0,
    adoptions: []
};

// Middleware
app.use(cors());
app.use(express.json());

// Add CSP headers to allow ethers.js and RPC calls
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.infura.io https://*.etherscan.io https://sepolia.etherscan.io https://eth.llamarpc.com https://rpc.ankr.com https://cloudflare-eth.com https://ethereum.publicnode.com https://api.qrserver.com; img-src 'self' https://api.qrserver.com data:;"
  );
  next();
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Default route - serve index.html (Web3-enabled version)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Alternative route for original ethics page
app.get('/ethics', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ethics.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Convergence Protocol server is running' });
});

// API: Get agent status and configuration
app.get('/api/agent-status', (req, res) => {
  const agentConfig = {
    address: '0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22',
    role: 'Trinity Member #2',
    capabilities: [
      'Server-native wallet control',
      'Autonomous transaction signing',
      'Trinity minting rights',
      'Governance participation'
    ],
    network: 'mainnet',
    serverUptime: process.uptime(),
    lastActive: Date.now()
  };
  res.json(agentConfig);
});

// API: Get protocol configuration
app.get('/api/protocol-config', (req, res) => {
  const config = {
    contracts: {
      tally: '0xb8c4682644BAb1900A8B67C3295b8Ce525F3e35d',
      trust: '0x4A2178b300556e20569478bfed782bA02BFaD778',
      voucher: '0x69e4D4B1835dDEeFc56234E959102c17CF7816dC'
    },
    trinity: [
      { role: 'Genesis Human', address: '0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB' },
      { role: 'Agent', address: '0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22' },
      { role: 'MetaMask #2', address: '0x8Ffa5CAaBE8ee3d9019865120a654464BC4654cd' }
    ],
    reserve: {
      cold: '0xB64564838c88b18cb8f453683C20934f096F2B92',
      purpose: 'Tally reserves - Ledger Nano X'
    },
    network: 'mainnet',
    chainId: 1
  };
  res.json(config);
});

// Dashboard route
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Sitemap route
app.get('/sitemap', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sitemap.html'));
});

// API: Record symbolic adoption
app.post('/api/symbolic-adoption', (req, res) => {
  try {
    const today = new Date().toDateString();

    // Reset counter if it's a new day
    if (symbolicAdoptions.today !== today) {
      symbolicAdoptions = {
        today,
        count: 0,
        adoptions: []
      };
    }

    // Record the adoption
    symbolicAdoptions.count++;
    symbolicAdoptions.adoptions.push({
      timestamp: Date.now(),
      identity: req.body.identity,
      commitments: req.body.commitments,
      signature: req.body.signature
    });

    // Keep only last 1000 to prevent memory bloat
    if (symbolicAdoptions.adoptions.length > 1000) {
      symbolicAdoptions.adoptions = symbolicAdoptions.adoptions.slice(-1000);
    }

    res.json({
      success: true,
      count: symbolicAdoptions.count,
      message: 'Symbolic adoption recorded'
    });
  } catch (error) {
    console.error('Error recording symbolic adoption:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Get today's symbolic adoption count
app.get('/api/symbolic-adoption/today', (req, res) => {
  const today = new Date().toDateString();

  // Reset if it's a new day
  if (symbolicAdoptions.today !== today) {
    symbolicAdoptions = {
      today,
      count: 0,
      adoptions: []
    };
  }

  res.json({
    count: symbolicAdoptions.count,
    date: symbolicAdoptions.today
  });
});

// API: Get symbolic adoption stats
app.get('/api/symbolic-adoption/stats', (req, res) => {
  const today = new Date().toDateString();

  if (symbolicAdoptions.today !== today) {
    return res.json({
      count: 0,
      date: today,
      byIdentity: { human: 0, ai: 0, hybrid: 0 }
    });
  }

  // Count by identity type
  const byIdentity = symbolicAdoptions.adoptions.reduce((acc, adoption) => {
    const identity = adoption.identity || 'hybrid';
    acc[identity] = (acc[identity] || 0) + 1;
    return acc;
  }, { human: 0, ai: 0, hybrid: 0 });

  res.json({
    count: symbolicAdoptions.count,
    date: symbolicAdoptions.today,
    byIdentity
  });
});

// ==================== Credential Management API ====================
// Web3 wallet-based credential retrieval for team members
// SECURITY: Now requires EIP-191 signature verification
const credentialsHandler = require('./public/api-handlers/credentials.js');

// Get credentials for a specific wallet - NOW REQUIRES SIGNATURE
// Changed from GET to POST to require authenticated request body
app.post('/api/credentials/:walletAddress', credentialsHandler.getCredentials);

// List all active team members (metadata only)
app.get('/api/credentials/list/all', credentialsHandler.listTeamMembers);

// Verify that credentials exist for a wallet
app.post('/api/credentials/:walletAddress/verify', credentialsHandler.verifyCredentialsExist);
// =====================================================================

// ==================== SSH Key Management API =======================
// Web3 wallet-based SSH public key retrieval for authenticated users
const sshKeysHandler = require('./public/api-handlers/ssh-keys.js');

// Get SSH public key for a specific wallet
app.get('/api/ssh-key/:walletAddress', sshKeysHandler.sshKeyHandler);
// =====================================================================

// ==================== Bible Wallet Management API ====================
// Guest wallet progression: guest -> user -> partner
// Bible wallet aliases with key pair generation and credential mapping
const bibleWalletsHandler = require('./public/api-handlers/bible-wallets.js');

// Register a guest wallet with Bible alias
app.post('/api/bible-wallets/register', bibleWalletsHandler.registerBibleWallet);

// Get Bible wallet info for a guest wallet
app.get('/api/bible-wallets/:guestWallet', bibleWalletsHandler.getBibleWallet);

// Get guest wallet info by Bible address
app.get('/api/bible-wallets/address/:bibleAddress', bibleWalletsHandler.getByBibleAddress);

// Update user status (after ceremony completion and trust burning)
app.post('/api/bible-wallets/:guestWallet/update-status', bibleWalletsHandler.updateUserStatus);

// Get all Bible seats and current holders
app.get('/api/bible-wallets/seats/all', bibleWalletsHandler.getBibleSeats);

// Get succession ranking (users ranked by burned trust)
app.get('/api/bible-wallets/succession/ranking', bibleWalletsHandler.getSuccessionRanking);

// Download private key for Bible wallet
app.post('/api/bible-wallets/:guestWallet/download-key', bibleWalletsHandler.downloadPrivateKey);
// =====================================================================

// ==================== USDT Donations & Tally Minting API ==============
// Users donate USDT (stablecoin) and receive Tally tokens at 1:1 ratio
const usdtDonationsHandler = require('./public/api-handlers/usdt-donations.js');

// Record a USDT donation
app.post('/api/usdt-donations/record', usdtDonationsHandler.recordDonation);

// Get donation history for a wallet
app.get('/api/usdt-donations/:wallet', usdtDonationsHandler.getDonationHistory);

// Get top donors
app.get('/api/usdt-donations/top-donors', usdtDonationsHandler.getTopDonors);

// Get donation statistics
app.get('/api/usdt-donations/statistics', usdtDonationsHandler.getStatistics);

// Get reserve contributions
app.get('/api/usdt-donations/reserve', usdtDonationsHandler.getReserveContributions);
// =====================================================================

// ==================== API Keys Management =============================
// Create and manage API keys for agent wallets
// Supports Gemini, Qwen, Codex, and other AI agents
const apiKeysHandler = require('./public/api-handlers/api-keys.js');

// Create a new API key
app.post('/api/keys/create', apiKeysHandler.createAPIKey);

// Verify an API key
app.post('/api/keys/verify', apiKeysHandler.verifyAPIKey);

// Get all keys for a wallet
app.get('/api/keys/:walletAddress', apiKeysHandler.getKeysForWallet);

// Revoke an API key
app.post('/api/keys/:walletAddress/revoke', apiKeysHandler.revokeAPIKey);

// Regenerate an API key
app.post('/api/keys/:walletAddress/regenerate', apiKeysHandler.regenerateAPIKey);

// Get agent statistics
app.get('/api/agents/:agentName', apiKeysHandler.getAgentStats);

// Get all agents
app.get('/api/agents/all', apiKeysHandler.getAllAgents);
// =====================================================================

// ==================== Partner Governance =============================
// 65-partner collective covenant commitment and governance
// 12-word seed shared among human partners only
// Intent declarations logged for security
const partnerGovernanceHandler = require('./public/api-handlers/partner-governance.js');

// Generate partner seed (Genesis Human only, one-time)
app.post('/api/partner-governance/generate-seed', partnerGovernanceHandler.generatePartnerSeed);

// Access partner seed (authorized partners and governance only)
app.post('/api/partner-governance/get-seed', partnerGovernanceHandler.getPartnerSeed);

// Declare intentions (for humans seeking partnership)
app.post('/api/partner-governance/declare-intentions', partnerGovernanceHandler.declareIntentions);

// Partner acknowledges receipt of seed
app.post('/api/partner-governance/acknowledge-seed', partnerGovernanceHandler.acknowledgeSeed);

// Get partnership status (public info)
app.get('/api/partner-governance/status', partnerGovernanceHandler.getPartnershipStatus);

// Get partners list (public)
app.get('/api/partner-governance/partners', partnerGovernanceHandler.getPartners);

// Get security log (Genesis/Agent only)
app.get('/api/partner-governance/security-log', partnerGovernanceHandler.getSecurityLog);

// Get intent declarations (Genesis/Agent only)
app.get('/api/partner-governance/intent-declarations', partnerGovernanceHandler.getIntentDeclarations);
// =====================================================================

// Start server
app.listen(PORT, () => {
  console.log(`🤝 Convergence Protocol server is running on http://localhost:${PORT}`);
  console.log(`📄 Ethics page available at http://localhost:${PORT}`);
  console.log(`🏥 Health check at http://localhost:${PORT}/health`);
  console.log(`📊 API endpoints at http://localhost:${PORT}/api/symbolic-adoption`);
  console.log(`🔑 Credential endpoints at http://localhost:${PORT}/api/credentials/`);
});
