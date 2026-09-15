// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

export async function loadJsonInput<T = unknown>(input?: string): Promise<T | undefined> {
  if (!input) return undefined;
  const source = await resolveJsonSource(input);
  return JSON.parse(source) as T;
}

export async function loadOptionalStringArray(input?: string): Promise<string[] | undefined> {
  if (!input) return undefined;
  const trimmed = input.trim();
  if (trimmed.length === 0) return undefined;
  if (trimmed.startsWith('[')) {
    return JSON.parse(trimmed) as string[];
  }
  if (trimmed.includes(',')) {
    return trimmed
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }
  return [trimmed];
}

export function parseBooleanString(input?: string): boolean | undefined {
  if (!input) return undefined;
  const normalized = input.trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n', 'off'].includes(normalized)) return false;
  throw new Error(`Invalid boolean value: ${input}`);
}

async function resolveJsonSource(input: string): Promise<string> {
  const trimmed = input.trim();
  if (trimmed.startsWith('@')) {
    return readFile(path.resolve(trimmed.slice(1)), 'utf8');
  }

  if (looksLikeInlineJson(trimmed)) {
    return trimmed;
  }

  if (await fileExists(trimmed)) {
    return readFile(path.resolve(trimmed), 'utf8');
  }

  return trimmed;
}

function looksLikeInlineJson(input: string): boolean {
  if (input.length === 0) return false;
  return ['{', '[', '"'].includes(input[0]);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(path.resolve(filePath));
    return true;
  } catch {
    return false;
  }
}
