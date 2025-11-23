/**
 * Unified CLI Framework for Convergence Protocol
 * Standardizes menu-driven interfaces, prompts, formatting, and error handling
 * All interactive scripts should use this framework for consistency
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

/**
 * StandardFormatter - Consistent output formatting
 */
class StandardFormatter {
  static header(title) {
    console.log(`\n${colors.bright}${colors.blue}${'═'.repeat(60)}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}  ${title}${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}${'═'.repeat(60)}${colors.reset}\n`);
  }

  static subheader(title) {
    console.log(`\n${colors.bright}${colors.cyan}▶ ${title}${colors.reset}`);
    console.log(`${colors.dim}${'─'.repeat(50)}${colors.reset}`);
  }

  static section(title) {
    console.log(`\n${colors.bright}${title}${colors.reset}`);
  }

  static success(message) {
    console.log(`${colors.green}✓${colors.reset} ${message}`);
  }

  static error(message) {
    console.log(`${colors.red}✗${colors.reset} ${colors.red}${message}${colors.reset}`);
  }

  static warning(message) {
    console.log(`${colors.yellow}⚠${colors.reset} ${colors.yellow}${message}${colors.reset}`);
  }

  static info(message) {
    console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
  }

  static highlight(message) {
    console.log(`${colors.bright}${colors.yellow}${message}${colors.reset}`);
  }

  static table(data, columns = null) {
    if (!data || data.length === 0) {
      console.log(`${colors.dim}(no data)${colors.reset}`);
      return;
    }

    const keys = columns || Object.keys(data[0]);
    const widths = {};

    // Calculate column widths
    keys.forEach(key => {
      widths[key] = Math.max(
        key.length,
        ...data.map(row => String(row[key] || '').length)
      );
    });

    // Print header
    const headerRow = keys
      .map(key => String(key).padEnd(widths[key]))
      .join(' │ ');
    console.log(`${colors.bright}${headerRow}${colors.reset}`);
    console.log(keys.map(key => '─'.repeat(widths[key])).join('─┼─'));

    // Print rows
    data.forEach(row => {
      const rowData = keys
        .map(key => String(row[key] || '').padEnd(widths[key]))
        .join(' │ ');
      console.log(rowData);
    });
  }

  static menu(title, options, selected = null) {
    this.subheader(title);
    options.forEach((option, index) => {
      const num = index + 1;
      const marker = selected === num ? `${colors.green}→${colors.reset}` : ' ';
      const highlight = option.disabled ? colors.dim : '';
      console.log(`${marker} ${colors.bright}[${num}]${colors.reset} ${highlight}${option.label}${colors.reset}`);
      if (option.description) {
        console.log(`    ${colors.dim}${option.description}${colors.reset}`);
      }
    });
  }

  static divider() {
    console.log(`${colors.dim}${'─'.repeat(60)}${colors.reset}`);
  }

  static footer(message) {
    console.log(`\n${colors.dim}${message}${colors.reset}`);
  }

  static json(data) {
    console.log(JSON.stringify(data, null, 2));
  }

  static clear() {
    console.clear();
  }
}

/**
 * StandardPrompt - Consistent user input handling
 */
class StandardPrompt {
  constructor() {
    this.rl = null;
  }

  /**
   * Initialize the readline interface
   */
  init() {
    if (this.rl) return;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });
  }

  /**
   * Clean up readline interface
   */
  close() {
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
  }

  /**
   * Single text input
   */
  async text(prompt, defaultValue = null) {
    this.init();
    return new Promise((resolve) => {
      const displayPrompt = defaultValue
        ? `${colors.cyan}${prompt}${colors.reset} [${colors.dim}${defaultValue}${colors.reset}]: `
        : `${colors.cyan}${prompt}${colors.reset}: `;

      this.rl.question(displayPrompt, (answer) => {
        resolve(answer || defaultValue);
      });
    });
  }

  /**
   * Hidden password input
   */
  async password(prompt) {
    this.init();
    return new Promise((resolve) => {
      this.rl.question(`${colors.cyan}${prompt}${colors.reset}: `, (answer) => {
        resolve(answer);
      });
    });
  }

  /**
   * Multiple choice menu
   */
  async menu(title, options) {
    StandardFormatter.menu(title, options);

    const choice = await this.text(`${colors.bright}Select option${colors.reset}`);
    const selected = parseInt(choice);

    if (isNaN(selected) || selected < 1 || selected > options.length) {
      StandardFormatter.error('Invalid selection');
      return this.menu(title, options);
    }

    if (options[selected - 1].disabled) {
      StandardFormatter.warning('This option is not available');
      return this.menu(title, options);
    }

    return {
      selected: selected,
      value: options[selected - 1].value,
      label: options[selected - 1].label
    };
  }

  /**
   * Confirm prompt
   */
  async confirm(prompt, defaultValue = true) {
    const response = await this.text(
      `${prompt} ${colors.dim}[${defaultValue ? 'Y/n' : 'y/N'}]${colors.reset}`,
      defaultValue ? 'y' : 'n'
    );
    return response.toLowerCase().startsWith('y');
  }

  /**
   * Select from list
   */
  async select(title, items, itemLabel = (item) => item) {
    const options = items.map((item, index) => ({
      label: itemLabel(item),
      value: index
    }));

    const result = await this.menu(title, options);
    return items[result.value];
  }

  /**
   * Multi-select from list
   */
  async multiSelect(title, items, itemLabel = (item) => item) {
    this.init();
    const selected = [];
    let index = 0;

    while (true) {
      StandardFormatter.clear();
      StandardFormatter.subheader(title);

      items.forEach((item, i) => {
        const marker = selected.includes(i) ? `${colors.green}[✓]${colors.reset}` : '[ ]';
        console.log(`${marker} ${i + 1}. ${itemLabel(item)}`);
      });

      console.log(`\n${colors.dim}Enter numbers to toggle (comma-separated), or 'done' to finish${colors.reset}`);
      const input = await this.text('Selections');

      if (input.toLowerCase() === 'done') {
        break;
      }

      const indices = input.split(',').map(x => parseInt(x.trim()) - 1);
      indices.forEach(i => {
        if (i >= 0 && i < items.length) {
          const idx = selected.indexOf(i);
          if (idx > -1) {
            selected.splice(idx, 1);
          } else {
            selected.push(i);
          }
        }
      });
    }

    return selected.map(i => items[i]);
  }
}

/**
 * MenuRouter - Central command dispatcher
 */
class MenuRouter {
  constructor(name = 'Application') {
    this.name = name;
    this.routes = {};
    this.setup = null;
    this.cleanup = null;
  }

  /**
   * Register a menu route
   */
  register(key, handler, options = {}) {
    this.routes[key] = {
      handler,
      label: options.label || key,
      description: options.description || '',
      disabled: options.disabled || false,
      requiresAuth: options.requiresAuth || false
    };
  }

  /**
   * Register setup function (runs once at startup)
   */
  onSetup(fn) {
    this.setup = fn;
  }

  /**
   * Register cleanup function (runs on exit)
   */
  onCleanup(fn) {
    this.cleanup = fn;
  }

  /**
   * Get route options for menu display
   */
  getMenuOptions() {
    return Object.entries(this.routes).map(([key, route]) => ({
      label: route.label,
      description: route.description,
      value: key,
      disabled: route.disabled
    }));
  }

  /**
   * Execute a route
   */
  async execute(key, context = {}) {
    if (!this.routes[key]) {
      StandardFormatter.error(`Route not found: ${key}`);
      return null;
    }

    const route = this.routes[key];

    try {
      return await route.handler(context);
    } catch (error) {
      StandardFormatter.error(`Error in ${route.label}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Start the interactive menu loop
   */
  async start(context = {}) {
    if (this.setup) {
      try {
        await this.setup();
      } catch (error) {
        StandardFormatter.error(`Setup failed: ${error.message}`);
        return;
      }
    }

    const prompt = new StandardPrompt();

    try {
      while (true) {
        try {
          StandardFormatter.clear();
          StandardFormatter.header(this.name);

          const options = this.getMenuOptions();
          options.push({ label: 'Exit', value: 'exit', description: 'Exit the application' });

          const result = await prompt.menu('Main Menu', options);

          if (result.value === 'exit') {
            StandardFormatter.info('Exiting...');
            break;
          }

          await this.execute(result.value, context);
          await prompt.text('\nPress Enter to continue');
        } catch (error) {
          StandardFormatter.error(error.message);
          await prompt.text('\nPress Enter to continue');
        }
      }
    } finally {
      prompt.close();
      if (this.cleanup) {
        await this.cleanup();
      }
    }
  }
}

/**
 * Logger - Unified logging with audit trail
 */
class Logger {
  constructor(name, logDir = './logs') {
    this.name = name;
    this.logDir = logDir;
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  getLogFile() {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `${this.name}-${date}.log`);
  }

  write(level, message, data = null) {
    const timestamp = new Date().toISOString();
    let logEntry = `[${timestamp}] [${level}] ${message}`;

    if (data) {
      logEntry += `\n${JSON.stringify(data, null, 2)}`;
    }
    logEntry += '\n';

    fs.appendFileSync(this.getLogFile(), logEntry);
  }

  info(message, data = null) {
    this.write('INFO', message, data);
    StandardFormatter.info(message);
  }

  error(message, data = null) {
    this.write('ERROR', message, data);
    StandardFormatter.error(message);
  }

  warning(message, data = null) {
    this.write('WARN', message, data);
    StandardFormatter.warning(message);
  }

  audit(action, details) {
    const auditEntry = {
      action,
      timestamp: new Date().toISOString(),
      user: process.env.USER || 'unknown',
      ...details
    };
    this.write('AUDIT', action, auditEntry);
  }

  success(message, data = null) {
    this.write('SUCCESS', message, data);
    StandardFormatter.success(message);
  }
}

/**
 * EnvironmentValidator - Check required environment at startup
 */
class EnvironmentValidator {
  constructor() {
    this.required = [];
    this.optionalVars = [];
    this.warnings = [];
  }

  require(key, description = '') {
    this.required.push({ key, description });
  }

  optional(key, description = '') {
    this.optionalVars.push({ key, description });
  }

  validate() {
    const errors = [];
    const warnings = [];

    // Check required
    this.required.forEach(({ key, description }) => {
      if (!process.env[key]) {
        errors.push(`Missing required: ${key}${description ? ' - ' + description : ''}`);
      }
    });

    // Check optional
    this.optionalVars.forEach(({ key, description }) => {
      if (!process.env[key]) {
        warnings.push(`Missing optional: ${key}${description ? ' - ' + description : ''}`);
      }
    });

    if (errors.length > 0) {
      StandardFormatter.error('Environment validation failed:');
      errors.forEach(err => console.log(`  • ${err}`));
      return false;
    }

    if (warnings.length > 0) {
      StandardFormatter.warning('Environment warnings:');
      warnings.forEach(warn => console.log(`  • ${warn}`));
    }

    return true;
  }
}

module.exports = {
  StandardFormatter,
  StandardPrompt,
  MenuRouter,
  Logger,
  EnvironmentValidator,
  colors
};
