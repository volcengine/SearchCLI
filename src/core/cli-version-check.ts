// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { VERSION } from '../version';

export const DEFAULT_CLI_VERSION_URL =
  'https://raw.githubusercontent.com/volcengine/SearchCLI/main/package.json';
export const CLI_VERSION_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export type CliVersionCheckStatus = 'up-to-date' | 'update-available' | 'unknown';

export interface CliVersionCheckResult {
  localVersion: string;
  onlineVersion?: string;
  status: CliVersionCheckStatus;
  sourceUrl: string;
  checkedAt: string;
  cacheHit: boolean;
  error?: string;
}

export interface CheckCliVersionOptions {
  sourceUrl?: string;
  timeoutMs?: number;
}

interface CliVersionCacheFile {
  version: 1;
  sourceUrl: string;
  checkedAt: string;
  onlineVersion: string;
}

export async function checkCliVersion(
  options: CheckCliVersionOptions = {}
): Promise<CliVersionCheckResult> {
  const sourceUrl = options.sourceUrl ?? process.env.VIKING_CLI_VERSION_URL ?? DEFAULT_CLI_VERSION_URL;
  const timeoutMs = options.timeoutMs ?? 2000;
  const cachePath = resolveCliVersionCachePath();
  const cached = readCliVersionCache(cachePath, sourceUrl);
  if (cached) {
    return buildResult(sourceUrl, cached.onlineVersion, cached.checkedAt, true);
  }

  try {
    const response = await fetch(sourceUrl, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!response.ok) {
      return unknownResult(sourceUrl, `Online CLI version request returned HTTP ${response.status}`);
    }

    const payload = (await response.json()) as { version?: unknown };
    const onlineVersion = typeof payload.version === 'string' ? payload.version.trim() : '';
    if (!isSemanticVersion(onlineVersion)) {
      return unknownResult(sourceUrl, 'Online package metadata does not contain a valid version');
    }

    const checkedAt = new Date().toISOString();
    writeCliVersionCache(cachePath, { version: 1, sourceUrl, checkedAt, onlineVersion });
    return buildResult(sourceUrl, onlineVersion, checkedAt, false);
  } catch (error) {
    return unknownResult(sourceUrl, error instanceof Error ? error.message : String(error));
  }
}

export function formatCliVersionWarning(result: CliVersionCheckResult): string | undefined {
  if (result.status !== 'update-available' || !result.onlineVersion) return undefined;
  return `[viking-cli] Update available: local ${result.localVersion}, online ${result.onlineVersion}. In the cloned \`vs\` repository directory, run \`git pull --ff-only\`, then rerun \`bash ./scripts/install.sh\` and \`bash ./scripts/install-skills.sh all --target auto --force\` (PowerShell: \`scripts/install.ps1\` and \`scripts/install-skills.ps1\`).`;
}

export function compareSemanticVersions(left: string, right: string): number {
  const leftParts = parseSemanticVersion(left);
  const rightParts = parseSemanticVersion(right);
  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] > rightParts[index]) return 1;
    if (leftParts[index] < rightParts[index]) return -1;
  }
  return 0;
}

function buildResult(
  sourceUrl: string,
  onlineVersion: string,
  checkedAt: string,
  cacheHit: boolean
): CliVersionCheckResult {
  return {
    localVersion: VERSION,
    onlineVersion,
    status: compareSemanticVersions(onlineVersion, VERSION) > 0 ? 'update-available' : 'up-to-date',
    sourceUrl,
    checkedAt,
    cacheHit
  };
}

function unknownResult(sourceUrl: string, error: string): CliVersionCheckResult {
  return {
    localVersion: VERSION,
    status: 'unknown',
    sourceUrl,
    checkedAt: new Date().toISOString(),
    cacheHit: false,
    error
  };
}

function resolveCliVersionCachePath(): string {
  return (
    process.env.VIKING_CLI_VERSION_CACHE_PATH?.trim() ||
    path.join(process.env.VIKING_HOME?.trim() || path.join(os.homedir(), '.viking'), 'online_version_cache.json')
  );
}

function readCliVersionCache(cachePath: string, sourceUrl: string): CliVersionCacheFile | undefined {
  try {
    const parsed = JSON.parse(fs.readFileSync(cachePath, 'utf8')) as Partial<CliVersionCacheFile>;
    if (
      parsed.version !== 1 ||
      parsed.sourceUrl !== sourceUrl ||
      typeof parsed.checkedAt !== 'string' ||
      typeof parsed.onlineVersion !== 'string'
    ) {
      return undefined;
    }

    const checkedAt = Date.parse(parsed.checkedAt);
    if (!Number.isFinite(checkedAt) || Date.now() - checkedAt >= CLI_VERSION_CACHE_TTL_MS) {
      return undefined;
    }
    return parsed as CliVersionCacheFile;
  } catch {
    return undefined;
  }
}

function writeCliVersionCache(cachePath: string, cache: CliVersionCacheFile): void {
  try {
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    const temporaryPath = `${cachePath}.${process.pid}.tmp`;
    fs.writeFileSync(temporaryPath, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
    fs.renameSync(temporaryPath, cachePath);
  } catch {
    // Version checks are best-effort when the home directory is read-only.
  }
}

function isSemanticVersion(value: string): boolean {
  return /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(value);
}

function parseSemanticVersion(value: string): [number, number, number] {
  const core = value.trim().split('-', 1)[0].split('+', 1)[0];
  const parts = core.split('.');
  if (parts.length !== 3 || parts.some(part => !/^\d+$/.test(part))) {
    throw new Error(`Invalid semantic version: ${value}`);
  }
  return parts.map(part => Number.parseInt(part, 10)) as [number, number, number];
}
