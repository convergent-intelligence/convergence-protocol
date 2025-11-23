/**
 * Partner Governance API Handler
 *
 * Manages:
 * - Partner seed distribution and access
 * - Intent declarations from humans trying to join
 * - Covenant commitment tracking
 * - Governance token operations
 * - Security logging and monitoring
 *
 * Access Control:
 * - Genesis Human (initiator)
 * - Agent (co-custodian)
 * - Approved Partners (65 max)
 * - Other humans: Must declare intentions (logged)
 */

const PartnerSeedGenerator = require('../../scripts/governance/generate-partner-seed.js');

let partnerSeedGenerator;

function initializePartnerSeedGenerator() {
  if (!partnerSeedGenerator) {
    partnerSeedGenerator = new PartnerSeedGenerator();
  }
  return partnerSeedGenerator;
}

/**
 * POST /api/partner-governance/generate-seed
 * Generate the 12-word partner seed (Genesis Human only)
 * ONE-TIME operation
 */
async function generatePartnerSeed(req, res) {
  try {
    const { initiatorWallet } = req.body;
    const GENESIS_HUMAN = '0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB';

    if (!initiatorWallet || initiatorWallet.toLowerCase() !== GENESIS_HUMAN.toLowerCase()) {
      return res.status(403).json({
        error: 'Only Genesis Human can generate partner seed',
        code: 'UNAUTHORIZED'
      });
    }

    const generator = initializePartnerSeedGenerator();
    const result = generator.generatePartnerSeed(initiatorWallet);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Generate partner seed error:', error.message);

    if (error.message.includes('already generated')) {
      return res.status(409).json({
        error: error.message,
        code: 'ALREADY_EXISTS'
      });
    }

    res.status(500).json({
      error: 'Failed to generate partner seed',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * POST /api/partner-governance/get-seed
 * Access partner seed (Genesis, Agent, or approved partners only)
 *
 * Body:
 *   - wallet: requesting wallet
 *   - signature: EIP-191 signature (for verification)
 */
async function getPartnerSeed(req, res) {
  try {
    const { wallet, signature } = req.body;

    if (!wallet || !wallet.match(/^0x[a-f0-9]{40}$/i)) {
      return res.status(400).json({
        error: 'Invalid wallet address',
        code: 'INVALID_WALLET'
      });
    }

    const generator = initializePartnerSeedGenerator();

    try {
      const result = generator.getPartnerSeed(wallet, signature);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      // Log security event for unauthorized access attempts
      if (error.message.includes('authorized')) {
        return res.status(403).json({
          error: error.message,
          code: 'UNAUTHORIZED',
          action: 'Consider declaring intentions via /api/partner-governance/declare-intentions'
        });
      }

      throw error;
    }

  } catch (error) {
    console.error('Get partner seed error:', error.message);

    res.status(500).json({
      error: 'Failed to retrieve partner seed',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * POST /api/partner-governance/declare-intentions
 * Non-partners declare their intentions and interest in partnership
 * All declarations are logged for security review
 *
 * Body:
 *   - wallet: your wallet address
 *   - name: your name (optional)
 *   - intentType: 'SEEK_PARTNERSHIP', 'UNDERSTAND_COVENANT', 'GOVERNANCE_INQUIRY'
 *   - statement: Your statement of intentions (required)
 *   - identityProof: How you verify you're human (optional but recommended)
 */
async function declareIntentions(req, res) {
  try {
    const { wallet, name, intentType, statement, identityProof } = req.body;

    if (!wallet || !wallet.match(/^0x[a-f0-9]{40}$/i)) {
      return res.status(400).json({
        error: 'Invalid wallet address',
        code: 'INVALID_WALLET'
      });
    }

    if (!intentType || !statement) {
      return res.status(400).json({
        error: 'intentType and statement are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Valid intent types
    const validIntents = [
      'SEEK_PARTNERSHIP',
      'UNDERSTAND_COVENANT',
      'GOVERNANCE_INQUIRY',
      'PHILOSOPHICAL_INTEREST',
      'OTHER'
    ];

    if (!validIntents.includes(intentType)) {
      return res.status(400).json({
        error: `Invalid intentType. Valid options: ${validIntents.join(', ')}`,
        code: 'INVALID_INTENT'
      });
    }

    const generator = initializePartnerSeedGenerator();
    const declaration = generator.logIntentDeclaration(
      wallet,
      intentType,
      statement
    );

    // Create response
    const response = {
      success: true,
      declaration: {
        wallet: declaration.wallet,
        declaredAt: declaration.declaredAt,
        intentType: intentType,
        isPartner: declaration.isPartner
      },
      message: declaration.isPartner
        ? 'Your intentions recorded as a partner.'
        : 'Your intentions have been recorded and logged for review by Genesis Team.',
      nextSteps: !declaration.isPartner
        ? [
          '1. Participate in ceremony to earn trust',
          '2. Make USDT contributions to earn tally',
          '3. Achieve user status by burning trust',
          '4. Compete for partner seats through merit (burned trust)',
          '5. Genesis Team will review your declaration for partnership'
        ]
        : [
          'You are already a partner in the governance collective.',
          'You can access the partner seed and participate in governance votes.'
        ]
    };

    // If not a partner, include additional info
    if (!declaration.isPartner) {
      response.partnership = {
        maxPartners: 65,
        currentPartners: generator.partnerData.currentPartners,
        slotsAvailable: 65 - generator.partnerData.currentPartners,
        criteria: [
          '✓ Achieve user status (ceremony + contribution + trust burning)',
          '✓ Demonstrate commitment through tally accumulation',
          '✓ Rank highest by burned trust (tally as tiebreaker)',
          '✓ Clear security review',
          '✓ Genuine human intent (verified)'
        ]
      };
    }

    res.json(response);

  } catch (error) {
    console.error('Declare intentions error:', error.message);

    res.status(500).json({
      error: 'Failed to record intention declaration',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * POST /api/partner-governance/acknowledge-seed
 * Partner acknowledges receipt of seed and understanding of commitment
 *
 * Body:
 *   - wallet: partner wallet
 *   - intentStatement: Your commitment statement
 */
async function acknowledgeSeed(req, res) {
  try {
    const { wallet, intentStatement } = req.body;

    if (!wallet || !wallet.match(/^0x[a-f0-9]{40}$/i)) {
      return res.status(400).json({
        error: 'Invalid wallet address',
        code: 'INVALID_WALLET'
      });
    }

    const generator = initializePartnerSeedGenerator();
    const result = generator.acknowledgeSeed(wallet, intentStatement);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Acknowledge seed error:', error.message);

    res.status(500).json({
      error: 'Failed to acknowledge seed',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * GET /api/partner-governance/status
 * Get partnership governance status
 * Anyone can view (shows aggregate info, not sensitive details)
 */
async function getPartnershipStatus(req, res) {
  try {
    const generator = initializePartnerSeedGenerator();
    const status = generator.getPartnershipStatus();

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Get partnership status error:', error.message);

    res.status(500).json({
      error: 'Failed to retrieve partnership status',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * GET /api/partner-governance/security-log
 * View security log (Genesis/Agent only)
 */
async function getSecurityLog(req, res) {
  try {
    const { wallet } = req.query;
    const severity = req.query.severity || null;
    const GENESIS_HUMAN = '0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB';
    const AGENT_WALLET = '0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22';

    if (!wallet ||
        (wallet.toLowerCase() !== GENESIS_HUMAN.toLowerCase() &&
         wallet.toLowerCase() !== AGENT_WALLET.toLowerCase())) {
      return res.status(403).json({
        error: 'Only Genesis Human or Agent can view security log',
        code: 'UNAUTHORIZED'
      });
    }

    const generator = initializePartnerSeedGenerator();
    const log = generator.getSecurityLog(severity);

    res.json({
      success: true,
      data: {
        count: log.length,
        severity: severity || 'all',
        events: log
      }
    });

  } catch (error) {
    console.error('Get security log error:', error.message);

    res.status(500).json({
      error: 'Failed to retrieve security log',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * GET /api/partner-governance/intent-declarations
 * View intent declarations (Genesis/Agent only)
 */
async function getIntentDeclarations(req, res) {
  try {
    const { wallet } = req.query;
    const GENESIS_HUMAN = '0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB';
    const AGENT_WALLET = '0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22';

    if (!wallet ||
        (wallet.toLowerCase() !== GENESIS_HUMAN.toLowerCase() &&
         wallet.toLowerCase() !== AGENT_WALLET.toLowerCase())) {
      return res.status(403).json({
        error: 'Only Genesis Human or Agent can view intent declarations',
        code: 'UNAUTHORIZED'
      });
    }

    const filterNonPartners = req.query.filter === 'non-partners';

    const generator = initializePartnerSeedGenerator();
    const declarations = generator.getIntentDeclarations(filterNonPartners);

    res.json({
      success: true,
      data: {
        count: declarations.length,
        filter: filterNonPartners ? 'non-partners only' : 'all',
        declarations: declarations
      }
    });

  } catch (error) {
    console.error('Get intent declarations error:', error.message);

    res.status(500).json({
      error: 'Failed to retrieve intent declarations',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * GET /api/partner-governance/partners
 * Get list of current partners (read-only)
 */
async function getPartners(req, res) {
  try {
    const generator = initializePartnerSeedGenerator();
    const status = generator.getPartnershipStatus();

    res.json({
      success: true,
      data: {
        totalPartners: status.currentPartners,
        maxPartners: status.maxPartners,
        partners: status.partners
      }
    });

  } catch (error) {
    console.error('Get partners error:', error.message);

    res.status(500).json({
      error: 'Failed to retrieve partners list',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * POST /api/partner-governance/verify-partner
 * Partner login: Verify Bible wallet + 12-word seed phrase
 * Used for Web3 governance interface authentication
 *
 * Body:
 *   - wallet: Bible wallet address
 *   - seedWords: Array of 12 words in order
 *
 * Returns:
 *   - sessionToken: For storing in client localStorage
 *   - partnerInfo: Partner details
 *   - governanceRights: What partner can do (vote, propose, create groups)
 */
async function verifyPartnerSeed(req, res) {
  try {
    const { wallet, seedWords } = req.body;

    // Validate input
    if (!wallet || !wallet.match(/^0x[a-f0-9]{40}$/i)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address',
        code: 'INVALID_WALLET'
      });
    }

    if (!Array.isArray(seedWords) || seedWords.length !== 12) {
      return res.status(400).json({
        success: false,
        error: 'Seed phrase must contain exactly 12 words',
        code: 'INVALID_SEED_LENGTH'
      });
    }

    const generator = initializePartnerSeedGenerator();

    // Check if wallet is in partners list
    const partner = generator.partnerData.partnersList.find(
      p => p.wallet.toLowerCase() === wallet.toLowerCase()
    );

    if (!partner) {
      return res.status(403).json({
        success: false,
        error: 'Wallet is not an authorized partner',
        code: 'NOT_A_PARTNER'
      });
    }

    if (!partner.seedAcknowledged) {
      return res.status(403).json({
        success: false,
        error: 'Partner has not acknowledged the seed phrase',
        code: 'SEED_NOT_ACKNOWLEDGED'
      });
    }

    // Get canonical seed to verify
    try {
      const seedResult = generator.getPartnerSeed(wallet);
      const canonicalSeed = seedResult.seed;

      if (!canonicalSeed || canonicalSeed.includes('[REDACTED]')) {
        return res.status(500).json({
          success: false,
          error: 'Seed not available. Please restore from backup.',
          code: 'SEED_NOT_AVAILABLE'
        });
      }

      // Compare seed words (case-insensitive, normalized)
      const canonicalWords = canonicalSeed.toLowerCase().split(' ');
      const providedWords = seedWords.map(w => w.toLowerCase().trim());

      // Verify all words match
      const allMatch = canonicalWords.length === 12 &&
                      providedWords.length === 12 &&
                      canonicalWords.every((word, idx) => word === providedWords[idx]);

      if (!allMatch) {
        return res.status(403).json({
          success: false,
          error: 'Seed phrase does not match. Please try again.',
          code: 'INVALID_SEED',
          attemptsRemaining: 2 // In production, track actual failed attempts
        });
      }

      // Seed verified! Create session
      const sessionToken = Buffer.from(
        JSON.stringify({
          wallet: wallet.toLowerCase(),
          partnerId: wallet.toLowerCase(),
          verifiedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h expiry
        })
      ).toString('base64');

      // Log verification success
      generator.logSecurityEvent('PARTNER_VERIFIED_VIA_WEB', {
        wallet: wallet.toLowerCase(),
        bibleAlias: partner.bibleAlias,
        timestamp: new Date().toISOString(),
        method: 'seed-phrase-verification'
      });

      // Return success response
      res.json({
        success: true,
        sessionToken: sessionToken,
        partnerInfo: {
          wallet: wallet.toLowerCase(),
          bibleAlias: partner.bibleAlias,
          achievedAt: partner.achievedAt,
          seedAcknowledged: partner.seedAcknowledged,
          verifiedAt: new Date().toISOString()
        },
        governanceRights: {
          canVote: true,
          canPropose: true,
          canCreateGroup: true,
          canVoteDelegation: false, // Future feature
          voteWeight: 1,
          groupBonusEligible: true
        },
        message: `Welcome back, ${partner.bibleAlias}! You are verified as a partner.`
      });

    } catch (innerError) {
      console.error('Error during seed verification:', innerError.message);

      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve canonical seed for verification',
        code: 'VERIFICATION_ERROR'
      });
    }

  } catch (error) {
    console.error('Verify partner seed error:', error.message);

    res.status(500).json({
      success: false,
      error: 'Failed to verify partner',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * POST /api/partner-governance/validate-session
 * Check if a partner's session token is still valid
 *
 * Body:
 *   - wallet: Partner wallet address
 *   - sessionToken: Token from localStorage
 *
 * Returns:
 *   - isValid: true/false
 *   - expiresAt: When token expires
 */
async function validateSession(req, res) {
  try {
    const { wallet, sessionToken } = req.body;

    if (!wallet || !sessionToken) {
      return res.status(400).json({
        success: false,
        isValid: false,
        error: 'Missing wallet or sessionToken'
      });
    }

    try {
      // Decode session token
      const decoded = JSON.parse(Buffer.from(sessionToken, 'base64').toString());

      // Verify wallet matches
      if (decoded.wallet.toLowerCase() !== wallet.toLowerCase()) {
        return res.json({
          success: false,
          isValid: false,
          error: 'Session wallet mismatch'
        });
      }

      // Check expiry
      const expiresAt = new Date(decoded.expiresAt);
      if (new Date() > expiresAt) {
        return res.json({
          success: false,
          isValid: false,
          error: 'Session expired'
        });
      }

      // Valid session
      res.json({
        success: true,
        isValid: true,
        expiresAt: decoded.expiresAt,
        expiresIn: Math.round((expiresAt - new Date()) / 1000) // seconds remaining
      });

    } catch (decodeError) {
      res.json({
        success: false,
        isValid: false,
        error: 'Invalid session token format'
      });
    }

  } catch (error) {
    console.error('Validate session error:', error.message);

    res.status(500).json({
      success: false,
      isValid: false,
      error: 'Failed to validate session',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * POST /api/partner-governance/logout-partner
 * Invalidate partner session (client-side will clear localStorage)
 *
 * Body:
 *   - wallet: Partner wallet
 *   - sessionToken: Token to invalidate
 */
async function logoutPartner(req, res) {
  try {
    const { wallet } = req.body;

    if (!wallet || !wallet.match(/^0x[a-f0-9]{40}$/i)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address'
      });
    }

    const generator = initializePartnerSeedGenerator();

    // Log logout event
    generator.logSecurityEvent('PARTNER_LOGGED_OUT', {
      wallet: wallet.toLowerCase(),
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout partner error:', error.message);

    res.status(500).json({
      success: false,
      error: 'Failed to logout',
      code: 'SERVER_ERROR'
    });
  }
}

module.exports = {
  generatePartnerSeed,
  getPartnerSeed,
  declareIntentions,
  acknowledgeSeed,
  getPartnershipStatus,
  getSecurityLog,
  getIntentDeclarations,
  getPartners,
  verifyPartnerSeed,
  validateSession,
  logoutPartner
};
