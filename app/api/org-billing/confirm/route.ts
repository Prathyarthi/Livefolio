import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Razorpay from "razorpay";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";
import { getIntervalForPlanId } from "@/lib/billing-lifecycle";
import { requireOrgAdmin } from "@/features/organization/lib/org-access";

type ConfirmBody = {
  orgSlug?: string;
  razorpay_payment_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature?: string;
};

function verifySubscriptionPaymentSignature(
  paymentId: string,
  subscriptionId: string,
  signature: string,
  secret: string,
) {
  const expected = createHmac("sha256", secret)
    .update(`${paymentId}|${subscriptionId}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

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

  let body: ConfirmBody;
  try {
    body = (await req.json()) as ConfirmBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const orgSlug = body.orgSlug?.trim();
  const paymentId = body.razorpay_payment_id?.trim();
  const subscriptionId = body.razorpay_subscription_id?.trim();
  const signature = body.razorpay_signature?.trim();

  if (!orgSlug || !paymentId || !subscriptionId || !signature) {
    return NextResponse.json(
      { error: "Missing payment verification fields." },
      { status: 400 },
    );
  }

  if (
    !verifySubscriptionPaymentSignature(
      paymentId,
      subscriptionId,
      signature,
      keySecret,
    )
  ) {
    return NextResponse.json({ error: "Invalid payment signature." }, { status: 401 });
  }

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true, razorpaySubscriptionId: true },
  });
  if (!org) {
    return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  }

  const membership = await requireOrgAdmin(org.id, session.user.id);
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (org.razorpaySubscriptionId !== subscriptionId) {
    return NextResponse.json(
      { error: "Subscription does not match the current checkout." },
      { status: 400 },
    );
  }

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

  let currentPeriodEnd: Date | null = null;
  let providerPlanId: string;
  let interval;
  try {
    const subscription = (await razorpay.subscriptions.fetch(subscriptionId)) as {
      status?: string;
      notes?: Record<string, string | undefined>;
      plan_id?: string;
      current_end?: number;
    };
    const subscriptionStatus = (subscription.status ?? "").toLowerCase();

    if (
      subscription.notes?.organizationId !== org.id &&
      subscription.notes?.orgSlug !== orgSlug
    ) {
      return NextResponse.json(
        { error: "Subscription does not belong to this organization." },
        { status: 403 },
      );
    }

    if (subscriptionStatus !== "active") {
      return NextResponse.json(
        { error: "Subscription payment is not active yet." },
        { status: 409 },
      );
    }

    providerPlanId = subscription.plan_id ?? "";
    interval = getIntervalForPlanId(providerPlanId);
    if (!interval) {
      return NextResponse.json(
        { error: "Subscription is not linked to a configured Org Pro plan." },
        { status: 403 },
      );
    }

    const payment = (await razorpay.payments.fetch(paymentId)) as {
      status?: string;
    };
    if ((payment.status ?? "").toLowerCase() !== "captured") {
      return NextResponse.json(
        { error: "Payment has not been captured." },
        { status: 409 },
      );
    }

    currentPeriodEnd =
      typeof subscription.current_end === "number"
        ? new Date(subscription.current_end * 1000)
        : null;
  } catch (error) {
    console.error("[org-billing.confirm] subscription fetch failed", {
      error,
      userId: session.user.id,
      organizationId: org.id,
      subscriptionId,
    });
    return NextResponse.json(
      { error: "Could not verify subscription status." },
      { status: 502 },
    );
  }

  await prisma.$transaction(async (tx) => {
    const billingSubscription = await tx.billingSubscription.upsert({
      where: { providerSubscriptionId: subscriptionId },
      create: {
        userId: session.user.id,
        organizationId: org.id,
        providerSubscriptionId: subscriptionId,
        providerPlanId,
        interval,
        status: "active",
        currentPeriodEnd,
      },
      update: {
        organizationId: org.id,
        providerPlanId,
        interval,
        status: "active",
        currentPeriodEnd,
      },
    });
    if (
      billingSubscription.organizationId &&
      billingSubscription.organizationId !== org.id
    ) {
      throw new Error("Subscription ownership mismatch.");
    }

    await tx.billingPayment.upsert({
      where: { providerPaymentId: paymentId },
      create: {
        providerPaymentId: paymentId,
        userId: session.user.id,
        billingSubscriptionId: billingSubscription.id,
        providerSubscriptionId: subscriptionId,
        status: "captured",
      },
      update: { status: "captured" },
    });
    await tx.organization.update({
      where: { id: org.id },
      data: {
        subscriptionStatus: "active",
        razorpaySubscriptionId: subscriptionId,
        subscriptionCancelAtPeriodEnd: false,
        subscriptionCurrentPeriodEnd: currentPeriodEnd,
      },
    });
    await tx.orgBillingCheckoutAttempt.deleteMany({
      where: {
        organizationId: org.id,
        providerSubscriptionId: subscriptionId,
      },
    });
  });

  return NextResponse.json({ ok: true, status: "active" });
}