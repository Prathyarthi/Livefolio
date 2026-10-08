"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/logo";
import { isHiringCallback, safeCallbackPath } from "@/lib/auth-callback";

export function AuthHomeLogo() {
  const searchParams = useSearchParams();
  const callback = safeCallbackPath(searchParams.get("callbackUrl"));
  return <Logo href={isHiringCallback(callback) ? "/recruiters" : "/"} />;
}
