import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Razorpay from "razorpay";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";
import { requireOrgAdmin } from "@/features/organization/lib/org-access";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json(
      { error: "Razorpay is not configured." },
      { status: 503 },
    );
  }

  let orgSlug = "";
  try {
    const body = await req.json();
    orgSlug = typeof body?.orgSlug === "string" ? body.orgSlug.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!orgSlug) {
    return NextResponse.json({ error: "Organization is required." }, { status: 400 });
  }

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: {
      id: true,
      razorpaySubscriptionId: true,
      subscriptionStatus: true,
      subscriptionCancelAtPeriodEnd: true,
      subscriptionCurrentPeriodEnd: true,
    },
  });
  if (!org) {
    return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  }

  const membership = await requireOrgAdmin(org.id, session.user.id);
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!org.razorpaySubscriptionId) {
    return NextResponse.json(
      { error: "No active subscription found." },
      { status: 404 },
    );
  }

  if (org.subscriptionStatus !== "active") {
    return NextResponse.json(
      { error: "Subscription is not active." },
      { status: 400 },
    );
  }

  const providerSubscriptionId = org.razorpaySubscriptionId;

  if (org.subscriptionCancelAtPeriodEnd) {
    return NextResponse.json({
      ok: true,
      cancelAtPeriodEnd: true,
      currentPeriodEnd: org.subscriptionCurrentPeriodEnd?.toISOString() ?? null,
    });
  }

  try {
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const subscription = (await razorpay.subscriptions.cancel(
      providerSubscriptionId,
      false,
    )) as { current_end?: number };
    const currentPeriodEnd =
      typeof subscription.current_end === "number"
        ? new Date(subscription.current_end * 1000)
        : org.subscriptionCurrentPeriodEnd;

    await prisma.$transaction(async (tx) => {
      await tx.organization.update({
        where: { id: org.id },
        data: {
          subscriptionCancelAtPeriodEnd: true,
          subscriptionCurrentPeriodEnd: currentPeriodEnd,
        },
      });
      await tx.billingSubscription.updateMany({
        where: {
          organizationId: org.id,
          providerSubscriptionId,
        },
        data: {
          cancelAtPeriodEnd: true,
          currentPeriodEnd,
        },
      });
    });

    return NextResponse.json({
      ok: true,
      cancelAtPeriodEnd: true,
      currentPeriodEnd: currentPeriodEnd?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("[org-billing.cancel] failed", { error, orgSlug });
    return NextResponse.json(
      { error: "Could not cancel subscription." },
      { status: 502 },
    );
  }
}
