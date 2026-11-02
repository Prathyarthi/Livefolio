import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";
import { getAvailableOrgSeatIntervals } from "@/lib/billing";
import { requireOrgMember } from "@/features/organization/lib/org-access";
import { canManageOrganization } from "@/features/organization/lib/permissions";
import { resolveOrgAccess } from "@/lib/org-entitlements";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgSlug = new URL(req.url).searchParams.get("orgSlug")?.trim();
  if (!orgSlug) {
    return NextResponse.json({ error: "orgSlug is required." }, { status: 400 });
  }

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: {
      id: true,
      slug: true,
      name: true,
      subscriptionStatus: true,
      subscriptionCancelAtPeriodEnd: true,
      subscriptionCurrentPeriodEnd: true,
      subscriptionPlan: true,
      subscriptionSeats: true,
      razorpaySubscriptionId: true,
    },
  });
  if (!org) {
    return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  }

  const membership = await requireOrgMember(org.id, session.user.id);
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const access = await resolveOrgAccess(org);
  const proIntervals = getAvailableOrgSeatIntervals("pro");
  const currentSub = org.razorpaySubscriptionId
    ? await prisma.billingSubscription.findUnique({
        where: { providerSubscriptionId: org.razorpaySubscriptionId },
        select: { interval: true },
      })
    : null;
  const businessIntervals = getAvailableOrgSeatIntervals("business");
  const sub = (org.subscriptionStatus ?? "").toLowerCase();
  const subscription =
    sub === "active"
      ? {
          status: "ACTIVE" as const,
          cancelAtPeriodEnd: org.subscriptionCancelAtPeriodEnd,
          currentPeriodEnd:
            org.subscriptionCurrentPeriodEnd?.toISOString() ?? null,
        }
      : sub === "pending"
        ? {
            status: "PENDING" as const,
            cancelAtPeriodEnd: false,
            currentPeriodEnd:
              org.subscriptionCurrentPeriodEnd?.toISOString() ?? null,
          }
        : null;

  return NextResponse.json({
    razorpayReady: proIntervals.length + businessIntervals.length > 0,
    availableIntervals: proIntervals,
    planIntervals: { pro: proIntervals, business: businessIntervals },
    seats: org.subscriptionSeats ?? null,
    interval: currentSub?.interval ?? null,
    canManageBilling: canManageOrganization(membership.role),
    organization: { id: org.id, slug: org.slug, name: org.name },
    subscription,
    access,
  });
}
