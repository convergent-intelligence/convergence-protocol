#!/usr/bin/env node

/**
 * Test Credentials API with EIP-191 Signature Verification
 *
 * Usage:
 *   node scripts/test-credentials-api.js [wallet-address] [private-key]
 *
 * Example:
 *   node scripts/test-credentials-api.js 0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB 0x...
 */

const { ethers } = require('ethers');
const http = require('http');

const SERVER_HOST = 'localhost';
const SERVER_PORT = 3000;

const GENESIS_WALLET = '0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB';

// Example test message
const TEST_MESSAGE = 'I authorize credential access';

/**
 * Make HTTP POST request
 */
function makeRequest(host, port, path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(body))
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * Test the credentials API
 */
async function testCredentialsAPI() {
  console.log('\n====================================');
  console.log('Credentials API Test Suite');
  console.log('====================================\n');

  // Get wallet address from args or use default
  const walletAddress = process.argv[2] || GENESIS_WALLET;
  const privateKey = process.argv[3];

  console.log(`Testing endpoint: POST /api/credentials/${walletAddress}`);
  console.log(`Server: http://${SERVER_HOST}:${SERVER_PORT}`);
  console.log(`Message: "${TEST_MESSAGE}"\n`);

  // Test 1: Missing signature
  console.log('Test 1: Missing signature (should return 401)');
  try {
    const response = await makeRequest(SERVER_HOST, SERVER_PORT,
      `/api/credentials/${walletAddress}`,
      { message: TEST_MESSAGE }
    );

    console.log(`  Status: ${response.statusCode}`);
    if (response.statusCode === 401) {
      console.log('  ✓ Correctly rejected request without signature\n');
    } else {
      console.log('  ✗ Expected 401, got', response.statusCode, '\n');
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    console.log(`  (Make sure server is running on http://${SERVER_HOST}:${SERVER_PORT})\n`);
  }

  // Test 2: Invalid signature
  console.log('Test 2: Invalid signature (should return 401)');
  try {
    const response = await makeRequest(SERVER_HOST, SERVER_PORT,
      `/api/credentials/${walletAddress}`,
      {
        message: TEST_MESSAGE,
        signature: '0x' + '0'.repeat(130) // Invalid signature format
      }
    );

    console.log(`  Status: ${response.statusCode}`);
    if (response.statusCode === 401) {
      console.log('  ✓ Correctly rejected invalid signature\n');
    } else {
      console.log('  ✗ Expected 401, got', response.statusCode, '\n');
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}\n`);
  }

  // Test 3: Valid signature (if private key provided)
  if (privateKey) {
    console.log('Test 3: Valid signature (should return 200)');
    try {
      // Create signer from private key
      const signer = new ethers.Wallet(privateKey);

      // Sign the message
      const signature = await signer.signMessage(TEST_MESSAGE);

      console.log(`  Signer: ${signer.address}`);
      console.log(`  Signature: ${signature.substring(0, 20)}...`);

      const response = await makeRequest(SERVER_HOST, SERVER_PORT,
        `/api/credentials/${signer.address}`,
        {
          message: TEST_MESSAGE,
          signature: signature
        }
      );

      console.log(`  Status: ${response.statusCode}`);

      try {
        const body = JSON.parse(response.body);
        if (response.statusCode === 200 && body.authenticated) {
          console.log('  ✓ Successfully authenticated and retrieved credentials\n');
          console.log('  Response:', body);
        } else if (response.statusCode === 404) {
          console.log('  ✓ Signature verified (404 is expected if credentials not found)\n');
          console.log('  Response:', body);
        } else {
          console.log('  ✗ Unexpected response\n');
          console.log('  Response:', body);
        }
      } catch (parseError) {
        console.log('  Response body:', response.body, '\n');
      }
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}\n`);
    }
  } else {
    console.log('Test 3: Valid signature (skipped - provide private key as second argument)\n');
  }

  // Test 4: Invalid wallet address format
  console.log('Test 4: Invalid wallet address (should return 400)');
  try {
    const response = await makeRequest(SERVER_HOST, SERVER_PORT,
      '/api/credentials/invalid-address',
      {
        message: TEST_MESSAGE,
        signature: '0x' + '0'.repeat(130)
      }
    );

    console.log(`  Status: ${response.statusCode}`);
    if (response.statusCode === 400) {
      console.log('  ✓ Correctly rejected invalid wallet address\n');
    } else {
      console.log('  ✗ Expected 400, got', response.statusCode, '\n');
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}\n`);
  }

  console.log('====================================');
  console.log('Test Suite Complete');
  console.log('====================================\n');

  console.log('For production deployment, ensure:');
  console.log('  ✓ All tests return expected status codes');
  console.log('  ✓ Signature verification is working correctly');
  console.log('  ✓ Credentials are properly encrypted and secure');
  console.log('  ✓ Key rotation has been completed to deviation 2');
  console.log('  ✓ API endpoints are accessible from client code\n');
}

// Run tests
testCredentialsAPI().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
