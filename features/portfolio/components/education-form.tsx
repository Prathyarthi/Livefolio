"use client";

import { useMemo, useState } from "react";
import {
  usePortfolio,
  useAddEducation,
  useUpdateEducation,
  useDeleteEducation,
} from "@/features/portfolio/api/use-portfolio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/features/portfolio/components/field-label";
import { RichTextEditor } from "@/components/rich-text-editor";
import { RichText } from "@/components/rich-text";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  GraduationCap,
  School,
  BookOpen,
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
  clientValidators,
  type FieldErrors,
  validateField,
  validationMessage,
} from "@/features/portfolio/lib/client-validation";
import { EDUCATION_SCORE_LABEL } from "@/features/templates/section-labels";

interface EducationEntry {
  id?: string;
  institution: string;
  degree: string;
  field: string;
  description: string;
  startDate: string;
  endDate: string;
  gpa: string;
}

const emptyEntry: EducationEntry = {
  institution: "",
  degree: "",
  field: "",
  description: "",
  startDate: "",
  endDate: "",
  gpa: "",
};

const EDUCATION_KEYS = [
  "institution",
  "degree",
  "field",
  "description",
  "startDate",
  "endDate",
  "gpa",
] as const;

type EducationField = Exclude<keyof EducationEntry, "id">;

function validateEducationForm(form: EducationEntry) {
  const errors: FieldErrors<EducationField> = {};
  validateField(errors, "institution", () =>
    clientValidators.requiredLabel(form.institution, "Institution")
  );
  validateField(errors, "degree", () =>
    clientValidators.requiredLabel(form.degree, "Degree")
  );
  validateField(errors, "field", () =>
    clientValidators.optionalLabel(form.field, "Field of study")
  );
  validateField(errors, "gpa", () =>
    clientValidators.optionalLabel(form.gpa, EDUCATION_SCORE_LABEL)
  );
  validateField(errors, "description", () =>
    clientValidators.longText(form.description, "Education description")
  );
  return errors;
}

function FieldError({ error }: { error?: string }) {
  return error ? (
    <p className="text-sm text-destructive" role="alert">
      {error}
    </p>
  ) : null;
}

function toEducationPayload(form: EducationEntry) {
  return {
    institution: form.institution.trim(),
    degree: form.degree.trim(),
    field: form.field || null,
    description: form.description || null,
    startDate: form.startDate || null,
    endDate: form.endDate || null,
    gpa: form.gpa || null,
  };
}

function fromSavedEducation(edu: {
  institution?: string | null;
  degree?: string | null;
  field?: string | null;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  gpa?: string | null;
}): EducationEntry {
  return {
    institution: edu.institution ?? "",
    degree: edu.degree ?? "",
    field: edu.field ?? "",
    description: edu.description ?? "",
    startDate: normalizeDate(edu.startDate),
    endDate: normalizeDate(edu.endDate),
    gpa: edu.gpa ?? "",
  };
}

function EducationFields({
  idPrefix,
  form,
  fieldErrors,
  currentErrors,
  isFieldUnsaved,
  onChange,
  onRichChange,
  onBlur,
}: {
  idPrefix: string;
  form: EducationEntry;
  fieldErrors: FieldErrors<EducationField>;
  currentErrors: FieldErrors<EducationField>;
  isFieldUnsaved: (key: EducationField) => boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRichChange: (field: EducationField, value: string) => void;
  onBlur: (field: EducationField) => void;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel
            htmlFor={`${idPrefix}-institution`}
            unsaved={isFieldUnsaved("institution")}
          >
            <School className="h-4 w-4 text-muted-foreground" />
            Institution
          </FieldLabel>
          <RichTextEditor
            id={`${idPrefix}-institution`}
            singleLine
            value={form.institution}
            onChange={(institution) => onRichChange("institution", institution)}
            onBlur={() => onBlur("institution")}
            aria-invalid={Boolean(currentErrors.institution)}
            placeholder="MIT"
          />
          <FieldError error={fieldErrors.institution} />
        </div>
        <div className="space-y-2">
          <FieldLabel
            htmlFor={`${idPrefix}-degree`}
            unsaved={isFieldUnsaved("degree")}
          >
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            Degree
          </FieldLabel>
          <RichTextEditor
            id={`${idPrefix}-degree`}
            singleLine
            value={form.degree}
            onChange={(degree) => onRichChange("degree", degree)}
            onBlur={() => onBlur("degree")}
            aria-invalid={Boolean(currentErrors.degree)}
            placeholder="Bachelor of Science"
          />
          <FieldError error={fieldErrors.degree} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel
            htmlFor={`${idPrefix}-field`}
            unsaved={isFieldUnsaved("field")}
          >
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            Field of Study
          </FieldLabel>
          <RichTextEditor
            id={`${idPrefix}-field`}
            singleLine
            value={form.field}
            onChange={(field) => onRichChange("field", field)}
            onBlur={() => onBlur("field")}
            aria-invalid={Boolean(currentErrors.field)}
            placeholder="Computer Science"
          />
          <FieldError error={fieldErrors.field} />
        </div>
        <div className="space-y-2">
          <FieldLabel htmlFor={`${idPrefix}-gpa`} unsaved={isFieldUnsaved("gpa")}>
            {EDUCATION_SCORE_LABEL}
          </FieldLabel>
          <Input
            id={`${idPrefix}-gpa`}
            name="gpa"
            value={form.gpa}
            onChange={onChange}
            onBlur={() => onBlur("gpa")}
            aria-invalid={Boolean(currentErrors.gpa)}
            placeholder="3.9 / 4.0 or 85%"
          />
          <FieldError error={fieldErrors.gpa} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel
            htmlFor={`${idPrefix}-startDate`}
            unsaved={isFieldUnsaved("startDate")}
          >
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Start Date
          </FieldLabel>
          <Input
            id={`${idPrefix}-startDate`}
            name="startDate"
            type="date"
            value={form.startDate}
            onChange={onChange}
          />
        </div>
        <div className="space-y-2">
          <FieldLabel
            htmlFor={`${idPrefix}-endDate`}
            unsaved={isFieldUnsaved("endDate")}
          >
            <Calendar className="h-4 w-4 text-muted-foreground" />
            End Date
          </FieldLabel>
          <Input
            id={`${idPrefix}-endDate`}
            name="endDate"
            type="date"
            value={form.endDate}
            onChange={onChange}
          />
        </div>
      </div>

      <div className="space-y-2">
        <FieldLabel
          htmlFor={`${idPrefix}-description`}
          unsaved={isFieldUnsaved("description")}
        >
          Description
        </FieldLabel>
        <RichTextEditor
          id={`${idPrefix}-description`}
          value={form.description}
          onChange={(description) => onRichChange("description", description)}
          onBlur={() => onBlur("description")}
          aria-invalid={Boolean(currentErrors.description)}
          placeholder="Notable coursework, achievements, activities..."
          minHeight="6rem"
        />
        <FieldError error={fieldErrors.description} />
      </div>
    </>
  );
}

export function EducationForm() {
  const { data: portfolio, isLoading } = usePortfolio();
  const addEducation = useAddEducation();
  const updateEducation = useUpdateEducation();
  const deleteEducation = useDeleteEducation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<EducationEntry>(emptyEntry);
  const [fieldErrors, setFieldErrors] =
    useState<FieldErrors<EducationField>>({});
  const editingCardRef = useScrollIntoView<HTMLDivElement>(Boolean(editingId));

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const field = e.target.name as EducationField;
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleRichChange(field: EducationField, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleBlur(field: EducationField) {
    const error = validateEducationForm(form)[field];
    setFieldErrors((prev) => ({ ...prev, [field]: error }));
  }

  function startEditing(edu: any) {
    setEditingId(edu.id);
    setIsAdding(false);
    setFieldErrors({});
    setForm({ id: edu.id, ...fromSavedEducation(edu) });
  }

  function cancelEditing() {
    setEditingId(null);
    setIsAdding(false);
    setForm(emptyEntry);
    setFieldErrors({});
  }

  async function handleAdd() {
    const errors = validateEducationForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await addEducation.mutateAsync(toEducationPayload(form));
      toast.success("Education added");
      cancelEditing();
    } catch (error) {
      toast.error(validationMessage(error, "Failed to add education"));
    }
  }

  async function handleUpdate() {
    if (!editingId) return;
    const errors = validateEducationForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await updateEducation.mutateAsync({
        id: editingId,
        ...toEducationPayload(form),
      });
      toast.success("Education updated");
      cancelEditing();
    } catch (error) {
      toast.error(validationMessage(error, "Failed to update education"));
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteEducation.mutateAsync(id);
      toast.success("Education deleted");
      if (editingId === id) cancelEditing();
    } catch (error) {
      toast.error(validationMessage(error, "Failed to delete education"));
    }
  }

  const educations = portfolio?.educations ?? [];

  const isDirty = useMemo(() => {
    if (!isAdding && !editingId) return false;
    if (isAdding) return hasNonEmptyStringValues(form);
    const original = educations.find(
      (edu: { id: string }) => edu.id === editingId
    );
    if (!original) return true;
    return fieldsDiffer(form, fromSavedEducation(original), EDUCATION_KEYS);
  }, [isAdding, editingId, form, educations]);

  useEditStepDirty("education", isDirty);

  const savedForm = useMemo((): EducationEntry => {
    if (isAdding || !editingId) return emptyEntry;
    const original = educations.find(
      (edu: { id: string }) => edu.id === editingId
    );
    if (!original) return emptyEntry;
    return fromSavedEducation(original);
  }, [isAdding, editingId, educations]);

  const isFieldUnsaved = (key: EducationField) =>
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
    addEducation.isPending ||
    updateEducation.isPending ||
    deleteEducation.isPending;
  const currentErrors = validateEducationForm(form);
  const isFormValid = Object.keys(currentErrors).length === 0;

  const fields = (
    <EducationFields
      idPrefix={editingId ? `edu-${editingId}` : "edu"}
      form={form}
      fieldErrors={fieldErrors}
      currentErrors={currentErrors}
      isFieldUnsaved={isFieldUnsaved}
      onChange={handleChange}
      onRichChange={handleRichChange}
      onBlur={handleBlur}
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Education
          </h3>
          <p className="text-sm text-muted-foreground">
            Add your degrees, certifications, and academic achievements.
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
            Add Education
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">New Education</CardTitle>
            <CardDescription>
              Add a new education entry to your portfolio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelEditing}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={isMutating || !isFormValid}
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

      {educations.length === 0 && !isAdding ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <GraduationCap className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">
              No education added yet. Click &quot;Add Education&quot; to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {educations.map((edu: any) => (
            <div
              key={edu.id}
              ref={editingId === edu.id ? editingCardRef : undefined}
            >
              <Card className={editingId === edu.id ? "border-primary/30" : ""}>
                {editingId === edu.id ? (
                  <CardContent className="space-y-4 pt-6">
                    <div>
                      <h4 className="text-base font-semibold">Edit Education</h4>
                      <p className="text-sm text-muted-foreground">
                        Update this education entry.
                      </p>
                    </div>
                    {fields}
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={cancelEditing}>
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUpdate}
                        disabled={isMutating || !isFormValid}
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
                        <h4 className="font-semibold text-base">
                          <RichText text={edu.degree} />
                          {edu.field && (
                            <span className="text-muted-foreground font-normal">
                              {" "}
                              in <RichText text={edu.field} />
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <School className="h-3.5 w-3.5" />
                          <RichText text={edu.institution} />
                          {edu.gpa && (
                            <span className="ml-2 text-xs">{edu.gpa}</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          {edu.startDate?.substring(0, 10)}
                          {" -- "}
                          {edu.endDate ? edu.endDate.substring(0, 10) : "Present"}
                        </p>
                        {edu.description && (
                          <>
                            <Separator className="my-3" />
                            <div className="text-sm text-muted-foreground">
                              <RichText text={edu.description} as="p" />
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => startEditing(edu)}
                          disabled={isMutating}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(edu.id)}
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