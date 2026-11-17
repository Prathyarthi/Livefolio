import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";
import {
  getIntervalForPlanId,
  isTerminalProviderStatus,
  legacyStatusForProvider,
  parseProviderSubscriptionStatus,
} from "@/lib/billing-lifecycle";

type ProviderSubscription = {
  id?: string;
  status?: string;
  plan_id?: string;
  current_end?: number;
  notes?: Record<string, string | undefined>;
};

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export async function reconcileUserBilling(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      razorpaySubscriptionId: true,
      subscriptionCancelAtPeriodEnd: true,
      subscriptionCurrentPeriodEnd: true,
    },
  });
  if (!user?.razorpaySubscriptionId) return { status: "none" as const };

  const razorpay = getRazorpayClient();
  if (!razorpay) return { status: "unavailable" as const };

  const subscription = (await razorpay.subscriptions.fetch(
    user.razorpaySubscriptionId
  )) as ProviderSubscription;
  const providerStatus = parseProviderSubscriptionStatus(subscription.status);
  const providerPlanId = subscription.plan_id ?? "";
  const interval = getIntervalForPlanId(providerPlanId);
  if (!providerStatus) {
    return { status: "invalid" as const };
  }
  if (
    subscription.notes?.userId !== userId ||
    (providerStatus === "active" && !interval)
  ) {
    await prisma.user.updateMany({
      where: {
        id: userId,
        razorpaySubscriptionId: user.razorpaySubscriptionId,
      },
      data: { subscriptionStatus: "none" },
    });
    return { status: "invalid" as const };
  }

  const terminal = isTerminalProviderStatus(providerStatus);
  const currentPeriodEnd =
    typeof subscription.current_end === "number"
      ? new Date(subscription.current_end * 1000)
      : user.subscriptionCurrentPeriodEnd;
  // An app-confirmed cancellation keeps local paid access through current_end,
  // even though the provider subscription itself is already terminal.
  const cancelAtPeriodEnd = user.subscriptionCancelAtPeriodEnd;
  const retainPaidAccess =
    terminal &&
    cancelAtPeriodEnd &&
    currentPeriodEnd !== null &&
    currentPeriodEnd.getTime() > Date.now();

  await prisma.$transaction(async (tx) => {
    await tx.billingSubscription.upsert({
      where: {
        providerSubscriptionId: user.razorpaySubscriptionId!,
      },
      create: {
        userId,
        providerSubscriptionId: user.razorpaySubscriptionId!,
        providerPlanId: providerPlanId || "unknown",
        interval: interval ?? subscription.notes?.interval ?? "unknown",
        status: providerStatus,
        cancelAtPeriodEnd,
        currentPeriodEnd,
      },
      update: {
        providerPlanId: providerPlanId || "unknown",
        ...(interval && { interval }),
        status: providerStatus,
        cancelAtPeriodEnd,
        currentPeriodEnd,
      },
    });

    await tx.user.updateMany({
      where: {
        id: userId,
        razorpaySubscriptionId: user.razorpaySubscriptionId,
      },
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
              : legacyStatusForProvider(providerStatus),
            subscriptionCancelAtPeriodEnd: cancelAtPeriodEnd,
            subscriptionCurrentPeriodEnd: currentPeriodEnd,
          },
    });

    if (
      providerStatus === "active" ||
      isTerminalProviderStatus(providerStatus)
    ) {
      await tx.billingCheckoutAttempt.deleteMany({
        where: {
          userId,
          providerSubscriptionId: user.razorpaySubscriptionId,
        },
      });
    }
  });

  return { status: providerStatus };
}
