import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { handleContactSales } from "@/lib/contact-sales";
import { siteConfig } from "@/lib/site";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const result = await handleContactSales(body, {
    to: siteConfig.supportEmail,
    send: sendEmail,
    // Set CONTACT_SALES_DRY_RUN=1 to validate without sending (local testing).
    dryRun: process.env.CONTACT_SALES_DRY_RUN === "1",
  });
  return NextResponse.json(result.body, { status: result.status });
}
