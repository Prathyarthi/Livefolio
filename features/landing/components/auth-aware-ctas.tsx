"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type AuthAwareCtasProps = {
  variant?: "candidate" | "recruiter";
  size?: "default" | "lg";
  className?: string;
  /**
   * Studio landing hero/footer CTAs — compact Mainline-like chrome,
   * sans type, optional arrows omitted. Does not change global Button.
   */
  studio?: boolean;
};

export function AuthAwareCtas({
  variant = "candidate",
  size = "lg",
  className,
  studio = false,
}: AuthAwareCtasProps) {
  const { status } = useSession();
  const authenticated = status === "authenticated";
  const studioBtn = studio ? "font-sans" : undefined;
  const showArrow = !studio;

  if (variant === "recruiter") {

    if (authenticated) {
      return (
        <div className={className ?? "flex flex-wrap items-center justify-center gap-3"}>
          <Button asChild variant="accent" size={size} className={studioBtn}>
            <Link href="/company">
              Open hiring workspace
              {showArrow ? <ArrowRight className="h-4 w-4" aria-hidden /> : null}
            </Link>
          </Button>
          <Button asChild variant="outline" size={size} className={studioBtn}>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      );
    }

    return (
      <div className={className ?? "flex flex-wrap items-center justify-center gap-3"}>
        <Button asChild variant="accent" size={size} className={studioBtn}>
          <Link href="/sign-up?callbackUrl=%2Fcompany">
            Start hiring — free
            {showArrow ? <ArrowRight className="h-4 w-4" aria-hidden /> : null}
          </Link>
        </Button>
        <Button asChild variant="outline" size={size} className={studioBtn}>
          <Link href="#ranked-shortlist">See a ranked shortlist</Link>
        </Button>
      </div>
    );
  }

  if (authenticated) {
    return (
      <div className={className ?? "flex flex-wrap items-center justify-center gap-3"}>
        <Button asChild variant="accent" size={size} className={studioBtn}>
          <Link href="/dashboard">
            Go to dashboard
            {showArrow ? <ArrowRight className="h-4 w-4" aria-hidden /> : null}
          </Link>
        </Button>
        <Button asChild variant="outline" size={size} className={studioBtn}>
          <Link href="#showcase">See examples</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={className ?? "flex flex-wrap items-center justify-center gap-3"}>
      <Button asChild variant="accent" size={size} className={studioBtn}>
        <Link href="/sign-up">
          Get started — it&apos;s free
          {showArrow ? <ArrowRight className="h-4 w-4" aria-hidden /> : null}
        </Link>
      </Button>
      <Button asChild variant="outline" size={size} className={studioBtn}>
        <Link href="#showcase">
          See examples
          {showArrow ? <ArrowRight className="h-4 w-4" aria-hidden /> : null}
        </Link>
      </Button>
    </div>
  );
}
