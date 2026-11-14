"use client";

import { useState } from "react";
import { Check, Copy, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TEAM_SIZES } from "@/lib/contact-sales";
import { ENTERPRISE_PLAN, enterpriseContactHref } from "@/lib/hiring-plans";
import { siteConfig } from "@/lib/site";

type Status = "idle" | "sending" | "sent";

/** Enterprise "Contact sales": a form that emails the team, with copy + mailto fallbacks. */
export function ContactSalesDialog({
  triggerClassName,
  size,
}: {
  triggerClassName?: string;
  size?: "default" | "sm";
}) {
  const email = siteConfig.supportEmail;
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [teamSize, setTeamSize] = useState<string>("");
  const [copied, setCopied] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    setStatus("sending");
    try {
      const res = await fetch("/api/contact-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          company: form.get("company"),
          teamSize,
          message: form.get("message") ?? "",
          website: form.get("website") ?? "",
        }),
      });
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(body?.error ?? `Couldn't send. Email ${email} directly.`);
      setStatus("sent");
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : `Couldn't send. Email ${email} directly.`);
    }
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setStatus("idle");
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size={size} className={triggerClassName}>
          {ENTERPRISE_PLAN.cta}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{status === "sent" ? "Thanks, we’ll be in touch" : "Talk to us about Enterprise"}</DialogTitle>
          <DialogDescription>
            {status === "sent"
              ? `We got your note and will reply from ${email}, usually within one working day.`
              : "Tell us a little about your team and we’ll scope seats, contract and onboarding with you."}
          </DialogDescription>
        </DialogHeader>

        {status === "sent" ? (
          <Button type="button" className="w-full" onClick={() => setOpen(false)}>
            Done
          </Button>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3" noValidate={false}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cs-name">Name</Label>
                <Input id="cs-name" name="name" required maxLength={100} autoComplete="name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cs-email">Work email</Label>
                <Input id="cs-email" name="email" type="email" required maxLength={200} autoComplete="email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cs-company">Company</Label>
                <Input id="cs-company" name="company" required maxLength={120} autoComplete="organization" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cs-team">Team size</Label>
                <Select value={teamSize} onValueChange={setTeamSize} required>
                  <SelectTrigger id="cs-team" className="w-full">
                    <SelectValue placeholder="Recruiters" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAM_SIZES.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cs-message">What do you need?</Label>
              <Textarea
                id="cs-message"
                name="message"
                rows={3}
                maxLength={2000}
                placeholder="Seats, SSO, invoicing, onboarding…"
              />
            </div>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
            {error ? <p className="text-body-sm text-danger" role="alert">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={status === "sending" || !teamSize}>
              {status === "sending" ? "Sending…" : "Send"}
            </Button>
          </form>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-border-default pt-3 text-body-sm text-text-secondary">
          <span>Or email</span>
          <span className="font-mono text-text-primary">{email}</span>
          <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={() => void copyEmail()}>
            {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button asChild variant="ghost" size="sm" className="h-7 px-2">
            <a href={enterpriseContactHref(email)}>
              <Mail className="h-3.5 w-3.5" aria-hidden />
              Open mail app
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
