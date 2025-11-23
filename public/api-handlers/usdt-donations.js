/**
 * USDT Donations API Handler
 *
 * Flow:
 * 1. User donates USDT stablecoin
 * 2. Donation is recorded
 * 3. Tally tokens are minted 1:1 with USDT value
 * 4. User status is updated with tally accumulation
 * 5. Donation tracking for reserve management
 *
 * Supports donations in USDT (and other stablecoins)
 * across multiple chains via bridge
 */

const fs = require('fs');
const path = require('path');

const DONATIONS_FILE = path.join(__dirname, '../../data/donations.json');

class USDTDonationTracker {
  constructor() {
    this.ensureDataDir();
    this.donations = this.loadDonations();
  }

  ensureDataDir() {
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  loadDonations() {
    try {
      if (!fs.existsSync(DONATIONS_FILE)) {
        return this.createDefaultStructure();
      }
      return JSON.parse(fs.readFileSync(DONATIONS_FILE, 'utf8'));
    } catch (error) {
      console.error('Error loading donations:', error);
      return this.createDefaultStructure();
    }
  }

  createDefaultStructure() {
    return {
      totalDonations: 0,
      totalTallyMinted: 0,
      donationsByWallet: {},
      transactionLog: [],
      reserveContributions: []
    };
  }

  saveDonations() {
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(DONATIONS_FILE, JSON.stringify(this.donations, null, 2));
  }

  /**
   * Record a USDT donation and trigger Tally minting
   *
   * @param {string} donorWallet - Wallet address of donor
   * @param {number} usdtAmount - Amount in USDT (with decimals)
   * @param {string} chain - Chain name (e.g., "mainnet", "optimism", "arbitrum")
   * @param {string} txHash - Transaction hash on the blockchain
   * @returns {object} - Donation confirmation with tally minting info
   */
  recordDonation(donorWallet, usdtAmount, chain, txHash) {
    donorWallet = donorWallet.toLowerCase();

    if (!donorWallet || !donorWallet.match(/^0x[a-f0-9]{40}$/i)) {
      throw new Error('Invalid donor wallet address');
    }

    if (usdtAmount <= 0) {
      throw new Error('Donation amount must be greater than 0');
    }

    // Ensure wallet record exists
    if (!this.donations.donationsByWallet[donorWallet]) {
      this.donations.donationsByWallet[donorWallet] = {
        wallet: donorWallet,
        totalUSDT: 0,
        totalTallyReceived: 0,
        donationCount: 0,
        firstDonation: null,
        lastDonation: null,
        donations: []
      };
    }

    // Create donation record
    const donation = {
      timestamp: Date.now(),
      iso: new Date().toISOString(),
      usdtAmount: usdtAmount,
      tallyMinted: usdtAmount, // 1:1 ratio
      chain: chain || 'mainnet',
      txHash: txHash,
      status: 'confirmed'
    };

    // Update wallet records
    const walletRecord = this.donations.donationsByWallet[donorWallet];
    walletRecord.totalUSDT += usdtAmount;
    walletRecord.totalTallyReceived += usdtAmount;
    walletRecord.donationCount++;
    walletRecord.lastDonation = new Date().toISOString();

    if (!walletRecord.firstDonation) {
      walletRecord.firstDonation = new Date().toISOString();
    }

    walletRecord.donations.push(donation);

    // Update global stats
    this.donations.totalDonations += usdtAmount;
    this.donations.totalTallyMinted += usdtAmount;

    // Log transaction
    this.donations.transactionLog.push({
      timestamp: Date.now(),
      type: 'donation',
      wallet: donorWallet,
      usdtAmount: usdtAmount,
      tallyMinted: usdtAmount,
      chain: chain,
      txHash: txHash
    });

    // Record for reserve
    this.donations.reserveContributions.push({
      timestamp: Date.now(),
      donor: donorWallet,
      amount: usdtAmount,
      asset: 'USDT',
      chain: chain,
      txHash: txHash,
      tallyMinted: usdtAmount
    });

    this.saveDonations();

    return {
      success: true,
      donation: {
        usdtAmount: usdtAmount,
        tallyMinted: usdtAmount,
        chain: chain,
        txHash: txHash,
        timestamp: new Date().toISOString()
      },
      walletStats: {
        totalUSDT: walletRecord.totalUSDT,
        totalTallyReceived: walletRecord.totalTallyReceived,
        donationCount: walletRecord.donationCount
      },
      message: `Received ${usdtAmount} USDT. Tally tokens will be minted at 1:1 ratio.`
    };
  }

  /**
   * Get donation history for a wallet
   */
  getDonationHistory(wallet) {
    wallet = wallet.toLowerCase();

    const walletRecord = this.donations.donationsByWallet[wallet];
    if (!walletRecord) {
      return null;
    }

    return {
      wallet: wallet,
      totalUSDT: walletRecord.totalUSDT,
      totalTallyReceived: walletRecord.totalTallyReceived,
      donationCount: walletRecord.donationCount,
      firstDonation: walletRecord.firstDonation,
      lastDonation: walletRecord.lastDonation,
      donations: walletRecord.donations
    };
  }

  /**
   * Get top donors
   */
  getTopDonors(limit = 10) {
    return Object.values(this.donations.donationsByWallet)
      .sort((a, b) => b.totalUSDT - a.totalUSDT)
      .slice(0, limit)
      .map(record => ({
        wallet: record.wallet,
        totalUSDT: record.totalUSDT,
        totalTallyReceived: record.totalTallyReceived,
        donationCount: record.donationCount
      }));
  }

  /**
   * Get donation statistics
   */
  getStatistics() {
    const donors = Object.keys(this.donations.donationsByWallet).length;
    const avgDonation = donors > 0
      ? this.donations.totalDonations / donors
      : 0;

    return {
      totalDonations: this.donations.totalDonations,
      totalTallyMinted: this.donations.totalTallyMinted,
      totalDonors: donors,
      averageDonation: avgDonation,
      reserveBalance: this.donations.totalDonations,
      tallyCirculation: this.donations.totalTallyMinted,
      ratio: 1 // USDT : Tally
    };
  }

  /**
   * Get reserve contributions (for reserve management)
   */
  getReserveContributions() {
    return {
      totalContributions: this.donations.reserveContributions.length,
      totalValue: this.donations.totalDonations,
      contributions: this.donations.reserveContributions.sort(
        (a, b) => b.timestamp - a.timestamp
      )
    };
  }

  /**
   * Verify donation on-chain (would call external API in production)
   */
  async verifyDonationOnChain(chain, txHash, expectedAmount) {
    // In production, this would verify against RPC node
    // For now, return confirmation if already recorded
    const txRecord = this.donations.transactionLog.find(
      tx => tx.txHash.toLowerCase() === txHash.toLowerCase() &&
            tx.chain === chain &&
            tx.usdtAmount === expectedAmount
    );

    return {
      verified: !!txRecord,
      chain: chain,
      txHash: txHash,
      status: txRecord ? 'confirmed' : 'not_found'
    };
  }
}

// Initialize tracker
let donationTracker;

function initializeDonationTracker() {
  if (!donationTracker) {
    donationTracker = new USDTDonationTracker();
  }
  return donationTracker;
}

/**
 * POST /api/usdt-donations/record
 * Record a USDT donation
 *
 * Body:
 *   - donorWallet: wallet address
 *   - usdtAmount: amount donated
 *   - chain: blockchain (default: mainnet)
 *   - txHash: transaction hash
 */
async function recordDonation(req, res) {
  try {
    const { donorWallet, usdtAmount, chain, txHash } = req.body;

    if (!donorWallet || !usdtAmount || !txHash) {
      return res.status(400).json({
        error: 'Missing required fields: donorWallet, usdtAmount, txHash',
        code: 'MISSING_FIELDS'
      });
    }

    const tracker = initializeDonationTracker();
    const result = tracker.recordDonation(donorWallet, usdtAmount, chain || 'mainnet', txHash);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Donation recording error:', error.message);

    if (error.message.includes('Invalid')) {
      return res.status(400).json({
        error: error.message,
        code: 'INVALID_INPUT'
      });
    }

    res.status(500).json({
      error: 'Failed to record donation',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * GET /api/usdt-donations/:wallet
 * Get donation history for a wallet
 */
async function getDonationHistory(req, res) {
  try {
    const { wallet } = req.params;

    if (!wallet || !wallet.match(/^0x[a-f0-9]{40}$/i)) {
      return res.status(400).json({
        error: 'Invalid wallet address',
        code: 'INVALID_WALLET'
      });
    }

    const tracker = initializeDonationTracker();
    const history = tracker.getDonationHistory(wallet);

    if (!history) {
      return res.status(404).json({
        error: 'No donation history found for this wallet',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('Get donation history error:', error.message);
    res.status(500).json({
      error: 'Failed to retrieve donation history',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * GET /api/usdt-donations/top-donors
 * Get top donors
 */
async function getTopDonors(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);

    const tracker = initializeDonationTracker();
    const topDonors = tracker.getTopDonors(limit);

    res.json({
      success: true,
      data: {
        limit: limit,
        count: topDonors.length,
        donors: topDonors
      }
    });

  } catch (error) {
    console.error('Get top donors error:', error.message);
    res.status(500).json({
      error: 'Failed to retrieve top donors',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * GET /api/usdt-donations/statistics
 * Get donation statistics
 */
async function getStatistics(req, res) {
  try {
    const tracker = initializeDonationTracker();
    const stats = tracker.getStatistics();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get statistics error:', error.message);
    res.status(500).json({
      error: 'Failed to retrieve statistics',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * GET /api/usdt-donations/reserve
 * Get reserve contributions
 */
async function getReserveContributions(req, res) {
  try {
    const tracker = initializeDonationTracker();
    const reserve = tracker.getReserveContributions();

    res.json({
      success: true,
      data: reserve
    });

  } catch (error) {
    console.error('Get reserve contributions error:', error.message);
    res.status(500).json({
      error: 'Failed to retrieve reserve contributions',
      code: 'SERVER_ERROR'
    });
  }
}

module.exports = {
  recordDonation,
  getDonationHistory,
  getTopDonors,
  getStatistics,
  getReserveContributions
};
