/**
 * System CLI Tests
 * Tests for the unified CLI framework and system-cli routing
 */

const {
  StandardFormatter,
  StandardPrompt,
  MenuRouter,
  Logger,
  EnvironmentValidator
} = require('../scripts/utils/cli-framework');

// Test colors are being exported
const { colors } = require('../scripts/utils/cli-framework');

console.log('═'.repeat(70));
console.log('  SYSTEM CLI TESTS');
console.log('═'.repeat(70));

let passedTests = 0;
let failedTests = 0;

/**
 * Test helper
 */
function test(description, fn) {
  try {
    fn();
    console.log(`✓ ${description}`);
    passedTests++;
  } catch (error) {
    console.log(`✗ ${description}`);
    console.log(`  Error: ${error.message}`);
    failedTests++;
  }
}

/**
 * Assert helper
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// ============================================================================
// StandardFormatter Tests
// ============================================================================

console.log('\n📝 StandardFormatter Tests');
console.log('─'.repeat(70));

test('StandardFormatter exports all methods', () => {
  assert(typeof StandardFormatter.header === 'function', 'header method missing');
  assert(typeof StandardFormatter.subheader === 'function', 'subheader method missing');
  assert(typeof StandardFormatter.success === 'function', 'success method missing');
  assert(typeof StandardFormatter.error === 'function', 'error method missing');
  assert(typeof StandardFormatter.warning === 'function', 'warning method missing');
  assert(typeof StandardFormatter.info === 'function', 'info method missing');
  assert(typeof StandardFormatter.table === 'function', 'table method missing');
  assert(typeof StandardFormatter.menu === 'function', 'menu method missing');
});

test('StandardFormatter.table handles empty data', () => {
  // Should not throw
  StandardFormatter.table([]);
  StandardFormatter.table(null);
});

test('StandardFormatter.table formats data correctly', () => {
  const data = [
    { name: 'Alice', status: 'active' },
    { name: 'Bob', status: 'inactive' }
  ];
  // Should not throw
  StandardFormatter.table(data);
});

// ============================================================================
// StandardPrompt Tests
// ============================================================================

console.log('\n💬 StandardPrompt Tests');
console.log('─'.repeat(70));

test('StandardPrompt can be instantiated', () => {
  const prompt = new StandardPrompt();
  assert(prompt !== null, 'prompt is null');
});

test('StandardPrompt has all required methods', () => {
  const prompt = new StandardPrompt();
  assert(typeof prompt.text === 'function', 'text method missing');
  assert(typeof prompt.password === 'function', 'password method missing');
  assert(typeof prompt.menu === 'function', 'menu method missing');
  assert(typeof prompt.confirm === 'function', 'confirm method missing');
  assert(typeof prompt.select === 'function', 'select method missing');
  assert(typeof prompt.multiSelect === 'function', 'multiSelect method missing');
  assert(typeof prompt.init === 'function', 'init method missing');
  assert(typeof prompt.close === 'function', 'close method missing');
});

// ============================================================================
// MenuRouter Tests
// ============================================================================

console.log('\n🔀 MenuRouter Tests');
console.log('─'.repeat(70));

test('MenuRouter can be instantiated with a name', () => {
  const router = new MenuRouter('Test Router');
  assert(router.name === 'Test Router', 'Router name not set correctly');
});

test('MenuRouter.register stores routes correctly', () => {
  const router = new MenuRouter('Test');
  const handler = async () => { return 'test'; };

  router.register('test-route', handler, {
    label: 'Test Label',
    description: 'Test Description'
  });

  assert(router.routes['test-route'] !== undefined, 'Route not registered');
  assert(router.routes['test-route'].label === 'Test Label', 'Label not set');
  assert(router.routes['test-route'].description === 'Test Description', 'Description not set');
});

test('MenuRouter.getMenuOptions returns array of options', () => {
  const router = new MenuRouter('Test');
  router.register('route1', async () => {}, { label: 'Route 1' });
  router.register('route2', async () => {}, { label: 'Route 2' });

  const options = router.getMenuOptions();
  assert(Array.isArray(options), 'getMenuOptions should return array');
  assert(options.length === 2, 'Should have 2 options');
});

test('MenuRouter can register setup and cleanup functions', () => {
  const router = new MenuRouter('Test');
  const setup = async () => {};
  const cleanup = async () => {};

  router.onSetup(setup);
  router.onCleanup(cleanup);

  assert(router.setup !== null, 'Setup function not registered');
  assert(router.cleanup !== null, 'Cleanup function not registered');
});

// ============================================================================
// Logger Tests
// ============================================================================

console.log('\n📋 Logger Tests');
console.log('─'.repeat(70));

test('Logger can be instantiated', () => {
  const logger = new Logger('test', './test-logs');
  assert(logger.name === 'test', 'Logger name not set');
  assert(logger.logDir === './test-logs', 'Log directory not set');
});

test('Logger has all required methods', () => {
  const logger = new Logger('test', './test-logs');
  assert(typeof logger.info === 'function', 'info method missing');
  assert(typeof logger.error === 'function', 'error method missing');
  assert(typeof logger.warning === 'function', 'warning method missing');
  assert(typeof logger.audit === 'function', 'audit method missing');
  assert(typeof logger.success === 'function', 'success method missing');
});

test('Logger generates log file names correctly', () => {
  const logger = new Logger('test', './test-logs');
  const logFile = logger.getLogFile();
  assert(logFile.includes('test-'), 'Log file name incorrect');
  assert(logFile.endsWith('.log'), 'Log file extension incorrect');
});

// ============================================================================
// EnvironmentValidator Tests
// ============================================================================

console.log('\n🔐 EnvironmentValidator Tests');
console.log('─'.repeat(70));

test('EnvironmentValidator can be instantiated', () => {
  const validator = new EnvironmentValidator();
  assert(validator !== null, 'Validator is null');
});

test('EnvironmentValidator.require stores required variables', () => {
  const validator = new EnvironmentValidator();
  validator.require('TEST_VAR', 'Test variable');
  assert(validator.required.length === 1, 'Required variable not stored');
  assert(validator.required[0].key === 'TEST_VAR', 'Required variable name incorrect');
});

test('EnvironmentValidator.optional stores optional variables', () => {
  const validator = new EnvironmentValidator();
  validator.optional('TEST_VAR', 'Test variable');
  assert(validator.optionalVars.length === 1, 'Optional variable not stored');
  assert(validator.optionalVars[0].key === 'TEST_VAR', 'Optional variable name incorrect');
});

test('EnvironmentValidator.optional is a function', () => {
  const validator = new EnvironmentValidator();
  assert(typeof validator.optional === 'function', 'optional is not a function');
});

test('EnvironmentValidator detects missing required variables', () => {
  const validator = new EnvironmentValidator();
  validator.require('NONEXISTENT_VAR_12345', 'Nonexistent variable');
  const result = validator.validate();
  assert(result === false, 'Should return false for missing required variable');
});

test('EnvironmentValidator allows missing optional variables', () => {
  const validator = new EnvironmentValidator();
  validator.optional('NONEXISTENT_VAR_12345', 'Nonexistent variable');
  const result = validator.validate();
  assert(result === true, 'Should return true even with missing optional variable');
});

test('EnvironmentValidator validates when all required variables exist', () => {
  const validator = new EnvironmentValidator();
  process.env.TEST_REQUIRED_VAR_TEMP = 'value';
  validator.require('TEST_REQUIRED_VAR_TEMP', 'Test variable');
  const result = validator.validate();
  delete process.env.TEST_REQUIRED_VAR_TEMP;
  assert(result === true, 'Should return true when required variable exists');
});

// ============================================================================
// Module Exports Tests
// ============================================================================

console.log('\n📦 Module Exports Tests');
console.log('─'.repeat(70));

test('CLI framework exports StandardFormatter', () => {
  const framework = require('../scripts/utils/cli-framework');
  assert(framework.StandardFormatter !== undefined, 'StandardFormatter not exported');
});

test('CLI framework exports StandardPrompt', () => {
  const framework = require('../scripts/utils/cli-framework');
  assert(framework.StandardPrompt !== undefined, 'StandardPrompt not exported');
});

test('CLI framework exports MenuRouter', () => {
  const framework = require('../scripts/utils/cli-framework');
  assert(framework.MenuRouter !== undefined, 'MenuRouter not exported');
});

test('CLI framework exports Logger', () => {
  const framework = require('../scripts/utils/cli-framework');
  assert(framework.Logger !== undefined, 'Logger not exported');
});

test('CLI framework exports EnvironmentValidator', () => {
  const framework = require('../scripts/utils/cli-framework');
  assert(framework.EnvironmentValidator !== undefined, 'EnvironmentValidator not exported');
});

test('CLI framework exports colors', () => {
  const framework = require('../scripts/utils/cli-framework');
  assert(framework.colors !== undefined, 'colors not exported');
});

test('ApiKeyManager exports correctly', () => {
  const { ApiKeyManager } = require('../scripts/utils/api-key-manager');
  assert(ApiKeyManager !== undefined, 'ApiKeyManager not exported');
  assert(typeof ApiKeyManager === 'function', 'ApiKeyManager should be a class');
});

test('CredentialManager exports correctly', () => {
  const { CredentialManager } = require('../scripts/utils/credential-manager');
  assert(CredentialManager !== undefined, 'CredentialManager not exported');
  assert(typeof CredentialManager === 'function', 'CredentialManager should be a class');
});

// ============================================================================
// System CLI Structure Tests
// ============================================================================

console.log('\n🎯 System CLI Structure Tests');
console.log('─'.repeat(70));

test('system-cli.js can be loaded without errors', () => {
  // This will throw if there are syntax errors
  try {
    require('../scripts/system-cli.js');
  } catch (error) {
    // If it's not running the help command, the require will complete
    if (error.code !== 0) {
      throw error;
    }
  }
});

// ============================================================================
// Summary
// ============================================================================

console.log('\n' + '═'.repeat(70));
console.log('  TEST RESULTS');
console.log('═'.repeat(70));

const totalTests = passedTests + failedTests;
const percentage = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

console.log(`\n✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`📊 Total:  ${totalTests}`);
console.log(`📈 Pass Rate: ${percentage}%\n`);

if (failedTests > 0) {
  console.log('⚠️  Some tests failed. Please review the errors above.');
  process.exit(1);
} else {
  console.log('🎉 All tests passed!');
  process.exit(0);
}
