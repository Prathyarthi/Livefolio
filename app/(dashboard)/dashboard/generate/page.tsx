"use client";

import { useCallback, useRef, useState } from "react";
import { Loader2, Sparkles, RefreshCw, FileText, Upload, Check } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { GeneratedUI } from "getsyntux/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PortfolioData } from "@/features/templates/types";
import type { ParsedResume } from "@/lib/gemini";

const EXAMPLE_PROMPTS = [
  "Full-stack engineer with 5 years experience in React and Node.js, worked at startups building SaaS products, passionate about developer tooling",
  "UX designer specializing in mobile apps, worked at Google and two fintech startups, focus on accessibility and design systems",
  "Data scientist at a healthcare company, expertise in Python and ML, published researcher, recently completed Stanford ML certification",
];

function parsedResumeToPortfolioData(r: ParsedResume): PortfolioData {
  return {
    portfolio: {
      title: r.name,
      headline: r.headline,
      summary: r.summary,
      avatarUrl: null,
      contactEmail: r.contact?.email ?? null,
      phone: r.contact?.phone ?? null,
      location: r.contact?.location ?? null,
      websiteUrl: r.contact?.websiteUrl ?? null,
      customization: {},
    },
    experiences: r.experiences.map((e, i) => ({
      id: `exp_${i}`,
      company: e.company,
      role: e.role,
      description: e.description,
      startDate: e.startDate,
      endDate: e.endDate,
      location: e.location ?? null,
    })),
    educations: r.education.map((e, i) => ({
      id: `edu_${i}`,
      institution: e.institution,
      degree: e.degree,
      field: e.field ?? null,
      startDate: e.startDate,
      endDate: e.endDate,
      gpa: e.gpa ?? null,
    })),
    skills: r.skills.map((s, i) => ({
      id: `skill_${i}`,
      name: s.name,
      category: s.category,
      level: null,
    })),
    projects: r.projects.map((p, i) => ({
      id: `proj_${i}`,
      title: p.title,
      description: p.description,
      imageUrl: null,
      liveUrl: p.liveUrl ?? null,
      sourceUrl: p.sourceUrl ?? null,
      techStack: p.techStack,
      featured: i === 0,
      githubStars: null,
      githubForks: null,
      language: null,
    })),
    articles: [],
    socialProfiles: (r.socialProfiles ?? [])
      .filter((s) => s.url)
      .map((s) => ({
        platform: s.platform,
        url: s.url!,
        username: s.username ?? null,
        cachedStats: null,
      })),
    certifications: r.certifications.map((c, i) => ({
      id: `cert_${i}`,
      name: c.name,
      issuer: c.issuer,
      issueDate: c.issueDate ?? null,
      url: c.url ?? null,
    })),
    achievements: r.achievements.map((a, i) => ({
      id: `ach_${i}`,
      title: a,
      date: null,
    })),
    customSections: (r.customSections ?? []).map((s, i) => ({
      id: `cs_${i}`,
      sectionType: s.sectionType,
      label: s.label,
      items: s.items,
    })),
    livePreviewProjectIds: [],
  };
}

function PromptTab({
  onData,
}: {
  onData: (data: PortfolioData) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Describe yourself first");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate-portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Generation failed");
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
      }
      const cleaned = fullText.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/, "").trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)?.[0]?.trim() ?? cleaned;
      const data = JSON.parse(jsonMatch) as PortfolioData;
      onData(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        placeholder="Describe yourself — your role, experience, technologies you use, notable projects..."
        className="min-h-[120px] resize-none"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        disabled={isGenerating}
      />

      <div className="flex flex-wrap gap-2">
        {EXAMPLE_PROMPTS.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setPrompt(p)}
            className="rounded-full border border-border-default bg-surface-sunken px-3 py-1 text-xs text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
          >
            Example {i + 1}
          </button>
        ))}
      </div>

      <Button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        className="gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate Portfolio
          </>
        )}
      </Button>
    </div>
  );
}

function ResumeTab({ onData }: { onData: (data: PortfolioData) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf") {
        toast.error("Please upload a PDF file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      setIsParsing(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/resume/parse", {
          method: "POST",
          body: formData,
        });
        const json = (await res.json()) as { data?: ParsedResume; error?: string; details?: string };
        if (!res.ok) throw new Error(json.details ?? json.error ?? "Parse failed");
        onData(parsedResumeToPortfolioData(json.data!));
        toast.success("Resume parsed — preview ready");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to parse resume");
      } finally {
        setIsParsing(false);
      }
    },
    [onData]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !isParsing && fileInputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[var(--radius-xl)] border-2 border-dashed border-brand-secondary bg-brand-light p-12 transition-colors hover:border-brand-primary"
      >
        {isParsing ? (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-brand-primary" />
            <p className="text-body-sm text-text-secondary">Parsing your resume with AI...</p>
          </>
        ) : (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] bg-surface-base">
              <FileText className="h-6 w-6 text-brand-primary" />
            </div>
            <div className="text-center">
              <p className="text-body-sm font-medium text-text-primary">
                Drop your resume here or click to upload
              </p>
              <p className="mt-1 text-xs text-text-muted">PDF only · up to 10MB</p>
            </div>
            <Button variant="outline" size="sm" className="gap-2 pointer-events-none">
              <Upload className="h-3.5 w-3.5" />
              Choose PDF
            </Button>
          </>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export default function GeneratePage() {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [activeTab, setActiveTab] = useState("describe");
  const [isPublishing, setIsPublishing] = useState(false);
  const router = useRouter();

  const handlePublish = async () => {
    if (!portfolioData) return;

    setIsPublishing(true);
    try {
      const res = await fetch("/api/portfolio/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(portfolioData),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to publish portfolio");
      }

      toast.success("Portfolio published successfully!");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)]">
        <p className="eyebrow uppercase">AI generator</p>
        <h1 className="mt-3 text-h1 text-text-primary">Generate your portfolio</h1>
        <p className="mt-2 max-w-2xl text-body text-text-secondary">
          Describe yourself or upload your resume — AI builds the portfolio JSON,
          Syntux renders it as a live UI.
        </p>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)]">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="describe">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Describe yourself
            </TabsTrigger>
            <TabsTrigger value="resume">
              <FileText className="mr-2 h-3.5 w-3.5" />
              Upload resume
            </TabsTrigger>
          </TabsList>

          <TabsContent value="describe">
            <PromptTab onData={(data) => { setPortfolioData(data); }} />
          </TabsContent>

          <TabsContent value="resume">
            <ResumeTab onData={(data) => { setPortfolioData(data); }} />
          </TabsContent>
        </Tabs>
      </div>

      {portfolioData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow uppercase">Preview</p>
              <p className="mt-1 text-body-sm text-text-secondary">
                Live UI rendered by Syntux from the generated JSON
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setPortfolioData(null)}
                disabled={isPublishing}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset
              </Button>
              <Button
                size="sm"
                className="gap-2"
                onClick={handlePublish}
                disabled={isPublishing}
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Publish to Portfolio
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)]">
            <GeneratedUI
              endpoint="/api/syntux"
              value={portfolioData}
              hint="Display this portfolio data as a beautiful, modern portfolio preview. Show the person's name and headline prominently, then sections for experience, education, skills (as badges), and projects (as cards). Use a clean professional layout."
              placeholder={
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
                </div>
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
