"use client";

import { useMemo, useState } from "react";
import {
  usePortfolio,
  useAddEducation,
  useDeleteEducation,
} from "@/features/portfolio/api/use-portfolio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/features/portfolio/components/field-label";
import { Textarea } from "@/components/ui/textarea";
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
  Trash2,
  GraduationCap,
  School,
  BookOpen,
  Calendar,
  X,
  Check,
} from "lucide-react";
import { useEditStepDirty } from "@/features/portfolio/context/edit-dirty-context";
import { hasNonEmptyStringValues, fieldDiffers } from "@/features/portfolio/lib/edit-step-dirty";
import {
  clientValidators,
  type FieldErrors,
  validateField,
  validationMessage,
} from "@/features/portfolio/lib/client-validation";

interface EducationEntry {
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

type EducationField = keyof EducationEntry;

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
    clientValidators.optionalLabel(form.gpa, "GPA")
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

export function EducationForm() {
  const { data: portfolio, isLoading } = usePortfolio();
  const addEducation = useAddEducation();
  const deleteEducation = useDeleteEducation();

  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<EducationEntry>(emptyEntry);
  const [fieldErrors, setFieldErrors] =
    useState<FieldErrors<EducationField>>({});

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const field = e.target.name as EducationField;
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleBlur(field: EducationField) {
    const error = validateEducationForm(form)[field];
    setFieldErrors((prev) => ({ ...prev, [field]: error }));
  }

  function cancelAdding() {
    setIsAdding(false);
    setForm(emptyEntry);
    setFieldErrors({});
  }

  async function handleAdd() {
    const errors = validateEducationForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await addEducation.mutateAsync({
        institution: form.institution.trim(),
        degree: form.degree.trim(),
        field: form.field || null,
        description: form.description || null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        gpa: form.gpa || null,
      });
      toast.success("Education added");
      cancelAdding();
    } catch (error) {
      toast.error(validationMessage(error, "Failed to add education"));
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteEducation.mutateAsync(id);
      toast.success("Education deleted");
    } catch (error) {
      toast.error(validationMessage(error, "Failed to delete education"));
    }
  }

  const isDirty = useMemo(
    () => isAdding && hasNonEmptyStringValues(form),
    [isAdding, form]
  );
  useEditStepDirty("education", isDirty);

  const isFieldUnsaved = (key: keyof EducationEntry) =>
    isAdding ? fieldDiffers(form[key], emptyEntry[key]) : false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const educations = portfolio?.educations ?? [];
  const isMutating = addEducation.isPending || deleteEducation.isPending;
  const currentErrors = validateEducationForm(form);
  const isFormValid = Object.keys(currentErrors).length === 0;

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
        {!isAdding && (
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

      {/* Add Form */}
      {isAdding && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">New Education</CardTitle>
            <CardDescription>
              Add a new education entry to your portfolio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel htmlFor="institution" unsaved={isFieldUnsaved("institution")}>
                  <School className="h-4 w-4 text-muted-foreground" />
                  Institution
                </FieldLabel>
                <Input
                  id="institution"
                  name="institution"
                  value={form.institution}
                  onChange={handleChange}
                  onBlur={() => handleBlur("institution")}
                  aria-invalid={Boolean(currentErrors.institution)}
                  placeholder="MIT"
                />
                <FieldError error={fieldErrors.institution} />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="degree" unsaved={isFieldUnsaved("degree")}>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  Degree
                </FieldLabel>
                <Input
                  id="degree"
                  name="degree"
                  value={form.degree}
                  onChange={handleChange}
                  onBlur={() => handleBlur("degree")}
                  aria-invalid={Boolean(currentErrors.degree)}
                  placeholder="Bachelor of Science"
                />
                <FieldError error={fieldErrors.degree} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel htmlFor="field" unsaved={isFieldUnsaved("field")}>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  Field of Study
                </FieldLabel>
                <Input
                  id="field"
                  name="field"
                  value={form.field}
                  onChange={handleChange}
                  onBlur={() => handleBlur("field")}
                  aria-invalid={Boolean(currentErrors.field)}
                  placeholder="Computer Science"
                />
                <FieldError error={fieldErrors.field} />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="gpa" unsaved={isFieldUnsaved("gpa")}>
                  GPA
                </FieldLabel>
                <Input
                  id="gpa"
                  name="gpa"
                  value={form.gpa}
                  onChange={handleChange}
                  onBlur={() => handleBlur("gpa")}
                  aria-invalid={Boolean(currentErrors.gpa)}
                  placeholder="3.9 / 4.0"
                />
                <FieldError error={fieldErrors.gpa} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel htmlFor="edu-startDate" unsaved={isFieldUnsaved("startDate")}>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Start Date
                </FieldLabel>
                <Input
                  id="edu-startDate"
                  name="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="edu-endDate" unsaved={isFieldUnsaved("endDate")}>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  End Date
                </FieldLabel>
                <Input
                  id="edu-endDate"
                  name="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="edu-description" unsaved={isFieldUnsaved("description")}>
                Description
              </FieldLabel>
              <Textarea
                id="edu-description"
                name="description"
                value={form.description}
                onChange={handleChange}
                onBlur={() => handleBlur("description")}
                aria-invalid={Boolean(currentErrors.description)}
                placeholder="Notable coursework, achievements, activities..."
                rows={3}
              />
              <FieldError error={fieldErrors.description} />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelAdding}>
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

      {/* Education List */}
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
            <Card key={edu.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-base">
                      {edu.degree}
                      {edu.field && (
                        <span className="text-muted-foreground font-normal">
                          {" "}
                          in {edu.field}
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <School className="h-3.5 w-3.5" />
                      {edu.institution}
                      {edu.gpa && (
                        <span className="ml-2 text-xs">GPA: {edu.gpa}</span>
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
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {edu.description}
                        </p>
                      </>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(edu.id)}
                    disabled={isMutating}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
