import { NextResponse } from "next/server";
import { loadExtensionProfile } from "@/lib/load-extension-profile";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const result = await loadExtensionProfile(request);
    return NextResponse.json(result.body, {
      status: result.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[GET /api/extension/profile] error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
