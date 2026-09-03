// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const DEFAULT_SKILL_VERSION_BASE_URL =
  'https://raw.githubusercontent.com/volcengine/SearchCLI/main/skills';
export const SKILL_VERSION_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const SEMANTIC_VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

export type SkillVersionCheckStatus =
  | 'up-to-date'
  | 'update-available'
  | 'online-version-missing'
  | 'unknown'
  | 'invalid-local-version';

export interface SkillVersionTarget {
  name: string;
  version: string;
}

export interface SkillVersionCheckResult {
  name: string;
  localVersion: string;
  onlineVersion?: string;
  status: SkillVersionCheckStatus;
  sourceUrl: string;
  error?: string;
}

export interface CheckSkillVersionsOptions {
  baseUrl?: string;
  timeoutMs?: number;
}

interface SkillVersionCacheFile {
  version: 1;
  entries: Record<string, SkillVersionCacheEntry>;
}

interface SkillVersionCacheEntry {
  checkedAt: string;
  sourceUrl: string;
  onlineVersion?: string;
  status: 'up-to-date' | 'update-available' | 'online-version-missing';
  error?: string;
}

export async function checkSkillVersions(
  skills: SkillVersionTarget[],
  options: CheckSkillVersionsOptions = {}
): Promise<SkillVersionCheckResult[]> {
  const baseUrl = options.baseUrl ?? process.env.VIKING_SKILL_VERSION_BASE_URL ?? DEFAULT_SKILL_VERSION_BASE_URL;
  const timeoutMs = options.timeoutMs ?? 2000;
  const cachePath = resolveSkillVersionCachePath();
  const cache = readSkillVersionCache(cachePath);
  let cacheChanged = false;

  const results = await Promise.all(skills.map(async skill => {
    const cached = getCachedSkillVersion(cache, skill, baseUrl);
    if (cached) return cached;

    const result = await checkOneSkillVersion(skill, baseUrl, timeoutMs);
    if (isCacheableStatus(result.status)) {
      cache.entries[cacheKey(baseUrl, skill.name)] = {
        checkedAt: new Date().toISOString(),
        sourceUrl: result.sourceUrl,
        onlineVersion: result.onlineVersion,
        status: result.status,
        error: result.error
      };
      cacheChanged = true;
    }
    return result;
  }));

  if (cacheChanged) writeSkillVersionCache(cachePath, cache);
  return results;
}

export function formatSkillVersionWarning(result: SkillVersionCheckResult): string | undefined {
  if (result.status !== 'update-available' || !result.onlineVersion) return undefined;
  return `[viking-skills] Update available for ${result.name}: local ${result.localVersion}, online ${result.onlineVersion}. Run \`vs skill install ${result.name} --force\` after updating SearchCLI.`;
}

export function isSemanticVersion(value: string): boolean {
  return SEMANTIC_VERSION_PATTERN.test(value.trim());
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

async function checkOneSkillVersion(
  skill: SkillVersionTarget,
  baseUrl: string,
  timeoutMs: number
): Promise<SkillVersionCheckResult> {
  const sourceUrl = `${baseUrl.replace(/\/+$/, '')}/${encodeURIComponent(skill.name)}/SKILL.md`;
  const localVersion = skill.version.trim();
  if (!isSemanticVersion(localVersion)) {
    return {
      name: skill.name,
      localVersion,
      status: 'invalid-local-version',
      sourceUrl,
      error: `Invalid local skill version: ${localVersion || '(empty)'}`
    };
  }

  try {
    const response = await fetch(sourceUrl, {
      headers: { accept: 'text/plain' },
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (response.status === 404) {
      return {
        name: skill.name,
        localVersion,
        status: 'online-version-missing',
        sourceUrl
      };
    }
    if (!response.ok) {
      return {
        name: skill.name,
        localVersion,
        status: 'unknown',
        sourceUrl,
        error: `Online version request returned HTTP ${response.status}`
      };
    }

    const content = await response.text();
    const onlineVersion = parseSkillVersion(content);
    if (!onlineVersion) {
      return {
        name: skill.name,
        localVersion,
        status: 'online-version-missing',
        sourceUrl,
        error: 'Online SKILL.md does not contain a valid version field'
      };
    }

    return {
      name: skill.name,
      localVersion,
      onlineVersion,
      status: compareSemanticVersions(onlineVersion, localVersion) > 0 ? 'update-available' : 'up-to-date',
      sourceUrl
    };
  } catch (error) {
    return {
      name: skill.name,
      localVersion,
      status: 'unknown',
      sourceUrl,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function parseSkillVersion(content: string): string | undefined {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return undefined;

  for (const line of match[1].split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf(':');
    if (separator <= 0) continue;
    const key = trimmed.slice(0, separator).trim();
    if (key !== 'version') continue;
    const rawValue = trimmed.slice(separator + 1).trim();
    const value =
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
        ? rawValue.slice(1, -1)
        : rawValue;
    return isSemanticVersion(value) ? value : undefined;
  }

  return undefined;
}

function resolveSkillVersionCachePath(): string {
  return (
    process.env.VIKING_SKILL_VERSION_CACHE_PATH?.trim() ||
    path.join(process.env.VIKING_HOME?.trim() || path.join(os.homedir(), '.viking'), 'online_version_cache.json')
  );
}

function readSkillVersionCache(cachePath: string): SkillVersionCacheFile {
  try {
    const parsed = JSON.parse(fs.readFileSync(cachePath, 'utf8')) as Partial<SkillVersionCacheFile>;
    if (parsed.version === 1 && parsed.entries && typeof parsed.entries === 'object') {
      return { version: 1, entries: parsed.entries as Record<string, SkillVersionCacheEntry> };
    }
  } catch {
    // Missing, expired, or malformed cache is treated as empty.
  }
  return { version: 1, entries: {} };
}

function writeSkillVersionCache(cachePath: string, cache: SkillVersionCacheFile): void {
  try {
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    const temporaryPath = `${cachePath}.${process.pid}.tmp`;
    fs.writeFileSync(temporaryPath, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
    fs.renameSync(temporaryPath, cachePath);
  } catch {
    // Version checks must remain best-effort when the home directory is read-only.
  }
}

function getCachedSkillVersion(
  cache: SkillVersionCacheFile,
  skill: SkillVersionTarget,
  baseUrl: string
): SkillVersionCheckResult | undefined {
  const entry = cache.entries[cacheKey(baseUrl, skill.name)];
  if (!entry) return undefined;

  const checkedAt = Date.parse(entry.checkedAt);
  if (!Number.isFinite(checkedAt) || Date.now() - checkedAt >= SKILL_VERSION_CACHE_TTL_MS) {
    return undefined;
  }

  const status =
    entry.onlineVersion && compareSemanticVersions(entry.onlineVersion, skill.version) > 0
      ? 'update-available'
      : entry.onlineVersion
        ? 'up-to-date'
        : 'online-version-missing';

  return {
    name: skill.name,
    localVersion: skill.version,
    onlineVersion: entry.onlineVersion,
    status,
    sourceUrl: entry.sourceUrl,
    error: entry.error
  };
}

function isCacheableStatus(status: SkillVersionCheckStatus): status is SkillVersionCacheEntry['status'] {
  return status === 'up-to-date' || status === 'update-available' || status === 'online-version-missing';
}

function cacheKey(baseUrl: string, skillName: string): string {
  return `${baseUrl.replace(/\/+$/, '')}|${skillName}`;
}

function parseSemanticVersion(value: string): [number, number, number] {
  const core = value.trim().split('-', 1)[0].split('+', 1)[0];
  const parts = core.split('.');
  if (parts.length !== 3 || parts.some(part => !/^\d+$/.test(part))) {
    throw new Error(`Invalid semantic version: ${value}`);
  }
  return parts.map(part => Number.parseInt(part, 10)) as [number, number, number];
}
