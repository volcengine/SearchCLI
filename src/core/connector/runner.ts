// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { setTimeout as sleep } from 'node:timers/promises';
import { resolveServiceConfig } from '../service-config';
import {
  connectorStopRequested,
  loadConnectorConfig
} from './config';
import { ConnectorSink } from './sink';
import { createConnectorSource } from './sources';
import {
  appendConnectorImportedRecordLogs,
  appendConnectorLog,
  createInitialConnectorRuntime,
  clearConnectorStop,
  getConnectorPaths,
  isProcessAlive,
  loadConnectorRuntime,
  loadConnectorState,
  requestConnectorStop,
  saveConnectorRuntime,
  saveConnectorState
} from './state-store';
import type { ConnectorRunInput, ConnectorRuntime, ConnectorState } from './types';

export interface ConnectorRunResult {
  job: string;
  once: boolean;
  stopped: boolean;
  iterations: number;
  upserted: number;
  ignoredDeletes: number;
  pid: number;
  mode: 'foreground' | 'daemon';
  tracePath: string;
  importLogPath: string;
  runtimePath: string;
  stopCommand: string;
  statePath: string;
}

export async function runConnector(input: ConnectorRunInput): Promise<ConnectorRunResult> {
  const config = await loadConnectorConfig(input.job);
  const existingRuntime = await loadConnectorRuntime(config.name);
  if (existingRuntime?.pid && existingRuntime.pid !== process.pid && isProcessAlive(existingRuntime.pid)) {
    throw new Error(`Connector job ${config.name} is already running with pid ${existingRuntime.pid}. Stop it before starting another worker.`);
  }

  const serviceConfig = resolveServiceConfig(input);
  const source = createConnectorSource(config.source);
  const sink = new ConnectorSink(config.sink, serviceConfig);
  const state = await loadConnectorState(config.name);
  const paths = getConnectorPaths(config.name);
  const mode: 'foreground' | 'daemon' = input.worker ? 'daemon' : 'foreground';
  const startedAt = new Date().toISOString();
  const runtime = createInitialConnectorRuntime(config.name, {
    pid: process.pid,
    mode,
    status: 'starting',
    startedAt,
    heartbeatAt: startedAt
  });
  let iterations = 0;
  let stopped = false;
  let stopReason: string | undefined;
  let sleepAbortController: AbortController | undefined;

  state.startedAt ??= startedAt;
  state.lastRunAt = startedAt;
  state.lastError = undefined;
  await clearConnectorStop(config.name);
  await saveConnectorRuntime(config.name, runtime);
  await appendConnectorLog(config.name, {
    event: 'run_start',
    pid: process.pid,
    mode,
    source: config.source.type,
    sink: config.sink.type,
    once: Boolean(input.once),
    tracePath: paths.trace,
    runtimePath: paths.runtime,
    statePath: paths.state,
    stopCommand: buildStopCommand(config.name, process.pid)
  });

  const requestInProcessStop = (reason: string): void => {
    if (stopReason) return;
    stopReason = reason;
    runtime.status = 'stopping';
    runtime.stopReason = reason;
    runtime.heartbeatAt = new Date().toISOString();
    void saveConnectorRuntime(config.name, runtime);
    void requestConnectorStop(config.name, {
      reason,
      pid: process.pid
    });
    sleepAbortController?.abort();
  };

  const sigtermHandler = () => requestInProcessStop('signal:SIGTERM');
  const sigintHandler = () => requestInProcessStop('signal:SIGINT');
  process.on('SIGTERM', sigtermHandler);
  process.on('SIGINT', sigintHandler);

  try {
    await source.open();
    runtime.status = 'running';
    runtime.heartbeatAt = new Date().toISOString();
    await saveConnectorRuntime(config.name, runtime);
    await appendConnectorLog(config.name, {
      event: 'source_opened',
      pid: process.pid,
      source: config.source.type
    });

    while (true) {
      iterations += 1;
      let changes = 0;
      const cursorBefore = state.cursor;
      await appendConnectorLog(config.name, {
        event: 'iteration_start',
        pid: process.pid,
        iteration: iterations,
        cursorBefore,
        batchLimit: config.batch.maxRows
      });

      for await (const change of source.readChanges(state.cursor, config.batch.maxRows)) {
        sink.buffer(change);
        state.cursor = change.cursor;
        changes += 1;
      }

      const flushResult = await sink.flush(state);
      state.lastRunAt = new Date().toISOString();
      state.lastSuccessAt = state.lastRunAt;
      state.lastBatch = {
        iteration: iterations,
        changeCount: changes,
        upsertCount: flushResult.upsertCount,
        ignoredDeleteCount: flushResult.ignoredDeleteCount,
        importedIds: flushResult.importedIds,
        ignoredDeleteIds: flushResult.ignoredDeleteIds,
        cursor: state.cursor,
        completedAt: state.lastRunAt
      };
      await saveConnectorState(config.name, state);
      runtime.heartbeatAt = state.lastRunAt;
      await saveConnectorRuntime(config.name, runtime);
      await appendConnectorImportedRecordLogs(
        config.name,
        flushResult.importedRecords.map(importedRecord => ({
          stage: 'runtime_data_write',
          iteration: iterations,
          id: importedRecord.id,
          fields: importedRecord.fields,
          cursor: state.cursor
        }))
      );
      await appendConnectorLog(config.name, {
        event: 'iteration_complete',
        pid: process.pid,
        iteration: iterations,
        changes,
        upsertCount: flushResult.upsertCount,
        importedIds: flushResult.importedIds,
        ignoredDeleteCount: flushResult.ignoredDeleteCount,
        ignoredDeleteIds: flushResult.ignoredDeleteIds,
        cursorBefore,
        cursorAfter: state.cursor
      });

      if (input.once) {
        stopReason = 'once';
        break;
      }
      if (stopReason || await connectorStopRequested(config.name)) {
        stopped = true;
        stopReason ??= 'stop-file';
        break;
      }
      sleepAbortController = new AbortController();
      try {
        await sleep(config.batch.intervalMs, undefined, {
          signal: sleepAbortController.signal
        });
      } catch (error) {
        if (!isAbortError(error)) throw error;
      } finally {
        sleepAbortController = undefined;
      }

      if (stopReason) {
        stopped = true;
        break;
      }
    }

    runtime.status = stopped ? 'stopped' : 'completed';
    runtime.stopReason = stopReason;
    runtime.heartbeatAt = new Date().toISOString();
    runtime.exitedAt = runtime.heartbeatAt;
    await saveConnectorRuntime(config.name, runtime);
    await appendConnectorLog(config.name, {
      event: 'run_complete',
      pid: process.pid,
      stopped,
      stopReason,
      iterations,
      stats: state.stats
    });
  } catch (error) {
    await handleRunError(config.name, state, runtime, error);
    throw error;
  } finally {
    process.off('SIGTERM', sigtermHandler);
    process.off('SIGINT', sigintHandler);
    await source.close();
  }

  return {
    job: config.name,
    once: Boolean(input.once),
    stopped,
    iterations,
    upserted: state.stats.upserted,
    ignoredDeletes: state.stats.ignoredDeletes,
    pid: process.pid,
    mode,
    tracePath: paths.trace,
    importLogPath: paths.importLog,
    runtimePath: paths.runtime,
    stopCommand: buildStopCommand(config.name, process.pid),
    statePath: paths.state
  };
}

async function handleRunError(job: string, state: ConnectorState, runtime: ConnectorRuntime, error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  state.lastRunAt = new Date().toISOString();
  state.lastError = message;
  state.stats.failed += 1;
  await saveConnectorState(job, state);
  runtime.status = 'error';
  runtime.lastError = message;
  runtime.heartbeatAt = new Date().toISOString();
  runtime.exitedAt = runtime.heartbeatAt;
  await saveConnectorRuntime(job, runtime);
  await appendConnectorLog(job, {
    event: 'run_error',
    pid: runtime.pid,
    error: message,
    stack: error instanceof Error ? error.stack : undefined
  });
}

function buildStopCommand(job: string, pid: number): string {
  return `vs connector stop --job ${job} --pid ${pid}`;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}
