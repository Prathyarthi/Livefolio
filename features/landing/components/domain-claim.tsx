"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { clearClaimedSlug, saveClaimedSlug } from "@/lib/claim-slug";
import { getPortfolioRootDomain, sanitizePortfolioSlug } from "@/lib/domain";

const MIN_WAIT_MS = 1200;

export function DomainClaim() {
  const router = useRouter();
  const { status } = useSession();
  const rootDomain = getPortfolioRootDomain();
  const suffix = rootDomain === "localhost" ? "livefolio.me" : rootDomain;
  const [value, setValue] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"muted" | "danger">("muted");
  const [pending, setPending] = useState(false);
  const [readySlug, setReadySlug] = useState<string | null>(null);
  const [mountedAt] = useState(() => Date.now());

  async function claimSlug(slug: string) {
    saveClaimedSlug(slug);

    if (status === "authenticated") {
      const portfolioRes = await fetch("/api/portfolio", { cache: "no-store" });
      if (portfolioRes.ok) {
        const portfolio = (await portfolioRes.json()) as { slug?: string | null };
        if (portfolio.slug) {
          clearClaimedSlug();
          setReadySlug(null);
          setTone("muted");
          setMessage("You already have a Livefolio link.");
          return;
        }
        const saved = await fetch("/api/portfolio/slug", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        });
        if (!saved.ok) {
          clearClaimedSlug();
          setReadySlug(null);
          setTone("danger");
          setMessage("That name was just taken. Try another.");
          return;
        }
      }
      router.push("/dashboard");
      return;
    }

    router.push(`/sign-up?callbackUrl=${encodeURIComponent("/dashboard")}`);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    if (Date.now() - mountedAt < MIN_WAIT_MS) {
      setTone("muted");
      setMessage("One moment, then you can check it.");
      return;
    }

    const slug = sanitizePortfolioSlug(value);
    if (slug.length < 3) {
      setReadySlug(null);
      setTone("danger");
      setMessage("Use at least 3 letters or numbers.");
      return;
    }

    if (readySlug === slug) {
      setPending(true);
      try {
        await claimSlug(slug);
      } catch {
        setTone("danger");
        setMessage("Couldn't claim that name. Try again.");
      } finally {
        setPending(false);
      }
      return;
    }

    setPending(true);
    setReadySlug(null);
    setMessage(null);

    try {
      const res = await fetch("/api/portfolio/slug/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, companyWebsite: honeypot }),
      });
      const data = (await res.json().catch(() => null)) as {
        available?: boolean;
        reason?: string;
        slug?: string;
        error?: string;
      } | null;

      if (res.status === 429) {
        setTone("danger");
        setMessage(data?.error ?? "Too many attempts. Try again in a little while.");
        return;
      }

      if (!res.ok || !data?.slug) {
        setTone("danger");
        setMessage("Use 3–30 letters, numbers, or hyphens.");
        return;
      }

      if (!data.available) {
        setTone("danger");
        setMessage(
          data.reason === "taken"
            ? "That name is already taken."
            : "That name isn't available.",
        );
        return;
      }

      setReadySlug(data.slug);
      setTone("muted");
      setMessage(`${data.slug}.${suffix} is available.`);
    } catch {
      setTone("danger");
      setMessage("Couldn't check that name. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-label="Claim your link" className="px-4 pb-2 sm:px-6">
      <div className="px-4 py-6 sm:py-8">
        <form
          onSubmit={onSubmit}
          className="mx-auto flex w-full max-w-[20rem] items-center gap-2 rounded-full border border-border-default bg-white p-1.5 shadow-[0_10px_30px_rgba(26,24,40,0.08)] sm:w-max sm:max-w-none dark:bg-[#1c1b19]"
        >
          <label htmlFor="claim-slug" className="sr-only">
            Portfolio name
          </label>
          <input
            id="claim-slug"
            name="slug"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setReadySlug(null);
              if (message) setMessage(null);
            }}
            placeholder="yourname"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={40}
            required
            className="min-w-0 flex-1 bg-transparent px-4 text-[15px] text-text-primary outline-none placeholder:text-text-muted sm:w-[8.5rem] sm:flex-none"
          />
          <span className="hidden shrink-0 text-[15px] text-text-muted sm:inline">
            .{suffix}
          </span>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-black px-5 text-[15px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : readySlug ? (
              "Claim"
            ) : (
              "Check"
            )}
          </button>
          <input
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            value={honeypot}
            onChange={(event) => setHoneypot(event.target.value)}
            name="companyWebsite"
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
          />
        </form>
        <p className="mt-3 text-center text-[13px] text-text-muted sm:hidden">
          .{suffix}
        </p>
        <p
          className={`mt-4 text-center text-[14px] ${tone === "danger" ? "text-danger" : "text-text-secondary"}`}
          role={tone === "danger" ? "alert" : undefined}
        >
          {message ?? "Claim your link before it's taken"}
        </p>
      </div>
    </section>
  );
}
