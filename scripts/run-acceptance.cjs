#!/usr/bin/env node

// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0


const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
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
  await runTest('validate-skills-space-path', testValidateSkillsSpacePath);
  await runTest('search-tune-help', testSearchTuneHelp);
  await runTest('search-run-requires-scene-help', testSearchRunRequiresSceneHelp);
  await runTest('search-tune-plan', testSearchTunePlan);
  await runTest('search-tune-plan-user-queries-default-all', testSearchTunePlanUserQueriesDefaultAll);
  await runTest('search-tune-plan-spa', testSearchTunePlanSpa);
  await runTest('search-tune-query-generate-mock', testSearchTuneQueryGenerateMock);
  await runTest('search-tune-run-worker-pool-mock', testSearchTuneRunWorkerPoolMock);
  await runTest('search-tune-run-source-item-mock', testSearchTuneRunSourceItemMock);
  await runTest('search-tune-run-label-failure-threshold-mock', testSearchTuneRunLabelFailureThresholdMock);
  await runTest('search-tune-apply-dry-run', testSearchTuneApplyDryRun);
  await runTest('search-tune-run-help', testSearchTuneRunHelp);
  await runTest('app-list-help', testAppListHelp);
  await runTest('dataset-list-help', testDatasetListHelp);
  await runTest('data-delete-mock', testDataDeleteMock);
  await runTest('config-summary-help', testConfigSummaryHelp);
  await runTest('item-profile', testItemProfile);
  await runTest('item-plan', testItemPlan);
  await runTest('high-risk-guards', testHighRiskGuards);
  await runTest('auth-import-env', testAuthImportEnv);
  await runTest('llm-openai-compatible-credential-flow', testLlmOpenAiCompatibleCredentialFlow);
  await runTest('search-tune-llm-check-guidance', testSearchTuneLlmCheckGuidance);

  if (live) {
    await runSkipped('live-smoke', 'Live acceptance is intentionally excluded from the public repository.');
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
    tests.push({
      name,
      status: 'failed',
      detail: error instanceof Error ? `${error.name}: ${error.message}` : String(error)
    });
  }
}

async function runSkipped(name, reason) {
  tests.push({ name, status: 'skipped', detail: reason });
}

async function testRootHelp() {
  const { stdout } = await runCli(['--help']);
  assert.match(stdout, /SearchCLI/);
  assert.match(stdout, /\bitem\b/);
  assert.match(stdout, /\bllm\b/);
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
    'vs-search-tuning',
    'vs-shared'
  ]);
  return `${command.prefix} skill list --json`;
}

async function testSkillShow() {
  const { stdout } = await runCli(['skill', 'show', '--name', 'vs-item-onboarding', '--json']);
  const payload = JSON.parse(stdout);
  assert.equal(payload.name, 'vs-item-onboarding');
  assert.match(payload.description, /item-level onboarding/i);
  return `${command.prefix} skill show --name vs-item-onboarding --json`;
}

async function testValidateSkillsSpacePath() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'viking acceptance skills '));
  const copiedRoot = path.join(workspace, 'repo with spaces');
  try {
    fs.mkdirSync(path.join(copiedRoot, 'scripts'), { recursive: true });
    fs.mkdirSync(path.join(copiedRoot, 'src'), { recursive: true });
    fs.copyFileSync(path.join(root, 'scripts', 'validate-skills.mjs'), path.join(copiedRoot, 'scripts', 'validate-skills.mjs'));
    fs.cpSync(path.join(root, 'skills'), path.join(copiedRoot, 'skills'), { recursive: true });
    fs.cpSync(path.join(root, 'src', 'commands'), path.join(copiedRoot, 'src', 'commands'), { recursive: true });

    const { stdout } = await execFileAsync('node', [path.join(copiedRoot, 'scripts', 'validate-skills.mjs')], {
      cwd: copiedRoot,
      maxBuffer: 16 * 1024 * 1024
    });
    assert.match(stdout, /validated \d+ skill\(s\)/);
    return `node "${path.join(copiedRoot, 'scripts', 'validate-skills.mjs')}"`;
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
}

async function testDatasetListHelp() {
  const { stdout } = await runCli(['dataset', 'list', '--help']);
  assert.match(stdout, /--type/);
  assert.match(stdout, /--full/);
  assert.match(stdout, /dataset list \[--type <type>\] \[--name <text>\] \[--application-id <id>\] \[--full\]/i);
  return `${command.prefix} dataset list --help`;
}

async function testAppListHelp() {
  const { stdout } = await runCli(['app', '--help']);
  assert.match(stdout, /app list \[--name <text> --dataset-id <id> --industry <type> --state <state> --full\]/i);
  return `${command.prefix} app --help`;
}

async function testDataDeleteMock() {
  const serverState = {
    requests: []
  };
  const server = await startDataDeleteMockServer(serverState);
  try {
    const dataHelp = await runCli(['data', '--help']);
    assert.match(dataHelp.stdout, /data delete --dataset-id <id> --id <item-id>/i);

    const { stdout } = await runCli([
      'data',
      'delete',
      '--dataset-id',
      'ds-1',
      '--id',
      'item-1',
      '--data-plane-base-url',
      server.baseUrl,
      '--timeout-ms',
      '1000',
      '--ak',
      'ak',
      '--sk',
      'sk',
      '--json'
    ], {
      env: {
        VIKING_CONTROL_PLANE_BASE_URL: 'http://127.0.0.1:1',
        VIKING_DATA_PLANE_BASE_URL: 'http://127.0.0.1:1'
      }
    });
    const payload = JSON.parse(stdout);
    assert.equal(payload.ok, true);
    assert.equal(payload.result.deleted, true);
    assert.deepEqual(serverState.requests, [
      {
        url: '/api/v1/dataset/ds-1/delete',
        body: { _ids: ['item-1'] }
      }
    ]);
    return `${command.prefix} data delete --dataset-id ds-1 --id item-1 --json`;
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

async function testSearchTuneHelp() {
  const { stdout } = await runCli(['search', '--help']);
  assert.match(stdout, /search tune llm-check/i);
  assert.match(stdout, /search tune plan/i);
  assert.match(stdout, /search tune query-generate/i);
  assert.match(stdout, /search tune run/i);
  assert.match(stdout, /search tune apply/i);
  assert.match(stdout, /search tune report/i);
  return `${command.prefix} search --help`;
}

async function testSearchRunRequiresSceneHelp() {
  const { stdout } = await runCli(['search', 'run', '--help']);
  assert.match(stdout, /--scene-id <id>/);
  assert.doesNotMatch(stdout, /\[--scene-id <id>\]/);
  assert.doesNotMatch(stdout, /search run --application-id 123 --query/);
  assert.match(stdout, /search run --application-id 123 --scene-id/);
  return `${command.prefix} search run --help`;
}

async function testSearchTunePlan() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'viking-acceptance-tune-plan-'));
  const queriesPath = path.join(workspace, 'queries.jsonl');
  fs.writeFileSync(
    queriesPath,
    [
      JSON.stringify({ id: 'q1', text: '对象存储' }),
      JSON.stringify({ id: 'q2', text: 'ECS API', sourceItemIds: ['ecs-api-doc'] }),
      JSON.stringify({ id: 'q3', query: { text: '如何创建云服务器实例' } })
    ].join('\n')
  );

  const { stdout } = await runCli([
    'search',
    'tune',
    'plan',
    '--application-id',
    'app-1',
    '--dataset-id',
    'ds-1',
    '--queries',
    queriesPath,
    '--query-count',
    '2',
    '--top-k',
    '5',
    '--max-strategies',
    '8',
    '--json'
  ]);
  const payload = JSON.parse(stdout);
  assert.equal(payload.profile, 'similarity-only');
  assert.equal(payload.querySource, 'user-provided');
  assert.equal(payload.estimated.queryCount, 2);
  assert.equal(payload.estimated.strategyCount, 8);
  assert.equal(payload.estimated.searchRequests, 16);
  assert.equal(payload.estimated.maxPointwiseJudgements, 80);
  assert.equal(payload.estimated.sourceItemQueryCount, 1);
  assert.equal(payload.estimated.sourceItemQueryCoverage, 0.5);
  assert.equal(payload.suggestedFirstPass.queryCount, 2);
  assert.equal(payload.suggestedFirstPass.strategyCount, 8);
  assert.equal(payload.suggestedFirstPass.topK, 5);
  assert.deepEqual(payload.fixed.mode, 'UserDefined');
  assert.ok(payload.tunedParameters.includes('user_defined_recall_mode'));
  assert.ok(payload.tunedParameters.includes('dense_weight'));
  assert.ok(payload.tunedParameters.includes('query_keyword_match_percent'));
  assert.ok(payload.tunedParameters.includes('max_retrieved_num'));
  assert.ok(payload.excludedParameters.includes('mode'));
  assert.deepEqual(payload.coverage.mode.values, ['UserDefined']);
  assert.ok(payload.coverage.user_defined_recall_mode.values.includes('KeywordOnly'));
  assert.ok(payload.coverage.user_defined_recall_mode.values.includes('SemanticOnly'));
  assert.ok(payload.coverage.user_defined_recall_mode.values.includes('KeywordSemantic'));
  return `${command.prefix} search tune plan --application-id app-1 --dataset-id ds-1 --queries ${queriesPath} --json`;
}

async function testSearchTunePlanUserQueriesDefaultAll() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'viking-acceptance-tune-plan-all-'));
  const queriesPath = path.join(workspace, 'queries.jsonl');
  fs.writeFileSync(
    queriesPath,
    Array.from({ length: 120 }, (_, index) =>
      JSON.stringify({
        id: `q${index + 1}`,
        text: `query ${index + 1}`,
        sourceItemIds: [`item-${index + 1}`]
      })
    ).join('\n')
  );

  const { stdout } = await runCli([
    'search',
    'tune',
    'plan',
    '--application-id',
    'app-1',
    '--dataset-id',
    'ds-1',
    '--queries',
    queriesPath,
    '--top-k',
    '5',
    '--max-strategies',
    '8',
    '--json'
  ]);
  const payload = JSON.parse(stdout);
  assert.equal(payload.querySource, 'user-provided');
  assert.equal(payload.estimated.queryCount, 120);
  assert.equal(payload.estimated.searchRequests, 960);
  assert.equal(payload.estimated.sourceItemQueryCount, 120);
  assert.equal(payload.suggestedFirstPass.queryCount, 30);
  return `${command.prefix} search tune plan --application-id app-1 --dataset-id ds-1 --queries ${queriesPath} --json`;
}

async function testSearchTunePlanSpa() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'viking-acceptance-tune-plan-spa-'));
  const queriesPath = path.join(workspace, 'queries.jsonl');
  fs.writeFileSync(
    queriesPath,
    [
      JSON.stringify({ id: 'q1', text: 'training shirt', sourceItemIds: ['training-shirt-item-1'] }),
      JSON.stringify({ id: 'q2', text: 'golf polo', sourceItemIds: ['golf-polo-item-1'] })
    ].join('\n')
  );

  const { stdout } = await runCli([
    'search',
    'tune',
    'plan',
    '--application-id',
    'app-1',
    '--dataset-id',
    'ds-1',
    '--queries',
    queriesPath,
    '--query-count',
    '2',
    '--top-k',
    '5',
    '--max-strategies',
    '6',
    '--optimizer',
    'spa',
    '--json'
  ]);
  const payload = JSON.parse(stdout);
  assert.equal(payload.optimizer, 'spa');
  assert.equal(payload.estimated.strategyCount, 6);
  assert.equal(payload.suggestedFirstPass.strategyCount, 6);
  assert.ok(payload.strategies.some(strategy => /^spa-/.test(strategy.id)));
  assert.deepEqual(payload.coverage.mode.values, ['UserDefined']);
  assert.ok(payload.coverage.user_defined_recall_mode.values.includes('KeywordOnly'));
  assert.ok(payload.coverage.user_defined_recall_mode.values.includes('SemanticOnly'));
  assert.ok(payload.coverage.user_defined_recall_mode.values.includes('KeywordSemantic'));
  return `${command.prefix} search tune plan --application-id app-1 --dataset-id ds-1 --queries ${queriesPath} --optimizer spa --json`;
}

async function testSearchTuneRunHelp() {
  const { stdout } = await runCli(['search', 'tune', 'run', '--help']);
  assert.match(stdout, /--optimizer/);
  assert.match(stdout, /--search-concurrency/);
  assert.match(stdout, /Default: 18/);
  assert.match(stdout, /--llm-concurrency/);
  assert.match(stdout, /Default: 100/);
  assert.match(stdout, /--scene-id/);
  assert.match(stdout, /--resume-run-id/);
  assert.match(stdout, /--label-source/);
  assert.match(stdout, /--llm-retries/);
  assert.match(stdout, /--max-label-failure-rate/);
  assert.match(stdout, /--verbose/);
  assert.match(stdout, /run-state\.json/);
  assert.match(stdout, /partial-metrics\.json/);
  assert.match(stdout, /performance-summary\.json/);
  return `${command.prefix} search tune run --help`;
}

async function testSearchTuneQueryGenerateMock() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'viking-acceptance-query-generate-'));
  const serverState = {
    dataListRequests: 0,
    llmRequests: 0
  };
  const server = await startQueryGenerateMockServer(serverState);
  try {
    const { stdout } = await runCli(
      [
        'search',
        'tune',
        'query-generate',
        '--application-id',
        'app-1',
        '--dataset-id',
        'ds-1',
        '--query-count',
        '6',
        '--min-query-count',
        '6',
        '--query-batch-size',
        '2',
        '--sample-size',
        '250',
        '--llm-concurrency',
        '2',
        '--timeout-ms',
        '60000',
        '--output-dir',
        workspace,
        '--control-plane-base-url',
        server.baseUrl,
        '--data-plane-base-url',
        server.baseUrl,
        '--ak',
        'ak',
        '--sk',
        'sk',
        '--json'
      ],
      {
        env: {
          VIKING_LLM_BASE_URL: server.baseUrl,
          VIKING_LLM_API_KEY: 'llm-key',
          VIKING_LLM_MODEL: 'mock-model'
        }
      }
    );
    const payload = JSON.parse(stdout);
    assert.equal(payload.ok, true);
    assert.equal(payload.requestedQueryCount, 6);
    assert.equal(payload.actualQueryCount, 6);
    assert.equal(payload.shortfall, 0);
    assert.equal(payload.queryCount, 6);
    assert.equal(payload.sampleItemCount, 250);
    assert.equal(payload.llmRequestCount, 3);
    assert.ok(payload.performance.durationMs >= 0);
    assert.ok(payload.performance.llmWallMs >= 0);
    assert.deepEqual(payload.warnings, []);
    const queryLines = fs.readFileSync(payload.queryFile, 'utf8').trim().split('\n');
    assert.equal(queryLines.length, 6);
    assert.equal(serverState.llmRequests, 3);
    assert.ok(serverState.dataListRequests >= 3);
    return `${command.prefix} search tune query-generate --application-id app-1 --dataset-id ds-1 --query-count 6 --json`;
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

async function testSearchTuneRunWorkerPoolMock() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'viking-acceptance-tune-run-'));
  const queriesPath = path.join(workspace, 'queries.jsonl');
  fs.writeFileSync(
    queriesPath,
    [
      JSON.stringify({ id: 'q1', text: 'training shirt', intent: 'Find a training shirt' }),
      JSON.stringify({ id: 'q2', text: 'golf polo', intent: 'Find a golf polo' })
    ].join('\n')
  );
  const serverState = {
    searchRequests: 0,
    llmRequests: 0
  };
  const server = await startTuneRunWorkerPoolMockServer(serverState);
  try {
    const startedAt = Date.now();
    const { stdout } = await runCli(
      [
        'search',
        'tune',
        'run',
        '--application-id',
        'app-1',
        '--dataset-id',
        'ds-1',
        '--queries',
        queriesPath,
        '--query-count',
        '2',
        '--top-k',
        '3',
        '--max-strategies',
        '1',
        '--search-concurrency',
        '1',
        '--llm-concurrency',
        '3',
        '--timeout-ms',
        '5000',
        '--output-dir',
        workspace,
        '--control-plane-base-url',
        server.baseUrl,
        '--data-plane-base-url',
        server.baseUrl,
        '--ak',
        'ak',
        '--sk',
        'sk',
        '--json'
      ],
      {
        env: {
          VIKING_LLM_BASE_URL: server.baseUrl,
          VIKING_LLM_API_KEY: 'llm-key',
          VIKING_LLM_MODEL: 'mock-model'
        }
      }
    );
    const wallMs = Date.now() - startedAt;
    const payload = JSON.parse(stdout);
    assert.equal(payload.ok, true);
    assert.equal(serverState.searchRequests, 2);
    assert.equal(serverState.llmRequests, 6);
    assert.equal(payload.performance.labelRequestsCompleted, 6);
    assert.equal(payload.performance.labelCacheMisses, 6);
    assert.equal(payload.performance.labelRequestsFailed, 0);
    assert.ok(payload.performance.llmLatencyP50Ms >= 0);
    assert.ok(payload.performance.llmLatencyP95Ms >= payload.performance.llmLatencyP50Ms);
    assert.ok(payload.performance.llmWallMs < 900, `expected worker-pool LLM wall < 900ms, got ${payload.performance.llmWallMs}`);
    assert.ok(wallMs < 2000, `expected tune run wall < 2000ms, got ${wallMs}`);
    const state = JSON.parse(fs.readFileSync(payload.runState, 'utf8'));
    assert.equal(state.status, 'completed');
    assert.match(fs.readFileSync(payload.report, 'utf8'), /Recommended strategy/i);
    return `${command.prefix} search tune run --application-id app-1 --dataset-id ds-1 --queries ${queriesPath} --json`;
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

async function testSearchTuneRunSourceItemMock() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'viking-acceptance-tune-source-item-'));
  const queriesPath = path.join(workspace, 'queries.jsonl');
  fs.writeFileSync(
    queriesPath,
    [
      JSON.stringify({
        id: 'q1',
        text: 'training shirt',
        intent: 'Find a training shirt',
        sourceItemIds: ['training-shirt-item-1']
      }),
      JSON.stringify({
        id: 'q2',
        text: 'golf polo',
        intent: 'Find a golf polo',
        sourceItemIds: ['golf-polo-item-1']
      })
    ].join('\n')
  );
  const serverState = {
    searchRequests: 0,
    llmRequests: 0
  };
  const server = await startTuneRunWorkerPoolMockServer(serverState);
  try {
    const { stdout, stderr } = await runCli(
      [
        'search',
        'tune',
        'run',
        '--application-id',
        'app-1',
        '--dataset-id',
        'ds-1',
        '--queries',
        queriesPath,
        '--query-count',
        '2',
        '--top-k',
        '3',
        '--max-strategies',
        '1',
        '--optimizer',
        'spa',
        '--label-source',
        'source-item',
        '--output-dir',
        workspace,
        '--control-plane-base-url',
        server.baseUrl,
        '--data-plane-base-url',
        server.baseUrl,
        '--ak',
        'ak',
        '--sk',
        'sk',
        '--json'
      ],
      {
        env: {
          VIKING_LLM_BASE_URL: '',
          VIKING_LLM_API_KEY: '',
          VIKING_LLM_MODEL: ''
        }
      }
    );
    const payload = JSON.parse(stdout);
    assert.equal(payload.ok, true);
    assert.equal(payload.optimizer, 'spa');
    assert.equal(payload.labelSource, 'source-item');
    assert.equal(payload.labelFailureCount, 0);
    assert.equal(serverState.searchRequests, 2);
    assert.equal(serverState.llmRequests, 0);
    assert.equal(payload.performance.labelRequestsCompleted, 0);
    assert.equal(payload.labelCount, 6);
    assert.doesNotMatch(stderr, /Label available for query/);
    const recommendation = JSON.parse(fs.readFileSync(payload.recommendation, 'utf8'));
    assert.equal(recommendation.metrics.averageMrrAt10, 1);
    const report = JSON.parse(fs.readFileSync(payload.reportJson, 'utf8'));
    assert.equal(report.optimizer, 'spa');
    assert.ok(report.strategies.some(strategy => /^spa-/.test(strategy.id)));
    const state = JSON.parse(fs.readFileSync(payload.runState, 'utf8'));
    assert.equal(state.optimizer, 'spa');
    return `${command.prefix} search tune run --application-id app-1 --dataset-id ds-1 --queries ${queriesPath} --label-source source-item --json`;
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

async function testSearchTuneRunLabelFailureThresholdMock() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'viking-acceptance-tune-label-failure-'));
  const queriesPath = path.join(workspace, 'queries.jsonl');
  fs.writeFileSync(
    queriesPath,
    [
      JSON.stringify({ id: 'q1', text: 'training shirt', intent: 'Find a training shirt' }),
      JSON.stringify({ id: 'q2', text: 'golf polo', intent: 'Find a golf polo' })
    ].join('\n')
  );
  const serverState = {
    searchRequests: 0,
    llmRequests: 0,
    failLlmRequestNumbers: new Set([2])
  };
  const server = await startTuneRunWorkerPoolMockServer(serverState);
  try {
    const { stdout } = await runCli(
      [
        'search',
        'tune',
        'run',
        '--application-id',
        'app-1',
        '--dataset-id',
        'ds-1',
        '--queries',
        queriesPath,
        '--query-count',
        '2',
        '--top-k',
        '3',
        '--max-strategies',
        '1',
        '--llm-concurrency',
        '3',
        '--llm-retries',
        '0',
        '--max-label-failure-rate',
        '0.5',
        '--timeout-ms',
        '5000',
        '--output-dir',
        workspace,
        '--control-plane-base-url',
        server.baseUrl,
        '--data-plane-base-url',
        server.baseUrl,
        '--ak',
        'ak',
        '--sk',
        'sk',
        '--json'
      ],
      {
        env: {
          VIKING_LLM_BASE_URL: server.baseUrl,
          VIKING_LLM_API_KEY: 'llm-key',
          VIKING_LLM_MODEL: 'mock-model'
        }
      }
    );
    const payload = JSON.parse(stdout);
    assert.equal(payload.ok, true);
    assert.equal(payload.labelSource, 'llm');
    assert.equal(payload.labelFailureCount, 1);
    assert.equal(payload.performance.labelRequestsFailed, 1);
    assert.equal(payload.performance.labelRequestsCompleted, 5);
    const failures = fs.readFileSync(payload.labelFailures, 'utf8').trim().split('\n').filter(Boolean);
    assert.equal(failures.length, 1);
    return `${command.prefix} search tune run --application-id app-1 --dataset-id ds-1 --queries ${queriesPath} --max-label-failure-rate 0.5 --json`;
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

async function startTuneRunWorkerPoolMockServer(state) {
  const sampleItems = Array.from({ length: 10 }, (_, index) => ({
    _id: `sample-${index + 1}`,
    raw_data: JSON.stringify({ id: `sample-${index + 1}`, title: `Sample ${index + 1}` })
  }));

  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      const parsedBody = body ? JSON.parse(body) : {};
      res.setHeader('content-type', 'application/json');
      if (req.url === '/api/v1/dataset/ds-1/list_items') {
        const pageNumber = parsedBody.page_number ?? 1;
        const pageSize = parsedBody.page_size ?? 10;
        const start = (pageNumber - 1) * pageSize;
        res.end(JSON.stringify({ result: { items: sampleItems.slice(start, start + pageSize) } }));
        return;
      }
      if (req.url === '/api/v1/application/app-1/search') {
        state.searchRequests += 1;
        const queryText = String(parsedBody.query?.text ?? `query-${state.searchRequests}`);
        const searchResults = Array.from({ length: parsedBody.page_size ?? 3 }, (_, index) => ({
          _id: `${queryText.replace(/\W+/g, '-')}-item-${index + 1}`,
          score: 1 - index / 10,
          display_fields: {
            title: `${queryText} result ${index + 1}`,
            category: index === 0 ? 'exact' : 'related',
            description: `Mock result ${index + 1} for ${queryText}`
          }
        }));
        res.end(JSON.stringify({ result: { total_items: searchResults.length, search_results: searchResults } }));
        return;
      }
      if (req.url.endsWith('/chat/completions')) {
        state.llmRequests += 1;
        if (state.failLlmRequestNumbers?.has(state.llmRequests)) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'mock LLM failure' }));
          return;
        }
        const delayMs = state.llmRequests === 1 || state.llmRequests === 4 ? 500 : 20;
        setTimeout(() => {
          res.end(
            JSON.stringify({
              choices: [
                {
                  message: {
                    content: JSON.stringify({ grade: 3, confidence: 1, reason: 'mock relevant' })
                  }
                }
              ]
            })
          );
        }, delayMs);
        return;
      }
      res.statusCode = 404;
      res.end(JSON.stringify({ error: `unexpected path: ${req.url}` }));
    });
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: callback => server.close(callback)
  };
}

async function startQueryGenerateMockServer(state) {
  const items = Array.from({ length: 250 }, (_, index) => ({
    _id: `item-${index + 1}`,
    raw_data: JSON.stringify({
      id: `item-${index + 1}`,
      title: `Viking mock item ${index + 1}`,
      category: index % 2 === 0 ? 'docs' : 'solutions'
    })
  }));

  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      const parsedBody = body ? JSON.parse(body) : {};
      res.setHeader('content-type', 'application/json');
      if (req.url === '/api/v1/dataset/ds-1/list_items') {
        state.dataListRequests += 1;
        const pageNumber = parsedBody.page_number ?? 1;
        const pageSize = parsedBody.page_size ?? 100;
        const start = (pageNumber - 1) * pageSize;
        res.end(JSON.stringify({ result: { items: items.slice(start, start + pageSize) } }));
        return;
      }
      if (req.url.endsWith('/chat/completions')) {
        state.llmRequests += 1;
        const userPayload = JSON.parse(parsedBody.messages?.[1]?.content ?? '{}');
        const count = userPayload.count ?? 1;
        const batchIndex = userPayload.batch_index ?? state.llmRequests;
        const queries = Array.from({ length: count }, (_, index) => ({
          id: `batch_${batchIndex}_q_${index + 1}`,
          text: `mock query ${batchIndex}-${index + 1}`,
          type: 'title_rewrite',
          intent: 'mock query generation',
          sourceItemIds: [`item-${batchIndex}-${index + 1}`]
        }));
        res.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify(queries) } }] }));
        return;
      }
      res.statusCode = 404;
      res.end(JSON.stringify({ error: `unexpected path: ${req.url}` }));
    });
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: callback => server.close(callback)
  };
}

async function startDataDeleteMockServer(state) {
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      const parsedBody = body ? JSON.parse(body) : {};
      res.setHeader('content-type', 'application/json');
      if (req.url === '/api/v1/dataset/ds-1/delete') {
        state.requests.push({ url: req.url, body: parsedBody });
        res.end(JSON.stringify({ ok: true, result: { deleted: true, ids: parsedBody._ids } }));
        return;
      }
      res.statusCode = 404;
      res.end(JSON.stringify({ error: `unexpected path: ${req.url}` }));
    });
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: callback => server.close(callback)
  };
}

async function testSearchTuneApplyDryRun() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'viking-acceptance-tune-apply-'));
  const runId = 'run_acceptance';
  const runDir = path.join(workspace, 'runs', runId);
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(
    path.join(runDir, 'report.json'),
    JSON.stringify(
      {
        runId,
        generatedAt: '2026-05-12T00:00:00Z',
        applicationId: 'app-1',
        datasetId: 'ds-1',
        profile: 'similarity-only',
        querySource: 'user-provided',
        topK: 5,
        queryCount: 2,
        strategyCount: 1,
        labelCount: 4,
        recommendedStrategyId: 'ks-test',
        strategyCoverage: {},
        strategies: [
          {
            id: 'ks-test',
            title: 'Keyword + semantic test',
            searchDynamic: {
              mode: 'UserDefined',
              user_defined_recall_mode: 'KeywordSemantic',
              dense_weight: 0.5,
              text_weight: 0.5,
              max_retrieved_num: 100,
              rerank_enabled: false
            },
            requestParams: {
              query_keyword_match_percent: 0.5,
              disable_personalize: true
            }
          }
        ],
        metrics: [],
        artifacts: {}
      },
      null,
      2
    )
  );

  const { stdout } = await runCli([
    'search',
    'tune',
    'apply',
    '--application-id',
    'app-1',
    '--run-id',
    runId,
    '--output-dir',
    workspace,
    '--dry-run',
    '--json'
  ]);
  const payload = JSON.parse(stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.dryRun, true);
  assert.equal(payload.createPayload.AppID, 'app-1');
  assert.equal(payload.onlinePayload.Config.SearchConfig.RetrieveConfigs[0].Mode, 4);
  assert.equal(payload.onlinePayload.Config.SearchConfig.RetrieveConfigs[0].UserDefinedRecallMode, 0);
  assert.equal(payload.onlinePayload.Config.SearchConfig.RetrieveConfigs[0].MaxRecallNum, 100);
  assert.equal(payload.onlinePayload.Config.SearchConfig.RetrieveConfigs[0].DenseWeight, 0.5);
  assert.equal(payload.unappliedRequestParams.query_keyword_match_percent, 0.5);
  return `${command.prefix} search tune apply --application-id app-1 --run-id ${runId} --output-dir ${workspace} --dry-run --json`;
}

async function testConfigSummaryHelp() {
  const datasetGet = await runCli(['dataset', 'get', '--help']);
  assert.match(datasetGet.stdout, /--full/);

  const appDatasetConfigGet = await runCli(['app', 'dataset-config', 'get', '--help']);
  assert.match(appDatasetConfigGet.stdout, /--full/);

  const appHelp = await runCli(['app', '--help']);
  assert.match(appHelp.stdout, /online-config get/i);
  assert.match(appHelp.stdout, /--full/);

  return `${command.prefix} dataset get --help && ${command.prefix} app dataset-config get --help && ${command.prefix} app --help`;
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

async function testLlmOpenAiCompatibleCredentialFlow() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'viking-acceptance-llm-'));
  const homeDir = path.join(workspace, 'home');
  fs.mkdirSync(homeDir, { recursive: true });
  const serverState = { llmRequests: 0 };
  const server = await startLlmCheckMockServer(serverState);

  try {
    const importResult = await runCli(['llm', 'import-env', '--profile', 'acceptance', '--store', 'file', '--json'], {
      env: {
        HOME: homeDir,
        VIKING_LLM_BASE_URL: server.baseUrl,
        VIKING_LLM_API_KEY: 'acceptance-llm-key',
        VIKING_LLM_MODEL: 'mock-model'
      }
    });
    const imported = JSON.parse(importResult.stdout);
    assert.equal(imported.ok, true);
    assert.equal(imported.provider, 'openai-compatible');
    assert.equal(imported.apiKeySource, 'secure-store');
    assert.equal(imported.credentialStore.savedBackend, 'file');

    const configPath = path.join(homeDir, '.viking', 'config.json');
    const configText = fs.readFileSync(configPath, 'utf8');
    assert.match(configText, /mock-model/);
    assert.doesNotMatch(configText, /acceptance-llm-key/);

    const statusResult = await runCli(['llm', 'status', '--profile', 'acceptance', '--json'], {
      env: emptyLlmEnv(homeDir)
    });
    const status = JSON.parse(statusResult.stdout);
    assert.equal(status.configured, true);
    assert.equal(status.provider, 'openai-compatible');
    assert.equal(status.baseUrl, server.baseUrl);
    assert.equal(status.model, 'mock-model');
    assert.equal(status.apiKeyConfigured, true);
    assert.equal(status.apiKeySource, 'secure-store');

    const checkResult = await runCli(['search', 'tune', 'llm-check', '--live', '--json'], {
      env: emptyLlmEnv(homeDir)
    });
    const check = JSON.parse(checkResult.stdout);
    assert.equal(check.ok, true);
    assert.equal(check.auth, 'api-key');
    assert.match(String(check.live), /"ok":true/);
    assert.equal(serverState.llmRequests, 1);
    return `${command.prefix} llm import-env --profile acceptance --store file --json`;
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

async function testSearchTuneLlmCheckGuidance() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'viking-acceptance-llm-guidance-'));
  const homeDir = path.join(workspace, 'home');
  fs.mkdirSync(homeDir, { recursive: true });
  const { stdout } = await runCli(['search', 'tune', 'llm-check', '--json'], {
    env: emptyLlmEnv(homeDir)
  });
  const payload = JSON.parse(stdout);
  assert.equal(payload.ok, false);
  assert.match(payload.detail, /vs llm login/);
  assert.match(payload.detail, /VIKING_LLM_BASE_URL/);
  assert.match(payload.detail, /VIKING_LLM_API_KEY/);
  assert.match(payload.detail, /VIKING_LLM_MODEL/);
  return `${command.prefix} search tune llm-check --json`;
}

function emptyLlmEnv(homeDir) {
  return {
    HOME: homeDir,
    VIKING_LLM_BASE_URL: '',
    VIKING_LLM_API_KEY: '',
    VIKING_LLM_AK: '',
    VIKING_LLM_SK: '',
    VIKING_LLM_MODEL: ''
  };
}

async function startLlmCheckMockServer(state) {
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      res.setHeader('content-type', 'application/json');
      if (req.url.endsWith('/chat/completions')) {
        state.llmRequests += 1;
        res.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ ok: true }) } }] }));
        return;
      }
      res.statusCode = 404;
      res.end(JSON.stringify({ error: `unexpected path: ${req.url}` }));
    });
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: callback => server.close(callback)
  };
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
