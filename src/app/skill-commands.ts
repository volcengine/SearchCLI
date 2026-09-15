// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { parseArgs } from 'node:util';
import { isDomainHelpRequest, renderUsageBlock } from '../core/help-utils';
import { printOutput } from '../core/output-format';
import {
  createRepoSkillScaffold,
  findRepoSkill,
  getRepoSkillsRoot,
  installRepoSkills,
  listRepoSkills,
  type RepoSkillCategory,
  type RepoSkillListItem,
  type RepoSkillSearchItem,
  type RepoSkillTarget,
  type SkillInstallTargetMode,
  toRepoSkillListItem,
  validateRepoSkills
} from '../skills/repo-skills';

export async function runSkillDomainFromArgv(argv: string[]): Promise<boolean> {
  if (isDomainHelpRequest(argv)) {
    printSkillHelp();
    return true;
  }

  const action = argv[0];
  const parsed = parseSkillOptions(argv.slice(1));
  const values = parsed.values;
  const positionals = parsed.positionals;

  switch (action) {
    case 'list':
      await runSkillListCommand(optionalString(values.root), {
        category: optionalString(values.category)
      });
      return true;
    case 'show':
      await runSkillShowCommand(requiredString(values.name, '--name'), optionalString(values.root));
      return true;
    case 'search':
      await runSkillSearchCommand(
        optionalString(values.query),
        parseOptionalInt(optionalString(values['max-results'])) ?? 20,
        optionalString(values.root),
        optionalString(values.category)
      );
      return true;
    case 'install':
      await runSkillInstallCommand(positionals.map(value => String(value)).filter(Boolean), {
        root: optionalString(values.root),
        dest: optionalString(values.dest),
        force: values.force === true,
        targetMode: parseSkillInstallTargetMode(optionalString(values.target))
      });
      return true;
    case 'init':
      await runSkillInitCommand(requiredPositionalString(positionals[0], '<skill-name>'), {
        root: optionalString(values.root),
        title: optionalString(values.title),
        description: optionalString(values.description),
        category: optionalString(values.category),
        keywords: parseCsvOption(optionalString(values.keywords)),
        appliesTo: parseCsvOption(optionalString(values['applies-to'])),
        requiresCli: optionalString(values['requires-cli']),
        commands: parseCsvOption(optionalString(values.commands)),
        force: values.force === true
      });
      return true;
    case 'validate':
      await runSkillValidateCommand(optionalString(values.root));
      return true;
    default:
      throw new Error(`Unknown skill subcommand: ${action}`);
  }
}

export function printSkillHelp(): void {
  const examples = [
    '  vs skill list',
    '  vs skill list --category search',
    '  vs skill show --name vs-shared',
    '  vs skill search --query "search debug"',
    '  vs skill install all',
    '  vs skill install vs-shared vs-search --dest /tmp/viking-skills',
    '  vs skill init viking-demo-skill',
    '  vs skill validate'
  ];

  console.log(`${renderUsageBlock(
    [
      'vs skill list',
      'vs skill list [--category <name>]',
      'vs skill show --name <skill-name>',
      'vs skill search --query <text> [--category <name>] [--max-results <n>]',
      'vs skill install <skill-name...|all> [--target global|codex|agents|trae|trae-cn] [--dest <dir>] [--force]',
      'vs skill init <skill-name> [--root <dir>] [--category <name>] [--keywords <csv>] [--commands <csv>] [--force]',
      'vs skill validate [--root <dir>]'
    ]
  )}

DESCRIPTION
  Manage installable Viking skills and maintain this repository's skill bundle.

EXAMPLES
${examples.join('\n')}

COMMON FLAGS
  --format --json --table --yaml --pretty --ndjson --csv --jq --output`);
}

export async function runSkillListCommand(
  root?: string,
  filters: {
    category?: string;
  } = {}
): Promise<void> {
  const skills = filterRepoSkills(listRepoSkills(root), filters.category).map(toRepoSkillListItem);
  await printOutput({
    root: getRepoSkillsRoot(root),
    cliVersion: skills[0]?.compatibility.cliVersion ?? '0.1.0',
    count: skills.length,
    categories: summarizeCategories(skills),
    recommendedQueries: ['search debug', 'data import', 'app dataset bind', 'chat run'],
    skills
  });
}

export async function runSkillShowCommand(name: string, root?: string): Promise<void> {
  const skill = findRepoSkill(name, root);
  if (!skill) {
    throw new Error(`Unknown repo skill: ${name}`);
  }

  await printOutput({
    ...skill,
    sourceCatalog: getRepoSkillsRoot(root)
  });
}

export async function runSkillSearchCommand(
  query?: string,
  maxResults = 20,
  root?: string,
  category?: string
): Promise<void> {
  const skills = searchRepoSkills(query, maxResults, root, category);
  await printOutput({
    query: query ?? '',
    maxResults,
    count: skills.length,
    sourceCatalog: getRepoSkillsRoot(root),
    category: category ?? null,
    recommendedQueries: ['search debug', 'data import', 'app dataset bind', 'chat run'],
    skills
  });
}

export async function runSkillInstallCommand(
  names: string[],
  options: {
    root?: string;
    dest?: string;
    force?: boolean;
    targetMode?: SkillInstallTargetMode;
  } = {}
): Promise<void> {
  const result = installRepoSkills({
    names,
    root: options.root,
    dest: options.dest,
    force: options.force,
    targetMode: options.targetMode
  });
  await printOutput(result);
}

export async function runSkillInitCommand(
  name: string,
  options: {
    root?: string;
    title?: string;
    description?: string;
    category?: string;
    keywords?: string[];
    appliesTo?: string[];
    requiresCli?: string;
    commands?: string[];
    force?: boolean;
  } = {}
): Promise<void> {
  const result = createRepoSkillScaffold({
    name,
    root: options.root,
    title: options.title,
    description: options.description,
    category: options.category as RepoSkillCategory | undefined,
    appliesTo: options.appliesTo as RepoSkillTarget[] | undefined,
    requiresCli: options.requiresCli,
    keywords: options.keywords,
    commands: options.commands,
    force: options.force
  });
  await printOutput({
    root: result.root,
    created: result.created,
    name: result.name,
    skillDir: result.skillDir,
    skillFile: result.skillFile,
    validationOk: result.validation.errors.length === 0,
    validationErrors: result.validation.errors,
    recommendedNextSteps: [
      `vs skill show --name ${result.name}${options.root ? ` --root ${result.root}` : ''}`,
      `vs skill validate${options.root ? ` --root ${result.root}` : ''}`,
      `vs skill install ${result.name}${options.root ? ` --root ${result.root}` : ''}`
    ]
  });
}

export async function runSkillValidateCommand(root?: string): Promise<void> {
  const result = validateRepoSkills(getRepoSkillsRoot(root));
  await printOutput({
    root: result.root,
    ok: result.errors.length === 0,
    count: result.skills.length,
    errors: result.errors,
    skills: result.skills
  });
}

function parseSkillOptions(argv: string[]) {
  return parseArgs({
    args: argv,
    allowPositionals: true,
    strict: false,
    options: {
      format: { type: 'string' },
      json: { type: 'boolean' },
      table: { type: 'boolean' },
      yaml: { type: 'boolean' },
      pretty: { type: 'boolean' },
      ndjson: { type: 'boolean' },
      csv: { type: 'boolean' },
      jq: { type: 'string', short: 'q' },
      output: { type: 'string', short: 'o' },
      root: { type: 'string' },
      name: { type: 'string' },
      query: { type: 'string' },
      'max-results': { type: 'string' },
      title: { type: 'string' },
      description: { type: 'string' },
      category: { type: 'string' },
      keywords: { type: 'string' },
      'applies-to': { type: 'string' },
      'requires-cli': { type: 'string' },
      commands: { type: 'string' },
      target: { type: 'string' },
      dest: { type: 'string' },
      force: { type: 'boolean' }
    }
  });
}

function searchRepoSkills(query?: string, maxResults = 20, root?: string, category?: string): RepoSkillSearchItem[] {
  const skills = filterRepoSkills(listRepoSkills(root), category);
  if (!query || !query.trim()) {
    return skills.slice(0, maxResults).map(skill => ({
      ...toRepoSkillListItem(skill),
      score: 0,
      matchedFields: []
    }));
  }

  const normalizedQuery = normalizeText(query);
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

  return skills
    .map(skill => ({
      skill,
      search: scoreRepoSkill(skill, normalizedQuery, tokens)
    }))
    .filter(entry => entry.search.score > 0)
    .sort((left, right) => {
      if (right.search.score !== left.search.score) return right.search.score - left.search.score;
      return left.skill.name.localeCompare(right.skill.name);
    })
    .slice(0, maxResults)
    .map(entry => ({
      ...toRepoSkillListItem(entry.skill),
      score: entry.search.score,
      matchedFields: entry.search.matchedFields
    }));
}

function scoreRepoSkill(skill: ReturnType<typeof listRepoSkills>[number], query: string, tokens: string[]): {
  score: number;
  matchedFields: string[];
} {
  const haystacks = {
    name: normalizeText(skill.name),
    title: normalizeText(skill.title),
    description: normalizeText(skill.description),
    category: normalizeText(skill.category),
    keywords: normalizeText(skill.keywords.join(' ')),
    commands: normalizeText(skill.commands.join(' ')),
    whenToUse: normalizeText(skill.whenToUse),
    workflow: normalizeText(skill.workflow.join(' ')),
    constraints: normalizeText(skill.constraints.join(' '))
  };

  let score = 0;
  const matchedFields = new Set<string>();
  if (haystacks.name === query) {
    score += 120;
    matchedFields.add('name');
  }
  if (haystacks.title === query) {
    score += 90;
    matchedFields.add('title');
  }
  if (haystacks.keywords.includes(query)) {
    score += 80;
    matchedFields.add('keywords');
  }
  if (haystacks.commands.includes(query)) {
    score += 65;
    matchedFields.add('commands');
  }
  if (haystacks.category.includes(query)) {
    score += 40;
    matchedFields.add('category');
  }
  if (haystacks.name.includes(query)) {
    score += 50;
    matchedFields.add('name');
  }
  if (haystacks.title.includes(query)) {
    score += 35;
    matchedFields.add('title');
  }
  if (haystacks.description.includes(query)) {
    score += 25;
    matchedFields.add('description');
  }
  if (haystacks.whenToUse.includes(query)) {
    score += 18;
    matchedFields.add('whenToUse');
  }

  for (const token of tokens) {
    if (haystacks.name.includes(token)) {
      score += 15;
      matchedFields.add('name');
    }
    if (haystacks.title.includes(token)) {
      score += 10;
      matchedFields.add('title');
    }
    if (haystacks.keywords.includes(token)) {
      score += 16;
      matchedFields.add('keywords');
    }
    if (haystacks.commands.includes(token)) {
      score += 12;
      matchedFields.add('commands');
    }
    if (haystacks.category.includes(token)) {
      score += 8;
      matchedFields.add('category');
    }
    if (haystacks.description.includes(token)) {
      score += 6;
      matchedFields.add('description');
    }
    if (haystacks.whenToUse.includes(token)) {
      score += 5;
      matchedFields.add('whenToUse');
    }
    if (haystacks.workflow.includes(token)) {
      score += 4;
      matchedFields.add('workflow');
    }
    if (haystacks.constraints.includes(token)) {
      score += 2;
      matchedFields.add('constraints');
    }
  }

  return {
    score,
    matchedFields: [...matchedFields].sort()
  };
}

function parseSkillInstallTargetMode(value?: string): SkillInstallTargetMode | undefined {
  if (!value) return undefined;
  switch (value) {
    case 'global':
    case 'auto':
    case 'codex':
    case 'agents':
    case 'trae':
    case 'trae-cn':
      return value;
    default:
      throw new Error(`Unsupported skill install target: ${value}. Use one of: global, codex, agents, trae, trae-cn.`);
  }
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function optionalString(value: string | boolean | undefined): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function requiredString(value: string | boolean | undefined, flagName: string): string {
  if (typeof value === 'string' && value.length > 0) return value;
  throw new Error(`Missing required flag: ${flagName}`);
}

function requiredPositionalString(value: string | undefined, label: string): string {
  if (typeof value === 'string' && value.length > 0) return value;
  throw new Error(`Missing required positional argument: ${label}`);
}

function parseCsvOption(value?: string): string[] | undefined {
  if (!value) return undefined;
  const items = value.split(',').map(item => item.trim()).filter(Boolean);
  return items.length > 0 ? items : undefined;
}

function filterRepoSkills(skills: ReturnType<typeof listRepoSkills>, category?: string) {
  if (!category) return skills;
  const normalizedCategory = normalizeText(category);
  return skills.filter(skill => normalizeText(skill.category) === normalizedCategory);
}

function summarizeCategories(skills: RepoSkillListItem[]) {
  const counts = new Map<string, number>();
  for (const skill of skills) {
    counts.set(skill.category, (counts.get(skill.category) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([category, count]) => ({ category, count }));
}

function parseOptionalInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid integer value: ${value}`);
  }
  return parsed;
}
