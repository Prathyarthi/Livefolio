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
  content: string | ReadonlyArray<{ text?: string | null }> | null | undefined,
): string {
  if (!content) return "";
  if (typeof content === "string") return content.trim();
  return content
    .map((block) => block.text ?? "")
    .join("")
    .trim();
}

function isChatCompletion(
  value: unknown,
): value is { choices: Array<{ message?: { content?: string | ReadonlyArray<{ text?: string | null }> | null } }> } {
  return (
    typeof value === "object"
    && value !== null
    && "choices" in value
    && Array.isArray((value as { choices: unknown }).choices)
  );
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
      stream: false,
      models: fallbackModels,
      messages,
      temperature,
      provider: {
        allowFallbacks: true,
        order: ["DeepInfra", "Lepton", "Together", "Fireworks"],
      },
    },
  });

  if (!isChatCompletion(completion)) {
    throw new Error("OpenRouter returned a stream instead of a chat completion");
  }

  const text = extractMessageText(completion.choices[0]?.message?.content);

  if (!text) {
    throw new Error("OpenRouter returned an empty response");
  }

  return text;
}

/**
 * Resume parsing via OpenRouter with a cacheable static system prompt.
 * Tries OPENROUTER_CHAT_MODEL first, then OPENROUTER_FALLBACK_MODELS.
 */
export async function generateOpenRouterResumeText(
  resumeText: string,
  systemPrompt: string,
  options?: { signal?: AbortSignal },
): Promise<string> {
  const model = getOpenRouterModel();
  const fallbackModels = getOpenRouterFallbackModels().filter(
    (fallback) => fallback !== model,
  );

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
      ...(fallbackModels.length > 0 ? { models: fallbackModels } : {}),
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
