import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Razorpay from "razorpay";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";
import { areRazorpayKeysConfigured } from "@/lib/billing";
import { requireOrgAdmin } from "@/features/organization/lib/org-access";
import { enforceCheckoutRateLimit } from "@/lib/billing-rate-limit";
import {
  minSeatsFor,
  normalizeSeats,
  parsePaidHiringPlan,
  seatsUsed,
} from "@/lib/hiring-plans";
import {
  countSeatHolders,
  ORG_BILLING_SELECT,
  orgPlanTier,
} from "@/lib/org-entitlements";

/**
 * Change the seat count on an active per-seat plan.
 * Adding seats applies now; removing seats applies on Razorpay at the end of the
 * current cycle, while the in-app seat cap drops immediately.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rateLimitResponse = await enforceCheckoutRateLimit(session.user.id);
  if (rateLimitResponse) return rateLimitResponse;

  let orgSlug = "";
  let requestedSeats: unknown;
  try {
    const body = await req.json();
    orgSlug = typeof body?.orgSlug === "string" ? body.orgSlug.trim() : "";
    requestedSeats = body?.seats;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }
  if (!orgSlug) {
    return NextResponse.json({ error: "Organization is required." }, { status: 400 });
  }

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { ...ORG_BILLING_SELECT, razorpaySubscriptionId: true },
  });
  if (!org) {
    return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  }
  const membership = await requireOrgAdmin(org.id, session.user.id);
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tier = orgPlanTier(org);
  const plan = parsePaidHiringPlan(tier);
  if (!plan || !org.razorpaySubscriptionId) {
    return NextResponse.json(
      { error: "Seats can be changed on an active Pro or Business plan." },
      { status: 409 },
    );
  }
  if (org.subscriptionCancelAtPeriodEnd) {
    return NextResponse.json(
      { error: "This plan is set to cancel. Resume it before changing seats." },
      { status: 409 },
    );
  }

  const seats = normalizeSeats(plan, requestedSeats);
  const current = org.subscriptionSeats ?? minSeatsFor(plan);
  if (seats === current) {
    return NextResponse.json({ seats, unchanged: true });
  }
  const holders = await countSeatHolders(org.id);
  const used = seatsUsed(holders.activeMembers, holders.pendingInvites);
  if (seats < used) {
    return NextResponse.json(
      {
        error: `${used} seats are in use (members and pending invites). Remove a member or revoke an invite first.`,
        seatsUsed: used,
      },
      { status: 400 },
    );
  }

  if (!areRazorpayKeysConfigured()) {
    return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  }
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
  const increasing = seats > current;
  try {
    await razorpay.subscriptions.update(org.razorpaySubscriptionId, {
      quantity: seats,
      schedule_change_at: increasing ? "now" : "cycle_end",
    });
  } catch (error) {
    const failure = error as { error?: { description?: string }; message?: string };
    console.error("[org-billing.seats] update failed", { orgSlug, seats });
    return NextResponse.json(
      {
        error:
          failure.error?.description ||
          failure.message ||
          "Could not update seats with the payment provider.",
      },
      { status: 502 },
    );
  }

  await prisma.organization.update({
    where: { id: org.id },
    data: { subscriptionSeats: seats },
  });

  return NextResponse.json({
    seats,
    effective: increasing ? "now" : "cycle_end",
  });
}
