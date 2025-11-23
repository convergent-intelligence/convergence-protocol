/**
 * Credential Manager
 * Handles encryption/decryption and storage of team member credentials
 * Uses Web3 wallet addresses as the identity key
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CREDENTIALS_FILE = path.join(__dirname, '../../data/credentials/team-members.json');

class CredentialManager {
  constructor(encryptionKey) {
    // Get encryption key from environment or parameter
    this.encryptionKey = encryptionKey || process.env.CREDENTIAL_ENCRYPTION_KEY;

    if (!this.encryptionKey) {
      throw new Error('CREDENTIAL_ENCRYPTION_KEY not set in environment');
    }

    // Ensure key is 32 bytes for AES-256
    if (this.encryptionKey.length < 32) {
      this.encryptionKey = crypto
        .createHash('sha256')
        .update(this.encryptionKey)
        .digest();
    } else {
      this.encryptionKey = Buffer.from(this.encryptionKey.slice(0, 32));
    }
  }

  /**
   * Encrypt a credential object
   */
  encrypt(data) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);

    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return IV + encrypted data (IV is needed for decryption)
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt a credential string
   */
  decrypt(encryptedData) {
    try {
      const [ivHex, encrypted] = encryptedData.split(':');
      const iv = Buffer.from(ivHex, 'hex');

      const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error.message);
      throw new Error('Failed to decrypt credentials');
    }
  }

  /**
   * Add or update a team member
   */
  addTeamMember(walletAddress, memberData) {
    walletAddress = walletAddress.toLowerCase();

    const credentials = this.loadCredentials();

    // Encrypt the SSH key and other sensitive data
    const encryptedData = {
      ssh_key: memberData.ssh_key,
      server_address: memberData.server_address,
      username: memberData.username,
      port: memberData.port || 22,
      instructions: memberData.instructions
    };

    credentials.members[walletAddress] = {
      role: memberData.role,
      description: memberData.description,
      created: new Date().toISOString(),
      status: memberData.status || 'active',
      credentials_encrypted: true,
      ssh_key_encrypted: this.encrypt(encryptedData),
      last_updated: new Date().toISOString()
    };

    this.saveCredentials(credentials);

    return {
      wallet: walletAddress,
      role: memberData.role,
      status: 'Added successfully'
    };
  }

  /**
   * Get credentials for a team member (decrypted)
   */
  getTeamMemberCredentials(walletAddress) {
    walletAddress = walletAddress.toLowerCase();

    const credentials = this.loadCredentials();
    const member = credentials.members[walletAddress];

    if (!member) {
      throw new Error('Team member not found');
    }

    if (member.status !== 'active') {
      throw new Error('Team member credentials not active');
    }

    // Decrypt the SSH key bundle
    const decrypted = this.decrypt(member.ssh_key_encrypted);

    return {
      role: member.role,
      description: member.description,
      credentials: decrypted,
      created: member.created,
      updated: member.last_updated
    };
  }

  /**
   * List all team members (metadata only, no credentials)
   */
  listTeamMembers() {
    const credentials = this.loadCredentials();

    return Object.entries(credentials.members).map(([wallet, data]) => ({
      wallet,
      role: data.role,
      description: data.description,
      status: data.status,
      created: data.created,
      updated: data.last_updated
    }));
  }

  /**
   * Update team member status
   */
  updateTeamMemberStatus(walletAddress, status) {
    walletAddress = walletAddress.toLowerCase();

    const credentials = this.loadCredentials();
    const member = credentials.members[walletAddress];

    if (!member) {
      throw new Error('Team member not found');
    }

    member.status = status;
    member.last_updated = new Date().toISOString();

    this.saveCredentials(credentials);

    return {
      wallet: walletAddress,
      status: status,
      updated: member.last_updated
    };
  }

  /**
   * Remove a team member
   */
  removeTeamMember(walletAddress) {
    walletAddress = walletAddress.toLowerCase();

    const credentials = this.loadCredentials();

    if (!credentials.members[walletAddress]) {
      throw new Error('Team member not found');
    }

    delete credentials.members[walletAddress];
    this.saveCredentials(credentials);

    return {
      wallet: walletAddress,
      status: 'Removed successfully'
    };
  }

  /**
   * Load credentials file
   */
  loadCredentials() {
    try {
      const data = fs.readFileSync(CREDENTIALS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      throw new Error('Failed to load credentials file: ' + error.message);
    }
  }

  /**
   * Save credentials file with proper permissions
   */
  saveCredentials(credentials) {
    try {
      const data = JSON.stringify(credentials, null, 2);
      fs.writeFileSync(CREDENTIALS_FILE, data, { mode: 0o600 });
    } catch (error) {
      throw new Error('Failed to save credentials file: ' + error.message);
    }
  }
}

module.exports = { CredentialManager };
