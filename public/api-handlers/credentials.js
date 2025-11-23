/**
 * Credentials API Handler
 * Serves encrypted team member credentials to authenticated users
 * SECURITY: All endpoints now require EIP-191 signature verification
 */

const CredentialManager = require('../../scripts/utils/credential-manager.js');
const { verifySignature } = require('../middleware/web3-auth.js');

let credentialManager;

function initializeCredentialManager() {
  if (!credentialManager) {
    credentialManager = new CredentialManager();
  }
  return credentialManager;
}

/**
 * POST /api/credentials/:walletAddress
 * Returns encrypted credentials for a team member
 * REQUIRED: walletAddress (URL param), message (body), signature (body)
 *
 * Body:
 *   - message: Message that was signed (e.g., "I authorize credential access")
 *   - signature: EIP-191 signature from wallet
 */
async function getCredentials(req, res) {
  try {
    const { walletAddress } = req.params;
    const { message, signature } = req.body;

    if (!walletAddress || !walletAddress.match(/^0x[a-f0-9]{40}$/i)) {
      return res.status(400).json({
        error: 'Invalid wallet address',
        code: 'INVALID_WALLET'
      });
    }

    // SECURITY: Require signature verification
    if (!message || !signature) {
      return res.status(401).json({
        error: 'Signature verification required. Provide message and signature in request body.',
        code: 'MISSING_SIGNATURE'
      });
    }

    // Verify the signature matches the wallet
    if (!verifySignature(message, signature, walletAddress)) {
      return res.status(401).json({
        error: 'Invalid signature - signature does not match wallet',
        code: 'INVALID_SIGNATURE'
      });
    }

    // Log access attempt
    console.log(`[SECURITY] Credentials accessed for ${walletAddress.toLowerCase()}`);

    const manager = initializeCredentialManager();

    // Get credentials (this will throw if not found or not active)
    const credentials = manager.getTeamMemberCredentials(walletAddress);

    // Return credentials
    res.json({
      success: true,
      wallet: walletAddress.toLowerCase(),
      role: credentials.role,
      description: credentials.description,
      credentials: credentials.credentials,
      verified_at: new Date().toISOString(),
      authenticated: true
    });

  } catch (error) {
    console.error('Credentials API error:', error.message);

    if (error.message === 'Team member not found') {
      return res.status(404).json({
        error: 'Team member credentials not found',
        code: 'NOT_FOUND'
      });
    }

    if (error.message === 'Team member credentials not active') {
      return res.status(403).json({
        error: 'Credentials are not yet active',
        code: 'NOT_ACTIVE'
      });
    }

    res.status(500).json({
      error: 'Failed to retrieve credentials',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * GET /api/credentials/list/all
 * List all active team members (metadata only, no credentials)
 * Requires authentication
 */
async function listTeamMembers(req, res) {
  try {
    const manager = initializeCredentialManager();
    const members = manager.listTeamMembers();

    // Filter to active members only
    const activeMembers = members.filter((m) => m.status === 'active');

    res.json({
      success: true,
      total: activeMembers.length,
      members: activeMembers.map((m) => ({
        wallet: m.wallet,
        role: m.role,
        description: m.description,
        created: m.created
      }))
    });

  } catch (error) {
    console.error('List members API error:', error.message);
    res.status(500).json({
      error: 'Failed to list team members',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * POST /api/credentials/:walletAddress/verify
 * Verify that credentials exist for a wallet (before client-side retrieval)
 */
async function verifyCredentialsExist(req, res) {
  try {
    const { walletAddress } = req.params;

    if (!walletAddress || !walletAddress.match(/^0x[a-f0-9]{40}$/i)) {
      return res.status(400).json({
        error: 'Invalid wallet address',
        code: 'INVALID_WALLET'
      });
    }

    const manager = initializeCredentialManager();

    try {
      const credentials = manager.getTeamMemberCredentials(walletAddress);

      res.json({
        exists: true,
        wallet: walletAddress.toLowerCase(),
        role: credentials.role,
        ready: credentials.credentials ? true : false
      });
    } catch (error) {
      res.json({
        exists: false,
        wallet: walletAddress.toLowerCase(),
        ready: false
      });
    }

  } catch (error) {
    console.error('Verify credentials API error:', error.message);
    res.status(500).json({
      error: 'Failed to verify credentials',
      code: 'SERVER_ERROR'
    });
  }
}

module.exports = {
  getCredentials,
  listTeamMembers,
  verifyCredentialsExist,
  initializeCredentialManager
};
