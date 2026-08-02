"use client";

import Link from "next/link";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUpdateOpenToOpportunities } from "@/features/portfolio/api/use-portfolio";

export function OpenToOpportunitiesCard({
  openToOpportunities,
}: {
  openToOpportunities: boolean;
}) {
  const update = useUpdateOpenToOpportunities();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Open to opportunities</CardTitle>
        <CardDescription>
          Your registered portfolio is already visible in recruiter talent
          search. Turn this on to mark that you&apos;re actively looking.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-border-default bg-surface-sunken px-4 py-3">
          <div className="space-y-1">
            <Label htmlFor="open-to-opportunities">Actively looking</Label>
            <p className="text-body-sm text-text-secondary">
              A preference signal for recruiters. It does not hide your profile
              from search.
            </p>
          </div>
          <Switch
            id="open-to-opportunities"
            checked={openToOpportunities}
            disabled={update.isPending}
            onCheckedChange={(checked) => {
              update.mutate(checked, {
                onSuccess: () =>
                  toast.success(
                    checked
                      ? "Marked as actively looking"
                      : "Actively looking turned off",
                  ),
                onError: (error) =>
                  toast.error(
                    error instanceof Error ? error.message : "Failed to update",
                  ),
              });
            }}
          />
        </div>
        <p className="mt-3 text-body-sm text-text-muted">
          Also hiring?{" "}
          <Link href="/recruiter" className="text-brand-primary underline">
            Open recruiter workspace
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
