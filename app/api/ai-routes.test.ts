import { beforeEach, describe, expect, mock, test } from "bun:test";

let guardResponse: Response | null = null;
const guardAiRequest = mock(async (request: Request) => (
  guardResponse
    ? { ok: false as const, response: guardResponse }
    : { ok: true as const, request, userId: "user-a" }
));

const generateOpenRouterText = mock(async () => "{}");
const syntuxHandler = mock(async () => new Response("generated UI"));
const createSyntuxHandler = mock(() => syntuxHandler);

mock.module("@/lib/ai-request-guard", () => ({
  AI_USER_CONTEXT_LIMIT_CHARS: 4_000,
  guardAiRequest,
}));

mock.module("@/lib/openrouter", () => ({
  DEFAULT_OPENROUTER_MODEL: "test-model",
  generateOpenRouterText,
  getOpenRouterApiKey: () => "test-key",
}));

mock.module("@ai-sdk/openai", () => ({
  createOpenAI: () => () => ({ modelId: "test-model" }),
}));

mock.module("getsyntux/server", () => ({
  createSyntuxHandler,
}));

const { POST: generatePortfolio } = await import("./generate-portfolio/route");
const { POST: generateSyntux } = await import("./syntux/route");

function jsonRequest(path: string, body: unknown) {
  return new Request(`http://localhost/api/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  guardResponse = null;
  guardAiRequest.mockClear();
  generateOpenRouterText.mockClear();
  syntuxHandler.mockClear();
  createSyntuxHandler.mockClear();
});

describe("AI route protections", () => {
  test("generate-portfolio stops when the request guard rejects", async () => {
    guardResponse = Response.json({ error: "Unauthorized" }, { status: 401 });

    const response = await generatePortfolio(
      jsonRequest("generate-portfolio", { prompt: "Hello" }),
    );

    expect(response.status).toBe(401);
    expect(generateOpenRouterText).not.toHaveBeenCalled();
  });

  test("generate-portfolio rejects prompts over 4,000 characters", async () => {
    const response = await generatePortfolio(
      jsonRequest("generate-portfolio", { prompt: "x".repeat(4_001) }),
    );

    expect(response.status).toBe(400);
    expect(generateOpenRouterText).not.toHaveBeenCalled();
  });

  test("generate-portfolio invokes OpenRouter for an accepted prompt", async () => {
    const response = await generatePortfolio(
      jsonRequest("generate-portfolio", { prompt: "Build my portfolio" }),
    );

    expect(response.status).toBe(200);
    expect(generateOpenRouterText).toHaveBeenCalledTimes(1);
  });

  test("Syntux stops when the request guard rejects", async () => {
    guardResponse = Response.json(
      { error: "Too many AI requests" },
      { status: 429 },
    );

    const response = await generateSyntux(
      jsonRequest("syntux", { value: {}, hint: "Render this" }),
    );

    expect(response.status).toBe(429);
    expect(createSyntuxHandler).not.toHaveBeenCalled();
  });

  test("Syntux rejects user context over 4,000 characters", async () => {
    const response = await generateSyntux(
      jsonRequest("syntux", { value: {}, hint: "x".repeat(4_001) }),
    );

    expect(response.status).toBe(400);
    expect(createSyntuxHandler).not.toHaveBeenCalled();
  });

  test("Syntux invokes its handler for an accepted request", async () => {
    const response = await generateSyntux(
      jsonRequest("syntux", { value: {}, hint: "Render this" }),
    );

    expect(response.status).toBe(200);
    expect(createSyntuxHandler).toHaveBeenCalledTimes(1);
    expect(syntuxHandler).toHaveBeenCalledTimes(1);
  });
});
