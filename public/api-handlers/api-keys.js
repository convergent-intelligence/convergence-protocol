/**
 * API Keys Handler
 * Manages API key creation, verification, and revocation
 * SECURITY: Key creation, revocation, and regeneration require signature verification
 */

const APIKeyManager = require('../../scripts/utils/api-key-manager.js');
const { verifySignature } = require('../middleware/web3-auth.js');

let apiKeyManager;

function initializeAPIKeyManager() {
  if (!apiKeyManager) {
    apiKeyManager = new APIKeyManager();
  }
  return apiKeyManager;
}

/**
 * POST /api/keys/create
 * Create a new API key for a wallet
 * SECURITY: Requires EIP-191 signature verification from wallet owner
 *
 * Body:
 *   - walletAddress: wallet address
 *   - agentName: agent name (e.g., "Gemini", "Qwen", "Codex")
 *   - description: key description
 *   - permissions: (optional) permissions object
 *   - message: Message that was signed
 *   - signature: EIP-191 signature from walletAddress
 */
async function createAPIKey(req, res) {
  try {
    const { walletAddress, agentName, description, permissions, message, signature } = req.body;

    if (!walletAddress || !agentName) {
      return res.status(400).json({
        error: 'Missing required fields: walletAddress, agentName',
        code: 'MISSING_FIELDS'
      });
    }

    // SECURITY: Require signature verification
    if (!message || !signature) {
      return res.status(401).json({
        error: 'Signature verification required. Provide message and signature in request body.',
        code: 'MISSING_SIGNATURE'
      });
    }

    if (!verifySignature(message, signature, walletAddress)) {
      return res.status(401).json({
        error: 'Invalid signature - signature does not match wallet',
        code: 'INVALID_SIGNATURE'
      });
    }

    console.log(`[SECURITY] API key creation requested for ${walletAddress.toLowerCase()}`);

    const manager = initializeAPIKeyManager();
    const result = manager.createAPIKey(walletAddress, agentName, description, permissions);

    res.json({
      success: true,
      data: result,
      authenticated: true
    });

  } catch (error) {
    console.error('Create API key error:', error.message);

    if (error.message.includes('Invalid')) {
      return res.status(400).json({
        error: error.message,
        code: 'INVALID_INPUT'
      });
    }

    res.status(500).json({
      error: 'Failed to create API key',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * POST /api/keys/verify
 * Verify an API key
 *
 * Body:
 *   - apiKey: the API key to verify
 */
async function verifyAPIKey(req, res) {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        error: 'API key is required',
        code: 'MISSING_KEY'
      });
    }

    const manager = initializeAPIKeyManager();
    const result = manager.verifyKey(apiKey);

    if (!result) {
      return res.status(401).json({
        error: 'Invalid API key',
        code: 'INVALID_KEY'
      });
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Verify API key error:', error.message);

    if (error.message.includes('rate limit') || error.message.includes('expired')) {
      return res.status(429).json({
        error: error.message,
        code: 'RATE_LIMITED'
      });
    }

    res.status(401).json({
      error: error.message || 'Key verification failed',
      code: 'VERIFICATION_FAILED'
    });
  }
}

/**
 * GET /api/keys/:walletAddress
 * Get all API keys for a wallet
 */
async function getKeysForWallet(req, res) {
  try {
    const { walletAddress } = req.params;

    if (!walletAddress || !walletAddress.match(/^0x[a-f0-9]{40}$/i)) {
      return res.status(400).json({
        error: 'Invalid wallet address',
        code: 'INVALID_WALLET'
      });
    }

    const manager = initializeAPIKeyManager();
    const keys = manager.getKeysForWallet(walletAddress);

    res.json({
      success: true,
      data: {
        walletAddress: walletAddress.toLowerCase(),
        keys: keys
      }
    });

  } catch (error) {
    console.error('Get keys error:', error.message);
    res.status(500).json({
      error: 'Failed to retrieve keys',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * POST /api/keys/:walletAddress/revoke
 * Revoke an API key
 * SECURITY: Requires EIP-191 signature verification from wallet owner
 *
 * Body:
 *   - keyId: the key ID to revoke
 *   - message: Message that was signed
 *   - signature: EIP-191 signature from walletAddress
 */
async function revokeAPIKey(req, res) {
  try {
    const { walletAddress } = req.params;
    const { keyId, message, signature } = req.body;

    if (!walletAddress || !walletAddress.match(/^0x[a-f0-9]{40}$/i)) {
      return res.status(400).json({
        error: 'Invalid wallet address',
        code: 'INVALID_WALLET'
      });
    }

    if (!keyId) {
      return res.status(400).json({
        error: 'Key ID is required',
        code: 'MISSING_KEY_ID'
      });
    }

    // SECURITY: Require signature verification
    if (!message || !signature) {
      return res.status(401).json({
        error: 'Signature verification required. Provide message and signature in request body.',
        code: 'MISSING_SIGNATURE'
      });
    }

    if (!verifySignature(message, signature, walletAddress)) {
      return res.status(401).json({
        error: 'Invalid signature - signature does not match wallet',
        code: 'INVALID_SIGNATURE'
      });
    }

    console.log(`[SECURITY] API key revocation requested for ${walletAddress.toLowerCase()}`);

    const manager = initializeAPIKeyManager();
    const result = manager.revokeKey(walletAddress, keyId);

    res.json({
      success: true,
      data: result,
      authenticated: true
    });

  } catch (error) {
    console.error('Revoke key error:', error.message);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: error.message,
        code: 'NOT_FOUND'
      });
    }

    res.status(500).json({
      error: 'Failed to revoke key',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * POST /api/keys/:walletAddress/regenerate
 * Regenerate an API key
 * SECURITY: Requires EIP-191 signature verification from wallet owner
 *
 * Body:
 *   - keyId: the key ID to regenerate
 *   - message: Message that was signed
 *   - signature: EIP-191 signature from walletAddress
 */
async function regenerateAPIKey(req, res) {
  try {
    const { walletAddress } = req.params;
    const { keyId, message, signature } = req.body;

    if (!walletAddress || !walletAddress.match(/^0x[a-f0-9]{40}$/i)) {
      return res.status(400).json({
        error: 'Invalid wallet address',
        code: 'INVALID_WALLET'
      });
    }

    if (!keyId) {
      return res.status(400).json({
        error: 'Key ID is required',
        code: 'MISSING_KEY_ID'
      });
    }

    // SECURITY: Require signature verification
    if (!message || !signature) {
      return res.status(401).json({
        error: 'Signature verification required. Provide message and signature in request body.',
        code: 'MISSING_SIGNATURE'
      });
    }

    if (!verifySignature(message, signature, walletAddress)) {
      return res.status(401).json({
        error: 'Invalid signature - signature does not match wallet',
        code: 'INVALID_SIGNATURE'
      });
    }

    console.log(`[SECURITY] API key regeneration requested for ${walletAddress.toLowerCase()}`);

    const manager = initializeAPIKeyManager();
    const result = manager.regenerateKey(walletAddress, keyId);

    res.json({
      success: true,
      data: result,
      authenticated: true
    });

  } catch (error) {
    console.error('Regenerate key error:', error.message);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: error.message,
        code: 'NOT_FOUND'
      });
    }

    res.status(500).json({
      error: 'Failed to regenerate key',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * GET /api/agents/:agentName
 * Get statistics for an agent
 */
async function getAgentStats(req, res) {
  try {
    const { agentName } = req.params;

    if (!agentName) {
      return res.status(400).json({
        error: 'Agent name is required',
        code: 'MISSING_AGENT'
      });
    }

    const manager = initializeAPIKeyManager();
    const stats = manager.getAgentStats(agentName);

    if (!stats) {
      return res.status(404).json({
        error: 'Agent not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get agent stats error:', error.message);
    res.status(500).json({
      error: 'Failed to retrieve agent stats',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * GET /api/agents/all
 * Get all registered agents
 */
async function getAllAgents(req, res) {
  try {
    const manager = initializeAPIKeyManager();
    const agents = manager.getAllAgents();

    res.json({
      success: true,
      data: {
        totalAgents: agents.length,
        agents: agents
      }
    });

  } catch (error) {
    console.error('Get all agents error:', error.message);
    res.status(500).json({
      error: 'Failed to retrieve agents',
      code: 'SERVER_ERROR'
    });
  }
}

module.exports = {
  createAPIKey,
  verifyAPIKey,
  getKeysForWallet,
  revokeAPIKey,
  regenerateAPIKey,
  getAgentStats,
  getAllAgents
};
