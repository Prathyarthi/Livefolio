"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, FileText, Loader2, PanelLeftClose, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { EDIT_STEPS, type EditStepValue } from "@/features/portfolio/constants/edit-steps";
import { EditStepContent } from "@/features/portfolio/components/edit-step-content";
import { SectionsTabContent } from "@/features/portfolio/components/sections-tab-content";
import { TemplatePreviewThumbnail } from "@/features/templates/template-preview-thumbnail";
import type { SectionLayoutCustomization } from "@/features/templates/section-order";
import type { PortfolioData } from "@/features/templates/types";
import {
  DASHBOARD_FORM_COMPACT_CLASS,
  PREVIEW_EDIT_SIDEBAR_CLASS,
} from "@/features/dashboard/constants/panel-layout";

type PreviewPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId?: string;
  savedTemplateId?: string;
  isPublished?: boolean;
  hasUnsavedTemplate?: boolean;
  isSavingTemplate?: boolean;
  onTemplateChange?: (templateId: string) => void;
  onTemplateSave?: () => void;
  templateOptions?: any[];
  isTemplateLocked?: (templateId: string) => boolean;
  portfolioData?: PortfolioData | null;
  savedSectionLayout?: SectionLayoutCustomization | null;
  draftSectionLayout?: SectionLayoutCustomization | null;
  onSectionLayoutDraftChange?: (layout: SectionLayoutCustomization | null) => void;
  onSectionLayoutSave?: (layout: SectionLayoutCustomization) => Promise<void>;
  isSavingSectionLayout?: boolean;
};

function DesignTabContent({
  templateId,
  savedTemplateId,
  isPublished,
  hasUnsavedTemplate,
  isSavingTemplate,
  onTemplateChange,
  onTemplateSave,
  templateOptions,
  isTemplateLocked,
  onTemplateSelected,
}: Omit<PreviewPanelProps, "open" | "onOpenChange"> & {
  onTemplateSelected?: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
        {templateOptions && onTemplateChange ? (
          <div className="grid grid-cols-2 gap-3">
            {templateOptions.map((t) => {
              const isPreviewing = templateId === t.id;
              const isSaved = savedTemplateId === t.id;

              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={isTemplateLocked?.(t.id) ?? false}
                  onClick={() => {
                    onTemplateChange(t.id);
                    onTemplateSelected?.();
                  }}
                  className={cn(
                    "group relative flex flex-col gap-2 rounded-xl border p-2 text-left transition-all",
                    isPreviewing
                      ? "border-primary bg-primary/5"
                      : "border-white/8 bg-white/3 hover:border-white/20 hover:bg-white/5",
                    (isTemplateLocked?.(t.id) ?? false) &&
                      "cursor-not-allowed opacity-50"
                  )}
                >
                  <TemplatePreviewThumbnail templateId={t.id} compact />
                  <div className="flex w-full items-center justify-between">
                    <span className="truncate pr-2 text-xs font-medium">
                      {t.name}
                    </span>
                    {isPreviewing ? (
                      <Check className="h-3 w-3 shrink-0 text-primary" />
                    ) : isSaved && isPublished ? (
                      <span className="shrink-0 text-[10px] font-medium text-success">
                        Live
                      </span>
                    ) : isSaved ? (
                      <span className="shrink-0 text-[10px] text-zinc-500">
                        Active
                      </span>
                    ) : isTemplateLocked?.(t.id) ? (
                      <span className="shrink-0 text-[10px] text-zinc-500">
                        PRO
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-zinc-500">
            Templates not available
          </p>
        )}
      </div>

      {hasUnsavedTemplate && onTemplateSave ? (
        <div className="shrink-0 border-t border-white/8 p-3">
          <Button
            type="button"
            className="w-full rounded-full"
            onClick={onTemplateSave}
            disabled={isSavingTemplate}
          >
            {isSavingTemplate ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : isPublished ? (
              "Apply & go live"
            ) : (
              "Apply"
            )}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function EditTabContent({
  activeStep,
  onStepChange,
}: {
  activeStep: EditStepValue;
  onStepChange: (step: EditStepValue) => void;
}) {
  const activeStepInfo = EDIT_STEPS.find((step) => step.value === activeStep);
  const stepButtonRefs = useRef<Partial<Record<EditStepValue, HTMLButtonElement | null>>>({});

  useEffect(() => {
    stepButtonRefs.current[activeStep]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeStep]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border-default px-3 py-2">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {EDIT_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <button
                key={step.value}
                ref={(element) => {
                  stepButtonRefs.current[step.value] = element;
                }}
                type="button"
                onClick={() => onStepChange(step.value)}
                aria-pressed={activeStep === step.value}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  activeStep === step.value
                    ? "border-transparent bg-brand-light text-brand-primary"
                    : "border-border-default text-text-muted hover:bg-surface-sunken hover:text-text-primary"
                )}
                title={step.label}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span>{step.short}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border-default px-4 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">
            {activeStepInfo?.label}
          </p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0" asChild>
          <Link href="/dashboard/import">
            <FileText className="h-3.5 w-3.5" />
            Import
          </Link>
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
        <div
          className={`preview-edit-form [&_button]:text-sm [&_input]:text-sm [&_textarea]:min-h-24 [&_textarea]:text-sm ${DASHBOARD_FORM_COMPACT_CLASS}`}
        >
          <EditStepContent step={activeStep} />
        </div>
      </div>
    </div>
  );
}

function EditorBody({
  activeStep,
  onStepChange,
  onClose,
  onTemplateSelected,
  ...panelProps
}: Omit<PreviewPanelProps, "open" | "onOpenChange"> & {
  activeStep: EditStepValue;
  onStepChange: (step: EditStepValue) => void;
  onClose?: () => void;
  onTemplateSelected?: () => void;
}) {
  return (
    <Tabs defaultValue="design" className="flex h-full min-h-0 flex-col bg-transparent text-text-primary">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border-default px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Pencil className="h-3.5 w-3.5 text-text-muted" aria-hidden />
            <p className="text-body-sm font-semibold text-text-primary">Inspect &amp; edit</p>
          </div>
          <p className="mt-0.5 truncate text-body-sm text-text-muted">
            Live preview stays on canvas
          </p>
        </div>
        {onClose ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close editor"
          >
            <PanelLeftClose className="h-4 w-4" aria-hidden />
          </Button>
        ) : null}
      </div>

      <div className="shrink-0 border-b border-border-default px-3 py-2">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="design" className="text-sm">Design</TabsTrigger>
          <TabsTrigger value="content" className="text-sm">Edit</TabsTrigger>
          <TabsTrigger value="sections" className="text-sm">Sections</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="design" className="flex min-h-0 flex-1 flex-col m-0 data-[state=inactive]:hidden">
        <DesignTabContent
          {...panelProps}
          onTemplateSelected={onTemplateSelected}
        />
      </TabsContent>

      <TabsContent value="content" className="flex min-h-0 flex-1 flex-col m-0 data-[state=inactive]:hidden">
        <EditTabContent activeStep={activeStep} onStepChange={onStepChange} />
      </TabsContent>

      <TabsContent value="sections" className="flex min-h-0 flex-1 flex-col m-0 data-[state=inactive]:hidden">
        {panelProps.portfolioData &&
        panelProps.templateId &&
        panelProps.onSectionLayoutDraftChange &&
        panelProps.onSectionLayoutSave ? (
          <SectionsTabContent
            templateId={panelProps.templateId}
            data={panelProps.portfolioData}
            savedLayout={panelProps.savedSectionLayout}
            draftLayout={panelProps.draftSectionLayout}
            onDraftChange={panelProps.onSectionLayoutDraftChange}
            onSave={panelProps.onSectionLayoutSave}
            isSaving={panelProps.isSavingSectionLayout}
          />
        ) : (
          <p className="px-3 py-8 text-center text-sm text-text-muted">
            Sections not available
          </p>
        )}
      </TabsContent>
    </Tabs>
  );
}

export function PreviewEditSidebar({
  open,
  onOpenChange,
  ...panelProps
}: PreviewPanelProps) {
  const isMobile = useIsMobile();
  const [activeStep, setActiveStep] = useState<EditStepValue>("basic");

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-full glass-modal p-0 sm:max-w-lg"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Edit portfolio</SheetTitle>
          </SheetHeader>
          <EditorBody
            activeStep={activeStep}
            onStepChange={setActiveStep}
            onClose={() => onOpenChange(false)}
            onTemplateSelected={() => onOpenChange(false)}
            {...panelProps}
          />
        </SheetContent>
      </Sheet>
    );
  }

  if (!open) return null;

  return (
    <aside className={cn("glass-panel", PREVIEW_EDIT_SIDEBAR_CLASS, "lg:mr-4")}>
      <EditorBody
        activeStep={activeStep}
        onStepChange={setActiveStep}
        onClose={() => onOpenChange(false)}
        {...panelProps}
      />
    </aside>
  );
}

export function PreviewEditToggle({
  open,
  onOpenChange,
  compact = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  compact?: boolean;
}) {
  const label = open ? "Close editor" : "Edit";

  return (
    <Button
      type="button"
      size="sm"
      className="shrink-0 gap-1.5 px-2.5"
      variant={open ? "default" : "outline"}
      onClick={() => onOpenChange(!open)}
      title={label}
      aria-label={label}
    >
      {open ? (
        <PanelLeftClose className="h-3.5 w-3.5 shrink-0" aria-hidden />
      ) : (
        <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden />
      )}
      {compact ? (
        <span className="hidden xl:inline">{label}</span>
      ) : (
        label
      )}
    </Button>
  );
}
