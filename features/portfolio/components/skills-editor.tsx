"use client";

import { useMemo, useState } from "react";
import { useEditStepDirty } from "@/features/portfolio/context/edit-dirty-context";
import {
  usePortfolio,
  useAddSkill,
  useDeleteSkill,
} from "@/features/portfolio/api/use-portfolio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldLabel } from "@/features/portfolio/components/field-label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, X, Wrench, Code2, Boxes, Brain } from "lucide-react";
import {
  type FieldErrors,
  clientValidators,
  validationMessage,
  validateField,
} from "@/features/portfolio/lib/client-validation";
import { MAX_SKILL_FIELD_CHARS, MAX_SKILLS } from "@/lib/content-policy";

const CATEGORIES = [
  { value: "language", label: "Language", icon: Code2 },
  { value: "framework", label: "Framework", icon: Boxes },
  { value: "tool", label: "Tool", icon: Wrench },
  { value: "soft-skill", label: "Soft Skill", icon: Brain },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  language: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  framework:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  tool: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  "soft-skill":
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
};

type SkillField = "name" | "category" | "form";

export function SkillsEditor() {
  const { data: portfolio, isLoading } = usePortfolio();
  const addSkill = useAddSkill();
  const deleteSkill = useDeleteSkill();

  const [skillName, setSkillName] = useState("");
  const [category, setCategory] = useState<string>("language");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<SkillField>>({});

  useEditStepDirty("skills", skillName.trim() !== "");

  const skills = useMemo(() => portfolio?.skills ?? [], [portfolio?.skills]);
  const validationErrors = useMemo(() => {
    const errors: FieldErrors<SkillField> = {};
    validateField(errors, "name", () =>
      clientValidators.requiredLabel(
        skillName,
        "Skill name",
        MAX_SKILL_FIELD_CHARS,
      ),
    );
    validateField(errors, "category", () =>
      clientValidators.requiredLabel(
        category,
        "Skill category",
        MAX_SKILL_FIELD_CHARS,
      ),
    );
    if (skills.length >= MAX_SKILLS) {
      errors.form = `Skills must contain at most ${MAX_SKILLS} items`;
    } else if (
      skills.some(
        (skill: { name: string; category: string }) =>
          String(skill.name).trim().toLowerCase() ===
            skillName.trim().toLowerCase() &&
          String(skill.category).trim().toLowerCase() ===
            category.trim().toLowerCase(),
      )
    ) {
      errors.name = "Skill already exists in this category";
    }
    return errors;
  }, [category, skillName, skills]);

  async function handleAdd() {
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    const name = skillName.trim();
    try {
      await addSkill.mutateAsync({ name, category });
      setSkillName("");
      setFieldErrors({});
      toast.success(`Added "${name}"`);
    } catch (error) {
      toast.error(validationMessage(error, "Failed to add skill"));
    }
  }

  async function handleDelete(id: string, name: string) {
    try {
      await deleteSkill.mutateAsync(id);
      toast.success(`Removed "${name}"`);
    } catch (error) {
      toast.error(validationMessage(error, "Failed to remove skill"));
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
      </div>
    );
  }

  const isMutating = addSkill.isPending || deleteSkill.isPending;

  // Group skills by category
  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    skills: skills.filter((s: any) => s.category === cat.value),
  }));
  const uncategorized = skills.filter(
    (s: any) => !CATEGORIES.some((c) => c.value === s.category),
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Skills
        </h3>
        <p className="text-sm text-text-muted">
          Add your technical and soft skills. They will be grouped by category.
        </p>
      </div>

      {/* Add Skill */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a Skill</CardTitle>
          <CardDescription>
            Type a skill name, choose a category, and press Enter or click Add.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <FieldLabel
                htmlFor="skill-name"
                unsaved={skillName.trim() !== ""}
              >
                Skill Name
              </FieldLabel>
              <Input
                id="skill-name"
                value={skillName}
                onChange={(e) => {
                  setSkillName(e.target.value);
                  setFieldErrors((errors) => ({
                    ...errors,
                    name: undefined,
                    form: undefined,
                  }));
                }}
                onBlur={() =>
                  setFieldErrors((errors) => ({
                    ...errors,
                    name: validationErrors.name,
                    form: validationErrors.form,
                  }))
                }
                onKeyDown={handleKeyDown}
                placeholder="e.g. TypeScript, React, Docker..."
                aria-invalid={Boolean(
                  fieldErrors.name || validationErrors.name,
                )}
                aria-describedby={
                  fieldErrors.name || validationErrors.name
                    ? "skill-name-error"
                    : undefined
                }
              />
              {(fieldErrors.name || validationErrors.name) && (
                <p id="skill-name-error" className="text-sm text-danger">
                  {fieldErrors.name || validationErrors.name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(value) => {
                  setCategory(value);
                  setFieldErrors((errors) => ({
                    ...errors,
                    category: undefined,
                    name: undefined,
                  }));
                }}
              >
                <SelectTrigger
                  className="w-[160px]"
                  aria-invalid={Boolean(
                    fieldErrors.category || validationErrors.category,
                  )}
                  aria-describedby={
                    fieldErrors.category || validationErrors.category
                      ? "skill-category-error"
                      : undefined
                  }
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(fieldErrors.category || validationErrors.category) && (
                <p
                  id="skill-category-error"
                  className="text-sm text-danger"
                >
                  {fieldErrors.category || validationErrors.category}
                </p>
              )}
            </div>
            <Button
              onClick={handleAdd}
              disabled={isMutating || Object.keys(validationErrors).length > 0}
            >
              {addSkill.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Add
            </Button>
          </div>
          {(fieldErrors.form || validationErrors.form) && (
            <p className="mt-3 text-sm text-danger">
              {fieldErrors.form || validationErrors.form}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Skills Display */}
      {skills.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Code2 className="h-10 w-10 text-text-muted/40 mb-3" />
            <p className="text-text-muted">
              No skills added yet. Use the form above to add your first skill.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped
            .filter((g) => g.skills.length > 0)
            .map((group) => {
              const Icon = group.icon;
              return (
                <Card key={group.value}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Icon className="h-4 w-4 text-text-muted" />
                      {group.label}s
                      <Badge variant="secondary" className="ml-auto">
                        {group.skills.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {group.skills.map((skill: any) => (
                        <span
                          key={skill.id}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                            CATEGORY_COLORS[group.value] ?? ""
                          }`}
                        >
                          {skill.name}
                          <button
                            type="button"
                            onClick={() => handleDelete(skill.id, skill.name)}
                            disabled={isMutating}
                            className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

          {uncategorized.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Other</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {uncategorized.map((skill: any) => (
                    <Badge
                      key={skill.id}
                      variant="outline"
                      className="gap-1.5 py-1 px-3"
                    >
                      {skill.name}
                      <button
                        type="button"
                        onClick={() => handleDelete(skill.id, skill.name)}
                        disabled={isMutating}
                        className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Summary Count */}
      {skills.length > 0 && (
        <p className="text-sm text-text-muted text-center">
          {skills.length} skill{skills.length !== 1 ? "s" : ""} total
        </p>
      )}
    </div>
  );
}
