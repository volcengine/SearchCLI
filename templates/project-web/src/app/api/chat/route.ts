import { randomUUID } from "node:crypto";

import { env } from "@/lib/server/env";
import {
  getSearchClient,
  requireFeature,
  sseEvent,
} from "@/lib/server/viking";

type ChatBody = {
  message?: unknown;
  sessionId?: unknown;
};

export async function POST(request: Request) {
  const unavailable = requireFeature("chat");
  if (unavailable) return unavailable;

  let body: ChatBody;
  try {
    body = (await request.json()) as ChatBody;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const message = String(body.message ?? "").trim();
  if (!message) {
    return Response.json({ error: "Missing message." }, { status: 400 });
  }

  const sessionId =
    typeof body.sessionId === "string" && body.sessionId
      ? body.sessionId
      : randomUUID();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(sseEvent("session", { sessionId }));
      try {
        for await (const chunk of getSearchClient().chatSearch({
          application: env.appId,
          session_id: sessionId,
          input_message: {
            content: [{ type: "text", text: message }],
          },
        })) {
          controller.enqueue(sseEvent("chunk", chunk));
        }
      } catch (error) {
        controller.enqueue(
          sseEvent("error", {
            error:
              error instanceof Error ? error.message : "Unknown server error.",
          }),
        );
      } finally {
        controller.enqueue(sseEvent("done", {}));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
