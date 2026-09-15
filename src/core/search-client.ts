// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import './node-bootstrap';
import { Signer } from '@volcengine/openapi';
import type { RuntimeConfig, SearchCase, SearchDynamic, SearchResponseShape, SearchResultItem } from './types';
import { describeSearchModeOptions, normalizeSearchMode } from './search-mode';

export class VikingSearchClient {
  constructor(private readonly config: RuntimeConfig) {}

  async search(searchCase: SearchCase, searchDynamic?: SearchDynamic): Promise<SearchResponseShape> {
    const url = this.buildUrl();
    const payload: Record<string, unknown> = {
      query: searchCase.query,
      dataset_id: searchCase.dataset_id ?? this.config.datasetId,
      page_number: searchCase.page_number ?? 1,
      page_size: searchCase.page_size ?? this.config.defaultPageSize,
      user: searchCase.user,
      filter: searchCase.filter,
      context: searchCase.context,
      sort_by: searchCase.sort_by,
      sort_order: searchCase.sort_order,
      output_fields: searchCase.output_fields,
      conditional_boost: searchCase.conditional_boost,
      disable_personalize: searchCase.disable_personalize
    };

    if (searchDynamic && Object.keys(searchDynamic).length > 0) {
      payload.search_dynamic = this.toApiSearchDynamic(searchDynamic);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const body = JSON.stringify(payload);
      const response = await fetch(url, {
        method: 'POST',
        headers: this.buildHeaders(url, body),
        body,
        signal: controller.signal
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Search API failed: ${response.status} ${response.statusText}\n${body}`);
      }

      const raw = await response.json();
      return this.normalizeResponse(raw);
    } finally {
      clearTimeout(timer);
    }
  }

  private buildUrl(): string {
    const base = this.config.baseUrl.replace(/\/+$/, '');
    const scene = this.config.sceneId ? `/${this.config.sceneId}` : '';
    return `${base}/api/v1/application/${this.config.applicationId}/search${scene}`;
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

  private toApiSearchDynamic(input: SearchDynamic): Record<string, unknown> {
    const output: Record<string, unknown> = { ...input };
    if (input.mode !== undefined) {
      const normalizedMode = normalizeSearchMode(input.mode);
      if (normalizedMode === undefined) {
        throw new Error(`Invalid search_dynamic.mode: '${String(input.mode)}'. Allowed values are: ${describeSearchModeOptions()}`);
      }
      output.mode = normalizedMode;
    }
    return output;
  }

  private normalizeResponse(raw: any): SearchResponseShape {
    const body = raw.result ?? raw;
    const list = body.search_results ?? body.searchResults ?? [];
    const results: SearchResultItem[] = list.map((item: any) => ({
      id: item._id ?? item.x_id ?? item.id ?? '',
      score: item.score,
      title: this.pickTitle(item.display_fields ?? item.displayFields ?? {}),
      displayFields: item.display_fields ?? item.displayFields ?? {}
    }));

    return {
      requestId: raw.request_id ?? raw.requestId,
      totalItems: body.total_items ?? body.totalItems ?? results.length,
      spellCorrection: raw.spell_correction ?? body.spell_correction ?? body.spellCorrection,
      results,
      raw
    };
  }

  private pickTitle(displayFields: Record<string, unknown>): string | undefined {
    const candidates = ['title', 'name', 'item_title', 'content_title', 'my_title'];
    for (const key of candidates) {
      const value = displayFields[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value;
      }
    }
    return undefined;
  }
}
