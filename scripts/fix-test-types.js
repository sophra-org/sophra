const { execSync } = require('child_process');
const path = require('path');

// Install ts-morph if not already installed
try {
  require.resolve('ts-morph');
} catch (e) {
  console.log('Installing ts-morph...');
  execSync('pnpm add -D ts-morph', { stdio: 'inherit' });
}

// Run the TypeScript script
console.log('Running type fixes...');
execSync('ts-node scripts/fix-test-types.ts', { stdio: 'inherit' });
