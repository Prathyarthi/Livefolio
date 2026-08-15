import { MAX_PROJECT_THUMB_BYTES, MAX_RESUME_BYTES } from "@/lib/uploads";

export class UploadRequestError extends Error {
  status: number;
  upgradeRequired: boolean;

  constructor(message: string, status = 400, upgradeRequired = false) {
    super(message);
    this.name = "UploadRequestError";
    this.status = status;
    this.upgradeRequired = upgradeRequired;
  }
}

async function readError(response: Response, fallback: string) {
  const body = (await response
    .clone()
    .json()
    .catch(() => null)) as { error?: unknown } | null;
  const message =
    body && typeof body.error === "string" && body.error.trim()
      ? body.error
      : fallback;
  throw new UploadRequestError(
    message,
    response.status,
    response.status === 402,
  );
}

export type SignedUpload = {
  key: string;
  uploadUrl: string;
  publicUrl?: string | null;
  usage?: { used: number; max: number };
};

export type CompletedUpload = {
  id: string;
  kind: string;
  publicUrl?: string;
  downloadUrl?: string;
  usage?: { used: number; max: number };
};

export async function getUploadUsage() {
  const res = await fetch("/api/uploads/usage", { cache: "no-store" });
  if (!res.ok) await readError(res, "Failed to load upload usage");
  return res.json() as Promise<{
    configured: boolean;
    projectThumbnails: { used: number; max: number };
  }>;
}

export async function extractPdfText(file: File): Promise<string> {
  if (file.type && file.type !== "application/pdf") {
    throw new UploadRequestError("Please upload a PDF file");
  }
  if (file.size > MAX_RESUME_BYTES) {
    throw new UploadRequestError("File size must be less than 10MB");
  }
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/uploads/extract-pdf", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) await readError(res, "Failed to extract PDF text");
  const json = (await res.json()) as { text?: string };
  if (!json.text?.trim()) {
    throw new UploadRequestError("Could not extract text from that PDF");
  }
  return json.text;
}

export async function uploadStoredFile(options: {
  kind: "resume" | "project_thumb" | "job_source";
  file: File;
  projectId?: string;
  jobId?: string;
}): Promise<CompletedUpload> {
  if (options.kind === "project_thumb" && options.file.size > MAX_PROJECT_THUMB_BYTES) {
    throw new UploadRequestError("Thumbnail must be under 2MB");
  }
  if (options.kind !== "project_thumb" && options.file.size > MAX_RESUME_BYTES) {
    throw new UploadRequestError("File size must be less than 10MB");
  }

  const signRes = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind: options.kind,
      contentType: options.file.type || (options.kind === "project_thumb" ? "image/jpeg" : "application/pdf"),
      sizeBytes: options.file.size,
      projectId: options.projectId,
      jobId: options.jobId,
    }),
  });
  if (!signRes.ok) await readError(signRes, "Could not start upload");
  const signed = (await signRes.json()) as SignedUpload;

  const putRes = await fetch(signed.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type":
        options.file.type ||
        (options.kind === "project_thumb" ? "image/jpeg" : "application/pdf"),
    },
    body: options.file,
  });
  if (!putRes.ok) {
    throw new UploadRequestError("Upload to storage failed. Try again.");
  }

  const completeRes = await fetch("/api/uploads/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind: options.kind,
      key: signed.key,
      contentType: options.file.type,
      projectId: options.projectId,
      jobId: options.jobId,
    }),
  });
  if (!completeRes.ok) await readError(completeRes, "Could not save upload");
  return completeRes.json() as Promise<CompletedUpload>;
}