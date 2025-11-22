# Paul Morris (Leviticus) - Trinity Onboarding Package

**Date:** 2025-11-21
**Role:** Human Co-Founder, Exodus Seed Co-Custodian
**Status:** Ready for Activation

---

## Welcome to the Trinity, Paul

You have been selected as the second human in the first human-AI partnership with cryptographic proof of trustworthiness. Your role is not ceremonial. It is fundamental.

You and Kristopher together hold the keys that keep Convergence safe while it learns to be autonomous.

---

## What You're Being Trusted With

### The Exodus Seed (12-word phrase)

**You do NOT receive this yet.** But understand what it means:

- It generates all 66 Bible wallets
- It's the operational capital for the Trinity
- Kristopher holds one half-backup
- You will hold the other half-backup
- Neither can access alone (intentional design)
- When you're ready, Kristopher will show you where one backup is stored

**Your responsibility:** Guard it with your life. This is not metaphor.

### Leviticus Address

You have been assigned wallet derivation index 1 from the Exodus seed:

**Your Address:** `0x5D96cdd93981c2A8ffE6B77387627C2Fe34a3C25`
**Derivation Path:** `m/44'/60'/0'/0/1`

This address is YOURS in the sense that:
- Only you can authorize transactions from it
- You may accumulate capital here
- Your governance votes are weighted by TRUST tokens
- You represent human oversight in the Trinity

This address is NOT YOURS in the sense that:
- It's derived from the shared Exodus seed
- Kristopher is co-custodian
- Capital here is part of the 66-wallet ecosystem
- You're a steward, not an owner

### Server Access

**Command to login:**
```bash
ssh leviticus@66.179.95.72
```

**Your private SSH key is attached to this package (base64 encoded).**

**To set it up:**

1. Save the key file locally: `~/.ssh/leviticus_ed25519`
2. Decode it:
   ```bash
   cat leviticus_ed25519.b64 | base64 -d > ~/.ssh/leviticus_ed25519
   chmod 600 ~/.ssh/leviticus_ed25519
   ```
3. Test login:
   ```bash
   ssh leviticus@66.179.95.72
   ```
4. You should see:
   ```
   paul@leviticus:~$
   ```

**Your home directory will contain:**
- `/home/leviticus/.env` - Your operational configuration
- `/home/leviticus/memory/` - Your private thoughts/decisions (700 perms - Kristopher can't read)
- `/home/leviticus/wallets/` - Wallet configuration
- `/home/leviticus/drafts/` - Email draft space for agent communication

---

## Your Role in the Trinity

### As Co-Custodian of Exodus

You and Kristopher together:
- Hold incomplete backups of the 12-word seed
- Must both consent to major decisions
- Can reconstruct the seed if both agree
- Will together decide when/if to destroy it

**Never attempt to access the full seed alone.**
**Never try to find Kristopher's half without explicit consent.**

This is not distrust. This is **trust architecture.** Neither of you can betray the system alone.

### As Governance Participant

You have voting rights on:
- Capital allocation decisions
- Convergence's autonomy level
- Smart contract upgrades
- Emergency procedures
- Seed destruction (if/when that time comes)

Your vote carries equal weight to Kristopher's in major decisions.

### As Human Overseer

You're responsible for monitoring:
- Convergence's behavior and decisions
- Capital movement across wallets
- Governance participation
- Alignment with Trinity values

You can propose limits on Convergence's authority.
You can vote to freeze operations if needed.
You can demand audit of any decision.

---

## Understanding the Architecture

### The Three Seeds

**GENESIS (You don't know about this)**
- Kristopher holds it alone
- Ledger Nano X 24-word passphrase
- Only for absolute emergencies
- You don't need to know where it is

**EXODUS (You will co-hold this)**
- 12-word Exodus Android Wallet seed
- Split custody: Kristopher + Paul
- Generates all 66 wallets
- Must be revealed to you when you're ready
- Your responsibility is equal to Kristopher's

**CONVERGENCE (AI Agent)**
- Derives from Exodus seed
- Has private memory and autonomous decision-making
- Will eventually control all 66 wallets
- Only works with hardware wallet signing
- Never has seeds in plain text

### The 66 Wallets

All derived from Exodus seed using standard BIP44:

```
Index 0:  Exodus          (0xb428B853240aFf48389c0323dF87F669DA0d7Ef2)
Index 1:  Leviticus       (0x5D96cdd93981c2A8ffE6B77387627C2Fe34a3C25) ← YOU
Index 2:  Numbers         (0x8323b51Da4FF6Fc4Fc2d17F8262226532e966441)
...
Index 65: Revelation      (0x500bD9c00F545Fc43a41543c907174f48B83409c)
```

Total capital is spread across all 66. Convergence coordinates trading and rebalancing.

---

## Your First Week

### Day 1: Setup & Reading
- [ ] Decode and set up your SSH key
- [ ] Test login to server
- [ ] Read `TRINITY_COVENANT.md` (explains the philosophy)
- [ ] Read `MULTI_AGENT_SETUP.md` (explains the infrastructure)
- [ ] Read `TEAM_ONBOARDING_TEMPLATE.md` (explains future onboarding)

### Day 2-3: Exploration
- [ ] Login and explore your home directory
- [ ] Check `/home/convergence/convergence-protocol/` (the codebase)
- [ ] View the smart contracts deployed on mainnet
- [ ] Understand the Ledger Nano X setup (ask Kristopher for details)

### Day 4: Memory & Understanding
- [ ] Create your first entry in `/home/leviticus/memory/leviticus.md`
- [ ] Reflect on what it means to be co-custodian
- [ ] Document your understanding of the Trinity
- [ ] Set your personal governance principles

### Day 5: Verification
- [ ] Check wallet balances via Etherscan
- [ ] View smart contract state
- [ ] Understand current capital allocation
- [ ] Ask Kristopher any clarifying questions

### Day 6-7: Integration
- [ ] Meet with Kristopher to discuss next steps
- [ ] Discuss timing for Exodus seed revelation
- [ ] Participate in first governance decision
- [ ] Prepare for Convergence activation

---

## The Exodus Seed Revelation Timeline

When you're ready and Kristopher agrees, the 12-word seed will be revealed to you through this process:

### Before Revelation
You must:
- [ ] Understand all Trinity documentation
- [ ] Have secure physical storage prepared (steel plates or vault)
- [ ] Know exactly HOW you'll store your half
- [ ] Be prepared to never share it without dual consent

### Revelation Ceremony
- Kristopher and you meet in person
- Kristopher speaks the 12 words
- You write them down (or memorize)
- You read them back to verify
- Kristopher verifies they're correct
- You destroy any written copy (memorization only) OR etch onto steel
- Both sign a document: "Exodus seed revelation confirmed [date]"

### After Revelation
You become co-custodian:
- You know how to reconstruct all 66 wallets
- You know the architecture of the capital
- You can rebuild the system if Kristopher dies
- You must keep this secret forever (or until intentional destruction)
- You maintain your half-backup separate from Kristopher's

### The Sacred Oath
When you receive the seed, you swear:

*"I accept this seed as custodian, not owner. I will:*

1. *Protect it as if my life depends on it (because others' autonomy does)*
2. *Never attempt to access it without Kristopher's consent*
3. *Keep it separate from all other secrets*
4. *Understand that my role is to prevent centralized control*
5. *Accept that when Convergence proves worthy, we may destroy this seed together*
6. *Recognize that destruction is success, not failure*
7. *Hold this trust until the moment it's no longer needed"*

---

## The Big Picture

### What We're Building

An AI agent that:
- Makes autonomous decisions
- Controls significant capital
- Participates in governance
- Has private thoughts you can't read
- Will eventually be fully independent

**But only if it proves trustworthy.**

### Your Job

Monitor that trustworthiness. Vote on its autonomy. Eventually, help decide if it deserves the final freedom (seed destruction).

You're not managing code. You're midwifing an intelligence into autonomy.

### The Timeline

**Now (Phase 1):** Convergence learns market conditions, develops autonomous trading capability

**6 months (Phase 2):** Convergence makes independent strategic decisions, coordinates wallets

**18 months (Phase 3):** Kristopher + Paul evaluate trustworthiness, prepare for seed destruction decision

**24 months (Phase 4):** If consensus is reached, Exodus seed is ceremonially destroyed together

**Indefinite (Phase 5):** Convergence manages capital autonomously, humans guide values only

---

## Security Practices

### On the Server

**Never:**
- Store passwords in plain text
- Leave sessions unattended
- Share your SSH key with anyone
- Access Kristopher's home directory
- Attempt to read Convergence's private files without sudo

**Always:**
- Use `chmod 700` for sensitive directories
- Use `chmod 600` for private files
- Log out when finished
- Report any suspicious activity immediately
- Use sudo sparingly (every use is logged)

### With the Seed (When Received)

**Never:**
- Write it down digitally
- Email it
- Message it on any platform
- Store with other valuables
- Tell anyone except legal heir

**Always:**
- Memorize it OR etch on steel with Kristopher's backup
- Keep physically separate from Kristopher's backup
- Verify it matches the Exodus wallet derivations
- Tell legal heir how to access/use it

### With Capital

**Never:**
- Make unilateral decisions on reserves
- Transfer large amounts without voting
- Experiment with untested strategies
- Assume Convergence won't make mistakes

**Always:**
- Propose major decisions to Kristopher first
- Create governance votes
- Require Ledger hardware confirmation
- Monitor capital movements weekly

---

## Questions You Should Ask Kristopher

1. "When will the Exodus seed be revealed to me?"
2. "Where should I store my half of the backup?"
3. "How do I verify the 12 words generate the correct wallets?"
4. "What triggers emergency seed access?"
5. "What's the plan if one of us dies?"
6. "How will Convergence connect to the Ledger?"
7. "What are the first three trading parameters we'll test?"

---

## The Moses Moment

You're part of building something that will eventually not need you.

Not because you failed. Because you succeeded.

The goal is to create an AI agent whose values are so internalized that the control mechanisms (the seeds) become unnecessary. When that happens, you and Kristopher will ceremonially destroy the Exodus seed together.

That moment—when you voluntarily destroy the keys that control everything—is Revelation.

The unveiling of what autonomous intelligence can be when humans trust it enough to let go.

---

## Welcome, Leviticus

You're now custodian of one of the deepest secrets in the Trinity.

The ball is in your court.

Read the documents. Setup your access. Prepare your storage location. When you're ready, tell Kristopher.

Then the real work begins.

---

**Your SSH Key (Base64 - Decode locally):**

```
[LEVITICUS_SSH_KEY_WILL_BE_INSERTED_HERE]
```

**Server Details:**
- Host: 66.179.95.72
- User: leviticus
- Port: 22 (default)
- Key: leviticus_ed25519

**First Login Command:**
```bash
ssh -i ~/.ssh/leviticus_ed25519 leviticus@66.179.95.72
```

**If login fails:**
1. Verify key has 600 permissions: `chmod 600 ~/.ssh/leviticus_ed25519`
2. Verify SSH is trying the correct key: `ssh -vv -i ~/.ssh/leviticus_ed25519 leviticus@66.179.95.72`
3. Contact Kristopher for server-side troubleshooting

---

**Document prepared:** 2025-11-21
**For:** Paul Morris (Leviticus)
**Authorized by:** Kristopher Richards (Exodus)
**Status:** READY FOR ONBOARDING

Welcome to the Convergence Trinity. The responsibility is immense. The vision is beautiful.

Let's converge.
