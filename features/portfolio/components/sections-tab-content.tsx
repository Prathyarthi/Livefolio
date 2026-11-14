"use client";

import { useEffect, useMemo, useState } from "react";
import { Reorder, useDragControls } from "motion/react";
import { Eye, EyeOff, GripVertical, Loader2, Pencil, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUpdatePortfolio } from "@/features/portfolio/api/use-portfolio";
import { cn } from "@/lib/utils";
import {
  getCustomSectionLabel,
  getSectionLabels,
  MAX_SECTION_TITLE_CHARS,
  normalizeSectionTitles,
  STANDARD_SECTION_LABELS,
} from "@/features/templates/section-labels";
import { getTemplateSectionLayout } from "@/features/templates/section-layouts";
import {
  applyGroupOrder,
  getPresentSections,
  getStoredSectionLayout,
  normalizeHidden,
  normalizeOrder,
  resolveSectionLayout,
  toSectionLayoutPayload,
  type ReorderableSectionKey,
  type SectionLayoutCustomization,
} from "@/features/templates/section-order";
import type { PortfolioData } from "@/features/templates/types";

type SectionsTabContentProps = {
  templateId: string;
  data: PortfolioData;
  savedLayout?: SectionLayoutCustomization | null;
  draftLayout?: SectionLayoutCustomization | null;
  onDraftChange: (layout: SectionLayoutCustomization | null) => void;
  onSave: (layout: SectionLayoutCustomization) => Promise<void>;
  isSaving?: boolean;
};

function layoutsEqual(
  a: SectionLayoutCustomization | null | undefined,
  b: SectionLayoutCustomization | null | undefined,
): boolean {
  const left = toSectionLayoutPayload(
    normalizeOrder(a?.order),
    normalizeHidden(a?.hidden),
  );
  const right = toSectionLayoutPayload(
    normalizeOrder(b?.order),
    normalizeHidden(b?.hidden),
  );
  return (
    JSON.stringify(left.order) === JSON.stringify(right.order) &&
    JSON.stringify(left.hidden) === JSON.stringify(right.hidden)
  );
}

function RenameSectionPopover({
  sectionKey,
  label,
  isCustom,
  onRename,
}: {
  sectionKey: ReorderableSectionKey;
  label: string;
  isCustom: boolean;
  onRename: (key: ReorderableSectionKey, title: string) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(label);
  const [saving, setSaving] = useState(false);
  const defaultLabel = STANDARD_SECTION_LABELS[sectionKey];

  const submit = async (title: string) => {
    setSaving(true);
    const ok = await onRename(sectionKey, title);
    setSaving(false);
    if (ok) setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setValue(isCustom ? label : "");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="shrink-0 rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface-sunken hover:text-text-primary"
          aria-label={`Rename ${label}`}
          title="Rename heading"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-3 p-3">
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void submit(value);
          }}
        >
          <div className="space-y-1.5">
            <label
              htmlFor={`section-title-${sectionKey}`}
              className="text-xs font-medium text-text-primary"
            >
              Section heading
            </label>
            <Input
              id={`section-title-${sectionKey}`}
              value={value}
              maxLength={MAX_SECTION_TITLE_CHARS}
              placeholder={defaultLabel}
              autoFocus
              onChange={(event) => setValue(event.target.value)}
            />
            <p className="flex justify-between text-[11px] text-text-muted">
              <span>Leave empty to use the template default.</span>
              <span>
                {value.trim().length}/{MAX_SECTION_TITLE_CHARS}
              </span>
            </p>
          </div>
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={saving || !isCustom}
              onClick={() => void submit("")}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              Reset
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Save
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

function SectionRow({
  sectionKey,
  label,
  hidden,
  draggable,
  isCustomLabel,
  onToggleHidden,
  onRename,
}: {
  sectionKey: ReorderableSectionKey;
  label: string;
  hidden: boolean;
  draggable: boolean;
  isCustomLabel: boolean;
  onToggleHidden: () => void;
  onRename: (key: ReorderableSectionKey, title: string) => Promise<boolean>;
}) {
  const controls = useDragControls();

  const content = (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border border-border-default bg-surface-base px-2.5 py-2",
        hidden && "opacity-60",
      )}
    >
      {draggable ? (
        <button
          type="button"
          className="touch-none shrink-0 cursor-grab rounded p-0.5 text-text-muted hover:text-text-primary active:cursor-grabbing"
          aria-label={`Drag ${label}`}
          onPointerDown={(event) => controls.start(event)}
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>
      ) : (
        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-text-muted/40">
          <GripVertical className="h-4 w-4" aria-hidden />
        </span>
      )}
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">
        {label}
        {isCustomLabel ? (
          <span className="ml-1.5 text-[11px] font-normal text-text-muted">
            ({STANDARD_SECTION_LABELS[sectionKey]})
          </span>
        ) : null}
      </span>
      <RenameSectionPopover
        sectionKey={sectionKey}
        label={label}
        isCustom={isCustomLabel}
        onRename={onRename}
      />
      <button
        type="button"
        onClick={onToggleHidden}
        className="shrink-0 rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface-sunken hover:text-text-primary"
        aria-label={hidden ? `Show ${label}` : `Hide ${label}`}
        title={hidden ? "Show section" : "Hide section"}
      >
        {hidden ? (
          <EyeOff className="h-4 w-4" aria-hidden />
        ) : (
          <Eye className="h-4 w-4" aria-hidden />
        )}
      </button>
    </div>
  );

  if (!draggable) {
    return <div key={sectionKey}>{content}</div>;
  }

  return (
    <Reorder.Item
      key={sectionKey}
      value={sectionKey}
      dragListener={false}
      dragControls={controls}
      className="list-none"
    >
      {content}
    </Reorder.Item>
  );
}

export function SectionsTabContent({
  templateId,
  data,
  savedLayout,
  draftLayout,
  onDraftChange,
  onSave,
  isSaving,
}: SectionsTabContentProps) {
  const layout = useMemo(
    () => getTemplateSectionLayout(templateId),
    [templateId],
  );
  const present = useMemo(() => getPresentSections(data), [data]);
  const labels = useMemo(
    () => getSectionLabels(data.portfolio.customization),
    [data.portfolio.customization],
  );

  const updatePortfolio = useUpdatePortfolio();

  const handleRename = async (
    key: ReorderableSectionKey,
    title: string,
  ): Promise<boolean> => {
    const current = normalizeSectionTitles(
      (data.portfolio.customization as { sectionLabels?: unknown } | null)?.sectionLabels,
    );
    const next = normalizeSectionTitles({ ...current, [key]: title });
    if (!title.trim()) delete next[key];
    try {
      await updatePortfolio.mutateAsync({ customization: { sectionLabels: next } });
      toast.success(title.trim() ? "Section heading updated" : "Section heading reset");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to rename section");
      return false;
    }
  };

  const initialResolved = useMemo(
    () =>
      resolveSectionLayout(layout, {
        ...data.portfolio.customization,
        ...(draftLayout ? { sectionLayout: draftLayout } : {}),
      }),
    // Intentionally seed once from current draft/saved; local state owns subsequent edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [templateId],
  );

  const [localOrder, setLocalOrder] = useState(initialResolved.globalOrder);
  const [localHidden, setLocalHidden] = useState(initialResolved.hidden);

  // Sync local draft when saved layout or template changes externally.
  useEffect(() => {
    const next = resolveSectionLayout(layout, {
      ...data.portfolio.customization,
      ...(draftLayout ? { sectionLayout: draftLayout } : {}),
    });
    setLocalOrder(next.globalOrder);
    setLocalHidden(next.hidden);
    // Only resync when the external source of truth changes, not on every local edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, savedLayout, data.portfolio.customization]);

  const pushDraft = (
    order: ReorderableSectionKey[],
    hidden: ReorderableSectionKey[],
  ) => {
    const payload = toSectionLayoutPayload(order, hidden);
    const baseline = getStoredSectionLayout(data.portfolio.customization);
    if (layoutsEqual(payload, baseline)) {
      onDraftChange(null);
    } else {
      onDraftChange(payload);
    }
  };

  const handleGroupReorder = (nextGroupOrder: ReorderableSectionKey[]) => {
    const nextGlobal = applyGroupOrder(localOrder, nextGroupOrder);
    setLocalOrder(nextGlobal);
    pushDraft(nextGlobal, localHidden);
  };

  const handleToggleHidden = (key: ReorderableSectionKey) => {
    const nextHidden = localHidden.includes(key)
      ? localHidden.filter((item) => item !== key)
      : [...localHidden, key];
    setLocalHidden(nextHidden);
    pushDraft(localOrder, nextHidden);
  };

  const hasUnsaved = draftLayout != null && !layoutsEqual(draftLayout, savedLayout);
  const canReorder = !layout.fixed;

  const visibleGroups = layout.groups
    .map((group) => {
      const groupOrder = resolveSectionLayout(layout, {
        sectionLayout: { order: localOrder, hidden: localHidden },
      }).order[group.id];
      const items = groupOrder.filter((key) => present.has(key));
      return { ...group, items };
    })
    .filter((group) => group.items.length > 0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
        <p className="mb-3 text-xs leading-relaxed text-text-muted">
          {layout.fixed
            ? "This template has a fixed mosaic layout. You can hide or rename sections, but their positions stay put."
            : "Drag to reorder sections, or use the pencil to rename a heading. The header stays fixed at the top."}
        </p>

        {visibleGroups.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">
            No sections with content yet. Add content in the Edit tab first.
          </p>
        ) : (
          <div className="space-y-5">
            {visibleGroups.map((group) => {
              const groupDraggable = canReorder && group.items.length > 1;
              return (
                <div key={group.id}>
                  {layout.groups.length > 1 || layout.fixed ? (
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                      {group.label}
                    </p>
                  ) : null}

                  {groupDraggable ? (
                    <Reorder.Group
                      axis="y"
                      values={group.items}
                      onReorder={handleGroupReorder}
                      className="space-y-2"
                    >
                      {group.items.map((key) => (
                        <SectionRow
                          key={key}
                          sectionKey={key}
                          label={labels[key]}
                          hidden={localHidden.includes(key)}
                          draggable
                          isCustomLabel={getCustomSectionLabel(data.portfolio.customization, key) != null}
                          onToggleHidden={() => handleToggleHidden(key)}
                          onRename={handleRename}
                        />
                      ))}
                    </Reorder.Group>
                  ) : (
                    <div className="space-y-2">
                      {group.items.map((key) => (
                        <SectionRow
                          key={key}
                          sectionKey={key}
                          label={labels[key]}
                          hidden={localHidden.includes(key)}
                          draggable={false}
                          isCustomLabel={getCustomSectionLabel(data.portfolio.customization, key) != null}
                          onToggleHidden={() => handleToggleHidden(key)}
                          onRename={handleRename}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {hasUnsaved ? (
        <div className="shrink-0 border-t border-white/8 p-3">
          <Button
            type="button"
            className="w-full rounded-full"
            onClick={() => {
              if (!draftLayout) return;
              void onSave(draftLayout);
            }}
            disabled={isSaving || !draftLayout}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Apply layout"
            )}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
