"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FlowFooter } from "@/features/dashboard/components/flow-footer";
import {
  usePortfolio,
  usePublishPortfolio,
  useUpdatePortfolio,
  useUpdateTemplate,
} from "@/features/portfolio/api/use-portfolio";
import { CreatePortfolioPrompt, PORTFOLIO_ACTION_BUTTON_CLASS } from "@/features/portfolio/components/create-portfolio-prompt";
import {
  PreviewEditSidebar,
} from "@/features/portfolio/components/preview-edit-sidebar";
import { PreviewToolbar } from "@/features/portfolio/components/preview-toolbar";
import { PublishDialog } from "@/features/portfolio/components/publish-dialog";
import { AccentSwatches } from "@/features/templates/components/accent-swatches";
import { getTemplate } from "@/features/templates/registry";
import { templateCatalogList } from "@/features/templates/template-catalog";
import { getStoredSectionLayout } from "@/features/templates/section-order";
import type { SectionLayoutCustomization } from "@/features/templates/section-order";
import {
  getTemplateDefaultAccent,
  resolveAccentColor,
} from "@/features/templates/template-accent-palettes";
import { portfolioToTemplateData } from "@/features/templates/transform";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ResumeUploader,
  type ResumeUploaderHandle,
} from "@/features/resume/components/resume-uploader";

const EMPTY_PORTFOLIO_PROMPT_KEY = "livefolio.empty-portfolio-prompt-dismissed";

function emptyPromptStorageKey(portfolioId: string | undefined) {
  return portfolioId
    ? `${EMPTY_PORTFOLIO_PROMPT_KEY}:${portfolioId}`
    : EMPTY_PORTFOLIO_PROMPT_KEY;
}

function hasDismissedEmptyPrompt(portfolioId: string | undefined) {
  try {
    return localStorage.getItem(emptyPromptStorageKey(portfolioId)) === "1";
  } catch {
    return false;
  }
}

function rememberEmptyPromptDismissed(portfolioId: string | undefined) {
  try {
    localStorage.setItem(emptyPromptStorageKey(portfolioId), "1");
  } catch {
    // Storage can be blocked. The in-memory flag still covers this visit.
  }
}

function portfolioHasDetails(portfolio: {
  headline?: string | null;
  summary?: string | null;
  experiences?: unknown[] | null;
  educations?: unknown[] | null;
  skills?: unknown[] | null;
  projects?: unknown[] | null;
  achievements?: unknown[] | null;
  certifications?: unknown[] | null;
  customSections?: unknown[] | null;
  socialProfiles?: unknown[] | null;
}) {
  if (portfolio.headline?.trim() || portfolio.summary?.trim()) {
    return true;
  }
  return [
    portfolio.experiences,
    portfolio.educations,
    portfolio.skills,
    portfolio.projects,
    portfolio.achievements,
    portfolio.certifications,
    portfolio.customSections,
    portfolio.socialProfiles,
  ].some((items) => Array.isArray(items) && items.length > 0);
}

export default function PreviewPage() {
  const { data: portfolio, isLoading } = usePortfolio();
  const updateTemplate = useUpdateTemplate();
  const updatePortfolio = useUpdatePortfolio();
  const publishPortfolio = usePublishPortfolio();
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [previewSectionLayout, setPreviewSectionLayout] =
    useState<SectionLayoutCustomization | null>(null);
  /** Local accent draft; null means use saved/default for the effective template. */
  const [previewPrimaryColor, setPreviewPrimaryColor] = useState<string | null>(
    null,
  );
  const [allowedTemplateIds, setAllowedTemplateIds] = useState<string[] | null>(
    null
  );
  const [accessTier, setAccessTier] = useState<"free" | "trial" | "pro" | null>(
    null,
  );
  const isMobile = useIsMobile();
  const [editOpen, setEditOpen] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [detailsPromptOpen, setDetailsPromptOpen] = useState(false);
  const [emptyPromptDismissed, setEmptyPromptDismissed] = useState(false);
  const resumeImportRef = useRef<ResumeUploaderHandle>(null);
  const pendingTemplateRef = useRef<string | null>(null);
  const closingPromptForUploadRef = useRef(false);
  const portfolioId =
    typeof portfolio?.id === "string" ? portfolio.id : undefined;

  useEffect(() => {
    setEditOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    if (hasDismissedEmptyPrompt(portfolioId)) setEmptyPromptDismissed(true);
  }, [portfolioId]);

  useEffect(() => {
    let cancelled = false;
    const loadAccess = async () => {
      try {
        const res = await fetch("/api/billing/me", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json().catch(() => ({}))) as {
          access?: {
            allowedTemplateIds?: string[];
            tier?: "free" | "trial" | "pro";
          };
        };
        if (cancelled) return;
        setAllowedTemplateIds(data.access?.allowedTemplateIds ?? null);
        setAccessTier(data.access?.tier ?? null);
      } catch {
        if (cancelled) return;
        setAllowedTemplateIds(null);
        setAccessTier(null);
      }
    };
    loadAccess();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (
      accessTier !== "pro" &&
      accessTier !== "trial" &&
      previewTemplate &&
      allowedTemplateIds &&
      !allowedTemplateIds.includes(previewTemplate)
    ) {
      setPreviewTemplate("minimal");
    }
  }, [accessTier, allowedTemplateIds, previewTemplate]);

  const applyTemplatePreview = useCallback((next: string) => {
    const current = previewTemplate ?? portfolio?.templateId ?? "pulse";
    setPreviewTemplate(next);
    // Preview template switches always land on that template's default accent.
    if (next !== current) {
      setPreviewPrimaryColor(getTemplateDefaultAccent(next));
    }
  }, [portfolio?.templateId, previewTemplate]);

  const handleTemplatePreview = (next: string) => {
    if (
      accessTier !== "pro" &&
      accessTier !== "trial" &&
      allowedTemplateIds &&
      !allowedTemplateIds.includes(next)
    ) {
      toast.error("Your free month has ended. Upgrade to Pro to unlock this template.");
      return;
    }
    // Pulse is already the default preview. An empty portfolio only prompts
    // when another template is chosen.
    if (
      portfolio &&
      !portfolioHasDetails(portfolio) &&
      next !== "pulse" &&
      !emptyPromptDismissed &&
      !hasDismissedEmptyPrompt(portfolioId)
    ) {
      pendingTemplateRef.current = next;
      setDetailsPromptOpen(true);
      return;
    }
    applyTemplatePreview(next);
  };

  const dismissEmptyPrompt = (opts?: { openEditor?: boolean }) => {
    setDetailsPromptOpen(false);
    setEmptyPromptDismissed(true);
    rememberEmptyPromptDismissed(portfolioId);
    const next = pendingTemplateRef.current;
    pendingTemplateRef.current = null;
    if (next) applyTemplatePreview(next);
    if (opts?.openEditor) setEditOpen(true);
  };

  const finishImportOnPreview = useCallback(() => {
    const next = pendingTemplateRef.current;
    pendingTemplateRef.current = null;
    if (next) applyTemplatePreview(next);
  }, [applyTemplatePreview]);

  const savedTemplateId = portfolio?.templateId ?? "pulse";

  const handleTemplateSave = async () => {
    const templateToSave = previewTemplate ?? savedTemplateId;
    const customization = portfolio?.customization as
      | { primaryColor?: string }
      | null
      | undefined;
    const templateChanged = templateToSave !== savedTemplateId;
    const accentDraft =
      previewPrimaryColor ??
      (templateChanged ? getTemplateDefaultAccent(templateToSave) : null);
    const accentToSave =
      accentDraft ?? resolveAccentColor(templateToSave, customization);
    const savedAccent = resolveAccentColor(savedTemplateId, customization);
    const accentChanged =
      accentDraft !== null &&
      accentToSave.toLowerCase() !== savedAccent.toLowerCase();

    if (!templateChanged && !accentChanged) return;

    try {
      if (templateChanged) {
        await updateTemplate.mutateAsync(templateToSave);
      }
      // Always persist accent with Apply so template switches reset to defaults.
      await updatePortfolio.mutateAsync({
        customization: { primaryColor: accentToSave },
      });
      setPreviewTemplate(null);
      setPreviewPrimaryColor(null);
      const appliedName = getTemplate(templateToSave).name;
      if (templateChanged) {
        if (portfolio?.isPublished) {
          toast.success(`${appliedName} is now live on your portfolio`);
        } else {
          toast.success(`${appliedName} template applied`);
        }
      } else {
        toast.success("Accent color applied");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save template");
    }
  };

  const handleSectionLayoutSave = async (layout: SectionLayoutCustomization) => {
    try {
      await updatePortfolio.mutateAsync({
        customization: { sectionLayout: layout },
      });
      setPreviewSectionLayout(null);
      toast.success("Section layout applied");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save section layout",
      );
    }
  };

  const handlePublishClick = async () => {
    if (!portfolio) return;

    if (portfolio.isPublished) {
      try {
        await publishPortfolio.mutateAsync(false);
        toast.success("Portfolio unpublished");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update publish status",
        );
      }
      return;
    }

    setPublishDialogOpen(true);
  };

  const templateOptions = templateCatalogList;

  const isTemplateLocked = (templateId: string) =>
    accessTier === "pro" || accessTier === "trial"
      ? false
      : Boolean(
          allowedTemplateIds && !allowedTemplateIds.includes(templateId),
        );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-h3 text-text-primary">
              Create your portfolio before previewing it
            </CardTitle>
            <CardDescription className="text-body-sm text-text-secondary">
              Preview depends on your saved portfolio content. Create the portfolio first, then continue through the flow.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CreatePortfolioPrompt />
            <Button variant="outline" className={PORTFOLIO_ACTION_BUTTON_CLASS} asChild>
              <Link href="/dashboard/import">Back to Import</Link>
            </Button>
          </CardContent>
        </Card>

        <FlowFooter
          previous={{ href: "/dashboard/import", label: "Previous: Import" }}
        />
      </div>
    );
  }

  const effectiveTemplate = previewTemplate ?? portfolio.templateId ?? "pulse";
  const templateId =
    accessTier !== "pro" &&
    accessTier !== "trial" &&
    allowedTemplateIds &&
    !allowedTemplateIds.includes(effectiveTemplate)
      ? "minimal"
      : effectiveTemplate;
  const hasUnsavedTemplate =
    templateId !== (portfolio.templateId ?? "pulse");
  const template = getTemplate(templateId);
  const TemplateComponent = template.component;
  const liveTemplate = getTemplate(savedTemplateId);
  const data = portfolioToTemplateData(portfolio);
  if (previewSectionLayout) {
    data.portfolio.customization = {
      ...data.portfolio.customization,
      sectionLayout: previewSectionLayout,
    };
  }

  const effectiveAccent =
    previewPrimaryColor ??
    resolveAccentColor(templateId, data.portfolio.customization);
  const savedAccent = resolveAccentColor(
    savedTemplateId,
    portfolio.customization as { primaryColor?: string } | null | undefined,
  );
  const hasUnsavedAccent =
    previewPrimaryColor !== null &&
    effectiveAccent.toLowerCase() !== savedAccent.toLowerCase();
  const hasUnsavedDesign = hasUnsavedTemplate || hasUnsavedAccent;

  data.portfolio.customization = {
    ...data.portfolio.customization,
    primaryColor: effectiveAccent,
  };

  const isPublished = portfolio.isPublished ?? false;
  const slug = portfolio.slug ?? "";
  const savedSectionLayout = getStoredSectionLayout(portfolio.customization);

  const panelProps = {
    templateId,
    savedTemplateId: portfolio.templateId ?? "pulse",
    isPublished,
    hasUnsavedTemplate: hasUnsavedDesign,
    isSavingTemplate: updateTemplate.isPending || updatePortfolio.isPending,
    onTemplateChange: handleTemplatePreview,
    onTemplateSave: handleTemplateSave,
    templateOptions,
    isTemplateLocked,
    portfolioData: data,
    savedSectionLayout,
    draftSectionLayout: previewSectionLayout,
    onSectionLayoutDraftChange: setPreviewSectionLayout,
    onSectionLayoutSave: handleSectionLayoutSave,
    isSavingSectionLayout: updatePortfolio.isPending,
  };

  const showAccentPicker = true;

  return (
    <div className="flex w-full max-w-full flex-1 flex-col gap-4 max-md:gap-0 lg:min-h-0 lg:flex-row lg:overflow-hidden">
      <PreviewEditSidebar
        open={editOpen}
        onOpenChange={setEditOpen}
        {...panelProps}
      />

      <div className="flex min-w-0 w-full flex-1 flex-col gap-4 max-md:gap-0 lg:min-h-0 lg:overflow-hidden">
        <div className="flex shrink-0 flex-col gap-3 rounded-[var(--radius-lg)] glass-panel p-3 max-md:mx-[var(--space-5)] max-md:mt-[var(--space-5)] max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:p-0 max-md:shadow-none md:rounded-[var(--radius-lg)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between xl:items-center">
            <div className="min-w-0 flex-1 px-2 max-md:px-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    hasUnsavedDesign && isPublished
                      ? "bg-warning"
                      : isPublished
                        ? "bg-success"
                        : "bg-text-muted"
                  )}
                  aria-hidden
                />
                <span className="text-body-sm font-medium text-text-primary">
                  {hasUnsavedTemplate
                    ? `Previewing ${template.name}`
                    : hasUnsavedAccent
                      ? "Accent preview"
                      : isPublished
                        ? `${liveTemplate.name} is live`
                        : "Portfolio builder"}
                </span>
              </div>
              {hasUnsavedTemplate && isPublished ? (
                <p className="mt-1 pl-4 text-xs text-text-muted">
                  Your live site still uses {liveTemplate.name}. Apply this template to switch.
                </p>
              ) : hasUnsavedTemplate ? (
                <p className="mt-1 pl-4 text-xs text-text-muted">
                  Apply this template before publishing.
                </p>
              ) : hasUnsavedAccent ? (
                <p className="mt-1 pl-4 text-xs text-text-muted">
                  Apply to save this accent color.
                </p>
              ) : null}
            </div>
            <PreviewToolbar
              device={device}
              onDeviceChange={setDevice}
              editOpen={editOpen}
              onEditOpenChange={setEditOpen}
              hasUnsavedTemplate={hasUnsavedDesign}
              isPublished={isPublished}
              templateName={template.name}
              isSavingTemplate={updateTemplate.isPending || updatePortfolio.isPending}
              onTemplateSave={() => void handleTemplateSave()}
              isPublishing={publishPortfolio.isPending}
              onPublishClick={() => void handlePublishClick()}
              slug={slug}
              showAnalytics={isPublished && !hasUnsavedDesign}
            />
          </div>
            {showAccentPicker ? (
              <div className="flex justify-end px-2 max-md:px-0">
                <AccentSwatches
                  value={effectiveAccent}
                  defaultHex={getTemplateDefaultAccent(templateId)}
                  onChange={setPreviewPrimaryColor}
                />
              </div>
            ) : null}
        </div>

        <div className="flex flex-1 flex-col bg-surface-sunken max-md:mt-4 md:-mx-0 md:min-h-0 md:overflow-hidden md:rounded-[var(--radius-lg)] md:border md:border-border-default md:p-3 md:shadow-[var(--shadow-modal)] lg:min-h-0">
          <div
            className={cn(
              "@container mx-auto min-w-0 w-full bg-surface-base transition-[max-width] duration-200 ease-[var(--ease-out)] max-md:max-w-none md:min-h-0 md:flex-1 md:overflow-x-clip md:overflow-y-auto md:rounded-[var(--radius-md)]",
              device === "mobile"
                ? "max-md:max-w-none md:max-w-[390px] md:px-1"
                : "max-w-full"
            )}
          >
            <div className="min-w-0 overflow-x-clip">
              <TemplateComponent data={data} />
            </div>
          </div>
        </div>

        <div className="shrink-0 max-md:px-[var(--space-5)] max-md:pb-[var(--space-5)] max-md:pt-4">
          <FlowFooter
            previous={{ href: "/dashboard/import", label: "Previous: Import" }}
          />
        </div>

        <PublishDialog
          open={publishDialogOpen}
          onOpenChange={setPublishDialogOpen}
          currentSlug={slug}
        />
      </div>

      <Dialog
        open={detailsPromptOpen}
        onOpenChange={(open) => {
          setDetailsPromptOpen(open);
          if (open) return;
          if (closingPromptForUploadRef.current) {
            closingPromptForUploadRef.current = false;
            return;
          }
          dismissEmptyPrompt();
        }}
      >
        <DialogContent className="font-sans sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="!font-sans text-balance text-lg font-semibold leading-snug tracking-normal">
              Fill your portfolio to preview this look
            </DialogTitle>
            <DialogDescription className="!font-sans text-pretty text-sm leading-relaxed">
              Upload a resume to import your details in one step, or edit
              sections yourself. You can change anything later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="!font-sans"
              onClick={() => dismissEmptyPrompt()}
            >
              I&apos;ll do it later
            </Button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="!font-sans"
                onClick={() => dismissEmptyPrompt({ openEditor: true })}
              >
                Edit manually
              </Button>
              <Button
                type="button"
                className="!font-sans"
                onClick={() => resumeImportRef.current?.openFilePicker()}
              >
                Upload resume
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ResumeUploader
        ref={resumeImportRef}
        embedded
        redirectToPreview={false}
        onUploadStart={() => {
          closingPromptForUploadRef.current = true;
          setDetailsPromptOpen(false);
        }}
        onImportFinished={finishImportOnPreview}
      />
    </div>
  );
}