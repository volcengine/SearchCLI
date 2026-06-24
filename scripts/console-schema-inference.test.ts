// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import assert from 'node:assert/strict';
import { inferSchemaArtifactsWithConsole } from '../src/core/console-schema-inference';
import { VikingOpenApiClient } from '../src/core/openapi-client';

const originalPost = VikingOpenApiClient.prototype.post;
const originalFetch = globalThis.fetch;

const callOrder: string[] = [];
let pollCount = 0;

VikingOpenApiClient.prototype.post = async function mockPost<T = unknown>(
  pathname: string,
  payload: unknown
): Promise<T> {
  callOrder.push(pathname);

  if (pathname === '/open/GetPresignedImportUrlV2') {
    assert.deepEqual(payload, {
      FileName: 'sample-items.jsonl',
      ProjectName: 'demo-project'
    });
    return {
      Result: {
        FileUrl: 'https://example.com/upload',
        FileKey: 'dataset-import/2103180626/sample-items-abcd1234efgh5678'
      }
    } as T;
  }

  if (pathname === '/api/v1/AddInferDatasetSchemaTask') {
    assert.deepEqual(payload, {
      TosKey: 'dataset-import/2103180626/sample-items-abcd1234efgh5678',
      Type: 1,
      Language: 'zh',
      ProjectName: 'demo-project'
    });
    return {
      Result: {
        TaskID: 'task-123'
      }
    } as T;
  }

  if (pathname === '/api/v1/GetInferDatasetSchemaResult') {
    assert.deepEqual(payload, {
      TaskID: 'task-123',
      ProjectName: 'demo-project'
    });

    pollCount += 1;
    if (pollCount === 1) {
      return {
        Result: {
          Status: 'Processing'
        }
      } as T;
    }

    return {
      Result: {
        Status: 'Success',
        Schema: [
          {
            Name: 'item_id',
            Type: 1,
            BizAttr: 11
          },
          {
            Name: 'title',
            Type: 1
          }
        ],
        DataFieldConfig: {
          IndexFields: ['title'],
          FilterFields: ['item_id']
        }
      }
    } as T;
  }

  throw new Error(`Unexpected OpenAPI path: ${pathname}`);
};

globalThis.fetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
  callOrder.push('UPLOAD');
  assert.equal(String(input), 'https://example.com/upload');
  assert.equal(init?.method, 'PUT');
  assert.equal(init?.headers && (init.headers as Record<string, string>)['content-type'], 'application/x-ndjson');
  assert.equal(
    init?.body,
    `${JSON.stringify({ item_id: '1', title: 'First item' })}\n${JSON.stringify({ item_id: '2', title: 'Second item' })}\n`
  );
  return new Response('', { status: 200 });
};

async function main(): Promise<void> {
  const result = await inferSchemaArtifactsWithConsole({
    filePath: '/tmp/sample items.csv',
    normalizedItems: [
      { item_id: '1', title: 'First item' },
      { item_id: '2', title: 'Second item' }
    ],
    datasetType: 'item',
    accessKeyId: 'test-ak',
    secretKey: 'test-sk',
    controlPlaneBaseUrl: 'https://open.example.com',
    dataPlaneBaseUrl: 'https://data.example.com',
    region: 'cn-beijing',
    projectName: 'demo-project',
    timeoutMs: 5000,
    pollIntervalMs: 1,
    waitTimeoutMs: 1000
  });

  assert.equal(result.taskId, 'task-123');
  assert.equal(result.upload.fileKey, 'dataset-import/2103180626/sample-items-abcd1234efgh5678');
  assert.equal(result.upload.tosBucket, undefined);
  assert.deepEqual(result.schema, [
    { Name: 'item_id', Type: 1, BizAttr: 11 },
    { Name: 'title', Type: 1 }
  ]);
  assert.deepEqual(result.dataFieldConfig, {
    IndexFields: ['title'],
    FilterFields: ['item_id']
  });
  assert.deepEqual(callOrder, [
    '/open/GetPresignedImportUrlV2',
    'UPLOAD',
    '/api/v1/AddInferDatasetSchemaTask',
    '/api/v1/GetInferDatasetSchemaResult',
    '/api/v1/GetInferDatasetSchemaResult'
  ]);
}

main()
  .then(() => {
    console.log('console schema inference tests passed');
  })
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    VikingOpenApiClient.prototype.post = originalPost;
    globalThis.fetch = originalFetch;
  });
