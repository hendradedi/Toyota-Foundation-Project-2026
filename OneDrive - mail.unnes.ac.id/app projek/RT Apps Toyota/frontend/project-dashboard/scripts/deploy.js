#!/usr/bin/env node

/**
 * Deployment Script for RT Apps Toyota Project Dashboard
 * Handles automatic deployment to GitHub Pages
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function exec(command, options = {}) {
  try {
    return execSync(command, { 
      stdio: 'inherit',
      ...options 
    });
  } catch (error) {
    log(`Error executing: ${command}`, 'red');
    throw error;
  }
}

async function deploy() {
  log('\n🚀 Starting deployment process...', 'blue');
  
  try {
    // Step 1: Check if git is initialized
    log('\n📋 Step 1: Checking git repository...', 'yellow');
    if (!fs.existsSync('.git')) {
      log('Git repository not found. Initializing...', 'yellow');
      exec('git init');
      log('✓ Git repository initialized', 'green');
    } else {
      log('✓ Git repository found', 'green');
    }

    // Step 2: Build the project
    log('\n📦 Step 2: Building project...', 'yellow');
    exec('npm run build');
    log('✓ Build completed successfully', 'green');

    // Step 3: Check for uncommitted changes
    log('\n📝 Step 3: Checking for changes...', 'yellow');
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf-8' });
      if (status.trim()) {
        log('Changes detected. Committing...', 'yellow');
        exec('git add .');
        const timestamp = new Date().toISOString();
        exec(`git commit -m "chore: auto-deploy dashboard - ${timestamp}"`);
        log('✓ Changes committed', 'green');
      } else {
        log('✓ No changes to commit', 'green');
      }
    } catch (error) {
      log('No changes to commit or error checking status', 'yellow');
    }

    // Step 4: Push to GitHub
    log('\n🌐 Step 4: Pushing to GitHub...', 'yellow');
    try {
      // Check if remote exists
      const remotes = execSync('git remote', { encoding: 'utf-8' });
      if (!remotes.includes('origin')) {
        log('⚠️  No remote repository configured', 'yellow');
        log('Please add a remote repository using:', 'yellow');
        log('  git remote add origin <your-github-repo-url>', 'blue');
        return;
      }

      // Get current branch
      const branch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
      log(`Pushing to branch: ${branch}`, 'yellow');
      
      exec(`git push origin ${branch}`);
      log('✓ Successfully pushed to GitHub', 'green');
    } catch (error) {
      log('⚠️  Push failed. Please check your remote configuration', 'red');
      log('You may need to set up authentication or add a remote repository', 'yellow');
    }

    log('\n✅ Deployment process completed!', 'green');
    log('\n📊 Dashboard URL will be available at:', 'blue');
    log('   https://<your-username>.github.io/<repo-name>/', 'blue');
    log('\n💡 To enable GitHub Pages:', 'yellow');
    log('   1. Go to your repository settings', 'yellow');
    log('   2. Navigate to Pages section', 'yellow');
    log('   3. Select branch and /out folder as source', 'yellow');
    
  } catch (error) {
    log('\n❌ Deployment failed!', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

// Run deployment
deploy();
