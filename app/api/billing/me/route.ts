import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";
import { resolveAccessForUser } from "@/lib/entitlements";
import {
  getAvailableBillingIntervals,
  isAnyBillingReady,
} from "@/lib/billing";
import { reconcileUserBilling } from "@/lib/billing-reconciliation";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fire-and-forget — webhooks keep DB current; reconcile is a defensive fallback
  void reconcileUserBilling(session.user.id).catch((error) =>
    console.error("[billing.me] reconciliation failed", { error, userId: session.user.id })
  );

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const paymentsReady = isAnyBillingReady();
  const availableIntervals = getAvailableBillingIntervals();
  const access = resolveAccessForUser(user);

  const sub = String((user as { subscriptionStatus?: string | null }).subscriptionStatus ?? "").toLowerCase();
  const cancellation = user as typeof user & {
    subscriptionCancelAtPeriodEnd?: boolean;
    subscriptionCurrentPeriodEnd?: Date | null;
  };
  const subscription =
    sub === "active"
      ? {
          status: "ACTIVE" as const,
          cancelAtPeriodEnd:
            cancellation.subscriptionCancelAtPeriodEnd ?? false,
          currentPeriodEnd:
            cancellation.subscriptionCurrentPeriodEnd?.toISOString() ?? null,
        }
      : sub === "pending"
        ? {
            status: "PENDING" as const,
            cancelAtPeriodEnd: false,
            currentPeriodEnd:
              cancellation.subscriptionCurrentPeriodEnd?.toISOString() ?? null,
          }
        : null;

  // Keep response shape aligned with Xchat's subscription flow contract.
  return NextResponse.json(
    { razorpayReady: paymentsReady, availableIntervals, subscription, access },
    { headers: { "Cache-Control": "private, max-age=30" } }
  );
}
