/**
 * Partner Seed Generator
 * Creates a 12-word seed phrase for human partner governance collective
 *
 * This seed is:
 * - NEW (not Exodus 12-word, not Hardware 24-word)
 * - Limited to 65 human partners maximum
 * - For covenant commitment and governance
 * - Distributed when partner status achieved
 * - Shared among trusted human partners for collective decisions
 */

const crypto = require('crypto');
const bip39 = require('bip39');
const fs = require('fs');
const path = require('path');

const PARTNER_SEED_FILE = path.join(__dirname, '../../data/partner-governance.json');
const PARTNER_SEED_KEY_FILE = path.join(__dirname, '../../data/.partner-seed.key');

class PartnerSeedGenerator {
  constructor() {
    this.ensureDataDir();
    this.partnerData = this.loadPartnerData();
    this.seedKey = this.loadSeedKey(); // Load actual seed from secure file
  }

  ensureDataDir() {
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  loadPartnerData() {
    try {
      if (!fs.existsSync(PARTNER_SEED_FILE)) {
        return this.createDefaultStructure();
      }
      return JSON.parse(fs.readFileSync(PARTNER_SEED_FILE, 'utf8'));
    } catch (error) {
      console.error('Error loading partner data:', error);
      return this.createDefaultStructure();
    }
  }

  /**
   * Load actual seed from secure key file (not the redacted JSON)
   */
  loadSeedKey() {
    try {
      if (!fs.existsSync(PARTNER_SEED_KEY_FILE)) {
        return null;
      }
      const content = fs.readFileSync(PARTNER_SEED_KEY_FILE, 'utf8').trim();
      return content || null;
    } catch (error) {
      console.error('Error loading seed key:', error);
      return null;
    }
  }

  /**
   * Save actual seed to secure key file with restrictive permissions
   */
  saveSeedKey(seed) {
    try {
      const dataDir = path.join(__dirname, '../../data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Write the actual seed to secure file
      fs.writeFileSync(PARTNER_SEED_KEY_FILE, seed, { mode: 0o600 });

      // On Linux/Mac, ensure restrictive permissions (owner read/write only)
      try {
        fs.chmodSync(PARTNER_SEED_KEY_FILE, 0o600);
      } catch (e) {
        // chmod may fail on some systems, continue anyway
      }

      return true;
    } catch (error) {
      console.error('Error saving seed key:', error);
      throw error;
    }
  }

  createDefaultStructure() {
    return {
      partnerSeed: null,
      seedCreatedAt: null,
      seedGeneratedBy: null,
      maxPartners: 65,
      currentPartners: 0,
      partnersList: [],
      governanceTokenAddress: null,
      intentDeclarations: [],
      securityLog: [],
      distribution: {
        pendingDistribution: [],
        distributed: [],
        revoked: []
      }
    };
  }

  savePartnerData() {
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Ensure seed is never exposed in logs
    const safeCopy = JSON.parse(JSON.stringify(this.partnerData));
    if (safeCopy.partnerSeed) {
      safeCopy.partnerSeed = '[REDACTED]';
    }

    fs.writeFileSync(PARTNER_SEED_FILE, JSON.stringify(safeCopy, null, 2));
  }

  /**
   * Generate new 12-word seed phrase for partner governance
   * Called only once by Genesis Human to initialize the partner collective
   */
  generatePartnerSeed(initiatorWallet) {
    if (this.partnerData.partnerSeed) {
      throw new Error('Partner seed already generated. Cannot regenerate.');
    }

    if (!initiatorWallet || !initiatorWallet.match(/^0x[a-f0-9]{40}$/i)) {
      throw new Error('Invalid initiator wallet');
    }

    // Generate 12-word seed phrase using BIP39
    const mnemonic = bip39.generateMnemonic(128); // 12 words

    // Validate the mnemonic
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Generated mnemonic is invalid');
    }

    this.partnerData.partnerSeed = mnemonic;
    this.partnerData.seedCreatedAt = new Date().toISOString();
    this.partnerData.seedGeneratedBy = initiatorWallet.toLowerCase();

    // Save actual seed to secure key file
    this.saveSeedKey(mnemonic);
    this.seedKey = mnemonic;

    // Log security event
    this.logSecurityEvent('SEED_GENERATED', {
      initiator: initiatorWallet.toLowerCase(),
      timestamp: new Date().toISOString(),
      wordCount: 12,
      message: 'Partner Seed generated for 65-partner governance collective'
    });

    this.savePartnerData();

    return {
      success: true,
      message: '✅ Partner seed generated successfully',
      details: {
        wordCount: 12,
        maxPartners: 65,
        createdAt: this.partnerData.seedCreatedAt,
        initiatedBy: initiatorWallet.toLowerCase(),
        warning: '🔐 KEEP THIS SEED SECURE. This is for covenant commitment among human partners.'
      },
      seed: mnemonic, // Only shown once at generation
      nextStep: 'Share with Genesis Human for safe custody. Distribute to partners on achievement.'
    };
  }

  /**
   * Get the partner seed (requires authorization)
   * Only Genesis Human, Agent, and authorized partners can access
   */
  getPartnerSeed(requestingWallet, signature) {
    if (!this.seedKey && !this.partnerData.partnerSeed) {
      throw new Error('Partner seed not yet generated');
    }

    // In production, verify signature to ensure authorized wallet is requesting
    // For now, check if wallet is Genesis or in partners list
    const GENESIS_HUMAN = '0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB'.toLowerCase();
    const AGENT_WALLET = '0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22'.toLowerCase();

    const isAuthorized = requestingWallet.toLowerCase() === GENESIS_HUMAN ||
                        requestingWallet.toLowerCase() === AGENT_WALLET ||
                        this.partnerData.partnersList.some(p => p.wallet.toLowerCase() === requestingWallet.toLowerCase());

    if (!isAuthorized) {
      this.logSecurityEvent('UNAUTHORIZED_SEED_ACCESS_ATTEMPT', {
        attemptedBy: requestingWallet.toLowerCase(),
        timestamp: new Date().toISOString(),
        message: 'Unauthorized attempt to access partner seed'
      });

      throw new Error('Not authorized to access partner seed');
    }

    // Log access
    this.logSecurityEvent('PARTNER_SEED_ACCESSED', {
      accessedBy: requestingWallet.toLowerCase(),
      timestamp: new Date().toISOString()
    });

    // Use actual seed from key file if available, otherwise JSON
    const seed = this.seedKey || this.partnerData.partnerSeed;

    return {
      seed: seed,
      wordCount: 12,
      accessedAt: new Date().toISOString(),
      warning: '🔐 Guard this seed. Store separately for safety.'
    };
  }

  /**
   * Add human partner to list when they achieve partner status
   */
  addPartner(walletAddress, bibleAlias, bibleWallet) {
    if (this.partnerData.currentPartners >= this.partnerData.maxPartners) {
      throw new Error(`Maximum partners (${this.partnerData.maxPartners}) reached`);
    }

    // Check if already a partner
    if (this.partnerData.partnersList.some(p => p.wallet.toLowerCase() === walletAddress.toLowerCase())) {
      throw new Error('Wallet is already a partner');
    }

    const partner = {
      wallet: walletAddress.toLowerCase(),
      bibleAlias: bibleAlias,
      bibleWallet: bibleWallet.toLowerCase(),
      achievedAt: new Date().toISOString(),
      seedDistributedAt: null,
      seedAcknowledged: false,
      governanceVotes: 0,
      governanceProposals: 0
    };

    this.partnerData.partnersList.push(partner);
    this.partnerData.currentPartners++;
    this.partnerData.distribution.pendingDistribution.push(walletAddress.toLowerCase());

    this.logSecurityEvent('PARTNER_ADDED', {
      partner: walletAddress.toLowerCase(),
      bibleAlias: bibleAlias,
      timestamp: new Date().toISOString(),
      totalPartners: this.partnerData.currentPartners
    });

    this.savePartnerData();

    return {
      success: true,
      partner: walletAddress.toLowerCase(),
      status: 'Partner added to governance collective',
      seedWillBe: 'Distributed when ready',
      totalPartners: this.partnerData.currentPartners,
      maxPartners: this.partnerData.maxPartners
    };
  }

  /**
   * Record seed distribution to partner
   */
  recordSeedDistribution(partnerWallet, distributedBy) {
    const partner = this.partnerData.partnersList.find(
      p => p.wallet.toLowerCase() === partnerWallet.toLowerCase()
    );

    if (!partner) {
      throw new Error('Partner not found');
    }

    partner.seedDistributedAt = new Date().toISOString();
    this.partnerData.distribution.distributed.push({
      partner: partnerWallet.toLowerCase(),
      distributedAt: new Date().toISOString(),
      distributedBy: distributedBy.toLowerCase()
    });

    // Remove from pending
    this.partnerData.distribution.pendingDistribution =
      this.partnerData.distribution.pendingDistribution.filter(
        w => w !== partnerWallet.toLowerCase()
      );

    this.logSecurityEvent('SEED_DISTRIBUTED_TO_PARTNER', {
      partner: partnerWallet.toLowerCase(),
      distributedBy: distributedBy.toLowerCase(),
      timestamp: new Date().toISOString(),
      totalDistributed: this.partnerData.distribution.distributed.length
    });

    this.savePartnerData();

    return {
      success: true,
      message: `Partner seed distributed to ${partnerWallet.toLowerCase()}`,
      distributedAt: partner.seedDistributedAt
    };
  }

  /**
   * Partner acknowledges receipt and understanding of seed
   */
  acknowledgeSeed(partnerWallet, intentStatement) {
    const partner = this.partnerData.partnersList.find(
      p => p.wallet.toLowerCase() === partnerWallet.toLowerCase()
    );

    if (!partner) {
      throw new Error('Partner not found');
    }

    partner.seedAcknowledged = true;

    // Log intent declaration
    this.logIntentDeclaration(partnerWallet, 'ACKNOWLEDGE_SEED', intentStatement);

    this.logSecurityEvent('PARTNER_SEED_ACKNOWLEDGED', {
      partner: partnerWallet.toLowerCase(),
      timestamp: new Date().toISOString(),
      intentProvided: !!intentStatement
    });

    this.savePartnerData();

    return {
      success: true,
      message: 'Seed acknowledged. You are now part of the partner governance collective.',
      acknowledgedAt: new Date().toISOString()
    };
  }

  /**
   * Log intent declaration when someone tries to access partner resources
   * Used to detect and log non-partner attempts
   */
  logIntentDeclaration(wallet, intentType, intentStatement) {
    const declaration = {
      wallet: wallet.toLowerCase(),
      intentType: intentType,
      intentStatement: intentStatement || 'No statement provided',
      declaredAt: new Date().toISOString(),
      isPartner: this.partnerData.partnersList.some(
        p => p.wallet.toLowerCase() === wallet.toLowerCase()
      )
    };

    this.partnerData.intentDeclarations.push(declaration);

    // If not a partner, log as security event
    if (!declaration.isPartner) {
      this.logSecurityEvent('NON_PARTNER_INTENT_DECLARATION', {
        wallet: wallet.toLowerCase(),
        intentType: intentType,
        intentStatement: intentStatement,
        timestamp: new Date().toISOString(),
        message: 'Non-partner attempted to declare intentions'
      });
    }

    this.savePartnerData();

    return declaration;
  }

  /**
   * Log security events
   */
  logSecurityEvent(eventType, details) {
    const event = {
      eventType: eventType,
      details: details,
      timestamp: details.timestamp || new Date().toISOString(),
      severity: this.determineSeverity(eventType)
    };

    this.partnerData.securityLog.push(event);

    // Keep only last 1000 events
    if (this.partnerData.securityLog.length > 1000) {
      this.partnerData.securityLog = this.partnerData.securityLog.slice(-1000);
    }

    // Also write to separate audit log file
    this.writeAuditLog(event);

    this.savePartnerData();
  }

  /**
   * Write to separate audit log for security
   */
  writeAuditLog(event) {
    const auditLogDir = path.join(__dirname, '../../data/audit-logs');
    if (!fs.existsSync(auditLogDir)) {
      fs.mkdirSync(auditLogDir, { recursive: true });
    }

    const logFile = path.join(auditLogDir, `partner-governance-${new Date().toISOString().split('T')[0]}.log`);
    const logEntry = `[${event.timestamp}] ${event.eventType} (${event.severity}): ${JSON.stringify(event.details)}\n`;

    fs.appendFileSync(logFile, logEntry);
  }

  /**
   * Determine event severity
   */
  determineSeverity(eventType) {
    const severities = {
      'SEED_GENERATED': 'CRITICAL',
      'UNAUTHORIZED_SEED_ACCESS_ATTEMPT': 'HIGH',
      'PARTNER_SEED_ACCESSED': 'MEDIUM',
      'SEED_DISTRIBUTED_TO_PARTNER': 'MEDIUM',
      'PARTNER_ADDED': 'LOW',
      'PARTNER_SEED_ACKNOWLEDGED': 'LOW',
      'NON_PARTNER_INTENT_DECLARATION': 'HIGH',
      'GOVERNANCE_VOTE_CAST': 'MEDIUM'
    };

    return severities[eventType] || 'MEDIUM';
  }

  /**
   * Get partner governance status
   */
  getPartnershipStatus() {
    return {
      maxPartners: this.partnerData.maxPartners,
      currentPartners: this.partnerData.currentPartners,
      seatsFilled: this.partnerData.currentPartners,
      seatsAvailable: this.partnerData.maxPartners - this.partnerData.currentPartners,
      seedGenerated: !!this.partnerData.partnerSeed,
      seedGeneratedAt: this.partnerData.seedCreatedAt,
      partners: this.partnerData.partnersList.map(p => ({
        wallet: p.wallet,
        bibleAlias: p.bibleAlias,
        achievedAt: p.achievedAt,
        seedDistributed: !!p.seedDistributedAt,
        seedAcknowledged: p.seedAcknowledged,
        governanceVotes: p.governanceVotes
      })),
      distribution: {
        pending: this.partnerData.distribution.pendingDistribution.length,
        distributed: this.partnerData.distribution.distributed.length,
        revoked: this.partnerData.distribution.revoked.length
      }
    };
  }

  /**
   * Get security log (filtered by severity)
   */
  getSecurityLog(severity = null) {
    let log = this.partnerData.securityLog;

    if (severity) {
      log = log.filter(e => e.severity === severity);
    }

    return log.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Get intent declarations (for security review)
   */
  getIntentDeclarations(filterPartners = false) {
    let declarations = this.partnerData.intentDeclarations;

    if (filterPartners) {
      declarations = declarations.filter(d => d.isPartner === false);
    }

    return declarations.sort((a, b) => new Date(b.declaredAt) - new Date(a.declaredAt));
  }

  /**
   * Revoke partner status (due to violations, etc.)
   */
  revokePartnerStatus(partnerWallet, reason) {
    const partnerIndex = this.partnerData.partnersList.findIndex(
      p => p.wallet.toLowerCase() === partnerWallet.toLowerCase()
    );

    if (partnerIndex === -1) {
      throw new Error('Partner not found');
    }

    const partner = this.partnerData.partnersList[partnerIndex];
    this.partnerData.partnersList.splice(partnerIndex, 1);
    this.partnerData.currentPartners--;

    this.partnerData.distribution.revoked.push({
      partner: partnerWallet.toLowerCase(),
      revokedAt: new Date().toISOString(),
      reason: reason
    });

    this.logSecurityEvent('PARTNER_REVOKED', {
      partner: partnerWallet.toLowerCase(),
      reason: reason,
      timestamp: new Date().toISOString(),
      totalPartnersAfter: this.partnerData.currentPartners
    });

    this.savePartnerData();

    return {
      success: true,
      message: `Partner ${partnerWallet.toLowerCase()} revoked`,
      reason: reason
    };
  }
}

module.exports = PartnerSeedGenerator;

// CLI execution
if (require.main === module) {
  const generator = new PartnerSeedGenerator();

  const command = process.argv[2];
  const arg1 = process.argv[3];
  const arg2 = process.argv[4];

  try {
    switch (command) {
      case 'generate':
        if (!arg1) {
          console.log('Usage: npm run generate-partner-seed generate <genesis-wallet>');
          process.exit(1);
        }
        console.log('\n🔐 GENERATING PARTNER GOVERNANCE SEED\n');
        const result = generator.generatePartnerSeed(arg1);
        console.log(JSON.stringify(result, null, 2));
        console.log('\n⚠️  SAVE THIS SEED SECURELY!\n');
        break;

      case 'status':
        console.log('\n📊 Partner Governance Status\n');
        console.log(JSON.stringify(generator.getPartnershipStatus(), null, 2));
        break;

      case 'security-log':
        console.log('\n🔒 Security Log\n');
        console.log(JSON.stringify(generator.getSecurityLog(arg1), null, 2));
        break;

      case 'intent-declarations':
        console.log('\n📋 Intent Declarations\n');
        const filterNonPartners = arg1 === '--non-partners';
        console.log(JSON.stringify(generator.getIntentDeclarations(filterNonPartners), null, 2));
        break;

      default:
        console.log('Available commands:');
        console.log('  generate <genesis-wallet>  - Generate partner seed (one-time)');
        console.log('  status                      - Show partnership status');
        console.log('  security-log [severity]     - View security events');
        console.log('  intent-declarations         - View intent declarations');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}
