// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { appendFile, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ensureDir, writeJson } from '../files';
import {
  connectorConfigPath,
  connectorJobDir,
  connectorLogPath,
  connectorRootDir,
  connectorRuntimePath,
  connectorStatePath,
  connectorStderrPath,
  connectorStdoutPath,
  connectorStopPath,
  connectorTracePath
} from './config';
import type { ConnectorRuntime, ConnectorState } from './types';

export async function loadConnectorState(job: string): Promise<ConnectorState> {
  try {
    const content = await readFile(connectorStatePath(job), 'utf8');
    const parsed = JSON.parse(content) as ConnectorState;
    return {
      ...createInitialConnectorState(job),
      ...parsed,
      stats: {
        ...createInitialConnectorState(job).stats,
        ...parsed.stats
      }
    };
  } catch {
    return createInitialConnectorState(job);
  }
}

export async function saveConnectorState(job: string, state: ConnectorState): Promise<void> {
  const filePath = connectorStatePath(job);
  await ensureDir(path.dirname(filePath));
  await writeJson(filePath, state);
}

export async function loadConnectorRuntime(job: string): Promise<ConnectorRuntime | undefined> {
  try {
    const content = await readFile(connectorRuntimePath(job), 'utf8');
    const parsed = JSON.parse(content) as ConnectorRuntime;
    return {
      ...createInitialConnectorRuntime(job),
      ...parsed
    };
  } catch {
    return undefined;
  }
}

export async function saveConnectorRuntime(job: string, runtime: ConnectorRuntime): Promise<void> {
  const filePath = connectorRuntimePath(job);
  await ensureDir(path.dirname(filePath));
  await writeJson(filePath, runtime);
}

export async function requestConnectorStop(job: string, details?: Record<string, unknown>): Promise<string> {
  const filePath = connectorStopPath(job);
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, `${JSON.stringify({ ts: new Date().toISOString(), ...details }, null, 2)}\n`, 'utf8');
  return filePath;
}

export async function clearConnectorStop(job: string): Promise<void> {
  await rm(connectorStopPath(job), { force: true });
}

export async function appendConnectorLog(job: string, event: Record<string, unknown>): Promise<void> {
  const filePath = connectorLogPath(job);
  await ensureDir(path.dirname(filePath));
  await appendFile(filePath, `${JSON.stringify({ ts: new Date().toISOString(), ...event })}\n`, 'utf8');
}

export function getConnectorPaths(job: string): Record<string, string> {
  return {
    dir: connectorJobDir(job),
    config: connectorConfigPath(job),
    state: connectorStatePath(job),
    stop: connectorStopPath(job),
    runtime: connectorRuntimePath(job),
    trace: connectorTracePath(job),
    logs: connectorLogPath(job),
    stdout: connectorStdoutPath(job),
    stderr: connectorStderrPath(job)
  };
}

export function isProcessAlive(pid: number | undefined): boolean {
  if (!pid || !Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export async function resolveConnectorRuntimeByPid(pid: number): Promise<ConnectorRuntime | undefined> {
  const jobs = await listConnectorJobs();
  for (const job of jobs) {
    const runtime = await loadConnectorRuntime(job);
    if (runtime?.pid === pid) return runtime;
  }
  return undefined;
}

export async function resolveConnectorJobByPid(pid: number): Promise<string | undefined> {
  const runtime = await resolveConnectorRuntimeByPid(pid);
  return runtime?.job;
}

export function createInitialConnectorRuntime(
  job: string,
  overrides: Partial<ConnectorRuntime> = {}
): ConnectorRuntime {
  const paths = getConnectorPaths(job);
  return {
    version: 1,
    job,
    mode: 'foreground',
    status: 'starting',
    tracePath: paths.trace,
    statePath: paths.state,
    stopPath: paths.stop,
    runtimePath: paths.runtime,
    stdoutPath: paths.stdout,
    stderrPath: paths.stderr,
    ...overrides
  };
}

async function listConnectorJobs(): Promise<string[]> {
  try {
    const entries = await readdir(connectorRootDir(), { withFileTypes: true });
    return entries.filter(entry => entry.isDirectory()).map(entry => entry.name);
  } catch {
    return [];
  }
}

function createInitialConnectorState(job: string): ConnectorState {
  return {
    version: 1,
    name: job,
    stats: {
      upserted: 0,
      deleted: 0,
      ignoredDeletes: 0,
      failed: 0,
      batches: 0
    }
  };
}
