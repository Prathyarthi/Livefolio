"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Instrument_Serif, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { MotionConfig, motion } from "motion/react";
import {
  ArrowUpRight,
  ArrowUp,
  GitFork,
  MapPin,
  Menu,
  Star,
  Trophy,
  X,
} from "lucide-react";
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
import { DitherVeil } from "./dither-veil";
import styles from "./veil-template.module.css";

type PortfolioMeta = PortfolioData["portfolio"];
type Experience = PortfolioData["experiences"][number];
type Education = PortfolioData["educations"][number];
type Skill = PortfolioData["skills"][number];
type Project = PortfolioData["projects"][number];
type Article = PortfolioData["articles"][number];
type SocialProfile = PortfolioData["socialProfiles"][number];
type Certification = PortfolioData["certifications"][number];
type Achievement = PortfolioData["achievements"][number];
type Labels = ReturnType<typeof getSectionLabels>;

interface AppProps {
  data: PortfolioData;
}

// ==========================================
// SHARED HELPERS
// ==========================================
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-veil-serif",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-veil-sans",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-veil-mono",
});

const VEIL_INK = "#0c0b0f";
const VEIL_PAPER = "#f2eee6";
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const LINE = "border-[var(--veil-line)]";
const MUTED = "text-[var(--veil-muted)]";
const FAINT = "text-[var(--veil-faint)]";
const SHELL = "mx-auto w-full max-w-7xl px-5 @sm:px-8 @lg:px-12";
const MORE_BUTTON =
  "mt-6 rounded-full border border-[var(--veil-line-strong)] px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--veil-muted)] transition-colors hover:border-[var(--lf-accent)] hover:text-[var(--veil-paper)]";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function displayYear(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (!Number.isNaN(date.getTime())) return String(date.getFullYear());
  return dateStr.split("-")[0] || "";
}

/** Guards against a missing start date. */
function getDuration(start: string | null, end: string | null): string {
  if (!start) return "";
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  if (Number.isNaN(startDate.getTime())) return "";

  let totalMonths =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth());
  if (totalMonths <= 0) totalMonths = 1;

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  return [
    years > 0 ? `${years} yr${years > 1 ? "s" : ""}` : "",
    months > 0 ? `${months} mo${months > 1 ? "s" : ""}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function yearsActive(experiences: Experience[]): number {
  const starts = experiences
    .map((exp) => (exp.startDate ? new Date(exp.startDate).getTime() : NaN))
    .filter((time) => !Number.isNaN(time));
  if (starts.length === 0) return 0;
  const years = (Date.now() - Math.min(...starts)) / (365.25 * 24 * 3600 * 1000);
  return Math.max(1, Math.round(years));
}

function splitName(title: string): { lead: string; tail: string } {
  const words = title.trim().split(/\s+/);
  if (words.length < 2) return { lead: title, tail: "" };
  return { lead: words.slice(0, -1).join(" "), tail: words[words.length - 1] };
}

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.9, ease: EASE_OUT, delay }}
    >
      {children}
    </motion.div>
  );
}

function DitherMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("grid grid-cols-4 gap-[2px]", className)}
    >
      {Array.from({ length: 16 }, (_, i) => {
        const x = i % 4;
        const y = Math.floor(i / 4);
        const on = (x + y) % 2 === 0 || (x === 3 && y === 0);
        return (
          <span
            key={i}
            className="h-[3px] w-[3px]"
            style={{
              backgroundColor: on ? "var(--lf-accent)" : "var(--veil-paper)",
              opacity: on ? 1 : 0.22,
            }}
          />
        );
      })}
    </span>
  );
}

function SectionHeading({
  index,
  children,
  meta,
}: {
  index: number;
  children: React.ReactNode;
  meta?: string;
}) {
  return (
    <Reveal className="mb-10 @md:mb-14">
      <div className="flex items-end gap-4 @md:gap-6">
        <span className="pb-2 font-mono text-[11px] tracking-[0.2em] text-[var(--lf-accent)] @md:pb-3">
          ({pad(index)})
        </span>
        <h2 className="min-w-0 font-serif text-4xl leading-[0.95] tracking-tight text-[var(--veil-paper)] @sm:text-5xl @lg:text-6xl [overflow-wrap:anywhere]">
          {children}
        </h2>
        <span className={cn("mb-3 hidden h-px flex-1 border-t @md:block", LINE)} />
        {meta && (
          <span className={cn("hidden pb-2 font-mono text-[11px] uppercase tracking-[0.2em] @md:block @md:pb-3", FAINT)}>
            {meta}
          </span>
        )}
      </div>
    </Reveal>
  );
}

function countLabel(count: number, noun: string): string {
  return `${pad(count)} ${noun}${count === 1 ? "" : "s"}`;
}

// ==========================================
// 2. HEADER
// ==========================================
interface HeaderProps {
  portfolioTitle: string;
  navItems: Array<{ id: string; label: string }>;
  activeSection: string;
  setActiveSection: (section: string) => void;
}

function Header({
  portfolioTitle,
  navItems,
  activeSection,
  setActiveSection,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleScroll = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className={cn("sticky top-0 z-50 w-full border-b bg-[#0c0b0f]/75 backdrop-blur-xl", LINE)}>
      <div className={cn(SHELL, "flex min-h-16 items-center justify-between gap-4 py-3")}>
        <button
          type="button"
          onClick={() => handleScroll("about")}
          className="flex min-w-0 items-center gap-3 text-left"
        >
          <DitherMark className="shrink-0" />
          <span className="min-w-0 truncate font-serif text-xl leading-none tracking-tight text-[var(--veil-paper)] @sm:text-2xl">
            {portfolioTitle}
          </span>
        </button>

        {navItems.length > 0 && (
          <nav className="hidden items-center gap-1 @md:flex">
            {navItems.map((item, i) => {
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleScroll(item.id)}
                  className={cn(
                    "group relative flex items-baseline gap-1.5 rounded-full px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors",
                    active ? "text-[var(--veil-paper)]" : "text-[var(--veil-muted)] hover:text-[var(--veil-paper)]",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="veil-nav-pill"
                      className="absolute inset-0 rounded-full border border-[var(--veil-line-strong)] bg-white/[0.04]"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative text-[9px] text-[var(--lf-accent)]">{pad(i + 1)}</span>
                  <span className="relative">{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {navItems.length > 0 && (
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--veil-line-strong)] text-[var(--veil-paper)] @md:hidden"
            aria-label="Toggle navigation"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        )}
      </div>

      {mobileMenuOpen && navItems.length > 0 && (
        <nav className={cn("border-t bg-[#0c0b0f]/95 @md:hidden", LINE)}>
          <div className={cn(SHELL, "flex flex-col py-2")}>
            {navItems.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleScroll(item.id)}
                className={cn(
                  "flex items-baseline gap-3 border-b py-4 text-left last:border-b-0",
                  LINE,
                )}
              >
                <span className="font-mono text-[10px] text-[var(--lf-accent)]">{pad(i + 1)}</span>
                <span
                  className={cn(
                    "font-serif text-3xl leading-none",
                    activeSection === item.id ? "text-[var(--veil-paper)]" : "text-[var(--veil-muted)]",
                  )}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

// ==========================================
// 3. HERO + PORTRAIT
// ==========================================
function CornerMarks() {
  const mark = "absolute h-3 w-3 border-[var(--veil-paper)]/60";
  return (
    <>
      <span aria-hidden className={cn(mark, "-left-1.5 -top-1.5 border-l border-t")} />
      <span aria-hidden className={cn(mark, "-right-1.5 -top-1.5 border-r border-t")} />
      <span aria-hidden className={cn(mark, "-bottom-1.5 -left-1.5 border-b border-l")} />
      <span aria-hidden className={cn(mark, "-bottom-1.5 -right-1.5 border-b border-r")} />
    </>
  );
}

function Portrait({
  src,
  name,
  primaryColor,
}: {
  src: string;
  name: string;
  primaryColor: string;
}) {
  const [ditherFailed, setDitherFailed] = useState(false);

  return (
    <motion.figure
      className="relative mx-auto w-full max-w-[22rem] @md:max-w-[26rem] @lg:max-w-none"
      initial={{ opacity: 0, y: 40, rotate: 1.5 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 1.2, ease: EASE_OUT, delay: 0.25 }}
    >
      <div className="mb-3 flex items-center justify-between gap-3 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.18em]">
        <span className={MUTED}>Fig. 01</span>
        {!ditherFailed && (
          <span className="flex items-center gap-2 text-[var(--veil-paper)]">
            <span
              className={cn(styles.pulseDot, "h-1.5 w-1.5 rounded-full")}
              style={{ backgroundColor: primaryColor }}
            />
            Hover to develop
          </span>
        )}
      </div>

      <div className="relative">
        <CornerMarks />
        <div
          className={cn(
            "relative aspect-[4/5] w-full overflow-hidden rounded-[2px] border bg-[var(--veil-ink-raised)]",
            LINE,
          )}
        >
          {ditherFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={name} className="h-full w-full object-cover" />
          ) : (
            <DitherVeil
              src={src}
              fit="cover"
              pattern="floyd"
              pixelSize={2}
              levels={2}
              inkColor={VEIL_INK}
              paperColor={VEIL_PAPER}
              rimColor={primaryColor}
              rim={0}
              contrast={1.15}
              revealRadius={180}
              softness={0.6}
              linger={1}
              clickBurst
              onError={() => setDitherFailed(true)}
              className="cursor-crosshair"
            />
          )}
        </div>
      </div>

      <figcaption className="mt-3 flex items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.2em]">
        <span className="min-w-0 truncate text-[var(--veil-paper)]">{name}</span>
        {!ditherFailed && <span className={cn("shrink-0", FAINT)}>1-bit</span>}
      </figcaption>
    </motion.figure>
  );
}

interface HeroProps {
  portfolio: PortfolioMeta;
  socialProfiles: SocialProfile[];
  primaryColor: string;
  showSummary: boolean;
}

function Hero({ portfolio, socialProfiles, primaryColor, showSummary }: HeroProps) {
  const { lead, tail } = splitName(portfolio.title);
  const tagline = portfolio.customization?.heroTagline?.trim();
  const year = new Date().getFullYear();
  const portraitSrc = portfolio.profileImageUrl;

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: 32 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 1, ease: EASE_OUT, delay },
  });

  return (
    <section id="about" className="relative scroll-mt-20 overflow-hidden pb-16 pt-10 @md:pb-24 @md:pt-14">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-10 h-[28rem] w-[28rem] rounded-full opacity-[0.14] blur-[140px]"
        style={{ backgroundColor: primaryColor }}
      />

      <div className={SHELL}>
        <motion.div
          {...rise(0)}
          className={cn(
            "mb-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b pb-4 font-mono text-[10px] uppercase tracking-[0.2em] @md:mb-16",
            LINE,
            MUTED,
          )}
        >
          <span>Portfolio / {year}</span>
          {portfolio.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              {portfolio.location}
            </span>
          )}
          <span className="hidden @md:inline">Scroll ↓</span>
        </motion.div>

        <div className="grid grid-cols-1 items-center gap-12 @lg:grid-cols-12 @lg:gap-12">
          <div
            className={cn(
              HERO_HEADER_COLUMN,
              "space-y-8",
              portraitSrc ? "@lg:col-span-7" : "@lg:col-span-12",
            )}
          >
            {(tagline || portfolio.headline) && (
              <motion.div {...rise(0.05)}>
                <span className="inline-flex max-w-full items-center gap-2.5 rounded-full border border-[var(--veil-line-strong)] bg-white/[0.03] py-1.5 pl-2.5 pr-4 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--veil-paper)]">
                  <span
                    className={cn(styles.pulseDot, "h-2 w-2 shrink-0 rounded-full")}
                    style={{ backgroundColor: primaryColor }}
                  />
                  <span className="truncate">{tagline || portfolio.headline}</span>
                </span>
              </motion.div>
            )}

            <motion.h1
              {...rise(0.12)}
              className={cn(
                HERO_TITLE_BASE,
                "font-serif text-[2.9rem] leading-[0.9] tracking-[-0.02em] text-[var(--veil-paper)] @sm:text-7xl @md:text-8xl @xl:text-[8.5rem]",
              )}
            >
              {lead}
              {tail && (
                <>
                  {" "}
                  <span className="italic" style={{ color: primaryColor }}>
                    {tail}
                  </span>
                </>
              )}
            </motion.h1>

            {tagline && portfolio.headline && (
              <motion.p
                {...rise(0.2)}
                className={cn(HERO_HEADLINE_SCALE, "max-w-2xl font-medium text-[var(--veil-paper)]")}
              >
                {portfolio.headline}
              </motion.p>
            )}

            {showSummary && portfolio.summary && (
              <motion.div {...rise(0.26)} className="max-w-2xl">
                <DescriptionBlock
                  text={portfolio.summary}
                  paragraphClassName="text-base leading-relaxed text-[var(--veil-muted)] @sm:text-lg"
                  listClassName="list-disc space-y-2 pl-5 text-base leading-relaxed text-[var(--veil-muted)] marker:text-[var(--veil-faint)] @sm:text-lg"
                />
              </motion.div>
            )}

            <motion.div {...rise(0.34)} className="space-y-4">
              <ContactChips
                portfolio={portfolio}
                chipClassName="rounded-full border border-[var(--veil-line)] px-3.5 py-1.5 font-mono text-[11px] text-[var(--veil-muted)]"
              />
              <div id="hero-profiles" className="scroll-mt-24">
                <HeroProfileButtons
                  profiles={socialProfiles}
                  className="rounded-full border border-[var(--veil-line-strong)] bg-[var(--veil-paper)] px-4 py-2 text-sm font-medium text-[var(--veil-ink)] transition-all hover:-translate-y-0.5 hover:bg-[var(--lf-accent)]"
                />
              </div>
            </motion.div>
          </div>

          {portraitSrc && (
            <div className="order-first @lg:order-none @lg:col-span-5">
              <Portrait
                key={portraitSrc}
                src={portraitSrc}
                name={portfolio.title}
                primaryColor={primaryColor}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function SkillMarquee({ skills, primaryColor }: { skills: Skill[]; primaryColor: string }) {
  const names = useMemo(
    () => Array.from(new Set(skills.map((skill) => skill.name))).slice(0, 24),
    [skills],
  );
  if (names.length < 4) return null;

  const row = (hidden: boolean) => (
    <div aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {names.map((name) => (
        <span key={name} className="flex items-center">
          <span className="whitespace-nowrap px-6 font-serif text-3xl italic text-[var(--veil-paper)] @md:text-4xl">
            {name}
          </span>
          <span className="text-sm" style={{ color: primaryColor }}>✦</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className={cn(styles.marqueeTrack, "overflow-hidden border-y py-6", LINE)}>
      <div className={styles.marquee}>
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

function StatStripe({
  stats,
}: {
  stats: Array<{ label: string; value: number; suffix?: string }>;
}) {
  const visible = stats.filter((stat) => stat.value > 0);
  if (visible.length === 0) return null;

  return (
    <div className={cn(SHELL, "pb-2 pt-14 @md:pt-20")}>
      <div className="grid grid-cols-2 gap-y-10 @md:grid-cols-4">
        {visible.map((stat, i) => (
          <Reveal
            key={stat.label}
            delay={i * 0.08}
            className={cn("px-1 @md:border-l @md:px-8 first:@md:border-l-0 first:@md:pl-0", LINE)}
          >
            <div className="font-serif text-6xl leading-none tracking-tight text-[var(--veil-paper)] @lg:text-7xl">
              {stat.value}
              {stat.suffix && <span className="text-[var(--lf-accent)]">{stat.suffix}</span>}
            </div>
            <div className={cn("mt-3 font-mono text-[10px] uppercase tracking-[0.2em]", MUTED)}>
              {stat.label}
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 4. EXPERIENCE
// ==========================================
function ExperienceSection({
  experiences,
  labels,
  index,
}: {
  experiences: Experience[];
  labels: Labels;
  index: number;
}) {
  const ordered = sortExperiencesNewestFirst(experiences);

  return (
    <section id="experience" className="scroll-mt-20 py-14 @md:py-20">
      <div className={SHELL}>
        <SectionHeading index={index} meta={countLabel(ordered.length, "role")}>
          {labels.experience}
        </SectionHeading>

        <CollapsibleList
          initial={4}
          wrapperClassName={cn("border-t", LINE)}
          buttonClassName={MORE_BUTTON}
        >
          {ordered.map((exp) => {
            const range = formatDateRange(exp.startDate, exp.endDate);
            const duration = getDuration(exp.startDate, exp.endDate);
            return (
              <Reveal key={exp.id}>
                <article
                  className={cn(
                    "group relative grid grid-cols-1 gap-4 border-b py-8 transition-colors @md:grid-cols-12 @md:gap-8 @md:py-10",
                    LINE,
                  )}
                >
                  <span
                    aria-hidden
                    className="absolute left-0 top-[-1px] h-px w-0 bg-[var(--lf-accent)] transition-all duration-700 ease-out group-hover:w-full"
                  />
                  <div className="space-y-1.5 @md:col-span-3">
                    {range && (
                      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--veil-paper)]">
                        {range}
                      </p>
                    )}
                    {duration && (
                      <p className={cn("font-mono text-[11px] tracking-[0.14em]", FAINT)}>{duration}</p>
                    )}
                  </div>

                  <div className="min-w-0 space-y-4 @md:col-span-9">
                    <div className="space-y-2">
                      <h3 className="font-serif text-3xl leading-tight tracking-tight text-[var(--veil-paper)] transition-transform duration-500 group-hover:translate-x-1 @md:text-4xl [overflow-wrap:anywhere]">
                        {exp.role}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        <span className="font-medium text-[var(--lf-accent)]">{exp.company}</span>
                        {exp.location && (
                          <span className={cn("flex items-center gap-1.5 font-mono text-[11px]", FAINT)}>
                            <MapPin className="h-3 w-3" />
                            {exp.location}
                          </span>
                        )}
                      </div>
                    </div>
                    {exp.description && (
                      <div className="max-w-3xl">
                        <DescriptionBlock
                          text={exp.description}
                          paragraphClassName="text-[15px] leading-relaxed text-[var(--veil-muted)]"
                          listClassName="list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-[var(--veil-muted)] marker:text-[var(--lf-accent)]"
                          headingClassName="text-[15px] font-semibold text-[var(--veil-paper)]"
                        />
                      </div>
                    )}
                  </div>
                </article>
              </Reveal>
            );
          })}
        </CollapsibleList>
      </div>
    </section>
  );
}

// ==========================================
// 5. PROJECTS
// ==========================================
function ProjectsSection({
  projects,
  livePreviewProjectIds,
  labels,
  primaryColor,
  index,
}: {
  projects: Project[];
  livePreviewProjectIds: string[];
  labels: Labels;
  primaryColor: string;
  index: number;
}) {
  return (
    <section id="work" className="scroll-mt-20 py-14 @md:py-20">
      <div className={SHELL}>
        <SectionHeading index={index} meta={countLabel(projects.length, "project")}>
          {labels.projects}
        </SectionHeading>

        <CollapsibleList
          initial={4}
          wrapperClassName={cn(PROJECTS_GRID_2, "gap-6 @lg:gap-8")}
          buttonClassName={cn(MORE_BUTTON, "@md:col-span-2 justify-self-start")}
        >
          {projects.map((project, i) => (
            <Reveal key={project.id} delay={(i % 2) * 0.1} className="h-full">
              <article
                className={cn(
                  PROJECT_CARD,
                  "group flex h-full flex-col rounded-[4px] border bg-[var(--veil-ink-raised)] transition-all duration-500 hover:-translate-y-1 hover:border-[var(--veil-line-strong)] hover:shadow-[0_30px_80px_-40px_var(--lf-accent)]",
                  LINE,
                )}
              >
                <div className="relative overflow-hidden">
                  <TemplateProjectPreview
                    templateId="veil"
                    liveUrl={project.liveUrl}
                    imageUrl={project.imageUrl}
                    projectId={project.id}
                    livePreviewProjectIds={livePreviewProjectIds}
                    alt={project.title}
                    loading="lazy"
                    accentColor={primaryColor}
                    containerClassName={cn("border-b bg-[var(--veil-ink)]", LINE)}
                    className="opacity-80 transition-all duration-700 group-hover:scale-[1.03] group-hover:opacity-100"
                  />
                  <span className="absolute left-4 top-4 z-10 rounded-full bg-[var(--veil-ink)]/85 px-2.5 py-1 font-mono text-[10px] tracking-[0.16em] text-[var(--veil-paper)] backdrop-blur">
                    P/{pad(i + 1)}
                  </span>
                  {project.featured && (
                    <span className="absolute right-4 top-4 z-10 rounded-full bg-[var(--lf-accent)] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--veil-ink)]">
                      Featured
                    </span>
                  )}
                </div>

                <div className={cn(PROJECT_CARD_BODY, "flex flex-1 flex-col gap-5 @sm:p-7")}>
                  <div className={PROJECT_CARD_HEADER}>
                    <div className={PROJECT_CARD_META}>
                      <h3 className={cn(PROJECT_CARD_TITLE, "font-serif text-3xl leading-tight tracking-tight text-[var(--veil-paper)]")}>
                        {project.title}
                      </h3>
                    </div>
                    {project.language && (
                      <span className={cn("shrink-0 font-mono text-[10px] uppercase tracking-[0.16em]", MUTED)}>
                        {project.language}
                      </span>
                    )}
                  </div>

                  {project.description && (
                    <DescriptionBlock
                      text={project.description}
                      paragraphClassName="text-sm leading-relaxed text-[var(--veil-muted)]"
                      listClassName="list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--veil-muted)] marker:text-[var(--veil-faint)]"
                    />
                  )}

                  {project.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {project.techStack.map((tech) => (
                        <span
                          key={tech}
                          className={cn("rounded-full border px-2.5 py-1 font-mono text-[10px] text-[var(--veil-muted)]", LINE)}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className={cn("mt-auto flex flex-col gap-3 border-t pt-5 @sm:flex-row @sm:items-center @sm:justify-between", LINE)}>
                    {project.githubStars !== null || project.githubForks !== null ? (
                      <div className={cn("flex items-center gap-4 font-mono text-[11px]", FAINT)}>
                        {project.githubStars !== null && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5" />
                            {project.githubStars}
                          </span>
                        )}
                        {project.githubForks !== null && (
                          <span className="flex items-center gap-1">
                            <GitFork className="h-3.5 w-3.5" />
                            {project.githubForks}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span />
                    )}
                    <ProjectActions
                      liveUrl={project.liveUrl}
                      sourceUrl={project.sourceUrl}
                      label={project.title}
                      projectId={project.id}
                      liveClassName="inline-flex items-center justify-center rounded-full bg-[var(--veil-paper)] px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--veil-ink)] transition-colors hover:bg-[var(--lf-accent)]"
                      sourceClassName="inline-flex items-center justify-center rounded-full border border-[var(--veil-line-strong)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--veil-paper)] transition-colors hover:border-[var(--lf-accent)]"
                    />
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </CollapsibleList>
      </div>
    </section>
  );
}

// ==========================================
// 6. SKILLS
// ==========================================
function SkillsSection({
  skills,
  labels,
  index,
}: {
  skills: Skill[];
  labels: Labels;
  index: number;
}) {
  const grouped = useMemo(() => groupSkillsByCategory(skills), [skills]);

  return (
    <section id="skills" className="scroll-mt-20 py-14 @md:py-20">
      <div className={SHELL}>
        <SectionHeading index={index} meta={countLabel(skills.length, "skill")}>
          {labels.skills}
        </SectionHeading>

        <div className={cn("grid grid-cols-1 border-l border-t @md:grid-cols-2 @lg:grid-cols-3", LINE)}>
          {Object.entries(grouped).map(([category, names], i) => (
            <Reveal
              key={category}
              delay={(i % 3) * 0.08}
              className={cn("group border-b border-r p-6 transition-colors hover:bg-white/[0.02] @md:p-8", LINE)}
            >
              <div className="mb-6 flex items-baseline justify-between gap-4">
                <h3 className="font-serif text-2xl italic text-[var(--veil-paper)]">{category}</h3>
                <span className={cn("font-mono text-[10px] tracking-[0.2em]", FAINT)}>{pad(names.length)}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {names.map((name) => (
                  <span
                    key={`${category}-${name}`}
                    className="rounded-full border border-[var(--veil-line-strong)] px-3 py-1.5 text-[13px] text-[var(--veil-paper)]/85 transition-colors hover:border-[var(--lf-accent)] hover:text-[var(--veil-paper)]"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 7. EDUCATION, CERTIFICATIONS, ARTICLES, ACHIEVEMENTS
// ==========================================
function EducationSection({
  educations,
  labels,
  index,
}: {
  educations: Education[];
  labels: Labels;
  index: number;
}) {
  return (
    <section id="education" className="scroll-mt-20 py-14 @md:py-20">
      <div className={SHELL}>
        <SectionHeading index={index}>{labels.education}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName={cn("border-t", LINE)} buttonClassName={MORE_BUTTON}>
          {educations.map((edu) => {
            const year = displayYear(edu.endDate || edu.startDate);
            return (
              <Reveal key={edu.id}>
                <article className={cn("grid grid-cols-1 gap-3 border-b py-8 @md:grid-cols-12 @md:gap-8", LINE)}>
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--veil-paper)] @md:col-span-3">
                    {year}
                  </p>
                  <div className="min-w-0 space-y-2 @md:col-span-6">
                    <h3 className="font-serif text-3xl leading-tight tracking-tight text-[var(--veil-paper)] [overflow-wrap:anywhere]">
                      {edu.degree}
                    </h3>
                    {edu.field && <p className={cn("text-sm", MUTED)}>{edu.field}</p>}
                    <p className="text-sm font-medium text-[var(--lf-accent)]">{edu.institution}</p>
                  </div>
                  {edu.gpa && (
                    <div className="@md:col-span-3 @md:text-right">
                      <span className={cn("font-mono text-[10px] uppercase tracking-[0.2em]", FAINT)}>GPA</span>
                      <p className="font-serif text-4xl leading-none text-[var(--veil-paper)]">{edu.gpa}</p>
                    </div>
                  )}
                </article>
              </Reveal>
            );
          })}
        </CollapsibleList>
      </div>
    </section>
  );
}

function CertificationsSection({
  certifications,
  labels,
  index,
}: {
  certifications: Certification[];
  labels: Labels;
  index: number;
}) {
  return (
    <section id="certifications" className="scroll-mt-20 py-14 @md:py-20">
      <div className={SHELL}>
        <SectionHeading index={index} meta={countLabel(certifications.length, "credential")}>
          {labels.certifications}
        </SectionHeading>
        <CollapsibleList initial={4} wrapperClassName={cn("border-t", LINE)} buttonClassName={MORE_BUTTON}>
          {certifications.map((cert) => (
            <Reveal key={cert.id}>
              <article className={cn("group flex flex-col gap-3 border-b py-6 @md:flex-row @md:items-center @md:justify-between @md:gap-8", LINE)}>
                <div className="min-w-0 space-y-1">
                  <h3 className="font-serif text-2xl leading-tight text-[var(--veil-paper)] [overflow-wrap:anywhere]">
                    {cert.name}
                  </h3>
                  <p className={cn("text-sm", MUTED)}>
                    {cert.issuer}
                    {cert.issueDate && (
                      <span className={cn("ml-3 font-mono text-[11px]", FAINT)}>{formatDate(cert.issueDate)}</span>
                    )}
                  </p>
                </div>
                {cert.url && (
                  <a
                    href={cert.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1.5 self-start font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--veil-paper)] transition-colors hover:text-[var(--lf-accent)] @md:self-center"
                  >
                    Credential
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </a>
                )}
              </article>
            </Reveal>
          ))}
        </CollapsibleList>
      </div>
    </section>
  );
}

function ArticlesSection({
  articles,
  labels,
  index,
}: {
  articles: Article[];
  labels: Labels;
  index: number;
}) {
  return (
    <section id="articles" className="scroll-mt-20 py-14 @md:py-20">
      <div className={SHELL}>
        <SectionHeading index={index} meta={countLabel(articles.length, "piece")}>
          {labels.articles}
        </SectionHeading>
        <CollapsibleList initial={4} wrapperClassName={cn("border-t", LINE)} buttonClassName={MORE_BUTTON}>
          {articles.map((art) => (
            <Reveal key={art.id}>
              <a
                href={art.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn("group grid grid-cols-1 gap-3 border-b py-8 @md:grid-cols-12 @md:gap-8", LINE)}
              >
                <div className={cn("font-mono text-[11px] uppercase tracking-[0.14em] @md:col-span-3", MUTED)}>
                  {art.publishedAt ? formatDate(art.publishedAt) : "—"}
                  {art.readTime ? <span className={cn("block", FAINT)}>{art.readTime} min read</span> : null}
                </div>
                <div className="min-w-0 space-y-2 @md:col-span-8">
                  <h3 className="font-serif text-3xl leading-tight tracking-tight text-[var(--veil-paper)] transition-colors group-hover:text-[var(--lf-accent)] [overflow-wrap:anywhere]">
                    {art.title}
                  </h3>
                  {art.description && (
                    <p className={cn("line-clamp-2 text-sm leading-relaxed", MUTED)}>{art.description}</p>
                  )}
                </div>
                <div className="hidden items-start justify-end @md:col-span-1 @md:flex">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--veil-line-strong)] text-[var(--veil-paper)] transition-all duration-500 group-hover:rotate-45 group-hover:border-[var(--lf-accent)] group-hover:bg-[var(--lf-accent)] group-hover:text-[var(--veil-ink)]">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </a>
            </Reveal>
          ))}
        </CollapsibleList>
      </div>
    </section>
  );
}

function AchievementsSection({
  achievements,
  labels,
  index,
}: {
  achievements: Achievement[];
  labels: Labels;
  index: number;
}) {
  return (
    <section id="achievements" className="scroll-mt-20 py-14 @md:py-20">
      <div className={SHELL}>
        <SectionHeading index={index}>{labels.achievements}</SectionHeading>
        <CollapsibleList
          initial={6}
          wrapperClassName="grid grid-cols-1 gap-4 @md:grid-cols-2 @lg:grid-cols-3"
          buttonClassName={cn(MORE_BUTTON, "@md:col-span-2 @lg:col-span-3 justify-self-start")}
        >
          {achievements.map((ach, i) => (
            <Reveal key={ach.id} delay={(i % 3) * 0.06} className="h-full">
              <article className={cn("group flex h-full flex-col justify-between gap-8 rounded-[4px] border bg-[var(--veil-ink-raised)] p-6 transition-colors hover:border-[var(--veil-line-strong)]", LINE)}>
                <div className="flex items-center justify-between">
                  <Trophy className="h-4 w-4 text-[var(--lf-accent)]" />
                  {ach.date && (
                    <span className={cn("font-mono text-[10px] uppercase tracking-[0.16em]", FAINT)}>
                      {formatDate(ach.date)}
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-2xl leading-snug text-[var(--veil-paper)] [overflow-wrap:anywhere]">
                  {ach.title}
                </h3>
              </article>
            </Reveal>
          ))}
        </CollapsibleList>
      </div>
    </section>
  );
}

// ==========================================
// 8. PROFILES / CONTACT
// ==========================================
function ProfilesSection({
  portfolio,
  socialProfiles,
  labels,
  index,
}: {
  portfolio: PortfolioMeta;
  socialProfiles: SocialProfile[];
  labels: Labels;
  index: number;
}) {
  return (
    <section id="profiles" className="scroll-mt-20 py-14 @md:py-20">
      <div className={SHELL}>
        <SectionHeading index={index}>{labels.profiles}</SectionHeading>
        <Reveal>
          <div className={cn("relative overflow-hidden rounded-[4px] border bg-[var(--veil-ink-raised)] p-8 @md:p-12", LINE)}>
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full opacity-20 blur-[120px]"
              style={{ backgroundColor: "var(--lf-accent)" }}
            />
            <div className="relative grid grid-cols-1 gap-10 @lg:grid-cols-12">
              <div className="space-y-6 @lg:col-span-6">
                <p className="font-serif text-5xl leading-[0.95] tracking-tight text-[var(--veil-paper)] @md:text-6xl">
                  Let&apos;s make
                  <br />
                  <span className="italic text-[var(--lf-accent)]">something good.</span>
                </p>
                {portfolio.contactEmail && (
                  <a
                    href={`mailto:${portfolio.contactEmail}`}
                    className="group inline-flex max-w-full items-center gap-3 rounded-full bg-[var(--veil-paper)] py-2 pl-5 pr-2 text-sm font-medium text-[var(--veil-ink)] transition-colors hover:bg-[var(--lf-accent)]"
                  >
                    <span className="truncate">{portfolio.contactEmail}</span>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--veil-ink)] text-[var(--veil-paper)] transition-transform duration-500 group-hover:rotate-45">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </a>
                )}
              </div>
              <div className="@lg:col-span-6">
                <ProfileLinksSection
                  portfolio={portfolio}
                  profiles={socialProfiles}
                  chipClassName="rounded-full border border-[var(--veil-line)] px-3.5 py-1.5 font-mono text-[11px] text-[var(--veil-muted)]"
                  pillClassName="rounded-full border border-[var(--veil-line-strong)] px-3.5 py-1.5 font-mono text-[11px] text-[var(--veil-paper)] transition-colors hover:border-[var(--lf-accent)] hover:text-[var(--lf-accent)]"
                  titleClassName="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--veil-paper)]"
                  textClassName="text-sm text-[var(--veil-muted)]"
                />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ==========================================
// 9. MAIN APP COMPONENT
// ==========================================
export function VeilTemplate({ data }: AppProps) {
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
  const primaryColor = resolveAccentColor("veil", customization);
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState("about");

  const githubProfile = socialProfiles.find(
    (p) => p.platform.toLowerCase() === "github",
  );
  const githubStats = githubProfile?.cachedStats as Record<string, unknown> | null;
  const contributionCalendar = parseContributionCalendar(
    githubStats?.contributionCalendar,
  );
  const { hasProfiles, navbarEnabled, sections } = buildTemplateSections(data);
  const navItems = navbarEnabled ? sections : [];
  const navSectionIds = navItems.map((section) => section.id).join(",");
  const labels = getSectionLabels(portfolio.customization);
  const resolved = resolveSectionLayout(
    getTemplateSectionLayout("veil"),
    portfolio.customization,
  );
  const visibleProjects = [
    ...projects.filter((p) => p.featured),
    ...projects.filter((p) => !p.featured),
  ];

  const present: Record<ReorderableSectionKey, boolean> = {
    about: false,
    experience: experiences.length > 0,
    education: educations.length > 0,
    skills: skills.length > 0,
    projects: visibleProjects.length > 0,
    github: Boolean(contributionCalendar),
    certifications: certifications.length > 0,
    articles: articles.length > 0,
    achievements: achievements.length > 0,
    profiles: hasProfiles || socialProfiles.length > 0,
  };
  const numbered = resolved.order.full.filter(
    (key) => present[key] && !resolved.isHidden(key),
  );
  // Hero is (01); body sections continue from (02).
  const num = (key: ReorderableSectionKey) => numbered.indexOf(key) + 2;

  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: null,
    experience: present.experience ? (
      <ExperienceSection experiences={experiences} labels={labels} index={num("experience")} />
    ) : null,
    education: present.education ? (
      <EducationSection educations={educations} labels={labels} index={num("education")} />
    ) : null,
    skills: present.skills ? (
      <SkillsSection skills={skills} labels={labels} index={num("skills")} />
    ) : null,
    projects: present.projects ? (
      <ProjectsSection
        projects={visibleProjects}
        livePreviewProjectIds={livePreviewProjectIds}
        labels={labels}
        primaryColor={primaryColor}
        index={num("projects")}
      />
    ) : null,
    github: contributionCalendar ? (
      <section id="github-activity" className="scroll-mt-20 py-14 @md:py-20">
        <div className={SHELL}>
          <SectionHeading index={num("github")}>{labels.github}</SectionHeading>
          <Reveal>
            <div className={cn("overflow-x-auto rounded-[4px] border bg-[var(--veil-ink-raised)] p-6", LINE)}>
              <div className="mx-auto w-max max-w-full">
                <GitHubContributionHeatmap
                  calendar={contributionCalendar}
                  profileUrl={githubProfile?.url}
                  username={githubProfile?.username}
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    ) : null,
    certifications: present.certifications ? (
      <CertificationsSection certifications={certifications} labels={labels} index={num("certifications")} />
    ) : null,
    articles: present.articles ? (
      <ArticlesSection articles={articles} labels={labels} index={num("articles")} />
    ) : null,
    achievements: present.achievements ? (
      <AchievementsSection achievements={achievements} labels={labels} index={num("achievements")} />
    ) : null,
    profiles: present.profiles ? (
      <ProfilesSection
        portfolio={portfolio}
        socialProfiles={socialProfiles}
        labels={labels}
        index={num("profiles")}
      />
    ) : null,
  };

  useEffect(() => {
    const sectionIds = navSectionIds.split(",").filter(Boolean);
    if (sectionIds.length === 0) return;

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]?.target;
        if (top?.id) setActiveSection(top.id);
      },
      { root: null, rootMargin: "-20% 0px -55% 0px", threshold: [0.1, 0.25, 0.5] },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [navSectionIds]);

  const stats = [
    { label: "Years in the craft", value: yearsActive(experiences), suffix: "+" },
    { label: "Roles held", value: experiences.length },
    { label: "Projects shipped", value: projects.length },
    { label: "Tools & skills", value: skills.length },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div
        ref={rootRef}
        className={cn(
          TEMPLATE_CONTAINER,
          styles.root,
          instrumentSerif.variable,
          interTight.variable,
          jetBrainsMono.variable,
          "flex min-w-0 flex-col overflow-x-hidden font-sans",
        )}
        style={{ ["--lf-accent" as string]: primaryColor }}
      >
        <div aria-hidden className={styles.grain} />

        <Header
          portfolioTitle={portfolio.title}
          navItems={navItems}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />

        <main className="flex-1">
          <Hero
            portfolio={portfolio}
            socialProfiles={socialProfiles}
            primaryColor={primaryColor}
            showSummary={!resolved.isHidden("about")}
          />

          {present.skills && <SkillMarquee skills={skills} primaryColor={primaryColor} />}
          <StatStripe stats={stats} />

          {renderSections(resolved, "full", blocks)}

          {customSections.length > 0 && (
            <section className="py-14 @md:py-20">
              <div className={cn(SHELL, "space-y-20")}>
                {customSections.map((section, i) => (
                  <div key={section.id} id={`custom-section-${section.id}`}>
                    <SectionHeading index={numbered.length + 2 + i}>{section.label}</SectionHeading>
                    <CustomSectionItems
                      items={section.items}
                      titleClassName="font-serif text-2xl text-[var(--veil-paper)]"
                      textClassName="text-sm leading-relaxed text-[var(--veil-muted)]"
                      chipClassName="rounded-full border border-[var(--veil-line)] px-2.5 py-0.5 font-mono text-[10px] text-[var(--veil-muted)]"
                      buttonClassName={MORE_BUTTON}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        <footer className={cn("relative mt-10 overflow-hidden border-t", LINE)}>
          <div className={cn(SHELL, "pb-6 pt-16")}>
            <p
              aria-hidden
              className={cn(
                styles.outlineText,
                "select-none font-serif text-[16cqw] leading-none tracking-tight [overflow-wrap:anywhere] @lg:text-[12cqw]",
              )}
            >
              {portfolio.title}
            </p>
          </div>
          <div className={cn(SHELL, "flex flex-col gap-4 border-t py-8 font-mono text-[10px] uppercase tracking-[0.2em] @md:flex-row @md:items-center @md:justify-between", LINE, FAINT)}>
            <span className="flex items-center gap-3">
              <DitherMark />
              © {new Date().getFullYear()} {portfolio.title}
            </span>
            <button
              type="button"
              onClick={() => rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="inline-flex items-center gap-2 self-start text-[var(--veil-paper)] transition-colors hover:text-[var(--lf-accent)] @md:self-auto"
            >
              Back to top
              <ArrowUp className="h-3 w-3" />
            </button>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}