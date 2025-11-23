# System CLI - Quick Reference

## Launch Commands

```bash
node scripts/system-cli.js              # Interactive menu
node scripts/system-cli.js help         # Show help
node scripts/system-cli.js key-management       # Specific menu
node scripts/system-cli.js token-management     # Specific menu
node scripts/system-cli.js team-management      # Specific menu
node scripts/system-cli.js governance           # Specific menu
node scripts/system-cli.js api-keys             # Specific menu
node scripts/system-cli.js monitoring           # Specific menu
node scripts/system-cli.js deployment           # Specific menu
node scripts/system-cli.js audit                # Specific menu
```

## Menu Navigation

| Symbol | Meaning |
|--------|---------|
| `[1-9]` | Menu options (type the number) |
| `[0]` | Exit/Go back |
| `✓ ACTIVE` | Currently in use |
| `✗ INACTIVE` | Archived/disabled |
| `→` | Currently selected |
| `ℹ` | Information message |
| `✓` | Success message |
| `✗` | Error message |
| `⚠` | Warning message |

## Key Management

```bash
node scripts/system-cli.js key-management

[1] List Features          → See all key operations
[2] Exodus Seed Manager    → Interactive seed management
[3] Pre-Rotation Audit     → Check key status
[4] Vault Contributions    → View vault history
```

## Token Management

```bash
node scripts/system-cli.js token-management

[1] Reserve Status    → Check TALLY-USDT peg
[2] TALLY Supply     → View total supply
[3] Mint TALLY       → Create tokens (needs address & amount)
[4] Burn TALLY       → Earn TRUST (1:1.5 ratio)
```

## Team Management

```bash
node scripts/system-cli.js team-management

[1] Add Team Member    → Onboard new member
[2] List Team Members  → View roster
[3] Manage Access      → Update permissions
```

## Governance

```bash
node scripts/system-cli.js governance

[1] Ceremony Status      → Check covenant progress
[2] Verify TALLY        → Verify Trinity status
[3] Partner Governance   → View partner structure
[4] Network Overview     → View relationships
```

## API Keys

```bash
node scripts/system-cli.js api-keys

[1] Create API Key    → Generate new key
[2] List API Keys     → View all keys
[3] Revoke API Key    → Disable a key
```

## System Monitoring

```bash
node scripts/system-cli.js monitoring

[1] Check Balances        → View member/reserve balances
[2] Health Check          → Run diagnostics
[3] Validate Environment  → Check .env variables
```

## Deployment

```bash
node scripts/system-cli.js deployment

[1] List Available Setups  → See setup scripts
[2] Initial Setup         → Full system initialization
[3] Validate Deployment   → Check config
```

## Audit & Compliance

```bash
node scripts/system-cli.js audit

[1] View Audit Logs   → Review activity trail
[2] Reconciliation    → Verify transactions
[3] Query Donors      → View contribution history
```

## Common Tasks

### Setup for First Time
```bash
node scripts/system-cli.js deployment
[2] Initial Setup
# Follow prompts to configure system
```

### Check System Health
```bash
node scripts/system-cli.js monitoring
[2] Health Check
# Verifies environment and config files
```

### Validate Configuration
```bash
node scripts/validate-env.js
# Shows all required variables and their status
```

### Manage Keys
```bash
node scripts/system-cli.js key-management
[2] Exodus Seed Manager
# Interactive menu for seed and key operations
```

### Mint Tokens
```bash
node scripts/system-cli.js token-management
[3] Mint TALLY
# Enter recipient address and amount
```

### Check Balances
```bash
node scripts/system-cli.js monitoring
[1] Check Balances
# View Trinity member and reserve balances
```

### Verify Trinity Status
```bash
node scripts/system-cli.js governance
[2] Verify TALLY
# Enter wallet address to check Trinity status
```

### View Audit Logs
```bash
node scripts/system-cli.js audit
[1] View Audit Logs
# Review system activity and operations
```

## Environment Variables Required

```
GENESIS_PRIVATE_KEY    (0x... format, 66 chars)
AGENT_PRIVATE_KEY      (0x... format, 66 chars)
ADDRESS                (0x... format, 42 chars)
AGENT_ADDRESS          (0x... format, 42 chars)
INFURA_KEY             (alphanumeric)
ETHERSCAN_KEY          (alphanumeric)
CREDENTIAL_ENCRYPTION_KEY  (random string)
```

Check status: `node scripts/validate-env.js`

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1-9` | Select menu option |
| `Enter` | Confirm selection |
| `Ctrl+C` | Exit immediately |
| `↑↓` | (if supported) Navigate options |

## File Locations

| Path | Purpose |
|------|---------|
| `scripts/system-cli.js` | Main CLI file |
| `scripts/utils/cli-framework.js` | Framework |
| `.env` | Configuration |
| `./logs/` | Activity logs |
| `./data/` | Data files |
| `./config/` | Configuration files |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Module not found" | Run `npm install` |
| "Invalid selection" | Enter only the number (1-9) |
| "Environment validation failed" | Check `.env` file with `node scripts/validate-env.js` |
| "Permission denied" | Run with correct user permissions |
| Menu unresponsive | Press Enter or Ctrl+C to exit |

## Log Locations

```
./logs/system-cli-YYYY-MM-DD.log    # Daily system logs
./logs/*/                            # Logs from other scripts
```

View logs:
```bash
tail -f ./logs/system-cli-*.log
```

## Test System

```bash
node test/system-cli.test.js
# Shows: Passed/Failed/Pass Rate
# Should show: 100% pass rate
```

## Performance Tips

- **First run**: ~200ms (initialization)
- **Menu navigation**: ~50ms
- **Subprocess execution**: 500ms - 2s
- **Use direct commands** for scripting (faster than menu)

## Security

✅ Safe operations:
- Read-only queries (balances, status, logs)
- Safe exports (public keys only)

⚠️ Sensitive operations:
- Adding team members
- Exporting private keys
- Minting tokens
- Rotating keys

Always:
- ✓ Keep `.env` out of git
- ✓ Use strong passwords
- ✓ Review logs regularly
- ✓ Follow security prompts

## Framework Classes

| Class | Purpose |
|-------|---------|
| `StandardFormatter` | Output formatting |
| `StandardPrompt` | User input |
| `MenuRouter` | Command routing |
| `Logger` | Audit logging |
| `EnvironmentValidator` | Config validation |

## Integration Scripts

| Script | Function |
|--------|----------|
| `exodus-seed-manager.py` | Seed/key management |
| `reserve-mint.js` | Token minting |
| `tally-supply.js` | Supply tracking |
| `covenant-cli.js` | Governance operations |
| `pre-rotation-audit.js` | Key audit |

## Quick Workflow: First Setup

```bash
# 1. Validate environment
node scripts/validate-env.js

# 2. Run initial setup
node scripts/system-cli.js deployment
# Select [2] Initial Setup

# 3. Check health
node scripts/system-cli.js monitoring
# Select [2] Health Check

# 4. Setup keys
node scripts/system-cli.js key-management
# Select [2] Exodus Seed Manager
# Select [1] Initial Setup
```

## Quick Workflow: Regular Maintenance

```bash
# Daily: Health check
node scripts/system-cli.js monitoring

# Weekly: Audit review
node scripts/system-cli.js audit

# Monthly: Key rotation (if needed)
node scripts/system-cli.js key-management

# As needed: Mint tokens
node scripts/system-cli.js token-management
```

---

**Need more details?** See `SYSTEM_CLI_GUIDE.md`

**Version:** 2.0 | **Updated:** 2025-11-23
