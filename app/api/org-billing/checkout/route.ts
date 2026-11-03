import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Razorpay from "razorpay";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";
import {
  getOrgSeatPlanId,
  isOrgSeatCheckoutReady,
  parseBillingInterval,
} from "@/lib/billing";
import {
  getExpectedOrgSeatPlanDefinition,
  getSubscriptionTotalCount,
} from "@/lib/billing-lifecycle";
import {
  minSeatsFor,
  normalizeSeats,
  parsePaidHiringPlan,
  seatsUsed,
} from "@/lib/hiring-plans";
import { countSeatHolders } from "@/lib/org-entitlements";
import { enforceCheckoutRateLimit } from "@/lib/billing-rate-limit";
import { requireOrgAdmin } from "@/features/organization/lib/org-access";

type RazorpayFailure = {
  statusCode?: number;
  message?: string;
  error?: { code?: string; description?: string; reason?: string; field?: string };
};

function getCheckoutError(error: unknown) {
  const failure = error as RazorpayFailure;
  const message =
    failure.error?.description ||
    failure.message ||
    "Failed to create Razorpay subscription checkout.";
  const status =
    typeof failure.statusCode === "number" &&
    failure.statusCode >= 400 &&
    failure.statusCode < 500
      ? failure.statusCode
      : 500;
  return {
    status,
    message,
    code: failure.error?.code,
    reason: failure.error?.reason,
    field: failure.error?.field,
  };
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimitResponse = await enforceCheckoutRateLimit(session.user.id);
  if (rateLimitResponse) return rateLimitResponse;

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  let orgSlug = "";
  let requestedInterval: unknown = "monthly";
  let requestedPlan: unknown = "pro";
  let requestedSeats: unknown = undefined;
  try {
    const body = await req.json();
    orgSlug = typeof body?.orgSlug === "string" ? body.orgSlug.trim() : "";
    requestedInterval = body?.interval ?? "monthly";
    requestedPlan = body?.plan ?? "pro";
    requestedSeats = body?.seats;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!orgSlug) {
    return NextResponse.json({ error: "Organization is required." }, { status: 400 });
  }

  const interval = parseBillingInterval(requestedInterval);
  if (!interval) {
    return NextResponse.json({ error: "Invalid billing interval." }, { status: 400 });
  }

  const plan = parsePaidHiringPlan(requestedPlan);
  if (!plan) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }
  const seats = normalizeSeats(plan, requestedSeats);

  if (!isOrgSeatCheckoutReady(plan, interval)) {
    return NextResponse.json(
      {
        error:
          "Hiring billing is not fully configured for this plan and interval (missing key, webhook secret, or Razorpay plan).",
      },
      { status: 503 },
    );
  }

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: {
      id: true,
      slug: true,
      subscriptionStatus: true,
      subscriptionCancelAtPeriodEnd: true,
      subscriptionCurrentPeriodEnd: true,
      subscriptionPlan: true,
      subscriptionSeats: true,
    },
  });
  if (!org) {
    return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  }

  const membership = await requireOrgAdmin(org.id, session.user.id);
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Paid seats must cover everyone already holding a seat.
  const holders = await countSeatHolders(org.id);
  const used = seatsUsed(holders.activeMembers, holders.pendingInvites);
  if (seats < used) {
    return NextResponse.json(
      {
        error: `Your team already uses ${used} seat${used === 1 ? "" : "s"} (members and pending invites). Choose at least ${Math.max(used, minSeatsFor(plan))} seats.`,
        seatsUsed: used,
      },
      { status: 400 },
    );
  }

  const planId = getOrgSeatPlanId(plan, interval)!;
  let claimedAttemptId: string | null = null;
  let createdProviderSubscriptionId: string | null = null;

  try {
    const retainedAccessExpired =
      org.subscriptionStatus === "active" &&
      org.subscriptionCancelAtPeriodEnd &&
      org.subscriptionCurrentPeriodEnd !== null &&
      org.subscriptionCurrentPeriodEnd.getTime() <= Date.now();
    if (retainedAccessExpired) {
      await prisma.organization.update({
        where: { id: org.id },
        data: {
          subscriptionStatus: "none",
          razorpaySubscriptionId: null,
          subscriptionCancelAtPeriodEnd: false,
          subscriptionCurrentPeriodEnd: null,
        },
      });
    } else if (org.subscriptionStatus === "active") {
      return NextResponse.json(
        { error: "A hiring plan is already active. Change seats from Billing instead." },
        { status: 409 },
      );
    }
    if (org.subscriptionStatus === "pending") {
      return NextResponse.json(
        {
          error:
            "This workspace has a payment pending. Complete or recover that payment before starting another checkout.",
        },
        { status: 409 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const razorpay = new Razorpay({ key_id: keyId!, key_secret: keySecret! });

    const existingAttempt = await prisma.orgBillingCheckoutAttempt.findUnique({
      where: { organizationId: org.id },
    });
    if (existingAttempt?.providerSubscriptionId) {
      if (
        existingAttempt.interval !== interval ||
        (existingAttempt.plan ?? "pro") !== plan ||
        (existingAttempt.seats ?? 1) !== seats
      ) {
        return NextResponse.json(
          {
            error: `A ${existingAttempt.plan ?? "pro"} ${existingAttempt.interval} checkout for ${existingAttempt.seats ?? 1} seat(s) is already open. Dismiss it before changing plan, seats or interval.`,
            existingInterval: existingAttempt.interval,
          },
          { status: 409 },
        );
      }
      return NextResponse.json({
        keyId,
        subscriptionId: existingAttempt.providerSubscriptionId,
        email: user.email,
        interval: existingAttempt.interval,
        orgSlug: org.slug,
        reused: true,
      });
    }
    if (existingAttempt) {
      const released = await prisma.orgBillingCheckoutAttempt.deleteMany({
        where: {
          id: existingAttempt.id,
          providerSubscriptionId: null,
          status: "creating",
          updatedAt: { lt: new Date(Date.now() - 2 * 60 * 1000) },
        },
      });
      if (released.count === 0) {
        return NextResponse.json(
          { error: "Checkout is already being created. Please try again." },
          { status: 409 },
        );
      }
    }

    const providerPlan = (await razorpay.plans.fetch(planId)) as {
      period?: string;
      interval?: number;
      item?: { amount?: number; currency?: string };
    };
    const expectedPlan = getExpectedOrgSeatPlanDefinition(plan, interval);
    if (
      providerPlan.period !== expectedPlan.period ||
      providerPlan.interval !== expectedPlan.interval ||
      providerPlan.item?.amount !== expectedPlan.amount ||
      providerPlan.item?.currency !== expectedPlan.currency
    ) {
      return NextResponse.json(
        {
          error:
            "Configured Razorpay plan does not match the advertised per-seat price or billing interval.",
        },
        { status: 503 },
      );
    }

    let checkoutAttempt;
    try {
      checkoutAttempt = await prisma.orgBillingCheckoutAttempt.create({
        data: {
          organizationId: org.id,
          userId: session.user.id,
          providerPlanId: planId,
          interval,
          plan,
          seats,
          status: "creating",
        },
      });
      claimedAttemptId = checkoutAttempt.id;
    } catch {
      const concurrent = await prisma.orgBillingCheckoutAttempt.findUnique({
        where: { organizationId: org.id },
      });
      if (concurrent?.providerSubscriptionId) {
        return NextResponse.json({
          keyId,
          subscriptionId: concurrent.providerSubscriptionId,
          email: user.email,
          interval: concurrent.interval,
          orgSlug: org.slug,
          reused: true,
        });
      }
      return NextResponse.json(
        { error: "Checkout is already being created. Please try again." },
        { status: 409 },
      );
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      quantity: seats,
      customer_notify: 1,
      total_count: getSubscriptionTotalCount(interval),
      notes: {
        userId: session.user.id,
        organizationId: org.id,
        orgSlug: org.slug,
        plan,
        seats: String(seats),
        interval,
      },
    });
    createdProviderSubscriptionId = subscription.id;

    const claimed = await prisma.$transaction(async (tx) => {
      const updated = await tx.organization.updateMany({
        where: {
          id: org.id,
          subscriptionStatus: { not: "active" },
        },
        data: {
          subscriptionStatus: "none",
          razorpaySubscriptionId: subscription.id,
          subscriptionCancelAtPeriodEnd: false,
          subscriptionCurrentPeriodEnd: null,
          // Applied once the subscription activates (status gates entitlements).
          subscriptionPlan: plan,
          subscriptionSeats: seats,
        },
      });
      if (updated.count === 0) return false;

      await tx.billingSubscription.create({
        data: {
          userId: session.user.id,
          organizationId: org.id,
          providerSubscriptionId: subscription.id,
          providerPlanId: planId,
          interval,
          status: "created",
        },
      });
      await tx.orgBillingCheckoutAttempt.update({
        where: { id: checkoutAttempt.id },
        data: {
          providerSubscriptionId: subscription.id,
          status: "open",
        },
      });
      return true;
    });

    if (!claimed) {
      try {
        await razorpay.subscriptions.cancel(subscription.id, false);
      } catch {
        // ignore
      }
      await prisma.orgBillingCheckoutAttempt.deleteMany({
        where: { id: checkoutAttempt.id },
      });
      return NextResponse.json(
        { error: "A hiring plan is already active. Change seats from Billing instead." },
        { status: 409 },
      );
    }

    return NextResponse.json({
      keyId,
      subscriptionId: subscription.id,
      email: user.email,
      interval,
      plan,
      seats,
      orgSlug: org.slug,
    });
  } catch (error) {
    if (createdProviderSubscriptionId) {
      try {
        const razorpay = new Razorpay({ key_id: keyId!, key_secret: keySecret! });
        await razorpay.subscriptions.cancel(createdProviderSubscriptionId, false);
      } catch {
        // ignore
      }
    }
    if (claimedAttemptId) {
      await prisma.orgBillingCheckoutAttempt
        .deleteMany({ where: { id: claimedAttemptId } })
        .catch(() => undefined);
    }
    const checkoutError = getCheckoutError(error);
    console.error("[org-billing.checkout] failed", {
      status: checkoutError.status,
      message: checkoutError.message,
      userId: session.user.id,
      orgSlug,
      interval,
    });
    return NextResponse.json(
      {
        error: checkoutError.message,
        code: checkoutError.code,
        reason: checkoutError.reason,
        field: checkoutError.field,
      },
      { status: checkoutError.status },
    );
  }
}
