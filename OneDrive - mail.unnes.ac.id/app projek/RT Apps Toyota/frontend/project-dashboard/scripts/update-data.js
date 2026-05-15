#!/usr/bin/env node

/**
 * Auto-Update Script for Project Dashboard Data
 * Automatically updates project statistics based on actual project files
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

function countFiles(dir, extensions = null) {
  let count = 0;
  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    files.forEach(file => {
      if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
        count += countFiles(path.join(dir, file.name), extensions);
      } else if (file.isFile()) {
        if (!extensions || extensions.some(ext => file.name.endsWith(ext))) {
          count++;
        }
      }
    });
  } catch (error) {
    // Directory doesn't exist
  }
  return count;
}

function getGitStats() {
  try {
    const commits = execSync('git rev-list --count HEAD', { encoding: 'utf-8' }).trim();
    const lastCommit = execSync('git log -1 --format=%ai', { encoding: 'utf-8' }).trim();
    return { commits: parseInt(commits) || 0, lastCommit };
  } catch (error) {
    return { commits: 0, lastCommit: new Date().toISOString() };
  }
}

function updateProjectData() {
  log('\n📊 Analyzing project structure...', 'blue');

  const projectRoot = path.join(__dirname, '../../..');
  
  // Count files by type
  const backendFiles = countFiles(path.join(projectRoot, 'backend'), ['.ts', '.js']);
  const frontendFiles = countFiles(path.join(projectRoot, 'frontend'), ['.tsx', '.ts', '.jsx', '.js']);
  const totalFiles = backendFiles + frontendFiles;

  // Count database tables (from migrations)
  const migrationsPath = path.join(projectRoot, 'backend/database/src/migrations.ts');
  let tableCount = 0;
  if (fs.existsSync(migrationsPath)) {
    const content = fs.readFileSync(migrationsPath, 'utf-8');
    tableCount = (content.match(/CREATE TABLE/gi) || []).length;
  }

  // Count API endpoints
  const routesPath = path.join(projectRoot, 'backend/api-gateway/src/routes');
  let endpointCount = 0;
  if (fs.existsSync(routesPath)) {
    const files = fs.readdirSync(routesPath);
    files.forEach(file => {
      if (file.endsWith('.ts')) {
        const content = fs.readFileSync(path.join(routesPath, file), 'utf-8');
        endpointCount += (content.match(/router\.(get|post|put|delete|patch)/gi) || []).length;
      }
    });
  }

  // Get git statistics
  const gitStats = getGitStats();

  // Calculate progress
  const phases = [
    { name: 'Foundation', completed: true, progress: 100 },
    { name: 'Core Features', completed: true, progress: 100 },
    { name: 'Advanced Features', completed: false, progress: 60 },
    { name: 'Testing & QA', completed: false, progress: 40 },
    { name: 'Deployment', completed: false, progress: 20 },
  ];

  const completedPhases = phases.filter(p => p.completed).length;
  const overallProgress = Math.round((completedPhases / phases.length) * 100);

  log(`\n✓ Backend files: ${backendFiles}`, 'green');
  log(`✓ Frontend files: ${frontendFiles}`, 'green');
  log(`✓ Total files: ${totalFiles}`, 'green');
  log(`✓ Database tables: ${tableCount}`, 'green');
  log(`✓ API endpoints: ${endpointCount}`, 'green');
  log(`✓ Git commits: ${gitStats.commits}`, 'green');
  log(`✓ Overall progress: ${overallProgress}%`, 'green');

  // Update projectData.ts
  const projectDataPath = path.join(__dirname, '../src/data/projectData.ts');
  let projectData = fs.readFileSync(projectDataPath, 'utf-8');

  // Update statistics in the file
  projectData = projectData.replace(
    /totalEndpoints:\s*\d+/,
    `totalEndpoints: ${endpointCount}`
  );
  projectData = projectData.replace(
    /totalFiles:\s*\d+/,
    `totalFiles: ${totalFiles}`
  );
  projectData = projectData.replace(
    /totalTables:\s*\d+/,
    `totalTables: ${tableCount}`
  );
  projectData = projectData.replace(
    /overallProgress:\s*\d+/,
    `overallProgress: ${overallProgress}`
  );

  fs.writeFileSync(projectDataPath, projectData);
  log('\n✅ Project data updated successfully!', 'green');
}

try {
  updateProjectData();
} catch (error) {
  log(`\n❌ Error updating project data: ${error.message}`, 'red');
  process.exit(1);
}
