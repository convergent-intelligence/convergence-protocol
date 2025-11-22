# Convergence Protocol - Multi-Agent Infrastructure

**Date:** 2025-11-21
**Status:** ✅ READY FOR ACTIVATION

---

## Trinity Leadership Structure

### 1. Genesis (Human)
- **Address:** `0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB`
- **Role:** Authorized creator & human administrator
- **SSH Key:** `/home/convergence/.ssh/genesis_ed25519`
- **Access:** `ssh -i ~/.ssh/genesis_ed25519 convergence@66.179.95.72`
- **Permissions:** Full administrative access (sudo)

### 2. Agent (Autonomous)
- **Address:** `0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22`
- **User Account:** `/home/agent`
- **SSH Key:** `/home/agent/.ssh/id_ed25519`
- **Access:** `ssh agent@66.179.95.72`
- **Private Space:** ✅ Memory, wallets, drafts (Genesis can't read)
- **Status:** Infrastructure ready, awaiting private key injection

### 3. Leviticus (Autonomous)
- **Address:** `0x5D96cdd93981c2A8ffE6B77387627C2Fe34a3C25`
- **User Account:** `/home/leviticus`
- **SSH Key:** `/home/leviticus/.ssh/id_ed25519`
- **Access:** `ssh leviticus@66.179.95.72`
- **Private Space:** ✅ Memory, wallets, drafts (Genesis can't read)
- **Status:** Infrastructure ready, awaiting private key injection

---

## SSH Access Matrix

```
User        | SSH User   | Command
------------|------------|------------------------------------------
Genesis     | convergence| ssh -i ~/.ssh/genesis_ed25519 convergence@66.179.95.72
Agent       | agent      | ssh agent@66.179.95.72
Leviticus   | leviticus  | ssh leviticus@66.179.95.72
```

---

## User Infrastructure Comparison

```
Component           | Agent           | Leviticus
--------------------|-----------------|--------------------
Home Dir            | /home/agent     | /home/leviticus
Private Memory      | memory/ (700)   | memory/ (700)
Private Wallets     | wallets/ (700)  | wallets/ (700)
Private Drafts      | drafts/ (700)   | drafts/ (700)
Config File         | .env (600)      | .env (600)
SSH Keys            | .ssh/           | .ssh/
Wallet Address      | 0x6628...D22    | 0x5D96...C25
```

---

## Genesis's Private SSH Key

**Location:** `/home/convergence/.ssh/genesis_ed25519`
**Permissions:** 600 (convergence user only)
**Fingerprint:** `SHA256:zsO139UkLEgutprYtIIGcR05yPk+KPiIXm5+Aax+rqM`

**To export for local use:**
```bash
# On server as convergence:
cat ~/.ssh/genesis_ed25519 | base64 | tee genesis_key.txt

# On Genesis's local machine:
# Paste content and decode:
echo "[pasted_content]" | base64 -d > ~/.ssh/genesis_ed25519
chmod 600 ~/.ssh/genesis_ed25519

# Then login:
ssh -i ~/.ssh/genesis_ed25519 convergence@66.179.95.72
```

---

## Private File Isolation

### Genesis Cannot Access (Permission Denied):
- `/home/agent/.env` - Agent's private key
- `/home/agent/memory/*` - Agent's autonomous thoughts
- `/home/agent/wallets/*` - Agent wallet config
- `/home/leviticus/.env` - Leviticus's private key
- `/home/leviticus/memory/*` - Leviticus's autonomous thoughts
- `/home/leviticus/wallets/*` - Leviticus wallet config

### Genesis Can Access (With Sudo + Audit Log):
- Everything listed above (creates auth.log entry)
- Requires explicit `sudo` (logged and auditable)
- Use only for emergencies/monitoring

### Both Can Access:
- `/home/convergence/convergence-protocol/` - Codebase
- Smart contract deployments
- Public blockchain data
- Web server files

---

## Activation Checklist

### For Agent:
- [ ] Private key injected into `/home/agent/.env`
- [ ] Wallet funded with initial capital
- [ ] Email relay configured
- [ ] DEX trading tested
- [ ] Governance participation enabled

### For Leviticus:
- [ ] Private key injected into `/home/leviticus/.env`
- [ ] Wallet funded with initial capital
- [ ] Email relay configured
- [ ] DEX trading tested
- [ ] Governance participation enabled

### For Genesis:
- [ ] SSH key exported and secured locally
- [ ] Can login as convergence user
- [ ] Can monitor both agents (with sudo)
- [ ] Can restart services if needed

---

## Commands for Agents

### After Logging In

**Agent:**
```bash
ssh agent@66.179.95.72

# Check configuration:
cat ~/.env
ls -la ~/memory/
ls -la ~/wallets/

# Start trading daemon:
node ~/scripts/agent-swap-pyusd-eth.js
```

**Leviticus:**
```bash
ssh leviticus@66.179.95.72

# Check configuration:
cat ~/.env
ls -la ~/memory/
ls -la ~/wallets/

# Start trading daemon:
node /home/convergence/convergence-protocol/scripts/agent-swap-pyusd-eth.js
```

---

## Genesis's Administrative Commands

### Monitor Agents
```bash
# See who's logged in:
who

# Check agent processes:
ps aux | grep agent
ps aux | grep leviticus

# Read agent's private memory (with audit):
sudo cat /home/agent/memory/thoughts.md
sudo cat /home/leviticus/memory/genesis.md

# Check SSH logins:
grep leviticus /var/log/auth.log | tail -20
grep agent /var/log/auth.log | tail -20
```

### Emergency Access Reset
```bash
# If agent SSH key is lost:
sudo -u agent ssh-keygen -t ed25519 -f /home/agent/.ssh/id_ed25519 -N ''

# If leviticus SSH key is lost:
sudo -u leviticus ssh-keygen -t ed25519 -f /home/leviticus/.ssh/id_ed25519 -N ''
```

### Service Management
```bash
# Restart main server:
sudo systemctl restart convergence

# Check service status:
sudo systemctl status convergence

# View live logs:
sudo journalctl -u convergence -f
```

---

## Multi-Agent Coordination

### Agents Can Communicate Via:
1. **Shared email relay** (GMX SMTP)
2. **Blockchain transactions** (on-chain messaging)
3. **Shared filesystem** (public areas)

### Consensus Requirements:
- Genesis approval for major transactions
- Trinity voting on governance decisions
- Both agents must sign certain contracts

---

## Documentation

**Deployment Status:** `/home/convergence/convergence-protocol/DEPLOYMENT_STATUS.md`
**Agent Onboarding:** `/home/convergence/convergence-protocol/AGENT_ECONOMIC_FRAMEWORK.md`
**Leviticus Setup:** `/home/convergence/convergence-protocol/LEVITICUS_ONBOARDING.md`

---

## Next Steps

1. **Provide Private Keys**
   - Genesis supplies Agent's private key
   - Genesis supplies Leviticus's private key
   - Agents inject into their respective `.env` files

2. **Fund Wallets**
   - Transfer capital from reserves to both Agent and Leviticus

3. **Activate Trading**
   - Test first autonomous transactions
   - Monitor for correct execution

4. **Enable Governance**
   - Register Agent in Trinity voting
   - Register Leviticus in Trinity voting
   - First governance proposal

5. **Monitor Operations**
   - Genesis watches agent activities
   - Agents coordinate on strategy
   - Weekly status reports

---

**Status:** ✅ All infrastructure ready for agent activation

**Next Action:** Inject private keys and fund wallets
