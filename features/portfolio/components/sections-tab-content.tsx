"use client";

import { useEffect, useMemo, useState } from "react";
import { Reorder, useDragControls } from "motion/react";
import { Eye, EyeOff, GripVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSectionLabels } from "@/features/templates/section-labels";
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

function SectionRow({
  sectionKey,
  label,
  hidden,
  draggable,
  onToggleHidden,
}: {
  sectionKey: ReorderableSectionKey;
  label: string;
  hidden: boolean;
  draggable: boolean;
  onToggleHidden: () => void;
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
      </span>
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
            ? "This template has a fixed mosaic layout. You can hide sections, but their positions stay put."
            : "Drag to reorder sections. The header stays fixed at the top."}
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
                          onToggleHidden={() => handleToggleHidden(key)}
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
                          onToggleHidden={() => handleToggleHidden(key)}
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
