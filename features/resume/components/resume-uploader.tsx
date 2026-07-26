"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useParseResume } from "@/features/resume/api/use-resume";
import {
  useClearImportableContent,
  useCreatePortfolio,
  usePortfolio,
  useUpdatePortfolio,
} from "@/features/portfolio/api/use-portfolio";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Upload,
  FileText,
  Briefcase,
  GraduationCap,
  Code,
  FolderOpen,
  Award,
  Trophy,
  Check,
  Trash2,
  Layers,
} from "lucide-react";
import type { ParsedResume } from "@/lib/gemini";
import { normalizeSocialProfile } from "@/lib/social-profile";
import {
  MAX_CUSTOM_SECTIONS,
  MAX_SECTION_ROWS,
  MAX_SKILL_FIELD_CHARS,
  MAX_SKILLS,
  MAX_TECH_STACK_ITEM_CHARS,
  MAX_TECH_STACK_ITEMS,
  sanitizeImportedCustomSectionItems,
  sanitizeImportedEmail,
  sanitizeImportedLabel,
  sanitizeImportedLongText,
  sanitizeImportedPhone,
  sanitizeImportedStringList,
  sanitizeImportedStoredUrl,
} from "@/lib/content-policy";
import {
  LivePreviewSelectionDialog,
  type LivePreviewCandidate,
} from "@/features/resume/components/live-preview-selection-dialog";
import { RotatingLoader } from "@/components/rotating-loader";
import {
  PORTFOLIO_IMPORT_MESSAGES,
  RESUME_PARSE_MESSAGES,
} from "@/lib/portfolio-loading-messages";

async function assertApiOk(res: Response, context: string) {
  if (res.ok) return;
  let message = res.statusText;
  try {
    const body: unknown = await res.json();
    if (body && typeof body === "object" && body !== null && "error" in body) {
      const err = (body as { error?: unknown }).error;
      if (typeof err === "string") message = err;
    }
  } catch {
    /* ignore non-JSON error bodies */
  }
  throw new Error(`${context}: ${message} (${res.status})`);
}

async function postImport(path: string, body: unknown, context: string) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  await assertApiOk(res, context);
}

export function ResumeUploader({
  onToolbarActionsChange,
}: {
  onToolbarActionsChange?: (actions: React.ReactNode) => void;
} = {}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);
  const [importing, setImporting] = useState(false);
  const [clearBeforeImport, setClearBeforeImport] = useState(true);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(
    null
  );

  const parseResume = useParseResume();
  const { data: portfolio } = usePortfolio();
  const createPortfolio = useCreatePortfolio();
  const updatePortfolio = useUpdatePortfolio();
  const clearImportable = useClearImportableContent();

  useEffect(() => {
    let cancelled = false;
    const loadBilling = async () => {
      try {
        const res = await fetch("/api/billing/me", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json().catch(() => ({}))) as {
          subscription?: { status?: string | null } | null;
        };
        if (cancelled) return;
        const status = data.subscription?.status ?? null;
        setSubscriptionStatus(
          status?.toLowerCase() === "active" ? "active" : "none"
        );
      } catch {
        if (cancelled) return;
        setSubscriptionStatus("none");
      }
    };
    loadBilling();
    return () => {
      cancelled = true;
    };
  }, []);

  const livePreviewCandidates = useMemo<LivePreviewCandidate[]>(() => {
    return (
      portfolio?.projects
        ?.filter((project: { liveUrl?: string | null }) => project.liveUrl)
        .map((project: { id: string; title: string; liveUrl: string }) => ({
          id: project.id,
          title: project.title,
          liveUrl: project.liveUrl,
        })) ?? []
    );
  }, [portfolio?.projects]);

  const selectedLivePreviewProjectIds = useMemo(
    () =>
      Array.isArray(portfolio?.livePreviewProjectIds)
        ? portfolio.livePreviewProjectIds
        : [],
    [portfolio]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.type !== "application/pdf") {
        toast.error("Please upload a PDF file");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      parseResume.mutate(file, {
        onSuccess: (data) => {
          setParsedData(data);
          toast.success("Resume parsed successfully");
        },
        onError: (error) => {
          console.error("Resume parse error:", error);
          toast.error(error.message);
        },
      });
    },
    [parseResume]
  );

  const handleImport = async () => {
    if (!parsedData) return;
    setImporting(true);

    let activePortfolio = portfolio;

    if (!activePortfolio) {
      try {
        activePortfolio = await createPortfolio.mutateAsync();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create portfolio",
        );
        setImporting(false);
        return;
      }
    }

    try {
      await updatePortfolio.mutateAsync({
        title: sanitizeImportedLabel(parsedData.name) || "Portfolio",
        headline: sanitizeImportedLabel(parsedData.headline),
        summary: sanitizeImportedLongText(parsedData.summary),
        contactEmail: sanitizeImportedEmail(parsedData.contact?.email),
        phone: sanitizeImportedPhone(parsedData.contact?.phone),
        websiteUrl: sanitizeImportedStoredUrl(
          parsedData.contact?.websiteUrl,
          "Portfolio website URL",
        ),
        location: sanitizeImportedLabel(parsedData.contact?.location) || null,
        ...(parsedData.sectionLabels && Object.keys(parsedData.sectionLabels).length > 0
          ? { customization: { sectionLabels: parsedData.sectionLabels } }
          : {}),
      });

      if (clearBeforeImport) {
        await clearImportable.mutateAsync();
      }

      const remainingRows = (existingCount: number | undefined) =>
        clearBeforeImport
          ? MAX_SECTION_ROWS
          : Math.max(0, MAX_SECTION_ROWS - (existingCount ?? 0));
      const existingCustomTypes = new Set(
        clearBeforeImport
          ? []
          : (activePortfolio.customSections ?? []).map(
              (section: { sectionType: string }) =>
                section.sectionType.toLowerCase(),
            ),
      );
      const remainingCustomCreates = clearBeforeImport
        ? MAX_CUSTOM_SECTIONS
        : Math.max(0, MAX_CUSTOM_SECTIONS - existingCustomTypes.size);
      const seenSkillKeys = new Set(
        clearBeforeImport
          ? []
          : (activePortfolio.skills ?? []).map(
              (skill: { name: string; category: string }) =>
                `${skill.name.toLowerCase()}:${skill.category.toLowerCase()}`,
            ),
      );
      const importSkills = parsedData.skills
        .map((skill) => ({
          ...skill,
          name: sanitizeImportedLabel(skill.name, MAX_SKILL_FIELD_CHARS),
          category:
            sanitizeImportedLabel(
              skill.category,
              MAX_SKILL_FIELD_CHARS,
            ) || "General",
        }))
        .filter((skill) => {
          if (!skill.name) return false;
          const key = `${skill.name.toLowerCase()}:${skill.category.toLowerCase()}`;
          if (seenSkillKeys.has(key)) return false;
          seenSkillKeys.add(key);
          return true;
        })
        .slice(
          0,
          clearBeforeImport
            ? MAX_SKILLS
            : Math.max(0, MAX_SKILLS - (activePortfolio.skills?.length ?? 0)),
        );
      const importCustomSections = (() => {
        const prepared = (parsedData.customSections ?? []).flatMap((section) => {
          const sectionType = sanitizeImportedLabel(section.sectionType);
          const label = sanitizeImportedLabel(section.label);
          if (!sectionType || !label) return [];
          return [{
            sectionType,
            label,
            items: sanitizeImportedCustomSectionItems(section.items),
          }];
        });
        const updates = prepared.filter((section) =>
          existingCustomTypes.has(section.sectionType.toLowerCase())
        );
        const creates = prepared.filter(
          (section) =>
            !existingCustomTypes.has(section.sectionType.toLowerCase()),
        );
        return [...updates, ...creates.slice(0, remainingCustomCreates)];
      })();

      // Limits are computed up front, so parallel writes are safe and much faster.
      await Promise.all([
        ...parsedData.experiences
          .slice(0, remainingRows(activePortfolio.experiences?.length))
          .flatMap((exp) => {
            const company = sanitizeImportedLabel(exp.company);
            const role = sanitizeImportedLabel(exp.role);
            if (!company || !role) return [];
            return [
              postImport(
                "/api/portfolio/experience",
                {
                  ...exp,
                  company,
                  role,
                  description: sanitizeImportedLongText(exp.description),
                  location: sanitizeImportedLabel(exp.location) || null,
                },
                "Experience",
              ),
            ];
          }),
        ...parsedData.education
          .slice(0, remainingRows(activePortfolio.educations?.length))
          .flatMap((edu) => {
            const institution = sanitizeImportedLabel(edu.institution);
            const degree = sanitizeImportedLabel(edu.degree);
            if (!institution || !degree) return [];
            return [
              postImport(
                "/api/portfolio/education",
                {
                  ...edu,
                  institution,
                  degree,
                  field: sanitizeImportedLabel(edu.field) || null,
                  gpa: sanitizeImportedLabel(edu.gpa) || null,
                },
                "Education",
              ),
            ];
          }),
        ...(importSkills.length > 0 && clearBeforeImport
          ? [
              postImport(
                "/api/portfolio/skill/bulk",
                { skills: importSkills },
                "Skills",
              ),
            ]
          : importSkills.map((skill) =>
              postImport("/api/portfolio/skill", skill, "Skill")
            )),
        ...parsedData.projects
          .slice(0, remainingRows(activePortfolio.projects?.length))
          .flatMap((project) => {
            const title = sanitizeImportedLabel(project.title);
            if (!title) return [];
            return [
              postImport(
                "/api/portfolio/project",
                {
                  title,
                  description: sanitizeImportedLongText(project.description),
                  techStack: sanitizeImportedStringList(
                    project.techStack ?? [],
                    MAX_TECH_STACK_ITEMS,
                    MAX_TECH_STACK_ITEM_CHARS,
                  ),
                  liveUrl: sanitizeImportedStoredUrl(
                    project.liveUrl,
                    "Project live URL",
                  ),
                  sourceUrl: sanitizeImportedStoredUrl(
                    project.sourceUrl,
                    "Project source URL",
                  ),
                },
                "Project",
              ),
            ];
          }),
        ...parsedData.certifications
          .slice(0, remainingRows(activePortfolio.certifications?.length))
          .flatMap((cert) => {
            const name = sanitizeImportedLabel(cert.name);
            const issuer = sanitizeImportedLabel(cert.issuer);
            if (!name || !issuer) return [];
            return [
              postImport(
                "/api/portfolio/certification",
                {
                  ...cert,
                  name,
                  issuer,
                  url: sanitizeImportedStoredUrl(
                    cert.url,
                    "Certification URL",
                  ),
                },
                "Certification",
              ),
            ];
          }),
        ...(parsedData.socialProfiles ?? [])
          .map((social) => normalizeSocialProfile(social))
          .map((normalized) => {
            if (!normalized) return null;
            const url = sanitizeImportedStoredUrl(
              normalized.url,
              "Social profile URL",
            );
            return url ? { ...normalized, url } : null;
          })
          .filter(
            (normalized): normalized is NonNullable<typeof normalized> =>
              normalized != null,
          )
          .map((normalized) =>
            postImport(
              "/api/portfolio/social",
              normalized,
              "Social profile",
            )
          ),
        ...parsedData.achievements
          .slice(0, remainingRows(activePortfolio.achievements?.length))
          .flatMap((achievement) => {
            const title = sanitizeImportedLabel(achievement);
            if (!title) return [];
            return [
              postImport(
                "/api/portfolio/achievement",
                { title },
                "Achievement",
              ),
            ];
          }),
        ...importCustomSections.map((section) =>
          postImport(
            "/api/portfolio/custom-section",
            section,
            "Custom Section",
          )
        ),
      ]);

      await queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      const refreshedPortfolio = await queryClient.fetchQuery({
        queryKey: ["portfolio"],
        queryFn: async () => {
          const res = await fetch("/api/portfolio", { cache: "no-store" });
          if (res.status === 404) return null;
          if (!res.ok) throw new Error("Failed to fetch portfolio");
          return res.json();
        },
      });

      toast.success("Resume data imported to your portfolio");

      const importedLiveProjects =
        refreshedPortfolio?.projects?.some(
          (project: { liveUrl?: string | null }) => project.liveUrl
        ) ?? false;

      if (importedLiveProjects) {
        setPreviewDialogOpen(true);
      }

      setParsedData(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to import data",
      );
    } finally {
      setImporting(false);
    }
  };

  const handleClearNow = async () => {
    try {
      await clearImportable.mutateAsync();
      toast.success(
        "Removed experiences, education, skills, projects, certifications, and achievements."
      );
      setClearDialogOpen(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to clear");
    }
  };

  useEffect(() => {
    if (!onToolbarActionsChange) return;

    if (!parsedData) {
      onToolbarActionsChange(null);
      return;
    }

    onToolbarActionsChange(
      <Button
        onClick={() => void handleImport()}
        disabled={importing}
        size="default"
      >
        {importing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Check className="mr-2 h-4 w-4" />
        )}
        Import to Portfolio
      </Button>
    );

    return () => onToolbarActionsChange(null);
  }, [onToolbarActionsChange, parsedData, importing]);

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Resume
          </CardTitle>
          <CardDescription>
            Upload your resume as a PDF and we will extract your information
            using AI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 p-10 cursor-pointer hover:border-muted-foreground/50 transition-colors"
          >
            {parseResume.isPending ? (
              <RotatingLoader
                messages={RESUME_PARSE_MESSAGES}
                spinnerClassName="text-muted-foreground"
                messageClassName="text-muted-foreground"
              />
            ) : (
              <>
                <FileText className="h-10 w-10 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">
                    Click to upload your resume
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF files only, up to 10MB
                  </p>
                </div>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            aria-label="Upload resume PDF"
            title="Upload resume PDF"
            className="hidden"
            onChange={handleFileChange}
            disabled={parseResume.isPending}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Avoid duplicate imports</CardTitle>
          <CardDescription>
            Re-importing adds new rows on top of what you already have. Clear
            resume-style sections first, or enable replace-before-import when you
            import.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-4 rounded-lg border border-border/60 bg-muted/30 p-4">
            <div className="space-y-1 pr-2">
              <Label htmlFor="clear-before-import" className="text-foreground">
                Replace resume sections before import
              </Label>
              <p className="text-sm text-muted-foreground">
                When on, we delete your current experiences, education, skills,
                projects, and certifications immediately before this import runs.
                Your slug, template, social links, and profile fields stay as they
                are.
              </p>
            </div>
            <Switch
              id="clear-before-import"
              checked={clearBeforeImport}
              onCheckedChange={setClearBeforeImport}
              className="shrink-0"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-11 w-full min-w-0 whitespace-normal border-destructive/40 px-3 py-3 text-center text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto sm:px-5"
            onClick={() => setClearDialogOpen(true)}
            disabled={clearImportable.isPending}
          >
            {clearImportable.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Clear resume sections now
          </Button>
        </CardContent>
      </Card>

      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Clear resume sections?</DialogTitle>
            <DialogDescription>
              This permanently deletes all experiences, education, skills,
              projects, certifications, and achievements in your portfolio. It does not change
              your name, summary, headline, URL slug, template, or social profiles.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setClearDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleClearNow}
              disabled={clearImportable.isPending}
            >
              {clearImportable.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Clear all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importing} onOpenChange={() => undefined}>
        <DialogContent
          showCloseButton={false}
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className="sm:max-w-md"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Importing to portfolio</DialogTitle>
            <DialogDescription>
              Please wait while your resume data is imported.
            </DialogDescription>
          </DialogHeader>
          <RotatingLoader
            messages={PORTFOLIO_IMPORT_MESSAGES}
            className="py-4"
          />
        </DialogContent>
      </Dialog>

      <LivePreviewSelectionDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        candidates={livePreviewCandidates}
        selectedProjectIds={selectedLivePreviewProjectIds}
        subscriptionStatus={subscriptionStatus}
        onSaved={() => {
          toast.success("Live preview selection saved");
          router.push("/dashboard/preview");
        }}
      />

      {/* Parsed results */}
      {parsedData && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Parsed Data</h3>
            {clearBeforeImport && (
              <p className="text-sm text-muted-foreground">
                Import will replace existing resume sections first.
              </p>
            )}
          </div>

          {/* Basic Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{parsedData.name}</CardTitle>
              <CardDescription>{parsedData.headline}</CardDescription>
            </CardHeader>
            {parsedData.summary && (
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {parsedData.summary}
                </p>
              </CardContent>
            )}
          </Card>

          {/* Experiences */}
          {parsedData.experiences.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Experiences ({parsedData.experiences.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {parsedData.experiences.map((exp, i) => (
                  <div key={i} className="border-b last:border-0 pb-3 last:pb-0">
                    <p className="font-medium text-sm">{exp.role}</p>
                    <p className="text-sm text-muted-foreground">
                      {exp.company}
                      {exp.location ? ` - ${exp.location}` : ""}
                    </p>
                    {(exp.startDate || exp.endDate) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {exp.startDate || ""}{exp.startDate && exp.endDate ? " - " : ""}{exp.endDate || (exp.startDate ? "Present" : "")}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Education */}
          {parsedData.education.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Education ({parsedData.education.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {parsedData.education.map((edu, i) => (
                  <div key={i} className="border-b last:border-0 pb-3 last:pb-0">
                    <p className="font-medium text-sm">
                      {edu.degree}
                      {edu.field ? ` in ${edu.field}` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {edu.institution}
                    </p>
                    {edu.gpa && (
                      <p className="text-xs text-muted-foreground">
                        GPA: {edu.gpa}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Skills */}
          {parsedData.skills.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Skills ({parsedData.skills.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {parsedData.skills.map((skill, i) => (
                    <Badge key={i} variant="secondary">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Projects */}
          {parsedData.projects.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Projects ({parsedData.projects.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {parsedData.projects.map((project, i) => (
                  <div key={i} className="border-b last:border-0 pb-3 last:pb-0">
                    <p className="font-medium text-sm">{project.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {project.description}
                    </p>
                    {project.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {project.techStack.map((tech, j) => (
                          <Badge key={j} variant="outline" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Achievements */}
          {parsedData.achievements.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Achievements ({parsedData.achievements.length})
                </CardTitle>
                <CardDescription>
                  Parsed successfully — ready to import.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {parsedData.achievements.map((achievement, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-muted-foreground/50">•</span>
                      <span>{achievement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Custom Sections */}
          {parsedData.customSections && parsedData.customSections.length > 0 &&
            parsedData.customSections.map((section, si) => (
              <Card key={si}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    {section.label} ({section.items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {section.items.map((item, ii) => {
                    const title = item.title ?? item.name ?? item.label;
                    const desc = item.description ?? item.details ?? item.summary;
                    const knownKeys = new Set([
                      "title",
                      "name",
                      "label",
                      "description",
                      "details",
                      "summary",
                    ]);
                    const otherEntries = Object.entries(item).filter(
                      ([k, v]) => !knownKeys.has(k) && v != null && v !== ""
                    );
                    return (
                      <div key={ii} className="border-b last:border-0 pb-3 last:pb-0 space-y-1">
                        {title != null && (
                          <p className="font-medium text-sm">{String(title)}</p>
                        )}
                        {desc != null && (
                          <p className="text-sm text-muted-foreground">
                            {String(desc)}
                          </p>
                        )}
                        {otherEntries.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {otherEntries.map(([k, v]) => (
                              <span
                                key={k}
                                className="text-xs bg-muted px-2 py-0.5 rounded"
                              >
                                <span className="text-muted-foreground">{k}:</span>{" "}
                                {String(v)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}

          {/* Certifications */}
          {parsedData.certifications.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Certifications ({parsedData.certifications.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {parsedData.certifications.map((cert, i) => (
                  <div key={i} className="border-b last:border-0 pb-3 last:pb-0">
                    <p className="font-medium text-sm">{cert.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {cert.issuer}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

        </div>
      )}
    </div>
  );
}
