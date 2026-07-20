// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  buildConnectorJobConfig,
  connectorStopRequested,
  loadConnectorConfig,
  saveConnectorConfig
} from '../core/connector/config';
import { bootstrapSourceToJsonl } from '../core/connector/bootstrap';
import { runConnector } from '../core/connector/runner';
import { getSourceEnvRequirements, assertSourceEnvConfigured } from '../core/connector/sources/helpers';
import {
  createInitialConnectorRuntime,
  getConnectorPaths,
  isProcessAlive,
  loadConnectorRuntime,
  loadConnectorState,
  requestConnectorStop,
  resolveConnectorRuntimeByPid,
  saveConnectorRuntime
} from '../core/connector/state-store';
import type { ConnectorExportInput, ConnectorInitInput, ConnectorRunInput } from '../core/connector/types';
import type { ConnectorRunResult } from '../core/connector/runner';
import { ensureDir } from '../core/files';
import { printOutput } from '../core/output-format';

export async function runConnectorExportCommand(input: ConnectorExportInput): Promise<void> {
  const bootstrap = await bootstrapSourceToJsonl({
    job: input.job,
    datasetName: input.datasetName,
    source: input.source,
    envPrefix: input.envPrefix,
    idField: input.idField,
    cursorField: input.cursorField,
    cursorType: input.cursorType,
    initialCursor: input.initialCursor,
    table: input.table,
    where: input.where,
    database: input.database,
    collection: input.collection,
    stream: input.stream,
    file: input.file,
    sourceFields: input.fields,
    batchSize: input.batchSize,
    intervalMs: input.intervalMs
  });

  await printOutput({
    ok: true,
    job: bootstrap.job,
    source: bootstrap.source,
    bootstrapDir: bootstrap.bootstrapDir,
    jsonlPath: bootstrap.jsonlPath,
    metadataPath: bootstrap.metadataPath,
    importLogPath: bootstrap.importLogPath,
    exportedCount: bootstrap.exportedCount,
    importedIdSample: bootstrap.importedIdSample,
    cursor: bootstrap.cursor,
    envRequirements: bootstrap.envRequirements,
    note: '--output only redirects this command result. It does not change the bootstrap JSONL path.',
    next: `Use ${bootstrap.jsonlPath} as the file input for dataset creation/onboarding.`
  });
}

export async function runConnectorInitCommand(input: ConnectorInitInput): Promise<void> {
  const config = buildConnectorJobConfig(input);
  const configPath = await saveConnectorConfig(config);
  const envRequirements = getSourceEnvRequirements(config.source.type, config.source.envPrefix);
  await printOutput({
    ok: true,
    job: config.name,
    configPath,
    source: config.source.type,
    datasetId: config.sink.datasetId,
    envRequirements,
    envHint: 'Set these values in environment variables, not in chat. After exporting them, run the ingest/sync command.',
    next: `vs connector run --job ${config.name}`
  });
}

export async function runConnectorRunCommand(input: ConnectorRunInput): Promise<void> {
  const result = await executeConnectorRunCommand(input);
  await printOutput(result);
}

export async function executeConnectorRunCommand(input: ConnectorRunInput): Promise<ConnectorRunResult | Record<string, unknown>> {
  if (input.daemon && input.worker) {
    throw new Error('Internal connector worker process cannot be launched with --daemon.');
  }

  if (!input.worker) {
    const config = await loadConnectorConfig(input.job);
    assertSourceEnvConfigured(config.source.type, config.source.envPrefix);
  }

  return input.daemon
    ? await startDetachedConnectorRun(input)
    : await runConnector(input);
}

export async function runConnectorStatusCommand(job: string): Promise<void> {
  const state = await loadConnectorState(job);
  const runtime = await loadConnectorRuntime(job);
  const stopped = await connectorStopRequested(job);
  const running = isProcessAlive(runtime?.pid);
  const paths = getConnectorPaths(job);
  await printOutput({
    job,
    pid: runtime?.pid,
    running,
    stopped,
    mode: runtime?.mode,
    runtimeStatus: running ? runtime?.status : runtime?.status ?? (runtime?.pid ? 'exited' : undefined),
    heartbeatAt: runtime?.heartbeatAt,
    exitedAt: runtime?.exitedAt,
    cursor: state.cursor,
    lastRunAt: state.lastRunAt,
    lastSuccessAt: state.lastSuccessAt,
    lastError: state.lastError,
    lastBatch: state.lastBatch,
    stats: state.stats,
    tracePath: paths.trace,
    importLogPath: paths.importLog,
    stdoutPath: paths.stdout,
    stderrPath: paths.stderr,
    stopCommand: runtime?.pid ? buildStopCommand(job, runtime.pid) : `vs connector stop --job ${job}`,
    paths
  });
}

export async function runConnectorStopCommand(job?: string, pid?: number): Promise<void> {
  if (!job && !pid) {
    throw new Error('Need --job or --pid for connector stop.');
  }

  let runtime = pid !== undefined ? await resolveConnectorRuntimeByPid(pid) : undefined;
  if (job) {
    const jobRuntime = await loadConnectorRuntime(job);
    if (runtime && runtime.job !== job) {
      throw new Error(`PID ${pid} does not belong to connector job ${job}; it belongs to ${runtime.job}.`);
    }
    runtime = runtime ?? jobRuntime;
  }

  const resolvedJob = job ?? runtime?.job;
  if (!resolvedJob) {
    throw new Error(`Could not resolve a connector job for pid ${pid}.`);
  }

  if (pid !== undefined && runtime?.pid !== pid) {
    throw new Error(`PID ${pid} does not match the recorded runtime pid for connector job ${resolvedJob}.`);
  }

  const effectivePid = pid ?? runtime?.pid;
  if (effectivePid !== undefined && !isProcessAlive(effectivePid)) {
    throw new Error(`Recorded connector pid ${effectivePid} for job ${resolvedJob} is not currently running. Inspect ${getConnectorPaths(resolvedJob).trace} for the last trace.`);
  }

  const stopPath = await requestConnectorStop(resolvedJob, {
    requestedByPid: process.pid,
    targetPid: effectivePid
  });

  if (effectivePid !== undefined) {
    process.kill(effectivePid, 'SIGTERM');
  }

  if (runtime) {
    runtime.status = 'stopping';
    runtime.stopReason = 'cli_stop';
    runtime.heartbeatAt = new Date().toISOString();
    await saveConnectorRuntime(resolvedJob, runtime);
  }

  await printOutput({
    ok: true,
    job: resolvedJob,
    pid: effectivePid,
    tracePath: getConnectorPaths(resolvedJob).trace,
    importLogPath: getConnectorPaths(resolvedJob).importLog,
    stopPath,
    signal: effectivePid !== undefined ? 'SIGTERM' : undefined,
    stopCommand: effectivePid !== undefined ? buildStopCommand(resolvedJob, effectivePid) : `vs connector stop --job ${resolvedJob}`
  });
}

export async function runConnectorInspectCommand(job: string): Promise<void> {
  const paths = getConnectorPaths(job);
  const config = await readJsonIfExists(paths.config);
  const state = await loadConnectorState(job);
  const runtime = await loadConnectorRuntime(job);
  const stopped = await connectorStopRequested(job);
  const running = isProcessAlive(runtime?.pid);
  await printOutput({
    job,
    running,
    stopped,
    config,
    state,
    runtime: runtime ? {
      ...runtime,
      status: running ? runtime.status : runtime.status ?? (runtime.pid ? 'exited' : undefined)
    } : undefined,
    stopCommand: runtime?.pid ? buildStopCommand(job, runtime.pid) : `vs connector stop --job ${job}`,
    paths
  });
}

async function readJsonIfExists(filePath: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch {
    return undefined;
  }
}

async function startDetachedConnectorRun(input: ConnectorRunInput): Promise<Record<string, unknown>> {
  const existingRuntime = await loadConnectorRuntime(input.job);
  if (existingRuntime?.pid && isProcessAlive(existingRuntime.pid)) {
    throw new Error(`Connector job ${input.job} is already running with pid ${existingRuntime.pid}.`);
  }

  const paths = getConnectorPaths(input.job);
  await ensureDir(paths.dir);
  const launchSpec = resolveCurrentCliLaunchSpec();
  const args = [
    ...launchSpec.args,
    'connector',
    'run',
    '--job',
    input.job,
    '--worker'
  ];
  if (input.once) args.push('--once');

  const child = spawn(launchSpec.command, args, {
    cwd: process.cwd(),
    detached: true,
    env: buildWorkerEnv(input),
    stdio: ['ignore', 'ignore', 'ignore']
  });

  if (!child.pid) {
    throw new Error(`Failed to start connector daemon for job ${input.job}.`);
  }

  const now = new Date().toISOString();
  await saveConnectorRuntime(input.job, createInitialConnectorRuntime(input.job, {
    pid: child.pid,
    mode: 'daemon',
    status: 'starting',
    startedAt: now,
    heartbeatAt: now
  }));

  child.unref();

  return {
    ok: true,
    job: input.job,
    daemon: true,
    pid: child.pid,
    tracePath: paths.trace,
    importLogPath: paths.importLog,
    runtimePath: paths.runtime,
    statePath: paths.state,
    stopCommand: buildStopCommand(input.job, child.pid),
    inspectCommand: `vs connector inspect --job ${input.job}`
  };
}

function resolveCurrentCliLaunchSpec(): { command: string; args: string[] } {
  const argv1 = process.argv[1];
  if (argv1 && (argv1.endsWith('.js') || argv1.endsWith('.cjs') || argv1.includes(path.sep))) {
    return {
      command: process.execPath,
      args: [path.resolve(argv1)]
    };
  }

  return {
    command: process.execPath,
    args: []
  };
}

function buildWorkerEnv(input: ConnectorRunInput): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    ...process.env
  };

  if (input.baseUrl) env.VIKING_BASE_URL = input.baseUrl;
  if (input.controlPlaneBaseUrl) env.VIKING_CONTROL_PLANE_BASE_URL = input.controlPlaneBaseUrl;
  if (input.dataPlaneBaseUrl) env.VIKING_DATA_PLANE_BASE_URL = input.dataPlaneBaseUrl;
  if (input.accessKeyId) env.VIKING_AK = input.accessKeyId;
  if (input.secretKey) env.VIKING_SK = input.secretKey;
  if (input.projectName) env.VIKING_PROJECT_NAME = input.projectName;
  if (input.region) env.VIKING_REGION = input.region;
  if (input.timeoutMs !== undefined) env.VIKING_TIMEOUT_MS = String(input.timeoutMs);

  return env;
}

function buildStopCommand(job: string, pid: number): string {
  return `vs connector stop --job ${job} --pid ${pid}`;
}
