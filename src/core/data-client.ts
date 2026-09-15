// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import './node-bootstrap';
import { Signer } from '@volcengine/openapi';
import type { RuntimeConfig } from './types';

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
    const base = this.config.baseUrl.replace(/\/+$/, '');
    return `${base}/api/v1/dataset/${this.config.datasetId}/get_item`;
  }

  private buildHeaders(urlString: string, body: string): Record<string, string> {
    if (!this.config.accessKeyId || !this.config.secretKey) {
      throw new Error(
        'Missing Viking auth. Run `vs auth import-env`, `vs auth login`, set VIKING_AK/VIKING_SK, or pass --ak/--sk.'
      );
    }

    const url = new URL(urlString);
    const headers: Record<string, string> = {
      accept: 'application/json',
      'content-type': 'application/json',
      host: url.host
    };

    const signer = new Signer(
      {
        region: this.config.region,
        method: 'POST',
        pathname: url.pathname,
        params: Object.fromEntries(url.searchParams.entries()),
        headers,
        body
      },
      this.config.service
    );

    signer.addAuthorization({
      accessKeyId: this.config.accessKeyId,
      secretKey: this.config.secretKey,
      sessionToken: ''
    });

    return headers;
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
