"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

  useEffect(() => {
    setEditOpen(!isMobile);
  }, [isMobile]);

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
    const current =
      previewTemplate ?? portfolio?.templateId ?? "pulse";
    setPreviewTemplate(next);
    // Preview template switches always land on that template's default accent.
    if (next !== current) {
      setPreviewPrimaryColor(getTemplateDefaultAccent(next));
    }
  };

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

  const templateOptions = useMemo(
    () => templateCatalogList.filter((template) => template.id !== "spotlight"),
    [],
  );

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
    </div>
  );
}