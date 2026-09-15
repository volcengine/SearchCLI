#!/usr/bin/env node

// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0


const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);
const root = path.resolve(__dirname, '..');
const args = new Set(process.argv.slice(2));
const mode = args.has('--binary') ? 'binary' : 'dist';
const live = args.has('--live');
const timestamp = new Date().toISOString().replaceAll(':', '-').replace(/\.\d+Z$/, 'Z');
const reportDir = path.join(root, 'tmp-acceptance', `${timestamp}-${mode}`);
const reportPath = path.join(reportDir, 'acceptance.md');

const command = resolveCommand(mode);
const tests = [];

async function main() {
  fs.mkdirSync(reportDir, { recursive: true });

  await runTest('root-help', testRootHelp);
  await runTest('skill-list', testSkillList);
  await runTest('skill-show', testSkillShow);
  await runTest('app-list-help', testAppListHelp);
  await runTest('dataset-list-help', testDatasetListHelp);
  await runTest('config-summary-help', testConfigSummaryHelp);
  await runTest('item-profile', testItemProfile);
  await runTest('item-plan', testItemPlan);
  await runTest('high-risk-guards', testHighRiskGuards);
  await runTest('auth-import-env', testAuthImportEnv);

  if (live) {
    await runTest('live-search-default-scene', testLiveSearchDefaultScene);
    await runTest('live-search-non-default-scene', testLiveSearchNonDefaultScene);
    await runTest('live-recommend-default-scene', testLiveRecommendDefaultScene);
    await runTest('live-recommend-non-default-scene', testLiveRecommendNonDefaultScene);
  }

  writeReport();

  const failed = tests.filter(test => test.status === 'failed');
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

function resolveCommand(kind) {
  if (kind === 'binary') {
    const releaseDir = path.join(root, 'release');
    const candidates = fs
      .readdirSync(releaseDir, { withFileTypes: true })
      .filter(entry => entry.isFile())
      .map(entry => entry.name)
      .filter(name => /^vs-(?!agent)/.test(name) && !name.endsWith('.sha256') && name !== 'SHA256SUMS' && name !== 'manifest.json' && name !== 'install.sh')
      .sort();

    if (candidates.length === 0) {
      throw new Error(`No packaged binary found in ${releaseDir}`);
    }

    return { file: path.join(releaseDir, candidates[candidates.length - 1]), prefix: candidates[candidates.length - 1] };
  }

  return { file: 'node', args: [path.join(root, 'bin', 'run.js')], prefix: 'node bin/run.js' };
}

async function runCli(argv, options = {}) {
  const file = command.file;
  const extraArgs = command.args ?? [];
  const env = {
    ...process.env,
    ...options.env
  };

  return execFileAsync(file, [...extraArgs, ...argv], {
    cwd: root,
    env,
    maxBuffer: 16 * 1024 * 1024
  });
}

async function runTest(name, fn) {
  try {
    const detail = await fn();
    tests.push({ name, status: 'passed', detail });
  } catch (error) {
    if (error instanceof SkippedTest) {
      tests.push({ name, status: 'skipped', detail: error.message });
      return;
    }
    tests.push({
      name,
      status: 'failed',
      detail: error instanceof Error ? `${error.name}: ${error.message}` : String(error)
    });
  }
}

class SkippedTest extends Error {
  constructor(message) {
    super(message);
    this.name = 'SkippedTest';
  }
}

function skipTest(reason) {
  throw new SkippedTest(reason);
}

async function testRootHelp() {
  const { stdout } = await runCli(['--help']);
  assert.match(stdout, /SearchCLI/);
  assert.match(stdout, /\bitem\b/);
  assert.doesNotMatch(stdout, /\bchat-mode\b/);
  assert.doesNotMatch(stdout, /\bchat-skill\b/);
  return `${command.prefix} --help`;
}

async function testSkillList() {
  const { stdout } = await runCli(['skill', 'list', '--json']);
  const payload = JSON.parse(stdout);
  const names = payload.skills.map(skill => skill.name).sort();
  assert.deepEqual(names, [
    'vs-alias-mapping',
    'vs-app-dataset-bind',
    'vs-chat',
    'vs-item-onboarding',
    'vs-recommend',
    'vs-search',
    'vs-shared'
  ]);
  return `${command.prefix} skill list --json`;
}

async function testSkillShow() {
  const { stdout } = await runCli(['skill', 'show', '--name', 'vs-item-onboarding', '--json']);
  const payload = JSON.parse(stdout);
  assert.equal(payload.name, 'vs-item-onboarding');
  assert.match(payload.description, /structured item data/i);
  return `${command.prefix} skill show --name vs-item-onboarding --json`;
}

async function testDatasetListHelp() {
  const { stdout } = await runCli(['dataset', '--help']);
  assert.match(stdout, /--type/);
  assert.match(stdout, /--full/);
  assert.match(stdout, /dataset list \[--type <type> --name <text> --application-id <id> --full\]/i);
  return `${command.prefix} dataset --help`;
}

async function testAppListHelp() {
  const { stdout } = await runCli(['app', '--help']);
  assert.match(stdout, /app list \[--name <text> --dataset-id <id> --industry <type> --state <state> --full\]/i);
  return `${command.prefix} app --help`;
}

async function testConfigSummaryHelp() {
  const datasetHelp = await runCli(['dataset', '--help']);
  assert.match(datasetHelp.stdout, /dataset get --id <dataset-id> \[--full\]/);

  const appDatasetConfigGet = await runCli(['app', 'dataset-config', 'get', '--help']);
  assert.match(appDatasetConfigGet.stdout, /--full/);

  const appHelp = await runCli(['app', '--help']);
  assert.match(appHelp.stdout, /app online-config get --application-id <id> \[--full\]/);

  return `${command.prefix} dataset --help && ${command.prefix} app dataset-config get --help && ${command.prefix} app --help`;
}

async function testItemProfile() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'viking-acceptance-profile-'));
  const samplePath = path.join(workspace, 'items.json');
  fs.writeFileSync(
    samplePath,
    JSON.stringify(
      [
        { doc_id: 'item-1', title: 'Blue notebook', category: 'stationery', content: 'Soft cover notebook' },
        { doc_id: 'item-2', title: 'Green notebook', category: 'stationery', content: 'Hard cover notebook' }
      ],
      null,
      2
    )
  );

  const { stdout } = await runCli(['item', 'profile', '--file', samplePath, '--json']);
  const payload = JSON.parse(stdout);
  assert.equal(payload.inferred.primaryKeyField, 'doc_id');
  assert.equal(payload.inferred.titleField, 'title');
  return `${command.prefix} item profile --file ${samplePath} --json`;
}

async function testItemPlan() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'viking-acceptance-plan-'));
  const samplePath = path.join(workspace, 'items.json');
  const outputDir = path.join(workspace, 'plans');
  fs.writeFileSync(
    samplePath,
    JSON.stringify(
      [
        { doc_id: 'item-1', title: 'Blue notebook', category: 'stationery', content: 'Soft cover notebook' },
        { doc_id: 'item-2', title: 'Green notebook', category: 'stationery', content: 'Hard cover notebook' }
      ],
      null,
      2
    )
  );

  const { stdout } = await runCli([
    'item',
    'plan',
    '--file',
    samplePath,
    '--goal',
    'Build stationery search',
    '--output-dir',
    outputDir,
    '--json'
  ]);
  const payload = JSON.parse(stdout);
  const files = payload.plan.files;
  for (const required of ['schema', 'fieldConfig', 'onlineConfig', 'validation']) {
    assert.ok(files[required], `missing ${required}`);
    assert.ok(fs.existsSync(path.join(payload.planDir, files[required])), `file not found for ${required}`);
  }
  assert.ok(fs.existsSync(payload.planPath), 'missing plan.json');
  return `${command.prefix} item plan --file ${samplePath} --goal "Build stationery search" --output-dir ${outputDir} --json`;
}

async function testHighRiskGuards() {
  const itemApplyHelp = await runCli(['item', 'apply', '--help']);
  assert.match(itemApplyHelp.stdout, /--confirm-review/);
  assert.match(itemApplyHelp.stdout, /--confirm-recommend-entry-binding/);

  const recommendHelp = await runCli(['recommend', '--help']);
  assert.match(recommendHelp.stdout, /--confirm-entry-binding/);

  const chatSkill = await runCli(['skill', 'show', '--name', 'vs-chat', '--json']);
  const chatSkillPayload = JSON.parse(chatSkill.stdout);
  assert.match(JSON.stringify(chatSkillPayload.workflow), /not treat the output as NDJSON/i);

  return `${command.prefix} item apply --help && ${command.prefix} recommend --help && ${command.prefix} skill show --name vs-chat --json`;
}

async function testAuthImportEnv() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'viking-acceptance-auth-'));
  const homeDir = path.join(workspace, 'home');
  fs.mkdirSync(homeDir, { recursive: true });

  await runCli(['auth', 'import-env', '--profile', 'acceptance', '--json'], {
    env: {
      HOME: homeDir,
      VIKING_AK: 'acceptance-ak',
      VIKING_SK: 'acceptance-sk'
    }
  });

  const { stdout } = await runCli(['auth', 'status', '--profile', 'acceptance', '--json'], {
    env: {
      HOME: homeDir
    }
  });
  const payload = JSON.parse(stdout);
  assert.equal(payload.activeProfile, 'acceptance');
  assert.equal(payload.loggedIn, true);
  return `${command.prefix} auth import-env --profile acceptance --json`;
}

async function testLiveSearchDefaultScene() {
  const context = getLiveTestContext();
  if (!context.applicationId || !context.itemDatasetId) {
    skipTest('Set SEARCHCLI_TEST_APPLICATION_ID and SEARCHCLI_TEST_ITEM_DATASET_ID.');
  }

  const { stdout } = await runCli(
    [
      'search',
      'run',
      '--application-id',
      context.applicationId,
      '--dataset-id',
      context.itemDatasetId,
      '--query',
      context.query,
      '--page-size',
      '3',
      '--project-name',
      context.projectName,
      '--json'
    ],
    { env: context.env }
  );
  assertRuntimeResponse(stdout, 'search_results');
  return `${command.prefix} search run --application-id ${context.applicationId} --dataset-id ${context.itemDatasetId} --project-name ${context.projectName} --json`;
}

async function testLiveSearchNonDefaultScene() {
  const context = getLiveTestContext();
  if (!context.applicationId || !context.itemDatasetId || !context.searchSceneId) {
    skipTest('Set SEARCHCLI_TEST_APPLICATION_ID, SEARCHCLI_TEST_ITEM_DATASET_ID, and SEARCHCLI_TEST_SEARCH_SCENE_ID.');
  }

  const { stdout } = await runCli(
    [
      'search',
      'run',
      '--application-id',
      context.applicationId,
      '--scene-id',
      context.searchSceneId,
      '--dataset-id',
      context.itemDatasetId,
      '--query',
      context.query,
      '--page-size',
      '3',
      '--project-name',
      context.projectName,
      '--json'
    ],
    { env: context.env }
  );
  assertRuntimeResponse(stdout, 'search_results');
  return `${command.prefix} search run --application-id ${context.applicationId} --scene-id ${context.searchSceneId} --dataset-id ${context.itemDatasetId} --project-name ${context.projectName} --json`;
}

async function testLiveRecommendDefaultScene() {
  const context = getLiveTestContext();
  if (!context.applicationId || !context.recommendDefaultSceneId || !context.userId) {
    skipTest('Set SEARCHCLI_TEST_APPLICATION_ID, SEARCHCLI_TEST_RECOMMEND_DEFAULT_SCENE_ID, and SEARCHCLI_TEST_USER_ID.');
  }

  const { stdout } = await runCli(buildRecommendRunArgs(context, context.recommendDefaultSceneId), { env: context.env });
  assertRuntimeResponse(stdout, 'rec_results');
  return `${command.prefix} recommend run --application-id ${context.applicationId} --scene-id ${context.recommendDefaultSceneId} --project-name ${context.projectName} --json`;
}

async function testLiveRecommendNonDefaultScene() {
  const context = getLiveTestContext();
  if (!context.applicationId || !context.recommendNonDefaultSceneId || !context.userId) {
    skipTest('Set SEARCHCLI_TEST_APPLICATION_ID, SEARCHCLI_TEST_RECOMMEND_NON_DEFAULT_SCENE_ID, and SEARCHCLI_TEST_USER_ID.');
  }

  const { stdout } = await runCli(buildRecommendRunArgs(context, context.recommendNonDefaultSceneId), { env: context.env });
  assertRuntimeResponse(stdout, 'rec_results');
  return `${command.prefix} recommend run --application-id ${context.applicationId} --scene-id ${context.recommendNonDefaultSceneId} --project-name ${context.projectName} --json`;
}

function getLiveTestContext() {
  return {
    applicationId: process.env.SEARCHCLI_TEST_APPLICATION_ID,
    itemDatasetId: process.env.SEARCHCLI_TEST_ITEM_DATASET_ID,
    searchSceneId: process.env.SEARCHCLI_TEST_SEARCH_SCENE_ID,
    recommendDefaultSceneId: process.env.SEARCHCLI_TEST_RECOMMEND_DEFAULT_SCENE_ID,
    recommendNonDefaultSceneId: process.env.SEARCHCLI_TEST_RECOMMEND_NON_DEFAULT_SCENE_ID,
    userId: process.env.SEARCHCLI_TEST_USER_ID,
    query: process.env.SEARCHCLI_TEST_QUERY ?? 'GAZELLE 秦舒培同款经典运动板鞋',
    projectName: process.env.SEARCHCLI_TEST_PROJECT_NAME ?? 'searchcli-test',
    env: Object.fromEntries(
      Object.entries({
        VIKING_AK: process.env.VIKING_AK,
        VIKING_SK: process.env.VIKING_SK
      }).filter(([, value]) => value !== undefined)
    )
  };
}

function buildRecommendRunArgs(context, sceneId) {
  const args = [
    'recommend',
    'run',
    '--application-id',
    context.applicationId,
    '--scene-id',
    sceneId,
    '--user-id',
    context.userId,
    '--page-size',
    '3',
    '--project-name',
    context.projectName,
    '--json'
  ];
  return args;
}

function assertRuntimeResponse(stdout, resultKey) {
  const payload = JSON.parse(stdout);
  assert.ok(payload.request_id, 'missing request_id');
  assert.ok(payload.result && Array.isArray(payload.result[resultKey]), `missing result.${resultKey}`);
}

function writeReport() {
  const lines = [
    '# Acceptance',
    '',
    `- mode: ${mode}`,
    `- live: ${live ? 'true' : 'false'}`,
    `- command: ${command.prefix}`,
    ''
  ];

  for (const test of tests) {
    lines.push(`## ${test.name}`);
    lines.push(`- status: ${test.status}`);
    lines.push(`- detail: ${test.detail}`);
    lines.push('');
  }

  fs.writeFileSync(reportPath, `${lines.join('\n')}\n`, 'utf8');
  console.log(`Acceptance report written: ${reportPath}`);
}

void main().catch(error => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
