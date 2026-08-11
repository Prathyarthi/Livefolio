"use client";

import { useMemo, useState } from "react";
import {
  usePortfolio,
  useAddProject,
  useUpdateProject,
  useDeleteProject,
  useUpdateLivePreview,
} from "@/features/portfolio/api/use-portfolio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/features/portfolio/components/field-label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  FolderKanban,
  ExternalLink,
  X,
  Check,
  Star,
  ImageIcon,
} from "lucide-react";
import { GithubIcon as Github } from "@/components/icons";
import { ProjectLivePreviewControls } from "@/features/portfolio/components/project-live-preview-controls";
import {
  getMaxLivePreviews,
  isLivePreviewEnabledForProject,
} from "@/lib/live-preview";
import { useEditStepDirty } from "@/features/portfolio/context/edit-dirty-context";
import { useScrollIntoView } from "@/hooks/use-scroll-into-view";
import {
  fieldsDiffer,
  fieldDiffers,
  hasNonEmptyStringValues,
} from "@/features/portfolio/lib/edit-step-dirty";
import {
  clientValidators,
  type FieldErrors,
  validateField,
  validationMessage,
} from "@/features/portfolio/lib/client-validation";
import {
  MAX_TECH_STACK_ITEM_CHARS,
  MAX_TECH_STACK_ITEMS,
  normalizeStringList,
} from "@/lib/content-policy";
import { useBilling } from "@/features/subscriptions/api/use-billing";

interface ProjectEntry {
  id?: string;
  title: string;
  description: string;
  liveUrl: string;
  sourceUrl: string;
  techStack: string[];
  featured: boolean;
}

type ProjectField =
  | "title"
  | "description"
  | "liveUrl"
  | "sourceUrl"
  | "techStack";

const emptyEntry: ProjectEntry = {
  title: "",
  description: "",
  liveUrl: "",
  sourceUrl: "",
  techStack: [],
  featured: false,
};

function validateProject(form: ProjectEntry) {
  const errors: FieldErrors<ProjectField> = {};
  validateField(errors, "title", () =>
    clientValidators.requiredLabel(form.title, "Project title")
  );
  validateField(errors, "description", () =>
    clientValidators.longText(form.description, "Project description")
  );
  validateField(errors, "liveUrl", () =>
    clientValidators.optionalUrl(form.liveUrl, "Project live URL")
  );
  validateField(errors, "sourceUrl", () =>
    clientValidators.optionalUrl(form.sourceUrl, "Project source URL")
  );
  validateField(errors, "techStack", () =>
    normalizeStringList(
      form.techStack,
      "Tech stack",
      MAX_TECH_STACK_ITEMS,
      MAX_TECH_STACK_ITEM_CHARS
    )
  );
  return errors;
}

export function ProjectForm() {
  const { data: portfolio, isLoading } = usePortfolio();
  const addProject = useAddProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const updateLivePreview = useUpdateLivePreview();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<ProjectEntry>(emptyEntry);
  const [techInput, setTechInput] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    FieldErrors<ProjectField>
  >({});
  const [enableLivePreviewOnSave, setEnableLivePreviewOnSave] = useState(false);
  const [editLivePreviewEnabled, setEditLivePreviewEnabled] = useState(false);
  const editingCardRef = useScrollIntoView<HTMLDivElement>(Boolean(editingId));
  const { data: billing } = useBilling();
  const subscriptionStatus =
    billing?.subscription?.status?.toLowerCase() === "active" ? "active" : "none";

  const livePreviewProjectIds = Array.isArray(portfolio?.livePreviewProjectIds)
    ? portfolio.livePreviewProjectIds
    : [];

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const field = e.target.name as ProjectField;
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validateProjectField(field: ProjectField) {
    const message = validateProject(form)[field];
    setFieldErrors((prev) => ({ ...prev, [field]: message }));
  }

  function startEditing(project: any) {
    setEditingId(project.id);
    setIsAdding(false);
    setEnableLivePreviewOnSave(false);
    setEditLivePreviewEnabled(
      isLivePreviewEnabledForProject(project.id, livePreviewProjectIds)
    );
    setForm({
      id: project.id,
      title: project.title ?? "",
      description: project.description ?? "",
      liveUrl: project.liveUrl ?? "",
      sourceUrl: project.sourceUrl ?? "",
      techStack: project.techStack ?? [],
      featured: project.featured ?? false,
    });
    setTechInput("");
    setFieldErrors({});
  }

  function cancelEditing() {
    setEditingId(null);
    setIsAdding(false);
    setForm(emptyEntry);
    setTechInput("");
    setFieldErrors({});
    setEnableLivePreviewOnSave(false);
    setEditLivePreviewEnabled(false);
  }

  function startAdding() {
    setIsAdding(true);
    setEditingId(null);
    setForm(emptyEntry);
    setTechInput("");
    setFieldErrors({});
    setEnableLivePreviewOnSave(false);
  }

  function addTechTag() {
    const tag = techInput.trim();
    if (!tag) return;
    if (form.techStack.includes(tag)) {
      toast.error("Tech already added");
      return;
    }
    const errors: FieldErrors<ProjectField> = {};
    validateField(errors, "techStack", () =>
      normalizeStringList(
        [...form.techStack, tag],
        "Tech stack",
        MAX_TECH_STACK_ITEMS,
        MAX_TECH_STACK_ITEM_CHARS
      )
    );
    if (errors.techStack) {
      setFieldErrors((prev) => ({ ...prev, techStack: errors.techStack }));
      return;
    }
    setForm((prev) => ({ ...prev, techStack: [...prev.techStack, tag] }));
    setTechInput("");
    setFieldErrors((prev) => ({ ...prev, techStack: undefined }));
  }

  function removeTechTag(tag: string) {
    setForm((prev) => ({
      ...prev,
      techStack: prev.techStack.filter((t) => t !== tag),
    }));
    setFieldErrors((prev) => ({ ...prev, techStack: undefined }));
  }

  function handleTechKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTechTag();
    }
  }

  async function syncLivePreviewIds(nextIds: string[]) {
    await updateLivePreview.mutateAsync(nextIds);
  }

  function handleEditLivePreviewChange(enabled: boolean) {
    if (!editingId) return;
    if (enabled && !form.liveUrl.trim()) {
      toast.error("Add a live URL before enabling live preview");
      return;
    }

    const maxAllowed = getMaxLivePreviews(subscriptionStatus);
    const alreadySaved = livePreviewProjectIds.includes(editingId);
    if (
      enabled &&
      !alreadySaved &&
      livePreviewProjectIds.length >= maxAllowed
    ) {
      toast.error("Please upgrade the plan for more preview links");
      return;
    }

    setEditLivePreviewEnabled(enabled);
  }

  function buildEditLivePreviewIds(): string[] {
    if (!editingId) return livePreviewProjectIds;

    if (!form.liveUrl.trim() || !editLivePreviewEnabled) {
      return livePreviewProjectIds.filter((id: string) => id !== editingId);
    }

    if (livePreviewProjectIds.includes(editingId)) {
      return livePreviewProjectIds;
    }

    const maxAllowed = getMaxLivePreviews(subscriptionStatus);
    return [...livePreviewProjectIds, editingId].slice(0, maxAllowed);
  }

  async function handleAdd() {
    const errors = validateProject(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      const created = await addProject.mutateAsync({
        title: form.title.trim(),
        description: form.description.trim(),
        liveUrl: form.liveUrl || null,
        sourceUrl: form.sourceUrl || null,
        techStack: form.techStack,
        featured: form.featured,
      });

      if (
        enableLivePreviewOnSave &&
        form.liveUrl.trim() &&
        created?.id
      ) {
        const maxAllowed = getMaxLivePreviews(subscriptionStatus);
        const current = [...livePreviewProjectIds];
        if (!current.includes(created.id) && current.length < maxAllowed) {
          await syncLivePreviewIds([...current, created.id]);
        } else if (current.length >= maxAllowed) {
          toast.error(
            "Project added, but live preview limit reached. Upgrade for more links."
          );
        }
      }

      toast.success("Project added");
      cancelEditing();
    } catch (error) {
      toast.error(validationMessage(error, "Failed to add project"));
    }
  }

  async function handleUpdate() {
    if (!editingId) return;
    const errors = validateProject(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      const wantPreview = editLivePreviewEnabled && Boolean(form.liveUrl.trim());
      const alreadySaved = livePreviewProjectIds.includes(editingId);
      const maxAllowed = getMaxLivePreviews(subscriptionStatus);

      if (
        wantPreview &&
        !alreadySaved &&
        livePreviewProjectIds.length >= maxAllowed
      ) {
        toast.error("Please upgrade the plan for more preview links");
        return;
      }

      await updateProject.mutateAsync({
        id: editingId,
        title: form.title.trim(),
        description: form.description.trim(),
        liveUrl: form.liveUrl || null,
        sourceUrl: form.sourceUrl || null,
        techStack: form.techStack,
        featured: form.featured,
      });

      const nextIds = buildEditLivePreviewIds();
      const idsChanged =
        nextIds.length !== livePreviewProjectIds.length ||
        nextIds.some((id) => !livePreviewProjectIds.includes(id));

      if (idsChanged) {
        await syncLivePreviewIds(nextIds);
      }

      toast.success("Project updated");
      cancelEditing();
    } catch (error) {
      toast.error(validationMessage(error, "Failed to update project"));
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteProject.mutateAsync(id);
      if (livePreviewProjectIds.includes(id)) {
        await syncLivePreviewIds(
          livePreviewProjectIds.filter((projectId: string) => projectId !== id)
        );
      }
      toast.success("Project deleted");
      if (editingId === id) cancelEditing();
    } catch (error) {
      toast.error(validationMessage(error, "Failed to delete project"));
    }
  }

  const projects = portfolio?.projects ?? [];

  const isDirty = useMemo(() => {
    if (!isAdding && !editingId) return false;
    if (isAdding) {
      return (
        hasNonEmptyStringValues({
          title: form.title,
          description: form.description,
          liveUrl: form.liveUrl,
          sourceUrl: form.sourceUrl,
        }) ||
        form.techStack.length > 0 ||
        techInput.trim() !== "" ||
        form.featured ||
        enableLivePreviewOnSave
      );
    }

    const original = projects.find(
      (project: { id: string }) => project.id === editingId
    );
    if (!original || !editingId) return true;

    const fieldsChanged = fieldsDiffer(
      form,
      {
        title: original.title,
        description: original.description ?? "",
        liveUrl: original.liveUrl ?? "",
        sourceUrl: original.sourceUrl ?? "",
      },
      ["title", "description", "liveUrl", "sourceUrl"]
    );
    const techChanged =
      JSON.stringify(form.techStack) !==
      JSON.stringify(original.techStack ?? []);
    const featuredChanged = form.featured !== (original.featured ?? false);
    const previewChanged =
      editLivePreviewEnabled !==
      isLivePreviewEnabledForProject(editingId, livePreviewProjectIds);

    return (
      fieldsChanged ||
      techChanged ||
      featuredChanged ||
      previewChanged ||
      techInput.trim() !== ""
    );
  }, [
    isAdding,
    editingId,
    form,
    techInput,
    enableLivePreviewOnSave,
    editLivePreviewEnabled,
    projects,
    livePreviewProjectIds,
  ]);

  useEditStepDirty("projects", isDirty);

  const savedForm = useMemo((): ProjectEntry => {
    if (isAdding) return emptyEntry;
    if (!editingId) return emptyEntry;
    const original = projects.find(
      (project: { id: string }) => project.id === editingId
    );
    if (!original) return emptyEntry;
    return {
      title: original.title ?? "",
      description: original.description ?? "",
      liveUrl: original.liveUrl ?? "",
      sourceUrl: original.sourceUrl ?? "",
      techStack: original.techStack ?? [],
      featured: original.featured ?? false,
    };
  }, [isAdding, editingId, projects]);

  const isFieldUnsaved = (key: keyof Omit<ProjectEntry, "techStack" | "featured">) =>
    isAdding || editingId
      ? fieldDiffers(form[key] ?? "", savedForm[key] ?? "")
      : false;

  const isEditing = Boolean(isAdding || editingId);
  const isFormInvalid = Object.keys(validateProject(form)).length > 0;
  const techInputInvalid = Boolean(
    techInput.trim() &&
      (() => {
        const errors: FieldErrors<ProjectField> = {};
        validateField(errors, "techStack", () =>
          normalizeStringList(
            [...form.techStack, techInput.trim()],
            "Tech stack",
            MAX_TECH_STACK_ITEMS,
            MAX_TECH_STACK_ITEM_CHARS
          )
        );
        return errors.techStack;
      })()
  );

  const isFeaturedUnsaved =
    isEditing && form.featured !== savedForm.featured;

  const isTechUnsaved =
    isEditing &&
    (JSON.stringify(form.techStack) !== JSON.stringify(savedForm.techStack) ||
      techInput.trim() !== "");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isMutating =
    addProject.isPending ||
    updateProject.isPending ||
    deleteProject.isPending ||
    updateLivePreview.isPending;

  const renderProjectFields = (fieldPrefix = "") => {
    const suffix = fieldPrefix ? `-${fieldPrefix}` : "";

    return (
      <>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <FieldLabel htmlFor={`proj-title${suffix}`} unsaved={isFieldUnsaved("title")}>
              Title
            </FieldLabel>
            <Input
              id={`proj-title${suffix}`}
              name="title"
              value={form.title}
              onChange={handleChange}
              onBlur={() => validateProjectField("title")}
              aria-invalid={Boolean(fieldErrors.title)}
              aria-describedby={
                fieldErrors.title ? `proj-title-error${suffix}` : undefined
              }
              placeholder="My Awesome Project"
            />
            {fieldErrors.title && (
              <p
                id={`proj-title-error${suffix}`}
                className="text-sm text-destructive"
              >
                {fieldErrors.title}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Switch
              id={`featured${suffix}`}
              checked={form.featured}
              onCheckedChange={(checked) =>
                setForm((prev) => ({ ...prev, featured: checked }))
              }
            />
            <FieldLabel htmlFor={`featured${suffix}`} unsaved={isFeaturedUnsaved}>
              <Star className="h-4 w-4 text-amber-500" />
              Featured project
            </FieldLabel>
          </div>
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor={`proj-description${suffix}`} unsaved={isFieldUnsaved("description")}>
            Description
          </FieldLabel>
          <Textarea
            id={`proj-description${suffix}`}
            name="description"
            value={form.description}
            onChange={handleChange}
            onBlur={() => validateProjectField("description")}
            aria-invalid={Boolean(fieldErrors.description)}
            aria-describedby={
              fieldErrors.description
                ? `proj-description-error${suffix}`
                : undefined
            }
            placeholder="Describe what the project does, the problem it solves, and your role..."
            rows={4}
          />
          {fieldErrors.description && (
            <p
              id={`proj-description-error${suffix}`}
              className="text-sm text-destructive"
            >
              {fieldErrors.description}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <FieldLabel htmlFor={`liveUrl${suffix}`} unsaved={isFieldUnsaved("liveUrl")}>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              Live URL
            </FieldLabel>
            <Input
              id={`liveUrl${suffix}`}
              name="liveUrl"
              type="url"
              value={form.liveUrl}
              onChange={handleChange}
              onBlur={() => validateProjectField("liveUrl")}
              aria-invalid={Boolean(fieldErrors.liveUrl)}
              aria-describedby={
                fieldErrors.liveUrl ? `live-url-error${suffix}` : undefined
              }
              placeholder="https://my-project.com"
            />
            {fieldErrors.liveUrl && (
              <p
                id={`live-url-error${suffix}`}
                className="text-sm text-destructive"
              >
                {fieldErrors.liveUrl}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <FieldLabel htmlFor={`sourceUrl${suffix}`} unsaved={isFieldUnsaved("sourceUrl")}>
              <Github className="h-4 w-4 text-muted-foreground" />
              Source URL
            </FieldLabel>
            <Input
              id={`sourceUrl${suffix}`}
              name="sourceUrl"
              type="url"
              value={form.sourceUrl}
              onChange={handleChange}
              onBlur={() => validateProjectField("sourceUrl")}
              aria-invalid={Boolean(fieldErrors.sourceUrl)}
              aria-describedby={
                fieldErrors.sourceUrl ? `source-url-error${suffix}` : undefined
              }
              placeholder="https://github.com/user/project"
            />
            {fieldErrors.sourceUrl && (
              <p
                id={`source-url-error${suffix}`}
                className="text-sm text-destructive"
              >
                {fieldErrors.sourceUrl}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <FieldLabel unsaved={isTechUnsaved}>Tech Stack</FieldLabel>
          <div className="flex gap-2">
            <Input
              value={techInput}
              onChange={(e) => {
                setTechInput(e.target.value);
                setFieldErrors((prev) => ({
                  ...prev,
                  techStack: undefined,
                }));
              }}
              onBlur={() => {
                if (!techInput.trim()) return;
                const errors: FieldErrors<ProjectField> = {};
                validateField(errors, "techStack", () =>
                  normalizeStringList(
                    [...form.techStack, techInput.trim()],
                    "Tech stack",
                    MAX_TECH_STACK_ITEMS,
                    MAX_TECH_STACK_ITEM_CHARS
                  )
                );
                setFieldErrors((prev) => ({
                  ...prev,
                  techStack: errors.techStack,
                }));
              }}
              onKeyDown={handleTechKeyDown}
              aria-invalid={Boolean(fieldErrors.techStack)}
              aria-describedby={
                fieldErrors.techStack ? `tech-stack-error${suffix}` : undefined
              }
              placeholder="Type a technology and press Enter..."
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={addTechTag}
              disabled={!techInput.trim() || techInputInvalid}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {fieldErrors.techStack && (
            <p
              id={`tech-stack-error${suffix}`}
              className="text-sm text-destructive"
            >
              {fieldErrors.techStack}
            </p>
          )}
          {form.techStack.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {form.techStack.map((tech) => (
                <Badge key={tech} variant="secondary" className="gap-1 px-2.5 py-1">
                  {tech}
                  <button
                    type="button"
                    onClick={() => removeTechTag(tech)}
                    className="ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FolderKanban className="h-5 w-5" />
            Projects
          </h3>
          <p className="text-sm text-muted-foreground">
            Showcase your best projects with descriptions, tech stack, and links.
          </p>
        </div>
        {!isAdding && !editingId && (
          <Button onClick={startAdding}>
            <Plus className="mr-2 h-4 w-4" />
            Add Project
          </Button>
        )}
      </div>

      {/* Add Form */}
      {isAdding && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">New Project</CardTitle>
            <CardDescription>
              Add a project you want to showcase.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderProjectFields()}
            <ProjectLivePreviewControls
              mode="add"
              liveUrl={form.liveUrl}
              livePreviewProjectIds={livePreviewProjectIds}
              subscriptionStatus={subscriptionStatus}
              enableOnSave={enableLivePreviewOnSave}
              onEnableOnSaveChange={setEnableLivePreviewOnSave}
              isSaving={isMutating}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelEditing}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={isMutating || isFormInvalid}
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

      {/* Projects List */}
      {projects.length === 0 && !isAdding ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FolderKanban className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">
              No projects added yet. Click &quot;Add Project&quot; to showcase your work.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {projects.map((project: any) => (
            <div
              key={project.id}
              ref={editingId === project.id ? editingCardRef : undefined}
            >
            <Card className={editingId === project.id ? "border-primary/30" : ""}>
              {editingId === project.id ? (
                <CardContent className="space-y-4 pt-6">
                  <div>
                    <h4 className="text-base font-semibold">Edit Project</h4>
                    <p className="text-sm text-muted-foreground">
                      Update this project&apos;s details.
                    </p>
                  </div>
                  {renderProjectFields(project.id)}
                  <ProjectLivePreviewControls
                    mode="edit"
                    liveUrl={form.liveUrl}
                    projectId={project.id}
                    livePreviewProjectIds={livePreviewProjectIds}
                    subscriptionStatus={subscriptionStatus}
                    editEnabled={editLivePreviewEnabled}
                    savedEnabled={isLivePreviewEnabledForProject(
                      project.id,
                      livePreviewProjectIds
                    )}
                    onEditEnabledChange={handleEditLivePreviewChange}
                    isSaving={isMutating}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={cancelEditing}>
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdate}
                      disabled={isMutating || isFormInvalid}
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-base">
                        {project.title}
                      </h4>
                      {project.featured && (
                        <Badge
                          variant="default"
                          className="text-xs gap-1"
                        >
                          <Star className="h-3 w-3" />
                          Featured
                        </Badge>
                      )}
                      {project.liveUrl &&
                        isLivePreviewEnabledForProject(
                          project.id,
                          livePreviewProjectIds
                        ) && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <ImageIcon className="h-3 w-3" />
                            Live preview
                          </Badge>
                        )}
                    </div>

                    {(project.liveUrl || project.sourceUrl) && (
                      <div className="flex items-center gap-3 mt-1">
                        {project.liveUrl && (
                          <a
                            href={project.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Live
                          </a>
                        )}
                        {project.sourceUrl && (
                          <a
                            href={project.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <Github className="h-3 w-3" />
                            Source
                          </a>
                        )}
                      </div>
                    )}

                    {project.description && (
                      <>
                        <Separator className="my-3" />
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {project.description}
                        </p>
                      </>
                    )}

                    {project.techStack?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {project.techStack.map((tech: string) => (
                          <Badge
                            key={tech}
                            variant="outline"
                            className="text-xs"
                          >
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => startEditing(project)}
                      disabled={isMutating}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(project.id)}
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
