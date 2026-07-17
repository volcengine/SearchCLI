// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import './node-bootstrap';
import type { RuntimeConfig, SearchCase, SearchDynamic, SearchResponseShape, SearchResultItem } from './types';
import {
  describeSearchModeOptions,
  describeUserDefinedRecallModeOptions,
  normalizeSearchMode,
  normalizeUserDefinedRecallMode
} from './search-mode';
import { formatMissingVikingAuthMessage } from './auth-errors';
import { buildSignedRequestHeaders } from './http';

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
      disable_personalize: searchCase.disable_personalize,
      query_keyword_match_percent: searchCase.query_keyword_match_percent
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
    const base = this.config.dataPlaneBaseUrl.replace(/\/+$/, '');
    const scene = this.config.sceneId ? `/${this.config.sceneId}` : '';
    return `${base}/api/v1/application/${this.config.applicationId}/search${scene}`;
  }

  private buildHeaders(urlString: string, body: string): Record<string, string> {
    if (!this.config.apiKey && (!this.config.accessKeyId || !this.config.secretKey)) {
      throw new Error(formatMissingVikingAuthMessage());
    }

    const url = new URL(urlString);
    return buildSignedRequestHeaders(this.config, 'POST', url, body, {
      'content-type': 'application/json'
    });
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
    if (input.user_defined_recall_mode !== undefined) {
      const normalizedMode = normalizeUserDefinedRecallMode(input.user_defined_recall_mode);
      if (normalizedMode === undefined) {
        throw new Error(
          `Invalid search_dynamic.user_defined_recall_mode: '${String(input.user_defined_recall_mode)}'. Allowed values are: ${describeUserDefinedRecallModeOptions()}`
        );
      }
      output.user_defined_recall_mode = normalizedMode;
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
