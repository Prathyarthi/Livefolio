/**
 * Cloudflare R2 via the S3-compatible API.
 *
 * Bucket CORS (required for browser PUTs):
 * {
 *   "AllowedOrigins": ["https://your-app-origin", "http://localhost:3000"],
 *   "AllowedMethods": ["GET", "PUT", "HEAD"],
 *   "AllowedHeaders": ["Content-Type"],
 *   "ExposeHeaders": ["ETag"],
 *   "MaxAgeSeconds": 3600
 * }
 */
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const PUT_EXPIRES_IN = 60 * 15;
const GET_EXPIRES_IN = 60 * 10;

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function isR2Configured(): boolean {
  return Boolean(
    env("R2_ACCOUNT_ID") &&
      env("R2_ACCESS_KEY_ID") &&
      env("R2_SECRET_ACCESS_KEY") &&
      env("R2_BUCKET"),
  );
}

export function getR2PublicBaseUrl(): string | null {
  const base = env("R2_PUBLIC_BASE_URL");
  if (!base) return null;
  return base.replace(/\/+$/, "");
}

function getClient(): S3Client {
  const accountId = env("R2_ACCOUNT_ID");
  const accessKeyId = env("R2_ACCESS_KEY_ID");
  const secretAccessKey = env("R2_SECRET_ACCESS_KEY");
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 is not configured");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    // AWS SDK v3.729+ checksums are not accepted by R2.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

function bucket(): string {
  const name = env("R2_BUCKET");
  if (!name) throw new Error("R2_BUCKET is not configured");
  return name;
}

export async function presignPutObject(options: {
  key: string;
  contentType: string;
}): Promise<string> {
  return getSignedUrl(
    getClient(),
    new PutObjectCommand({
      Bucket: bucket(),
      Key: options.key,
      ContentType: options.contentType,
    }),
    { expiresIn: PUT_EXPIRES_IN },
  );
}

export async function presignGetObject(key: string): Promise<string> {
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({
      Bucket: bucket(),
      Key: key,
    }),
    { expiresIn: GET_EXPIRES_IN },
  );
}

export async function putObject(options: {
  key: string;
  contentType: string;
  body: Buffer;
}): Promise<void> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: options.key,
      ContentType: options.contentType,
      Body: options.body,
    }),
  );
}

export async function headObject(key: string): Promise<{
  contentType?: string;
  contentLength?: number;
} | null> {
  try {
    const result = await getClient().send(
      new HeadObjectCommand({
        Bucket: bucket(),
        Key: key,
      }),
    );
    return {
      contentType: result.ContentType,
      contentLength: result.ContentLength,
    };
  } catch {
    return null;
  }
}

export async function deleteObject(key: string): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({
      Bucket: bucket(),
      Key: key,
    }),
  );
}

export async function deleteObjectQuiet(key: string): Promise<void> {
  try {
    await deleteObject(key);
  } catch (error) {
    console.error("[r2] Failed to delete object", { key, error });
  }
}

export function publicObjectUrl(key: string): string | null {
  const base = getR2PublicBaseUrl();
  if (!base) return null;
  return `${base}/${key}`;
}