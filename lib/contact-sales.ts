import { z } from "zod";
import type { SendEmailInput, SendEmailResult } from "@/lib/email";

export const TEAM_SIZES = ["1-5", "6-20", "21-50", "51-200", "200+"] as const;

export const contactSalesSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid work email").max(200),
  company: z.string().trim().min(1, "Enter your company").max(120),
  teamSize: z.enum(TEAM_SIZES, { message: "Pick a team size" }),
  message: z.string().trim().max(2000).optional().default(""),
  /** Honeypot: real users never fill this. */
  website: z.string().max(0).optional(),
});

export type ContactSalesInput = z.infer<typeof contactSalesSchema>;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildContactSalesEmail(input: ContactSalesInput, to: string): SendEmailInput {
  const rows: [string, string][] = [
    ["Name", input.name],
    ["Work email", input.email],
    ["Company", input.company],
    ["Team size", input.teamSize],
  ];
  const html = `<h2>Enterprise enquiry</h2><table>${rows
    .map(([k, v]) => `<tr><td><strong>${k}</strong></td><td>${escapeHtml(v)}</td></tr>`)
    .join("")}</table>${
    input.message ? `<p><strong>Message</strong></p><p>${escapeHtml(input.message).replace(/\n/g, "<br>")}</p>` : ""
  }`;
  return {
    to,
    subject: `Enterprise enquiry: ${input.company.slice(0, 80)} (${input.teamSize})`,
    html,
    tags: [{ name: "type", value: "contact_sales" }],
  };
}

export type ContactSalesResult = { status: number; body: { ok: true; dryRun?: boolean } | { error: string } };

/** Validates and sends. `send` is injected so tests (and dry runs) never send real email. */
export async function handleContactSales(
  raw: unknown,
  deps: { to: string; send: (input: SendEmailInput) => Promise<SendEmailResult>; dryRun?: boolean },
): Promise<ContactSalesResult> {
  const parsed = contactSalesSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 400, body: { error: parsed.error.issues[0]?.message ?? "Invalid request" } };
  }
  // Honeypot filled: pretend success, send nothing.
  if (parsed.data.website) return { status: 200, body: { ok: true } };
  if (deps.dryRun) return { status: 200, body: { ok: true, dryRun: true } };
  const result = await deps.send(buildContactSalesEmail(parsed.data, deps.to));
  if (result.error) {
    return { status: 502, body: { error: `We couldn't send that. Email ${deps.to} directly.` } };
  }
  return { status: 200, body: { ok: true } };
}
