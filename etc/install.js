const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting installation process...');

const nodeModulesPath = path.join(__dirname, 'node_modules');
const hasNodeModules = fs.existsSync(nodeModulesPath);

console.log(`node_modules folder ${hasNodeModules ? 'exists' : 'does not exist'}`);

try {
  const packageJson = require('../package.json');
  console.log('Package.json is valid JSON');
  console.log('Dependencies listed:');
  console.log(Object.keys(packageJson.dependencies).join(', '));
} catch (error) {
  console.error('Error reading package.json:', error.message);
}

try {
  if (hasNodeModules) {
    console.log('Removing existing node_modules...');
    execSync('rm -rf node_modules', { stdio: 'inherit' });
  }
  
  const lockFilePath = path.join(__dirname, 'package-lock.json');
  if (fs.existsSync(lockFilePath)) {
    console.log('Removing package-lock.json...');
    fs.unlinkSync(lockFilePath);
  }
} catch (error) {
  console.error('Error cleaning up:', error.message);
}

console.log('Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('Dependencies installed successfully');
} catch (error) {
  console.error('Error installing dependencies:', error.message);
}

try {
  const discordJsPath = path.join(__dirname, 'node_modules', 'discord.js');
  if (fs.existsSync(discordJsPath)) {
    console.log('discord.js is installed correctly');

    try {
      require('discord.js');
      console.log('discord.js can be imported successfully');
    } catch (error) {
      console.error('Error importing discord.js:', error.message);
    }
  } else {
    console.error('discord.js is not installed properly');
    console.log('Trying to install discord.js specifically...');
    try {
      execSync('npm install discord.js@14.17.3', { stdio: 'inherit' });
      console.log('discord.js installed separately');
    } catch (error) {
      console.error('Failed to install discord.js:', error.message);
    }
  }
} catch (error) {
  console.error('Error verifying installation:', error.message);
}

console.log('Installation process completed'); 