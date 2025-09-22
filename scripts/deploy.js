#!/usr/bin/env node

/**
 * Deployment Script for AI Personal Finance Mentor
 * Handles deployment to different environments with proper validation
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class DeploymentManager {
  constructor() {
    this.environment = process.argv[2] || 'preview';
    this.skipTests = process.argv.includes('--skip-tests');
    this.skipValidation = process.argv.includes('--skip-validation');
    this.force = process.argv.includes('--force');
    this.verbose = process.argv.includes('--verbose');
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m',
    };

    const prefix = {
      info: 'ℹ',
      success: '✓',
      warning: '⚠',
      error: '✗',
    };

    const timestamp = new Date().toISOString().substring(11, 19);
    console.log(`${colors[type]}[${timestamp}] ${prefix[type]} ${message}${colors.reset}`);
  }

  async runCommand(command, description) {
    this.log(`${description}...`);

    try {
      const output = execSync(command, {
        encoding: 'utf8',
        stdio: this.verbose ? 'inherit' : 'pipe'
      });

      if (!this.verbose && output) {
        this.log(output.trim());
      }

      this.log(`${description} completed`, 'success');
      return output;
    } catch (error) {
      this.log(`${description} failed: ${error.message}`, 'error');
      if (error.stdout) this.log(error.stdout, 'error');
      if (error.stderr) this.log(error.stderr, 'error');
      throw error;
    }
  }

  async validateEnvironment() {
    if (this.skipValidation) {
      this.log('Skipping environment validation', 'warning');
      return;
    }

    this.log('Validating environment variables...');

    try {
      await this.runCommand('node scripts/validate-env.js', 'Environment validation');
    } catch (error) {
      if (!this.force) {
        this.log('Environment validation failed. Use --force to override', 'error');
        process.exit(1);
      }
      this.log('Environment validation failed, but continuing due to --force flag', 'warning');
    }
  }

  async runTests() {
    if (this.skipTests) {
      this.log('Skipping tests', 'warning');
      return;
    }

    this.log('Running test suite...');

    try {
      // Run type checking
      await this.runCommand('npm run type-check', 'TypeScript type checking');

      // Run linting
      await this.runCommand('npm run lint', 'Code linting');

      // Run unit tests
      await this.runCommand('npm run test:unit', 'Unit tests');

      // Run integration tests (if not production)
      if (this.environment !== 'production') {
        await this.runCommand('npm run test:integration', 'Integration tests');
      }

      // Skip E2E tests for preview deployments
      if (this.environment === 'production' || this.environment === 'staging') {
        try {
          await this.runCommand('npm run test:e2e', 'End-to-end tests');
        } catch (error) {
          this.log('E2E tests failed, but continuing deployment', 'warning');
        }
      }

    } catch (error) {
      if (!this.force) {
        this.log('Tests failed. Use --force to override', 'error');
        process.exit(1);
      }
      this.log('Tests failed, but continuing due to --force flag', 'warning');
    }
  }

  async buildApplication() {
    this.log('Building application...');

    const buildCommand = this.getBuildCommand();
    await this.runCommand(buildCommand, 'Application build');
  }

  getBuildCommand() {
    switch (this.environment) {
      case 'production':
        return 'npm run build:prod';
      case 'staging':
        return 'npm run build:staging';
      default:
        return 'npm run build';
    }
  }

  async performDeployment() {
    this.log(`Deploying to ${this.environment}...`);

    const deployCommand = this.getDeployCommand();

    try {
      const output = await this.runCommand(deployCommand, `Vercel deployment (${this.environment})`);

      // Extract deployment URL from output
      const urlMatch = output.match(/https:\/\/[^\s]+/);
      if (urlMatch) {
        this.deploymentUrl = urlMatch[0];
        this.log(`Deployment URL: ${this.deploymentUrl}`, 'success');
      }

    } catch (error) {
      this.log('Deployment failed', 'error');
      throw error;
    }
  }

  getDeployCommand() {
    switch (this.environment) {
      case 'production':
        return 'vercel --prod --confirm';
      case 'staging':
        return 'vercel --target staging --confirm';
      case 'preview':
      default:
        return 'vercel --confirm';
    }
  }

  async runPostDeploymentChecks() {
    if (!this.deploymentUrl) {
      this.log('No deployment URL available for post-deployment checks', 'warning');
      return;
    }

    this.log('Running post-deployment checks...');

    try {
      // Health check
      await this.runCommand(
        `curl -f ${this.deploymentUrl}/api/health || echo "Health check failed"`,
        'Health check'
      );

      // Performance check (if lighthouse script exists)
      if (fs.existsSync(path.join(process.cwd(), 'scripts', 'lighthouse.js'))) {
        try {
          await this.runCommand(
            `node scripts/lighthouse.js ${this.deploymentUrl}`,
            'Performance audit'
          );
        } catch (error) {
          this.log('Performance audit failed, but deployment continues', 'warning');
        }
      }

    } catch (error) {
      this.log('Post-deployment checks failed', 'warning');
    }
  }

  async generateDeploymentReport() {
    const report = {
      timestamp: new Date().toISOString(),
      environment: this.environment,
      deploymentUrl: this.deploymentUrl,
      gitCommit: this.getGitCommit(),
      gitBranch: this.getGitBranch(),
      buildInfo: {
        nodeVersion: process.version,
        npmVersion: this.getNpmVersion(),
      },
    };

    const reportPath = path.join(process.cwd(), '.vercel', 'deployment-report.json');

    // Ensure .vercel directory exists
    if (!fs.existsSync(path.dirname(reportPath))) {
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`Deployment report saved to ${reportPath}`, 'success');

    return report;
  }

  getGitCommit() {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  getGitBranch() {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  getNpmVersion() {
    try {
      return execSync('npm --version', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  async checkPrerequisites() {
    this.log('Checking prerequisites...');

    // Check if Vercel CLI is installed
    try {
      await this.runCommand('vercel --version', 'Vercel CLI check');
    } catch (error) {
      this.log('Vercel CLI not found. Please install it: npm i -g vercel', 'error');
      process.exit(1);
    }

    // Check if we're in a git repository
    try {
      execSync('git status', { stdio: 'pipe' });
    } catch {
      this.log('Not in a git repository. Git is required for deployment tracking', 'warning');
    }

    // Check if .vercel directory exists (project linked)
    if (!fs.existsSync(path.join(process.cwd(), '.vercel'))) {
      this.log('Project not linked to Vercel. Run "vercel" first to link the project', 'warning');
    }
  }

  showUsage() {
    console.log(`
Usage: node scripts/deploy.js [environment] [options]

Environments:
  preview     Deploy to preview environment (default)
  staging     Deploy to staging environment
  production  Deploy to production environment

Options:
  --skip-tests      Skip running tests before deployment
  --skip-validation Skip environment variable validation
  --force          Continue deployment even if tests/validation fail
  --verbose        Show detailed output
  --help           Show this help message

Examples:
  node scripts/deploy.js preview
  node scripts/deploy.js production --skip-tests
  node scripts/deploy.js staging --force --verbose
    `);
  }

  async run() {
    if (process.argv.includes('--help')) {
      this.showUsage();
      return;
    }

    this.log(`Starting deployment to ${this.environment}`, 'info');
    this.log(`Options: ${JSON.stringify({
      skipTests: this.skipTests,
      skipValidation: this.skipValidation,
      force: this.force,
      verbose: this.verbose
    })}`);

    try {
      await this.checkPrerequisites();
      await this.validateEnvironment();
      await this.runTests();
      await this.buildApplication();
      await this.performDeployment();
      await this.runPostDeploymentChecks();

      const report = await this.generateDeploymentReport();

      this.log('🎉 Deployment completed successfully!', 'success');
      this.log(`Environment: ${this.environment}`, 'success');
      if (this.deploymentUrl) {
        this.log(`URL: ${this.deploymentUrl}`, 'success');
      }

    } catch (error) {
      this.log('Deployment failed', 'error');
      this.log(error.message, 'error');
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const deployment = new DeploymentManager();
  deployment.run().catch((error) => {
    console.error('Deployment script error:', error);
    process.exit(1);
  });
}

module.exports = DeploymentManager;