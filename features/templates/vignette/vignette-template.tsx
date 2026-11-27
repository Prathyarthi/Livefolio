"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { Instrument_Sans, Mr_Dafoe } from "next/font/google";
import { ArrowUp, ArrowUpRight, Trophy } from "lucide-react";
import {
  resolveAccentColor,
  accentRootStyle,
} from "@/features/templates/template-accent-palettes";
import { stripRichTextToPlain } from "@/lib/rich-text";
import type { PortfolioData } from "../types";
import { getTemplateSectionLayout } from "../section-layouts";
import {
  renderSections,
  resolveSectionLayout,
  type ReorderableSectionKey,
} from "../section-order";
import { cn } from "@/lib/utils";
import { CollapsibleList } from "../collapsible-list";
import {
  ArticleSourceLabel,
  RichText,
  DescriptionBlock,
  TechChip,
  TemplateNavbar,
  buildTemplateSections,
  SocialPills,
  HeroProfileButtons,
  hasNonHeroSocialProfiles,
  CustomSectionItems,
  ProfileLinksSection,
  ProjectActions,
  PROJECT_CARD,
  PROJECT_CARD_BODY,
  PROJECT_CARD_TITLE,
  TEMPLATE_CONTAINER,
  getSectionLabels,
} from "../shared";
import { TemplateProjectPreview } from "@/components/template-project-preview";
import { formatDateRange, sortExperiencesNewestFirst } from "../utils";
import {
  GitHubContributionHeatmap,
  parseContributionCalendar,
} from "../github-contribution-heatmap";
import { LinkedInSection } from "@/features/templates/components/linkedin-section";
import { pricedown } from "../fonts/pricedown";
import styles from "./vignette-template.module.css";

/**
 * Vignette — the portfolio as open-world key art.
 * Cover: painted vignettes in black gutters; a Pricedown name lockup over the key art.
 * Body: a night skyline held behind every chapter; in-world surfaces (postcard,
 * mission log, stats menu, phone) carry the sections.
 * Type: Pricedown (display), Instrument Sans (text), Mr Dafoe (one neon line).
 */
const text = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-vg-body",
});

const script = Mr_Dafoe({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-vg-script",
});

const ART = {
  keyart: "/templates/vignette/keyart.jpg",
  beach: "/templates/vignette/beach.jpg",
  motel: "/templates/vignette/motel.jpg",
  swamp: "/templates/vignette/swamp.jpg",
  night: "/templates/vignette/night.jpg",
};

type Skill = PortfolioData["skills"][number];

const MORE_BUTTON =
  "mx-auto mt-8 block border border-[var(--vg-rule)] bg-[var(--vg-abyss)]/70 px-6 py-3 text-sm font-medium text-[var(--vg-cream-2)] transition-colors hover:border-[var(--vg-cream)] hover:text-[var(--vg-cream)]";

function initialsOf(title: string): string {
  const words = stripRichTextToPlain(title).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return `${words[0]![0] ?? ""}${words[1]![0] ?? ""}`.toUpperCase();
}

function levelSegments(level: number | null): number | null {
  if (level == null || level <= 0) return null;
  const ratio = level > 10 ? level / 100 : level > 5 ? level / 10 : level / 5;
  return Math.max(1, Math.min(10, Math.round(ratio * 10)));
}

function groupSkills(skills: Skill[]): Array<[string, Skill[]]> {
  const groups = new Map<string, Skill[]>();
  for (const skill of skills) {
    const category = skill.category?.trim() || "General";
    groups.set(category, [...(groups.get(category) ?? []), skill]);
  }
  return [...groups.entries()];
}

function monthYear(date: string | null): string {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function getScrollParent(el: HTMLElement): Element | Window {
  let parent = el.parentElement;
  while (parent) {
    const { overflowY } = getComputedStyle(parent);
    if (
      overflowY === "auto" ||
      overflowY === "scroll" ||
      overflowY === "overlay"
    ) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return window;
}

/** GTA wanted level is always five stars; section progress maps into that range. */
const WANTED_MAX = 5;

/** Five-point star — GTA wanted HUD silhouette. */
function WantedStarIcon({ lit }: { lit: boolean }) {
  return (
    <svg
      className={styles.wantedStar}
      data-on={lit || undefined}
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path d="M12 2.2 14.85 9.1l7.35.7-5.55 4.85 1.65 7.15L12 17.9l-6.3 3.9 1.65-7.15L1.8 9.8l7.35-.7L12 2.2z" />
    </svg>
  );
}

/** Map how many body sections you've cleared onto the classic 0–5 wanted scale. */
function toWantedLevel(cleared: number, total: number): number {
  if (cleared <= 0 || total <= 0) return 0;
  if (cleared >= total) return WANTED_MAX;
  return Math.max(1, Math.ceil((cleared / total) * WANTED_MAX));
}

/**
 * Wanted HUD: empty on the cover, then fills toward 5★ as you move through
 * chapters — same ceiling as GTA, even when the portfolio has more sections.
 */
function WantedStars({
  mainRef,
}: {
  mainRef: RefObject<HTMLElement | null>;
}) {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;

    const readSections = () =>
      Array.from(main.querySelectorAll<HTMLElement>(":scope > section"));

    const update = () => {
      const sections = readSections();
      // Band near the top of the viewport — crossing it "clears" a chapter.
      const marker = window.innerHeight * 0.28;
      let cleared = 0;
      for (let i = 0; i < sections.length; i++) {
        if (sections[i]!.getBoundingClientRect().top <= marker) cleared = i + 1;
      }
      setLevel(toWantedLevel(cleared, sections.length));
    };

    const scrollRoot = getScrollParent(main);
    update();
    scrollRoot.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const mo = new MutationObserver(update);
    mo.observe(main, { childList: true });

    return () => {
      scrollRoot.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      mo.disconnect();
    };
  }, [mainRef]);

  return (
    <div
      className={styles.wanted}
      role="status"
      aria-live="polite"
      aria-label={`Wanted level ${level} of ${WANTED_MAX}`}
    >
      {Array.from({ length: WANTED_MAX }, (_, i) => (
        <WantedStarIcon key={i} lit={i < level} />
      ))}
    </div>
  );
}

export function VignetteTemplate({ data }: { data: PortfolioData }) {
  const {
    portfolio,
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

  const primaryColor = resolveAccentColor("vignette", portfolio.customization);
  const labels = getSectionLabels(portfolio.customization);
  const { hasProfiles, navbarEnabled, sections } = buildTemplateSections(data);
  const experiences = sortExperiencesNewestFirst(data.experiences);

  const githubProfile = socialProfiles.find(
    (p) => p.platform.toLowerCase() === "github",
  );
  const githubStats = githubProfile?.cachedStats as Record<string, unknown> | null;
  const contributionCalendar = parseContributionCalendar(
    githubStats?.contributionCalendar,
  );

  const featuredProjects = projects.filter((project) => project.featured);
  const visibleProjects =
    featuredProjects.length > 0
      ? [...featuredProjects, ...projects.filter((p) => !p.featured)]
      : projects;

  const resolved = resolveSectionLayout(
    getTemplateSectionLayout("vignette"),
    portfolio.customization,
  );

  const plainTitle = stripRichTextToPlain(portfolio.title);
  const initials = initialsOf(portfolio.title);
  const firstName = plainTitle.split(/\s+/)[0] ?? "";
  const titleLines = plainTitle.split(/\s+/).filter(Boolean);
  const mainRef = useRef<HTMLElement>(null);

  const linkedinSection = data.linkedin ? (
    <LinkedInSection
      data={data.linkedin}
      heading={<SectionHeading>{labels.linkedin}</SectionHeading>}
      classes={{
        aboutList:
          "list-disc space-y-2 pl-5 text-base leading-relaxed text-[var(--vg-cream-2)] marker:text-[var(--lf-accent)]",
        aboutParagraph: "text-base leading-relaxed text-[var(--vg-cream-2)]",
        postList:
          "list-disc space-y-2 pl-5 text-lg font-semibold leading-snug text-[var(--vg-cream)]",
        postParagraph:
          "text-lg font-semibold leading-snug text-[var(--vg-cream)]",
        descriptionParagraph: "text-[15px] leading-relaxed text-[var(--vg-cream-2)]",
        descriptionList:
          "list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-[var(--vg-cream-2)] marker:text-[var(--lf-accent)]",
        card: cn(styles.menu, "p-6"),
        title:
          "text-xl font-semibold leading-tight text-[var(--vg-cream)]",
        text: "text-[15px] leading-relaxed text-[var(--vg-cream-2)]",
        muted: "text-sm text-[var(--vg-cream-3)]",
        chip: "border border-[var(--vg-rule)] px-3 py-1 text-sm text-[var(--vg-cream-2)]",
        link: "text-sm font-medium text-[var(--lf-accent)] underline-offset-4 hover:underline",
        section: "scroll-mt-24",
      }}
    />
  ) : null;

  const blocks: Partial<Record<ReorderableSectionKey, ReactNode>> = {
    about: portfolio.summary ? (
      <section key="about" id="about" className="scroll-mt-24">
        <SectionHeading>{labels.about}</SectionHeading>
        <div className={cn(styles.postcard, "p-6 @md:p-10")}>
          <div className="grid gap-8 @3xl:grid-cols-[minmax(0,1fr)_1px_200px] @3xl:gap-10">
            <div className="min-w-0">
              <p className={cn(styles.postScript, "text-4xl @md:text-5xl")}>
                Greetings from
              </p>
              <p className="mt-1 text-5xl font-black uppercase leading-[0.85] @md:text-6xl [overflow-wrap:anywhere]">
                {portfolio.location ? (
                  <RichText text={portfolio.location} />
                ) : (
                  firstName
                )}
              </p>
              <DescriptionBlock
                text={portfolio.summary}
                paragraphClassName="mt-6 text-[17px] leading-[1.75] text-[var(--vg-paper-ink)]/85"
                listClassName="mt-6 list-disc space-y-2 pl-5 text-[17px] leading-[1.75] text-[var(--vg-paper-ink)]/85 marker:text-[#cc46a0]"
              />
            </div>
            <span
              aria-hidden
              className="hidden bg-[var(--vg-paper-ink)]/20 @3xl:block"
            />
            <div className="hidden flex-col gap-8 @3xl:flex" aria-hidden>
              <div className="self-end">
                <div className={styles.stamp}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- static template art */}
                  <img src={portfolio.profileImageUrl || ART.beach} alt="" />
                </div>
              </div>
              <div className="mt-auto space-y-7 pb-2">
                <div className={styles.addressLine} />
                <div className={cn(styles.addressLine, "w-4/5")} />
                <div className={cn(styles.addressLine, "w-3/5")} />
              </div>
            </div>
          </div>
        </div>
      </section>
    ) : null,

    projects: visibleProjects.length > 0 ? (
      <section key="projects" id="work" className="scroll-mt-24">
        <SectionHeading meta={String(visibleProjects.length)}>
          {labels.projects}
        </SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName={cn(
            styles.vignettes,
            visibleProjects.length > 1 && styles.pair,
          )}
          buttonClassName={cn(MORE_BUTTON, "col-span-full")}
        >
          {visibleProjects.map((project) => (
            <article
              key={project.id}
              className={cn(PROJECT_CARD, styles.vignette, "group")}
            >
              <div className={styles.vignetteMedia}>
                <TemplateProjectPreview
                  templateId="vignette"
                  liveUrl={project.liveUrl ?? null}
                  imageUrl={project.imageUrl ?? null}
                  projectId={project.id}
                  livePreviewProjectIds={livePreviewProjectIds}
                  alt={stripRichTextToPlain(project.title)}
                  loading="lazy"
                  containerClassName="aspect-[16/10] bg-[var(--vg-ink)]"
                  className="h-full w-full object-cover object-top"
                  accentColor={primaryColor}
                />
                {project.featured && (
                  <span className="absolute left-3 top-3 bg-[var(--vg-cream)] px-2.5 py-1 text-xs font-semibold text-[var(--vg-abyss)]">
                    Featured
                  </span>
                )}
                <div className={styles.vignetteCaption}>
                  <h3
                    className={cn(
                      PROJECT_CARD_TITLE,
                      styles.vignetteTitle,
                      "text-3xl @md:text-4xl",
                    )}
                  >
                    <RichText text={project.title} />
                  </h3>
                </div>
              </div>

              <div className={cn(PROJECT_CARD_BODY, "flex flex-1 flex-col gap-5")}>
                {project.description && (
                  <DescriptionBlock
                    text={project.description}
                    paragraphClassName="text-[15px] leading-relaxed text-[var(--vg-cream-2)]"
                    listClassName="list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-[var(--vg-cream-2)] marker:text-[var(--lf-accent)]"
                  />
                )}
                {project.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {project.techStack.map((tech) => (
                      <TechChip
                        key={tech}
                        name={tech}
                        className="text-[13px] text-[var(--vg-cream-3)]"
                        iconClassName="h-3.5 w-3.5"
                      />
                    ))}
                  </div>
                )}
                <div className="mt-auto pt-1">
                  <ProjectActions
                    liveUrl={project.liveUrl}
                    sourceUrl={project.sourceUrl}
                    label={stripRichTextToPlain(project.title)}
                    projectId={project.id}
                    liveClassName="rounded-none bg-[var(--vg-cream)] px-4 py-2.5 text-sm font-semibold text-[var(--vg-abyss)] hover:bg-white hover:text-[var(--vg-abyss)]"
                    sourceClassName="rounded-none border border-[var(--vg-rule)] px-4 py-2.5 text-sm font-medium text-[var(--vg-cream)] hover:border-[var(--vg-cream)] hover:bg-transparent hover:text-[var(--vg-cream)]"
                  />
                </div>
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    experience: experiences.length > 0 ? (
      <section key="experience" id="experience" className="scroll-mt-24">
        <SectionHeading>{labels.experience}</SectionHeading>
        <div className={cn(styles.menu, "px-5 @md:px-8")}>
          <CollapsibleList initial={5} buttonClassName={cn(MORE_BUTTON, "mb-6")}>
            {experiences.map((exp) => {
              const active = !exp.endDate;
              return (
                <article key={exp.id} className={styles.mission}>
                  <p
                    className={cn(
                      styles.status,
                      active ? "text-[var(--lf-accent)]" : "text-[var(--vg-amber)]",
                    )}
                  >
                    {active ? "Active" : "Passed"}
                  </p>
                  <div className="min-w-0">
                    <h3 className="text-3xl font-extrabold leading-[0.95] text-[var(--vg-cream)] [overflow-wrap:anywhere]">
                      <RichText text={exp.role} />
                    </h3>
                    <p className="mt-2 text-[15px] font-medium text-[var(--vg-cream)]">
                      <RichText text={exp.company} />
                      {exp.location ? (
                        <span className="font-normal text-[var(--vg-cream-3)]">
                          {", "}
                          <RichText text={exp.location} />
                        </span>
                      ) : null}
                    </p>
                    {exp.description && (
                      <DescriptionBlock
                        text={exp.description}
                        paragraphClassName="mt-3 max-w-[68ch] text-[15px] leading-relaxed text-[var(--vg-cream-2)]"
                        listClassName="mt-3 max-w-[68ch] list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-[var(--vg-cream-2)] marker:text-[var(--lf-accent)]"
                      />
                    )}
                  </div>
                  {(exp.startDate || exp.endDate) && (
                    <p className="text-sm tabular-nums text-[var(--vg-cream-3)] @2xl:pt-1 @2xl:text-right">
                      {formatDateRange(exp.startDate, exp.endDate)}
                    </p>
                  )}
                </article>
              );
            })}
          </CollapsibleList>
        </div>
      </section>
    ) : null,

    skills: skills.length > 0 ? (
      <section key="skills" id="skills" className="scroll-mt-24">
        <SectionHeading>{labels.skills}</SectionHeading>
        <StatsMenu groups={groupSkills(skills)} />
      </section>
    ) : null,

    education: educations.length > 0 ? (
      <section key="education" className="scroll-mt-24">
        <SectionHeading>{labels.education}</SectionHeading>
        <div className={cn(styles.menu, "px-5 @md:px-8")}>
          <CollapsibleList initial={3} buttonClassName={cn(MORE_BUTTON, "mb-6")}>
            {educations.map((edu) => (
              <article key={edu.id} className={styles.mission}>
                <p className={cn(styles.status, "text-[var(--vg-cream-3)]")}>
                  {edu.gpa ? edu.gpa : "Study"}
                </p>
                <div className="min-w-0">
                  <h3 className="text-3xl font-extrabold leading-[0.95] text-[var(--vg-cream)] [overflow-wrap:anywhere]">
                    <RichText text={edu.degree} />
                    {edu.field ? (
                      <>
                        {", "}
                        <RichText text={edu.field} />
                      </>
                    ) : null}
                  </h3>
                  <p className="mt-2 text-[15px] font-medium text-[var(--vg-cream-2)]">
                    <RichText text={edu.institution} />
                  </p>
                </div>
                {(edu.startDate || edu.endDate) && (
                  <p className="text-sm tabular-nums text-[var(--vg-cream-3)] @2xl:pt-1 @2xl:text-right">
                    {formatDateRange(edu.startDate, edu.endDate)}
                  </p>
                )}
              </article>
            ))}
          </CollapsibleList>
        </div>
      </section>
    ) : null,

    certifications: certifications.length > 0 ? (
      <section key="certifications" className="scroll-mt-24">
        <SectionHeading>{labels.certifications}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName={cn(
            "grid gap-[6px] bg-[var(--vg-gutter)] p-[6px]",
            certifications.length > 1 && "@2xl:grid-cols-2",
          )}
          buttonClassName={cn(MORE_BUTTON, "col-span-full")}
        >
          {certifications.map((cert) => (
            <article
              key={cert.id}
              className="flex min-w-0 items-start justify-between gap-4 bg-[#121327] p-5"
            >
              <div className="min-w-0">
                <h3 className="text-2xl font-extrabold leading-tight text-[var(--vg-cream)] [overflow-wrap:anywhere]">
                  {cert.url ? (
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors hover:text-[var(--lf-accent)]"
                    >
                      {cert.name}
                    </a>
                  ) : (
                    cert.name
                  )}
                </h3>
                <p className="mt-1 text-sm text-[var(--vg-cream-2)]">{cert.issuer}</p>
              </div>
              {cert.issueDate && (
                <span className="shrink-0 text-sm tabular-nums text-[var(--vg-cream-3)]">
                  {new Date(cert.issueDate).getFullYear()}
                </span>
              )}
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    achievements: achievements.length > 0 ? (
      <section key="achievements" className="scroll-mt-24">
        <SectionHeading>{labels.achievements}</SectionHeading>
        <div className={cn(styles.menu, "px-5 @md:px-8")}>
          <CollapsibleList initial={5} buttonClassName={cn(MORE_BUTTON, "mb-6")}>
            {achievements.map((ach) => (
              <article
                key={ach.id}
                className="flex items-start gap-4 border-b border-[var(--vg-rule)] py-5 last:border-b-0"
              >
                <Trophy className="mt-1 h-4 w-4 shrink-0 text-[var(--vg-amber)]" aria-hidden />
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-[var(--vg-cream)]">
                    <RichText text={ach.title} />
                  </h3>
                </div>
                {ach.date && (
                  <span className="shrink-0 text-sm tabular-nums text-[var(--vg-cream-3)]">
                    {monthYear(ach.date)}
                  </span>
                )}
              </article>
            ))}
          </CollapsibleList>
        </div>
      </section>
    ) : null,

    articles: articles.length > 0 ? (
      <section key="articles" id="writing" className="scroll-mt-24">
        <SectionHeading>{labels.articles}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName={cn(
            "grid gap-[6px] bg-[var(--vg-gutter)] p-[6px]",
            articles.length > 1 && "@2xl:grid-cols-2",
          )}
          buttonClassName={cn(MORE_BUTTON, "col-span-full")}
        >
          {articles.map((article) => (
            <a
              key={article.id}
              href={article.url}
              data-lf-track="article"
              data-lf-label={stripRichTextToPlain(article.title)}
              data-lf-id={article.id}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-w-0 flex-col bg-[#121327] p-6 transition-colors hover:bg-[#191a33]"
            >
              <div className="flex items-center justify-between gap-3 text-[var(--vg-cream-3)]">
                <ArticleSourceLabel source={article.source} className="normal-case tracking-normal" />
                <ArrowUpRight
                  className="ml-auto h-4 w-4 transition-colors group-hover:text-[var(--vg-cream)]"
                  aria-hidden
                />
              </div>
              <h3 className="mt-3 text-[1.9rem] font-extrabold leading-[0.95] text-[var(--vg-cream)] [overflow-wrap:anywhere]">
                <RichText text={article.title} />
              </h3>
              {article.description && (
                <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-[var(--vg-cream-2)]">
                  <RichText text={article.description} />
                </p>
              )}
              {(article.publishedAt || article.readTime != null) && (
                <p className="mt-auto flex gap-4 pt-5 text-sm tabular-nums text-[var(--vg-cream-3)]">
                  {article.publishedAt && <span>{monthYear(article.publishedAt)}</span>}
                  {article.readTime != null && <span>{article.readTime} min read</span>}
                </p>
              )}
            </a>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    profiles: hasProfiles ? (
      <section key="profiles" id="profiles" className="scroll-mt-24">
        <div className="grid items-center gap-10 @3xl:grid-cols-[minmax(0,1fr)_300px] @3xl:gap-16">
          <div className="min-w-0">
            <SectionHeading>{labels.profiles}</SectionHeading>
            {portfolio.contactEmail ? (
              <a
                href={`mailto:${portfolio.contactEmail}`}
                className={cn(
                  styles.emailMark,
                  "block text-2xl leading-[0.95] tracking-wide text-[var(--vg-cream)] transition-colors hover:text-[var(--lf-accent)] @md:text-3xl @4xl:text-4xl [overflow-wrap:anywhere]",
                )}
              >
                {portfolio.contactEmail}
              </a>
            ) : (
              <p
                className="text-5xl font-black uppercase leading-[0.85] text-[var(--vg-cream)] @md:text-7xl"
              >
                {firstName}
              </p>
            )}
            {portfolio.websiteUrl && (
              <a
                href={portfolio.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-1.5 text-base font-medium text-[var(--vg-cream-2)] transition-colors hover:text-[var(--vg-cream)]"
              >
                {portfolio.websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </a>
            )}
          </div>

          <div className={cn(styles.phone, "mx-auto @3xl:mx-0")}>
            <div className={styles.screen}>
              {/* eslint-disable-next-line @next/next/no-img-element -- static template art */}
              <img src={ART.motel} alt="" />
              <div className="flex flex-col gap-6 px-5 pb-7 pt-12">
                <p className="text-4xl font-extrabold leading-none text-white">
                  Contacts
                </p>
                <ProfileLinksSection
                  portfolio={portfolio}
                  profiles={socialProfiles}
                  excludeHeroPlatforms={false}
                  titleClassName="text-[13px] font-semibold text-white"
                  textClassName="text-[13px] leading-snug text-white/70"
                  chipClassName="block w-full rounded-2xl bg-[rgba(12,13,27,0.62)] px-4 py-3 text-sm text-white backdrop-blur-md"
                  pillClassName="flex w-full rounded-2xl bg-[rgba(12,13,27,0.62)] px-4 py-3 text-sm text-white backdrop-blur-md transition-colors hover:bg-[rgba(12,13,27,0.85)] [&_span]:min-w-0 [&_span]:truncate"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    ) : null,

    github: contributionCalendar ? (
      <section key="github" className="scroll-mt-24">
        <SectionHeading>{labels.github}</SectionHeading>
        <div className={cn(styles.menu, "overflow-x-auto p-6 @md:p-8")}>
          <GitHubContributionHeatmap
            calendar={contributionCalendar}
            profileUrl={githubProfile?.url}
            username={githubProfile?.username}
            variant="modern"
            label={labels.github}
          />
        </div>
      </section>
    ) : null,
  };

  return (
    <div
      id="vignette-top"
      className={cn(
        TEMPLATE_CONTAINER,
        styles.root,
        pricedown.variable,
        text.variable,
        script.variable,
        "relative min-h-screen selection:bg-[var(--lf-accent)] selection:text-white",
      )}
      style={accentRootStyle(primaryColor)}
    >
      <div className="sticky top-0 z-50 h-0">
        <div
          className={cn(
            styles.navScrim,
            "flex items-center gap-3 px-4 pb-8 pt-3 @md:gap-4 @md:px-6",
          )}
        >
          {navbarEnabled && initials ? (
            <a
              href="#vignette-top"
              aria-label={plainTitle}
              className={cn(styles.miniMono, "shrink-0 text-3xl")}
            >
              {initials}
            </a>
          ) : null}
          {navbarEnabled ? (
            <TemplateNavbar
              items={sections}
              className="min-w-0 flex-1 border-0 bg-transparent backdrop-blur-none @md:flex @md:justify-end"
              linkClassName="px-2.5 py-1.5 text-sm font-medium text-white/75 transition-colors hover:text-white"
            />
          ) : (
            <div className="min-w-0 flex-1" />
          )}
          <WantedStars mainRef={mainRef} />
        </div>
      </div>

      <header className={styles.cover}>
        <div className={cn(styles.tile, styles.keyTile, "flex min-h-[620px] flex-col justify-between")}>
          {/* eslint-disable-next-line @next/next/no-img-element -- static template key art */}
          <img src={ART.keyart} alt="" className={styles.tileImg} />
          <div className={styles.keyScrim} aria-hidden />

          <div className={cn(styles.lockup, styles.titleLockup, "relative gap-4 pt-16 @md:px-10")}>
            <div className={styles.titleCluster}>
              {initials ? (
                <div className={styles.viMark} aria-hidden>
                  <span className={styles.viGlow}>{initials}</span>
                  <span className={styles.viOutline}>{initials}</span>
                  <span className={styles.viKeyline}>{initials}</span>
                  <span className={styles.viFill}>{initials}</span>
                </div>
              ) : null}
              <h1 className={cn(styles.titleStack, "mt-20")}>
                {titleLines.map((line, i) => (
                  <span key={`${line}-${i}`}>{line}</span>
                ))}
              </h1>
            </div>
            {portfolio.location && (
              <p className={cn(styles.neon, styles.titleNeon,"z-10 relative")}>
                <RichText text={portfolio.location} />
              </p>
            )}
          </div>

          <div className="relative px-5 pb-6 @md:px-10 @md:pb-9">
            {portfolio.headline && (
              <p className="max-w-[34ch] text-lg font-medium leading-snug text-[var(--vg-cream)] @md:text-xl">
                <RichText text={portfolio.headline} />
              </p>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {portfolio.contactEmail && (
                <a
                  href={`mailto:${portfolio.contactEmail}`}
                  className="bg-[var(--vg-cream)] px-4 py-2.5 text-sm font-semibold text-[var(--vg-abyss)] transition-colors hover:bg-white"
                >
                  Get in touch
                </a>
              )}
              <HeroProfileButtons
                profiles={socialProfiles}
                className="block bg-[rgba(12,13,27,0.6)] px-3.5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-[rgba(12,13,27,0.85)]"
              />
              {hasNonHeroSocialProfiles(socialProfiles) && (
                <SocialPills
                  profiles={socialProfiles}
                  excludeHeroPlatforms
                  className="block bg-[rgba(12,13,27,0.6)] px-3.5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-[rgba(12,13,27,0.85)]"
                />
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="relative">
        <div className={styles.backdrop} aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element -- static template backdrop */}
          <img src={ART.night} alt="" />
        </div>

        <main
          ref={mainRef}
          className="relative z-10 mx-auto flex max-w-6xl flex-col gap-24 px-5 py-20 @md:gap-32 @md:px-10 @md:py-28"
        >
          {renderSections(resolved, "full", { ...blocks, linkedin: linkedinSection })}

          {customSections.map((cs) => (
            <section key={cs.id} className="scroll-mt-24">
              <SectionHeading>{cs.label}</SectionHeading>
              <div className={cn(styles.menu, "p-6 @md:p-8")}>
                <CustomSectionItems
                  items={cs.items}
                  titleClassName="text-2xl font-extrabold leading-tight text-[var(--vg-cream)]"
                  textClassName="text-[15px] leading-relaxed text-[var(--vg-cream-2)]"
                  chipClassName="mr-2 mt-2 inline-block border border-[var(--vg-rule)] px-2.5 py-1 text-xs text-[var(--vg-cream-2)]"
                  buttonClassName={MORE_BUTTON}
                />
              </div>
            </section>
          ))}
        </main>
      </div>

      <footer className={cn(styles.finale, "flex min-h-[420px] flex-col items-center justify-end px-5 pb-12 text-center")}>
        {/* eslint-disable-next-line @next/next/no-img-element -- static template art */}
        <img src={ART.swamp} alt="" />
        {initials && (
          <p className={cn(styles.miniMono, "text-7xl @md:text-8xl")} aria-hidden>
            {initials}
          </p>
        )}
        <p className="mt-3 text-base font-medium text-[var(--vg-cream)]">{plainTitle}</p>
        {portfolio.contactEmail && (
          <a
            href={`mailto:${portfolio.contactEmail}`}
            className={cn(
              styles.emailMark,
              "mt-4 text-2xl tracking-wide text-[var(--vg-cream)] transition-colors hover:text-[var(--lf-accent)] @md:text-3xl [overflow-wrap:anywhere]",
            )}
          >
            {portfolio.contactEmail}
          </a>
        )}
        <a
          href="#vignette-top"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--vg-cream-2)] transition-colors hover:text-[var(--vg-cream)]"
        >
          <ArrowUp className="h-4 w-4" aria-hidden />
          Back to top
        </a>
      </footer>
    </div>
  );
}

function SectionHeading({ children, meta }: { children: ReactNode; meta?: string }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-6 @md:mb-12">
      <h2
        className={cn(
          styles.heading,
          "min-w-0 text-5xl text-[var(--vg-cream)] @md:text-7xl @4xl:text-8xl [overflow-wrap:anywhere]",
        )}
      >
        {children}
      </h2>
      {meta ? (
        <span className="pb-1 text-3xl font-bold tabular-nums text-[var(--vg-cream-3)]">
          {meta}
        </span>
      ) : null}
    </div>
  );
}

function StatsMenu({ groups }: { groups: Array<[string, Skill[]]> }) {
  const [active, setActive] = useState(0);
  const index = Math.min(active, groups.length - 1);
  const current = groups[index];
  if (!current) return null;

  return (
    <div className={styles.menu}>
      <div className={cn(styles.tabs, "px-3 pt-3 @md:px-5 @md:pt-5")} role="tablist">
        {groups.map(([category], i) => (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={i === index}
            data-on={i === index || undefined}
            onClick={() => setActive(i)}
            className={styles.tab}
          >
            {category}
          </button>
        ))}
      </div>
      <div className={cn(styles.statGrid, "px-5 pb-4 pt-2 @md:px-8 @md:pb-6")} role="tabpanel">
        {current[1].map((skill) => {
          const filled = levelSegments(skill.level);
          return (
            <div key={skill.id} className={styles.statRow}>
              <TechChip
                name={skill.name}
                className="text-[15px] font-medium text-[var(--vg-cream)]"
                iconClassName="h-4 w-4"
              />
              {filled != null && (
                <div className={styles.bar} aria-label={`${filled} of 10`}>
                  {Array.from({ length: 10 }, (_, i) => (
                    <span key={i} data-on={i < filled || undefined} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
