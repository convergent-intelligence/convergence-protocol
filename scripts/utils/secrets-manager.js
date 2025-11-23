/**
 * Secure Secrets Manager
 * Manages access to secrets stored in KMS or secure vaults
 * CRITICAL: Do not store raw secrets in environment variables
 */

class SecretsManager {
  constructor() {
    this.cache = {};
    this.cacheTimeout = 5 * 60 * 1000; // 5 minute cache
    this.lastFetch = {};
  }

  /**
   * Get secret from KMS or vault
   * In production, this should call AWS Secrets Manager, HashiCorp Vault, etc.
   */
  async getSecret(secretName) {
    // Check cache first
    if (this.cache[secretName]) {
      if (Date.now() - this.lastFetch[secretName] < this.cacheTimeout) {
        return this.cache[secretName];
      }
    }

    // TODO: Replace with actual KMS/Vault call
    // Example for AWS Secrets Manager:
    // const secretValue = await secretsClient.getSecretValue({
    //   SecretId: secretName
    // }).promise();

    // For now, only allow specific whitelisted secrets from environment
    const allowedSecrets = [
      'genesis-private-key',
      'agent-private-key',
      'credential-encryption-key',
      'infura-key',
      'etherscan-key'
    ];

    if (!allowedSecrets.includes(secretName)) {
      throw new Error(`Secret '${secretName}' is not whitelisted`);
    }

    // TEMP: Read from environment during migration
    // This should be removed once KMS is fully integrated
    const envMap = {
      'genesis-private-key': process.env.GENESIS_PRIVATE_KEY,
      'agent-private-key': process.env.AGENT_PRIVATE_KEY,
      'credential-encryption-key': process.env.CREDENTIAL_ENCRYPTION_KEY,
      'infura-key': process.env.INFURA_KEY,
      'etherscan-key': process.env.ETHERSCAN_KEY
    };

    const secret = envMap[secretName];
    if (!secret) {
      throw new Error(`Secret '${secretName}' not found`);
    }

    // Cache it
    this.cache[secretName] = secret;
    this.lastFetch[secretName] = Date.now();

    return secret;
  }

  /**
   * Rotate a secret
   * In production, this orchestrates with KMS
   */
  async rotateSecret(secretName, newValue) {
    console.log(`[SECURITY] Rotating secret: ${secretName}`);

    // TODO: Implement proper rotation:
    // 1. Create new version in KMS
    // 2. Update application to use new value
    // 3. Store old value for grace period (e.g., 24 hours)
    // 4. Monitor for failures with old key
    // 5. Archive old secret

    // CRITICAL: After rotation, deploy new .env or KMS value
    throw new Error('Secret rotation not yet implemented - requires KMS integration');
  }

  /**
   * Clear cache (useful after rotation)
   */
  clearCache(secretName) {
    if (secretName) {
      delete this.cache[secretName];
      delete this.lastFetch[secretName];
    } else {
      this.cache = {};
      this.lastFetch = {};
    }
  }

  /**
   * Get private key for signing
   */
  async getPrivateKey(role) {
    const keyMap = {
      'genesis': 'genesis-private-key',
      'agent': 'agent-private-key'
    };

    if (!keyMap[role]) {
      throw new Error(`Invalid role: ${role}`);
    }

    return this.getSecret(keyMap[role]);
  }
}

module.exports = new SecretsManager();
