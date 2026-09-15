// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { EMBEDDED_REPO_SKILLS } from './embedded-repo-skills';
import { VERSION } from '../version';

const REQUIRED_HEADINGS = ['## When to Use', '## Preconditions', '## Commands', '## Workflow', '## Constraints'] as const;
export const REPO_SKILL_CATEGORIES = ['shared', 'app', 'data', 'search', 'recommend', 'chat', 'workflow'] as const;
export const REPO_SKILL_TARGETS = ['codex', 'agents', 'external-agent'] as const;
const DEFAULT_REPO_SKILL_COMMANDS = ['skill list', 'skill show'] as const;
const SKILL_NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const CLI_REQUIREMENT_PATTERN = /^>=\d+\.\d+\.\d+$/;
const GLOBAL_AGENT_SKILL_DIRS = [
  '.agents/skills',
  '.codex/skills',
  '.augment/skills',
  '.bob/skills',
  '.claude/skills',
  '.codebuddy/skills',
  '.commandcode/skills',
  '.continue/skills',
  '.snowflake/cortex/skills',
  '.config/crush/skills',
  '.factory/skills',
  '.config/goose/skills',
  '.junie/skills',
  '.iflow/skills',
  '.kilocode/skills',
  '.kiro/skills',
  '.kode/skills',
  '.mcpjam/skills',
  '.vibe/skills',
  '.mux/skills',
  '.openclaw/skills',
  '.openhands/skills',
  '.pi/agent/skills',
  '.pochi/skills',
  '.qoder/skills',
  '.qwen/skills',
  '.roo/skills',
  '.trae/skills',
  '.trae-cn/skills',
  '.codeium/windsurf/skills',
  '.zencoder/skills',
  '.neovate/skills',
  '.adal/skills'
] as const;
const FALLBACK_COMMANDS = [
  'app create',
  'app dataset bind',
  'app dataset-config get',
  'app dataset-config list',
  'app dataset-config update',
  'app delete',
  'app diagnose',
  'app get',
  'app list',
  'app online-config get',
  'app online-config update',
  'app status',
  'app update',
  'app wait-ready',
  'auth import-env',
  'auth list',
  'auth login',
  'auth logout',
  'auth status',
  'auth use',
  'chat run',
  'data import',
  'data write',
  'dataset create',
  'dataset delete',
  'dataset get',
  'dataset ingest',
  'dataset list',
  'dataset schema check',
  'dataset schema get',
  'dataset update',
  'doctor',
  'item apply',
  'item plan',
  'item profile',
  'recommend run',
  'recommend scene create',
  'recommend scene delete',
  'recommend scene get',
  'recommend scene list',
  'recommend scene update',
  'search run',
  'search scene create',
  'search scene delete',
  'search scene get',
  'search scene list',
  'search scene update',
  'skill install',
  'skill init',
  'skill list',
  'skill search',
  'skill show',
  'skill validate'
] as const;

export interface RepoSkill {
  name: string;
  title: string;
  description: string;
  category: RepoSkillCategory;
  appliesTo: RepoSkillTarget[];
  requiresCli: string;
  compatibility: RepoSkillCompatibility;
  keywords: string[];
  commands: string[];
  commandSummaries: RepoSkillCommandSummary[];
  whenToUse: string;
  whenToUseSummary: string;
  preconditions: string[];
  workflow: string[];
  constraints: string[];
  installCommand: string;
  sourcePath: string;
  kind: 'repo';
  installable: true;
  installedTargets: string[];
  availableTargets: string[];
}

export interface RepoSkillCommandSummary {
  command: string;
  description: string;
}

export type RepoSkillCategory = typeof REPO_SKILL_CATEGORIES[number];
export type RepoSkillTarget = typeof REPO_SKILL_TARGETS[number];
export type SkillInstallTargetMode = 'auto' | 'global' | 'codex' | 'agents' | 'trae' | 'trae-cn';

export interface RepoSkillValidationResult {
  root: string;
  cliVersion: string;
  skills: RepoSkill[];
  errors: string[];
  availableCommands: string[];
}

export interface InstallRepoSkillsOptions {
  names?: string[];
  dest?: string;
  targetMode?: SkillInstallTargetMode;
  force?: boolean;
  root?: string;
}

export interface InstallRepoSkillsResult {
  root: string;
  cliVersion: string;
  targetMode: SkillInstallTargetMode;
  targets: string[];
  installed: Array<{
    name: string;
    target: string;
  }>;
}

export interface RepoSkillCompatibility {
  cliVersion: string;
  ok: boolean;
  required: string;
  minimumVersion: string;
}

export interface RepoSkillListItem {
  name: string;
  title: string;
  description: string;
  category: RepoSkillCategory;
  appliesTo: RepoSkillTarget[];
  requiresCli: string;
  compatibility: RepoSkillCompatibility;
  keywords: string[];
  topCommands: string[];
  whenToUseSummary: string;
  installCommand: string;
  sourcePath: string;
}

export interface RepoSkillSearchItem extends RepoSkillListItem {
  score: number;
  matchedFields: string[];
}

interface RepoSkillManifest {
  skills: Array<{
    name: string;
    files: string[];
  }>;
}

export interface CreateRepoSkillOptions {
  name: string;
  root?: string;
  title?: string;
  description?: string;
  category?: RepoSkillCategory;
  appliesTo?: RepoSkillTarget[];
  requiresCli?: string;
  keywords?: string[];
  commands?: string[];
  force?: boolean;
}

export interface CreateRepoSkillResult {
  root: string;
  name: string;
  created: true;
  skillDir: string;
  skillFile: string;
  validation: RepoSkillValidationResult;
}

export function getRepoSkillsRoot(rootOverride?: string): string {
  if (rootOverride) return path.resolve(rootOverride);
  for (const candidate of candidateRepoSkillRoots()) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return candidateRepoSkillRoots()[0];
}

export function validateRepoSkills(root = getRepoSkillsRoot()): RepoSkillValidationResult {
  const availableCommands = listAvailableVikingCommands();
  const manifest = readRepoSkillManifest(root);
  const embedded = shouldUseEmbeddedRepoSkills(root, manifest);
  const fileSystemSkills = embedded ? [] : listRepoSkillDirectories(root);
  if (fileSystemSkills.length === 0 && !manifest && !embedded) {
    return {
      root,
      cliVersion: VERSION,
      skills: [],
      errors: [`skills directory not found: ${root}`],
      availableCommands
    };
  }

  const names = embedded
    ? Object.keys(EMBEDDED_REPO_SKILLS).sort((left, right) => left.localeCompare(right))
    : fileSystemSkills.length > 0
    ? fileSystemSkills
    : manifest
    ? manifest.skills.map(skill => skill.name).sort((left, right) => left.localeCompare(right))
    : [];

  const errors: string[] = [];
  const seen = new Set<string>();
  const skills: RepoSkill[] = [];

  for (const dirName of names) {
    const skillFile = path.join(root, dirName, 'SKILL.md');
    const content = readRepoSkillFile(root, dirName, 'SKILL.md', embedded);
    if (content === undefined) {
      errors.push(`[${dirName}] missing SKILL.md`);
      continue;
    }
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
    const title = frontmatter.title?.trim() || name || dirName;

    if (!name) {
      errors.push(`[${dirName}] frontmatter missing name`);
      continue;
    }
    if (!description) {
      errors.push(`[${dirName}] frontmatter missing description`);
    }
    if (name !== dirName) {
      errors.push(`[${dirName}] directory name must match skill name (${name})`);
    }
    if (seen.has(name)) {
      errors.push(`[${dirName}] duplicate skill name: ${name}`);
    }
    seen.add(name);

    if (!category) {
      errors.push(`[${dirName}] frontmatter missing category`);
    } else if (!REPO_SKILL_CATEGORIES.includes(category as RepoSkillCategory)) {
      errors.push(`[${dirName}] unsupported category: ${category}`);
    }

    if (appliesTo.length === 0) {
      errors.push(`[${dirName}] frontmatter missing applies_to`);
    } else {
      const invalidTargets = appliesTo.filter(target => !REPO_SKILL_TARGETS.includes(target as RepoSkillTarget));
      for (const target of invalidTargets) {
        errors.push(`[${dirName}] unsupported applies_to target: ${target}`);
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

    for (const heading of REQUIRED_HEADINGS) {
      if (!content.includes(heading)) {
        errors.push(`[${dirName}] missing section heading: ${heading}`);
      }
    }

    const availableTargets = resolveSkillInstallTargets('global');
    const installedTargets = availableTargets.filter(target => fs.existsSync(path.join(target, name)));
    const commandSummaries = parseCommandSummaries(content, commands);
    const whenToUse = extractMarkdownSection(content, '## When to Use');
    const whenToUseSummary = summarizeText(whenToUse);
    const preconditions = parseBulletLines(extractMarkdownSection(content, '## Preconditions'));
    const workflow = parseOrderedLines(extractMarkdownSection(content, '## Workflow'));
    const constraints = parseBulletLines(extractMarkdownSection(content, '## Constraints'));

    skills.push({
      name,
      title,
      description: description ?? '',
      category: (category as RepoSkillCategory | undefined) ?? 'shared',
      appliesTo: appliesTo.filter(target => REPO_SKILL_TARGETS.includes(target as RepoSkillTarget)) as RepoSkillTarget[],
      requiresCli: requiresCli ?? '>=0.0.0',
      compatibility: getRepoSkillCompatibility(requiresCli ?? '>=0.0.0'),
      keywords,
      commands,
      commandSummaries,
      whenToUse,
      whenToUseSummary,
      preconditions,
      workflow,
      constraints,
      installCommand: `vs skill install ${name}`,
      sourcePath: skillFile,
      kind: 'repo',
      installable: true,
      installedTargets,
      availableTargets
    });
  }

  return {
    root,
    cliVersion: VERSION,
    skills,
    errors,
    availableCommands
  };
}

export function listRepoSkills(root?: string): RepoSkill[] {
  return validateRepoSkills(getRepoSkillsRoot(root)).skills;
}

export function findRepoSkill(name?: string, root?: string): RepoSkill | undefined {
  if (!name) return undefined;
  const normalized = normalizeText(name);
  return listRepoSkills(root).find(skill => normalizeText(skill.name) === normalized);
}

export function toRepoSkillListItem(skill: RepoSkill): RepoSkillListItem {
  return {
    name: skill.name,
    title: skill.title,
    description: skill.description,
    category: skill.category,
    appliesTo: skill.appliesTo,
    requiresCli: skill.requiresCli,
    compatibility: skill.compatibility,
    keywords: skill.keywords,
    topCommands: skill.commands.slice(0, 4),
    whenToUseSummary: skill.whenToUseSummary,
    installCommand: skill.installCommand,
    sourcePath: skill.sourcePath
  };
}

export function installRepoSkills(options: InstallRepoSkillsOptions = {}): InstallRepoSkillsResult {
  const validation = validateRepoSkills(getRepoSkillsRoot(options.root));
  if (validation.errors.length > 0) {
    throw new Error(`Repo skills validation failed:\n- ${validation.errors.join('\n- ')}`);
  }

  const targetMode = options.targetMode ?? 'global';
  const targets = resolveSkillInstallTargets(targetMode, options.dest);
  if (targets.length === 0) {
    throw new Error(
      'No existing skill installation target was found. Use --target trae|trae-cn|codex|agents or --dest <dir>.'
    );
  }

  const allSkills = validation.skills.map(skill => skill.name);
  const selectedNames = !options.names || options.names.length === 0 || options.names.includes('all')
    ? allSkills
    : options.names;

  const selectedSkills = selectedNames.map(name => {
    const skill = validation.skills.find(item => item.name === name);
    if (!skill) {
      throw new Error(`Unknown repo skill: ${name}`);
    }
    return skill;
  });

  const incompatible = selectedSkills.filter(skill => !skill.compatibility.ok);
  if (incompatible.length > 0) {
    const detail = incompatible
      .map(skill => `${skill.name} requires CLI ${skill.requiresCli} (current: ${VERSION})`)
      .join('\n- ');
    throw new Error(`Repo skill version compatibility check failed:\n- ${detail}`);
  }

  const installed: InstallRepoSkillsResult['installed'] = [];
  const manifest = readRepoSkillManifest(validation.root);
  const embedded = shouldUseEmbeddedRepoSkills(validation.root, manifest);
  for (const target of targets) {
    fs.mkdirSync(target, { recursive: true });
    for (const skill of selectedSkills) {
      const sourceDir = path.join(validation.root, skill.name);
      const targetDir = path.join(target, skill.name);
      if (fs.existsSync(targetDir)) {
        if (!options.force) {
          throw new Error(`Skill destination already exists: ${targetDir}. Use --force to overwrite.`);
        }
        fs.rmSync(targetDir, { recursive: true, force: true });
      }
      if (embedded) {
        writeEmbeddedRepoSkillFiles(skill.name, targetDir);
      } else if (fs.existsSync(sourceDir)) {
        fs.cpSync(sourceDir, targetDir, { recursive: true });
      } else if (manifest) {
        copyRepoSkillFilesFromManifest(validation.root, manifest, skill.name, targetDir);
      } else {
        throw new Error(`Skill source not found: ${sourceDir}`);
      }
      installed.push({ name: skill.name, target });
    }
  }

  return {
    root: validation.root,
    cliVersion: VERSION,
    targetMode,
    targets,
    installed
  };
}

export function createRepoSkillScaffold(options: CreateRepoSkillOptions): CreateRepoSkillResult {
  const name = normalizeRepoSkillName(options.name);
  if (!SKILL_NAME_PATTERN.test(name)) {
    throw new Error(`Invalid skill name: ${options.name}. Use lowercase letters, digits, and hyphens.`);
  }

  const root = getRepoSkillsRoot(options.root);
  const skillDir = path.join(root, name);
  const skillFile = path.join(skillDir, 'SKILL.md');
  if (fs.existsSync(skillDir)) {
    if (!options.force) {
      throw new Error(`Skill directory already exists: ${skillDir}. Use --force to overwrite.`);
    }
    fs.rmSync(skillDir, { recursive: true, force: true });
  }

  const category = options.category ?? 'workflow';
  if (!REPO_SKILL_CATEGORIES.includes(category)) {
    throw new Error(`Unsupported category: ${category}.`);
  }

  const appliesTo = dedupe(
    options.appliesTo && options.appliesTo.length > 0 ? options.appliesTo : [...REPO_SKILL_TARGETS]
  ) as RepoSkillTarget[];
  const invalidTargets = appliesTo.filter(target => !REPO_SKILL_TARGETS.includes(target as RepoSkillTarget));
  if (invalidTargets.length > 0) {
    throw new Error(`Unsupported applies_to target(s): ${invalidTargets.join(', ')}.`);
  }

  const requiresCli = options.requiresCli ?? '>=0.1.0';
  if (!CLI_REQUIREMENT_PATTERN.test(requiresCli)) {
    throw new Error(`requires_cli must look like >=0.1.0. Received: ${requiresCli}`);
  }

  const availableCommands = listAvailableVikingCommands();
  const commands = dedupe(options.commands && options.commands.length > 0 ? options.commands : [...DEFAULT_REPO_SKILL_COMMANDS]);
  for (const command of commands) {
    if (!availableCommands.includes(command)) {
      throw new Error(`Unknown command in skill template: ${command}`);
    }
  }

  const keywords = dedupe(options.keywords && options.keywords.length > 0
    ? options.keywords
    : [name, category, ...commands]);

  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(skillFile, renderRepoSkillTemplate({
    name,
    title: options.title?.trim() || inferRepoSkillTitle(name),
    description: options.description?.trim() || `Describe when external agents should use ${name}.`,
    category,
    appliesTo,
    requiresCli,
    commands,
    keywords
  }));

  const validation = validateRepoSkills(root);
  return {
    root,
    name,
    created: true,
    skillDir,
    skillFile,
    validation
  };
}

export function getRepoSkillCompatibility(requiresCli: string, cliVersion = VERSION): RepoSkillCompatibility {
  const minimumVersion = parseMinimumCliRequirement(requiresCli);
  return {
    cliVersion,
    ok: compareSemanticVersions(cliVersion, minimumVersion) >= 0,
    required: requiresCli,
    minimumVersion
  };
}

export function resolveSkillInstallTargets(mode: SkillInstallTargetMode = 'global', dest?: string): string[] {
  if (dest) return [path.resolve(dest)];

  const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
  const agentsHome = process.env.AGENTS_HOME || path.join(os.homedir(), '.agents');
  const codexDest = path.join(codexHome, 'skills');
  const agentsDest = path.join(agentsHome, 'skills');
  const traeDest = path.join(process.env.TRAE_HOME || path.join(os.homedir(), '.trae'), 'skills');
  const traeCnDest = path.join(process.env.TRAE_CN_HOME || path.join(os.homedir(), '.trae-cn'), 'skills');
  const globalTargets = dedupe([
    codexDest,
    agentsDest,
    ...GLOBAL_AGENT_SKILL_DIRS.map(relativePath => path.join(os.homedir(), relativePath))
  ]);
  const existingGlobalTargets = globalTargets.filter(target => fs.existsSync(target));

  switch (mode) {
    case 'global':
      return existingGlobalTargets;
    case 'codex':
      return [codexDest];
    case 'agents':
      return [agentsDest];
    case 'trae':
      return [traeDest];
    case 'trae-cn':
      return [traeCnDest];
    case 'auto':
      return existingGlobalTargets;
    default:
      return existingGlobalTargets;
  }
}

function parseFrontmatter(content: string): Record<string, string> | undefined {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return undefined;
  const result: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
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

function parseCsvList(value?: string): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean);
}

function extractMarkdownSection(content: string, heading: (typeof REQUIRED_HEADINGS)[number]): string {
  const start = content.indexOf(`${heading}\n`);
  if (start < 0) return '';
  const bodyStart = start + heading.length + 1;
  const remainder = content.slice(bodyStart);
  const nextHeadingMatch = remainder.match(/\n## [^\n]+\n/);
  const body = nextHeadingMatch ? remainder.slice(0, nextHeadingMatch.index) : remainder;
  return body.trim();
}

function parseBulletLines(section: string): string[] {
  return section
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('- '))
    .map(line => line.slice(2).trim());
}

function parseOrderedLines(section: string): string[] {
  return section
    .split('\n')
    .map(line => line.trim())
    .filter(line => /^\d+\.\s+/.test(line))
    .map(line => line.replace(/^\d+\.\s+/, '').trim());
}

function parseCommandSummaries(content: string, commands: string[]): RepoSkillCommandSummary[] {
  const bullets = parseBulletLines(extractMarkdownSection(content, '## Commands'));
  const summaries = bullets
    .map(line => {
      const match = line.match(/^`([^`]+)`(?::\s*(.+))?$/);
      if (match) {
        return {
          command: match[1].trim(),
          description: (match[2] || '').trim()
        };
      }
      const plain = line.replace(/`/g, '');
      const separator = plain.indexOf(':');
      if (separator > 0) {
        return {
          command: plain.slice(0, separator).trim(),
          description: plain.slice(separator + 1).trim()
        };
      }
      return {
        command: plain.trim(),
        description: ''
      };
    })
    .filter(item => item.command.length > 0);

  if (summaries.length > 0) return summaries;
  return commands.map(command => ({ command, description: '' }));
}

function summarizeText(value: string, maxLength = 140): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

function parseMinimumCliRequirement(value: string): string {
  const trimmed = value.trim();
  if (!CLI_REQUIREMENT_PATTERN.test(trimmed)) {
    throw new Error(`Invalid requires_cli value: ${value}`);
  }
  return trimmed.slice(2);
}

function listAvailableVikingCommands(): string[] {
  const commandsRoot = path.resolve(__dirname, '..', 'commands');
  if (!fs.existsSync(commandsRoot)) {
    return [...FALLBACK_COMMANDS];
  }

  const results: string[] = [];
  walkCommandTree(commandsRoot, commandsRoot, results);
  return results.length > 0
    ? results.sort((left, right) => left.localeCompare(right))
    : [...FALLBACK_COMMANDS];
}

function walkCommandTree(root: string, current: string, results: string[]): void {
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

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeRepoSkillName(value: string): string {
  return value.trim();
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)];
}

function candidateRepoSkillRoots(): string[] {
  const candidates = [
    path.resolve(__dirname, '..', '..', 'skills'),
    path.resolve(path.dirname(process.execPath), '..', 'skills'),
    path.resolve(path.dirname(process.execPath), 'skills'),
    path.resolve(process.cwd(), 'skills')
  ];

  return dedupe(candidates);
}

function listRepoSkillDirectories(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

function shouldUseEmbeddedRepoSkills(_root: string, _manifest?: RepoSkillManifest): boolean {
  const pkgProcess = globalThis.process as NodeJS.Process & { pkg?: unknown };
  return Boolean(pkgProcess.pkg) && Object.keys(EMBEDDED_REPO_SKILLS).length > 0;
}

function readRepoSkillManifest(root: string): RepoSkillManifest | undefined {
  const manifestPath = path.join(root, 'manifest.json');
  if (!fs.existsSync(manifestPath)) return undefined;
  const raw = fs.readFileSync(manifestPath, 'utf8');
  const parsed = JSON.parse(raw) as RepoSkillManifest;
  if (!parsed || !Array.isArray(parsed.skills)) return undefined;
  return parsed;
}

function readRepoSkillFile(root: string, skillName: string, relativeFile: string, embedded: boolean): string | undefined {
  if (embedded) {
    return EMBEDDED_REPO_SKILLS[skillName]?.[relativeFile];
  }

  const filePath = path.join(root, skillName, relativeFile);
  if (!fs.existsSync(filePath)) return undefined;
  return fs.readFileSync(filePath, 'utf8');
}

function copyRepoSkillFilesFromManifest(root: string, manifest: RepoSkillManifest, skillName: string, targetDir: string): void {
  const entry = manifest.skills.find(skill => skill.name === skillName);
  if (!entry) {
    throw new Error(`Repo skill manifest missing entry for ${skillName}`);
  }

  for (const relativeFile of entry.files) {
    const sourceFile = path.join(root, relativeFile);
    const destinationFile = path.join(targetDir, path.relative(skillName, relativeFile));
    fs.mkdirSync(path.dirname(destinationFile), { recursive: true });
    fs.copyFileSync(sourceFile, destinationFile);
  }
}

function writeEmbeddedRepoSkillFiles(skillName: string, targetDir: string): void {
  const files = EMBEDDED_REPO_SKILLS[skillName];
  if (!files) {
    throw new Error(`Embedded repo skill bundle missing entry for ${skillName}`);
  }

  for (const [relativeFile, content] of Object.entries(files)) {
    const destinationFile = path.join(targetDir, relativeFile);
    fs.mkdirSync(path.dirname(destinationFile), { recursive: true });
    fs.writeFileSync(destinationFile, content, 'utf8');
  }
}

function inferRepoSkillTitle(name: string): string {
  return name
    .split('-')
    .filter(Boolean)
    .map(token => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

function renderRepoSkillTemplate(skill: {
  name: string;
  title: string;
  description: string;
  category: RepoSkillCategory;
  appliesTo: RepoSkillTarget[];
  requiresCli: string;
  commands: string[];
  keywords: string[];
}): string {
  const commandBullets = skill.commands.map(command => `- \`${command}\`: TODO explain when to use this command.`).join('\n');
  const workflowBullets = skill.commands.map((command, index) => `${index + 1}. TODO step using \`${command}\`.`).join('\n');

  return `---
name: ${skill.name}
description: "${escapeFrontmatterValue(skill.description)}"
category: ${skill.category}
applies_to: ${skill.appliesTo.join(', ')}
requires_cli: "${skill.requiresCli}"
keywords: ${skill.keywords.join(', ')}
commands: ${skill.commands.join(', ')}
---

# ${skill.title}

## When to Use

TODO describe when external agents should use this skill.

## Preconditions

- Confirm the SearchCLI is installed and available as \`vs\`
- Confirm authentication and environment context are ready before running write commands
- Update the TODO notes in this template before treating the skill as production-ready

## Commands

${commandBullets}

## Workflow

${workflowBullets}

## Constraints

- Keep the workflow focused on the public \`vs\` command surface
- Replace the TODO placeholders in this file before shipping the skill to other agents
`;
}

function escapeFrontmatterValue(value: string): string {
  return value.replace(/"/g, '\\"');
}

function compareSemanticVersions(left: string, right: string): number {
  const leftParts = parseSemanticVersion(left);
  const rightParts = parseSemanticVersion(right);
  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] > rightParts[index]) return 1;
    if (leftParts[index] < rightParts[index]) return -1;
  }
  return 0;
}

function parseSemanticVersion(value: string): [number, number, number] {
  const core = value.trim().split('-', 1)[0].split('+', 1)[0];
  const parts = core.split('.');
  if (parts.length < 3) {
    throw new Error(`Invalid semantic version: ${value}`);
  }
  const parsed = parts.slice(0, 3).map(part => Number.parseInt(part, 10));
  if (parsed.some(part => !Number.isFinite(part) || part < 0)) {
    throw new Error(`Invalid semantic version: ${value}`);
  }
  return [parsed[0], parsed[1], parsed[2]];
}
