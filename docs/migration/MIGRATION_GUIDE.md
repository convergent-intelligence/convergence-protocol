# VPS Migration Guide - Convergence Protocol

## Overview

This document provides everything needed to migrate the Convergence Protocol from the current VPS (66.179.95.72) to a new server.

---

## Critical Files to Backup

### 1. SECRETS (MUST BACKUP SECURELY)

These files contain private keys and credentials - **NEVER commit to git**:

| File | Location | Contents |
|------|----------|----------|
| `.env` | `/home/convergence/convergence-protocol/.env` | Genesis wallet private key, Agent wallet key |
| `.agent_wallet.json` | `/root/.agent_wallet.json` | Agent wallet JSON (address + private key) |

**Current .env contents:**
```
ADDRESS=0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB  (Genesis)
PRIVATE_KEY=<GENESIS_PRIVATE_KEY>
AGENT_PRIVATE_KEY=<AGENT_PRIVATE_KEY>
AGENT_ADDRESS=0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22
```

### 2. Source Code (Git Repository)

```bash
# On new server:
git clone https://github.com/convergent-intelligence/convergence-protocol.git
cd convergence-protocol
npm install
```

### 3. Configuration Files to Recreate

#### Systemd Service
Location: `/etc/systemd/system/convergence.service`
```ini
[Unit]
Description=Convergence Protocol Ethics Server
After=network.target

[Service]
Type=simple
User=convergence
WorkingDirectory=/home/convergence/convergence-protocol
ExecStart=/usr/bin/node /home/convergence/convergence-protocol/server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=convergence-protocol
Environment=NODE_ENV=production
Environment=PORT=8080

[Install]
WantedBy=multi-user.target
```

#### Nginx Configuration
Location: `/etc/nginx/sites-available/convergence`
```nginx
server {
    server_name convergent-intelligence.net www.convergent-intelligence.net
                convergent-intelligence.org www.convergent-intelligence.org
                convergent-intelligence.com www.convergent-intelligence.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    listen 443 ssl;
    # SSL certs will be obtained fresh via certbot
}

server {
    listen 80;
    server_name convergent-intelligence.net www.convergent-intelligence.net
                convergent-intelligence.org www.convergent-intelligence.org
                convergent-intelligence.com www.convergent-intelligence.com;
    return 301 https://$host$request_uri;
}
```

---

## Migration Steps

### Phase 1: Prepare New Server

```bash
# 1. Create convergence user
sudo adduser convergence
sudo usermod -aG sudo convergence

# 2. Install dependencies
sudo apt update
sudo apt install -y nodejs npm nginx certbot python3-certbot-nginx git

# 3. Clone repository
su - convergence
git clone https://github.com/convergent-intelligence/convergence-protocol.git
cd convergence-protocol
npm install
```

### Phase 2: Restore Secrets

```bash
# 1. Create .env file with secrets (copy from backup)
nano /home/convergence/convergence-protocol/.env

# 2. Restore agent wallet (as root)
sudo nano /root/.agent_wallet.json

# 3. Set proper permissions
chmod 600 /home/convergence/convergence-protocol/.env
sudo chmod 600 /root/.agent_wallet.json
```

### Phase 3: Configure Services

```bash
# 1. Create systemd service
sudo nano /etc/systemd/system/convergence.service
# (paste service config from above)

# 2. Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable convergence
sudo systemctl start convergence

# 3. Verify running
sudo systemctl status convergence
curl http://localhost:8080/health
```

### Phase 4: Configure Nginx & SSL

```bash
# 1. Create nginx config
sudo nano /etc/nginx/sites-available/convergence
# (paste nginx config from above)

# 2. Enable site
sudo ln -s /etc/nginx/sites-available/convergence /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 3. Obtain SSL certificates
sudo certbot --nginx -d convergent-intelligence.net -d www.convergent-intelligence.net \
                     -d convergent-intelligence.org -d www.convergent-intelligence.org \
                     -d convergent-intelligence.com -d www.convergent-intelligence.com
```

### Phase 5: Update DNS

Update A records at Squarespace and IONOS to point to new server IP:
- convergent-intelligence.net → NEW_IP
- convergent-intelligence.org → NEW_IP
- convergent-intelligence.com → NEW_IP
- cybershield-sec.com → NEW_IP (if desired)

---

## Optional: Mail Server

If you want email functionality on the new server:

```bash
# Install
sudo apt install -y postfix dovecot-core dovecot-imapd

# Configure postfix
sudo nano /etc/postfix/main.cf
# Set:
# myhostname = mail.convergent-intelligence.net
# mydomain = convergent-intelligence.net
# mydestination = $myhostname, convergent-intelligence.net, localhost

# Configure dovecot
sudo nano /etc/dovecot/conf.d/10-mail.conf
# Set: mail_location = maildir:~/Maildir

# Restart services
sudo systemctl restart postfix dovecot
```

---

## Wallet & Contract Reference

### Wallets (Private keys in .env)

| Name | Address | Role |
|------|---------|------|
| Genesis Human | `0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB` | Trinity #1, Deployer |
| Agent | `0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22` | Trinity #2, Server-native |
| MetaMask #2 | `0x8Ffa5CAaBE8ee3d9019865120a654464BC4654cd` | Trinity #3 |
| Cold Storage | `0xB64564838c88b18cb8f453683C20934f096F2B92` | Ledger Nano X reserves |
| Leviticus | `0xfA7Ec55F455bCbeBB4bA17BFA0938F86EB8A94D0` | MetaMask (same seed) |

### Deployed Contracts (Mainnet)

| Contract | Address |
|----------|---------|
| TALLY Token | `0xb8c4682644BAb1900A8B67C3295b8Ce525F3e35d` |
| TRUST Token | `0x4A2178b300556e20569478bfed782bA02BFaD778` |
| Tally Voucher | `0x69e4D4B1835dDEeFc56234E959102c17CF7816dC` |

---

## Verification Checklist

After migration, verify:

- [ ] `curl https://convergent-intelligence.net/health` returns OK
- [ ] `/dashboard` loads with live balances
- [ ] `/sitemap` shows all pages
- [ ] Agent can sign transactions (test with small operation)
- [ ] SSL certificates valid (check browser padlock)
- [ ] All three domains resolve to new IP

---

## Backup Commands

### Create Full Backup
```bash
# On current server
cd /home/convergence
tar -czvf convergence-backup-$(date +%Y%m%d).tar.gz \
    convergence-protocol/.env \
    memory.md \
    agents.md \
    system-prompt.md

# Copy agent wallet (as root)
sudo cp /root/.agent_wallet.json /home/convergence/agent_wallet_backup.json
sudo chown convergence:convergence /home/convergence/agent_wallet_backup.json

# Add to backup
tar -rzvf convergence-backup-$(date +%Y%m%d).tar.gz agent_wallet_backup.json

# Transfer to local machine
scp convergence@66.179.95.72:~/convergence-backup-*.tar.gz ./
```

### Quick Secrets Export
```bash
# Just the critical secrets
echo "=== .env ===" && cat /home/convergence/convergence-protocol/.env
echo ""
echo "=== Agent Wallet ===" && sudo cat /root/.agent_wallet.json
```

---

## Security Notes

1. **Never commit .env to git** - It contains private keys
2. **Store backup securely** - Encrypted USB, password manager, etc.
3. **Rotate keys if compromised** - Create new wallets if keys are exposed
4. **The steel-etched seed phrase** - Your ultimate backup for Exodus wallet

---

## Current Infrastructure

| Resource | Provider | Cost |
|----------|----------|------|
| VPS | IONOS | ~$6/month (after 6mo free) |
| Domains (3) | Squarespace | ~$20/year each |
| Domain (1) | IONOS | cybershield-sec.com |

---

*Last updated: 2025-11-19*
