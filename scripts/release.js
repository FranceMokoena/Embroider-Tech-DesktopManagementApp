#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get the new version from command line argument
const newVersion = process.argv[2];

if (!newVersion) {
  console.error('❌ Please provide a version number (e.g., node scripts/release.js 1.0.1)');
  process.exit(1);
}

// Validate version format
if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error('❌ Version must be in format x.y.z (e.g., 1.0.1)');
  process.exit(1);
}

try {
  console.log(`🚀 Creating release for version ${newVersion}...`);
  
  // Update package.json version
  const packagePath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  packageJson.version = newVersion;
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  
  console.log('✅ Updated package.json version');
  
  // Create git tag
  execSync(`git add package.json`);
  execSync(`git commit -m "Bump version to ${newVersion}"`);
  execSync(`git tag v${newVersion}`);
  
  console.log('✅ Created git tag');
  
  // Push to GitHub
  execSync('git push origin main');
  execSync(`git push origin v${newVersion}`);
  
  console.log('✅ Pushed to GitHub');
  console.log(`🎉 Release ${newVersion} is being built and published automatically!`);
  console.log('📋 Check GitHub Actions for build progress');
  
} catch (error) {
  console.error('❌ Error creating release:', error.message);
  process.exit(1);
}
