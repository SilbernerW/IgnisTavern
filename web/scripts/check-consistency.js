#!/usr/bin/env node
/**
 * Local consistency guard for the web workspace.
 *
 * Checks:
 * 1) src <-> web data web_dm_rules parity (single-source behavior)
 * 2) NPC dialogue files are bilingual-paired (_zh/_en) in both src and web data
 * 3) Legacy dialogue filenames without language suffix are rejected
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..', '..');
const srcNpc = path.join(repoRoot, 'src', 'npc');
const webNpc = path.join(repoRoot, 'web', 'src', 'data', 'npc');
const srcPrompts = path.join(repoRoot, 'src', 'prompts');
const webPrompts = path.join(repoRoot, 'web', 'src', 'data', 'prompts');

const errors = [];

function walkFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  const stack = [dir];
  while (stack.length > 0) {
    const cur = stack.pop();
    const entries = fs.readdirSync(cur, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(cur, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else out.push(full);
    }
  }
  return out;
}

function rel(file) {
  return path.relative(repoRoot, file).replace(/\\/g, '/');
}

function ensureFileEqual(a, b, label) {
  if (!fs.existsSync(a)) {
    errors.push(`[missing] ${label}: ${rel(a)}`);
    return;
  }
  if (!fs.existsSync(b)) {
    errors.push(`[missing] ${label}: ${rel(b)}`);
    return;
  }
  const ac = fs.readFileSync(a, 'utf-8');
  const bc = fs.readFileSync(b, 'utf-8');
  if (ac !== bc) {
    errors.push(`[mismatch] ${label}: ${rel(a)} != ${rel(b)}`);
  }
}

function checkDialoguePairing(baseDir, label) {
  const all = walkFiles(baseDir)
    .map(f => rel(f))
    .filter(f => /\/dialogue\/.*\.md$/i.test(f));

  const legacy = all.filter(f => !/_zh\.md$|_en\.md$/i.test(f));
  for (const file of legacy) {
    errors.push(`[legacy-name] ${label}: ${file} (must end with _zh.md or _en.md)`);
  }

  const grouped = new Map();
  for (const file of all) {
    if (!/_zh\.md$|_en\.md$/i.test(file)) continue;
    const key = file.replace(/_(zh|en)\.md$/i, '');
    if (!grouped.has(key)) grouped.set(key, new Set());
    const s = grouped.get(key);
    s.add(file.endsWith('_zh.md') ? 'zh' : 'en');
  }

  for (const [key, langs] of grouped.entries()) {
    if (!langs.has('zh') || !langs.has('en')) {
      errors.push(`[pair-missing] ${label}: ${key} requires both _zh.md and _en.md`);
    }
  }
}

function run() {
  // Single-source parity for web DM rules
  ensureFileEqual(
    path.join(srcPrompts, 'web_dm_rules_zh.md'),
    path.join(webPrompts, 'web_dm_rules_zh.md'),
    'web_dm_rules_zh parity'
  );
  ensureFileEqual(
    path.join(srcPrompts, 'web_dm_rules_en.md'),
    path.join(webPrompts, 'web_dm_rules_en.md'),
    'web_dm_rules_en parity'
  );

  // Bilingual pairing in npc dialogue trees
  checkDialoguePairing(srcNpc, 'src/npc dialogue');
  checkDialoguePairing(webNpc, 'web/src/data/npc dialogue');

  if (errors.length > 0) {
    console.error('\nConsistency check failed:\n');
    for (const e of errors) console.error(`- ${e}`);
    console.error('\nFix these issues before commit/push.\n');
    process.exit(1);
  }

  console.log('Consistency check passed.');
}

run();
