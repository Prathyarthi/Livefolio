"use client";

import { useSearchParams } from "next/navigation";
import {
  isHiringCallback,
  safeCallbackPath,
} from "@/lib/auth-callback";

export function useAuthCallback() {
  const searchParams = useSearchParams();
  const callbackUrl =
    safeCallbackPath(searchParams.get("callbackUrl")) ?? "/dashboard";
  const hiring = isHiringCallback(callbackUrl);

  function withCallback(path: "/sign-in" | "/sign-up") {
    if (callbackUrl === "/dashboard") return path;
    return `${path}?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  }

  return { callbackUrl, hiring, withCallback };
}
