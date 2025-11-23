# System CLI Guide

## Overview

The **System CLI** (`system-cli.js`) is the master command dispatcher for all Convergence Protocol server management. It provides a unified interface to manage keys, tokens, team credentials, governance operations, and deployments.

### Quick Start

```bash
# Interactive menu (default)
node scripts/system-cli.js

# Direct command (no menu)
node scripts/system-cli.js key-management
node scripts/system-cli.js token-management

# Help
node scripts/system-cli.js help
```

---

## Architecture

### Framework Components

The System CLI is built on the **StandardCLI Framework** (`utils/cli-framework.js`), which provides:

1. **StandardFormatter** - Consistent output formatting (colors, tables, menus)
2. **StandardPrompt** - Unified user input (text, password, menus, multi-select)
3. **MenuRouter** - Central command dispatcher with route registration
4. **Logger** - Audit trail and logging system
5. **EnvironmentValidator** - Configuration validation

### Menu Structure

```
System CLI (Main Menu)
├── Key Management
│   ├── List Features
│   ├── Exodus Seed Manager
│   ├── Pre-Rotation Audit
│   └── Vault Contributions
├── Token Management
│   ├── Reserve Status
│   ├── TALLY Supply
│   ├── Mint TALLY
│   └── Burn TALLY
├── Team & Credentials
│   ├── Add Team Member
│   ├── List Team Members
│   └── Manage Access
├── Governance & Covenants
│   ├── Ceremony Status
│   ├── Verify TALLY
│   ├── Partner Governance
│   └── Network Overview
├── API Key Management
│   ├── Create API Key
│   ├── List API Keys
│   └── Revoke API Key
├── System Monitoring
│   ├── Check Balances
│   ├── Health Check
│   └── Validate Environment
├── Deployment & Setup
│   ├── List Available Setups
│   ├── Initial Setup
│   └── Validate Deployment
└── Audit & Compliance
    ├── View Audit Logs
    ├── Reconciliation
    └── Query Donors
```

---

## Usage Modes

### 1. Interactive Menu (Default)

```bash
node scripts/system-cli.js
```

Launches the interactive menu system where you can:
- Navigate with numbered selections (1-9)
- View descriptions of each option
- Perform operations step-by-step

### 2. Direct Command

```bash
node scripts/system-cli.js key-management
```

Launches a specific menu directly, useful for scripting or automation.

### 3. Help Command

```bash
node scripts/system-cli.js help
```

Shows all available commands and how to use them.

---

## Main Menu Options

### 1. Key Management 🔑

Manage encryption keys, seed phrases, and key rotations.

**Available Features:**
- **List Features** - View all key management operations
- **Exodus Seed Manager** - Interactive seed phrase and derivation management (Python)
- **Pre-Rotation Audit** - Check key status before rotation
- **Vault Contributions** - View vault contribution history

**When to Use:**
- Managing HD wallet seeds
- Rotating keys for security/compliance
- Auditing key status
- Reviewing vault activities

---

### 2. Token Management 💰

Manage TALLY token supply, minting, burning, and reserves.

**Available Features:**
- **Reserve Status** - Check TALLY-USDT peg and reserve levels
- **TALLY Supply** - View total supply and distribution
- **Mint TALLY** - Mint new tokens (requires recipient address and amount)
- **Burn TALLY** - Burn TALLY to earn TRUST at 1:1.5 ratio

**When to Use:**
- Monitoring token reserves
- Minting tokens for donors
- Earning TRUST through burning
- Checking supply metrics

**Example Workflow:**
```
1. Check Reserve Status → Verify peg health
2. Mint TALLY → Create tokens for donor
3. Track TALLY Supply → Monitor distribution
```

---

### 3. Team & Credentials 👥

Manage team members and encrypted SSH credentials.

**Available Features:**
- **Add Team Member** - Onboard new team member with credentials
- **List Team Members** - View all registered members and status
- **Manage Access** - Update permissions and access levels

**When to Use:**
- Adding new team members
- Reviewing team roster
- Updating access permissions
- Credential management

**Important:**
- All credentials are encrypted
- SSH keys are stored securely
- Audit trail is maintained

---

### 4. Governance & Covenants ⚖️

Manage covenant ceremonies, TALLY verification, and partner governance.

**Available Features:**
- **Ceremony Status** - Check progress of covenant ceremony
- **Verify TALLY** - Verify TALLY ownership and Trinity status
- **Partner Governance** - View partner governance structure
- **Network Overview** - View network relationships and synthesis map

**When to Use:**
- Monitoring covenant progress
- Verifying Trinity membership
- Managing partner relationships
- Understanding network structure

**Trinity Status:**
```
TALLY holders (100+) → Trinity Member
Lower amounts → Regular member
Governance participation tracked
```

---

### 5. API Key Management 🔐

Create and manage API keys for integrations.

**Available Features:**
- **Create API Key** - Generate new API key with permissions
- **List API Keys** - View all registered keys and status
- **Revoke API Key** - Disable a key without deletion

**When to Use:**
- Setting up integrations
- Managing agent API access
- Rotating compromised keys
- Auditing API access

**Example:**
```
1. Create API Key for agent
2. Set permissions (read, write, etc.)
3. Distribute securely to agent
4. Monitor usage via logs
```

---

### 6. System Monitoring 📊

Health checks, balance monitoring, and system diagnostics.

**Available Features:**
- **Check Balances** - View Trinity member and reserve balances
- **Health Check** - Run system diagnostics (environment, configs, files)
- **Validate Environment** - Check all required environment variables

**When to Use:**
- Troubleshooting issues
- Verifying system health
- Checking balances
- Validating configuration

**Health Check Covers:**
- ✓ Environment variables
- ✓ Config file existence
- ✓ API keys status
- ✓ Data file integrity

---

### 7. Deployment & Setup 🚀

Contract deployment and system initialization.

**Available Features:**
- **List Available Setups** - View all deployment scripts
- **Initial Setup** - Run complete system initialization
- **Validate Deployment** - Check deployment configuration

**When to Use:**
- Fresh system installation
- Adding new components
- Verifying deployment config
- System reconfiguration

**Warning:** Initial Setup is a critical operation - review carefully before running.

---

### 8. Audit & Compliance 📋

View logs, reconciliation, and compliance reports.

**Available Features:**
- **View Audit Logs** - Review system audit trail
- **Reconciliation** - Verify accounting and transaction records
- **Query Donors** - View donor and contribution history

**When to Use:**
- Compliance reporting
- Transaction reconciliation
- Donor tracking
- Audit trail review

---

## Environment Configuration

### Required Variables

Before using the System CLI, ensure these are set in `.env`:

```bash
# Genesis wallet (admin operations)
GENESIS_***REMOVED***...    # Required for system operations
ADDRESS=0x...                # Genesis wallet address

# Agent wallet (autonomous operations)
AGENT_***REMOVED***...      # Required for agent operations
AGENT_ADDRESS=0x...          # Agent wallet address

# External services
INFURA_KEY=...               # RPC endpoint (recommended)
ETHERSCAN_KEY=...            # Contract verification (recommended)

# Security
CREDENTIAL_ENCRYPTION_KEY=... # For credential management (required)
```

### Validation

The CLI validates environment on startup. Missing required variables will show an error:

```bash
node scripts/validate-env.js
```

**Status Indicators:**
- ✅ GREEN - Valid value
- ❌ RED - Missing or invalid
- ⚠️ YELLOW - Warning (optional)

---

## Command-Line Examples

### List All Commands
```bash
$ node scripts/system-cli.js help

Available commands:
  key-management       - Launch key-management menu
  token-management     - Launch token-management menu
  team-management      - Launch team-management menu
  governance           - Launch governance menu
  api-keys             - Launch api-keys menu
  monitoring           - Launch monitoring menu
  deployment           - Launch deployment menu
  audit                - Launch audit menu
```

### Launch Specific Menu
```bash
# Open key management menu directly
$ node scripts/system-cli.js key-management

# Open token management menu
$ node scripts/system-cli.js token-management

# Start interactive mode
$ node scripts/system-cli.js
```

---

## Features Overview

### StandardFormatter

Beautiful, consistent output formatting:

```javascript
StandardFormatter.header('Title');           // Large header
StandardFormatter.subheader('Subtitle');     // Section subtitle
StandardFormatter.success('Operation done'); // ✓ Green message
StandardFormatter.error('Failed');           // ✗ Red message
StandardFormatter.warning('Be careful');     // ⚠ Yellow message
StandardFormatter.info('Information');       // ℹ Blue message
StandardFormatter.table(data);               // Formatted table
```

### StandardPrompt

User input with validation:

```javascript
const name = await prompt.text('Enter your name');
const pwd = await prompt.password('Enter password');
const confirmed = await prompt.confirm('Continue?', true);
const choice = await prompt.menu('Select option', options);
const selected = await prompt.select('Pick item', items);
```

### MenuRouter

Route registration and dispatch:

```javascript
const router = new MenuRouter('MyApp');

router.register('command', async (context) => {
  // Handler code
}, {
  label: 'Display Name',
  description: 'What this does'
});

await router.start();  // Start interactive menu
```

### Logger

Audit trail and logging:

```javascript
const logger = new Logger('app-name', './logs');

logger.info('Something happened');
logger.error('Error occurred', error);
logger.warning('Warning message');
logger.audit('ACTION', { user: 'alice', data: {} });
logger.success('Operation completed');
```

---

## Subprocess Integration

The System CLI launches several external scripts as subprocesses:

```
system-cli.js
├── exodus-seed-manager.py      (Python - key management)
├── reserve-mint.js             (Node - token operations)
├── tally-supply.js             (Node - supply metrics)
├── tally-burn.js               (Node - burn operations)
├── covenant-cli.js             (Node - governance)
├── pre-rotation-audit.js       (Node - audit)
└── [other specialized scripts]
```

**Communication:**
- STDOUT/STDERR piped to console
- Exit codes checked for errors
- Async/await for sequential execution

---

## Best Practices

### 1. Environment Setup
```bash
# Always validate before starting
node scripts/validate-env.js

# Check health regularly
node scripts/system-cli.js monitoring
# → Health Check
```

### 2. Key Rotation
```bash
node scripts/system-cli.js key-management
# → Pre-Rotation Audit
# → Exodus Seed Manager
# → Follow rotation prompts
```

### 3. Monitoring
```bash
# Regular health checks
node scripts/system-cli.js monitoring
# → Health Check

# Balance monitoring
node scripts/system-cli.js monitoring
# → Check Balances
```

### 4. Audit Trail
```bash
# Regular audit reviews
node scripts/system-cli.js audit
# → View Audit Logs
```

### 5. Error Handling

If a subprocess fails:
- Check error message for details
- Verify environment variables
- Try running the script directly
- Check log files in `./logs/`

---

## Testing

Run the test suite to verify all components:

```bash
# Run System CLI tests
node test/system-cli.test.js

# Expected output:
# ✅ Passed: 28
# ❌ Failed: 0
# 📈 Pass Rate: 100%
```

**What's tested:**
- CLI framework components
- Menu router functionality
- Module exports
- Environment validation
- Logger functionality

---

## Troubleshooting

### CLI Won't Start

**Error: "Environment validation failed"**
```bash
# Check your .env file
node scripts/validate-env.js

# Ensure all required variables are set
cat .env
```

**Error: "Cannot find module"**
```bash
# Reinstall dependencies
npm install

# Verify file paths
ls -la scripts/utils/cli-framework.js
```

### Menu Navigation Issues

**Input not responding:**
- Try pressing Enter again
- Ctrl+C to exit and restart

**Invalid selection:**
- Enter only the number (1-9)
- Don't include brackets or dashes

### Subprocess Errors

**Python script fails:**
```bash
# Check Python is installed
python3 --version

# Install requirements
pip install -r scripts/exodus-requirements.txt
```

**Node script fails:**
```bash
# Check Node version
node --version

# Verify dependencies
npm install
```

---

## Configuration Files

### Log Directory
```
./logs/
├── system-cli-2025-11-23.log
├── system-cli-2025-11-24.log
└── ...
```

### Data Directory
```
./data/
├── api-keys.json
├── bible-wallets.json
└── ...
```

### Config Directory
```
./config/
├── walletIdentities.js
└── ...
```

---

## Advanced Usage

### Running via SSH

```bash
# Remote execution
ssh user@host "cd /path && node scripts/system-cli.js key-management"

# With timeout
timeout 60 node scripts/system-cli.js monitoring
```

### Automation Scripts

```bash
#!/bin/bash
# Daily health check
0 */6 * * * cd /convergence && node scripts/system-cli.js monitoring > /var/log/convergence-health.log

# Weekly rotation audit
0 9 * * 0 cd /convergence && node scripts/system-cli.js key-management > /var/log/convergence-audit.log
```

---

## Integration with Other Tools

The System CLI integrates with:

- **Exodus Wallet** - Seed management and key derivation
- **Etherscan** - Contract verification and deployment
- **Infura** - RPC access and transaction broadcasting
- **Trinity Covenant** - Governance and member verification

---

## Performance Notes

- **Startup:** ~100-200ms
- **Menu Navigation:** ~50ms
- **Subprocess Launch:** ~500ms - 2s depending on script
- **Logging:** Minimal overhead (file I/O)

---

## Security Considerations

✅ **DO:**
- Use strong environment variables
- Keep `.env` out of version control
- Run from secure systems
- Review audit logs regularly
- Use encrypted credentials

❌ **DON'T:**
- Share private keys via chat/email
- Commit sensitive data to git
- Run with excessive permissions
- Trust unverified subprocess output
- Skip environment validation

---

## Support & Documentation

**Related Files:**
- `cli-framework.js` - Framework implementation
- `system-cli.js` - Main CLI file
- `exodus-seed-manager.py` - Seed management tool
- `EXODUS_MANAGER_FEATURES.md` - Key management guide
- `QUICK_START_GUIDE.md` - Exodus quick start

**Testing:**
- `test/system-cli.test.js` - Test suite

---

## Updates & Maintenance

### Checking for Updates

New features are added via commits. Check recent changes:

```bash
git log --oneline -n 10 -- scripts/system-cli.js
```

### Contributing

To extend the System CLI:

1. Add a new menu function
2. Register it with `mainRouter.register()`
3. Add tests to `test/system-cli.test.js`
4. Update this documentation

---

## Version Info

- **CLI Framework:** v2.0
- **System CLI:** v1.0
- **Last Updated:** 2025-11-23
- **Status:** Production Ready

---

## Glossary

| Term | Definition |
|------|-----------|
| **Trinity** | Members with 100+ TALLY tokens |
| **Covenant** | Smart contract governance system |
| **TALLY** | Native governance token |
| **TRUST** | Earned through TALLY burning (1:1.5 ratio) |
| **Seed** | BIP39 seed phrase for key derivation |
| **Rotation** | Creating new keys from existing seed |
| **HD Wallet** | Hierarchical Deterministic wallet (BIP44) |
| **API Key** | Credential for system integrations |

---

**For questions or issues, check the logs and ensure your environment is properly configured.**

✅ Ready to use the System CLI!
