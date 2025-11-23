/**
 * Key Encryption Utility
 * Encrypts private keys at rest using AES-256-GCM
 * CRITICAL: Replaces plaintext private key storage
 */

const crypto = require('crypto');
const secretsManager = require('./secrets-manager');

class KeyEncryption {
  /**
   * Encrypt a private key
   * @param {string} privateKey - The private key to encrypt
   * @returns {object} - { ciphertext, iv, authTag, algorithm }
   */
  async encryptPrivateKey(privateKey) {
    try {
      const encryptionKey = await secretsManager.getSecret('credential-encryption-key');

      // Use 256-bit hash of encryption key
      const keyHash = crypto
        .createHash('sha256')
        .update(encryptionKey)
        .digest();

      // Generate random IV
      const iv = crypto.randomBytes(16);

      // Create cipher
      const cipher = crypto.createCipheriv('aes-256-gcm', keyHash, iv);

      // Encrypt
      let encrypted = cipher.update(privateKey, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      return {
        ciphertext: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        algorithm: 'aes-256-gcm'
      };
    } catch (error) {
      throw new Error(`Key encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt a private key
   * @param {object} encrypted - { ciphertext, iv, authTag }
   * @returns {string} - The decrypted private key
   */
  async decryptPrivateKey(encrypted) {
    try {
      const encryptionKey = await secretsManager.getSecret('credential-encryption-key');

      // Use 256-bit hash of encryption key
      const keyHash = crypto
        .createHash('sha256')
        .update(encryptionKey)
        .digest();

      // Recreate IV and auth tag
      const iv = Buffer.from(encrypted.iv, 'hex');
      const authTag = Buffer.from(encrypted.authTag, 'hex');

      // Create decipher
      const decipher = crypto.createDecipheriv('aes-256-gcm', keyHash, iv);
      decipher.setAuthTag(authTag);

      // Decrypt
      let decrypted = decipher.update(encrypted.ciphertext, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Key decryption failed: ${error.message}`);
    }
  }

  /**
   * Check if an object is encrypted
   */
  isEncrypted(obj) {
    return obj && obj.ciphertext && obj.iv && obj.authTag && obj.algorithm;
  }
}

module.exports = new KeyEncryption();
