/**
 * Web3 Authentication Middleware
 * Verifies EIP-191 signatures to prove wallet ownership
 * CRITICAL: All sensitive endpoints must use this middleware
 */

const { ethers } = require('ethers');

/**
 * Verify EIP-191 signature
 * @param {string} message - Original message that was signed
 * @param {string} signature - EIP-191 signature
 * @param {string} walletAddress - Expected signer address
 * @returns {boolean} - true if signature is valid
 */
function verifySignature(message, signature, walletAddress) {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
  } catch (error) {
    console.error('Signature verification error:', error.message);
    return false;
  }
}

/**
 * Middleware to require signature verification
 * Expects: walletAddress (path param), message (body), signature (body)
 */
function requireSignatureAuth(req, res, next) {
  try {
    const { walletAddress } = req.params;
    const { message, signature } = req.body;

    if (!walletAddress || !message || !signature) {
      return res.status(401).json({
        error: 'Missing required fields: walletAddress (URL param), message, signature (body)',
        code: 'MISSING_AUTH_FIELDS'
      });
    }

    if (!walletAddress.match(/^0x[a-f0-9]{40}$/i)) {
      return res.status(400).json({
        error: 'Invalid wallet address format',
        code: 'INVALID_WALLET'
      });
    }

    // Verify signature
    if (!verifySignature(message, signature, walletAddress)) {
      return res.status(401).json({
        error: 'Invalid signature - signature does not match wallet',
        code: 'INVALID_SIGNATURE'
      });
    }

    // Store verified wallet on request for later use
    req.verifiedWallet = walletAddress.toLowerCase();
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(500).json({
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
}

/**
 * Middleware to verify same wallet or authorized roles
 * Used after signature verification
 */
function requireWalletMatch(req, res, next) {
  const { walletAddress } = req.params;

  if (walletAddress.toLowerCase() !== req.verifiedWallet) {
    return res.status(403).json({
      error: 'Forbidden - signature does not match requested wallet',
      code: 'WALLET_MISMATCH'
    });
  }

  next();
}

/**
 * Check if wallet is Genesis Human (from config)
 * Updated to Deviation 2 address as of 2025-11-23
 */
function isGenesisHuman(walletAddress) {
  return walletAddress.toLowerCase() === '0x79Ed185e745084fBEf8A1FE837554dB372a74218'.toLowerCase();
  // Previous Deviation 1: '0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB'
}

/**
 * Check if wallet is Agent
 */
function isAgent(walletAddress) {
  return walletAddress.toLowerCase() === '0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22'.toLowerCase();
}

/**
 * Check if wallet is approved admin
 */
function isAdmin(walletAddress) {
  return isGenesisHuman(walletAddress) || isAgent(walletAddress);
}

/**
 * Require admin role
 */
function requireAdmin(req, res, next) {
  if (!isAdmin(req.verifiedWallet)) {
    return res.status(403).json({
      error: 'Forbidden - admin privileges required',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }
  next();
}

module.exports = {
  verifySignature,
  requireSignatureAuth,
  requireWalletMatch,
  isGenesisHuman,
  isAgent,
  isAdmin,
  requireAdmin
};
