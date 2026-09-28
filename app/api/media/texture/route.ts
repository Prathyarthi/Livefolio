import { NextRequest, NextResponse } from "next/server";
import { publicImageKeyFromUrl } from "@/lib/public-image";
import { getR2PublicBaseUrl, headObject, readObject } from "@/lib/r2";
import {
  hasImageMagicBytes,
  isImageContentType,
  MAX_PROFILE_PHOTO_BYTES,
  normalizeUploadContentType,
} from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url")?.trim();
  const base = getR2PublicBaseUrl();
  if (!rawUrl || !base) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const key = publicImageKeyFromUrl(rawUrl, base);
  if (!key) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const meta = await headObject(key);
  const contentType = normalizeUploadContentType(
    meta?.contentType?.split(";")[0] ?? "",
  );
  if (
    !meta?.contentLength ||
    meta.contentLength > MAX_PROFILE_PHOTO_BYTES ||
    !isImageContentType(contentType)
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const object = await readObject(key);
  if (!object || object.body.byteLength > MAX_PROFILE_PHOTO_BYTES) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bytes = Buffer.from(object.body);
  const sniffed = isImageContentType(object.contentType)
    ? object.contentType
    : contentType;
  if (!hasImageMagicBytes(bytes, sniffed)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": sniffed,
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}