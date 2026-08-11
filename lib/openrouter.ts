import { OpenRouter } from "@openrouter/sdk";

export const DEFAULT_OPENROUTER_MODEL = "moonshotai/kimi-k2.5";

export const FALLBACK_MODELS = [
  "moonshotai/kimi-k2.5",
  "google/gemini-flash-1.5",
  "meta-llama/llama-3.1-8b-instruct:free",
];

export function getOpenRouterApiKey() {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  return apiKey;
}

export function getOpenRouterModel() {
  return process.env.OPENROUTER_CHAT_MODEL || DEFAULT_OPENROUTER_MODEL;
}

const RESUME_PARSE_SESSION_ID = "livefolio-resume-parse";

type OpenRouterTextContentBlock = {
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral"; ttl?: "1h" };
};

type OpenRouterCachedMessage = {
  role: "system" | "user" | "assistant";
  content: string | OpenRouterTextContentBlock[];
};

function extractMessageText(
  content: string | OpenRouterTextContentBlock[] | null | undefined,
): string {
  if (!content) return "";
  if (typeof content === "string") return content.trim();
  return content
    .map((block) => block.text)
    .join("")
    .trim();
}

export function getOpenRouterFallbackModels(): string[] {
  const fallbackEnv = process.env.OPENROUTER_FALLBACK_MODELS;
  if (fallbackEnv) {
    return fallbackEnv.split(",").map((m) => m.trim());
  }
  return FALLBACK_MODELS;
}

function createOpenRouterClient() {
  return new OpenRouter({
    apiKey: getOpenRouterApiKey(),
    httpReferer: process.env.OPENROUTER_HTTP_REFERER,
    appTitle: process.env.OPENROUTER_APP_TITLE,
  });
}

type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function generateOpenRouterText({
  messages,
  model,
  temperature = 0.2,
  enableFallback = true,
}: {
  messages: OpenRouterMessage[];
  model?: string;
  temperature?: number;
  enableFallback?: boolean;
}) {
  const client = createOpenRouterClient();

  const primaryModel = model || getOpenRouterModel();
  const fallbackModels = enableFallback ? getOpenRouterFallbackModels() : [primaryModel];

  const completion = await client.chat.send({
    chatRequest: {
      models: fallbackModels,
      messages,
      temperature,
      provider: {
        allowFallbacks: true,
        order: ["DeepInfra", "Lepton", "Together", "Fireworks"],
      },
    },
  });

  const text = completion.choices[0]?.message?.content?.trim() ?? "";

  if (!text) {
    throw new Error("OpenRouter returned an empty response");
  }

  return text;
}

export async function streamOpenRouterText({
  messages,
  temperature = 0.5,
}: {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  temperature?: number;
}): Promise<ReadableStream<Uint8Array>> {
  const fallbackModels = getOpenRouterFallbackModels();
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getOpenRouterApiKey()}`,
      "Content-Type": "application/json",
      ...(process.env.OPENROUTER_HTTP_REFERER
        ? { "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER }
        : {}),
      ...(process.env.OPENROUTER_APP_TITLE
        ? { "X-Title": process.env.OPENROUTER_APP_TITLE }
        : {}),
    },
    body: JSON.stringify({
      models: fallbackModels,
      messages,
      temperature,
      stream: true,
      provider: {
        allowFallbacks: true,
        order: ["DeepInfra", "Lepton", "Together", "Fireworks"],
      },
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`OpenRouter streaming failed (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        const text = decoder.decode(value, { stream: true });
        for (const line of text.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            controller.close();
            return;
          }
          try {
            const msg = JSON.parse(data) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const token = msg.choices?.[0]?.delta?.content ?? "";
            if (token) controller.enqueue(encoder.encode(token));
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    },
  });
}

/**
 * Resume parsing via OpenRouter with a cacheable static system prompt.
 * Uses a single model, no provider ordering (sticky routing for cache hits).
 */
export async function generateOpenRouterResumeText(
  resumeText: string,
  systemPrompt: string,
  options?: { signal?: AbortSignal },
): Promise<string> {
  const model = getOpenRouterModel();

  const messages: OpenRouterCachedMessage[] = [
    {
      role: "system",
      content: [
        {
          type: "text",
          text: systemPrompt,
          cache_control: { type: "ephemeral" },
        },
      ],
    },
    {
      role: "user",
      content: resumeText,
    },
  ];

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    signal: options?.signal,
    headers: {
      Authorization: `Bearer ${getOpenRouterApiKey()}`,
      "Content-Type": "application/json",
      ...(process.env.OPENROUTER_HTTP_REFERER
        ? { "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER }
        : {}),
      ...(process.env.OPENROUTER_APP_TITLE
        ? { "X-OpenRouter-Title": process.env.OPENROUTER_APP_TITLE }
        : {}),
    },
    body: JSON.stringify({
      model,
      session_id: RESUME_PARSE_SESSION_ID,
      messages,
      temperature: 0.2,
    }),
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof (payload as { error?: { message?: unknown } }).error?.message ===
        "string"
        ? (payload as { error: { message: string } }).error.message
        : `OpenRouter request failed (${response.status})`;
    throw new Error(message);
  }

  const completion = payload as {
    choices?: Array<{ message?: { content?: string | OpenRouterTextContentBlock[] } }>;
  };

  const text = extractMessageText(completion.choices?.[0]?.message?.content);

  if (!text) {
    throw new Error("OpenRouter returned an empty response");
  }

  return text;
}
