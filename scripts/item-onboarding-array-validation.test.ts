import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { buildItemProfile } from '../src/core/item-onboarding';

async function main(): Promise<void> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'item-onboarding-array-validation-'));
  try {
    await testOnlyEmptyArraysAreCompatible(tempDir);
    await testEmptyAndNonEmptyArraysAreCompatible(tempDir);
    await testScalarAndArrayStillConflict(tempDir);
    console.log('item onboarding array validation tests passed');
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function testOnlyEmptyArraysAreCompatible(tempDir: string): Promise<void> {
  const filePath = path.join(tempDir, 'empty-only.jsonl');
  await writeFile(
    filePath,
    [
      JSON.stringify({ item_id: '1', title: 'A', tags: [] }),
      JSON.stringify({ item_id: '2', title: 'B', tags: [] }),
      JSON.stringify({ item_id: '3', title: 'C', tags: [] })
    ].join('\n'),
    'utf8'
  );

  const result = await buildItemProfile({ file: filePath, datasetType: 'item' });
  const mixedTypeIssues = result.validation.issues.filter(issue => issue.code === 'mixed_field_types');

  assert.deepEqual(
    mixedTypeIssues.map(issue => issue.field).sort(),
    []
  );
}

async function testEmptyAndNonEmptyArraysAreCompatible(tempDir: string): Promise<void> {
  const filePath = path.join(tempDir, 'compatible.jsonl');
  await writeFile(
    filePath,
    [
      JSON.stringify({ item_id: '1', title: 'A', str_c: [], int_c: [], float_c: [] }),
      JSON.stringify({ item_id: '2', title: 'B', str_c: ['x'], int_c: [1], float_c: [1.5] }),
      JSON.stringify({ item_id: '3', title: 'C', str_c: [], int_c: [2], float_c: [] })
    ].join('\n'),
    'utf8'
  );

  const result = await buildItemProfile({ file: filePath, datasetType: 'item' });
  const mixedTypeIssues = result.validation.issues.filter(issue => issue.code === 'mixed_field_types');

  assert.deepEqual(
    mixedTypeIssues.map(issue => issue.field).sort(),
    []
  );
}

async function testScalarAndArrayStillConflict(tempDir: string): Promise<void> {
  const filePath = path.join(tempDir, 'conflict.jsonl');
  await writeFile(
    filePath,
    [
      JSON.stringify({ item_id: '1', title: 'A', tags: [] }),
      JSON.stringify({ item_id: '2', title: 'B', tags: ['x'] }),
      JSON.stringify({ item_id: '3', title: 'C', tags: 'oops' })
    ].join('\n'),
    'utf8'
  );

  const result = await buildItemProfile({ file: filePath, datasetType: 'item' });
  const mixedTypeIssues = result.validation.issues.filter(issue => issue.code === 'mixed_field_types');

  assert.deepEqual(
    mixedTypeIssues.map(issue => issue.field).sort(),
    ['tags']
  );
}

void main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
