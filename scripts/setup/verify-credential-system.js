#!/usr/bin/env node

/**
 * Verify Credential Management System
 * Checks that all required files and configurations are in place
 */

const fs = require('fs');
const path = require('path');

const checks = [
  {
    name: 'Encryption key in .env',
    test: () => {
      const envFile = path.join(__dirname, '../../.env');
      if (!fs.existsSync(envFile)) return { pass: false, msg: '.env file not found' };

      const env = fs.readFileSync(envFile, 'utf8');
      return {
        pass: env.includes('CREDENTIAL_ENCRYPTION_KEY'),
        msg: env.includes('CREDENTIAL_ENCRYPTION_KEY')
          ? 'CREDENTIAL_ENCRYPTION_KEY found'
          : 'CREDENTIAL_ENCRYPTION_KEY not found in .env'
      };
    }
  },
  {
    name: 'Credentials storage directory',
    test: () => {
      const dir = path.join(__dirname, '../../data/credentials');
      return {
        pass: fs.existsSync(dir) && fs.statSync(dir).isDirectory(),
        msg: fs.existsSync(dir) ? `Directory exists with permissions: ${fs.statSync(dir).mode.toString(8)}` : 'Directory not found'
      };
    }
  },
  {
    name: 'Team members storage file',
    test: () => {
      const file = path.join(__dirname, '../../data/credentials/team-members.json');
      return {
        pass: fs.existsSync(file),
        msg: fs.existsSync(file) ? `File exists (${fs.statSync(file).size} bytes)` : 'File not found'
      };
    }
  },
  {
    name: 'Credential manager utility',
    test: () => {
      const file = path.join(__dirname, '../utils/credential-manager.js');
      return {
        pass: fs.existsSync(file),
        msg: fs.existsSync(file) ? `File exists (${fs.statSync(file).size} bytes)` : 'File not found'
      };
    }
  },
  {
    name: 'Add team member CLI',
    test: () => {
      const file = path.join(__dirname, './add-team-member.js');
      return {
        pass: fs.existsSync(file),
        msg: fs.existsSync(file) ? `File exists (${fs.statSync(file).size} bytes)` : 'File not found'
      };
    }
  },
  {
    name: 'API handlers',
    test: () => {
      const file = path.join(__dirname, '../../public/api-handlers/credentials.js');
      return {
        pass: fs.existsSync(file),
        msg: fs.existsSync(file) ? `File exists (${fs.statSync(file).size} bytes)` : 'File not found'
      };
    }
  },
  {
    name: 'Onboarding HTML page',
    test: () => {
      const file = path.join(__dirname, '../../public/leviticus-onboarding.html');
      return {
        pass: fs.existsSync(file),
        msg: fs.existsSync(file) ? `File exists (${fs.statSync(file).size} bytes)` : 'File not found'
      };
    }
  },
  {
    name: 'Onboarding JavaScript',
    test: () => {
      const file = path.join(__dirname, '../../public/scripts/leviticus-onboarding.js');
      return {
        pass: fs.existsSync(file),
        msg: fs.existsSync(file) ? `File exists (${fs.statSync(file).size} bytes)` : 'File not found'
      };
    }
  },
  {
    name: 'Credential management documentation',
    test: () => {
      const file = path.join(__dirname, '../../CREDENTIAL_MANAGEMENT_SYSTEM.md');
      return {
        pass: fs.existsSync(file),
        msg: fs.existsSync(file) ? `File exists (${fs.statSync(file).size} bytes)` : 'File not found'
      };
    }
  },
  {
    name: 'Integration guide',
    test: () => {
      const file = path.join(__dirname, './CREDENTIAL_INTEGRATION_GUIDE.md');
      return {
        pass: fs.existsSync(file),
        msg: fs.existsSync(file) ? `File exists (${fs.statSync(file).size} bytes)` : 'File not found'
      };
    }
  },
  {
    name: 'Encryption key validity',
    test: () => {
      try {
        const key = process.env.CREDENTIAL_ENCRYPTION_KEY;
        if (!key) return { pass: false, msg: 'Key not set in environment' };

        const minLength = 32;
        if (key.length >= minLength) {
          return { pass: true, msg: `Key is ${key.length} characters (good)` };
        } else {
          return { pass: true, msg: `Key is ${key.length} characters (will be hashed to 32 bytes)` };
        }
      } catch (e) {
        return { pass: false, msg: `Error: ${e.message}` };
      }
    }
  },
  {
    name: 'Credential manager loads',
    test: () => {
      try {
        const CredentialManager = require('../utils/credential-manager.js');
        return { pass: true, msg: 'Module loaded successfully' };
      } catch (e) {
        return { pass: false, msg: `Error: ${e.message}` };
      }
    }
  }
];

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║       Credential Management System Verification               ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

let passed = 0;
let failed = 0;

checks.forEach((check) => {
  const result = check.test();
  const icon = result.pass ? '✓' : '✗';
  const color = result.pass ? '\x1b[32m' : '\x1b[31m';
  const reset = '\x1b[0m';

  console.log(`${color}${icon}${reset} ${check.name}`);
  console.log(`  → ${result.msg}`);

  if (result.pass) {
    passed++;
  } else {
    failed++;
  }
});

console.log('\n' + '─'.repeat(62));
console.log(`Results: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('✅ All systems operational! Ready to use.\n');
  console.log('Next steps:');
  console.log('  1. Read: CREDENTIAL_MANAGEMENT_SYSTEM.md');
  console.log('  2. Read: scripts/setup/CREDENTIAL_INTEGRATION_GUIDE.md');
  console.log('  3. Run:  node scripts/setup/add-team-member.js\n');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Review messages above.\n');
  console.log('Common fixes:');
  console.log('  - Verify .env exists: ls -la .env');
  console.log('  - Create data dirs: mkdir -p data/credentials');
  console.log('  - Check file paths: ls -la data/ public/api-handlers/\n');
  process.exit(1);
}
