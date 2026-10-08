import Link from "next/link";
import { ArrowRight, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { siteConfig } from "@/lib/site";

export function ContactSection() {
  return (
    <section id="contact" className="scroll-mt-16 px-6 py-[var(--space-9)]">
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow uppercase">Contact</p>
          <h2 className="mt-3 text-h1 text-text-primary">We&apos;re here to help</h2>
          <p className="prose-measure mx-auto mt-4 text-body text-text-secondary">
            Questions about templates, imports, billing, or publishing? Reach
            out and we&apos;ll get back to you as soon as we can.
          </p>
        </div>

        <div
          className="mt-[var(--space-6)] grid gap-[var(--space-5)]"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          }}
        >
          <Card className="relative gap-0 overflow-hidden p-[var(--space-5)]">
            <div className="absolute inset-x-0 top-0 h-1 bg-brand-fill" aria-hidden />
            <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-brand-fill/12">
              <Mail className="h-6 w-6 text-brand-secondary" aria-hidden />
            </span>
            <h3 className="mt-5 text-h3 text-text-primary">Email support</h3>
            <p className="mt-2 text-body-sm text-text-secondary">
              Best for account, billing, and product questions — include your
              account email and a short description of the issue.
            </p>
            <Button asChild className="mt-5 w-fit">
              <a href={`mailto:${siteConfig.supportEmail}`}>
                Email {siteConfig.supportEmail}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            </Button>
          </Card>

          <Card className="gap-0 p-[var(--space-5)]">
            <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-brand-fill/12">
              <MessageCircle className="h-6 w-6 text-brand-secondary" aria-hidden />
            </span>
            <h3 className="mt-5 text-h3 text-text-primary">Help center</h3>
            <p className="mt-2 text-body-sm text-text-secondary">
              Browse common topics, billing guidance, and ways to get started.
            </p>
            <Button asChild variant="outline" className="mt-5 w-fit">
              <Link href="/contact">
                Visit contact page
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </Card>
        </div>
      </div>
    </section>
  );
}
