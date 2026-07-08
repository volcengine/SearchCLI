// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

let debugEnabled = false;
let initialized = false;

function detectDebugFlag(): boolean {
  if (process.env.VIKING_DEBUG === 'true' || process.env.VIKING_DEBUG === '1') {
    return true;
  }
  if (process.env.DEBUG === 'true' || process.env.DEBUG === '1') {
    return true;
  }
  if (process.argv.includes('--debug')) {
    return true;
  }
  return false;
}

export function initDebugMode(): void {
  if (initialized) return;
  initialized = true;
  if (detectDebugFlag()) {
    debugEnabled = true;
  }
}

export function setDebugMode(enabled: boolean): void {
  initialized = true;
  debugEnabled = enabled;
}

export function isDebugMode(): boolean {
  if (!initialized) {
    initDebugMode();
  }
  return debugEnabled;
}

export function debugLog(label: string, data?: unknown): void {
  if (!isDebugMode()) return;
  const timestamp = new Date().toISOString();
  const prefix = `[DEBUG ${timestamp}] ${label}`;
  if (data === undefined) {
    console.error(prefix);
  } else if (typeof data === 'string') {
    console.error(`${prefix}: ${data}`);
  } else {
    console.error(`${prefix}:`, data);
  }
}

initDebugMode();
