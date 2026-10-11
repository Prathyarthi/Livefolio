"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Share2, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { FlowFooter } from "@/features/dashboard/components/flow-footer";
import {
  DASHBOARD_CONTENT_FRAME_CLASS,
  DASHBOARD_CONTENT_INNER_CLASS,
  DASHBOARD_MAIN_COLUMN_CLASS,
  DASHBOARD_PANEL_PAGE_CLASS,
  DASHBOARD_TRACKER_ASIDE_CLASS,
} from "@/features/dashboard/constants/panel-layout";
import { usePortfolio } from "@/features/portfolio/api/use-portfolio";
import { CreatePortfolioPrompt, PORTFOLIO_ACTION_BUTTON_CLASS } from "@/features/portfolio/components/create-portfolio-prompt";
import { EditStepContent } from "@/features/portfolio/components/edit-step-content";
import {
  EditStepProgressBar,
  EditStepTracker,
} from "@/features/portfolio/components/edit-step-tracker";
import { ShareDialog } from "@/features/portfolio/components/share-dialog";
import {
  EDIT_STEP_DESCRIPTIONS,
  EDIT_STEPS,
  type EditStepValue,
} from "@/features/portfolio/constants/edit-steps";

function EditPortfolioPageContent() {
  const router = useRouter();
  const { data: portfolio, isLoading } = usePortfolio();
  const [activeStep, setActiveStep] = useState<EditStepValue>("basic");

  const activeIndex = useMemo(
    () => EDIT_STEPS.findIndex((step) => step.value === activeStep),
    [activeStep]
  );

  const currentStep = EDIT_STEPS[activeIndex];
  const previousStep = activeIndex > 0 ? EDIT_STEPS[activeIndex - 1] : null;
  const nextStep =
    activeIndex < EDIT_STEPS.length - 1 ? EDIT_STEPS[activeIndex + 1] : null;

  const goPrevious = () => {
    if (activeIndex <= 0) {
      router.push("/dashboard");
      return;
    }
    setActiveStep(EDIT_STEPS[activeIndex - 1].value);
  };

  const goNext = () => {
    if (activeIndex < EDIT_STEPS.length - 1) {
      setActiveStep(EDIT_STEPS[activeIndex + 1].value);
      return;
    }
    router.push("/dashboard/templates");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-112 w-full max-w-3xl rounded-[2rem]" />
        <Skeleton className="h-14 w-full max-w-3xl rounded-2xl" />
        <Skeleton className="h-112 w-full max-w-3xl rounded-[2rem]" />
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-h3 text-text-primary">
              Create your portfolio first
            </CardTitle>
            <CardDescription className="text-body-sm text-text-secondary">
              Create your portfolio first, then you can edit sections, pick a template, and preview.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CreatePortfolioPrompt />
            <Button variant="outline" className={PORTFOLIO_ACTION_BUTTON_CLASS} asChild>
              <Link href="/dashboard">Back to Overview</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={DASHBOARD_PANEL_PAGE_CLASS}>
      <div className="shrink-0 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-h2 text-text-primary">Edit portfolio</h1>
            <p className="mt-1 max-w-2xl text-body-sm text-text-secondary lg:hidden">
              Work through one section at a time. Use the progress tracker to jump
              between steps.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {portfolio.isPublished ? (
              <Badge variant="success">Published</Badge>
            ) : (
              <Badge variant="neutral">Draft</Badge>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/import">
                <FileText className="mr-2 h-4 w-4" />
                Import resume (PDF)
              </Link>
            </Button>
            {portfolio.slug && (
              <ShareDialog slug={portfolio.slug} isPublished={portfolio.isPublished ?? false}>
                <Button variant="outline" size="sm">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </ShareDialog>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/preview">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Separator className="mt-6" />

      <div className="shrink-0 py-4">
        <FlowFooter
          className="border-0 p-0"
          message={null}
          previous={
            activeIndex <= 0
              ? { href: "/dashboard", label: "Back to Overview" }
              : {
                  label: `Previous: ${previousStep?.label ?? "section"}`,
                  onClick: goPrevious,
                }
          }
          next={{
            label: nextStep ? `Next: ${nextStep.label}` : "Next: Templates",
            onClick: goNext,
          }}
        />
      </div>

      <div className="flex min-h-0 w-full flex-1 flex-col lg:flex-row lg:gap-0 lg:overflow-hidden">
        <aside className={DASHBOARD_TRACKER_ASIDE_CLASS}>
          <EditStepTracker
            activeStep={activeStep}
            onStepChange={setActiveStep}
            portfolio={portfolio}
          />
        </aside>

        <div className={DASHBOARD_MAIN_COLUMN_CLASS}>
          <EditStepProgressBar activeStep={activeStep} />

          <div className="shrink-0 lg:hidden">
            <p className="eyebrow">
              Step {activeIndex + 1} of {EDIT_STEPS.length}
            </p>
            <h2 className="text-h3 text-text-primary">{currentStep.label}</h2>
            <p className="mt-0.5 text-body-sm text-text-secondary">
              {EDIT_STEP_DESCRIPTIONS[activeStep]}
            </p>
          </div>

          <div className={DASHBOARD_CONTENT_FRAME_CLASS}>
            <div className={DASHBOARD_CONTENT_INNER_CLASS}>
              <EditStepContent step={activeStep} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditPortfolioPageContent;
