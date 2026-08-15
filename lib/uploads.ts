export const UPLOAD_KINDS = [
  "resume",
  "project_thumb",
  "job_source",
] as const;

export type UploadKind = (typeof UPLOAD_KINDS)[number];

export const MAX_RESUME_BYTES = 10 * 1024 * 1024;
export const MAX_JOB_SOURCE_BYTES = 10 * 1024 * 1024;
export const MAX_PROJECT_THUMB_BYTES = 2 * 1024 * 1024;

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function isUploadKind(value: string): value is UploadKind {
  return (UPLOAD_KINDS as readonly string[]).includes(value);
}

export function allowedContentTypes(kind: UploadKind): readonly string[] {
  if (kind === "project_thumb") return ["image/jpeg", "image/png", "image/webp"];
  return ["application/pdf"];
}

export function maxBytesForKind(kind: UploadKind): number {
  if (kind === "project_thumb") return MAX_PROJECT_THUMB_BYTES;
  if (kind === "job_source") return MAX_JOB_SOURCE_BYTES;
  return MAX_RESUME_BYTES;
}

export function extensionForContentType(contentType: string): string {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "pdf";
  }
}

export function normalizeUploadContentType(contentType: string): string {
  const normalized = contentType.trim().toLowerCase();
  if (normalized === "image/jpg") return "image/jpeg";
  return normalized;
}

export function isAllowedContentType(kind: UploadKind, contentType: string): boolean {
  return allowedContentTypes(kind).includes(normalizeUploadContentType(contentType));
}

export function isImageContentType(contentType: string): boolean {
  return IMAGE_TYPES.has(contentType);
}

export function hasPdfMagicBytes(buffer: Buffer): boolean {
  return (
    buffer.length >= 5 && buffer.subarray(0, 5).toString("ascii") === "%PDF-"
  );
}

export function hasImageMagicBytes(buffer: Buffer, contentType: string): boolean {
  if (contentType === "image/jpeg") {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (contentType === "image/png") {
    return (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }
  if (contentType === "image/webp") {
    return (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  return false;
}

export function objectKey(options: {
  kind: UploadKind;
  fileId: string;
  userId?: string;
  orgId?: string;
  projectId?: string;
  jobId?: string;
  contentType: string;
}): string {
  const ext = extensionForContentType(normalizeUploadContentType(options.contentType));
  if (options.kind === "resume") {
    if (!options.userId) throw new Error("userId is required for resume keys");
    return `users/${options.userId}/resumes/${options.fileId}.${ext}`;
  }
  if (options.kind === "project_thumb") {
    if (!options.userId || !options.projectId) {
      throw new Error("userId and projectId are required for thumbnail keys");
    }
    return `users/${options.userId}/projects/${options.projectId}/${options.fileId}.${ext}`;
  }
  if (!options.orgId || !options.jobId) {
    throw new Error("orgId and jobId are required for job source keys");
  }
  return `orgs/${options.orgId}/jobs/${options.jobId}/${options.fileId}.${ext}`;
}