// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import type { ServiceConfig } from './service-config';
import { postJson } from './http';

export class VikingRuntimeApiClient {
  constructor(private readonly config: ServiceConfig) {}

  search(applicationId: string, sceneId: string | undefined, payload: unknown): Promise<unknown> {
    const scene = sceneId ? `/${sceneId}` : '';
    return postJson(this.config, `/api/v1/application/${applicationId}/search${scene}`, payload);
  }

  queryCompletion(applicationId: string, sceneId: string, payload: unknown): Promise<unknown> {
    return postJson(this.config, `/api/v1/application/${applicationId}/search/${sceneId}/query_completion`, payload);
  }

  recommend(applicationId: string, sceneId: string, payload: unknown): Promise<unknown> {
    return postJson(this.config, `/api/v1/application/${applicationId}/${sceneId}`, payload);
  }

  chatSearch(applicationId: string, payload: unknown): Promise<unknown> {
    return postJson(this.config, `/api/v1/application/${applicationId}/chat_search`, payload);
  }

  dataWrite(datasetId: string, payload: unknown): Promise<unknown> {
    return postJson(this.config, `/api/v1/dataset/${datasetId}/write`, payload);
  }

  dataList(datasetId: string, payload: unknown): Promise<unknown> {
    return postJson(this.config, `/api/v1/dataset/${datasetId}/list_items`, payload);
  }

  dataGet(datasetId: string, payload: unknown): Promise<unknown> {
    return postJson(this.config, `/api/v1/dataset/${datasetId}/get_item`, payload);
  }

  dataDelete(datasetId: string, payload: unknown): Promise<unknown> {
    return postJson(this.config, `/api/v1/dataset/${datasetId}/delete`, payload);
  }
}
