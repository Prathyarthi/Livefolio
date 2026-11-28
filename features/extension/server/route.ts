import { Elysia } from "elysia";
import {
  loadExtensionProfile,
  loadExtensionResume,
} from "@/lib/load-extension-profile";

export const extensionProfile = new Elysia({ prefix: "/extension" })
  .get("/profile", async (ctx) => {
    try {
      const result = await loadExtensionProfile(ctx.request);
      ctx.set.status = result.status;
      ctx.set.headers["cache-control"] = "no-store";
      return result.body;
    } catch (error) {
      console.error("[GET /api/extension/profile] error", error);
      ctx.set.status = 500;
      return { error: "Internal server error" };
    }
  })
  .get("/resume", async (ctx) => {
    try {
      return await loadExtensionResume(ctx.request);
    } catch (error) {
      console.error("[GET /api/extension/resume] error", error);
      ctx.set.status = 500;
      return { error: "Internal server error" };
    }
  });
