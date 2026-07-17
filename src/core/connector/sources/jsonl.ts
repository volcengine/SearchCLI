// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { createReadStream } from 'node:fs';
import { access } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import path from 'node:path';
import type { ConnectorChange, ConnectorCursor, ConnectorSource, JsonlConnectorSourceConfig } from '../types';
import { normalizeValue, pickFields } from './helpers';

export class JsonlConnectorSource implements ConnectorSource {
  readonly type = 'jsonl' as const;

  constructor(private readonly config: JsonlConnectorSourceConfig) {}

  async open(): Promise<void> {
    try {
      await access(this.config.file);
    } catch {
      throw new Error(`JSONL source file not found: ${this.config.file}`);
    }
  }

  async close(): Promise<void> {}

  async *readChanges(cursor: ConnectorCursor | undefined, limit: number): AsyncIterable<ConnectorChange> {
    const startLine = cursor?.value !== undefined ? Number(cursor.value) : 0;
    if (!Number.isFinite(startLine) || startLine < 0) {
      throw new Error(`Invalid JSONL cursor line number: ${cursor?.value}`);
    }

    let currentLine = 0;
    let emitted = 0;

    const rl = createInterface({
      input: createReadStream(this.config.file, { encoding: 'utf8' }),
      crlfDelay: Infinity
    });

    try {
      for await (const line of rl) {
        const lineNum = currentLine;
        currentLine += 1;

        if (lineNum < startLine) continue;

        const trimmed = line.trim();
        if (!trimmed) continue;

        let record: Record<string, unknown>;
        try {
          record = JSON.parse(trimmed) as Record<string, unknown>;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          throw new Error(`Invalid JSON on line ${lineNum + 1} of ${path.basename(this.config.file)}: ${message}`);
        }

        const id = extractId(record, this.config.idField, lineNum);
        const fields = pickFields(record, this.config.fields);

        yield {
          op: 'upsert',
          id,
          fields,
          cursor: { value: lineNum + 1 }
        };

        emitted += 1;
        if (emitted >= limit) break;
      }
    } finally {
      rl.close();
    }
  }
}

function extractId(record: Record<string, unknown>, idField: string, lineNum: number): string {
  const rawId = record[idField];
  if (rawId !== undefined && rawId !== null) {
    const id = String(normalizeValue(rawId));
    if (id.length > 0) return id;
  }
  return `jsonl:${lineNum + 1}`;
}
