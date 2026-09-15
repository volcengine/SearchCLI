#!/usr/bin/env node

// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import fs from 'node:fs';
import path from 'node:path';

const REQUIRED_HEADINGS = ['## When to Use', '## Preconditions', '## Commands', '## Workflow', '## Constraints'];
const ALLOWED_CATEGORIES = new Set(['shared', 'app', 'data', 'search', 'recommend', 'chat', 'openapi', 'workflow']);
const ALLOWED_APPLIES_TO = new Set(['codex', 'agents', 'external-agent']);
const CLI_REQUIREMENT_PATTERN = /^>=\d+\.\d+\.\d+$/;

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const skillsRoot = path.resolve(process.argv[2] || path.join(repoRoot, 'skills'));
const availableCommands = listAvailableVikingCommands(path.join(repoRoot, 'src', 'commands'));

if (!fs.existsSync(skillsRoot)) {
  console.error(`[viking-skills] skills directory not found: ${skillsRoot}`);
  process.exit(1);
}

const skillDirs = fs
  .readdirSync(skillsRoot, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .sort();

const seenNames = new Set();
const errors = [];

for (const dirName of skillDirs) {
  const skillFile = path.join(skillsRoot, dirName, 'SKILL.md');
  if (!fs.existsSync(skillFile)) {
    errors.push(`[${dirName}] missing SKILL.md`);
    continue;
  }

  const content = fs.readFileSync(skillFile, 'utf8');
  const frontmatter = parseFrontmatter(content);
  if (!frontmatter) {
    errors.push(`[${dirName}] SKILL.md must start with YAML frontmatter`);
    continue;
  }

  const name = frontmatter.name?.trim();
  const description = frontmatter.description?.trim();
  const category = frontmatter.category?.trim();
  const appliesTo = parseCsvList(frontmatter.applies_to);
  const requiresCli = frontmatter.requires_cli?.trim();
  const keywords = parseCsvList(frontmatter.keywords);
  const commands = parseCsvList(frontmatter.commands);

  if (!name) {
    errors.push(`[${dirName}] frontmatter missing name`);
    continue;
  }
  if (!description) {
    errors.push(`[${dirName}] frontmatter missing description`);
  }
  if (!category) {
    errors.push(`[${dirName}] frontmatter missing category`);
  } else if (!ALLOWED_CATEGORIES.has(category)) {
    errors.push(`[${dirName}] unsupported category: ${category}`);
  }
  if (appliesTo.length === 0) {
    errors.push(`[${dirName}] frontmatter missing applies_to`);
  } else {
    for (const target of appliesTo) {
      if (!ALLOWED_APPLIES_TO.has(target)) {
        errors.push(`[${dirName}] unsupported applies_to target: ${target}`);
      }
    }
  }
  if (!requiresCli) {
    errors.push(`[${dirName}] frontmatter missing requires_cli`);
  } else if (!CLI_REQUIREMENT_PATTERN.test(requiresCli)) {
    errors.push(`[${dirName}] requires_cli must look like >=0.1.0`);
  }
  if (keywords.length === 0) {
    errors.push(`[${dirName}] frontmatter missing keywords`);
  }
  if (commands.length === 0) {
    errors.push(`[${dirName}] frontmatter missing commands`);
  } else {
    for (const command of commands) {
      if (!availableCommands.includes(command)) {
        errors.push(`[${dirName}] unknown command in commands: ${command}`);
      }
    }
  }
  if (name !== dirName) {
    errors.push(`[${dirName}] directory name must match skill name (${name})`);
  }
  if (seenNames.has(name)) {
    errors.push(`[${dirName}] duplicate skill name: ${name}`);
  }
  seenNames.add(name);

  for (const heading of REQUIRED_HEADINGS) {
    if (!content.includes(heading)) {
      errors.push(`[${dirName}] missing section heading: ${heading}`);
    }
  }
}

if (errors.length > 0) {
  console.error('[viking-skills] validation failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`[viking-skills] validated ${skillDirs.length} skill(s) in ${skillsRoot}`);

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return null;

  const raw = match[1];
  const result = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf(':');
    if (separator <= 0) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

function parseCsvList(value) {
  if (!value) return [];
  return value.split(',').map(entry => entry.trim()).filter(Boolean);
}

function listAvailableVikingCommands(commandsRoot) {
  if (!fs.existsSync(commandsRoot)) return [];
  const results = [];
  walkCommandTree(commandsRoot, commandsRoot, results);
  return results.sort();
}

function walkCommandTree(root, current, results) {
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const entryPath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      walkCommandTree(root, entryPath, results);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.ts') && !entry.name.endsWith('.js')) continue;
    const relative = path.relative(root, entryPath).replace(/\.(ts|js)$/, '');
    results.push(relative.split(path.sep).join(' '));
  }
}
