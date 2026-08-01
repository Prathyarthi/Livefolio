"use client";

import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRecruiterOrg } from "@/features/recruiter/api/use-org";
import { CreateOrgGate } from "@/features/recruiter/components/create-org-gate";
import { RECRUITER_LIMITS } from "@/lib/recruiter-entitlements";

export function RecruiterSettings() {
  const { data, isLoading } = useRecruiterOrg();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!data?.org) return <CreateOrgGate />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-3xl font-bold text-text-primary">
        Workspace settings
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>{data.org.name}</CardTitle>
          <CardDescription>
            Role: {data.role} · slug: {data.org.slug}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-text-secondary">
          <p>Beta soft limits (no B2B billing yet):</p>
          <ul className="list-inside list-disc">
            <li>{RECRUITER_LIMITS.maxOrgsPerUser} organization per account</li>
            <li>
              {RECRUITER_LIMITS.maxActiveCandidatesPerOrg} active candidates
            </li>
            <li>
              {RECRUITER_LIMITS.maxResumeEnrichmentsPerMonth} resume uploads /
              month
            </li>
            <li>{RECRUITER_LIMITS.maxSearchesPerDay} searches / day</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
