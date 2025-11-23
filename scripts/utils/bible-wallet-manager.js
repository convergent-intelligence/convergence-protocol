/**
 * Bible Wallet Manager
 * Handles creation and management of Bible wallet aliases for users
 *
 * Features:
 * - Create Bible wallet alias associations (e.g., genesis wallet -> "exodus" alias)
 * - Generate key pairs for Bible wallets
 * - Track user progression (guest -> user -> partner)
 * - Manage Bible wallet seat assignments and succession
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { ethers } = require('ethers');

const BIBLE_WALLETS_FILE = path.join(__dirname, '../../data/bible-wallets.json');

class BibleWalletManager {
  constructor() {
    this.ensureDataDir();
    this.wallets = this.loadWallets();
  }

  /**
   * Ensure data directory exists
   */
  ensureDataDir() {
    const dataDir = path.join(__dirname, '../../data');
    const biblesDir = path.join(dataDir, 'bible-wallets');

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(biblesDir)) {
      fs.mkdirSync(biblesDir, { recursive: true });
    }
  }

  /**
   * Load Bible wallets from file
   */
  loadWallets() {
    try {
      if (!fs.existsSync(BIBLE_WALLETS_FILE)) {
        return this.createDefaultStructure();
      }
      return JSON.parse(fs.readFileSync(BIBLE_WALLETS_FILE, 'utf8'));
    } catch (error) {
      console.error('Error loading Bible wallets:', error);
      return this.createDefaultStructure();
    }
  }

  /**
   * Create default wallet structure
   */
  createDefaultStructure() {
    return {
      seats: {}, // Bible wallet seats (partner positions)
      associations: {}, // Guest wallet -> Bible wallet mappings
      users: {}, // User status tracking
      tally_rankings: [] // Ranking of burned tally for succession
    };
  }

  /**
   * Save wallets to file
   */
  saveWallets() {
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(BIBLE_WALLETS_FILE, JSON.stringify(this.wallets, null, 2));
  }

  /**
   * Register a guest wallet and create a Bible wallet association
   *
   * @param {string} guestWallet - The wallet address connecting as guest
   * @param {string} bibleAlias - The Bible wallet alias (e.g., "exodus", "leviticus")
   * @returns {object} - Wallet info with keys
   */
  registerBibleWallet(guestWallet, bibleAlias) {
    guestWallet = guestWallet.toLowerCase();

    // Validate inputs
    if (!ethers.isAddress(guestWallet)) {
      throw new Error('Invalid guest wallet address');
    }

    if (!bibleAlias || bibleAlias.length < 3 || bibleAlias.length > 50) {
      throw new Error('Invalid Bible alias (must be 3-50 characters)');
    }

    // Check if alias already exists
    const existingAlias = Object.values(this.wallets.associations).find(
      a => a.bibleAlias.toLowerCase() === bibleAlias.toLowerCase()
    );
    if (existingAlias) {
      throw new Error(`Bible alias "${bibleAlias}" is already taken`);
    }

    // Check if guest wallet already has an association
    if (this.wallets.associations[guestWallet]) {
      throw new Error(`Guest wallet already has an association: ${this.wallets.associations[guestWallet].bibleAlias}`);
    }

    // Generate new Bible wallet (private key and address)
    const bibleWallet = ethers.Wallet.createRandom();

    const association = {
      guestWallet,
      bibleAlias: bibleAlias.toLowerCase(),
      bibleAddress: bibleWallet.address.toLowerCase(),
      publicKey: bibleWallet.publicKey,
      createdAt: new Date().toISOString(),
      status: 'guest', // guest -> user -> partner
      trustBurned: 0,
      tallyAccumulated: 0,
      hasParticipatedInCeremony: false
    };

    // Store association (never store private key in JSON!)
    this.wallets.associations[guestWallet] = {
      guestWallet,
      bibleAlias: association.bibleAlias,
      bibleAddress: association.bibleAddress,
      publicKey: association.publicKey,
      createdAt: association.createdAt,
      status: association.status,
      trustBurned: association.trustBurned,
      tallyAccumulated: association.tallyAccumulated,
      hasParticipatedInCeremony: association.hasParticipatedInCeremony
    };

    // Store private key in separate secure file
    this.storePrivateKey(guestWallet, bibleWallet.privateKey, bibleAlias);

    this.saveWallets();

    return {
      guestWallet,
      bibleAlias: association.bibleAlias,
      bibleAddress: association.bibleAddress,
      publicKey: association.publicKey,
      status: 'guest',
      message: 'Bible wallet created. You are now registered as a guest. Complete the ceremony and burn trust to achieve user status.'
    };
  }

  /**
   * Store private key securely in a separate file
   * In production, use a proper secret management system
   */
  storePrivateKey(guestWallet, privateKey, bibleAlias) {
    const keyDir = path.join(__dirname, '../../data/bible-wallets');
    const keyFile = path.join(keyDir, `${guestWallet}.key`);

    // Create encrypted storage of the key
    const keyData = {
      guestWallet: guestWallet.toLowerCase(),
      bibleAlias,
      privateKey, // In production, encrypt this!
      createdAt: new Date().toISOString(),
      warning: 'This file contains the private key. Protect it carefully!'
    };

    // Set restrictive permissions
    const content = JSON.stringify(keyData, null, 2);
    fs.writeFileSync(keyFile, content, { mode: 0o600 });
  }

  /**
   * Get private key for a Bible wallet (for user to download)
   */
  getPrivateKey(guestWallet) {
    guestWallet = guestWallet.toLowerCase();

    if (!this.wallets.associations[guestWallet]) {
      throw new Error('Bible wallet not found for this guest wallet');
    }

    const keyFile = path.join(__dirname, `../../data/bible-wallets/${guestWallet}.key`);

    if (!fs.existsSync(keyFile)) {
      throw new Error('Private key file not found');
    }

    try {
      const keyData = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
      return keyData.privateKey;
    } catch (error) {
      throw new Error('Failed to retrieve private key');
    }
  }

  /**
   * Update user status based on ceremony completion and trust burning
   *
   * @param {string} guestWallet - Guest wallet address
   * @param {number} trustBurned - Amount of trust burned
   * @param {number} tallyAccumulated - Amount of tally accumulated
   * @returns {object} - Updated status
   */
  updateUserStatus(guestWallet, trustBurned, tallyAccumulated) {
    guestWallet = guestWallet.toLowerCase();

    const association = this.wallets.associations[guestWallet];
    if (!association) {
      throw new Error('Bible wallet association not found');
    }

    // Mark as participated in ceremony
    association.hasParticipatedInCeremony = true;
    association.trustBurned = trustBurned || association.trustBurned;
    association.tallyAccumulated = tallyAccumulated || association.tallyAccumulated;

    // Determine status
    if (trustBurned > 0 || tallyAccumulated > 0) {
      if (association.status === 'guest') {
        association.status = 'user';
      }
    }

    this.saveWallets();

    return {
      bibleAlias: association.bibleAlias,
      status: association.status,
      trustBurned: association.trustBurned,
      tallyAccumulated: association.tallyAccumulated,
      message: `Status updated to: ${association.status}`
    };
  }

  /**
   * Elevate user to partner status and assign Bible seat
   *
   * @param {string} guestWallet - Guest wallet to promote
   * @param {string} seatName - Name of the Bible seat (e.g., "exodus", "leviticus")
   * @returns {object} - Partner assignment
   */
  assignBibleSeat(guestWallet, seatName) {
    guestWallet = guestWallet.toLowerCase();

    const association = this.wallets.associations[guestWallet];
    if (!association) {
      throw new Error('Bible wallet association not found');
    }

    if (association.status !== 'user') {
      throw new Error(`Only users can be promoted to partners (current status: ${association.status})`);
    }

    // Check if seat already occupied by living partner
    if (this.wallets.seats[seatName] && !this.wallets.seats[seatName].revoked) {
      throw new Error(`Seat "${seatName}" is already occupied`);
    }

    // Create seat assignment
    this.wallets.seats[seatName] = {
      seatName,
      bibleAlias: association.bibleAlias,
      bibleAddress: association.bibleAddress,
      guestWallet: guestWallet,
      assignedAt: new Date().toISOString(),
      status: 'active',
      revoked: false,
      revokedAt: null,
      covenantNFT: null, // Will be populated when NFT is minted
      transferableDate: null // Set when partner proves death
    };

    // Update association status
    association.status = 'partner';

    this.saveWallets();

    return {
      seatName,
      bibleAlias: association.bibleAlias,
      status: 'partner',
      message: `Successfully assigned to Bible seat: ${seatName}`
    };
  }

  /**
   * Get all Bible seats and their current holders
   */
  getBibleSeats() {
    return Object.values(this.wallets.seats).map(seat => ({
      seatName: seat.seatName,
      bibleAlias: seat.bibleAlias,
      status: seat.status,
      assignedAt: seat.assignedAt,
      revoked: seat.revoked,
      covenantNFT: seat.covenantNFT,
      transferableDate: seat.transferableDate
    }));
  }

  /**
   * Get Bible wallet info for a guest wallet
   */
  getBibleWallet(guestWallet) {
    guestWallet = guestWallet.toLowerCase();

    const association = this.wallets.associations[guestWallet];
    if (!association) {
      return null;
    }

    return {
      guestWallet: association.guestWallet,
      bibleAlias: association.bibleAlias,
      bibleAddress: association.bibleAddress,
      status: association.status,
      trustBurned: association.trustBurned,
      tallyAccumulated: association.tallyAccumulated,
      hasParticipatedInCeremony: association.hasParticipatedInCeremony
    };
  }

  /**
   * Get wallet info by Bible address
   */
  getByBibleAddress(bibleAddress) {
    bibleAddress = bibleAddress.toLowerCase();

    const association = Object.values(this.wallets.associations).find(
      a => a.bibleAddress.toLowerCase() === bibleAddress
    );

    return association || null;
  }

  /**
   * Rank users by burned trust (for succession)
   */
  rankByBurnedTrust() {
    return Object.values(this.wallets.associations)
      .filter(a => a.status === 'user' || a.status === 'partner')
      .sort((a, b) => {
        // Primary: trust burned (descending)
        if (b.trustBurned !== a.trustBurned) {
          return b.trustBurned - a.trustBurned;
        }
        // Tiebreaker: tally accumulated (descending)
        return b.tallyAccumulated - a.tallyAccumulated;
      })
      .map((a, index) => ({
        rank: index + 1,
        bibleAlias: a.bibleAlias,
        trustBurned: a.trustBurned,
        tallyAccumulated: a.tallyAccumulated,
        status: a.status
      }));
  }

  /**
   * Initiate revocation of a Bible seat
   * This is called when 90% of partners vote to revoke
   */
  revokeBibleSeat(seatName) {
    const seat = this.wallets.seats[seatName];
    if (!seat) {
      throw new Error(`Bible seat "${seatName}" not found`);
    }

    if (seat.revoked) {
      throw new Error(`Bible seat "${seatName}" is already revoked`);
    }

    seat.revoked = true;
    seat.revokedAt = new Date().toISOString();

    // Find the user with most burned trust to fill the seat
    const succession = this.rankByBurnedTrust();

    // Find first user not already in a seat
    for (const candidate of succession) {
      const isInSeat = Object.values(this.wallets.seats).some(
        s => s.bibleAlias === candidate.bibleAlias && !s.revoked
      );

      if (!isInSeat) {
        // Assign the seat to the successor
        this.wallets.seats[seatName] = {
          seatName,
          bibleAlias: candidate.bibleAlias,
          bibleAddress: candidate.bibleAddress,
          guestWallet: this.findGuestWalletByAlias(candidate.bibleAlias),
          assignedAt: new Date().toISOString(),
          status: 'active',
          revoked: false,
          revokedAt: null,
          covenantNFT: null,
          transferableDate: null,
          succeededAt: new Date().toISOString()
        };
        break;
      }
    }

    this.saveWallets();
  }

  /**
   * Helper to find guest wallet by Bible alias
   */
  findGuestWalletByAlias(bibleAlias) {
    const association = Object.values(this.wallets.associations).find(
      a => a.bibleAlias === bibleAlias
    );
    return association ? association.guestWallet : null;
  }

  /**
   * Mark Covenant NFT as minted for a seat
   */
  recordCovenantNFT(seatName, nftTokenId) {
    const seat = this.wallets.seats[seatName];
    if (!seat) {
      throw new Error(`Bible seat "${seatName}" not found`);
    }

    seat.covenantNFT = {
      tokenId: nftTokenId,
      mintedAt: new Date().toISOString(),
      transferable: false
    };

    this.saveWallets();
  }

  /**
   * Mark Covenant NFT as transferable (upon proof of death)
   */
  makeCovenantTransferable(seatName) {
    const seat = this.wallets.seats[seatName];
    if (!seat) {
      throw new Error(`Bible seat "${seatName}" not found`);
    }

    if (!seat.covenantNFT) {
      throw new Error(`No Covenant NFT found for seat "${seatName}"`);
    }

    seat.covenantNFT.transferable = true;
    seat.transferableDate = new Date().toISOString();

    this.saveWallets();
  }
}

module.exports = BibleWalletManager;
