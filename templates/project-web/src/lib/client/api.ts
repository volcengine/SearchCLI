import type { ChatSearchChunk } from "@volcengine/search-node";

type SseEvent = {
  event: string;
  data: unknown;
};

export async function postJson<TResponse>(
  path: string,
  body?: unknown,
): Promise<TResponse> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const data = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(data.error || `请求失败，状态码 ${response.status}。`);
  }
  return data as TResponse;
}

export async function streamChat({
  message,
  sessionId,
  onSession,
  onChunk,
}: {
  message: string;
  sessionId?: string;
  onSession: (sessionId: string) => void;
  onChunk: (chunk: ChatSearchChunk) => void;
}): Promise<void> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, sessionId }),
  });
  if (!response.ok) {
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error || `请求失败，状态码 ${response.status}。`);
  }
  if (!response.body) {
    throw new Error("浏览器不支持流式响应。");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const result = consumeEvents(buffer, (event) => {
        if (event.event === "session") {
          onSession((event.data as { sessionId: string }).sessionId);
        } else if (event.event === "chunk") {
          onChunk(event.data as ChatSearchChunk);
        } else if (event.event === "error") {
          throw new Error(
            (event.data as { error?: string }).error || "对话请求失败。",
          );
        }
      });
      buffer = result.remaining;
      if (result.done) {
        await reader.cancel();
        return;
      }
    }
  } finally {
    reader.releaseLock();
  }

  throw new Error("对话响应未完整返回，请稍后重试。");
}

function consumeEvents(
  buffer: string,
  onEvent: (event: SseEvent) => void,
): { remaining: string; done: boolean } {
  const parts = buffer.split("\n\n");
  const remaining = parts.pop() ?? "";
  let done = false;

  for (const part of parts) {
    const event = parseEvent(part);
    onEvent(event);
    done ||= event.event === "done";
  }

  return { remaining, done };
}

function parseEvent(value: string): SseEvent {
  const event = value.match(/^event: (.*)$/m)?.[1] ?? "message";
  const data = value.match(/^data: (.*)$/m)?.[1] ?? "{}";
  return { event, data: JSON.parse(data) };
}
