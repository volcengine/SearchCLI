import "server-only";

import {
  SearchApiError,
  SearchTimeoutError,
  createSearchClient,
  type SearchClient,
} from "@volcengine/search-node";

import type { ProjectFeature } from "@/lib/project";
import { env } from "@/lib/server/env";

let client: SearchClient | undefined;

export function getSearchClient(): SearchClient {
  client ??= createSearchClient(
    env.apiKey
      ? { apiKey: env.apiKey, region: env.region }
      : {
          accessKeyId: env.accessKeyId ?? "",
          secretAccessKey: env.secretAccessKey ?? "",
          region: env.region,
        },
  );
  return client;
}

export function requireFeature(feature: ProjectFeature): Response | undefined {
  if (env.features.includes(feature)) return undefined;
  return Response.json(
    { error: `Feature not enabled: ${feature}.` },
    { status: 404 },
  );
}

export function errorResponse(error: unknown): Response {
  const payload =
    error instanceof SearchApiError
      ? {
          error: error.message,
          code: error.code,
          requestId: error.requestId,
        }
      : {
          error:
            error instanceof Error ? error.message : "Unknown server error.",
        };

  const status =
    error instanceof SearchTimeoutError
      ? 504
      : error instanceof SearchApiError
        ? error.status || 502
        : 500;

  return Response.json(payload, { status });
}

export function sseEvent(event: string, data: unknown): Uint8Array {
  return new TextEncoder().encode(
    `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
  );
}
