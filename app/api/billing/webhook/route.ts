import { createHash, createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  canApplySubscriptionTransition,
  getIntervalForPlanId,
  isTerminalProviderStatus,
  legacyStatusForProvider,
  parseProviderSubscriptionStatus,
  type ProviderSubscriptionStatus,
} from "@/lib/billing-lifecycle";

type RazorpayWebhookPayload = {
  event?: string;
  created_at?: number;
  payload?: {
    subscription?: {
      entity?: {
        id?: string;
        status?: string;
        plan_id?: string;
        notes?: Record<string, string | undefined>;
        current_end?: number;
        has_scheduled_changes?: boolean;
      };
    };
    payment?: {
      entity?: {
        id?: string;
        status?: string;
        subscription_id?: string;
        notes?: Record<string, string | undefined>;
      };
    };
  };
};

function verifySignature(rawBody: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

function getUserIdFromPayload(payload: RazorpayWebhookPayload): string | null {
  const fromSubscription = payload.payload?.subscription?.entity?.notes?.userId;
  if (fromSubscription) return fromSubscription;

  const fromPayment = payload.payload?.payment?.entity?.notes?.userId;
  return fromPayment ?? null;
}

function getOrganizationIdFromPayload(
  payload: RazorpayWebhookPayload,
): string | null {
  const fromSubscription =
    payload.payload?.subscription?.entity?.notes?.organizationId;
  if (fromSubscription) return fromSubscription;

  const fromPayment = payload.payload?.payment?.entity?.notes?.organizationId;
  return fromPayment ?? null;
}

function statusFromEvent(
  event: string | undefined,
  entityStatus: unknown
): ProviderSubscriptionStatus | null {
  const parsed = parseProviderSubscriptionStatus(entityStatus);
  if (parsed) return parsed;

  switch (event) {
    case "subscription.authenticated":
      return "authenticated";
    case "subscription.activated":
    case "subscription.charged":
    case "subscription.resumed":
      return "active";
    case "subscription.pending":
      return "pending";
    case "subscription.halted":
      return "halted";
    case "subscription.cancelled":
      return "cancelled";
    case "subscription.paused":
      return "paused";
    case "subscription.completed":
      return "completed";
    default:
      return null;
  }
}

export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook secret is not configured." },
      { status: 503 }
    );
  }

  const signature = req.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const rawBody = await req.text();
  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let body: RazorpayWebhookPayload;
  try {
    body = JSON.parse(rawBody) as RazorpayWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const subscriptionId = body.payload?.subscription?.entity?.id;
  const subscriptionEntity = body.payload?.subscription?.entity;
  const providerEventId =
    req.headers.get("x-razorpay-event-id") ??
    createHash("sha256").update(rawBody).digest("hex");
  const occurredAt =
    typeof body.created_at === "number"
      ? new Date(body.created_at * 1000)
      : new Date();
  let userId = getUserIdFromPayload(body);
  let organizationId = getOrganizationIdFromPayload(body);

  if (!organizationId && subscriptionId) {
    const existingOrgSub = await prisma.billingSubscription.findUnique({
      where: { providerSubscriptionId: subscriptionId },
      select: { organizationId: true, userId: true },
    });
    if (existingOrgSub?.organizationId) {
      organizationId = existingOrgSub.organizationId;
      userId = userId ?? existingOrgSub.userId;
    } else {
      const org = await prisma.organization.findFirst({
        where: { razorpaySubscriptionId: subscriptionId },
        select: { id: true },
      });
      organizationId = org?.id ?? null;
    }
  }

  if (!userId && subscriptionId) {
    const user = await prisma.user.findFirst({
      where: { razorpaySubscriptionId: subscriptionId },
      select: { id: true },
    });
    userId = user?.id ?? null;
  }

  if (!userId && !organizationId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const providerStatus = statusFromEvent(
    body.event,
    subscriptionEntity?.status
  );
  if (!providerStatus || !subscriptionId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const currentPeriodEnd =
    typeof subscriptionEntity?.current_end === "number"
      ? new Date(subscriptionEntity.current_end * 1000)
      : null;

  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.billingWebhookEvent.create({
        data: {
          providerEventId,
          eventType: body.event ?? "unknown",
          providerSubscriptionId: subscriptionId,
          occurredAt,
        },
      });

      const existingSubscription =
        await tx.billingSubscription.findUnique({
          where: { providerSubscriptionId: subscriptionId },
        });
      const resolvedOrganizationId =
        organizationId ?? existingSubscription?.organizationId ?? null;
      const resolvedUserId = userId ?? existingSubscription?.userId;
      if (!resolvedUserId) return "ignored";

      if (resolvedOrganizationId) {
        const targetOrg = await tx.organization.findUnique({
          where: { id: resolvedOrganizationId },
          select: { id: true },
        });
        if (!targetOrg) return "ignored";
      } else {
        const targetUser = await tx.user.findUnique({
          where: { id: resolvedUserId },
          select: { id: true },
        });
        if (!targetUser) return "ignored";
      }

      const providerPlanId =
        subscriptionEntity?.plan_id ??
        existingSubscription?.providerPlanId ??
        "unknown";
      const configuredInterval = getIntervalForPlanId(providerPlanId);
      if (
        existingSubscription &&
        existingSubscription.userId !== resolvedUserId
      ) {
        return "ownership-mismatch";
      }
      if (
        existingSubscription?.organizationId &&
        resolvedOrganizationId &&
        existingSubscription.organizationId !== resolvedOrganizationId
      ) {
        return "ownership-mismatch";
      }
      if (
        existingSubscription?.lastEventAt &&
        occurredAt < existingSubscription.lastEventAt
      ) {
        return "stale";
      }
      if (
        existingSubscription &&
        !canApplySubscriptionTransition(
          existingSubscription.status,
          providerStatus
        )
      ) {
        return "invalid-transition";
      }
      // Preserve an app-confirmed cancellation so terminal provider events do
      // not erase the customer's remaining paid-access window.
      const cancelAtPeriodEnd =
        existingSubscription?.cancelAtPeriodEnd === true ||
        subscriptionEntity?.has_scheduled_changes === true;

      const billingSubscription =
        await tx.billingSubscription.upsert({
          where: { providerSubscriptionId: subscriptionId },
          create: {
            userId: resolvedUserId,
            organizationId: resolvedOrganizationId,
            providerSubscriptionId: subscriptionId,
            providerPlanId,
            interval:
              configuredInterval ??
              subscriptionEntity?.notes?.interval ??
              "unknown",
            status: providerStatus,
            cancelAtPeriodEnd,
            currentPeriodEnd,
            lastEventAt: occurredAt,
            lastEventId: providerEventId,
          },
          update: {
            ...(resolvedOrganizationId && {
              organizationId: resolvedOrganizationId,
            }),
            providerPlanId,
            ...(configuredInterval && { interval: configuredInterval }),
            status: providerStatus,
            cancelAtPeriodEnd,
            ...(currentPeriodEnd && { currentPeriodEnd }),
            lastEventAt: occurredAt,
            lastEventId: providerEventId,
          },
        });

      const paymentEntity = body.payload?.payment?.entity;
      if (paymentEntity?.id) {
        await tx.billingPayment.upsert({
          where: { providerPaymentId: paymentEntity.id },
          create: {
            providerPaymentId: paymentEntity.id,
            userId: resolvedUserId,
            billingSubscriptionId: billingSubscription.id,
            providerSubscriptionId: subscriptionId,
            status: paymentEntity.status ?? "unknown",
          },
          update: {
            status: paymentEntity.status ?? "unknown",
          },
        });
      }

      if (resolvedOrganizationId) {
        const currentOrg = await tx.organization.findUnique({
          where: { id: resolvedOrganizationId },
          select: {
            razorpaySubscriptionId: true,
            subscriptionCancelAtPeriodEnd: true,
            subscriptionCurrentPeriodEnd: true,
          },
        });
        const isCurrent =
          currentOrg?.razorpaySubscriptionId === subscriptionId;
        const canRecoverCurrent =
          !currentOrg?.razorpaySubscriptionId &&
          providerStatus === "active" &&
          configuredInterval !== null;
        if (!isCurrent && !canRecoverCurrent) return "recorded";

        const terminal = isTerminalProviderStatus(providerStatus);
        const paidThrough =
          currentPeriodEnd ??
          billingSubscription.currentPeriodEnd ??
          currentOrg?.subscriptionCurrentPeriodEnd ??
          null;
        const retainPaidAccess =
          terminal &&
          (currentOrg?.subscriptionCancelAtPeriodEnd === true ||
            billingSubscription.cancelAtPeriodEnd) &&
          paidThrough !== null &&
          paidThrough.getTime() > Date.now();
        await tx.organization.update({
          where: { id: resolvedOrganizationId },
          data: terminal && !retainPaidAccess
            ? {
                subscriptionStatus: "none",
                razorpaySubscriptionId: null,
                subscriptionCancelAtPeriodEnd: false,
                subscriptionCurrentPeriodEnd: null,
              }
            : {
                subscriptionStatus: retainPaidAccess
                  ? "active"
                  : configuredInterval || providerStatus !== "active"
                    ? legacyStatusForProvider(providerStatus)
                    : "none",
                razorpaySubscriptionId:
                  configuredInterval || providerStatus !== "active"
                    ? billingSubscription.providerSubscriptionId
                    : null,
                subscriptionCancelAtPeriodEnd: retainPaidAccess
                  ? true
                  : billingSubscription.cancelAtPeriodEnd,
                ...(paidThrough && {
                  subscriptionCurrentPeriodEnd: paidThrough,
                }),
              },
        });

        if (
          providerStatus === "active" ||
          isTerminalProviderStatus(providerStatus)
        ) {
          await tx.orgBillingCheckoutAttempt.deleteMany({
            where: { providerSubscriptionId: subscriptionId },
          });
        }
        return "processed-org";
      }

      const currentUser = await tx.user.findUnique({
        where: { id: resolvedUserId },
        select: {
          razorpaySubscriptionId: true,
          subscriptionCancelAtPeriodEnd: true,
          subscriptionCurrentPeriodEnd: true,
        },
      });
      const isCurrent =
        currentUser?.razorpaySubscriptionId === subscriptionId;
      const canRecoverCurrent =
        !currentUser?.razorpaySubscriptionId &&
        providerStatus === "active" &&
        configuredInterval !== null;
      if (!isCurrent && !canRecoverCurrent) return "recorded";

      const terminal = isTerminalProviderStatus(providerStatus);
      const paidThrough =
        currentPeriodEnd ??
        billingSubscription.currentPeriodEnd ??
        currentUser?.subscriptionCurrentPeriodEnd ??
        null;
      const retainPaidAccess =
        terminal &&
        (currentUser?.subscriptionCancelAtPeriodEnd === true ||
          billingSubscription.cancelAtPeriodEnd) &&
        paidThrough !== null &&
        paidThrough.getTime() > Date.now();
      await tx.user.update({
        where: { id: resolvedUserId },
        data: terminal && !retainPaidAccess
          ? {
              subscriptionStatus: "none",
              razorpaySubscriptionId: null,
              subscriptionCancelAtPeriodEnd: false,
              subscriptionCurrentPeriodEnd: null,
            }
          : {
              subscriptionStatus: retainPaidAccess
                ? "active"
                : configuredInterval || providerStatus !== "active"
                  ? legacyStatusForProvider(providerStatus)
                  : "none",
              razorpaySubscriptionId:
                configuredInterval || providerStatus !== "active"
                  ? billingSubscription.providerSubscriptionId
                  : null,
              subscriptionCancelAtPeriodEnd: retainPaidAccess
                ? true
                : billingSubscription.cancelAtPeriodEnd,
              ...(paidThrough && {
                subscriptionCurrentPeriodEnd: paidThrough,
              }),
            },
      });

      if (
        providerStatus === "active" ||
        isTerminalProviderStatus(providerStatus)
      ) {
        await tx.billingCheckoutAttempt.deleteMany({
          where: { providerSubscriptionId: subscriptionId },
        });
      }
      return "processed";
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const existingEvent = await prisma.billingWebhookEvent.findUnique({
      where: { providerEventId },
      select: { providerEventId: true },
    });
    if (existingEvent) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    console.error("[billing.webhook] processing failed", {
      error,
      providerEventId,
      subscriptionId,
    });
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}
