"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FlowFooter } from "@/features/dashboard/components/flow-footer";
import {
  usePortfolio,
  useUpdatePortfolio,
  useUpdateTemplate,
} from "@/features/portfolio/api/use-portfolio";
import { CreatePortfolioPrompt, PORTFOLIO_ACTION_BUTTON_CLASS } from "@/features/portfolio/components/create-portfolio-prompt";
import { templateRegistry } from "@/features/templates/registry";
import {
  getTemplateDefaultAccent,
} from "@/features/templates/template-accent-palettes";
import { TemplatePreviewThumbnail } from "@/features/templates/template-preview-thumbnail";
import { useBilling } from "@/features/subscriptions/api/use-billing";

export default function TemplatesPage() {
  const router = useRouter();
  const { data: portfolio, isLoading } = usePortfolio();
  const updateTemplate = useUpdateTemplate();
  const updatePortfolio = useUpdatePortfolio();
  const { data: billing } = useBilling();
  const allowedTemplateIds = billing?.access?.allowedTemplateIds ?? null;
  const accessTier = billing?.access?.tier ?? null;
  const trialDaysRemaining = billing?.access?.trialDaysRemaining ?? 0;
  const [isApplying, setIsApplying] = useState(false);
  const currentTemplate = portfolio?.templateId ?? "pulse";

  const handleSelect = async (templateId: string) => {
    if (allowedTemplateIds && !allowedTemplateIds.includes(templateId)) {
      toast.error("Upgrade to Pro to unlock this template.", {
        action: {
          label: "View Billing",
          onClick: () => router.push("/dashboard/billing"),
        },
      });
      return;
    }

    setIsApplying(true);
    try {
      await updateTemplate.mutateAsync(templateId);
      // Immediate apply always resets to the template's default accent.
      await updatePortfolio.mutateAsync({
        customization: {
          primaryColor: getTemplateDefaultAccent(templateId),
        },
      });
      toast.success(`Template changed to ${templateId}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to change template",
      );
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-h3 text-text-primary">
              Create your portfolio before choosing a template
            </CardTitle>
            <CardDescription className="text-body-sm text-text-secondary">
              Create your portfolio first so your template selection can be
              saved.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CreatePortfolioPrompt />
            <Button variant="outline" className={PORTFOLIO_ACTION_BUTTON_CLASS} asChild>
              <Link href="/dashboard/edit">Back to Edit</Link>
            </Button>
          </CardContent>
        </Card>

        <FlowFooter
          previous={{ href: "/dashboard/edit", label: "Back to Edit" }}
          next={{
            label: "Next: Import Data",
            onClick: () => router.push("/dashboard/import"),
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-6">
      <div className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)]">
        <p className="eyebrow uppercase">Templates</p>
        <h1 className="mt-3 text-h1 text-text-primary">
          Choose a presentation system
        </h1>
        <p className="mt-2 max-w-2xl text-body text-text-secondary">
          Pick the visual language that best fits your work. Content stays the
          same while layout, rhythm, and tone shift with the template.
        </p>
        {accessTier === "trial" && (
          <p className="mt-3 text-body-sm text-success">
            Free trial active — {trialDaysRemaining} day
            {trialDaysRemaining === 1 ? "" : "s"} left to use all templates.
          </p>
        )}
        {accessTier === "free" && (
          <p className="mt-3 text-body-sm text-text-secondary">
            Your free trial ended. Minimal stays available.{" "}
            <Link
              href="/dashboard/billing"
              className="text-brand-primary underline underline-offset-4 hover:text-brand-dark"
            >
              Upgrade to Pro
            </Link>{" "}
            to unlock all templates.
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Object.values(templateRegistry).map((template) => {
          const isActive = currentTemplate === template.id;
          const isLocked = allowedTemplateIds
            ? !allowedTemplateIds.includes(template.id)
            : false;

          return (
            <Card
              key={template.id}
              className={`relative overflow-hidden p-0 transition-all duration-200 ease-[var(--ease-out)] ${
                isActive
                  ? "border-brand-primary ring-1 ring-brand-primary"
                  : isLocked
                    ? "opacity-75"
                    : "hover:-translate-y-1 hover:border-border-strong"
              }`}
            >
              <div className="relative border-b border-border-default p-4">
                <TemplatePreviewThumbnail templateId={template.id} />
                {isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-text-primary/40 backdrop-blur-[2px]">
                    <Lock className="h-6 w-6 text-white" aria-hidden />
                  </div>
                )}
              </div>
              <CardHeader className="px-5 pt-5 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-h4 text-text-primary">
                    {template.name}
                  </CardTitle>
                  <Badge variant={isLocked ? "brand" : isActive ? "success" : "neutral"}>
                    {isLocked ? "Pro" : isActive ? "Active" : template.category}
                  </Badge>
                </div>
                <CardDescription className="text-body-sm text-text-secondary">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {isLocked ? (
                  <Button asChild className="w-full" variant="outline">
                    <Link href="/dashboard/billing">Upgrade to unlock</Link>
                  </Button>
                ) : (
                  <Button
                    variant={isActive ? "secondary" : "outline"}
                    className="w-full"
                    onClick={() => void handleSelect(template.id)}
                    disabled={isApplying || updateTemplate.isPending || updatePortfolio.isPending}
                  >
                    {isActive ? (
                      <>
                        <Check className="h-4 w-4" />
                        Current template
                      </>
                    ) : (
                      "Use template"
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <FlowFooter
        previous={{ href: "/dashboard/edit", label: "Previous: Edit" }}
        next={{ href: "/dashboard/import", label: "Next: Import Data" }}
      />
    </div>
  );
}
