import { Resend } from "resend";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  tags?: { name: string; value: string }[];
  idempotencyKey?: string;
};

export type SendEmailResult = {
  id: string | null;
  error: string | null;
};

export type SendEmailBatchResult = {
  results: SendEmailResult[];
  error: string | null;
};

const BATCH_SIZE = 100;
const MAX_RATE_LIMIT_RETRIES = 3;

type ResendError = {
  name: string;
  message: string;
  statusCode: number | null;
};

type ResendCallResult<T> = {
  data: T | null;
  error: ResendError | null;
  headers: Record<string, string> | null;
};

function getFromAddress(): string {
  return (
    process.env.EMAIL_FROM?.trim() || "Livefolio <team@livefolio.me>"
  );
}

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function isRateLimitError(error: ResendError): boolean {
  return (
    error.name === "rate_limit_exceeded" ||
    error.statusCode === 429 ||
    error.message.toLowerCase().includes("too many requests")
  );
}

function retryDelayMs(
  attempt: number,
  headers: Record<string, string> | null,
): number {
  const retryAfter = headers?.["retry-after"];
  const seconds = retryAfter ? Number(retryAfter) : NaN;
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000;
  }
  return 1000 * 2 ** attempt;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRateLimitRetry<T>(
  send: () => Promise<ResendCallResult<T>>,
): Promise<ResendCallResult<T>> {
  let last: ResendCallResult<T> | undefined;
  for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt += 1) {
    last = await send();
    if (
      !last.error ||
      !isRateLimitError(last.error) ||
      attempt === MAX_RATE_LIMIT_RETRIES
    ) {
      return last;
    }
    await sleep(retryDelayMs(attempt, last.headers));
  }
  return last!;
}

function toApiPayload(input: SendEmailInput) {
  return {
    from: getFromAddress(),
    to: input.to,
    subject: input.subject,
    html: input.html,
    ...(input.tags?.length ? { tags: input.tags } : {}),
  };
}

export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const client = getResendClient();
  if (!client) {
    return {
      id: null,
      error: "RESEND_API_KEY is not configured.",
    };
  }

  try {
    const { data, error } = await withRateLimitRetry(() =>
      client.emails.send(
        toApiPayload(input),
        input.idempotencyKey
          ? { idempotencyKey: input.idempotencyKey }
          : undefined,
      ),
    );

    if (error) {
      return { id: null, error: error.message };
    }

    return { id: data?.id ?? null, error: null };
  } catch (error) {
    return {
      id: null,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

export async function sendEmailBatch(
  inputs: SendEmailInput[],
  options?: { idempotencyKey?: string },
): Promise<SendEmailBatchResult> {
  if (inputs.length === 0) {
    return { results: [], error: null };
  }

  const client = getResendClient();
  if (!client) {
    const error = "RESEND_API_KEY is not configured.";
    return {
      results: inputs.map(() => ({ id: null, error })),
      error,
    };
  }

  const results: SendEmailResult[] = [];
  let batchError: string | null = null;

  for (let i = 0; i < inputs.length; i += BATCH_SIZE) {
    const chunk = inputs.slice(i, i + BATCH_SIZE);
    const chunkIndex = Math.floor(i / BATCH_SIZE);
    const idempotencyKey = options?.idempotencyKey
      ? inputs.length > BATCH_SIZE
        ? `${options.idempotencyKey}-${chunkIndex}`
        : options.idempotencyKey
      : undefined;

    try {
      const { data, error } = await withRateLimitRetry(() =>
        client.batch.send(
          chunk.map(toApiPayload),
          idempotencyKey ? { idempotencyKey } : undefined,
        ),
      );

      if (error) {
        batchError = error.message;
        results.push(
          ...chunk.map(() => ({ id: null, error: error.message })),
        );
        continue;
      }

      const ids = data?.data ?? [];
      results.push(
        ...chunk.map((_, index) => {
          const id = ids[index]?.id ?? null;
          return {
            id,
            error: id ? null : "Missing Resend id for batch item.",
          };
        }),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send email batch";
      batchError = message;
      results.push(...chunk.map(() => ({ id: null, error: message })));
    }
  }

  return { results, error: batchError };
}

export function renderTemplatePlaceholders(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    return vars[key] ?? "";
  });
}
