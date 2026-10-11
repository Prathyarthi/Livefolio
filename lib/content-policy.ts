export const MAX_STORED_URL_CHARS = 2_048;
export const MAX_SHORT_LABEL_CHARS = 160;
export const MAX_LONG_TEXT_CHARS = 10_000;
export const MAX_EMAIL_CHARS = 254;
export const MAX_PHONE_CHARS = 32;
export const MAX_SECTION_ROWS = 50;
export const MAX_SKILLS = 200;
export const MAX_SKILL_FIELD_CHARS = 80;
export const MAX_TECH_STACK_ITEMS = 30;
export const MAX_TECH_STACK_ITEM_CHARS = 50;
export const MAX_CUSTOM_SECTIONS = 20;
export const MAX_CUSTOM_SECTION_ITEMS = 50;
export const MAX_CUSTOM_ITEM_FIELDS = 20;
export const MAX_CUSTOM_JSON_DEPTH = 3;
export const MAX_CUSTOM_JSON_BYTES = 100 * 1024;
export const DEFAULT_JSON_BODY_LIMIT_BYTES = 256 * 1024;
export const MAX_BULK_IMPORT_BODY_BYTES = 5 * 1024 * 1024;
export const MAX_RESUME_UPLOAD_BODY_BYTES = 11 * 1024 * 1024;

const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/;
const TEXT_CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const CONTROL_CHARACTERS_GLOBAL = /[\u0000-\u001F\u007F]/g;
const TEXT_CONTROL_CHARACTERS_GLOBAL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const URL_FIELD_NAME = /(?:url|link|href)$/i;
const EXPLICIT_SCHEME = /^[A-Za-z][A-Za-z\d+.-]*:/;
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);
const EMAIL_LOCAL_PART = /^[^\s@]+$/;
const EMAIL_DOMAIN = /^(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/;
const PHONE_CHARACTERS = /^[\d+\-().\s]+$/;

export class ContentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContentValidationError";
  }
}

function normalizeLineEndings(value: string) {
  return value.replace(/\r\n?/g, "\n");
}

export function normalizeRequiredLabel(
  value: string,
  fieldName = "Value",
  maxChars = MAX_SHORT_LABEL_CHARS,
) {
  const normalized = value.trim();
  if (!normalized) {
    throw new ContentValidationError(`${fieldName} is required`);
  }
  if (normalized.length > maxChars) {
    throw new ContentValidationError(
      `${fieldName} must be at most ${maxChars} characters`,
    );
  }
  if (CONTROL_CHARACTERS.test(normalized)) {
    throw new ContentValidationError(`${fieldName} contains control characters`);
  }
  return normalized;
}

export function normalizeOptionalLabel(
  value: string | null | undefined,
  fieldName = "Value",
  maxChars = MAX_SHORT_LABEL_CHARS,
) {
  if (value == null || !value.trim()) return null;
  return normalizeRequiredLabel(value, fieldName, maxChars);
}

export function normalizeLongText(
  value: string | null | undefined,
  fieldName = "Text",
) {
  const normalized = normalizeLineEndings(value ?? "");
  if (normalized.length > MAX_LONG_TEXT_CHARS) {
    throw new ContentValidationError(
      `${fieldName} must be at most ${MAX_LONG_TEXT_CHARS} characters`,
    );
  }
  if (TEXT_CONTROL_CHARACTERS.test(normalized)) {
    throw new ContentValidationError(`${fieldName} contains control characters`);
  }
  return normalized;
}

export function normalizeOptionalEmail(
  value: string | null | undefined,
  fieldName = "Email",
) {
  if (value == null || !value.trim()) return null;
  const normalized = value.trim();
  if (normalized.length > MAX_EMAIL_CHARS) {
    throw new ContentValidationError(
      `${fieldName} must be at most ${MAX_EMAIL_CHARS} characters`,
    );
  }
  const separator = normalized.lastIndexOf("@");
  if (separator <= 0 || separator === normalized.length - 1) {
    throw new ContentValidationError(`${fieldName} must be a valid email address`);
  }
  const local = normalized.slice(0, separator);
  const domain = normalized.slice(separator + 1).toLowerCase();
  if (
    local.length > 64
    || !EMAIL_LOCAL_PART.test(local)
    || !EMAIL_DOMAIN.test(domain)
  ) {
    throw new ContentValidationError(`${fieldName} must be a valid email address`);
  }
  return `${local}@${domain}`;
}

export function normalizeOptionalPhone(
  value: string | null | undefined,
  fieldName = "Phone",
) {
  if (value == null || !value.trim()) return null;
  const normalized = value.trim();
  if (normalized.length > MAX_PHONE_CHARS) {
    throw new ContentValidationError(
      `${fieldName} must be at most ${MAX_PHONE_CHARS} characters`,
    );
  }
  if (!PHONE_CHARACTERS.test(normalized)) {
    throw new ContentValidationError(`${fieldName} contains invalid characters`);
  }
  const digits = normalized.replace(/\D/g, "");
  if (!digits) {
    throw new ContentValidationError(`${fieldName} must contain digits`);
  }
  return normalized.startsWith("+") ? `+${digits}` : digits;
}

export function assertCollectionLimit(
  values: readonly unknown[],
  maxItems: number,
  fieldName: string,
) {
  if (values.length > maxItems) {
    throw new ContentValidationError(
      `${fieldName} must contain at most ${maxItems} items`,
    );
  }
}

export function normalizeStringList(
  values: readonly string[],
  fieldName: string,
  maxItems: number,
  maxItemChars: number,
) {
  assertCollectionLimit(values, maxItems, fieldName);
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const value of values) {
    const item = normalizeRequiredLabel(value, `${fieldName} item`, maxItemChars);
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(item);
  }
  return normalized;
}

function getJsonDepth(value: unknown): number {
  if (Array.isArray(value)) {
    return value.length
      ? 1 + Math.max(...value.map((item) => getJsonDepth(item)))
      : 1;
  }
  if (value && typeof value === "object") {
    const nested = Object.values(value);
    return nested.length
      ? 1 + Math.max(...nested.map((item) => getJsonDepth(item)))
      : 1;
  }
  return 0;
}

export function validateCustomSectionItems(
  value: unknown,
  fieldName = "Custom section items",
) {
  if (!Array.isArray(value)) {
    throw new ContentValidationError(`${fieldName} must be an array`);
  }
  assertCollectionLimit(value, MAX_CUSTOM_SECTION_ITEMS, fieldName);
  for (const [index, item] of value.entries()) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new ContentValidationError(`${fieldName}[${index}] must be an object`);
    }
    assertCollectionLimit(
      Object.keys(item),
      MAX_CUSTOM_ITEM_FIELDS,
      `${fieldName}[${index}] fields`,
    );
  }
  if (getJsonDepth(value) > MAX_CUSTOM_JSON_DEPTH) {
    throw new ContentValidationError(
      `${fieldName} must not exceed ${MAX_CUSTOM_JSON_DEPTH} levels`,
    );
  }
  if (new TextEncoder().encode(JSON.stringify(value)).byteLength > MAX_CUSTOM_JSON_BYTES) {
    throw new ContentValidationError(
      `${fieldName} must be at most ${MAX_CUSTOM_JSON_BYTES} bytes`,
    );
  }
  return value as Record<string, unknown>[];
}

export function sanitizeImportedLabel(
  value: unknown,
  maxChars = MAX_SHORT_LABEL_CHARS,
) {
  return String(value ?? "")
    .replace(CONTROL_CHARACTERS_GLOBAL, "")
    .trim()
    .slice(0, maxChars);
}

export function sanitizeImportedLongText(value: unknown) {
  return normalizeLineEndings(String(value ?? ""))
    .replace(TEXT_CONTROL_CHARACTERS_GLOBAL, "")
    .slice(0, MAX_LONG_TEXT_CHARS);
}

export function sanitizeImportedEmail(value: unknown) {
  if (value != null && typeof value !== "string") return null;
  try {
    return normalizeOptionalEmail(value as string | null | undefined);
  } catch {
    return null;
  }
}

export function sanitizeImportedPhone(value: unknown) {
  if (value != null && typeof value !== "string") return null;
  try {
    return normalizeOptionalPhone(value as string | null | undefined);
  } catch {
    return null;
  }
}

export function sanitizeImportedStringList(
  values: unknown,
  maxItems: number,
  maxItemChars: number,
) {
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const value of values.slice(0, maxItems)) {
    const item = sanitizeImportedLabel(value, maxItemChars);
    const key = item.toLowerCase();
    if (!item || seen.has(key)) continue;
    seen.add(key);
    normalized.push(item);
  }
  return normalized;
}

function validateStoredUrl(value: string, fieldName: string) {
  const normalized = value.trim();
  if (!normalized) {
    throw new ContentValidationError(`${fieldName} cannot be empty`);
  }
  if (CONTROL_CHARACTERS.test(normalized)) {
    throw new ContentValidationError(`${fieldName} contains control characters`);
  }

  const candidate = normalized.startsWith("//")
    ? `https:${normalized}`
    : EXPLICIT_SCHEME.test(normalized)
      ? normalized
      : `https://${normalized}`;
  if (candidate.length > MAX_STORED_URL_CHARS) {
    throw new ContentValidationError(
      `${fieldName} must be at most ${MAX_STORED_URL_CHARS} characters`,
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new ContentValidationError(`${fieldName} must be a valid URL`);
  }

  if (parsed.username || parsed.password) {
    throw new ContentValidationError(`${fieldName} must not contain credentials`);
  }

  const isHttps = parsed.protocol === "https:";
  const isLocalDevelopmentHttp =
    process.env.NODE_ENV !== "production"
    && parsed.protocol === "http:"
    && LOCAL_HOSTNAMES.has(parsed.hostname);
  if (!isHttps && !isLocalDevelopmentHttp) {
    throw new ContentValidationError(
      `${fieldName} must use HTTPS${process.env.NODE_ENV !== "production" ? " (HTTP is allowed only for local development)" : ""}`,
    );
  }

  return parsed.toString();
}

export function normalizeRequiredStoredUrl(value: string, fieldName = "URL") {
  return validateStoredUrl(value, fieldName);
}

export function normalizeOptionalStoredUrl(
  value: string | null | undefined,
  fieldName = "URL",
) {
  if (value == null || !value.trim()) return null;
  return validateStoredUrl(value, fieldName);
}

export function sanitizeImportedStoredUrl(
  value: unknown,
  fieldName = "URL",
) {
  if (value != null && typeof value !== "string") return null;
  try {
    return normalizeOptionalStoredUrl(
      value as string | null | undefined,
      fieldName,
    );
  } catch (error) {
    if (error instanceof ContentValidationError) return null;
    throw error;
  }
}

export function normalizeStoredUrlsInJson(value: unknown, path = "content"): unknown {
  if (Array.isArray(value)) {
    return value.map((item, index) =>
      normalizeStoredUrlsInJson(item, `${path}[${index}]`),
    );
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => {
        if (URL_FIELD_NAME.test(key) && typeof nestedValue === "string") {
          return [
            key,
            normalizeOptionalStoredUrl(nestedValue, `${path}.${key}`) ?? "",
          ];
        }
        return [key, normalizeStoredUrlsInJson(nestedValue, `${path}.${key}`)];
      }),
    );
  }

  return value;
}

export function sanitizeImportedStoredUrlsInJson(
  value: unknown,
  path = "content",
): unknown {
  if (Array.isArray(value)) {
    return value.map((item, index) =>
      sanitizeImportedStoredUrlsInJson(item, `${path}[${index}]`),
    );
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => {
        if (URL_FIELD_NAME.test(key) && typeof nestedValue === "string") {
          return [
            key,
            sanitizeImportedStoredUrl(nestedValue, `${path}.${key}`) ?? "",
          ];
        }
        return [
          key,
          sanitizeImportedStoredUrlsInJson(nestedValue, `${path}.${key}`),
        ];
      }),
    );
  }

  return value;
}

function clampImportedJson(value: unknown, depth: number): unknown {
  if (depth >= MAX_CUSTOM_JSON_DEPTH && value && typeof value === "object") {
    return null;
  }
  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_CUSTOM_SECTION_ITEMS)
      .map((item) => clampImportedJson(item, depth + 1));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, MAX_CUSTOM_ITEM_FIELDS)
        .map(([key, nested]) => [key, clampImportedJson(nested, depth + 1)]),
    );
  }
  return value;
}

export function sanitizeImportedCustomSectionItems(value: unknown) {
  if (!Array.isArray(value)) return [];
  const sanitized = sanitizeImportedStoredUrlsInJson(
    clampImportedJson(value.slice(0, MAX_CUSTOM_SECTION_ITEMS), 0),
  ) as Record<string, unknown>[];
  const bounded: Record<string, unknown>[] = [];
  for (const item of sanitized) {
    const candidate = [...bounded, item];
    if (
      new TextEncoder().encode(JSON.stringify(candidate)).byteLength
      > MAX_CUSTOM_JSON_BYTES
    ) {
      break;
    }
    bounded.push(item);
  }
  return bounded;
}
