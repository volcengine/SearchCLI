// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import assert from 'node:assert/strict';
import { addVolcAuthorization } from '../src/core/volc-sign';

const credentials = {
  accessKeyId: 'test-ak',
  secretKey: 'test-sk'
};
const fixedDate = new Date('2026-01-02T03:04:05.678Z');

function testPostBodySignature(): void {
  const headers = {
    accept: 'application/json',
    'user-agent': 'Search-Cli',
    host: 'open.volcengineapi.com',
    'content-type': 'application/json'
  };

  addVolcAuthorization({
    region: 'cn-beijing',
    service: 'air',
    method: 'POST',
    pathname: '/api/v1/ListDataset',
    params: {
      Version: '2025-03-01',
      Action: 'ListDataset',
      Region: 'cn-beijing'
    },
    headers,
    body: '{"ProjectName":"demo-project"}'
  }, credentials, fixedDate);

  assert.deepEqual(headers, {
    accept: 'application/json',
    'user-agent': 'Search-Cli',
    host: 'open.volcengineapi.com',
    'content-type': 'application/json',
    'X-Date': '20260102T030405Z',
    'X-Content-Sha256': '0e00f166e2842a42208fa52375e4207049c11ba210ef805b10f829ae070a5dc9',
    Authorization: 'HMAC-SHA256 Credential=test-ak/20260102/cn-beijing/air/request, SignedHeaders=accept;host;x-content-sha256;x-date, Signature=8cb7e00279e4888a2da52685d79f782dd1b2c0d186edc4754951c8b30545619c'
  });
}

function testGetQuerySignature(): void {
  const headers = {
    accept: 'application/json',
    host: 'example.com',
    'x-tt-backend': 'demo'
  };

  addVolcAuthorization({
    region: 'cn-beijing',
    service: 'air',
    method: 'GET',
    pathname: '/api/v1/items',
    params: {
      z: 'a b',
      a: '*~'
    },
    headers,
    body: ''
  }, credentials, fixedDate);

  assert.deepEqual(headers, {
    accept: 'application/json',
    host: 'example.com',
    'x-tt-backend': 'demo',
    'X-Date': '20260102T030405Z',
    Authorization: 'HMAC-SHA256 Credential=test-ak/20260102/cn-beijing/air/request, SignedHeaders=accept;host;x-date;x-tt-backend, Signature=fb3554d695c683e98866ef9a790672ed972c0df9aca79834b97fe7484efd1a81'
  });
}

testPostBodySignature();
testGetQuerySignature();
console.log('volc sign tests passed');
