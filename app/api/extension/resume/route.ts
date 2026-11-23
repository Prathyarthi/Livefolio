import { loadExtensionResume } from "@/lib/load-extension-profile";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    return await loadExtensionResume(request);
  } catch (error) {
    console.error("[GET /api/extension/resume] error", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
