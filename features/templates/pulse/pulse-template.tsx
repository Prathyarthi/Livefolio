"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Inter,
  JetBrains_Mono,
  Playfair_Display,
  Space_Grotesk,
} from "next/font/google";
import { TemplateProjectPreview } from "@/components/template-project-preview";
import { cn } from "@/lib/utils";
import {
  formatDate,
  formatDateRange,
  groupSkillsByCategory,
  sortExperiencesNewestFirst,
} from "@/features/templates/utils";
import type {
  PortfolioData,
  PortfolioCustomization,
} from "@/features/templates/types";
import {
  GitHubContributionHeatmap,
  parseContributionCalendar,
} from "@/features/templates/github-contribution-heatmap";
import {
  buildTemplateSections,
  ContactChips,
  CustomSectionItems,
  DescriptionBlock,
  HeroProfileButtons,
  ProfileLinksSection,
  ProjectActions,
  PROJECT_CARD,
  PROJECT_CARD_BODY,
  PROJECT_CARD_HEADER,
  PROJECT_CARD_META,
  PROJECT_CARD_TITLE,
  HERO_HEADER_COLUMN,
  HERO_HEADLINE_SCALE,
  HERO_TITLE_BASE,
  HERO_TITLE_SCALE_7XL,
  PROJECTS_GRID_2,
  TEMPLATE_CONTAINER,
  getSectionLabels,
} from "@/features/templates/shared";
import { CollapsibleList } from "@/features/templates/collapsible-list";
import { getTemplateSectionLayout } from "@/features/templates/section-layouts";
import {
  renderSections,
  resolveSectionLayout,
  type ReorderableSectionKey,
} from "@/features/templates/section-order";
import { resolveAccentColor } from "@/features/templates/template-accent-palettes";
import styles from "./pulse-template.module.css";
import {
  Terminal,
  Cpu,
  MessageSquare,
  MapPin,
  Phone,
  Globe,
  Calendar,
  Award,
  Trophy,
  Star,
  GitFork,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";

// ==========================================
// 1. TYPES (derived from the shared PortfolioData contract)
// ==========================================
type PortfolioMeta = PortfolioData["portfolio"];
type Experience = PortfolioData["experiences"][number];
type Education = PortfolioData["educations"][number];
type Skill = PortfolioData["skills"][number];
type Project = PortfolioData["projects"][number];
type Article = PortfolioData["articles"][number];
type SocialProfile = PortfolioData["socialProfiles"][number];
type Certification = PortfolioData["certifications"][number];
type Achievement = PortfolioData["achievements"][number];

interface AppProps {
  data: PortfolioData;
}

// ==========================================
// SHARED HELPERS (null-safety for fields that are optional on the real data)
// ==========================================
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-pulse-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-pulse-display",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-pulse-serif",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-pulse-mono",
});

function displayDate(dateStr: string | null, fallback = "N/A"): string {
  return formatDate(dateStr) || fallback;
}

function displayYear(dateStr: string | null, fallback = "N/A"): string {
  if (!dateStr) return fallback;
  const date = new Date(dateStr);
  if (!Number.isNaN(date.getTime())) return String(date.getFullYear());
  return dateStr.split("-")[0] || fallback;
}

/** experiences/educations duration calc — guards against a missing start date. */
function getDuration(start: string | null, end: string | null): string {
  if (!start) return '';
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  if (Number.isNaN(startDate.getTime())) return '';

  const years = endDate.getFullYear() - startDate.getFullYear();
  const months = endDate.getMonth() - startDate.getMonth();

  let totalMonths = years * 12 + months;
  if (totalMonths <= 0) totalMonths = 1;

  const displayYears = Math.floor(totalMonths / 12);
  const displayMonths = totalMonths % 12;

  let durationStr = '';
  if (displayYears > 0) {
    durationStr += `${displayYears} yr${displayYears > 1 ? 's' : ''} `;
  }
  if (displayMonths > 0) {
    durationStr += `${displayMonths} mo${displayMonths > 1 ? 's' : ''}`;
  }
  return durationStr.trim();
}

// ==========================================
// 2. HEADER COMPONENT
// ==========================================
interface HeaderProps {
  portfolioTitle: string;
  navItems: Array<{ id: string; label: string }>;
  activeSection: string;
  setActiveSection: (section: string) => void;
  primaryColor: string;
}

function Header({
  portfolioTitle,
  navItems,
  activeSection,
  setActiveSection,
  primaryColor,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleScroll = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl min-h-16 items-center justify-between gap-3 px-4 py-2 @sm:px-6 @lg:px-8">
        {/* Logo/Brand */}
        <div
          onClick={() => handleScroll(navItems[0]?.id ?? 'about')}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 font-display font-bold tracking-tight text-white hover:opacity-95"
          id="header-brand-logo"
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10 transition-colors"
            style={{ color: primaryColor }}
          >
            <Terminal className="h-4.5 w-4.5" />
          </div>
          <span className="min-w-0 text-sm @sm:text-base @md:text-lg leading-snug break-words">
            {portfolioTitle}
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden @md:flex shrink-0 items-center gap-1" id="header-nav-list">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleScroll(item.id)}
              className={`relative px-4 py-2 font-mono text-xs uppercase tracking-wider font-semibold transition-colors duration-200 rounded-md hover:text-white ${activeSection === item.id
                  ? 'text-white bg-white/5'
                  : 'text-slate-400'
                }`}
              id={`nav-item-${item.id}`}
            >
              {item.label}
              {activeSection === item.id && (
                <span
                  className="absolute bottom-1 left-4 right-4 h-0.5 rounded-full"
                  style={{ backgroundColor: primaryColor }}
                />
              )}
            </button>
          ))}
        </nav>

        {navItems.length > 0 && (
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="@md:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            aria-label="Toggle navigation"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        )}
      </div>

      {mobileMenuOpen && navItems.length > 0 && (
        <nav className="border-t border-white/10 bg-[#0a0a0a]/95 px-4 py-3 @md:hidden">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleScroll(item.id)}
                className={`rounded-lg px-3 py-2.5 text-left font-mono text-xs font-semibold uppercase tracking-wider ${activeSection === item.id
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

// ==========================================
// 3. HERO COMPONENT
// ==========================================
interface HeroProps {
  portfolio: PortfolioMeta;
  socialProfiles: SocialProfile[];
  primaryColor: string;
  showSummary?: boolean;
}

function Hero({ portfolio, socialProfiles, primaryColor, showSummary = true }: HeroProps) {
  return (
    <section className="relative overflow-hidden px-0 pt-8 pb-10 @sm:pt-10 @sm:pb-12 @md:py-16 scroll-mt-20" id="about">
      {/* Absolute Ambient Glow */}
      <div
        className="absolute -top-40 right-0 h-96 w-96 rounded-full blur-[120px] opacity-20 pointer-events-none transition-colors duration-500"
        style={{ backgroundColor: primaryColor }}
      />
      <div
        className="absolute -bottom-20 left-10 h-72 w-72 rounded-full blur-[100px] opacity-10 pointer-events-none transition-colors duration-500"
        style={{ backgroundColor: primaryColor }}
      />

      <div className="mx-auto max-w-7xl px-4 @sm:px-6 @lg:px-8">
        <div className="grid grid-cols-1 @lg:grid-cols-12 gap-12 @lg:gap-16 items-center">

          {/* Left Column: Core Bio */}
          <div className="@lg:col-span-7 space-y-8" id="hero-bio-container">


            <div className={cn(HERO_HEADER_COLUMN, "space-y-4")}>
              <h1
                className={cn(
                  HERO_TITLE_BASE,
                  HERO_TITLE_SCALE_7XL,
                  "font-serif font-normal italic tracking-tight text-white leading-tight"
                )}
              >
                <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400 not-italic font-sans font-bold">
                  {portfolio.title}
                </span>
              </h1>

              {portfolio.headline && (
                <h2
                  className={cn(HERO_HEADLINE_SCALE, "font-display font-medium tracking-tight")}
                  style={{ color: primaryColor }}
                >
                  {portfolio.headline}
                </h2>
              )}

              {showSummary && portfolio.summary && (
                <DescriptionBlock
                  text={portfolio.summary}
                  paragraphClassName="font-sans text-base @sm:text-lg text-slate-400 leading-relaxed max-w-2xl"
                  listClassName="space-y-2 pl-5 font-sans text-base @sm:text-lg text-slate-400 leading-relaxed max-w-2xl marker:text-slate-500"
                />
              )}

              <ContactChips
                portfolio={portfolio}
                chipClassName="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-mono text-slate-300"
              />
              <div id="hero-profiles" className="scroll-mt-24 space-y-3">
                <HeroProfileButtons
                  profiles={socialProfiles}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10 transition-colors"
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 4. TIMELINE COMPONENT
// ==========================================
interface TimelineProps {
  experiences: Experience[];
  primaryColor: string;
  labels: ReturnType<typeof getSectionLabels>;
}

function Timeline({ experiences, primaryColor, labels }: TimelineProps) {
  if (experiences.length === 0) return null;
  const orderedExperiences = sortExperiencesNewestFirst(experiences);

  return (
    <section key="experience" className="py-12 scroll-mt-20 bg-transparent" id="experience">
      <div className="mx-auto max-w-7xl px-4 @sm:px-6 @lg:px-8">

        {/* Section Heading */}
        <div className="mb-8">
          <SectionHeading>{labels.experience}</SectionHeading>
        </div>

        <div className="space-y-10">

          {/* Work Experience */}
          <div className="space-y-6" id="timeline-experience-list">
              <div className="relative border-l border-white/10 pl-5 @sm:pl-6 ml-3 @sm:ml-5">
                <CollapsibleList
                  initial={4}
                  wrapperClassName="space-y-8"
                  buttonClassName="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-mono text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {orderedExperiences.map((exp) => {
                    const bulletPoints = (exp.description ?? "")
                      .split("\n")
                      .filter((p) => p.trim().length > 0);
                    const duration = getDuration(exp.startDate, exp.endDate);
                    return (
                      <div key={exp.id} className="relative group" id={`experience-card-${exp.id}`}>

                        {/* Timeline Node Point */}
                        <div
                          className="absolute -left-[27px] @sm:-left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#0a0a0a] border-2 transition-all group-hover:scale-125"
                          style={{
                            borderColor: primaryColor,
                            boxShadow: `0 0 10px ${primaryColor}40`
                          }}
                        />

                        <div className="space-y-4">
                          {/* Title & Metadata Card Header */}
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="min-w-0 flex-1 font-display text-base @sm:text-lg font-bold text-white group-hover:text-slate-200 transition-colors break-words">
                                {exp.role}
                              </h4>
                              {/* Period Tag — sits beside title so company can use full width below */}
                              <div className="inline-flex items-start gap-2 text-xs font-mono text-slate-500 bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-md shrink-0">
                                <Calendar className="h-3 w-3 shrink-0 mt-0.5" />
                                <div className="flex flex-col gap-0.5">
                                  <span className="whitespace-nowrap text-slate-400">
                                    {formatDateRange(exp.startDate, exp.endDate) || "N/A"}
                                  </span>
                                  {duration && (
                                    <span className="text-slate-400 whitespace-nowrap">
                                      {duration}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <span
                              className="block w-full font-sans text-sm font-semibold transition-colors"
                              style={{ color: primaryColor }}
                            >
                              {exp.company}
                            </span>
                          </div>

                          {/* Location details */}
                          {exp.location && (
                            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500">
                              <MapPin className="h-3 w-3" />
                              <span>{exp.location}</span>
                            </div>
                          )}

                          {/* Decoded Bullet Points */}
                          {bulletPoints.length > 0 && (
                            <CollapsibleList
                              initial={3}
                              wrapperClassName="space-y-3 pt-1"
                              buttonClassName="mt-1 text-xs font-mono text-slate-400 hover:text-white transition-colors"
                            >
                              {bulletPoints.map((point, pIdx) => (
                                <div key={pIdx} className="flex gap-3 text-sm text-slate-400 leading-relaxed">
                                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-700 group-hover:bg-slate-400 transition-colors" />
                                  <span>{point}</span>
                                </div>
                              ))}
                            </CollapsibleList>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CollapsibleList>
              </div>
            </div>

        </div>
      </div>
    </section>
  );
}

interface EducationSectionProps {
  educations: Education[];
  primaryColor: string;
  labels: ReturnType<typeof getSectionLabels>;
}

function EducationSection({ educations, primaryColor, labels }: EducationSectionProps) {
  if (educations.length === 0) return null;

  return (
    <section key="education" className="py-12 scroll-mt-20 bg-transparent" id="education">
      <div className="mx-auto max-w-7xl px-4 @sm:px-6 @lg:px-8">
        <div className="space-y-6" id="timeline-education-list">
          <SectionHeading>{labels.education}</SectionHeading>

          <CollapsibleList
            initial={4}
            wrapperClassName="grid grid-cols-1 @md:grid-cols-2 gap-4"
            buttonClassName="@md:col-span-2 mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-mono text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            {educations.map((edu) => (
              <div
                key={edu.id}
                className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all shadow-xl space-y-3"
                id={`education-card-${edu.id}`}
              >
                <div className="space-y-1">
                  <div className="flex justify-between items-start gap-4">
                    <h4 className="font-display text-base font-bold text-white">
                      {edu.degree}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 bg-[#0a0a0a]/80 px-2 py-0.5 rounded border border-white/10">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {displayYear(edu.endDate)}
                      </span>
                    </div>
                  </div>
                  {edu.field && (
                    <p className="font-sans text-sm text-slate-400 font-medium">
                      {edu.field}
                    </p>
                  )}
                  <p
                    className="font-display text-xs font-semibold"
                    style={{ color: primaryColor }}
                  >
                    {edu.institution}
                  </p>
                </div>

                {edu.gpa && (
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">GPA</span>
                    <div className="flex h-6 items-center gap-1 bg-[#0a0a0a]/85 px-2.5 py-0.5 rounded border border-white/10 text-white font-bold">
                      <Award className="h-3.5 w-3.5 text-amber-500" />
                      <span>{edu.gpa}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CollapsibleList>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 5. SKILLS MATRIX COMPONENT
// ==========================================
interface SkillsMatrixProps {
  skills: Skill[];
  primaryColor: string;
  labels: ReturnType<typeof getSectionLabels>;
}

function SkillsMatrix({ skills, primaryColor, labels }: SkillsMatrixProps) {
  const groupedSkills = useMemo(() => groupSkillsByCategory(skills), [skills]);

  return (
    <section className="py-12 bg-transparent border-y border-white/10" id="skills">
      <div className="mx-auto max-w-7xl px-4 @sm:px-6 @lg:px-8">

        {/* Header */}
        <div className="mb-12">
          <SectionHeading>{labels.skills}</SectionHeading>
        </div>

        {/* Category-wise Skill Groups */}
        <div className="space-y-12" id="skills-matrix-grid">
          {Object.entries(groupedSkills).map(([category, names]) => (
            <div key={category} className="space-y-5">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: primaryColor }}
                />
                <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-slate-400">
                  {category}
                </h3>
              </div>

              <div className="grid grid-cols-1 @sm:grid-cols-2 @md:grid-cols-3 @lg:grid-cols-4 gap-6">
                {names.map((name) => {
                  return (
                    <div
                      key={`${category}-${name}`}
                      className="relative min-h-auto overflow-hidden p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 flex flex-col justify-between gap-4 group"
                      id={`skill-card-${category}-${name}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 space-y-1">
                          <h4 className="line-clamp-2 break-words font-display text-base font-bold text-white group-hover:text-white">
                            {name}
                          </h4>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

// ==========================================
// 6. PROJECTS SHOWCASE COMPONENT
// ==========================================
interface ProjectsShowcaseProps {
  projects: Project[];
  livePreviewProjectIds: string[];
  labels: ReturnType<typeof getSectionLabels>;
  primaryColor: string;
}

function ProjectsShowcase({
  projects,
  livePreviewProjectIds,
  labels,
  primaryColor,
}: ProjectsShowcaseProps) {
  return (
    <section className="py-12 scroll-mt-20" id="work">
      <div className="mx-auto max-w-7xl px-4 @sm:px-6 @lg:px-8">

        {/* Header Title */}
        <div className="mb-8 @sm:mb-16">
          <SectionHeading>{labels.projects}</SectionHeading>
        </div>

        {/* Projects Grid */}
        <CollapsibleList
          initial={4}
          wrapperClassName={cn(PROJECTS_GRID_2, "gap-4 @sm:gap-8 mb-8 @sm:mb-20")}
          buttonClassName="@md:col-span-2 mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-mono text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          {projects.map((project) => (
            <div
              key={project.id}
              className={cn(
                PROJECT_CARD,
                "group relative rounded-2xl @sm:rounded-3xl bg-white/5 border transition-all hover:bg-white/10 @md:hover:scale-[1.01] flex flex-col justify-between min-w-0",
                project.featured
                  ? "border-white/20 ring-1 ring-white/10"
                  : "border-white/10"
              )}
              id={`project-card-${project.id}`}
            >
              <div className="relative">
                <TemplateProjectPreview
                  templateId="pulse"
                  liveUrl={project.liveUrl}
                  projectId={project.id}
                  livePreviewProjectIds={livePreviewProjectIds}
                  alt={project.title}
                  loading="lazy"
                  accentColor={primaryColor}
                  containerClassName="bg-[#0a0a0a] border-b border-white/10"
                  className="opacity-75 transition-all duration-300 group-hover:opacity-90"
                />
                {project.language && (
                  <div className="absolute top-4 left-4 z-10 max-w-[45%] truncate bg-[#0a0a0a]/95 border border-white/10 rounded-lg px-2.5 py-1 text-[11px] font-mono text-slate-300">
                    {project.language}
                  </div>
                )}
                {project.featured && (
                  <div className="absolute top-4 right-4 z-10 max-w-[45%] truncate bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-right text-[11px] font-mono text-white font-semibold">
                    Featured
                  </div>
                )}
              </div>

              <div className={cn(PROJECT_CARD_BODY, "space-y-6")}>
                <div className="space-y-2">
                  <div className={PROJECT_CARD_HEADER}>
                    <div className={PROJECT_CARD_META}>
                      <h3 className={cn(PROJECT_CARD_TITLE, "font-display text-xl @sm:text-2xl font-bold text-white leading-tight")}>
                        {project.title}
                      </h3>
                    </div>
                  </div>
                  {project.description && (
                    <DescriptionBlock
                      text={project.description}
                      paragraphClassName="font-sans text-sm text-slate-400 leading-relaxed"
                      listClassName="space-y-2 pl-5 font-sans text-sm text-slate-400 leading-relaxed marker:text-slate-600"
                    />
                  )}
                </div>

                {project.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {project.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-2.5 py-1 rounded-lg bg-[#0a0a0a] border border-white/10 text-xs font-mono text-slate-300"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-4 @sm:px-6 @md:px-8 py-4 @sm:py-5 border-t border-white/10 bg-white/2 flex flex-col @sm:flex-row @sm:flex-wrap justify-between items-stretch @sm:items-center gap-3 @sm:gap-4">

                {(project.githubStars !== null || project.githubForks !== null) && (
                  <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
                    {project.githubStars !== null && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5" />
                        <span>{project.githubStars}</span>
                      </div>
                    )}
                    {project.githubForks !== null && (
                      <div className="flex items-center gap-1">
                        <GitFork className="h-3.5 w-3.5" />
                        <span>{project.githubForks}</span>
                      </div>
                    )}
                  </div>
                )}

                <ProjectActions
                  liveUrl={project.liveUrl}
                  sourceUrl={project.sourceUrl}
                  liveClassName="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono bg-white hover:bg-slate-100 text-slate-950 transition-all shadow"
                  sourceClassName="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono bg-[#0a0a0a] hover:bg-white/5 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-all"
                />

              </div>
            </div>
          ))}
        </CollapsibleList>


      </div>
    </section>
  );
}

// ==========================================
// 7. ARTICLES AND SOCIALS COMPONENT
// ==========================================
// 7. ORDERABLE CONTENT SECTIONS
// ==========================================
function CertificationsSection({
  certifications,
  labels,
}: {
  certifications: Certification[];
  labels: ReturnType<typeof getSectionLabels>;
}) {
  if (certifications.length === 0) return null;

  return (
    <section key="certifications" className="py-12 bg-transparent" id="certifications">
      <div className="mx-auto max-w-7xl px-4 @sm:px-6 @lg:px-8 space-y-6">
        <SectionHeading>{labels.certifications}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName="space-y-4"
          buttonClassName="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-mono text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col @sm:flex-row @sm:items-center justify-between gap-4 group hover:border-white/20 transition-all"
              id={`cert-card-${cert.id}`}
            >
              <div className="space-y-1">
                <h4 className="font-display text-base font-bold text-white">
                  {cert.name}
                </h4>
                <p className="font-sans text-xs text-slate-400">
                  Issued by <span className="font-semibold text-slate-300">{cert.issuer}</span>
                  {cert.issueDate && <> &bull; {displayDate(cert.issueDate)}</>}
                </p>
              </div>
              {cert.url && (
                <a
                  href={cert.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 self-start @sm:self-center shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono bg-[#0a0a0a] text-slate-400 hover:text-white border border-white/10 hover:border-white/20 transition-colors"
                >
                  View credential
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          ))}
        </CollapsibleList>
      </div>
    </section>
  );
}

function ArticlesSection({
  articles,
  labels,
}: {
  articles: Article[];
  labels: ReturnType<typeof getSectionLabels>;
}) {
  if (articles.length === 0) return null;

  return (
    <section key="articles" className="py-12 bg-transparent" id="articles">
      <div className="mx-auto max-w-7xl px-4 @sm:px-6 @lg:px-8 space-y-6">
        <SectionHeading>{labels.articles}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName="space-y-4"
          buttonClassName="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-mono text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          {articles.map((art) => (
            <a
              key={art.id}
              href={art.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 block group hover:bg-white/10 transition-all space-y-3"
              id={`article-card-${art.id}`}
            >
              <div className="space-y-1">
                {art.publishedAt && (
                  <span className="text-[10px] font-mono text-slate-500 bg-[#0a0a0a] px-2 py-0.5 rounded border border-white/10">
                    {displayDate(art.publishedAt)}
                  </span>
                )}
                <h4 className="font-display text-base font-bold text-white group-hover:text-white leading-snug pt-1">
                  {art.title}
                </h4>
                {art.description && (
                  <p className="font-sans text-xs text-slate-400 leading-relaxed line-clamp-2">{art.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs font-mono text-slate-500 group-hover:text-slate-300 transition-colors">
                <span>Read entire publication{art.readTime ? ` · ${art.readTime} min` : ''}</span>
                <ExternalLink className="h-3 w-3" />
              </div>
            </a>
          ))}
        </CollapsibleList>
      </div>
    </section>
  );
}

function AchievementsSection({
  achievements,
  primaryColor,
  labels,
}: {
  achievements: Achievement[];
  primaryColor: string;
  labels: ReturnType<typeof getSectionLabels>;
}) {
  if (achievements.length === 0) return null;

  return (
    <section key="achievements" className="py-12 bg-transparent" id="achievements">
      <div className="mx-auto max-w-7xl px-4 @sm:px-6 @lg:px-8 space-y-6">
        <SectionHeading>{labels.achievements}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName="relative pl-4 space-y-8"
          buttonClassName="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-mono text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className="relative pl-6 border-l border-white/10 space-y-2 group"
              id={`achievement-card-${ach.id}`}
            >
              <div
                className="absolute -left-[9px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-800 border transition-all duration-300 group-hover:scale-110"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                <Trophy className="h-2.5 w-2.5" />
              </div>
              <div className="space-y-1">
                {ach.date && (
                  <span className="text-[10px] font-mono text-slate-500 block">
                    {displayDate(ach.date)}
                  </span>
                )}
                <h4 className="font-display text-sm font-bold text-white leading-snug group-hover:text-slate-300 transition-colors">
                  {ach.title}
                </h4>
              </div>
            </div>
          ))}
        </CollapsibleList>
      </div>
    </section>
  );
}

function ProfilesSection({
  portfolio,
  socialProfiles,
  hasProfiles,
  labels,
}: {
  portfolio: PortfolioMeta;
  socialProfiles: SocialProfile[];
  hasProfiles: boolean;
  labels: ReturnType<typeof getSectionLabels>;
}) {
  if (!hasProfiles && socialProfiles.length === 0) return null;

  return (
    <section key="profiles" className="py-12 bg-transparent scroll-mt-20" id="profiles">
      <div className="mx-auto max-w-7xl px-4 @sm:px-6 @lg:px-8 space-y-6">
        <SectionHeading>{labels.profiles}</SectionHeading>
        <ProfileLinksSection
          portfolio={portfolio}
          profiles={socialProfiles}
          chipClassName="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-mono text-slate-300"
          pillClassName="rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-1.5 text-xs font-mono text-slate-300 hover:bg-white/10 transition-colors"
          titleClassName="font-display text-sm font-bold text-white"
          textClassName="font-sans text-xs text-slate-400"
        />
      </div>
    </section>
  );
}


// ==========================================
// 9. MAIN APP COMPONENT
// ==========================================
export function PulseTemplate({ data }: AppProps) {
  const {
    portfolio,
    experiences,
    educations,
    skills,
    projects,
    articles,
    socialProfiles,
    certifications,
    achievements,
    customSections,
    livePreviewProjectIds,
  } = data;

  const customization: PortfolioCustomization = portfolio.customization ?? {};
  const primaryColor = resolveAccentColor("pulse", customization);

  const [activeSection, setActiveSection] = useState('about');

  const hasContact =
    Boolean(portfolio.contactEmail) ||
    Boolean(portfolio.phone) ||
    Boolean(portfolio.location) ||
    Boolean(portfolio.websiteUrl);

  const githubProfile = socialProfiles.find(
    (p) => p.platform.toLowerCase() === "github"
  );
  const githubStats = githubProfile?.cachedStats as Record<string, unknown> | null;
  const contributionCalendar = parseContributionCalendar(
    githubStats?.contributionCalendar
  );
  const { hasProfiles, navbarEnabled, sections } = buildTemplateSections(data);
  const navItems = navbarEnabled ? sections : [];
  const navSectionIds = navItems.map((section) => section.id).join(",");
  const navSectionIdsRef = useRef(navSectionIds);
  navSectionIdsRef.current = navSectionIds;
  const labels = getSectionLabels(portfolio.customization);
  const resolved = resolveSectionLayout(
    getTemplateSectionLayout("pulse"),
    portfolio.customization,
  );
  const featuredProjects = projects.filter((project) => project.featured);
  const visibleProjects =
    featuredProjects.length > 0
      ? [...featuredProjects, ...projects.filter((p) => !p.featured)]
      : projects;

  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: null,
    experience: experiences.length > 0 ? (
      <Timeline
        experiences={experiences}
        primaryColor={primaryColor}
        labels={labels}
      />
    ) : null,
    education: educations.length > 0 ? (
      <EducationSection
        educations={educations}
        primaryColor={primaryColor}
        labels={labels}
      />
    ) : null,
    skills: skills.length > 0 ? (
      <SkillsMatrix
        key="skills"
        skills={skills}
        primaryColor={primaryColor}
        labels={labels}
      />
    ) : null,
    projects: visibleProjects.length > 0 ? (
      <ProjectsShowcase
        key="projects"
        projects={visibleProjects}
        livePreviewProjectIds={livePreviewProjectIds}
        labels={labels}
        primaryColor={primaryColor}
      />
    ) : null,
    github: contributionCalendar ? (
      <section key="github" className="py-12" id="github-activity">
        <div className="mx-auto max-w-7xl px-4 @sm:px-6 @lg:px-8 space-y-6">
          <SectionHeading>{labels.github}</SectionHeading>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 overflow-x-auto">
            <div className="mx-auto w-max max-w-full">
              <GitHubContributionHeatmap
                calendar={contributionCalendar}
                profileUrl={githubProfile?.url}
                username={githubProfile?.username}
              />
            </div>
          </div>
        </div>
      </section>
    ) : null,
    certifications:
      certifications.length > 0 ? (
        <CertificationsSection
          certifications={certifications}
          labels={labels}
        />
      ) : null,
    articles:
      articles.length > 0 ? (
        <ArticlesSection articles={articles} labels={labels} />
      ) : null,
    achievements:
      achievements.length > 0 ? (
        <AchievementsSection
          achievements={achievements}
          primaryColor={primaryColor}
          labels={labels}
        />
      ) : null,
    profiles:
      hasProfiles || socialProfiles.length > 0 ? (
        <ProfilesSection
          portfolio={portfolio}
          socialProfiles={socialProfiles}
          hasProfiles={hasProfiles}
          labels={labels}
        />
      ) : null,
  };

  useEffect(() => {
    const sectionIds = navSectionIdsRef.current.split(",").filter(Boolean);
    if (sectionIds.length === 0) return;

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0]?.target;
        if (top?.id) setActiveSection(top.id);
      },
      { root: null, rootMargin: "-20% 0px -55% 0px", threshold: [0.1, 0.25, 0.5] },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [navSectionIds]);

  return (
    <div
      className={cn(
        TEMPLATE_CONTAINER,
        styles.root,
        inter.variable,
        spaceGrotesk.variable,
        playfairDisplay.variable,
        jetBrainsMono.variable,
        "flex min-w-0 flex-col overflow-x-hidden font-sans selection:bg-slate-800 selection:text-white"
      )}
      style={{ ["--lf-accent" as string]: primaryColor }}
    >
      {/* Dynamic glow overlay */}
      <div
        className="fixed top-0 left-1/4 h-[40vh] w-[50vw] rounded-full blur-[140px] opacity-10 pointer-events-none transition-colors duration-1000"
        style={{ backgroundColor: primaryColor }}
      />

      {/* Primary Header/Nav */}
      <Header
        portfolioTitle={portfolio.title}
        navItems={navItems}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        primaryColor={primaryColor}
      />

      {/* Main Content Sections */}
      <main className="flex-1" id="main-content-stream">

        {/* 1. Hero Bio Intro */}
        <Hero
          portfolio={portfolio}
          socialProfiles={socialProfiles}
          primaryColor={primaryColor}
          showSummary={!resolved.isHidden("about")}
        />

        {renderSections(resolved, "full", blocks)}

        {customSections.length > 0 && (
          <section className="py-12 bg-transparent">
            <div className="mx-auto max-w-7xl px-4 @sm:px-6 @lg:px-8 space-y-12">
              {customSections.map((section) => (
                <div key={section.id} className="space-y-6" id={`custom-section-${section.id}`}>
                  <SectionHeading>{section.label}</SectionHeading>
                  <CustomSectionItems
                    items={section.items}
                    titleClassName="font-display text-base font-bold text-white"
                    textClassName="font-sans text-sm text-slate-400 leading-relaxed"
                    chipClassName="rounded-lg bg-[#0a0a0a] border border-white/10 px-2 py-0.5 text-[10px] font-mono text-slate-400"
                    buttonClassName="mt-2 text-xs font-mono text-slate-400 hover:text-white"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Primary Footer */}
      <footer className="mt-10 pt-6 border-t border-white/10 flex justify-between items-center text-[10px] font-mono tracking-widest text-slate-500 py-8 mx-auto w-full max-w-7xl px-4 @sm:px-6 @lg:px-8">
        <div className="flex flex-col @md:flex-row items-center justify-between w-full gap-6">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4" style={{ color: primaryColor }} />
            <span>{portfolio.title.toUpperCase()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({
  children,
  as: Tag = "h2",
}: {
  children: React.ReactNode;
  as?: "h2" | "h3";
}) {
  return (
    <Tag
      className={
        Tag === "h3"
          ? "w-full border-b border-white/10 pb-4 text-left font-serif text-2xl @sm:text-3xl font-normal italic tracking-tight text-slate-200"
          : "w-full border-b border-white/10 pb-4 text-left font-serif text-3xl @sm:text-4xl font-normal italic tracking-tight text-slate-200"
      }
    >
      {children}
    </Tag>
  );
}