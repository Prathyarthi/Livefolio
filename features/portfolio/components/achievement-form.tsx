"use client";

import { useMemo, useState } from "react";
import {
  usePortfolio,
  useAddAchievement,
  useUpdateAchievement,
  useDeleteAchievement,
} from "@/features/portfolio/api/use-portfolio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Trophy,
  Calendar,
  X,
  Check,
} from "lucide-react";
import { useEditStepDirty } from "@/features/portfolio/context/edit-dirty-context";
import { useScrollIntoView } from "@/hooks/use-scroll-into-view";
import {
  fieldsDiffer,
  fieldDiffers,
  hasNonEmptyStringValues,
  normalizeDate,
} from "@/features/portfolio/lib/edit-step-dirty";
import {
  type FieldErrors,
  clientValidators,
  validationMessage,
  validateField,
} from "@/features/portfolio/lib/client-validation";
import { MAX_SHORT_LABEL_CHARS } from "@/lib/content-policy";

interface AchievementEntry {
  id?: string;
  title: string;
  date: string;
}

type AchievementField = "title";

const emptyEntry: AchievementEntry = {
  title: "",
  date: "",
};

export function AchievementForm() {
  const { data: portfolio, isLoading } = usePortfolio();
  const addAchievement = useAddAchievement();
  const updateAchievement = useUpdateAchievement();
  const deleteAchievement = useDeleteAchievement();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<AchievementEntry>(emptyEntry);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<AchievementField>>(
    {},
  );
  const editingCardRef = useScrollIntoView<HTMLDivElement>(Boolean(editingId));

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFieldErrors((errors) => ({
      ...errors,
      [e.target.name]: undefined,
    }));
  }

  function startEditing(ach: any) {
    setEditingId(ach.id);
    setIsAdding(false);
    setForm({
      id: ach.id,
      title: ach.title ?? "",
      date: ach.date ? ach.date.substring(0, 10) : "",
    });
    setFieldErrors({});
  }

  function cancelEditing() {
    setEditingId(null);
    setIsAdding(false);
    setForm(emptyEntry);
    setFieldErrors({});
  }

  const validationErrors = useMemo(() => {
    const errors: FieldErrors<AchievementField> = {};
    validateField(errors, "title", () =>
      clientValidators.requiredLabel(
        form.title,
        "Achievement title",
        MAX_SHORT_LABEL_CHARS,
      ),
    );
    return errors;
  }, [form.title]);

  async function handleAdd() {
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }
    try {
      await addAchievement.mutateAsync({
        title: form.title.trim(),
        date: form.date || null,
      });
      toast.success("Achievement added");
      cancelEditing();
    } catch (error) {
      toast.error(validationMessage(error, "Failed to add achievement"));
    }
  }

  async function handleUpdate() {
    if (!editingId) return;
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }
    try {
      await updateAchievement.mutateAsync({
        id: editingId,
        title: form.title.trim(),
        date: form.date || null,
      });
      toast.success("Achievement updated");
      cancelEditing();
    } catch (error) {
      toast.error(validationMessage(error, "Failed to update achievement"));
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAchievement.mutateAsync(id);
      toast.success("Achievement deleted");
      if (editingId === id) cancelEditing();
    } catch (error) {
      toast.error(validationMessage(error, "Failed to delete achievement"));
    }
  }

  const achievements = useMemo(
    () => portfolio?.achievements ?? [],
    [portfolio?.achievements],
  );

  const isDirty = useMemo(() => {
    if (!isAdding && !editingId) return false;
    if (isAdding) return hasNonEmptyStringValues(form);
    const original = achievements.find(
      (ach: { id: string }) => ach.id === editingId,
    );
    if (!original) return true;
    return fieldsDiffer(
      form,
      {
        title: original.title,
        date: normalizeDate(original.date),
      },
      ["title", "date"],
    );
  }, [isAdding, editingId, form, achievements]);

  useEditStepDirty("achievements", isDirty);

  const savedForm = useMemo((): AchievementEntry => {
    if (isAdding) return emptyEntry;
    if (!editingId) return emptyEntry;
    const original = achievements.find(
      (ach: { id: string }) => ach.id === editingId,
    );
    if (!original) return emptyEntry;
    return {
      title: original.title ?? "",
      date: normalizeDate(original.date),
    };
  }, [isAdding, editingId, achievements]);

  const isFieldUnsaved = (key: keyof AchievementEntry) =>
    isAdding || editingId
      ? fieldDiffers(form[key] ?? "", savedForm[key] ?? "")
      : false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isMutating =
    addAchievement.isPending ||
    updateAchievement.isPending ||
    deleteAchievement.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Achievements
          </h3>
          <p className="text-sm text-muted-foreground">
            Showcase your notable achievements, awards, and recognitions.
          </p>
        </div>
        {!isAdding && !editingId && (
          <Button
            onClick={() => {
              setIsAdding(true);
              setForm(emptyEntry);
              setFieldErrors({});
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Achievement
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">New Achievement</CardTitle>
            <CardDescription>Add a new achievement entry.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <FieldLabel htmlFor="title" unsaved={isFieldUnsaved("title")}>
                Title
              </FieldLabel>
              <Input
                id="title"
                name="title"
                value={form.title}
                onChange={handleChange}
                onBlur={() => setFieldErrors({ title: validationErrors.title })}
                placeholder="e.g., Won Best Innovation Award at TechConf 2025"
                aria-invalid={Boolean(
                  fieldErrors.title || validationErrors.title,
                )}
                aria-describedby={
                  fieldErrors.title || validationErrors.title
                    ? "achievement-title-error"
                    : undefined
                }
              />
              {(fieldErrors.title || validationErrors.title) && (
                <p
                  id="achievement-title-error"
                  className="text-sm text-destructive"
                >
                  {fieldErrors.title || validationErrors.title}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="date" unsaved={isFieldUnsaved("date")}>
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Date (optional)
              </FieldLabel>
              <Input
                id="date"
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelEditing}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={
                  isMutating || Object.keys(validationErrors).length > 0
                }
              >
                {isMutating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {achievements.length === 0 && !isAdding ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Trophy className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">
              No achievements added yet. Click &quot;Add Achievement&quot; to
              get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {achievements.map((ach: any) => (
            <div
              key={ach.id}
              ref={editingId === ach.id ? editingCardRef : undefined}
            >
              <Card className={editingId === ach.id ? "border-primary/30" : ""}>
                {editingId === ach.id ? (
                  <CardContent className="space-y-4 pt-6">
                    <div>
                      <h4 className="text-base font-semibold">
                        Edit Achievement
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Update this achievement entry.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <FieldLabel
                        htmlFor={`title-${ach.id}`}
                        unsaved={isFieldUnsaved("title")}
                      >
                        Title
                      </FieldLabel>
                      <Input
                        id={`title-${ach.id}`}
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        onBlur={() =>
                          setFieldErrors({ title: validationErrors.title })
                        }
                        placeholder="e.g., Won Best Innovation Award at TechConf 2025"
                        aria-invalid={Boolean(
                          fieldErrors.title || validationErrors.title,
                        )}
                        aria-describedby={
                          fieldErrors.title || validationErrors.title
                            ? `achievement-title-${ach.id}-error`
                            : undefined
                        }
                      />
                      {(fieldErrors.title || validationErrors.title) && (
                        <p
                          id={`achievement-title-${ach.id}-error`}
                          className="text-sm text-destructive"
                        >
                          {fieldErrors.title || validationErrors.title}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <FieldLabel
                        htmlFor={`date-${ach.id}`}
                        unsaved={isFieldUnsaved("date")}
                      >
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        Date (optional)
                      </FieldLabel>
                      <Input
                        id={`date-${ach.id}`}
                        name="date"
                        type="date"
                        value={form.date}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={cancelEditing}>
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUpdate}
                        disabled={
                          isMutating || Object.keys(validationErrors).length > 0
                        }
                      >
                        {isMutating ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="mr-2 h-4 w-4" />
                        )}
                        Save
                      </Button>
                    </div>
                  </CardContent>
                ) : (
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-base">{ach.title}</h4>
                        {ach.date && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            {ach.date.substring(0, 10)}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => startEditing(ach)}
                          disabled={isMutating}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(ach.id)}
                          disabled={isMutating}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
