import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";
import { requireOrgAdmin } from "@/features/organization/lib/org-access";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let orgSlug = "";
  let subscriptionId = "";
  try {
    const body = await req.json();
    orgSlug = typeof body?.orgSlug === "string" ? body.orgSlug.trim() : "";
    subscriptionId =
      typeof body?.subscriptionId === "string" ? body.subscriptionId.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!orgSlug) {
    return NextResponse.json({ error: "Organization is required." }, { status: 400 });
  }

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true, subscriptionStatus: true },
  });
  if (!org) {
    return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  }

  const membership = await requireOrgAdmin(org.id, session.user.id);
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.orgBillingCheckoutAttempt.deleteMany({
    where: {
      organizationId: org.id,
      ...(subscriptionId ? { providerSubscriptionId: subscriptionId } : {}),
    },
  });

  if (org.subscriptionStatus !== "active") {
    await prisma.organization.updateMany({
      where: {
        id: org.id,
        subscriptionStatus: { not: "active" },
        ...(subscriptionId
          ? { razorpaySubscriptionId: subscriptionId }
          : {}),
      },
      data: {
        razorpaySubscriptionId: null,
        subscriptionStatus: "none",
      },
    });
  }

  return NextResponse.json({ ok: true });
}