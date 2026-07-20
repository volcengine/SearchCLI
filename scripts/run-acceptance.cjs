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
const suiteArg = parseSuiteArg(process.argv.slice(2)) ?? 'all';
const liveEnabled = Boolean(process.env.VIKING_ACCEPTANCE_LIVE);
const timestamp = new Date().toISOString().replaceAll(':', '-').replace(/\.\d+Z$/, 'Z');
const reportDir = path.join(root, 'tmp-acceptance', `${timestamp}-${mode}`);
const reportPath = path.join(reportDir, 'acceptance.md');

const command = resolveCommand(mode);
const tests = [];
let currentSuite = 'core';

function parseSuiteArg(argv) {
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--suite' && argv[index + 1]) {
      return argv[index + 1];
    }
    if (value && value.startsWith('--suite=')) {
      return value.slice('--suite='.length);
    }
  }
  return undefined;
}

function shouldRunSuite(name) {
  if (suiteArg === 'all') return true;
  return suiteArg === name;
}

async function runSuite(name, fn) {
  if (!shouldRunSuite(name)) return;
  const previous = currentSuite;
  currentSuite = name;
  try {
    await fn();
  } finally {
    currentSuite = previous;
  }
}

async function main() {
  fs.mkdirSync(reportDir, { recursive: true });

  await runSuite('core', runCoreSuite);
  await runSuite('v2-onboarding', runV2OnboardingSuite);

  if (live || liveEnabled || suiteArg === 'live') {
    await runSuite('live', runLiveSuite);
  }

  writeReport();

  const failed = tests.filter(test => test.status === 'failed');
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

async function runCoreSuite() {
  await runTest('root-help', testRootHelp);
  await runTest('project-feature-flag', testProjectFeatureFlag);
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
  await runTest('project-create-deploy', testProjectCreateDeploy);
  await runTest('config-summary-help', testConfigSummaryHelp);
  await runTest('item-profile', testItemProfile);
  await runTest('item-plan', testItemPlan);
  await runTest('high-risk-guards', testHighRiskGuards);
  await runTest('auth-import-env', testAuthImportEnv);
  await runTest('llm-openai-compatible-credential-flow', testLlmOpenAiCompatibleCredentialFlow);
  await runTest('search-tune-llm-check-guidance', testSearchTuneLlmCheckGuidance);
}

async function runV2OnboardingSuite() {
  await runTest('v2-dataset-import-url-help', testDatasetImportUrlHelp);
  await runTest('v2-dataset-infer-schema-help', testDatasetInferSchemaHelp);
  await runTest('v2-dataset-infer-result-help', testDatasetInferResultHelp);
  await runTest('v2-app-attach-dataset-help', testAppAttachDatasetHelp);

  await runTest('v2-dataset-create-dry-run', testDatasetCreateDryRun);
  await runTest('v2-app-create-dry-run', testAppCreateDryRun);
  await runTest('v2-app-attach-dataset-dry-run', testAppAttachDatasetDryRun);
  await runTest('v2-dataset-ingest-dry-run', testDatasetIngestDryRun);

  await runTest('v2-dataset-import-url-mock', testDatasetImportUrlMock);
  await runTest('v2-dataset-infer-schema-mock', testDatasetInferSchemaMock);
  await runTest('v2-dataset-infer-schema-rejects-document', testDatasetInferSchemaRejectsDocument);
  await runTest('v2-dataset-infer-schema-rejects-multi-modal', testDatasetInferSchemaRejectsMultiModal);
  await runTest('v2-dataset-create-rejects-multi-modal', testDatasetCreateRejectsMultiModal);
  await runTest('v2-dataset-infer-result-mock', testDatasetInferResultMock);
  await runTest('v2-dataset-infer-result-render-schema-mixed', testDatasetInferResultRenderSchemaMixed);
  await runTest('v2-dataset-infer-result-render-schema-degenerate', testDatasetInferResultRenderSchemaDegenerate);
  await runTest('v2-dataset-infer-result-render-schema-no-data-config', testDatasetInferResultRenderSchemaNoDataConfig);
  await runTest('v2-dataset-infer-result-render-schema-stability', testDatasetInferResultRenderSchemaStability);
  await runTest('v2-dataset-create-mock', testDatasetCreateMock);
  await runTest('v2-app-create-mock', testAppCreateMock);
  await runTest('v2-app-attach-dataset-mock', testAppAttachDatasetMock);
  await runTest('v2-data-write-mock', testDataWriteMock);

  const orchestrator = loadV2OnboardingOrchestrator();
  if (orchestrator) {
    await runTest('v2-onboarding-pipeline-items', () =>
      orchestrator({
        runCli,
        startV2MockServer,
        fixturesDir: path.join(root, 'scripts', 'fixtures', 'v2-onboarding'),
        flavor: 'items'
      })
    );
    await runTest('v2-onboarding-pipeline-videos', () =>
      orchestrator({
        runCli,
        startV2MockServer,
        fixturesDir: path.join(root, 'scripts', 'fixtures', 'v2-onboarding'),
        flavor: 'videos'
      })
    );
  }
}

async function runLiveSuite() {
  if (!liveEnabled) {
    await runSkipped(
      'v2-onboarding-live',
      'VIKING_ACCEPTANCE_LIVE is not set. Live acceptance is opt-in only.'
    );
    return;
  }
  await runTest('v2-onboarding-live', testV2OnboardingLivePlaceholder);
}

function loadV2OnboardingOrchestrator() {
  const orchestratorPath = path.join(root, 'scripts', 'suites', 'v2-onboarding.cjs');
  if (!fs.existsSync(orchestratorPath)) return undefined;
  delete require.cache[require.resolve(orchestratorPath)];
  const mod = require(orchestratorPath);
  return mod && typeof mod.runV2OnboardingPipeline === 'function' ? mod.runV2OnboardingPipeline : undefined;
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
    VIKING_ENABLE_PROJECT: '0',
    ...options.env
  };

  return execFileAsync(file, [...extraArgs, ...argv], {
    cwd: options.cwd ?? root,
    env,
    maxBuffer: 16 * 1024 * 1024
  });
}

async function runTest(name, fn) {
  try {
    const detail = await fn();
    tests.push({ name, suite: currentSuite, status: 'passed', detail });
  } catch (error) {
    tests.push({
      name,
      suite: currentSuite,
      status: 'failed',
      detail: error instanceof Error ? `${error.name}: ${error.message}` : String(error)
    });
  }
}

async function runSkipped(name, reason) {
  tests.push({ name, suite: currentSuite, status: 'skipped', detail: reason });
}

async function testRootHelp() {
  const { stdout } = await runCli(['--help']);
  assert.match(stdout, /SearchCLI/);
  assert.match(stdout, /\bitem\b/);
  assert.doesNotMatch(stdout, /\bproject\b/);
  assert.match(stdout, /\bllm\b/);
  assert.doesNotMatch(stdout, /\bchat-mode\b/);
  assert.doesNotMatch(stdout, /\bchat-skill\b/);
  return `${command.prefix} --help`;
}

async function testProjectFeatureFlag() {
  await assert.rejects(() => runCli(['project', '--help']), /Unknown command: project/);
  const { stdout } = await runCli(['project', '--help'], {
    env: { VIKING_ENABLE_PROJECT: '1' }
  });
  assert.match(stdout, /project create \[project-name\]/i);
  assert.match(stdout, /project deploy --provider <provider>/i);
  return `VIKING_ENABLE_PROJECT=1 ${command.prefix} project --help`;
}

async function testSkillList() {
  const { stdout } = await runCli(['skill', 'list', '--json']);
  const payload = JSON.parse(stdout);
  const names = payload.skills.map(skill => skill.name).sort();
  assert.deepEqual(names, [
    'vs-alias-mapping',
    'vs-chat',
    'vs-item-onboarding',
    'vs-product-qa',
    'vs-project',
    'vs-recommend',
    'vs-search',
    'vs-search-tuning',
    'vs-search-tuning-partial-case',
    'vs-search-tuning-specify-policy-direction',
    'vs-shared',
    'vs-user-onboarding'
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

async function testProjectCreateDeploy() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'viking-acceptance-project-'));
  const featureEnv = { VIKING_ENABLE_PROJECT: '1' };
  try {
    const authEnv = {
      ...featureEnv,
      VIKING_API_KEY: 'secret-1',
      VIKING_AK: '',
      VIKING_SK: '',
      VIKING_CREDENTIALS_STORE: 'file'
    };
    const { stdout } = await runCli([
      'project',
      'create',
      'demo',
      '--app-id',
      'app-1',
      '--features',
      'chat',
      '--json'
    ], { cwd: workspace, env: authEnv });
    const created = JSON.parse(stdout);
    const projectDir = path.join(workspace, 'demo');
    assert.equal(created.ok, true);
    assert.equal(fs.realpathSync(created.result.projectDir), fs.realpathSync(projectDir));
    assert.equal(fs.readFileSync(path.join(projectDir, '.viking'), 'utf8').trim(), 'templateVersion=1.0.0');
    assert.match(fs.readFileSync(path.join(projectDir, 'apps/api/src/env.ts'), 'utf8'), /secret-1/);
    assert.match(fs.readFileSync(path.join(projectDir, '.gitignore'), 'utf8'), /apps\/api\/src\/env\.ts/);
    assert.doesNotMatch(stdout, /secret-1/);

    const fakeBin = path.join(workspace, 'bin');
    fs.mkdirSync(fakeBin);
    writeExecutable(path.join(fakeBin, 'npm'), `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
if (process.argv[2] === 'install') fs.mkdirSync(path.join(process.cwd(), 'node_modules'));
`);
    writeExecutable(path.join(fakeBin, 'npx'), `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args.includes('whoami')) process.exit(0);
console.log('https://demo.example.workers.dev');
`);

    const outputPath = path.join(workspace, 'deploy.json');
    const deployed = await runCli([
      'project',
      'deploy',
      '--provider',
      'cloudflare',
      '--project-dir',
      projectDir,
      '--dry-run',
      '--json',
      '--output',
      outputPath
    ], {
      env: {
        ...featureEnv,
        PATH: `${fakeBin}${path.delimiter}${process.env.PATH}`
      }
    });
    assert.equal(deployed.stdout, '');
    assert.equal(JSON.parse(fs.readFileSync(outputPath, 'utf8')).result.deploymentUrl, 'https://demo.example.workers.dev');
    return `${command.prefix} project create/deploy`;
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
}

function writeExecutable(filePath, content) {
  fs.writeFileSync(filePath, content);
  fs.chmodSync(filePath, 0o755);
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
  const server = await startV2MockServer({
    responses: {
      GetBillingOrder: () => ({ ResponseMetadata: { RequestId: 'req-auth-status' }, Result: { Status: 'ok' } })
    }
  });

  try {
    await runCli(['auth', 'import-env', '--profile', 'acceptance', '--json'], {
      env: {
        HOME: homeDir,
        VIKING_AK: 'acceptance-ak',
        VIKING_SK: 'acceptance-sk',
        VIKING_CONTROL_PLANE_BASE_URL: server.baseUrl,
        VIKING_DATA_PLANE_BASE_URL: server.baseUrl
      }
    });

    const { stdout } = await runCli(['auth', 'status', '--profile', 'acceptance', '--json'], {
      env: {
        HOME: homeDir,
        VIKING_CONTROL_PLANE_BASE_URL: server.baseUrl,
        VIKING_DATA_PLANE_BASE_URL: server.baseUrl
      }
    });
    const payload = JSON.parse(stdout);
    assert.equal(payload.activeProfile, 'acceptance');
    assert.equal(payload.loggedIn, true);
    return `${command.prefix} auth import-env --profile acceptance --json`;
  } finally {
    await server.close();
  }
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

async function startV2MockServer(state) {
  const responses = state.responses ?? {};
  state.requests = state.requests ?? [];

  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      res.setHeader('content-type', 'application/json');
      const parsedBody = body ? safeJsonParse(body) : {};
      const parsedUrl = new URL(req.url, 'http://placeholder.local');
      const action = parsedUrl.searchParams.get('Action');

      if (action) {
        state.requests.push({
          kind: 'control-plane',
          action,
          query: Object.fromEntries(parsedUrl.searchParams.entries()),
          body: parsedBody
        });
        const handler = responses[action];
        const payload = typeof handler === 'function'
          ? handler({ body: parsedBody, query: parsedUrl.searchParams })
          : handler;
        if (payload === undefined) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: `unhandled V2 action: ${action}` }));
          return;
        }
        res.end(JSON.stringify(payload));
        return;
      }

      const pathOnly = parsedUrl.pathname;
      const handler = responses[pathOnly];
      if (handler !== undefined) {
        state.requests.push({ kind: 'data-plane', path: pathOnly, body: parsedBody });
        const payload = typeof handler === 'function'
          ? handler({ body: parsedBody })
          : handler;
        if (payload === undefined) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: `unhandled data-plane path: ${pathOnly}` }));
          return;
        }
        res.end(JSON.stringify(payload));
        return;
      }

      res.statusCode = 404;
      res.end(JSON.stringify({ error: `unexpected request: ${req.method} ${req.url}` }));
    });
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  return {
    baseUrl,
    close: () => new Promise(resolve => server.close(resolve))
  };
}

function safeJsonParse(text) {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function v2ServiceFlags(baseUrl) {
  return [
    '--control-plane-base-url',
    baseUrl,
    '--data-plane-base-url',
    baseUrl,
    '--region',
    'cn-north-1',
    '--ak',
    'mock-ak',
    '--sk',
    'mock-sk',
    '--timeout-ms',
    '5000'
  ];
}

function envWithVikingBaseUrlsReset(baseUrl) {
  return {
    VIKING_CONTROL_PLANE_BASE_URL: baseUrl,
    VIKING_DATA_PLANE_BASE_URL: baseUrl,
    VIKING_ACCESS_KEY_ID: 'mock-ak',
    VIKING_SECRET_KEY: 'mock-sk',
    VIKING_REGION: 'cn-north-1'
  };
}

async function testDatasetImportUrlHelp() {
  const { stdout } = await runCli(['dataset', 'import-url', '--help']);
  assert.match(stdout, /Request a presigned upload URL for V2 dataset onboarding/);
  assert.match(stdout, /--file-name/);
  assert.match(stdout, /GetPresignedImportUrlV2/);
  return `${command.prefix} dataset import-url --help`;
}

async function testDatasetInferSchemaHelp() {
  const { stdout } = await runCli(['dataset', 'infer-schema', '--help']);
  assert.match(stdout, /Submit a schema inference task for V2 dataset onboarding/);
  assert.match(stdout, /AddInferDatasetSchemaTaskV2/);
  assert.match(stdout, /--tos-key/);
  assert.match(stdout, /--type/);
  return `${command.prefix} dataset infer-schema --help`;
}

async function testDatasetInferResultHelp() {
  const { stdout } = await runCli(['dataset', 'infer-result', '--help']);
  assert.match(stdout, /Fetch the latest result of a V2 schema inference task/);
  assert.match(stdout, /GetInferDatasetSchemaResultV2/);
  assert.match(stdout, /--task-id/);
  return `${command.prefix} dataset infer-result --help`;
}

async function testAppAttachDatasetHelp() {
  const { stdout } = await runCli(['app', 'attach-dataset', '--help']);
  assert.match(stdout, /Attach a dataset to an application/);
  assert.match(stdout, /AttachDatasetToApplicationV2/);
  assert.match(stdout, /--app-id/);
  assert.match(stdout, /--dataset-id/);
  assert.match(stdout, /--data-config/);
  return `${command.prefix} app attach-dataset --help`;
}

async function testDatasetCreateDryRun() {
  const state = {
    requests: [],
    responses: {
      CreateDatasetV2: ({ body }) => ({
        ResponseMetadata: { RequestId: 'req-create-dry-run' },
        Result: { DatasetID: undefined, DryRun: body?.DryRun === true }
      })
    }
  };
  const server = await startV2MockServer(state);
  try {
    const fixture = path.join(root, 'scripts', 'fixtures', 'v2-onboarding', 'dataset-create.json');
    const fixtureRaw = JSON.parse(fs.readFileSync(fixture, 'utf8'));
    const tempPath = path.join(reportDir, 'dataset-create-dry-run.json');
    fs.writeFileSync(tempPath, JSON.stringify({ ...fixtureRaw, DryRun: true }));
    const { stdout } = await runCli(
      ['dataset', 'create', '--data', `@${tempPath}`, ...v2ServiceFlags(server.baseUrl)],
      { env: envWithVikingBaseUrlsReset(server.baseUrl) }
    );
    assert.equal(state.requests.length, 1);
    assert.equal(state.requests[0].kind, 'control-plane');
    assert.equal(state.requests[0].action, 'CreateDatasetV2');
    assert.equal(state.requests[0].body.DryRun, true);
    assert.equal(state.requests[0].body.Type, 'item');
    assert.equal(state.requests[0].body.Industry, 'e_commerce');
    assert.match(stdout, /req-create-dry-run/);
    return `${command.prefix} dataset create --data @${tempPath}`;
  } finally {
    await server.close();
  }
}

async function testAppCreateDryRun() {
  const state = {
    requests: [],
    responses: {
      CreateApplicationV2: ({ body }) => ({
        ResponseMetadata: { RequestId: 'req-app-create-dry-run' },
        Result: { ApplicationId: undefined, DryRun: body?.DryRun === true }
      })
    }
  };
  const server = await startV2MockServer(state);
  try {
    const { stdout } = await runCli(
      [
        'app',
        'create',
        '--name',
        'acc-app',
        '--industry',
        'ecommerce',
        '--language',
        'zh',
        '--dry-run',
        ...v2ServiceFlags(server.baseUrl)
      ],
      { env: envWithVikingBaseUrlsReset(server.baseUrl) }
    );
    assert.equal(state.requests.length, 1);
    assert.equal(state.requests[0].action, 'CreateApplicationV2');
    assert.equal(state.requests[0].body.Name, 'acc-app');
    assert.equal(state.requests[0].body.Industry, 'e_commerce');
    assert.equal(state.requests[0].body.Language, 'zh');
    assert.equal(state.requests[0].body.DryRun, true);
    assert.match(stdout, /req-app-create-dry-run/);
    return `${command.prefix} app create --dry-run`;
  } finally {
    await server.close();
  }
}

async function testAppAttachDatasetDryRun() {
  const state = {
    requests: [],
    responses: {
      AttachDatasetToApplicationV2: ({ body }) => ({
        ResponseMetadata: { RequestId: 'req-attach-dry-run' },
        Result: { DryRun: body?.DryRun === true }
      })
    }
  };
  const server = await startV2MockServer(state);
  try {
    const fixture = path.join(root, 'scripts', 'fixtures', 'v2-onboarding', 'attach.json');
    const fixtureRaw = JSON.parse(fs.readFileSync(fixture, 'utf8'));
    const tempPath = path.join(reportDir, 'attach-dry-run.json');
    fs.writeFileSync(tempPath, JSON.stringify({ ...fixtureRaw, DryRun: true }));
    const { stdout } = await runCli(
      ['app', 'attach-dataset', '--data', `@${tempPath}`, ...v2ServiceFlags(server.baseUrl)],
      { env: envWithVikingBaseUrlsReset(server.baseUrl) }
    );
    assert.equal(state.requests.length, 1);
    assert.equal(state.requests[0].action, 'AttachDatasetToApplicationV2');
    assert.equal(state.requests[0].body.ApplicationId, 'acc-app-1');
    assert.equal(state.requests[0].body.DatasetId, 'acc-ds-1');
    assert.equal(state.requests[0].body.DryRun, true);
    assert.ok(state.requests[0].body.DataConfig);
    assert.match(stdout, /req-attach-dry-run/);
    return `${command.prefix} app attach-dataset --data @${tempPath}`;
  } finally {
    await server.close();
  }
}

async function testDatasetIngestDryRun() {
  let inferPolls = 0;
  const state = {
    requests: [],
    responses: {
      GetPresignedImportUrlV2: ({ query }) => ({
        ResponseMetadata: { RequestId: 'req-import-url' },
        Result: {
          FileUrl: `${query.get('placeholder') ?? ''}` || 'http://127.0.0.1:0/__noop_upload',
          FileKey: 'mock-onboarding/items.jsonl'
        }
      }),
      AddInferDatasetSchemaTaskV2: () => ({
        ResponseMetadata: { RequestId: 'req-infer-task' },
        Result: { TaskID: 'task_mock_123' }
      }),
      GetInferDatasetSchemaResultV2: () => {
        inferPolls += 1;
        if (inferPolls < 1) {
          return {
            ResponseMetadata: { RequestId: `req-infer-poll-${inferPolls}` },
            Result: { Status: 'Running' }
          };
        }
        return {
          ResponseMetadata: { RequestId: `req-infer-poll-${inferPolls}` },
          Result: JSON.parse(
            fs.readFileSync(
              path.join(root, 'scripts', 'fixtures', 'v2-onboarding', 'infer-result.json'),
              'utf8'
            )
          )
        };
      },
      CreateDatasetV2: ({ body }) => ({
        ResponseMetadata: { RequestId: 'req-create-from-ingest' },
        Result: { DatasetID: undefined, DryRun: body?.DryRun === true }
      })
    }
  };

  const server = await startV2MockServer(state);

  let uploadCallCount = 0;
  const uploadServer = http.createServer((req, res) => {
    uploadCallCount += 1;
    res.statusCode = 200;
    res.end('');
  });
  await new Promise(resolve => uploadServer.listen(0, '127.0.0.1', resolve));
  const uploadAddress = uploadServer.address();
  state.responses.GetPresignedImportUrlV2 = () => ({
    ResponseMetadata: { RequestId: 'req-import-url' },
    Result: {
      FileUrl: `http://127.0.0.1:${uploadAddress.port}/upload`,
      FileKey: 'mock-onboarding/items.jsonl'
    }
  });

  try {
    const fixture = path.join(root, 'scripts', 'fixtures', 'v2-onboarding', 'items.jsonl');
    const { stdout } = await runCli(
      [
        'dataset',
        'ingest',
        '--file',
        fixture,
        '--type',
        'item',
        '--industry',
        'e_commerce',
        '--language',
        'zh',
        '--schema-poll-interval-ms',
        '50',
        '--schema-wait-timeout-ms',
        '5000',
        '--dry-run',
        ...v2ServiceFlags(server.baseUrl)
      ],
      { env: envWithVikingBaseUrlsReset(server.baseUrl) }
    );

    const actions = state.requests.filter(req => req.kind === 'control-plane').map(req => req.action);
    assert.ok(actions.includes('GetPresignedImportUrlV2'), `expected GetPresignedImportUrlV2 call, got ${actions.join(',')}`);
    assert.ok(actions.includes('AddInferDatasetSchemaTaskV2'));
    assert.ok(actions.includes('GetInferDatasetSchemaResultV2'));
    assert.ok(actions.includes('CreateDatasetV2'));
    assert.equal(uploadCallCount, 1, 'expected exactly one upload PUT');
    const createCall = state.requests.find(req => req.action === 'CreateDatasetV2');
    assert.equal(createCall.body.DryRun, true);
    assert.equal(createCall.body.Type, 'item');
    assert.match(stdout, /dry_run/i);
    return `${command.prefix} dataset ingest --file items.jsonl --dry-run`;
  } finally {
    await server.close();
    await new Promise(resolve => uploadServer.close(resolve));
  }
}

async function testDatasetImportUrlMock() {
  const state = {
    requests: [],
    responses: {
      GetPresignedImportUrlV2: () => ({
        ResponseMetadata: { RequestId: 'req-import-url' },
        Result: { FileUrl: 'https://upload.example/u/123', FileKey: 'onboarding/items.jsonl' }
      })
    }
  };
  const server = await startV2MockServer(state);
  try {
    const { stdout } = await runCli(
      [
        'dataset',
        'import-url',
        '--file-name',
        'items.jsonl',
        '--project-name',
        'acc-project',
        ...v2ServiceFlags(server.baseUrl)
      ],
      { env: envWithVikingBaseUrlsReset(server.baseUrl) }
    );
    assert.equal(state.requests.length, 1);
    const call = state.requests[0];
    assert.equal(call.kind, 'control-plane');
    assert.equal(call.action, 'GetPresignedImportUrlV2');
    assert.equal(call.query.Version, '2025-03-01');
    assert.equal(call.query.Region, 'cn-north-1');
    assert.equal(call.body.FileName, 'items.jsonl');
    assert.equal(call.body.ProjectName, 'acc-project');
    assert.match(stdout, /onboarding\/items.jsonl/);
    return `${command.prefix} dataset import-url --file-name items.jsonl`;
  } finally {
    await server.close();
  }
}

async function testDatasetInferSchemaMock() {
  const state = {
    requests: [],
    responses: {
      AddInferDatasetSchemaTaskV2: () => ({
        ResponseMetadata: { RequestId: 'req-infer-schema' },
        Result: { TaskID: 'task_xyz' }
      })
    }
  };
  const server = await startV2MockServer(state);
  try {
    const { stdout } = await runCli(
      [
        'dataset',
        'infer-schema',
        '--tos-key',
        'onboarding/items.jsonl',
        '--type',
        'item',
        '--industry',
        'ecommerce',
        '--language',
        'zh',
        '--project-name',
        'acc-project',
        ...v2ServiceFlags(server.baseUrl)
      ],
      { env: envWithVikingBaseUrlsReset(server.baseUrl) }
    );
    assert.equal(state.requests.length, 1);
    const call = state.requests[0];
    assert.equal(call.action, 'AddInferDatasetSchemaTaskV2');
    assert.equal(call.body.TosKey, 'onboarding/items.jsonl');
    assert.equal(call.body.Type, 'item');
    assert.equal(call.body.Industry, 'e_commerce');
    assert.equal(call.body.Language, 'zh');
    assert.match(stdout, /task_xyz/);
    return `${command.prefix} dataset infer-schema --tos-key ... --type item`;
  } finally {
    await server.close();
  }
}

async function expectCliRejection(argv, { pattern, env } = {}) {
  let captured;
  try {
    await runCli(argv, env ? { env } : undefined);
  } catch (err) {
    captured = err;
  }
  assert.ok(captured, 'expected CLI invocation to fail');
  const stderr = String(captured.stderr ?? '');
  const stdout = String(captured.stdout ?? '');
  assert.match(stderr + stdout, pattern);
  return captured;
}

async function testDatasetInferSchemaRejectsDocument() {
  await expectCliRejection(
    [
      'dataset',
      'infer-schema',
      '--tos-key',
      'onboarding/items.jsonl',
      '--type',
      'document',
      ...v2ServiceFlags('http://127.0.0.1:1')
    ],
    {
      pattern: /(not allowed here|Invalid dataset Type).*item.*video.*user_event/i,
      env: envWithVikingBaseUrlsReset('http://127.0.0.1:1')
    }
  );
  return `${command.prefix} dataset infer-schema --type document (rejected)`;
}

async function testDatasetInferSchemaRejectsMultiModal() {
  await expectCliRejection(
    [
      'dataset',
      'infer-schema',
      '--tos-key',
      'onboarding/items.jsonl',
      '--type',
      'multi_modal',
      ...v2ServiceFlags('http://127.0.0.1:1')
    ],
    {
      pattern: /(not allowed here|Invalid dataset Type).*item.*video.*user_event/i,
      env: envWithVikingBaseUrlsReset('http://127.0.0.1:1')
    }
  );
  return `${command.prefix} dataset infer-schema --type multi_modal (rejected)`;
}

async function testDatasetCreateRejectsMultiModal() {
  await expectCliRejection(
    [
      'dataset',
      'create',
      '--name',
      'demo-mm',
      '--type',
      'multi_modal',
      ...v2ServiceFlags('http://127.0.0.1:1')
    ],
    {
      pattern: /(not allowed here|Invalid dataset Type).*item.*video.*user_event.*document/i,
      env: envWithVikingBaseUrlsReset('http://127.0.0.1:1')
    }
  );
  return `${command.prefix} dataset create --type multi_modal (rejected)`;
}

async function testDatasetInferResultMock() {
  const inferResult = JSON.parse(
    fs.readFileSync(path.join(root, 'scripts', 'fixtures', 'v2-onboarding', 'infer-result.json'), 'utf8')
  );
  const state = {
    requests: [],
    responses: {
      GetInferDatasetSchemaResultV2: () => ({
        ResponseMetadata: { RequestId: 'req-infer-result' },
        Result: inferResult
      })
    }
  };
  const server = await startV2MockServer(state);
  try {
    const { stdout } = await runCli(
      [
        'dataset',
        'infer-result',
        '--task-id',
        'task_xyz',
        '--project-name',
        'acc-project',
        ...v2ServiceFlags(server.baseUrl)
      ],
      { env: envWithVikingBaseUrlsReset(server.baseUrl) }
    );
    assert.equal(state.requests.length, 1);
    const call = state.requests[0];
    assert.equal(call.action, 'GetInferDatasetSchemaResultV2');
    assert.equal(call.body.TaskID, 'task_xyz');
    assert.equal(call.body.ProjectName, 'acc-project');
    assert.match(stdout, /Success/);
    assert.match(stdout, /item_id/);
    return `${command.prefix} dataset infer-result --task-id task_xyz`;
  } finally {
    await server.close();
  }
}

async function testDatasetInferResultRenderSchemaMixed() {
  const mixedResult = {
    Status: 'Success',
    Schema: [
      { FieldName: 'item_id', FieldType: 'string', BizAttr: 'QueryPK', IsPK: true, Required: true },
      { Name: 'title', Type: 'string', BizAttr: 'Title', Required: false },
      { Name: 'tags', FieldType: 'array<string>' },
      { FieldName: 'price', Type: 'float' }
    ],
    FieldDescMap: {
      item_id: 'Primary key',
      title: 'Title for search results',
      tags: 'Free-form tags'
    },
    DataFieldConfig: {
      IndexFields: ['title', 'tags'],
      FilterFields: ['price', 'non_existing'],
      SuggestFields: ['title'],
      FilterFieldsMap: { price: { Type: 'float' } }
    }
  };
  return runInferResultRenderSchema(mixedResult, ({ stdout }) => {
    assert.match(stdout, /vs-schema-confirm: BEGIN/);
    assert.match(stdout, /Field count: 4/);
    assert.match(stdout, /Primary key: item_id \(BizAttr=QueryPK\)/);
    assert.match(stdout, /name\s+\|\s+type\s+\|\s+BizAttr\s+\|\s+required\s+\|\s+description/);
    assert.match(stdout, /item_id\s+\|\s+`string`\s+\|\s+QueryPK\s+\|\s+yes\s+\|\s+Primary key/);
    assert.match(stdout, /tags\s+\|\s+`array<string>`\s+\|\s+-\s+\|\s+-\s+\|\s+Free-form tags/);
    assert.match(stdout, /price\s+\|\s+`float`\s+\|\s+-\s+\|\s+-\s+\|\s+-/);
    assert.match(stdout, /FieldDescMap is missing entries for: price/);
    assert.match(stdout, /Field roles reference unknown schema fields: non_existing/);
  });
}

async function testDatasetInferResultRenderSchemaDegenerate() {
  const degenerate = {
    Status: 'Success',
    Schema: [
      { FieldName: 'doc_id', FieldType: 'string' },
      { FieldName: 'body', FieldType: 'string' }
    ]
  };
  return runInferResultRenderSchema(degenerate, ({ stdout }) => {
    assert.match(stdout, /vs-schema-confirm: BEGIN/);
    assert.match(stdout, /Field count: 2/);
    assert.match(stdout, /Primary key: \(none\)/);
    assert.match(stdout, /doc_id\s+\|\s+`string`\s+\|\s+-\s+\|\s+-\s+\|\s+-/);
    assert.match(stdout, /No field carries a primary-key BizAttr/);
    assert.match(stdout, /DataFieldConfig\.IndexFields is empty/);
    assert.match(stdout, /FieldDescMap is missing entries for: doc_id, body/);
  });
}

async function testDatasetInferResultRenderSchemaNoDataConfig() {
  const noDataConfig = {
    Status: 'Success',
    Schema: [
      { FieldName: 'video_id', FieldType: 'string', BizAttr: 'VideoContentID', IsPK: true },
      { FieldName: 'cover', FieldType: 'string', BizAttr: 'ImagePK' }
    ],
    FieldDescMap: {
      video_id: 'Primary key',
      cover: 'Cover image'
    }
  };
  return runInferResultRenderSchema(noDataConfig, ({ stdout }) => {
    assert.match(stdout, /Field count: 2/);
    assert.match(stdout, /Primary key: video_id \(BizAttr=VideoContentID\)/);
    assert.match(stdout, /IndexFields:\s+\(none\)/);
    assert.match(stdout, /FilterFields:\s+\(none\)/);
    assert.match(stdout, /SuggestFields:\s+\(none\)/);
    assert.match(stdout, /DataFieldConfig\.IndexFields is empty/);
  });
}

async function testDatasetInferResultRenderSchemaStability() {
  const fixture = JSON.parse(
    fs.readFileSync(path.join(root, 'scripts', 'fixtures', 'v2-onboarding', 'infer-result.json'), 'utf8')
  );
  const state = {
    requests: [],
    responses: {
      GetInferDatasetSchemaResultV2: () => ({
        ResponseMetadata: { RequestId: 'req-infer-result-stability' },
        Result: fixture
      })
    }
  };
  const server = await startV2MockServer(state);
  try {
    const outputs = [];
    for (let i = 0; i < 5; i += 1) {
      const { stdout } = await runCli(
        [
          'dataset', 'infer-result',
          '--task-id', 'task_stability',
          '--render-schema',
          ...v2ServiceFlags(server.baseUrl)
        ],
        { env: envWithVikingBaseUrlsReset(server.baseUrl) }
      );
      outputs.push(stdout);
    }
    for (let i = 1; i < outputs.length; i += 1) {
      assert.equal(outputs[i], outputs[0], `render-schema output drifted across runs (run ${i + 1})`);
    }
    assert.match(outputs[0], /vs-schema-confirm: BEGIN/);
    assert.match(outputs[0], /Primary key: item_id \(BizAttr=QueryPK\)/);
    assert.match(outputs[0], /Field count: 7/);
    return `${command.prefix} dataset infer-result --render-schema (5x stability)`;
  } finally {
    await server.close();
  }
}

async function runInferResultRenderSchema(result, assertions) {
  const state = {
    requests: [],
    responses: {
      GetInferDatasetSchemaResultV2: () => ({
        ResponseMetadata: { RequestId: 'req-infer-result-render' },
        Result: result
      })
    }
  };
  const server = await startV2MockServer(state);
  try {
    const { stdout } = await runCli(
      [
        'dataset', 'infer-result',
        '--task-id', 'task_render',
        '--render-schema',
        ...v2ServiceFlags(server.baseUrl)
      ],
      { env: envWithVikingBaseUrlsReset(server.baseUrl) }
    );
    assertions({ stdout });
    return `${command.prefix} dataset infer-result --render-schema`;
  } finally {
    await server.close();
  }
}

async function testDatasetCreateMock() {
  const state = {
    requests: [],
    responses: {
      CreateDatasetV2: ({ body }) => ({
        ResponseMetadata: { RequestId: 'req-create' },
        Result: { DatasetID: 'ds_mock_123', DryRun: body?.DryRun === true }
      })
    }
  };
  const server = await startV2MockServer(state);
  try {
    const fixture = path.join(root, 'scripts', 'fixtures', 'v2-onboarding', 'dataset-create.json');
    const { stdout } = await runCli(
      ['dataset', 'create', '--data', `@${fixture}`, ...v2ServiceFlags(server.baseUrl)],
      { env: envWithVikingBaseUrlsReset(server.baseUrl) }
    );
    assert.equal(state.requests.length, 1);
    const call = state.requests[0];
    assert.equal(call.action, 'CreateDatasetV2');
    assert.equal(call.body.Type, 'item');
    assert.equal(call.body.Industry, 'e_commerce');
    assert.equal(call.body.Name, 'acc-items');
    assert.ok(Array.isArray(call.body.Schema));
    assert.ok(call.body.Schema.some(field => field.FieldName === 'item_id' || field.Name === 'item_id'));
    assert.match(stdout, /ds_mock_123/);
    return `${command.prefix} dataset create --data @${fixture}`;
  } finally {
    await server.close();
  }
}

async function testAppCreateMock() {
  const state = {
    requests: [],
    responses: {
      CreateApplicationV2: () => ({
        ResponseMetadata: { RequestId: 'req-app-create' },
        Result: { ApplicationId: 'app_mock_123' }
      })
    }
  };
  const server = await startV2MockServer(state);
  try {
    const { stdout } = await runCli(
      [
        'app',
        'create',
        '--name',
        'acc-app',
        '--industry',
        'ecommerce',
        '--language',
        'zh',
        ...v2ServiceFlags(server.baseUrl)
      ],
      { env: envWithVikingBaseUrlsReset(server.baseUrl) }
    );
    assert.equal(state.requests.length, 1);
    const call = state.requests[0];
    assert.equal(call.action, 'CreateApplicationV2');
    assert.equal(call.body.Name, 'acc-app');
    assert.equal(call.body.Industry, 'e_commerce');
    assert.equal(call.body.Language, 'zh');
    assert.match(stdout, /app_mock_123/);
    return `${command.prefix} app create --name acc-app`;
  } finally {
    await server.close();
  }
}

async function testAppAttachDatasetMock() {
  const state = {
    requests: [],
    responses: {
      AttachDatasetToApplicationV2: () => ({
        ResponseMetadata: { RequestId: 'req-attach' },
        Result: { Attached: true }
      })
    }
  };
  const server = await startV2MockServer(state);
  try {
    const fixture = path.join(root, 'scripts', 'fixtures', 'v2-onboarding', 'attach.json');
    const { stdout } = await runCli(
      ['app', 'attach-dataset', '--data', `@${fixture}`, ...v2ServiceFlags(server.baseUrl)],
      { env: envWithVikingBaseUrlsReset(server.baseUrl) }
    );
    assert.equal(state.requests.length, 1);
    const call = state.requests[0];
    assert.equal(call.action, 'AttachDatasetToApplicationV2');
    assert.equal(call.body.ApplicationId, 'acc-app-1');
    assert.equal(call.body.DatasetId, 'acc-ds-1');
    assert.ok(call.body.DataConfig);
    assert.ok(Array.isArray(call.body.DataConfig.IndexFields));
    assert.match(stdout, /req-attach/);
    return `${command.prefix} app attach-dataset --data @${fixture}`;
  } finally {
    await server.close();
  }
}

async function testDataWriteMock() {
  const state = {
    requests: [],
    responses: {
      '/api/v1/dataset/acc-ds-1/write': () => ({ result: { written: true, count: 3 } })
    }
  };
  const server = await startV2MockServer(state);
  try {
    const fixture = path.join(root, 'scripts', 'fixtures', 'v2-onboarding', 'items.jsonl');
    const fields = fs
      .readFileSync(fixture, 'utf8')
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => JSON.parse(line));
    const tempPath = path.join(reportDir, 'data-write-fields.json');
    fs.writeFileSync(tempPath, JSON.stringify(fields));

    const { stdout } = await runCli(
      [
        'data',
        'write',
        '--dataset-id',
        'acc-ds-1',
        '--fields',
        `@${tempPath}`,
        ...v2ServiceFlags(server.baseUrl)
      ],
      { env: envWithVikingBaseUrlsReset(server.baseUrl) }
    );
    assert.equal(state.requests.length, 1);
    const call = state.requests[0];
    assert.equal(call.kind, 'data-plane');
    assert.equal(call.path, '/api/v1/dataset/acc-ds-1/write');
    assert.ok(Array.isArray(call.body.fields));
    assert.equal(call.body.fields.length, 3);
    assert.match(stdout, /written/);
    return `${command.prefix} data write --dataset-id acc-ds-1`;
  } finally {
    await server.close();
  }
}

async function testV2OnboardingLivePlaceholder() {
  return 'Live V2 onboarding suite is a placeholder. Replace with a real signed E2E call when ready.';
}

function writeReport() {
  const lines = [
    '# Acceptance',
    '',
    `- mode: ${mode}`,
    `- suite: ${suiteArg}`,
    `- live: ${live || liveEnabled ? 'true' : 'false'}`,
    `- command: ${command.prefix}`,
    ''
  ];

  const counts = { passed: 0, failed: 0, skipped: 0 };
  for (const test of tests) {
    counts[test.status] = (counts[test.status] ?? 0) + 1;
  }
  lines.push('## Summary');
  lines.push(`- passed: ${counts.passed ?? 0}`);
  lines.push(`- failed: ${counts.failed ?? 0}`);
  lines.push(`- skipped: ${counts.skipped ?? 0}`);
  lines.push(`- total: ${tests.length}`);
  lines.push('');

  const bySuite = new Map();
  for (const test of tests) {
    const suiteName = test.suite ?? 'core';
    if (!bySuite.has(suiteName)) {
      bySuite.set(suiteName, []);
    }
    bySuite.get(suiteName).push(test);
  }

  for (const [suiteName, suiteTests] of bySuite) {
    const suitePassed = suiteTests.filter(test => test.status === 'passed').length;
    const suiteFailed = suiteTests.filter(test => test.status === 'failed').length;
    const suiteSkipped = suiteTests.filter(test => test.status === 'skipped').length;
    lines.push(`# Suite: ${suiteName}`);
    lines.push('');
    lines.push(`- passed: ${suitePassed}`);
    lines.push(`- failed: ${suiteFailed}`);
    lines.push(`- skipped: ${suiteSkipped}`);
    lines.push('');
    for (const test of suiteTests) {
      lines.push(`## ${test.name}`);
      lines.push(`- status: ${test.status}`);
      lines.push(`- detail: ${test.detail}`);
      lines.push('');
    }
  }

  fs.writeFileSync(reportPath, `${lines.join('\n')}\n`, 'utf8');
  console.log(`Acceptance report written: ${reportPath}`);
}

void main().catch(error => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
