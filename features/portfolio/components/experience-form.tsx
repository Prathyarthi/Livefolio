"use client";

import { useMemo, useState } from "react";
import {
  usePortfolio,
  useAddExperience,
  useUpdateExperience,
  useDeleteExperience,
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
  Pencil,
  Trash2,
  Briefcase,
  Building2,
  MapPin,
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

interface ExperienceEntry {
  id?: string;
  company: string;
  role: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
}

const emptyEntry: ExperienceEntry = {
  company: "",
  role: "",
  description: "",
  startDate: "",
  endDate: "",
  location: "",
};

type ExperienceField = Exclude<keyof ExperienceEntry, "id">;

function validateExperienceForm(form: ExperienceEntry) {
  const errors: FieldErrors<ExperienceField> = {};
  validateField(errors, "company", () =>
    clientValidators.requiredLabel(form.company, "Company")
  );
  validateField(errors, "role", () =>
    clientValidators.requiredLabel(form.role, "Role")
  );
  validateField(errors, "description", () =>
    clientValidators.longText(form.description, "Experience description")
  );
  validateField(errors, "location", () =>
    clientValidators.optionalLabel(form.location, "Experience location")
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

export function ExperienceForm() {
  const { data: portfolio, isLoading } = usePortfolio();
  const addExperience = useAddExperience();
  const updateExperience = useUpdateExperience();
  const deleteExperience = useDeleteExperience();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<ExperienceEntry>(emptyEntry);
  const [fieldErrors, setFieldErrors] =
    useState<FieldErrors<ExperienceField>>({});
  const editingCardRef = useScrollIntoView<HTMLDivElement>(Boolean(editingId));

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const field = e.target.name as ExperienceField;
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleBlur(field: ExperienceField) {
    const error = validateExperienceForm(form)[field];
    setFieldErrors((prev) => ({ ...prev, [field]: error }));
  }

  function startEditing(exp: any) {
    setEditingId(exp.id);
    setIsAdding(false);
    setFieldErrors({});
    setForm({
      id: exp.id,
      company: exp.company ?? "",
      role: exp.role ?? "",
      description: exp.description ?? "",
      startDate: exp.startDate ? exp.startDate.substring(0, 10) : "",
      endDate: exp.endDate ? exp.endDate.substring(0, 10) : "",
      location: exp.location ?? "",
    });
  }

  function cancelEditing() {
    setEditingId(null);
    setIsAdding(false);
    setForm(emptyEntry);
    setFieldErrors({});
  }

  async function handleAdd() {
    const errors = validateExperienceForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await addExperience.mutateAsync({
        company: form.company.trim(),
        role: form.role.trim(),
        description: form.description,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        location: form.location || null,
      });
      toast.success("Experience added");
      cancelEditing();
    } catch (error) {
      toast.error(validationMessage(error, "Failed to add experience"));
    }
  }

  async function handleUpdate() {
    if (!editingId) return;
    const errors = validateExperienceForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await updateExperience.mutateAsync({
        id: editingId,
        company: form.company.trim(),
        role: form.role.trim(),
        description: form.description,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        location: form.location || null,
      });
      toast.success("Experience updated");
      cancelEditing();
    } catch (error) {
      toast.error(validationMessage(error, "Failed to update experience"));
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteExperience.mutateAsync(id);
      toast.success("Experience deleted");
      if (editingId === id) cancelEditing();
    } catch (error) {
      toast.error(validationMessage(error, "Failed to delete experience"));
    }
  }

  const experiences = portfolio?.experiences ?? [];

  const isDirty = useMemo(() => {
    if (!isAdding && !editingId) return false;
    if (isAdding) return hasNonEmptyStringValues(form);
    const original = experiences.find(
      (exp: { id: string }) => exp.id === editingId
    );
    if (!original) return true;
    return fieldsDiffer(
      form,
      {
        company: original.company,
        role: original.role,
        description: original.description ?? "",
        startDate: normalizeDate(original.startDate),
        endDate: normalizeDate(original.endDate),
        location: original.location ?? "",
      },
      ["company", "role", "description", "startDate", "endDate", "location"]
    );
  }, [isAdding, editingId, form, experiences]);

  useEditStepDirty("experience", isDirty);

  const savedForm = useMemo((): ExperienceEntry => {
    if (isAdding) return emptyEntry;
    if (!editingId) return emptyEntry;
    const original = experiences.find(
      (exp: { id: string }) => exp.id === editingId
    );
    if (!original) return emptyEntry;
    return {
      company: original.company ?? "",
      role: original.role ?? "",
      description: original.description ?? "",
      startDate: normalizeDate(original.startDate),
      endDate: normalizeDate(original.endDate),
      location: original.location ?? "",
    };
  }, [isAdding, editingId, experiences]);

  const isFieldUnsaved = (key: keyof ExperienceEntry) =>
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
    addExperience.isPending ||
    updateExperience.isPending ||
    deleteExperience.isPending;
  const currentErrors = validateExperienceForm(form);
  const isFormValid = Object.keys(currentErrors).length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Work Experience
          </h3>
          <p className="text-sm text-muted-foreground">
            Add your professional experience, most recent first.
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
            Add Experience
          </Button>
        )}
      </div>

      {/* Add Form */}
      {isAdding && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">New Experience</CardTitle>
            <CardDescription>
              Add a new work experience entry.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel htmlFor="company" unsaved={isFieldUnsaved("company")}>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Company
                </FieldLabel>
                <Input
                  id="company"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  onBlur={() => handleBlur("company")}
                  aria-invalid={Boolean(currentErrors.company)}
                  placeholder="Google"
                />
                <FieldError error={fieldErrors.company} />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="role" unsaved={isFieldUnsaved("role")}>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  Role
                </FieldLabel>
                <Input
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  onBlur={() => handleBlur("role")}
                  aria-invalid={Boolean(currentErrors.role)}
                  placeholder="Senior Software Engineer"
                />
                <FieldError error={fieldErrors.role} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <FieldLabel htmlFor="startDate" unsaved={isFieldUnsaved("startDate")}>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Start Date
                </FieldLabel>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={handleChange}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="endDate" unsaved={isFieldUnsaved("endDate")}>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  End Date
                </FieldLabel>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={handleChange}
                  placeholder="Leave blank if current"
                />
              </div>
              <div className="space-y-2">
                <FieldLabel
                  htmlFor="exp-location"
                  unsaved={isFieldUnsaved("location")}
                >
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Location
                </FieldLabel>
                <Input
                  id="exp-location"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  onBlur={() => handleBlur("location")}
                  aria-invalid={Boolean(currentErrors.location)}
                  placeholder="San Francisco, CA"
                />
                <FieldError error={fieldErrors.location} />
              </div>
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="description" unsaved={isFieldUnsaved("description")}>
                Description
              </FieldLabel>
              <Textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                onBlur={() => handleBlur("description")}
                aria-invalid={Boolean(currentErrors.description)}
                placeholder="Describe your responsibilities, achievements, and impact..."
                rows={4}
              />
              <FieldError error={fieldErrors.description} />
            </div>

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

      {/* Experience List */}
      {experiences.length === 0 && !isAdding ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Briefcase className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">
              No experience added yet. Click &quot;Add Experience&quot; to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {experiences.map((exp: any) => (
            <div
              key={exp.id}
              ref={editingId === exp.id ? editingCardRef : undefined}
            >
            <Card
              className={editingId === exp.id ? "border-primary/30" : ""}
            >
              {editingId === exp.id ? (
                <CardContent className="space-y-4 pt-6">
                  <div>
                    <h4 className="text-base font-semibold">Edit Experience</h4>
                    <p className="text-sm text-muted-foreground">
                      Update this experience entry.
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <FieldLabel htmlFor={`company-${exp.id}`} unsaved={isFieldUnsaved("company")}>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        Company
                      </FieldLabel>
                      <Input
                        id={`company-${exp.id}`}
                        name="company"
                        value={form.company}
                        onChange={handleChange}
                        onBlur={() => handleBlur("company")}
                        aria-invalid={Boolean(currentErrors.company)}
                        placeholder="Google"
                      />
                      <FieldError error={fieldErrors.company} />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel htmlFor={`role-${exp.id}`} unsaved={isFieldUnsaved("role")}>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        Role
                      </FieldLabel>
                      <Input
                        id={`role-${exp.id}`}
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        onBlur={() => handleBlur("role")}
                        aria-invalid={Boolean(currentErrors.role)}
                        placeholder="Senior Software Engineer"
                      />
                      <FieldError error={fieldErrors.role} />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <FieldLabel htmlFor={`startDate-${exp.id}`} unsaved={isFieldUnsaved("startDate")}>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        Start Date
                      </FieldLabel>
                      <Input
                        id={`startDate-${exp.id}`}
                        name="startDate"
                        type="date"
                        value={form.startDate}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel htmlFor={`endDate-${exp.id}`} unsaved={isFieldUnsaved("endDate")}>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        End Date
                      </FieldLabel>
                      <Input
                        id={`endDate-${exp.id}`}
                        name="endDate"
                        type="date"
                        value={form.endDate}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel htmlFor={`exp-location-${exp.id}`} unsaved={isFieldUnsaved("location")}>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        Location
                      </FieldLabel>
                      <Input
                        id={`exp-location-${exp.id}`}
                        name="location"
                        value={form.location}
                        onChange={handleChange}
                        onBlur={() => handleBlur("location")}
                        aria-invalid={Boolean(currentErrors.location)}
                        placeholder="San Francisco, CA"
                      />
                      <FieldError error={fieldErrors.location} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <FieldLabel htmlFor={`description-${exp.id}`} unsaved={isFieldUnsaved("description")}>
                      Description
                    </FieldLabel>
                    <Textarea
                      id={`description-${exp.id}`}
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      onBlur={() => handleBlur("description")}
                      aria-invalid={Boolean(currentErrors.description)}
                      placeholder="Describe your responsibilities, achievements, and impact..."
                      rows={4}
                    />
                    <FieldError error={fieldErrors.description} />
                  </div>

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
                    <h4 className="font-semibold text-base">{exp.role}</h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <Building2 className="h-3.5 w-3.5" />
                      {exp.company}
                      {exp.location && (
                        <>
                          <span className="mx-1">--</span>
                          <MapPin className="h-3.5 w-3.5" />
                          {exp.location}
                        </>
                      )}
                    </p>
                    {(exp.startDate || exp.endDate) && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        {exp.startDate ? exp.startDate.substring(0, 10) : ""}
                        {exp.startDate && exp.endDate && " -- "}
                        {exp.endDate ? exp.endDate.substring(0, 10) : (exp.startDate ? "Present" : "")}
                      </p>
                    )}
                    {exp.description && (
                      <>
                        <Separator className="my-3" />
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {exp.description}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => startEditing(exp)}
                      disabled={isMutating}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(exp.id)}
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
