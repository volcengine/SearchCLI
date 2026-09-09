// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const assert = require('node:assert/strict');
const os = require('node:os');

const FLAVOR_DEFINITIONS = {
  items: {
    fileName: 'items.jsonl',
    datasetType: 'multi_modal',
    theme: 'e_commerce',
    industry: 'ecommerce',
    industryValue: 'e_commerce',
    datasetName: 'acc-items-pipeline',
    appName: 'acc-app-pipeline-items'
  },
  videos: {
    fileName: 'videos.jsonl',
    datasetType: 'multi_modal',
    theme: 'long_video',
    industry: 'video',
    industryValue: 'video',
    datasetName: 'acc-videos-pipeline',
    appName: 'acc-app-pipeline-videos'
  }
};

async function runV2OnboardingPipeline({ runCli, startV2MockServer, fixturesDir, flavor }) {
  const def = FLAVOR_DEFINITIONS[flavor];
  if (!def) throw new Error(`unknown V2 onboarding flavor: ${flavor}`);

  const inferResultFixture = JSON.parse(
    fs.readFileSync(path.join(fixturesDir, 'infer-result.json'), 'utf8')
  );

  const expectedFileName = def.fileName;
  const expectedTosKey = `mock-onboarding/${expectedFileName}`;
  const expectedDatasetId = `ds_${flavor}_mock_001`;
  const expectedAppId = `app_${flavor}_mock_001`;
  const expectedTaskId = `task_${flavor}_mock_001`;

  const uploadCalls = [];
  const uploadServer = http.createServer((req, res) => {
    let chunks = 0;
    req.on('data', chunk => {
      chunks += chunk.length;
    });
    req.on('end', () => {
      uploadCalls.push({ method: req.method, url: req.url, bytes: chunks });
      res.statusCode = 200;
      res.end('');
    });
  });
  await new Promise(resolve => uploadServer.listen(0, '127.0.0.1', resolve));
  const uploadPort = uploadServer.address().port;
  const presignedUrl = `http://127.0.0.1:${uploadPort}/upload/${expectedFileName}`;

  let inferPolls = 0;
  const state = {
    requests: [],
    responses: {
      GetPresignedImportUrlV2: ({ body }) => {
        assert.equal(body.FileName, expectedFileName, `expected FileName ${expectedFileName}`);
        return {
          ResponseMetadata: { RequestId: `req-import-url-${flavor}` },
          Result: { FileUrl: presignedUrl, FileKey: expectedTosKey }
        };
      },
      AddInferDatasetSchemaTaskV2: ({ body }) => {
        assert.equal(body.TosKey, expectedTosKey);
        assert.equal(body.Type, def.datasetType);
        assert.equal(body.Theme, def.theme);
        return {
          ResponseMetadata: { RequestId: `req-infer-task-${flavor}` },
          Result: { TaskID: expectedTaskId }
        };
      },
      GetInferDatasetSchemaResultV2: ({ body }) => {
        assert.equal(body.TaskID, expectedTaskId);
        inferPolls += 1;
        if (inferPolls === 1) {
          return {
            ResponseMetadata: { RequestId: `req-infer-poll-${flavor}-${inferPolls}` },
            Result: { Status: 'processing' }
          };
        }
        return {
          ResponseMetadata: { RequestId: `req-infer-poll-${flavor}-${inferPolls}` },
          Result: { Status: 'succeeded', ...inferResultFixture }
        };
      },
      CreateDatasetV2: ({ body }) => {
        assert.equal(body.Type, def.datasetType);
        assert.equal(body.Industry, def.industryValue);
        assert.ok(Array.isArray(body.Schema), 'expected Schema array in CreateDatasetV2');
        return {
          ResponseMetadata: { RequestId: `req-create-dataset-${flavor}` },
          Result: { DatasetID: expectedDatasetId }
        };
      },
      CreateApplicationV2: ({ body }) => {
        assert.equal(body.Name, def.appName);
        assert.equal(body.Industry, def.industryValue);
        return {
          ResponseMetadata: { RequestId: `req-create-app-${flavor}` },
          Result: { ApplicationId: expectedAppId }
        };
      },
      AttachDatasetToApplicationV2: ({ body }) => {
        assert.equal(body.ApplicationId, expectedAppId);
        assert.equal(body.DatasetId, expectedDatasetId);
        assert.ok(body.DataConfig, 'expected DataConfig in AttachDatasetToApplicationV2');
        return {
          ResponseMetadata: { RequestId: `req-attach-${flavor}` },
          Result: { Attached: true }
        };
      },
      [`/api/v1/dataset/${expectedDatasetId}/write`]: ({ body }) => {
        assert.ok(Array.isArray(body.fields), 'expected fields array in /write request');
        return { result: { written: true, count: body.fields.length } };
      }
    }
  };

  const server = await startV2MockServer(state);
  const baseUrl = server.baseUrl;
  const serviceFlags = [
    '--control-plane-base-url', baseUrl,
    '--data-plane-base-url', baseUrl,
    '--region', 'cn-north-1',
    '--ak', 'mock-ak',
    '--sk', 'mock-sk',
    '--timeout-ms', '5000'
  ];
  const env = {
    VIKING_CONTROL_PLANE_BASE_URL: baseUrl,
    VIKING_DATA_PLANE_BASE_URL: baseUrl,
    VIKING_ACCESS_KEY_ID: 'mock-ak',
    VIKING_SECRET_KEY: 'mock-sk',
    VIKING_REGION: 'cn-north-1'
  };

  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), `v2-onboarding-${flavor}-`));
  try {
    const datasetIngest = await runCli(
      [
        'dataset', 'ingest',
        '--file', path.join(fixturesDir, expectedFileName),
        '--type', def.datasetType,
        '--theme', def.theme,
        '--industry', def.industryValue,
        '--language', 'zh',
        '--schema-poll-interval-ms', '50',
        '--schema-wait-timeout-ms', '5000',
        ...serviceFlags
      ],
      { env }
    );
    assert.match(datasetIngest.stdout, new RegExp(expectedDatasetId), 'ingest stdout should include dataset id');

    const appCreate = await runCli(
      [
        'app', 'create',
        '--name', def.appName,
        '--industry', def.industry,
        '--language', 'zh',
        ...serviceFlags
      ],
      { env }
    );
    assert.match(appCreate.stdout, new RegExp(expectedAppId));

    const dataConfigInput = inferResultFixture.DataFieldConfig;
    const attachPayloadPath = path.join(workspace, 'attach.json');
    fs.writeFileSync(
      attachPayloadPath,
      JSON.stringify({
        ApplicationId: expectedAppId,
        DatasetId: expectedDatasetId,
        DataConfig: dataConfigInput
      })
    );
    const attach = await runCli(
      ['app', 'attach-dataset', '--data', `@${attachPayloadPath}`, ...serviceFlags],
      { env }
    );
    assert.match(attach.stdout, /Attached/);

    const fields = fs
      .readFileSync(path.join(fixturesDir, expectedFileName), 'utf8')
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => JSON.parse(line));
    const fieldsPath = path.join(workspace, 'fields.json');
    fs.writeFileSync(fieldsPath, JSON.stringify(fields));
    const write = await runCli(
      [
        'data', 'write',
        '--dataset-id', expectedDatasetId,
        '--fields', `@${fieldsPath}`,
        ...serviceFlags
      ],
      { env }
    );
    assert.match(write.stdout, /written/);

    const controlActions = state.requests
      .filter(req => req.kind === 'control-plane')
      .map(req => req.action);
    for (const action of [
      'GetPresignedImportUrlV2',
      'AddInferDatasetSchemaTaskV2',
      'GetInferDatasetSchemaResultV2',
      'CreateDatasetV2',
      'CreateApplicationV2',
      'AttachDatasetToApplicationV2'
    ]) {
      assert.ok(controlActions.includes(action), `expected ${action} in control-plane requests, got ${controlActions.join(',')}`);
    }
    const dataPlanePaths = state.requests
      .filter(req => req.kind === 'data-plane')
      .map(req => req.path);
    assert.ok(
      dataPlanePaths.includes(`/api/v1/dataset/${expectedDatasetId}/write`),
      `expected data-plane write, got ${dataPlanePaths.join(',')}`
    );
    assert.equal(uploadCalls.length, 1, 'expected exactly one upload PUT');

    return `V2 onboarding ${flavor}: 8-step chain complete (control=${controlActions.length}, data=${dataPlanePaths.length})`;
  } finally {
    await server.close();
    await new Promise(resolve => uploadServer.close(resolve));
    fs.rmSync(workspace, { recursive: true, force: true });
  }
}

module.exports = { runV2OnboardingPipeline };
