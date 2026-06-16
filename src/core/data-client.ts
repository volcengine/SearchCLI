// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import './node-bootstrap';
import type { RuntimeConfig } from './types';
import { buildSignedRequestHeaders } from './http';

export interface DatasetItemDetail {
  id: string;
  rawData: Record<string, unknown>;
  raw: unknown;
}

export class VikingDataClient {
  constructor(private readonly config: RuntimeConfig) {}

  async getItem(itemId: string, outputFields?: string[]): Promise<DatasetItemDetail | undefined> {
    const url = this.buildUrl();
    const payload = JSON.stringify({
      _id: itemId,
      output_fields: outputFields
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: this.buildHeaders(url, payload),
      body: payload
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`GetItem failed: ${response.status} ${response.statusText}\n${body}`);
    }

    const raw = await response.json();
    const item = raw?.result?.item ?? raw?.item;
    if (!item) return undefined;

    const parsedRawData = parseRawData(item.raw_data);
    return {
      id: String(item._id ?? itemId),
      rawData: parsedRawData,
      raw
    };
  }

  private buildUrl(): string {
    const base = this.config.dataPlaneBaseUrl.replace(/\/+$/, '');
    return `${base}/api/v1/dataset/${this.config.datasetId}/get_item`;
  }

  private buildHeaders(urlString: string, body: string): Record<string, string> {
    if (!this.config.accessKeyId || !this.config.secretKey) {
      throw new Error(
        'Missing Viking auth. Run `vs auth import-env`, `vs auth login`, set VIKING_AK/VIKING_SK, or pass --ak/--sk.'
      );
    }

    const url = new URL(urlString);
    return buildSignedRequestHeaders(this.config, 'POST', url, body, {
      'content-type': 'application/json'
    });
  }
}

function parseRawData(rawData: unknown): Record<string, unknown> {
  if (!rawData) return {};
  if (typeof rawData === 'string') {
    try {
      const parsed = JSON.parse(rawData) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return { value: rawData };
    }
  }

  if (typeof rawData === 'object' && !Array.isArray(rawData)) {
    return rawData as Record<string, unknown>;
  }

  return { value: rawData };
}
