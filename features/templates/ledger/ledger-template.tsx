"use client";

import { useState, useMemo, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import {
  PlatformIcon,
} from "@/components/icons";
import { TemplateProjectPreview } from "@/components/template-project-preview";
import { cn } from "@/lib/utils";
import { formatDateRange, groupSkillsByCategory, sortExperiencesNewestFirst } from "@/features/templates/utils";
import type { PortfolioData } from "@/features/templates/types";
import { resolveAccentColor, accentRootStyle } from "@/features/templates/template-accent-palettes";
import {
  GitHubContributionHeatmap,
  parseContributionCalendar,
} from "@/features/templates/github-contribution-heatmap";
import {
  buildTemplateSections,
  ContactChips,
  CustomSectionItems,
  DescriptionBlock,
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
import styles from "./ledger-template.module.css";
import {
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Star,
  GitFork,
  Calendar,
  Trophy,
  BookOpen,
  GraduationCap,
  Search,
  Check,
  Copy,
  ArrowUpRight,
  Menu,
  X,
  ChevronRight,
  FileCheck,
  Filter,
} from "lucide-react";

interface AppProps {
  data: PortfolioData;
}

// ---- helpers -------------------------------------------------------------

function displayYear(date: string | null, fallback = "N/A"): string {
  if (!date) return fallback;
  const parsed = new Date(date);
  if (!Number.isNaN(parsed.getTime())) return String(parsed.getFullYear());
  return date.slice(0, 4) || fallback;
}

/** Initials from the first two words of a display name (e.g. "Akshai Kumar" → "AK"). */
function getInitials(title: string): string {
  const parts = title.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

/** skills.level is a numeric score (0-5) or null; map it to a display label + color. */
function getSkillLevelDisplay(level: number | null): { label: string; classes: string } | null {
  if (level === null || level === undefined) return null;
  if (level >= 4) {
    return { label: 'Expert', classes: 'bg-[color-mix(in_srgb,var(--lf-accent)_10%,transparent)] border border-[color-mix(in_srgb,var(--lf-accent)_20%,transparent)] text-[var(--lf-accent)]' };
  }
  if (level >= 3) {
    return { label: 'Advanced', classes: 'bg-[color-mix(in_srgb,var(--lf-accent)_10%,transparent)] border border-[color-mix(in_srgb,var(--lf-accent)_20%,transparent)] text-[var(--lf-accent)]' };
  }
  return { label: 'Familiar', classes: 'bg-slate-900 border border-slate-800 text-slate-400' };
}

/** cachedStats is Record<string, unknown> | null; read known numeric-ish fields safely. */
function getSocialStatLabel(stats: Record<string, unknown> | null): string | null {
  if (!stats) return null;
  if (stats.followers !== undefined && stats.followers !== null) {
    return `${stats.followers} flwrs`;
  }
  if (stats.connections !== undefined && stats.connections !== null) {
    return `${stats.connections}+ conns`;
  }
  return null;
}

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-ledger-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-ledger-display',
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-ledger-mono',
});

export function LedgerTemplate({ data }: AppProps) {
  const {
    portfolio,
    experiences: experiencesRaw,
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
  const experiences = sortExperiencesNewestFirst(experiencesRaw);
  const primaryColor = resolveAccentColor("ledger", portfolio.customization);

  // State management
  const [copiedText, setCopiedText] = useState<'email' | 'phone' | null>(null);
  const [projectSearch, setProjectSearch] = useState<string>('');
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [activeExperienceTab, setActiveExperienceTab] = useState<string>(experiences[0]?.id ?? '');

  const githubProfile = socialProfiles.find(
    (p) => p.platform.toLowerCase() === "github"
  );
  const githubStats = githubProfile?.cachedStats as Record<string, unknown> | null;
  const contributionCalendar = parseContributionCalendar(
    githubStats?.contributionCalendar
  );
  const { hasProfiles, navbarEnabled, sections } = buildTemplateSections(data);
  const navItems = navbarEnabled ? sections : [];
  const labels = getSectionLabels(portfolio.customization);
  const resolved = resolveSectionLayout(
    getTemplateSectionLayout("ledger"),
    portfolio.customization,
  );
  const isSectionEnabled = (id: 'about' | 'work' | 'experience' | 'profiles') =>
    sections.some((s) => s.id === id);
  const groupedSkills = groupSkillsByCategory(skills);
  const visibleProjects = [
    ...projects.filter((p) => p.featured),
    ...projects.filter((p) => !p.featured),
  ];

  // Copy helper — no-ops gracefully if the value is missing
  const handleCopy = (text: string | null, type: 'email' | 'phone') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Get list of all distinct technologies in projects
  const allProjectTechs = useMemo(() => {
    const techs = new Set<string>();
    visibleProjects.forEach(p => p.techStack.forEach(t => techs.add(t)));
    return Array.from(techs);
  }, [visibleProjects]);

  // Filter projects based on search text and selected technology tag
  const filteredProjects = useMemo(() => {
    return visibleProjects.filter(p => {
      const matchesSearch =
        p.title.toLowerCase().includes(projectSearch.toLowerCase()) ||
        p.description.toLowerCase().includes(projectSearch.toLowerCase()) ||
        p.techStack.some(t => t.toLowerCase().includes(projectSearch.toLowerCase()));
      const matchesTech = selectedTech ? p.techStack.includes(selectedTech) : true;
      return matchesSearch && matchesTech;
    });
  }, [visibleProjects, projectSearch, selectedTech]);

  // Render social profile icon helper
  const getSocialIcon = (platform: string, className = 'w-5 h-5') => (
    <PlatformIcon platform={platform} className={className} />
  );


  const blocks: Partial<Record<ReorderableSectionKey, ReactNode>> = {
    about: null,
    experience: experiences.length > 0
      ? (
        <section key="experience" id="experience" className="space-y-8 scroll-mt-20">
            <div className="border-l-2 border-[var(--lf-accent)] pl-4">
              <SectionHeading>{labels.experience}</SectionHeading>
            </div>

            <div className="grid grid-cols-1 @lg:grid-cols-12 gap-6 @lg:gap-8">
              {/* Sidebar list for active experience */}
              <div className="@lg:col-span-4 space-y-2">
                <div className="flex items-center justify-between @lg:hidden px-1">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
                    Roles
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--lf-accent)]">
                    {Math.max(1, experiences.findIndex((e) => e.id === activeExperienceTab) + 1)} / {experiences.length}
                    {experiences.length > 1 ? " · swipe" : ""}
                  </span>
                </div>
                <div
                  id="experience-tabs"
                  className="flex flex-row @lg:flex-col gap-2 overflow-x-auto @lg:overflow-x-visible pb-2 @lg:pb-0 border-b @lg:border-b-0 @lg:border-r border-slate-800 snap-x snap-mandatory @lg:snap-none scrollbar-none"
                >
                  {experiences.map((exp, index) => (
                    <button
                      key={exp.id}
                      onClick={() => setActiveExperienceTab(exp.id)}
                      className={`snap-start flex-none w-[min(78vw,18rem)] @sm:w-[min(60vw,20rem)] @lg:w-auto @lg:max-w-none @lg:flex-1 text-left px-4 py-3 border transition-all flex flex-col gap-1 items-start rounded-none ${
                        activeExperienceTab === exp.id
                          ? 'bg-[color-mix(in_srgb,var(--lf-accent)_8%,transparent)] border-l-2 border-l-[var(--lf-accent)] border-slate-800 text-white'
                          : 'bg-slate-950/40 border border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-900/40 @lg:bg-transparent @lg:border-transparent'
                      }`}
                      id={`tab-${exp.id}`}
                    >
                      <span className="font-mono text-[9px] uppercase tracking-widest text-slate-600 @lg:hidden">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span
                        className="font-mono font-bold text-xs uppercase tracking-wider whitespace-normal break-words w-full"
                        style={{ color: primaryColor }}
                      >
                        {exp.role}
                      </span>
                      <span className="text-xs font-mono text-slate-500 whitespace-normal break-words w-full">
                        {exp.company}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active experience detail container */}
              <div className="@lg:col-span-8 min-h-[250px]">
                <AnimatePresence mode="wait">
                  {experiences.map((exp) => exp.id === activeExperienceTab && (
                    <motion.div
                      key={exp.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="bg-[#111418] border border-slate-800 p-4 @sm:p-6 @md:p-8 rounded-none space-y-4 @sm:space-y-6"
                      id={`exp-content-${exp.id}`}
                    >
                      <div className="space-y-3 border-b border-slate-800 pb-4">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="min-w-0 flex-1 text-base @sm:text-lg font-mono font-bold uppercase break-words">
                            <span style={{ color: primaryColor }}>{exp.role}</span>
                          </h3>
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-slate-900 border border-slate-800 text-xs text-slate-400 font-mono shrink-0">
                            <Calendar className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                            <span className="whitespace-nowrap">
                              {formatDateRange(exp.startDate, exp.endDate)?.toUpperCase() ||
                                "N/A"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-sm text-white uppercase tracking-wide w-full">
                          <span className="text-slate-500 font-normal shrink-0">@</span>
                          <span className="min-w-0">{exp.company}</span>
                        </div>
                        {exp.location && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                            <MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            <span className="uppercase break-words">{exp.location}</span>
                          </div>
                        )}
                      </div>

                      {exp.description && (
                        <DescriptionBlock
                          text={exp.description}
                          paragraphClassName="text-sm text-slate-300 leading-relaxed"
                          listClassName="space-y-3 text-sm text-slate-300 leading-relaxed"
                        />
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </section>
      )
      : null,
    projects: visibleProjects.length > 0
      ? (
        <section key="projects" id="work" className="space-y-8 scroll-mt-20">
          <div className="flex flex-col @sm:flex-row @sm:items-end justify-between gap-4 border-l-2 border-[var(--lf-accent)] pl-4">
            <div>
              <SectionHeading>{labels.projects}</SectionHeading>
            </div>

            {/* Total count badge */}
            <div className="px-3 py-1.5 rounded-none bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400">
              COUNT: {filteredProjects.length} / {visibleProjects.length}
            </div>
          </div>

          {/* Interactive Search & Filter Controls */}
          <div id="project-filters-container" className="bg-[#111418] border border-slate-800 p-4 rounded-none space-y-4">
            <div className="flex flex-col @md:flex-row gap-4">
              {/* Search Bar */}
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  id="project-search-input"
                  placeholder="SEARCH PROJECTS..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  className="w-full min-w-0 bg-slate-950 border border-slate-800 focus:border-[var(--lf-accent)] rounded-none py-2.5 pl-10 pr-4 text-xs font-mono uppercase tracking-wider text-white placeholder-slate-600 focus:outline-none transition-colors"
                />
                {projectSearch && (
                  <button
                    onClick={() => setProjectSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 hover:text-white px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded-none"
                  >
                    CLEAR
                  </button>
                )}
              </div>

              {/* Technologies quick select dropdown or filter row */}
              {allProjectTechs.length > 0 && (
                <div className="flex min-w-0 max-w-full items-center gap-2 overflow-x-auto pb-1 @md:max-w-[55%] @md:pb-0">
                  <span className="text-xs font-mono text-slate-500 whitespace-nowrap flex items-center gap-1 uppercase tracking-wider">
                    <Filter className="w-3 h-3 text-[var(--lf-accent)]" /> TECH STACK:
                  </span>
                  <button
                    onClick={() => setSelectedTech(null)}
                    className={`px-2.5 py-1 rounded-none text-[10px] font-mono uppercase tracking-wider transition-colors whitespace-nowrap ${
                      selectedTech === null
                        ? 'bg-[var(--lf-accent)] text-white'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                    id="filter-tech-all"
                  >
                    ALL TECH
                  </button>
                  {allProjectTechs.map(tech => (
                    <button
                      key={tech}
                      onClick={() => setSelectedTech(tech === selectedTech ? null : tech)}
                      className={`px-2.5 py-1 rounded-none text-[10px] font-mono uppercase tracking-wider transition-colors whitespace-nowrap ${
                        selectedTech === tech
                          ? 'bg-[var(--lf-accent)] text-white'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                      id={`filter-tech-${tech}`}
                    >
                      {tech}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Projects Grid */}
          <CollapsibleList
            initial={4}
            wrapperClassName={cn(PROJECTS_GRID_2, "gap-6")}
            buttonClassName="@md:col-span-2 mt-2 rounded-none border border-slate-800 bg-[#111418] px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-slate-400 hover:border-[var(--lf-accent)] hover:text-[var(--lf-accent)] transition-colors"
          >
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className={cn(
                    PROJECT_CARD,
                    "group bg-[#111418] border border-slate-800 rounded-none hover:border-slate-700 transition-all duration-300 flex flex-col justify-between"
                  )}
                  id={`project-card-${project.id}`}
                >
                  <div>
                    <div className="relative overflow-hidden border-b border-slate-800 bg-slate-950">
                      <TemplateProjectPreview
                        templateId="ledger"
                        liveUrl={project.liveUrl}
                        projectId={project.id}
                        livePreviewProjectIds={livePreviewProjectIds}
                        alt={project.title}
                        loading="lazy"
                        accentColor={primaryColor}
                        containerClassName="bg-slate-950"
                        className="opacity-60 transition-all duration-500 group-hover:opacity-80"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#111418] to-transparent opacity-80" />

                      <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
                        {project.featured ? (
                          <span className="px-2 py-1 rounded-none bg-[color-mix(in_srgb,var(--lf-accent)_15%,transparent)] border border-[color-mix(in_srgb,var(--lf-accent)_40%,transparent)] text-[9px] font-mono text-[var(--lf-accent)] font-bold uppercase tracking-widest flex items-center gap-1 backdrop-blur-sm">
                            <Star className="w-3 h-3 fill-[var(--lf-accent)]" /> FEATURED
                          </span>
                        ) : <span />}

                        {project.language && (
                          <span className="min-w-0 max-w-[55%] truncate px-2 py-0.5 rounded-none bg-slate-950 border border-slate-800 text-[9px] font-mono text-slate-400 uppercase tracking-widest">
                            {project.language}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Project Body */}
                    <div className={cn(PROJECT_CARD_BODY, "space-y-4")}>
                      <div className={PROJECT_CARD_HEADER}>
                        <div className={PROJECT_CARD_META}>
                          <h3 className={cn(PROJECT_CARD_TITLE, "text-lg font-mono font-bold text-white uppercase group-hover:text-[var(--lf-accent)] transition-colors")}>
                            {project.title}
                          </h3>
                        </div>
                      </div>

                      {project.description && (
                        <DescriptionBlock
                          text={project.description}
                          paragraphClassName="text-sm text-slate-400 leading-relaxed"
                          listClassName="space-y-2 pl-5 text-sm text-slate-400 leading-relaxed marker:text-[var(--lf-accent)]"
                        />
                      )}

                      {/* Tech Stack list */}
                      {project.techStack.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {project.techStack.map(tag => (
                            <button
                              key={tag}
                              onClick={() => setSelectedTech(tag === selectedTech ? null : tag)}
                              className={`px-2 py-0.5 rounded-none text-[9px] font-mono uppercase tracking-wider transition-colors ${
                                selectedTech === tag
                                  ? 'bg-[var(--lf-accent)] text-white'
                                  : 'bg-slate-950 border border-slate-800 text-slate-500 hover:text-white hover:border-slate-600'
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Project Footer containing Actions and Stats */}
                  <div className="px-4 @sm:px-6 py-4 border-t border-slate-800/80 bg-slate-950/65 flex flex-col @sm:flex-row @sm:flex-wrap items-stretch @sm:items-center justify-between gap-3">
                    {/* GitHub Stats — only when values exist (GitHub projects) */}
                    {(project.githubStars !== null || project.githubForks !== null) && (
                      <div className="flex items-center gap-4 font-mono text-[10px] text-slate-500 uppercase tracking-widest">
                        {project.githubStars !== null && (
                          <div className="flex items-center gap-1 hover:text-amber-400 transition-colors" title="GitHub Stars">
                            <Star className="w-3.5 h-3.5 text-[var(--lf-accent)]" />
                            <span>{project.githubStars}</span>
                          </div>
                        )}
                        {project.githubForks !== null && (
                          <div className="flex items-center gap-1 hover:text-[var(--lf-accent)] transition-colors" title="GitHub Forks">
                            <GitFork className="w-3.5 h-3.5 text-[var(--lf-accent)]" />
                            <span>{project.githubForks}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Links */}
                    <ProjectActions
                      liveUrl={project.liveUrl}
                      sourceUrl={project.sourceUrl}
                      liveClassName="px-3 py-1.5 bg-[var(--lf-accent)] border border-[var(--lf-accent)] hover:bg-transparent text-white hover:text-[var(--lf-accent)] font-semibold text-[10px] font-mono uppercase tracking-widest rounded-none transition-all text-center"
                      sourceClassName="px-3 py-1.5 text-slate-500 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-none transition-colors text-[10px] font-mono uppercase tracking-widest text-center"
                    />
                  </div>
                </div>
              ))}
          </CollapsibleList>

            {filteredProjects.length === 0 && (
              <div className="col-span-full py-12 text-center bg-[#111418] border border-slate-800 rounded-none">
                <p className="text-slate-500 font-mono text-sm uppercase tracking-wide">No projects found matching the selection criteria.</p>
                <button
                  onClick={() => { setProjectSearch(''); setSelectedTech(null); }}
                  className="mt-4 px-4 py-2 bg-[color-mix(in_srgb,var(--lf-accent)_8%,transparent)] text-[var(--lf-accent)] text-xs font-mono uppercase tracking-widest rounded-none hover:bg-[color-mix(in_srgb,var(--lf-accent)_10%,transparent)] border border-[color-mix(in_srgb,var(--lf-accent)_20%,transparent)]"
                >
                  RESET ALL FILTERS
                </button>
              </div>
            )}
        </section>
      )
      : null,
    skills: skills.length > 0
      ? (
        <section key="skills" id="skills" className="space-y-8 scroll-mt-20">
            <div className="border-l-2 border-[var(--lf-accent)] pl-4">
              <SectionHeading>{labels.skills}</SectionHeading>
            </div>

            <div id="skills-container" className="space-y-8">
              {Object.entries(groupedSkills).map(([category, names]) => (
                <div key={category} className="space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 @sm:grid-cols-2 @md:grid-cols-3 @lg:grid-cols-4 gap-4">
                    {names.map((name) => {
                      const skill = skills.find((s) => s.name === name && s.category === category);
                      const levelDisplay = getSkillLevelDisplay(skill?.level ?? null);
                      return (
                        <div
                          key={`${category}-${name}`}
                          className="min-w-0 bg-[#111418] border border-slate-800 p-4 rounded-none flex flex-wrap items-center justify-between gap-3 hover:border-slate-700 transition-colors group"
                        >
                          <div className="space-y-1.5">
                            <p className="font-mono font-bold text-xs uppercase text-white group-hover:text-[var(--lf-accent)] transition-colors">{name}</p>
                          </div>
                          {levelDisplay && (
                            <span className={`px-2 py-0.5 rounded-none text-[9px] font-mono uppercase tracking-widest font-bold ${levelDisplay.classes}`}>
                              {levelDisplay.label}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
      )
      : null,
    achievements: achievements.length > 0
      ? (
        <section key="achievements" id="achievements" className="space-y-6 scroll-mt-20">
                <div className="border-l-2 border-[var(--lf-accent)] pl-4">
                  <SectionHeading as="h3">{labels.achievements}</SectionHeading>
                </div>

                <CollapsibleList
                  initial={4}
                  wrapperClassName="space-y-4"
                  buttonClassName="mt-2 w-full rounded-none border border-slate-800 bg-[#111418] px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-slate-400 hover:border-[var(--lf-accent)] hover:text-[var(--lf-accent)] transition-colors"
                >
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="bg-[#111418] border border-slate-800 p-5 rounded-none hover:border-slate-700 transition-colors flex items-start gap-4"
                      id={`achievement-card-${achievement.id}`}
                    >
                      <div className="p-2.5 rounded-none bg-[color-mix(in_srgb,var(--lf-accent)_8%,transparent)] border border-[color-mix(in_srgb,var(--lf-accent)_20%,transparent)] text-[var(--lf-accent)] shrink-0">
                        <Trophy className="w-5 h-5" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <h4 className="font-mono font-bold text-white text-sm @sm:text-base uppercase tracking-wide">
                            {achievement.title}
                          </h4>
                          {achievement.date && (
                            <span className="text-[10px] font-mono text-slate-500 uppercase">
                              {achievement.date}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CollapsibleList>
              </section>
      )
      : null,
    certifications: certifications.length > 0
      ? (
        <section key="certifications" id="certifications" className="space-y-6 scroll-mt-20">
                <div className="border-l-2 border-[var(--lf-accent)] pl-4">
                  <SectionHeading as="h3">{labels.certifications}</SectionHeading>
                </div>

                <CollapsibleList
                  initial={4}
                  wrapperClassName="space-y-4"
                  buttonClassName="mt-2 w-full rounded-none border border-slate-800 bg-[#111418] px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-slate-400 hover:border-[var(--lf-accent)] hover:text-[var(--lf-accent)] transition-colors"
                >
                  {certifications.map((cert) => (
                    <div
                      key={cert.id}
                      className="bg-[#111418] border border-slate-800 p-4 @sm:p-5 rounded-none hover:border-slate-700 transition-colors flex flex-col @sm:flex-row @sm:items-center @sm:justify-between gap-4"
                      id={`cert-card-${cert.id}`}
                    >
                      <div className="flex min-w-0 items-start @sm:items-center gap-3 @sm:gap-4">
                        <div className="p-2.5 rounded-none bg-[color-mix(in_srgb,var(--lf-accent)_8%,transparent)] border border-[color-mix(in_srgb,var(--lf-accent)_20%,transparent)] text-[var(--lf-accent)] shrink-0">
                          <FileCheck className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="break-words font-mono font-bold text-white text-sm @sm:text-base uppercase tracking-wide">
                            {cert.url ? (
                              <a href={cert.url} target="_blank" rel="noreferrer" className="hover:text-[var(--lf-accent)]">
                                {cert.name}
                              </a>
                            ) : (
                              cert.name
                            )}
                          </h4>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 mt-0.5 font-mono uppercase">
                            <span>{cert.issuer}</span>
                            {cert.issueDate && (
                              <>
                                <span className="text-slate-700">•</span>
                                <span>Issued {cert.issueDate}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {cert.url && (
                        <a
                          href={cert.url}
                          target="_blank"
                          rel="noreferrer"
                          className="self-end @sm:self-auto p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-none transition-colors shrink-0"
                          title="Verify Certificate"
                          id={`cert-verify-${cert.id}`}
                        >
                          <ExternalLink className="w-4 h-4 text-[var(--lf-accent)]" />
                        </a>
                      )}
                    </div>
                  ))}
                </CollapsibleList>
              </section>
      )
      : null,
    articles: articles.length > 0
      ? (
        <section key="articles" id="publications" className="space-y-6 scroll-mt-20">
                <div className="border-l-2 border-[var(--lf-accent)] pl-4">
                  <SectionHeading as="h3">{labels.articles}</SectionHeading>
                </div>

                <CollapsibleList
                  initial={4}
                  wrapperClassName="space-y-4"
                  buttonClassName="mt-2 w-full rounded-none border border-slate-800 bg-[#111418] px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-slate-400 hover:border-[var(--lf-accent)] hover:text-[var(--lf-accent)] transition-colors"
                >
                  {articles.map((article) => (
                    <a
                      key={article.id}
                      href={article.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block bg-[#111418] border border-slate-800 p-5 rounded-none hover:border-slate-700 transition-all group"
                      id={`article-card-${article.id}`}
                    >
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1 uppercase">
                          <BookOpen className="w-3.5 h-3.5 text-[var(--lf-accent)]" />
                          {article.publishedAt ? `Published ${new Date(article.publishedAt).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })}` : 'Unpublished'}
                          {article.readTime ? ` · ${article.readTime} min read` : ''}
                        </span>
                        <h4 className="font-mono font-bold text-white text-sm @sm:text-base group-hover:text-[var(--lf-accent)] transition-colors leading-snug uppercase tracking-wide">
                          {article.title}
                        </h4>
                        {article.description && (
                          <DescriptionBlock
                            text={article.description}
                            paragraphClassName="text-xs text-slate-400 leading-relaxed line-clamp-2"
                            listClassName="space-y-1 pl-4 text-xs text-slate-400 leading-relaxed marker:text-[var(--lf-accent)]"
                          />
                        )}
                        {article.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {article.tags.map(tag => (
                              <span key={tag} className="px-1.5 py-0.5 rounded-none bg-slate-950 border border-slate-800 text-[9px] font-mono text-slate-500 uppercase">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-[var(--lf-accent)] font-mono pt-1 group-hover:translate-x-1 transition-transform uppercase tracking-wider">
                          <span>Read Article</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </a>
                  ))}
                </CollapsibleList>
              </section>
      )
      : null,
    education: educations.length > 0
      ? (
        <section key="education" id="education" className="space-y-6 scroll-mt-20">
                <div className="border-l-2 border-[var(--lf-accent)] pl-4">
                  <SectionHeading as="h3">{labels.education}</SectionHeading>
                </div>

                <CollapsibleList
                  initial={4}
                  wrapperClassName="space-y-4"
                  buttonClassName="mt-2 w-full rounded-none border border-slate-800 bg-[#111418] px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-slate-400 hover:border-[var(--lf-accent)] hover:text-[var(--lf-accent)] transition-colors"
                >
                  {educations.map((edu) => (
                    <div
                      key={edu.id}
                      className="bg-[#111418] border border-slate-800 p-5 rounded-none space-y-3"
                      id={`edu-card-${edu.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-none bg-[color-mix(in_srgb,var(--lf-accent)_8%,transparent)] border border-[color-mix(in_srgb,var(--lf-accent)_20%,transparent)] text-[var(--lf-accent)] shrink-0">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-mono font-bold text-white text-sm @sm:text-base leading-snug uppercase tracking-wide">
                            {edu.institution}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-wider">
                            {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-800/60 text-xs font-mono text-slate-500 uppercase">
                        <span>
                          {displayYear(edu.endDate)}
                        </span>
                        {edu.gpa && (
                          <span className="px-2 py-0.5 rounded-none bg-slate-900 border border-slate-800 text-[var(--lf-accent)] font-bold">
                            GPA {edu.gpa}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </CollapsibleList>
              </section>
      )
      : null,
    github: contributionCalendar
      ? (
        <section key="github" className="space-y-6 scroll-mt-20">
            <div className="border-l-2 border-[var(--lf-accent)] pl-4">
              <SectionHeading>{labels.github}</SectionHeading>
            </div>
            <div className="bg-[#111418] border border-slate-800 p-5 rounded-none overflow-x-auto">
              <div className="mx-auto w-max max-w-full">
                <GitHubContributionHeatmap
                  calendar={contributionCalendar}
                  profileUrl={githubProfile?.url}
                  username={githubProfile?.username}
                />
              </div>
            </div>
          </section>
      )
      : null,
    profiles: hasProfiles
      ? (
        <section key="profiles" id="profiles" className="space-y-6 scroll-mt-20">
            <div className="border-l-2 border-[var(--lf-accent)] pl-4">
              <SectionHeading>{labels.profiles}</SectionHeading>
            </div>
            <div className="bg-[#111418] border border-slate-800 p-5 rounded-none">
              <ProfileLinksSection
                portfolio={portfolio}
                profiles={socialProfiles}
                chipClassName="rounded-none border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-mono text-slate-400"
                pillClassName="rounded-none border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-mono text-slate-300 hover:border-[var(--lf-accent)] hover:text-[var(--lf-accent)] transition-colors"
                titleClassName="font-mono text-xs uppercase tracking-wider text-[var(--lf-accent)]"
                textClassName="text-xs text-slate-500"
              />
            </div>
          </section>
      )
      : null,
  };

  return (
    <div
      className={cn(
        TEMPLATE_CONTAINER,
        styles.root,
        inter.variable,
        spaceGrotesk.variable,
        jetBrainsMono.variable,
        "min-w-0 overflow-x-hidden font-sans selection:bg-[color-mix(in_srgb,var(--lf-accent)_30%,transparent)] selection:text-white"
      )}
    style={accentRootStyle(primaryColor)}
    >

      {/* Header / Navbar */}
      <header id="header" className="sticky top-0 z-50 bg-[#0A0C10]/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 @sm:px-6 @lg:px-8 h-16 flex items-center justify-between">
          <a href="#about" id="logo" className="flex min-w-0 items-center gap-2 group">
            <span className="w-9 h-9 rounded-none border border-[var(--lf-accent)] bg-slate-900 flex items-center justify-center font-display font-bold text-white group-hover:bg-[var(--lf-accent)] group-hover:text-white transition-all duration-200">
              {getInitials(portfolio.title)}
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="max-w-[9rem] truncate font-display font-semibold text-white leading-none text-sm tracking-wide group-hover:text-[var(--lf-accent)] transition-colors @sm:max-w-64">
                {portfolio.title}
              </span>
            </div>
          </a>

          {/* Desktop Nav */}
          {navItems.length > 0 && (
            <nav id="desktop-nav" className="hidden @lg:flex items-center gap-6 @xl:gap-8">
              {navItems.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
                >
                  {section.label}
                </a>
              ))}
              {(portfolio.contactEmail || portfolio.phone) && (
                <a href="#contact" className="px-4 py-2 rounded-none border border-[var(--lf-accent)] text-[var(--lf-accent)] hover:bg-[var(--lf-accent)] hover:text-white font-mono uppercase text-xs tracking-wider font-semibold transition-all">
                  {labels.contact}
                </a>
              )}
            </nav>
          )}

          {/* Mobile Menu Button */}
          {navItems.length > 0 && (
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="@lg:hidden p-2 text-slate-400 hover:text-white focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}
        </div>

        {/* Mobile Nav Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && navItems.length > 0 && (
            <motion.div
              id="mobile-nav"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="@lg:hidden border-t border-slate-800 bg-[#0A0C10]"
            >
              <div className="px-4 py-6 space-y-4 flex flex-col">
                {navItems.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-mono uppercase tracking-wider text-slate-300 hover:text-white py-2 border-b border-slate-800/60"
                  >
                    {section.label}
                  </a>
                ))}
                {(portfolio.contactEmail || portfolio.phone) && (
                  <a
                    href="#contact"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-3 rounded-none border border-[var(--lf-accent)] text-[var(--lf-accent)] hover:bg-[var(--lf-accent)] hover:text-white font-mono uppercase text-xs tracking-wider font-semibold transition-colors"
                  >
                    {labels.contact}
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>


      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 @sm:px-6 @lg:px-8 py-6 @sm:py-8 @md:py-16 space-y-16 @sm:space-y-24 @md:space-y-32">

        {/* HERO SECTION */}
        <section id="about" className="relative pt-4 @md:pt-12 scroll-mt-20">
          <div className="grid grid-cols-1 @md:grid-cols-12 gap-8 @md:gap-12 items-center">
            {/* Left info column */}
            <div className={cn(HERO_HEADER_COLUMN, "@md:col-span-7 space-y-6 order-2 @md:order-1 text-center @md:text-left")}>

              <h1
                id="hero-title"
                className={cn(
                  HERO_TITLE_BASE,
                  HERO_TITLE_SCALE_7XL,
                  "font-display font-extrabold text-white tracking-tighter uppercase leading-none"
                )}
              >
                {portfolio.title}
              </h1>

              {portfolio.headline && (
                <p
                  id="hero-headline"
                  className={cn(
                    HERO_HEADLINE_SCALE,
                    "font-mono font-bold text-[var(--lf-accent)] tracking-widest uppercase mt-2"
                  )}
                >
                  {portfolio.headline}
                </p>
              )}

              {portfolio.customization?.heroTagline && (
                <p id="hero-tagline" className="text-lg @sm:text-xl text-white font-semibold">
                  {portfolio.customization.heroTagline}
                </p>
              )}

              {!resolved.isHidden("about") && portfolio.summary && (
                <DescriptionBlock
                  text={portfolio.summary}
                  paragraphClassName="text-base @sm:text-lg text-slate-400 leading-relaxed max-w-xl mx-auto @md:mx-0"
                  listClassName="space-y-2 pl-5 text-base @sm:text-lg text-slate-400 leading-relaxed max-w-xl mx-auto @md:mx-0 marker:text-[var(--lf-accent)]"
                />
              )}

              <ContactChips
                portfolio={portfolio}
                chipClassName="w-full @sm:w-auto justify-center @md:justify-start rounded-none border border-slate-800 bg-[#111418] px-3 py-2 text-xs font-mono text-slate-400 text-center @md:text-left"
              />

              {/* Social profiles stats & links */}
              {socialProfiles.length > 0 && (
                <div id="hero-socials" className="flex flex-wrap items-center justify-center @md:justify-start gap-3 @sm:gap-4 pt-4">
                  {socialProfiles.map((profile) => {
                    const statLabel = getSocialStatLabel(profile.cachedStats);
                    return (
                      <a
                        key={profile.platform}
                        href={profile.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-none bg-slate-900 border border-slate-800 hover:border-[var(--lf-accent)] text-slate-400 hover:text-white transition-all flex items-center gap-2 font-mono text-xs group"
                        id={`social-${profile.platform}`}
                      >
                        {getSocialIcon(profile.platform, 'w-4 h-4 text-[var(--lf-accent)]')}
                        {profile.username && <span className="hidden @sm:inline">@{profile.username}</span>}
                        {statLabel && (
                          <span className="px-1.5 py-0.5 rounded-none bg-slate-950 text-[9px] text-slate-500 border border-slate-800/80 group-hover:text-[var(--lf-accent)] transition-colors">
                            {statLabel}
                          </span>
                        )}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {renderSections(resolved, "full", blocks)}

        {customSections.length > 0 && (
          <div className="space-y-12">
            {customSections.map((sect) => (
              <section key={sect.id} id={`custom-section-${sect.id}`} className="space-y-6">
                <div className="border-l-2 border-[var(--lf-accent)] pl-4">
                  <SectionHeading as="h3">{sect.label}</SectionHeading>
                </div>
                <CustomSectionItems
                  items={sect.items}
                  titleClassName="font-mono font-bold text-[var(--lf-accent)] text-sm @sm:text-base uppercase tracking-wider"
                  textClassName="text-xs @sm:text-sm text-slate-400 leading-relaxed"
                  chipClassName="rounded-none border border-slate-800 bg-slate-950 px-2 py-0.5 text-[10px] font-mono text-slate-500 uppercase"
                  buttonClassName="mt-2 text-xs font-mono uppercase tracking-wider text-[var(--lf-accent)] hover:text-[color-mix(in_srgb,var(--lf-accent)_75%,white)]"
                />
              </section>
            ))}
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer id="footer" className="border-t border-slate-800 bg-[#0A0C10] mt-12 @sm:mt-24">
        <div className="max-w-6xl mx-auto px-4 @sm:px-6 @lg:px-8 py-8 @sm:py-12 flex flex-col @lg:flex-row items-center justify-between gap-6">
          <div className="flex min-w-0 max-w-full items-center gap-2 text-center @lg:text-left">
            <span className="w-8 h-8 shrink-0 rounded-none bg-slate-900 border border-slate-800 flex items-center justify-center font-display font-bold text-white text-xs">
              {getInitials(portfolio.title)}
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="break-words text-sm font-semibold text-white uppercase tracking-wider">{portfolio.title}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 @sm:gap-4 text-xs font-mono text-slate-500 uppercase">
            {isSectionEnabled('experience') && experiences.length > 0 && (
              <a href="#experience" className="hover:text-[var(--lf-accent)] transition-colors">{labels.experience}</a>
            )}
            {isSectionEnabled('work') && projects.length > 0 && (
              <a href="#work" className="hover:text-[var(--lf-accent)] transition-colors">{labels.projects}</a>
            )}
            {skills.length > 0 && (
              <a href="#skills" className="hover:text-[var(--lf-accent)] transition-colors">{labels.skills}</a>
            )}
            <a href="#header" className="p-2 rounded-none bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all">
              ↑ Back to top
            </a>
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
  children: ReactNode;
  as?: "h2" | "h3";
}) {
  return (
    <Tag
      className={
        Tag === "h3"
          ? "text-xl @sm:text-2xl font-display font-extrabold text-white uppercase tracking-tight flex items-center gap-2"
          : "text-2xl @sm:text-3xl font-display font-extrabold text-white uppercase tracking-tight flex items-center gap-2"
      }
    >
      <span className="w-2.5 h-2.5 bg-[var(--lf-accent)] shrink-0 inline-block" /> {children}
    </Tag>
  );
}