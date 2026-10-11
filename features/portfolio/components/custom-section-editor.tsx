"use client";

import { useMemo, useState } from "react";
import {
  usePortfolio,
  useUpsertCustomSection,
  useUpdateCustomSection,
  useDeleteCustomSection,
} from "@/features/portfolio/api/use-portfolio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldLabel } from "@/features/portfolio/components/field-label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Layers,
  X,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useEditStepDirty } from "@/features/portfolio/context/edit-dirty-context";
import { useScrollIntoView } from "@/hooks/use-scroll-into-view";
import {
  type FieldErrors,
  clientValidators,
  validationMessage,
  validateField,
} from "@/features/portfolio/lib/client-validation";
import {
  MAX_CUSTOM_SECTIONS,
  normalizeStoredUrlsInJson,
  validateCustomSectionItems,
} from "@/lib/content-policy";

interface ItemField {
  key: string;
  value: string;
}

type SectionField = "label" | "sectionType" | "form";

function toSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function itemFieldsToRecord(fields: ItemField[]): Record<string, string> {
  const record: Record<string, string> = {};
  for (const field of fields) {
    const key = field.key.trim();
    if (key) {
      record[key] = field.value.trim();
    }
  }
  return record;
}

function validateItems(items: Record<string, unknown>[]) {
  try {
    const validated = validateCustomSectionItems(items, "Custom section items");
    validateCustomSectionItems(
      normalizeStoredUrlsInJson(validated, "Custom section items"),
      "Custom section items",
    );
    return null;
  } catch (error) {
    return validationMessage(error, "Invalid custom section items");
  }
}

export function CustomSectionEditor() {
  const { data: portfolio, isLoading } = usePortfolio();
  const upsertSection = useUpsertCustomSection();
  const updateSection = useUpdateCustomSection();
  const deleteSection = useDeleteCustomSection();

  const [addingSectionLabel, setAddingSectionLabel] = useState("");
  const [showAddSection, setShowAddSection] = useState(false);
  const [sectionErrors, setSectionErrors] = useState<FieldErrors<SectionField>>(
    {},
  );
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );

  // Item editing state
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [itemFields, setItemFields] = useState<ItemField[]>([
    { key: "title", value: "" },
    { key: "description", value: "" },
  ]);
  const [itemError, setItemError] = useState<string | null>(null);
  const editingItemRef = useScrollIntoView<HTMLDivElement>(
    editingItemIndex !== null && !isAddingItem,
  );

  const isMutating =
    upsertSection.isPending ||
    updateSection.isPending ||
    deleteSection.isPending;

  function toggleExpanded(id: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const customSections = useMemo(
    () => portfolio?.customSections ?? [],
    [portfolio?.customSections],
  );
  const sectionValidationErrors = useMemo(() => {
    const errors: FieldErrors<SectionField> = {};
    const sectionType = toSlug(addingSectionLabel);
    validateField(errors, "label", () =>
      clientValidators.requiredLabel(
        addingSectionLabel,
        "Custom section label",
      ),
    );
    validateField(errors, "sectionType", () =>
      clientValidators.requiredLabel(sectionType, "Section type"),
    );
    const existingSection = customSections.some(
      (section: { sectionType?: string }) =>
        section.sectionType?.toLowerCase() === sectionType.toLowerCase(),
    );
    if (!existingSection && customSections.length >= MAX_CUSTOM_SECTIONS) {
      errors.form = `Custom sections must contain at most ${MAX_CUSTOM_SECTIONS} items`;
    }
    return errors;
  }, [addingSectionLabel, customSections]);

  async function handleAddSection() {
    if (Object.keys(sectionValidationErrors).length > 0) {
      setSectionErrors(sectionValidationErrors);
      return;
    }
    const label = addingSectionLabel.trim();
    const sectionType = toSlug(label);
    try {
      await upsertSection.mutateAsync({
        sectionType,
        label,
        items: [],
      });
      toast.success(`"${label}" section created`);
      setAddingSectionLabel("");
      setSectionErrors({});
      setShowAddSection(false);
    } catch (error) {
      toast.error(validationMessage(error, "Failed to create section"));
    }
  }

  async function handleDeleteSection(id: string) {
    try {
      await deleteSection.mutateAsync(id);
      toast.success("Section deleted");
    } catch (error) {
      toast.error(validationMessage(error, "Failed to delete section"));
    }
  }

  function startAddItem(sectionId: string) {
    setEditingSectionId(sectionId);
    setEditingItemIndex(null);
    setIsAddingItem(true);
    setItemFields([
      { key: "title", value: "" },
      { key: "description", value: "" },
    ]);
    setItemError(null);
  }

  function startEditItem(
    sectionId: string,
    index: number,
    item: Record<string, unknown>,
  ) {
    setExpandedSections((prev) => new Set(prev).add(sectionId));
    setEditingSectionId(sectionId);
    setEditingItemIndex(index);
    setIsAddingItem(false);
    const fields: ItemField[] = Object.entries(item).map(([key, value]) => ({
      key,
      value: value != null ? String(value) : "",
    }));
    if (fields.length === 0) {
      fields.push({ key: "title", value: "" });
    }
    setItemFields(fields);
    setItemError(null);
  }

  function cancelItemEdit() {
    setEditingSectionId(null);
    setEditingItemIndex(null);
    setIsAddingItem(false);
    setItemFields([
      { key: "title", value: "" },
      { key: "description", value: "" },
    ]);
    setItemError(null);
  }

  function addField() {
    setItemFields((prev) => [...prev, { key: "", value: "" }]);
    setItemError(null);
  }

  function removeField(index: number) {
    setItemFields((prev) => prev.filter((_, i) => i !== index));
    setItemError(null);
  }

  function updateFieldKey(index: number, key: string) {
    setItemFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, key } : f)),
    );
    setItemError(null);
  }

  function updateFieldValue(index: number, value: string) {
    setItemFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, value } : f)),
    );
    setItemError(null);
  }

  async function handleSaveItem(section: any) {
    const newItem: Record<string, unknown> = itemFieldsToRecord(itemFields);

    const currentItems: Record<string, unknown>[] = Array.isArray(section.items)
      ? [...section.items]
      : [];

    if (isAddingItem) {
      currentItems.push(newItem);
    } else if (editingItemIndex !== null) {
      currentItems[editingItemIndex] = newItem;
    }

    const validationError = validateItems(currentItems);
    if (validationError) {
      setItemError(validationError);
      return;
    }

    try {
      await updateSection.mutateAsync({
        id: section.id,
        items: currentItems,
      });
      toast.success(isAddingItem ? "Item added" : "Item updated");
      cancelItemEdit();
    } catch (error) {
      toast.error(validationMessage(error, "Failed to save item"));
    }
  }

  async function handleDeleteItem(section: any, index: number) {
    const currentItems: Record<string, unknown>[] = Array.isArray(section.items)
      ? [...section.items]
      : [];
    currentItems.splice(index, 1);

    const validationError = validateItems(currentItems);
    if (validationError) {
      setItemError(validationError);
      return;
    }

    try {
      await updateSection.mutateAsync({
        id: section.id,
        items: currentItems,
      });
      toast.success("Item deleted");
      if (editingSectionId === section.id && editingItemIndex === index) {
        cancelItemEdit();
      }
    } catch (error) {
      toast.error(validationMessage(error, "Failed to delete item"));
    }
  }

  const isDirty = useMemo(() => {
    if (showAddSection && addingSectionLabel.trim()) return true;
    if (!editingSectionId) return false;

    const hasDraftField = itemFields.some(
      (field) => field.key.trim() || field.value.trim(),
    );
    if (isAddingItem) return hasDraftField;
    if (editingItemIndex === null) return false;

    const section = customSections.find(
      (entry: { id: string }) => entry.id === editingSectionId,
    );
    const original = section?.items?.[editingItemIndex] as
      | Record<string, unknown>
      | undefined;
    if (!original) return hasDraftField;

    const originalRecord = Object.fromEntries(
      Object.entries(original).map(([key, value]) => [
        key,
        value != null ? String(value).trim() : "",
      ]),
    );

    return (
      JSON.stringify(itemFieldsToRecord(itemFields)) !==
      JSON.stringify(originalRecord)
    );
  }, [
    showAddSection,
    addingSectionLabel,
    editingSectionId,
    isAddingItem,
    editingItemIndex,
    itemFields,
    customSections,
  ]);

  useEditStepDirty("custom", isDirty);

  const renderItemForm = (
    section: { id: string; items?: unknown },
    mode: "add" | "edit",
  ) => {
    const candidateItems: Record<string, unknown>[] = Array.isArray(
      section.items,
    )
      ? [...section.items]
      : [];
    const newItem = itemFieldsToRecord(itemFields);
    if (mode === "add") {
      candidateItems.push(newItem);
    } else if (editingItemIndex !== null) {
      candidateItems[editingItemIndex] = newItem;
    }
    const validationError = validateItems(candidateItems);
    const visibleError = itemError ?? validationError;
    const errorId = `custom-section-${section.id}-items-error`;

    return (
      <Card className="border-primary/20 bg-muted/30">
        <CardContent className="space-y-3 pt-4">
          <p className="text-sm font-medium">
            {mode === "add" ? "New Item" : "Edit Item"}
          </p>
          {itemFields.map((field, fi) => (
            <div key={fi} className="flex items-start gap-2">
              <div className="w-1/3">
                <Input
                  placeholder="Field name"
                  value={field.key}
                  onChange={(e) => updateFieldKey(fi, e.target.value)}
                  className="text-sm"
                  aria-invalid={Boolean(visibleError)}
                  aria-describedby={visibleError ? errorId : undefined}
                />
              </div>
              <div className="flex-1">
                {field.value.length > 80 || field.key === "description" ? (
                  <Textarea
                    placeholder="Value"
                    value={field.value}
                    onChange={(e) => updateFieldValue(fi, e.target.value)}
                    rows={2}
                    className="text-sm"
                    aria-invalid={Boolean(visibleError)}
                    aria-describedby={visibleError ? errorId : undefined}
                  />
                ) : (
                  <Input
                    placeholder="Value"
                    value={field.value}
                    onChange={(e) => updateFieldValue(fi, e.target.value)}
                    className="text-sm"
                    aria-invalid={Boolean(visibleError)}
                    aria-describedby={visibleError ? errorId : undefined}
                  />
                )}
              </div>
              {itemFields.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeField(fi)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
          {visibleError && (
            <p id={errorId} className="text-sm text-destructive">
              {visibleError}
            </p>
          )}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={addField}>
              <Plus className="mr-1 h-3 w-3" />
              Add Field
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={cancelItemEdit}>
                Cancel
              </Button>
              <Button
                onClick={() => handleSaveItem(section)}
                disabled={isMutating || Boolean(validationError)}
              >
                {isMutating ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Check className="mr-1 h-3 w-3" />
                )}
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Custom Sections
          </h3>
          <p className="text-sm text-muted-foreground">
            Add any section to your portfolio — volunteer work, publications,
            languages, or anything else.
          </p>
        </div>
        {!showAddSection && (
          <Button
            onClick={() => {
              setShowAddSection(true);
              setSectionErrors({});
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
        )}
      </div>

      {showAddSection && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">New Section</CardTitle>
            <CardDescription>
              Give your section a name (e.g. &quot;Volunteer Work&quot;,
              &quot;Publications&quot;, &quot;Languages&quot;).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <FieldLabel
                htmlFor="sectionLabel"
                unsaved={addingSectionLabel.trim() !== ""}
              >
                Section Name
              </FieldLabel>
              <Input
                id="sectionLabel"
                value={addingSectionLabel}
                onChange={(e) => {
                  setAddingSectionLabel(e.target.value);
                  setSectionErrors({});
                }}
                placeholder="e.g. Volunteer Work"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSection();
                  }
                }}
                aria-invalid={Boolean(
                  sectionErrors.label ||
                    sectionErrors.sectionType ||
                    sectionValidationErrors.label ||
                    sectionValidationErrors.sectionType,
                )}
                aria-describedby={
                  sectionErrors.label ||
                  sectionErrors.sectionType ||
                  sectionValidationErrors.label ||
                  sectionValidationErrors.sectionType
                    ? "custom-section-label-error"
                    : undefined
                }
              />
              {(sectionErrors.label ||
                sectionErrors.sectionType ||
                sectionValidationErrors.label ||
                sectionValidationErrors.sectionType) && (
                <p
                  id="custom-section-label-error"
                  className="text-sm text-destructive"
                >
                  {sectionErrors.label ||
                    sectionErrors.sectionType ||
                    sectionValidationErrors.label ||
                    sectionValidationErrors.sectionType}
                </p>
              )}
            </div>
            {(sectionErrors.form || sectionValidationErrors.form) && (
              <p className="text-sm text-destructive">
                {sectionErrors.form || sectionValidationErrors.form}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddSection(false);
                  setAddingSectionLabel("");
                  setSectionErrors({});
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleAddSection}
                disabled={
                  isMutating || Object.keys(sectionValidationErrors).length > 0
                }
              >
                {isMutating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Create
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {customSections.length === 0 && !showAddSection ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Layers className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">
              No custom sections yet. Click &quot;Add Section&quot; to create
              one.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {customSections.map((section: any) => {
            const isExpanded = expandedSections.has(section.id);
            const items: Record<string, unknown>[] = Array.isArray(
              section.items,
            )
              ? section.items
              : [];

            return (
              <Card key={section.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      className="flex items-center gap-2 text-left"
                      onClick={() => toggleExpanded(section.id)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                      <CardTitle className="text-base">
                        {section.label}{" "}
                        <span className="text-muted-foreground font-normal">
                          ({items.length}{" "}
                          {items.length === 1 ? "item" : "items"})
                        </span>
                      </CardTitle>
                    </button>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          if (!isExpanded) toggleExpanded(section.id);
                          startAddItem(section.id);
                        }}
                        disabled={isMutating}
                        title="Add item"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDeleteSection(section.id)}
                        disabled={isMutating}
                        title="Delete section"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-3">
                    {editingSectionId === section.id && isAddingItem
                      ? renderItemForm(section, "add")
                      : null}

                    {items.length === 0 && editingSectionId !== section.id && (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No items yet. Click + to add one.
                      </p>
                    )}

                    {items.map((item, idx) => {
                      const title = item.title ?? item.name ?? item.label;
                      const desc =
                        item.description ?? item.details ?? item.summary;
                      const otherEntries = Object.entries(item).filter(
                        ([k]) =>
                          ![
                            "title",
                            "name",
                            "label",
                            "description",
                            "details",
                            "summary",
                          ].includes(k),
                      );
                      const isEditingItem =
                        editingSectionId === section.id &&
                        editingItemIndex === idx &&
                        !isAddingItem;

                      if (isEditingItem) {
                        return (
                          <div key={idx} ref={editingItemRef}>
                            {renderItemForm(section, "edit")}
                          </div>
                        );
                      }

                      return (
                        <div
                          key={idx}
                          className="flex items-start justify-between gap-3 rounded-lg border p-3"
                        >
                          <div className="flex-1 min-w-0 space-y-0.5">
                            {title != null && (
                              <p className="font-medium text-sm">
                                {String(title)}
                              </p>
                            )}
                            {desc != null && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {String(desc)}
                              </p>
                            )}
                            {otherEntries.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {otherEntries.map(([k, v]) =>
                                  v != null && v !== "" ? (
                                    <span
                                      key={k}
                                      className="text-xs bg-muted px-2 py-0.5 rounded"
                                    >
                                      {k}: {String(v)}
                                    </span>
                                  ) : null,
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() =>
                                startEditItem(section.id, idx, item)
                              }
                              disabled={isMutating}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleDeleteItem(section, idx)}
                              disabled={isMutating}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
