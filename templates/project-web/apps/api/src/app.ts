import { randomUUID } from "node:crypto";
import express from "express";
import {
  SearchApiError,
  SearchTimeoutError,
  createSearchClient,
  type SearchClient,
} from "@volcengine/search-node";
import type { NextFunction, Request, Response } from "express";
import { apiEnv } from "./env.js";

export const app = express();

app.use(express.json());

const SEARCH_PAGE_SIZE = 10;
const QUERY_RECOMMENDATION_PAGE_SIZE = 10;
const RECOMMEND_PAGE_SIZE = 20;
const RECOMMEND_USER_ID = "template-user";
let cachedClient: SearchClient | undefined;

type ProjectFeature = "search" | "recommend" | "chat";
const projectFeatures =
  (apiEnv as { features?: ProjectFeature[] }).features ?? [];
const enabledFeatures = new Set<ProjectFeature>(projectFeatures);

type RuntimeEnv = typeof apiEnv & {
  apiKey?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
};

app.get("/api/config", (_request, response) => {
  response.json({ features: projectFeatures });
});

app.post("/api/chat", requireFeature("chat"), async (request, response) => {
  const message = String(request.body.message ?? "").trim();
  if (!message) {
    response.status(400).json({ error: "Missing message." });
    return;
  }

  const sessionId = request.body.sessionId || randomUUID();
  response.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  response.setHeader("Cache-Control", "no-cache, no-transform");
  response.setHeader("Connection", "keep-alive");
  response.setHeader("X-Accel-Buffering", "no");
  response.flushHeaders();

  sendSseEvent(response, "session", { sessionId });

  try {
    for await (const chunk of getSearchClient().chatSearch({
      application: apiEnv.appId,
      session_id: sessionId,
      input_message: {
        content: [
          {
            type: "text",
            text: message,
          },
        ],
      },
    })) {
      sendSseEvent(response, "chunk", chunk);
    }
    sendSseEvent(response, "done", {});
  } catch (error) {
    sendSseEvent(response, "error", getErrorPayload(error));
    sendSseEvent(response, "done", {});
  } finally {
    response.end();
  }
});

app.post("/api/search", requireFeature("search"), async (request, response) => {
  try {
    const query = String(request.body.query ?? "").trim();
    const image = request.body.image?.base64 as string | undefined;
    const page = Math.max(1, Number(request.body.page) || 1);
    const searchQuery = buildSearchQuery(query, image);
    if (!searchQuery) {
      response.status(400).json({ error: "Missing query or image." });
      return;
    }

    const result = await getSearchClient().search({
      application: apiEnv.appId,
      scene_id: apiEnv.searchSceneId,
      dataset_id: apiEnv.searchDatasetId,
      query: searchQuery,
      page_number: page,
      page_size: SEARCH_PAGE_SIZE,
    });

    const totalItems = Number.isFinite(result.total_items)
      ? result.total_items
      : undefined;
    const totalPages =
      typeof totalItems === "number"
        ? Math.max(1, Math.ceil(totalItems / SEARCH_PAGE_SIZE))
        : undefined;
    const resultCount = result.search_results?.length ?? 0;
    const hasMore =
      typeof totalPages === "number"
        ? page < totalPages
        : resultCount === SEARCH_PAGE_SIZE;

    response.json({
      ...result,
      page,
      page_size: SEARCH_PAGE_SIZE,
      total_pages: totalPages,
      has_more: hasMore,
    });
  } catch (error) {
    sendError(response, error);
  }
});

app.post(
  "/api/query-recommendation",
  requireFeature("search"),
  async (_request, response) => {
    try {
      const result = await getSearchClient().queryRecommendation({
        application: apiEnv.appId,
        scene_id: apiEnv.searchSceneId,
        dataset_id: apiEnv.searchDatasetId,
        user: { _user_id: RECOMMEND_USER_ID },
        page_size: QUERY_RECOMMENDATION_PAGE_SIZE,
      });
      response.json(result);
    } catch (error) {
      sendError(response, error);
    }
  },
);

app.post(
  "/api/recommend",
  requireFeature("recommend"),
  async (_request, response) => {
    try {
      const result = await getSearchClient().recommend({
        application: apiEnv.appId,
        scene_id: apiEnv.recSceneId,
        user: { _user_id: RECOMMEND_USER_ID },
        page_size: RECOMMEND_PAGE_SIZE,
      });
      response.json(result);
    } catch (error) {
      sendError(response, error);
    }
  },
);

function requireFeature(feature: ProjectFeature) {
  return (_request: Request, response: Response, next: NextFunction): void => {
    if (!enabledFeatures.has(feature)) {
      response.status(404).json({ error: `Feature not enabled: ${feature}.` });
      return;
    }
    next();
  };
}

function getSearchClient(): SearchClient {
  const runtimeEnv = apiEnv as RuntimeEnv;
  cachedClient ??= createSearchClient(
    runtimeEnv.apiKey
      ? { apiKey: runtimeEnv.apiKey, region: runtimeEnv.region }
      : {
          accessKeyId: runtimeEnv.accessKeyId ?? "",
          secretAccessKey: runtimeEnv.secretAccessKey ?? "",
          region: runtimeEnv.region,
        },
  );
  return cachedClient;
}

function buildSearchQuery(text: string, image?: string) {
  if (!text && !image) return undefined;
  return {
    ...(text ? { text } : {}),
    ...(image
      ? {
          image_url: image,
          ...(text ? { image_query_instruction: text } : {}),
        }
      : {}),
  };
}

function sendSseEvent(
  response: Response,
  event: "session" | "chunk" | "error" | "done",
  data: unknown,
): void {
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(data)}\n\n`);
}

function getErrorPayload(error: unknown): {
  error: string;
  code?: string;
  requestId?: string;
} {
  if (error instanceof SearchApiError) {
    return {
      error: error.message,
      code: error.code,
      requestId: error.requestId,
    };
  }

  if (error instanceof SearchTimeoutError) {
    return { error: error.message };
  }

  return {
    error: error instanceof Error ? error.message : "Unknown server error.",
  };
}

function sendError(response: Response, error: unknown): void {
  const status =
    error instanceof SearchTimeoutError
      ? 504
      : error instanceof SearchApiError
        ? error.status || 502
        : 500;

  response.status(status).json(getErrorPayload(error));
}
