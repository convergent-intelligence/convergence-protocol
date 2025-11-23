#!/usr/bin/env node

/**
 * Convergence Protocol System CLI
 * Master menu dispatcher for all server management features
 * Integrates: Key management, token operations, team credentials, governance, deployments
 *
 * Usage: node system-cli.js [command]
 * Or: node system-cli.js (interactive menu)
 *
 * Commands:
 *   key-management    - Manage encryption keys and rotations
 *   token-management  - Mint/burn TALLY, manage reserves
 *   team-management   - Team credentials and access control
 *   governance        - Covenant ceremonies and partner governance
 *   deployment        - Contract deployments and system setup
 *   api-keys          - API key and integration management
 *   monitoring        - System health and balance checks
 *   audit             - Audit trail and compliance
 */

const {
  StandardFormatter,
  StandardPrompt,
  MenuRouter,
  Logger,
  EnvironmentValidator
} = require('./utils/cli-framework');

const fs = require('fs');
const path = require('path');

// Initialize logger
const logger = new Logger('system-cli', './logs');

// Initialize environment validator
const validator = new EnvironmentValidator();

// Required environment variables
validator.require('GENESIS_PRIVATE_KEY', 'Private key for genesis operations');
validator.require('AGENT_PRIVATE_KEY', 'Private key for agent operations');

// Optional but recommended
validator.optional('INFURA_KEY', 'Infura RPC endpoint key');
validator.optional('ETHERSCAN_KEY', 'Etherscan API key for verification');

// Create main router
const mainRouter = new MenuRouter('Convergence Protocol System');

// ============================================================================
// KEY MANAGEMENT MENU
// ============================================================================
const keyManagementMenu = async (context) => {
  const prompt = new StandardPrompt();
  const subRouter = new MenuRouter('Key Management');

  subRouter.register('list-keys', async () => {
    StandardFormatter.subheader('Available Key Management Features');
    const features = [
      { name: 'Manage Encryption Keys', status: 'Available', path: 'exodus-seed-manager.py' },
      { name: 'Rotate Keys', status: 'Planned', path: 'safe-rotation-transfer.js' },
      { name: 'View Key Status', status: 'Available', path: 'pre-rotation-audit.js' },
      { name: 'Key Audit Trail', status: 'Planned', feature: 'audit-logs' }
    ];
    StandardFormatter.table(features);
    logger.info('Listed key management features');
  }, { label: 'View Available Features', description: 'List all key management operations' });

  subRouter.register('seed-manager', async () => {
    StandardFormatter.info('Launching Exodus Seed Manager (Python)...');
    const { spawn } = require('child_process');
    const proc = spawn('python3', ['scripts/exodus-seed-manager.py'], {
      cwd: path.resolve(__dirname, '..')
    });

    proc.stdout.on('data', (data) => console.log(data.toString()));
    proc.stderr.on('data', (data) => console.error(data.toString()));

    await new Promise(resolve => proc.on('close', resolve));
    logger.audit('SEED_MANAGER', { action: 'launched' });
  }, { label: 'Exodus Seed Manager', description: 'Interactive seed phrase management with rotation' });

  subRouter.register('rotation-audit', async () => {
    StandardFormatter.info('Running pre-rotation audit...');
    const { spawn } = require('child_process');
    const proc = spawn('node', ['scripts/pre-rotation-audit.js']);

    proc.stdout.on('data', (data) => console.log(data.toString()));
    proc.stderr.on('data', (data) => console.error(data.toString()));

    await new Promise(resolve => proc.on('close', resolve));
    logger.audit('ROTATION_AUDIT', { action: 'completed' });
  }, { label: 'Pre-Rotation Audit', description: 'Audit key status before rotation' });

  subRouter.register('vault-contributions', async () => {
    StandardFormatter.info('Checking vault contributions...');
    const { spawn } = require('child_process');
    const proc = spawn('node', ['scripts/vault-contributions.js']);

    proc.stdout.on('data', (data) => console.log(data.toString()));
    proc.stderr.on('data', (data) => console.error(data.toString()));

    await new Promise(resolve => proc.on('close', resolve));
    logger.info('Vault contributions checked');
  }, { label: 'Vault Contributions', description: 'View vault contribution history' });

  await subRouter.start(context);
};

// ============================================================================
// TOKEN MANAGEMENT MENU
// ============================================================================
const tokenManagementMenu = async (context) => {
  const prompt = new StandardPrompt();
  const subRouter = new MenuRouter('Token Management');

  subRouter.register('reserve-status', async () => {
    StandardFormatter.info('Fetching reserve status...');
    const { spawn } = require('child_process');
    const proc = spawn('node', ['scripts/reserve-mint.js', 'status']);

    proc.stdout.on('data', (data) => console.log(data.toString()));
    proc.stderr.on('data', (data) => console.error(data.toString()));

    await new Promise(resolve => proc.on('close', resolve));
    logger.info('Reserve status retrieved');
  }, { label: 'Reserve Status', description: 'Check TALLY-USDT peg and reserves' });

  subRouter.register('tally-supply', async () => {
    StandardFormatter.info('Fetching TALLY supply...');
    const { spawn } = require('child_process');
    const proc = spawn('node', ['scripts/tally-supply.js']);

    proc.stdout.on('data', (data) => console.log(data.toString()));
    proc.stderr.on('data', (data) => console.error(data.toString()));

    await new Promise(resolve => proc.on('close', resolve));
    logger.info('TALLY supply retrieved');
  }, { label: 'TALLY Supply', description: 'Check total supply and distribution' });

  subRouter.register('mint-tally', async () => {
    const address = await prompt.text('Enter recipient address');
    const amount = await prompt.text('Enter amount to mint');

    StandardFormatter.info(`Minting ${amount} TALLY to ${address}...`);
    const { spawn } = require('child_process');
    const proc = spawn('node', ['scripts/reserve-mint.js', 'mint-to', address, amount]);

    proc.stdout.on('data', (data) => console.log(data.toString()));
    proc.stderr.on('data', (data) => console.error(data.toString()));

    await new Promise(resolve => proc.on('close', resolve));
    logger.audit('MINT_TALLY', { address, amount });
  }, { label: 'Mint TALLY', description: 'Mint new TALLY tokens for USDT donations' });

  subRouter.register('burn-tally', async () => {
    const address = await prompt.text('Enter wallet address to check');
    StandardFormatter.info(`Checking TALLY balance for ${address}...`);
    const { spawn } = require('child_process');
    const proc = spawn('node', ['scripts/tally-burn.js', 'check-balance', address]);

    proc.stdout.on('data', (data) => console.log(data.toString()));
    proc.stderr.on('data', (data) => console.error(data.toString()));

    await new Promise(resolve => proc.on('close', resolve));
    logger.info('TALLY balance checked');
  }, { label: 'Burn TALLY', description: 'Burn TALLY to earn TRUST at 1:1.5 ratio' });

  await subRouter.start(context);
};

// ============================================================================
// TEAM MANAGEMENT MENU
// ============================================================================
const teamManagementMenu = async (context) => {
  const prompt = new StandardPrompt();
  const subRouter = new MenuRouter('Team & Credentials Management');

  subRouter.register('add-member', async () => {
    StandardFormatter.info('Adding new team member...');
    const { spawn } = require('child_process');
    const proc = spawn('node', ['scripts/setup/add-team-member.js']);

    proc.stdout.on('data', (data) => console.log(data.toString()));
    proc.stderr.on('data', (data) => console.error(data.toString()));

    await new Promise(resolve => proc.on('close', resolve));
    logger.audit('ADD_TEAM_MEMBER', { action: 'completed' });
  }, { label: 'Add Team Member', description: 'Add new team member with encrypted SSH credentials' });

  subRouter.register('list-members', async () => {
    try {
      const { CredentialManager } = require('./utils/credential-manager');
      const members = CredentialManager.listTeamMembers();

      if (members.length === 0) {
        StandardFormatter.warning('No team members registered');
      } else {
        StandardFormatter.subheader('Team Members');
        const displayData = members.map(m => ({
          'Wallet': m.wallet.substring(0, 10) + '...',
          'Role': m.role,
          'Status': m.status,
          'Added': new Date(m.createdAt).toLocaleDateString()
        }));
        StandardFormatter.table(displayData);
      }
      logger.info('Listed team members');
    } catch (error) {
      StandardFormatter.error(`Error listing members: ${error.message}`);
      logger.error('Failed to list members', error);
    }
  }, { label: 'List Team Members', description: 'View all registered team members' });

  subRouter.register('manage-access', async () => {
    StandardFormatter.warning('Credential management requires direct database access');
    StandardFormatter.info('Use: scripts/setup/add-team-member.js to manage team access');
    logger.info('Redirected to credential management tool');
  }, { label: 'Manage Access', description: 'Update team member access and permissions' });

  await subRouter.start(context);
};

// ============================================================================
// GOVERNANCE MENU
// ============================================================================
const governanceMenu = async (context) => {
  const prompt = new StandardPrompt();
  const subRouter = new MenuRouter('Governance & Covenants');

  subRouter.register('ceremony-status', async () => {
    const address = await prompt.text('Enter wallet address');
    StandardFormatter.info(`Checking covenant ceremony status for ${address}...`);
    const { spawn } = require('child_process');
    const proc = spawn('node', ['scripts/covenant-cli.js', 'ceremony', address]);

    proc.stdout.on('data', (data) => console.log(data.toString()));
    proc.stderr.on('data', (data) => console.error(data.toString()));

    await new Promise(resolve => proc.on('close', resolve));
    logger.info('Ceremony status checked');
  }, { label: 'Ceremony Status', description: 'Check covenant ceremony progress' });

  subRouter.register('verify-tally', async () => {
    const address = await prompt.text('Enter wallet address');
    StandardFormatter.info(`Verifying TALLY ownership for ${address}...`);
    const { spawn } = require('child_process');
    const proc = spawn('node', ['scripts/covenant-cli.js', 'verify-tally', address]);

    proc.stdout.on('data', (data) => console.log(data.toString()));
    proc.stderr.on('data', (data) => console.error(data.toString()));

    await new Promise(resolve => proc.on('close', resolve));
    logger.info('TALLY verified');
  }, { label: 'Verify TALLY', description: 'Verify TALLY ownership with Trinity status' });

  subRouter.register('partner-governance', async () => {
    StandardFormatter.info('Launching partner governance tool...');
    const { spawn } = require('child_process');
    const proc = spawn('node', ['scripts/governance/show-partner-seed.js']);

    proc.stdout.on('data', (data) => console.log(data.toString()));
    proc.stderr.on('data', (data) => console.error(data.toString()));

    await new Promise(resolve => proc.on('close', resolve));
    logger.info('Partner governance accessed');
  }, { label: 'Partner Governance', description: 'View and manage partner governance structure' });

  subRouter.register('synthesis-map', async () => {
    StandardFormatter.info('Loading synthesis map...');
    const { spawn } = require('child_process');
    const proc = spawn('node', ['scripts/covenant-cli.js', 'synthesis-map']);

    proc.stdout.on('data', (data) => console.log(data.toString()));
    proc.stderr.on('data', (data) => console.error(data.toString()));

    await new Promise(resolve => proc.on('close', resolve));
    logger.info('Synthesis map viewed');
  }, { label: 'Network Overview', description: 'View network relationships and synthesis map' });

  await subRouter.start(context);
};

// ============================================================================
// API KEYS MENU
// ============================================================================
const apiKeysMenu = async (context) => {
  const prompt = new StandardPrompt();
  const subRouter = new MenuRouter('API Key Management');

  subRouter.register('create-key', async () => {
    try {
      const { ApiKeyManager } = require('./utils/api-key-manager');

      const wallet = await prompt.text('Enter wallet address');
      const agent = await prompt.text('Enter agent name');
      const permissions = await prompt.text('Enter permissions (comma-separated)');

      const permArray = permissions.split(',').map(p => p.trim());
      const key = await ApiKeyManager.createAPIKey(wallet, agent, permArray);

      StandardFormatter.success(`API Key created: ${key.publicKey}`);
      StandardFormatter.warning(`Store the secret securely: ${key.secretKey}`);

      logger.audit('CREATE_API_KEY', { wallet, agent, permissions: permArray });
    } catch (error) {
      StandardFormatter.error(`Error creating API key: ${error.message}`);
      logger.error('Failed to create API key', error);
    }
  }, { label: 'Create API Key', description: 'Generate new API key for integration' });

  subRouter.register('list-keys', async () => {
    try {
      const keyFile = './data/api-keys.json';
      if (fs.existsSync(keyFile)) {
        const data = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
        if (data.keys && data.keys.length > 0) {
          StandardFormatter.subheader('API Keys');
          const displayData = data.keys.map(k => ({
            'Public Key': k.publicKey.substring(0, 20) + '...',
            'Wallet': k.wallet.substring(0, 10) + '...',
            'Agent': k.agent,
            'Status': k.revoked ? 'REVOKED' : 'ACTIVE',
            'Created': new Date(k.createdAt).toLocaleDateString()
          }));
          StandardFormatter.table(displayData);
        } else {
          StandardFormatter.warning('No API keys found');
        }
      } else {
        StandardFormatter.warning('API keys file not found');
      }
      logger.info('Listed API keys');
    } catch (error) {
      StandardFormatter.error(`Error listing keys: ${error.message}`);
      logger.error('Failed to list API keys', error);
    }
  }, { label: 'List API Keys', description: 'View all registered API keys' });

  subRouter.register('revoke-key', async () => {
    const publicKey = await prompt.text('Enter public key to revoke');
    StandardFormatter.info(`Revoking API key: ${publicKey}...`);
    logger.audit('REVOKE_API_KEY', { publicKey });
    StandardFormatter.warning('Key revocation requires direct database modification');
  }, { label: 'Revoke API Key', description: 'Disable an API key without deleting it' });

  await subRouter.start(context);
};

// ============================================================================
// MONITORING MENU
// ============================================================================
const monitoringMenu = async (context) => {
  const prompt = new StandardPrompt();
  const subRouter = new MenuRouter('System Monitoring');

  subRouter.register('check-balances', async () => {
    StandardFormatter.info('Checking Trinity member balances...');
    const { spawn } = require('child_process');
    const proc = spawn('node', ['scripts/utils/check-trinity-balances.js']);

    proc.stdout.on('data', (data) => console.log(data.toString()));
    proc.stderr.on('data', (data) => console.error(data.toString()));

    await new Promise(resolve => proc.on('close', resolve));
    logger.info('Trinity balances checked');
  }, { label: 'Check Balances', description: 'View Trinity member and reserve balances' });

  subRouter.register('health-check', async () => {
    StandardFormatter.subheader('System Health Check');

    const checks = [];

    // Check environment
    if (validator.validate()) {
      checks.push({ check: 'Environment', status: '✓ Valid' });
    } else {
      checks.push({ check: 'Environment', status: '✗ Invalid' });
    }

    // Check config files
    const requiredFiles = [
      'config/walletIdentities.js',
      'data/api-keys.json',
      'data/bible-wallets.json'
    ];

    requiredFiles.forEach(file => {
      const exists = fs.existsSync(path.join(__dirname, '..', file));
      checks.push({
        check: `Config: ${file}`,
        status: exists ? '✓ Found' : '✗ Missing'
      });
    });

    StandardFormatter.table(checks);
    logger.info('Health check completed');
  }, { label: 'Health Check', description: 'Run system health diagnostics' });

  subRouter.register('validate-env', async () => {
    StandardFormatter.info('Validating environment variables...');
    const { spawn } = require('child_process');
    const proc = spawn('node', ['scripts/validate-env.js']);

    proc.stdout.on('data', (data) => console.log(data.toString()));
    proc.stderr.on('data', (data) => console.error(data.toString()));

    await new Promise(resolve => proc.on('close', resolve));
    logger.info('Environment validated');
  }, { label: 'Validate Environment', description: 'Check all required environment variables' });

  await subRouter.start(context);
};

// ============================================================================
// DEPLOYMENT MENU
// ============================================================================
const deploymentMenu = async (context) => {
  const prompt = new StandardPrompt();
  const subRouter = new MenuRouter('Deployment & Setup');

  subRouter.register('list-setups', async () => {
    StandardFormatter.subheader('Available Setup Scripts');

    const setupDir = path.join(__dirname, 'setup');
    const files = fs.readdirSync(setupDir).filter(f => f.endsWith('.js'));

    const setups = files.map(f => ({
      script: f,
      description: '(see comments in file)'
    }));

    StandardFormatter.table(setups);
    logger.info('Listed setup scripts');
  }, { label: 'List Available Setups', description: 'View all deployment and setup scripts' });

  subRouter.register('initial-setup', async () => {
    StandardFormatter.warning('This is a critical operation. Proceed with caution.');
    const confirm = await prompt.confirm('Start initial system setup?', false);

    if (confirm) {
      StandardFormatter.info('Running initial setup...');
      const { spawn } = require('child_process');
      const proc = spawn('node', ['scripts/setup/finish-configuration.js']);

      proc.stdout.on('data', (data) => console.log(data.toString()));
      proc.stderr.on('data', (data) => console.error(data.toString()));

      await new Promise(resolve => proc.on('close', resolve));
      logger.audit('INITIAL_SETUP', { action: 'completed' });
    }
  }, { label: 'Initial Setup', description: 'Run complete system initialization' });

  subRouter.register('validate-deployment', async () => {
    StandardFormatter.info('Validating deployment configuration...');
    const config = path.join(__dirname, '..', 'config', 'walletIdentities.js');

    if (fs.existsSync(config)) {
      StandardFormatter.success('Deployment config found');
      logger.info('Deployment configuration validated');
    } else {
      StandardFormatter.error('Deployment config not found');
    }
  }, { label: 'Validate Deployment', description: 'Check deployment configuration' });

  await subRouter.start(context);
};

// ============================================================================
// AUDIT MENU
// ============================================================================
const auditMenu = async (context) => {
  const prompt = new StandardPrompt();
  const subRouter = new MenuRouter('Audit & Compliance');

  subRouter.register('view-logs', async () => {
    const logsDir = './logs';
    if (fs.existsSync(logsDir)) {
      const files = fs.readdirSync(logsDir).sort().reverse().slice(0, 10);
      StandardFormatter.subheader('Recent Log Files');
      files.forEach((file, i) => {
        console.log(`${i + 1}. ${file}`);
      });

      if (files.length > 0) {
        const choice = await prompt.text('\nEnter file number to view (or press Enter to skip)');
        if (choice) {
          const idx = parseInt(choice) - 1;
          if (idx >= 0 && idx < files.length) {
            const content = fs.readFileSync(path.join(logsDir, files[idx]), 'utf8');
            console.log('\n' + content);
          }
        }
      }
    } else {
      StandardFormatter.warning('Log directory not found');
    }
    logger.info('Audit logs viewed');
  }, { label: 'View Audit Logs', description: 'Review system audit trail' });

  subRouter.register('reconciliation', async () => {
    StandardFormatter.info('Running reconciliation check...');
    const { spawn } = require('child_process');
    const proc = spawn('node', ['scripts/reserve-mint.js', 'reconcile']);

    proc.stdout.on('data', (data) => console.log(data.toString()));
    proc.stderr.on('data', (data) => console.error(data.toString()));

    await new Promise(resolve => proc.on('close', resolve));
    logger.audit('RECONCILIATION', { action: 'completed' });
  }, { label: 'Reconciliation', description: 'Verify accounting and transaction records' });

  subRouter.register('query-donors', async () => {
    StandardFormatter.info('Querying donor records...');
    const { spawn } = require('child_process');
    const proc = spawn('node', ['scripts/reserve-mint.js', 'query-donors']);

    proc.stdout.on('data', (data) => console.log(data.toString()));
    proc.stderr.on('data', (data) => console.error(data.toString()));

    await new Promise(resolve => proc.on('close', resolve));
    logger.info('Donor records queried');
  }, { label: 'Query Donors', description: 'View donor and contribution history' });

  await subRouter.start(context);
};

// ============================================================================
// MAIN MENU SETUP
// ============================================================================

// Register main menu options
mainRouter.register('key-management', keyManagementMenu, {
  label: 'Key Management',
  description: 'Manage encryption keys, rotations, and security'
});

mainRouter.register('token-management', tokenManagementMenu, {
  label: 'Token Management',
  description: 'Mint/burn TALLY, manage reserves and supply'
});

mainRouter.register('team-management', teamManagementMenu, {
  label: 'Team & Credentials',
  description: 'Manage team members and SSH credentials'
});

mainRouter.register('governance', governanceMenu, {
  label: 'Governance & Covenants',
  description: 'Covenant ceremonies and partner governance'
});

mainRouter.register('api-keys', apiKeysMenu, {
  label: 'API Key Management',
  description: 'Create and manage API keys for integrations'
});

mainRouter.register('monitoring', monitoringMenu, {
  label: 'System Monitoring',
  description: 'Health checks and balance monitoring'
});

mainRouter.register('deployment', deploymentMenu, {
  label: 'Deployment & Setup',
  description: 'Contract deployment and system configuration'
});

mainRouter.register('audit', auditMenu, {
  label: 'Audit & Compliance',
  description: 'View logs, reconciliation, and compliance reports'
});

// Setup function
mainRouter.onSetup(async () => {
  if (!validator.validate()) {
    throw new Error('Environment validation failed');
  }
  logger.info('System CLI started');
});

// Cleanup function
mainRouter.onCleanup(async () => {
  logger.info('System CLI terminated');
});

// ============================================================================
// COMMAND-LINE ARGUMENT HANDLING
// ============================================================================

const args = process.argv.slice(2);

if (args.length > 0) {
  // Handle command-line arguments
  const command = args[0];

  const commands = {
    'key-management': keyManagementMenu,
    'token-management': tokenManagementMenu,
    'team-management': teamManagementMenu,
    'governance': governanceMenu,
    'api-keys': apiKeysMenu,
    'monitoring': monitoringMenu,
    'deployment': deploymentMenu,
    'audit': auditMenu
  };

  if (commands[command]) {
    mainRouter.onSetup(async () => {
      if (!validator.validate()) {
        throw new Error('Environment validation failed');
      }
    });

    commands[command]({}).catch(error => {
      StandardFormatter.error(error.message);
      process.exit(1);
    });
  } else if (command === 'help') {
    StandardFormatter.header('Convergence Protocol System CLI - Commands');
    console.log('Usage: node system-cli.js [command]\n');
    console.log('Available commands:');
    Object.keys(commands).forEach(cmd => {
      console.log(`  ${cmd.padEnd(20)} - Launch ${cmd} menu`);
    });
    console.log(`  help${' '.repeat(16)} - Show this help message`);
  } else {
    StandardFormatter.error(`Unknown command: ${command}`);
    console.log('Use "node system-cli.js help" for available commands');
    process.exit(1);
  }
} else {
  // Start interactive menu
  mainRouter.start({}).catch(error => {
    StandardFormatter.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}
