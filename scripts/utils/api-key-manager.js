/**
 * API Key Manager
 * Manages API keys for agents and wallets
 *
 * Features:
 * - Generate secure API keys for wallet addresses
 * - Track API key usage and rate limits
 * - Support multiple keys per wallet
 * - Revoke or regenerate keys
 * - Monitor agent participation and permissions
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const API_KEYS_FILE = path.join(__dirname, '../../data/api-keys.json');

class APIKeyManager {
  constructor() {
    this.ensureDataDir();
    this.keys = this.loadKeys();
  }

  /**
   * Ensure data directory exists
   */
  ensureDataDir() {
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  /**
   * Load API keys from file
   */
  loadKeys() {
    try {
      if (!fs.existsSync(API_KEYS_FILE)) {
        return this.createDefaultStructure();
      }
      return JSON.parse(fs.readFileSync(API_KEYS_FILE, 'utf8'));
    } catch (error) {
      console.error('Error loading API keys:', error);
      return this.createDefaultStructure();
    }
  }

  /**
   * Create default structure
   */
  createDefaultStructure() {
    return {
      keys: {},
      wallets: {},
      agents: {},
      rateLimit: {
        defaultRequestsPerMinute: 60,
        defaultRequestsPerDay: 10000
      }
    };
  }

  /**
   * Save keys to file
   */
  saveKeys() {
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(API_KEYS_FILE, JSON.stringify(this.keys, null, 2));
  }

  /**
   * Generate a secure API key
   */
  generateSecureKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash API key (for storage)
   */
  hashKey(key) {
    return crypto
      .createHash('sha256')
      .update(key)
      .digest('hex');
  }

  /**
   * Create API key for a wallet
   *
   * @param {string} walletAddress - The wallet address
   * @param {string} agentName - Agent name (e.g., "Gemini", "Qwen", "Codex")
   * @param {string} description - Key description/purpose
   * @param {object} permissions - Permissions object
   * @returns {object} - API key info
   */
  createAPIKey(walletAddress, agentName, description, permissions = {}) {
    walletAddress = walletAddress.toLowerCase();

    if (!walletAddress || !walletAddress.match(/^0x[a-f0-9]{40}$/i)) {
      throw new Error('Invalid wallet address');
    }

    if (!agentName || agentName.length === 0) {
      throw new Error('Agent name is required');
    }

    // Generate new API key
    const rawKey = this.generateSecureKey();
    const hashedKey = this.hashKey(rawKey);

    // Default permissions
    const defaultPermissions = {
      ceremony: true, // Can participate in ceremony
      donations: true, // Can make donations
      burn_trust: true, // Can burn trust
      withdraw: false, // Cannot withdraw (governance-only)
      mint: false, // Cannot mint tokens
      ...permissions
    };

    // Store key record
    const keyId = `key_${crypto.randomBytes(8).toString('hex')}`;

    this.keys.keys[hashedKey] = {
      keyId,
      walletAddress,
      agentName,
      description: description || `API key for ${agentName}`,
      permissions: defaultPermissions,
      createdAt: new Date().toISOString(),
      expiresAt: null, // No expiration by default
      lastUsed: null,
      usageCount: 0,
      status: 'active',
      rateLimit: {
        requestsPerMinute: this.keys.rateLimit.defaultRequestsPerMinute,
        requestsPerDay: this.keys.rateLimit.defaultRequestsPerDay,
        currentMinuteRequests: 0,
        currentDayRequests: 0,
        lastMinuteReset: Date.now(),
        lastDayReset: Date.now()
      }
    };

    // Update wallet record
    if (!this.keys.wallets[walletAddress]) {
      this.keys.wallets[walletAddress] = {
        address: walletAddress,
        keys: [],
        agents: [],
        createdAt: new Date().toISOString()
      };
    }

    this.keys.wallets[walletAddress].keys.push(hashedKey);

    // Update agent record
    if (!this.keys.agents[agentName.toLowerCase()]) {
      this.keys.agents[agentName.toLowerCase()] = {
        name: agentName,
        wallets: [],
        createdAt: new Date().toISOString()
      };
    }

    if (!this.keys.agents[agentName.toLowerCase()].wallets.includes(walletAddress)) {
      this.keys.agents[agentName.toLowerCase()].wallets.push(walletAddress);
    }

    this.saveKeys();

    // Return the RAW key (only shown once at creation)
    return {
      keyId,
      apiKey: rawKey, // Only shown once!
      walletAddress,
      agentName,
      permissions: defaultPermissions,
      createdAt: new Date().toISOString(),
      message: 'Save this API key securely. It will not be shown again.'
    };
  }

  /**
   * Verify API key
   */
  verifyKey(rawKey) {
    const hashedKey = this.hashKey(rawKey);

    const keyRecord = this.keys.keys[hashedKey];
    if (!keyRecord) {
      return null;
    }

    if (keyRecord.status !== 'active') {
      throw new Error('API key is not active');
    }

    if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
      throw new Error('API key has expired');
    }

    // Update usage
    keyRecord.lastUsed = new Date().toISOString();
    keyRecord.usageCount++;

    // Check rate limit
    const now = Date.now();
    const rateLimit = keyRecord.rateLimit;

    // Reset minute counter if needed
    if (now - rateLimit.lastMinuteReset > 60000) {
      rateLimit.currentMinuteRequests = 0;
      rateLimit.lastMinuteReset = now;
    }

    // Reset day counter if needed
    if (now - rateLimit.lastDayReset > 86400000) {
      rateLimit.currentDayRequests = 0;
      rateLimit.lastDayReset = now;
    }

    // Check limits
    if (rateLimit.currentMinuteRequests >= rateLimit.requestsPerMinute) {
      throw new Error('Rate limit exceeded (per minute)');
    }

    if (rateLimit.currentDayRequests >= rateLimit.requestsPerDay) {
      throw new Error('Rate limit exceeded (per day)');
    }

    // Increment counters
    rateLimit.currentMinuteRequests++;
    rateLimit.currentDayRequests++;

    this.saveKeys();

    return {
      keyId: keyRecord.keyId,
      walletAddress: keyRecord.walletAddress,
      agentName: keyRecord.agentName,
      permissions: keyRecord.permissions,
      status: keyRecord.status
    };
  }

  /**
   * Revoke API key
   */
  revokeKey(walletAddress, keyId) {
    walletAddress = walletAddress.toLowerCase();

    const keyRecord = Object.values(this.keys.keys).find(
      k => k.keyId === keyId && k.walletAddress === walletAddress
    );

    if (!keyRecord) {
      throw new Error('API key not found');
    }

    // Find hashed key
    const hashedKey = Object.keys(this.keys.keys).find(
      hk => this.keys.keys[hk].keyId === keyId
    );

    this.keys.keys[hashedKey].status = 'revoked';
    this.keys.keys[hashedKey].revokedAt = new Date().toISOString();

    this.saveKeys();

    return { message: `API key ${keyId} has been revoked` };
  }

  /**
   * Regenerate API key (revoke old, create new)
   */
  regenerateKey(walletAddress, keyId) {
    walletAddress = walletAddress.toLowerCase();

    const oldKeyRecord = Object.values(this.keys.keys).find(
      k => k.keyId === keyId && k.walletAddress === walletAddress
    );

    if (!oldKeyRecord) {
      throw new Error('API key not found');
    }

    // Revoke old key
    this.revokeKey(walletAddress, keyId);

    // Create new key with same permissions
    return this.createAPIKey(
      walletAddress,
      oldKeyRecord.agentName,
      oldKeyRecord.description,
      oldKeyRecord.permissions
    );
  }

  /**
   * Get keys for a wallet
   */
  getKeysForWallet(walletAddress) {
    walletAddress = walletAddress.toLowerCase();

    const wallet = this.keys.wallets[walletAddress];
    if (!wallet) {
      return [];
    }

    return wallet.keys
      .map(hashedKey => {
        const keyRecord = this.keys.keys[hashedKey];
        // Never return the actual key or hash
        return {
          keyId: keyRecord.keyId,
          agentName: keyRecord.agentName,
          description: keyRecord.description,
          status: keyRecord.status,
          createdAt: keyRecord.createdAt,
          expiresAt: keyRecord.expiresAt,
          lastUsed: keyRecord.lastUsed,
          usageCount: keyRecord.usageCount,
          permissions: keyRecord.permissions
        };
      })
      .filter(k => k.status === 'active');
  }

  /**
   * Get agents registered with wallet
   */
  getAgentsForWallet(walletAddress) {
    walletAddress = walletAddress.toLowerCase();

    const wallet = this.keys.wallets[walletAddress];
    if (!wallet) {
      return [];
    }

    const agents = new Set();
    wallet.keys.forEach(hashedKey => {
      const keyRecord = this.keys.keys[hashedKey];
      if (keyRecord.status === 'active') {
        agents.add(keyRecord.agentName);
      }
    });

    return Array.from(agents);
  }

  /**
   * Get all registered agents
   */
  getAllAgents() {
    return Object.values(this.keys.agents).map(agent => ({
      name: agent.name,
      walletCount: agent.wallets.length,
      wallets: agent.wallets,
      createdAt: agent.createdAt
    }));
  }

  /**
   * Get agent statistics
   */
  getAgentStats(agentName) {
    const agent = this.keys.agents[agentName.toLowerCase()];
    if (!agent) {
      return null;
    }

    let totalRequests = 0;
    let totalKeys = 0;

    agent.wallets.forEach(wallet => {
      this.keys.wallets[wallet].keys.forEach(hashedKey => {
        const keyRecord = this.keys.keys[hashedKey];
        if (keyRecord.agentName.toLowerCase() === agentName.toLowerCase()) {
          totalKeys++;
          totalRequests += keyRecord.usageCount;
        }
      });
    });

    return {
      name: agentName,
      activeWallets: agent.wallets.length,
      totalKeys,
      totalRequests,
      createdAt: agent.createdAt
    };
  }

  /**
   * Set rate limit for a key
   */
  setRateLimit(walletAddress, keyId, requestsPerMinute, requestsPerDay) {
    walletAddress = walletAddress.toLowerCase();

    const keyRecord = Object.values(this.keys.keys).find(
      k => k.keyId === keyId && k.walletAddress === walletAddress
    );

    if (!keyRecord) {
      throw new Error('API key not found');
    }

    keyRecord.rateLimit.requestsPerMinute = requestsPerMinute;
    keyRecord.rateLimit.requestsPerDay = requestsPerDay;

    this.saveKeys();

    return { message: 'Rate limit updated' };
  }

  /**
   * Update permissions for a key
   */
  updatePermissions(walletAddress, keyId, permissions) {
    walletAddress = walletAddress.toLowerCase();

    const keyRecord = Object.values(this.keys.keys).find(
      k => k.keyId === keyId && k.walletAddress === walletAddress
    );

    if (!keyRecord) {
      throw new Error('API key not found');
    }

    keyRecord.permissions = {
      ...keyRecord.permissions,
      ...permissions
    };

    this.saveKeys();

    return {
      message: 'Permissions updated',
      permissions: keyRecord.permissions
    };
  }
}

module.exports = { ApiKeyManager: APIKeyManager };
