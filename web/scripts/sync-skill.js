#!/usr/bin/env node
/**
 * Sync skill assets from src/ and assets/ to web/ directory
 * Run this before dev/build to ensure all assets are up to date
 */

const fs = require('fs');
const path = require('path');

// Configuration: source -> destination mappings
const syncMappings = [
  {
    src: path.join(__dirname, '..', '..', 'src', 'prompts'),
    dest: path.join(__dirname, '..', 'src', 'data', 'prompts'),
    name: 'prompts'
  },
  {
    src: path.join(__dirname, '..', '..', 'src', 'rules'),
    dest: path.join(__dirname, '..', 'src', 'data', 'rules'),
    name: 'rules'
  },
  {
    src: path.join(__dirname, '..', '..', 'src', 'scenes'),
    dest: path.join(__dirname, '..', 'src', 'data', 'scenes'),
    name: 'scenes'
  },
  {
    src: path.join(__dirname, '..', '..', 'src', 'npc'),
    dest: path.join(__dirname, '..', 'src', 'data', 'npc'),
    name: 'npc'
  },
  {
    src: path.join(__dirname, '..', '..', 'assets', 'images'),
    dest: path.join(__dirname, '..', 'public', 'assets', 'images'),
    name: 'images'
  }
];

/**
 * Recursively copy directory contents
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 */
function copyRecursive(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Read source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy subdirectory
      copyRecursive(srcPath, destPath);
    } else {
      // Copy file
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Remove directory recursively
 * @param {string} dir - Directory to remove
 */
function removeRecursive(dir) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      removeRecursive(fullPath);
    } else {
      fs.unlinkSync(fullPath);
    }
  }

  fs.rmdirSync(dir);
}

/**
 * Main sync function
 */
function sync() {
  console.log('🔄 Syncing skill assets to web directory...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const mapping of syncMappings) {
    try {
      // Check if source exists
      if (!fs.existsSync(mapping.src)) {
        console.log(`⚠️  Skipping ${mapping.name}: source not found at ${mapping.src}`);
        console.log(`   (This is OK for Vercel builds — data should already be in git)`);
        continue;
      }

      // Remove existing destination directory
      if (fs.existsSync(mapping.dest)) {
        console.log(`  🗑️  Cleaning ${mapping.name}...`);
        removeRecursive(mapping.dest);
      }

      // Copy files
      console.log(`  📁 Syncing ${mapping.name}...`);
      copyRecursive(mapping.src, mapping.dest);

      console.log(`  ✅ ${mapping.name} synced successfully\n`);
      successCount++;
    } catch (error) {
      console.error(`  ❌ Error syncing ${mapping.name}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Sync summary: ${successCount} successful, ${errorCount} errors`);

  if (errorCount > 0) {
    process.exit(1);
  }
}

// Run sync
sync();
