/**
 * Bible Wallets API Handler
 * Manages user progression from guest -> user -> partner
 * Handles Bible wallet creation and association
 * SECURITY: Private key download now requires signature verification
 */

const BibleWalletManager = require('../../scripts/utils/bible-wallet-manager.js');
const { verifySignature } = require('../middleware/web3-auth.js');

let bibleWalletManager;

function initializeBibleWalletManager() {
  if (!bibleWalletManager) {
    bibleWalletManager = new BibleWalletManager();
  }
  return bibleWalletManager;
}

/**
 * POST /api/bible-wallets/register
 * Register a guest wallet and create a Bible wallet association
 *
 * Body:
 *   - guestWallet: wallet address of guest
 *   - bibleAlias: desired alias (e.g., "exodus", "leviticus")
 */
async function registerBibleWallet(req, res) {
  try {
    const { guestWallet, bibleAlias } = req.body;

    if (!guestWallet || !bibleAlias) {
      return res.status(400).json({
        error: 'Missing required fields: guestWallet, bibleAlias',
        code: 'MISSING_FIELDS'
      });
    }

    const manager = initializeBibleWalletManager();
    const result = manager.registerBibleWallet(guestWallet, bibleAlias);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Bible wallet registration error:', error.message);

    if (error.message.includes('Invalid')) {
      return res.status(400).json({
        error: error.message,
        code: 'INVALID_INPUT'
      });
    }

    if (error.message.includes('already')) {
      return res.status(409).json({
        error: error.message,
        code: 'ALREADY_EXISTS'
      });
    }

    res.status(500).json({
      error: 'Failed to register Bible wallet',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * GET /api/bible-wallets/:guestWallet
 * Get Bible wallet info for a guest wallet
 */
async function getBibleWallet(req, res) {
  try {
    const { guestWallet } = req.params;

    if (!guestWallet || !guestWallet.match(/^0x[a-f0-9]{40}$/i)) {
      return res.status(400).json({
        error: 'Invalid wallet address',
        code: 'INVALID_WALLET'
      });
    }

    const manager = initializeBibleWalletManager();
    const wallet = manager.getBibleWallet(guestWallet);

    if (!wallet) {
      return res.status(404).json({
        error: 'Bible wallet not found for this guest wallet',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: wallet
    });

  } catch (error) {
    console.error('Get Bible wallet error:', error.message);
    res.status(500).json({
      error: 'Failed to retrieve Bible wallet',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * GET /api/bible-wallets/address/:bibleAddress
 * Get wallet info by Bible wallet address
 */
async function getByBibleAddress(req, res) {
  try {
    const { bibleAddress } = req.params;

    if (!bibleAddress || !bibleAddress.match(/^0x[a-f0-9]{40}$/i)) {
      return res.status(400).json({
        error: 'Invalid wallet address',
        code: 'INVALID_WALLET'
      });
    }

    const manager = initializeBibleWalletManager();
    const wallet = manager.getByBibleAddress(bibleAddress);

    if (!wallet) {
      return res.status(404).json({
        error: 'No guest wallet associated with this Bible address',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: wallet
    });

  } catch (error) {
    console.error('Get by Bible address error:', error.message);
    res.status(500).json({
      error: 'Failed to retrieve wallet info',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * POST /api/bible-wallets/:guestWallet/update-status
 * Update user status based on ceremony participation and trust burning
 * SECURITY: Requires signature verification from wallet owner
 *
 * Body:
 *   - trustBurned: amount of trust burned
 *   - tallyAccumulated: amount of tally accumulated
 *   - message: Message that was signed
 *   - signature: EIP-191 signature from guestWallet
 */
async function updateUserStatus(req, res) {
  try {
    const { guestWallet } = req.params;
    const { trustBurned, tallyAccumulated, message, signature } = req.body;

    if (!guestWallet || !guestWallet.match(/^0x[a-f0-9]{40}$/i)) {
      return res.status(400).json({
        error: 'Invalid wallet address',
        code: 'INVALID_WALLET'
      });
    }

    // SECURITY: Require signature verification for state changes
    if (!message || !signature) {
      return res.status(401).json({
        error: 'Signature verification required. Provide message and signature in request body.',
        code: 'MISSING_SIGNATURE'
      });
    }

    if (!verifySignature(message, signature, guestWallet)) {
      return res.status(401).json({
        error: 'Invalid signature - signature does not match wallet',
        code: 'INVALID_SIGNATURE'
      });
    }

    console.log(`[SECURITY] Status update requested for ${guestWallet.toLowerCase()}`);

    const manager = initializeBibleWalletManager();
    const result = manager.updateUserStatus(guestWallet, trustBurned, tallyAccumulated);

    res.json({
      success: true,
      data: result,
      authenticated: true
    });

  } catch (error) {
    console.error('Update status error:', error.message);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: error.message,
        code: 'NOT_FOUND'
      });
    }

    res.status(500).json({
      error: 'Failed to update user status',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * GET /api/bible-wallets/seats/all
 * Get all Bible seats and their current holders
 */
async function getBibleSeats(req, res) {
  try {
    const manager = initializeBibleWalletManager();
    const seats = manager.getBibleSeats();

    res.json({
      success: true,
      data: {
        total: seats.length,
        seats: seats
      }
    });

  } catch (error) {
    console.error('Get Bible seats error:', error.message);
    res.status(500).json({
      error: 'Failed to retrieve Bible seats',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * GET /api/bible-wallets/succession/ranking
 * Get ranking of users by burned trust (for succession planning)
 */
async function getSuccessionRanking(req, res) {
  try {
    const manager = initializeBibleWalletManager();
    const ranking = manager.rankByBurnedTrust();

    res.json({
      success: true,
      data: {
        total: ranking.length,
        ranking: ranking
      }
    });

  } catch (error) {
    console.error('Get succession ranking error:', error.message);
    res.status(500).json({
      error: 'Failed to retrieve succession ranking',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * POST /api/bible-wallets/:guestWallet/download-key
 * Get private key for user to download
 * SECURITY: Requires EIP-191 signature verification from wallet owner
 *
 * Body:
 *   - message: Message that was signed (e.g., "I request my private key")
 *   - signature: EIP-191 signature from guestWallet
 */
async function downloadPrivateKey(req, res) {
  try {
    const { guestWallet } = req.params;
    const { message, signature } = req.body;

    if (!guestWallet || !guestWallet.match(/^0x[a-f0-9]{40}$/i)) {
      return res.status(400).json({
        error: 'Invalid wallet address',
        code: 'INVALID_WALLET'
      });
    }

    // SECURITY: Require signature verification to prove wallet ownership
    if (!message || !signature) {
      return res.status(401).json({
        error: 'Signature verification required. Provide message and signature in request body.',
        code: 'MISSING_SIGNATURE'
      });
    }

    // Verify the signature matches the wallet
    if (!verifySignature(message, signature, guestWallet)) {
      return res.status(401).json({
        error: 'Invalid signature - signature does not match wallet',
        code: 'INVALID_SIGNATURE'
      });
    }

    // Log access attempt (important for security audit)
    console.log(`[SECURITY] Private key download requested for ${guestWallet.toLowerCase()}`);

    const manager = initializeBibleWalletManager();
    const privateKey = manager.getPrivateKey(guestWallet);

    // Return as downloadable file
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="bible-wallet-${guestWallet.substring(0, 10)}.key"`);

    const keyData = {
      guestWallet: guestWallet.toLowerCase(),
      privateKey: privateKey,
      warning: 'KEEP THIS SAFE - Anyone with this key can access your Bible wallet',
      created: new Date().toISOString(),
      authenticated: true
    };

    res.send(JSON.stringify(keyData, null, 2));

  } catch (error) {
    console.error('Download key error:', error.message);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: error.message,
        code: 'NOT_FOUND'
      });
    }

    res.status(500).json({
      error: 'Failed to retrieve private key',
      code: 'SERVER_ERROR'
    });
  }
}

module.exports = {
  registerBibleWallet,
  getBibleWallet,
  getByBibleAddress,
  updateUserStatus,
  getBibleSeats,
  getSuccessionRanking,
  downloadPrivateKey
};
