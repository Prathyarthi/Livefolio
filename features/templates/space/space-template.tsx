import { Figtree, JetBrains_Mono, Sora } from "next/font/google";
import { resolveAccentColor, accentRootStyle } from "@/features/templates/template-accent-palettes";
import { stripRichTextToPlain } from "@/lib/rich-text";
import type { PortfolioData } from "../types";
import { getTemplateSectionLayout } from "../section-layouts";
import {
  renderSections,
  resolveSectionLayout,
  type ReorderableSectionKey,
} from "../section-order";
import { cn } from "@/lib/utils";
import {
  GitHubContributionHeatmap,
  parseContributionCalendar,
} from "../github-contribution-heatmap";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArticleSourceLabel,
  RichText,
  buildTemplateSections,
  ContactChips,
  getSectionLabels,
  CustomSectionItems,
  DescriptionBlock,
  TechChip,
  HeroProfileButtons,
  ProfileLinksSection,
  ProjectActions,
  HERO_TITLE_BASE,
  SocialPills,
  hasNonHeroSocialProfiles,
  TEMPLATE_CONTAINER,
  TemplateNavbar,
} from "../shared";
import { CollapsibleList } from "../collapsible-list";
import { formatDateRange, groupSkillsByCategory } from "../utils";
import { TemplateProjectPreview } from "@/components/template-project-preview";
import { LinkedInSection } from "@/features/templates/components/linkedin-section";

/**
 * Space — deep field, a few signals
 * Subject: the dark between stars. Almost everything is quiet; the accent is a
 * single signal (current role, links, lead project marker), like one bright star.
 * Type: Sora (display) + Figtree (body); JetBrains Mono only for coordinates.
 * Layout: left-aligned hero with one thin orbit, one lead project in a viewport
 * frame, everything else an index along a timeline line.
 */
const sora = Sora({ subsets: ["latin"], variable: "--font-space-display" });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-space-sans" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-space-mono" });

const ink = "text-slate-100";
const mute = "text-slate-400";
const line = "border-white/10";
const displayFont = "font-[family-name:var(--font-space-display)]";
const moreBtn =
  "mt-6 self-start border-b border-white/20 bg-transparent px-0 py-1 text-sm text-slate-400 transition-colors hover:border-[var(--lf-accent)] hover:text-slate-100";

/** Two soft layers of fixed-size star tiles; a couple of them carry the accent or violet. */
const STARFIELD = [
  "radial-gradient(1px 1px at 40px 60px, rgba(255,255,255,0.85), transparent)",
  "radial-gradient(1px 1px at 170px 130px, rgba(255,255,255,0.6), transparent)",
  "radial-gradient(1px 1px at 110px 230px, rgba(255,255,255,0.7), transparent)",
  "radial-gradient(1.5px 1.5px at 230px 40px, color-mix(in srgb, var(--lf-accent) 85%, white), transparent)",
  "radial-gradient(1px 1px at 60px 300px, rgba(255,255,255,0.5), transparent)",
  "radial-gradient(1px 1px at 330px 210px, rgba(255,255,255,0.65), transparent)",
  "radial-gradient(1.5px 1.5px at 380px 330px, #a78bfa, transparent)",
  "radial-gradient(1px 1px at 270px 360px, rgba(255,255,255,0.55), transparent)",
].join(",");

function formatMonthYear(value: string | Date) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

/** Deterministic decorative coordinate for a section label (aria-hidden). */
function coordinateFor(label: string) {
  const seed = [...label].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const deg = (seed * 7) % 90;
  const min = (seed * 13) % 60;
  return `${String(deg).padStart(2, "0")}° ${String(min).padStart(2, "0")}′ N`;
}

export function SpaceTemplate({ data }: { data: PortfolioData }) {
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
  const primaryColor = resolveAccentColor("space", portfolio.customization);
  const labels = getSectionLabels(portfolio.customization);
  const groupedSkills = groupSkillsByCategory(skills);
  const githubProfile = socialProfiles.find(
    (profile) => profile.platform.toLowerCase() === "github",
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
  const { hasProfiles, navbarEnabled, sections } = buildTemplateSections(data);

  const resolved = resolveSectionLayout(
    getTemplateSectionLayout("space"),
    portfolio.customization,
  );

  const linkedinSection = data.linkedin ? (
    <LinkedInSection
      data={data.linkedin}
      heading={<SectionHeading>{labels.linkedin}</SectionHeading>}
      classes={{
        aboutList: `flex flex-col gap-3 pl-5 text-base leading-8 ${mute} marker:text-slate-600`,
        aboutParagraph: `text-base leading-8 ${mute}`,
        postList: `list-disc flex flex-col gap-2 pl-5 text-sm leading-relaxed ${ink}`,
        postParagraph: `text-sm leading-relaxed ${ink}`,
        descriptionParagraph: `text-sm leading-7 ${mute}`,
        descriptionList: `flex flex-col gap-2 pl-5 text-sm leading-7 ${mute} marker:text-slate-600`,
        card: `rounded-sm border ${line} bg-white/[0.02] p-5`,
        title: `${displayFont} text-lg font-semibold ${ink}`,
        text: `text-sm leading-7 ${mute}`,
        muted: `text-sm ${mute}`,
        chip: `rounded-sm border ${line} px-2.5 py-1 text-sm ${mute}`,
        link: "text-sm font-medium text-[var(--lf-accent)] underline-offset-4 hover:underline",
        section: "scroll-mt-24",
      }}
    />
  ) : null;

  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: portfolio.summary ? (
      <section key="about" id="about" className="scroll-mt-24">
        <SectionHeading>{labels.about}</SectionHeading>
        <DescriptionBlock
          text={portfolio.summary}
          paragraphClassName="max-w-2xl whitespace-pre-line text-lg leading-9 text-slate-300"
          listClassName="max-w-2xl flex flex-col gap-3 pl-5 text-lg leading-9 text-slate-300 marker:text-slate-600"
        />
      </section>
    ) : null,

    projects: visibleProjects.length > 0 ? (
      <section key="projects" id="work" className="scroll-mt-24 min-w-0">
        <SectionHeading>{labels.projects}</SectionHeading>

        <CollapsibleList
          initial={4}
          wrapperClassName="flex flex-col"
          buttonClassName={moreBtn}
        >
          {visibleProjects.map((project) => (
            <article
              key={project.id}
              className={cn(
                "grid min-w-0 grid-cols-1 gap-4 border-t py-7 first:border-t-0 first:pt-0 @md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] @md:gap-8",
                line,
              )}
            >
              <TemplateProjectPreview
                templateId="space"
                liveUrl={project.liveUrl ?? null}
                imageUrl={project.imageUrl ?? null}
                projectId={project.id}
                livePreviewProjectIds={livePreviewProjectIds}
                alt={stripRichTextToPlain(project.title)}
                loading="lazy"
                containerClassName="overflow-hidden rounded-sm bg-[#070914] ring-1 ring-white/10"
                accentColor={primaryColor}
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className={cn(displayFont, "text-xl font-semibold tracking-tight", ink)}>
                    <RichText text={project.title} />
                  </h3>
                  {project.featured && (
                    <Badge
                      variant="outline"
                      className="h-auto gap-1.5 rounded-sm border-[var(--lf-accent)]/40 bg-transparent px-1.5 py-0 font-sans text-[11px] font-medium tracking-normal text-[var(--lf-accent)]"
                    >
                      <span aria-hidden className="size-1.5 rounded-full bg-[var(--lf-accent)]" />
                      Featured
                    </Badge>
                  )}
                </div>
                {project.description && (
                  <DescriptionBlock
                    text={project.description}
                    paragraphClassName={cn("mt-2 text-sm leading-7", mute)}
                    listClassName={cn("mt-2 flex flex-col gap-1.5 pl-5 text-sm leading-7", mute)}
                  />
                )}
                {project.techStack.length > 0 && (
                  <p className="mt-3 text-xs text-slate-500">
                    {project.techStack.slice(0, 5).join(", ")}
                  </p>
                )}
              </div>
              <div className="shrink-0">
                <ProjectActions
                  liveUrl={project.liveUrl}
                  sourceUrl={project.sourceUrl}
                  label={stripRichTextToPlain(project.title)}
                  projectId={project.id}
                  liveClassName="rounded-sm border border-white/20 bg-transparent px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-white/5 hover:text-white"
                  sourceClassName="rounded-sm px-2 py-1.5 text-xs font-medium text-slate-400 hover:text-white"
                />
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    experience: experiences.length > 0 ? (
      <section key="experience" id="experience" className="scroll-mt-24">
        <SectionHeading>{labels.experience}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName={cn("ml-1 flex flex-col border-l", line)}
          buttonClassName={cn("ml-7", moreBtn)}
        >
          {experiences.map((exp, index) => (
            <article key={exp.id} className="relative pb-10 pl-7 last:pb-0">
              <span
                aria-hidden
                className={cn(
                  "absolute -left-[4.5px] top-2 size-2 rounded-full",
                  index === 0 ? "bg-[var(--lf-accent)]" : "bg-slate-600",
                )}
              />
              <p className={cn("text-sm tabular-nums", mute)}>
                {formatDateRange(exp.startDate, exp.endDate) || "—"}
              </p>
              <h3 className={cn(displayFont, "mt-1.5 text-xl font-semibold tracking-tight", ink)}>
                <RichText text={exp.role} />
              </h3>
              <p className="mt-1 text-sm text-slate-300">
                <RichText text={exp.company} />
                {exp.location ? (
                  <span className="text-slate-500">
                    , <RichText text={exp.location} />
                  </span>
                ) : null}
              </p>
              {exp.description && (
                <DescriptionBlock
                  text={exp.description}
                  paragraphClassName={cn("mt-4 max-w-2xl text-sm leading-7", mute)}
                  listClassName={cn("mt-4 max-w-2xl flex flex-col gap-2 pl-5 text-sm leading-7", mute, "marker:text-slate-600")}
                />
              )}
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    skills: skills.length > 0 ? (
      <section key="skills">
        <SectionHeading>{labels.skills}</SectionHeading>
        <div className="grid grid-cols-1 gap-x-10 gap-y-8 @md:grid-cols-2">
          {Object.entries(groupedSkills).map(([category, names]) => (
            <div key={category} className="min-w-0">
              <h3 className={cn("mb-3 text-sm", mute)}>{category}</h3>
              <div className="flex flex-wrap gap-2">
                {names.map((name) => (
                  <TechChip
                    key={name}
                    name={name}
                    className={cn(
                      "cursor-default rounded-sm border bg-white/[0.02] px-2.5 py-1 text-sm text-slate-200",
                      line,
                    )}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    ) : null,

    education: educations.length > 0 ? (
      <section key="education">
        <SectionHeading>{labels.education}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {educations.map((edu) => (
            <article
              key={edu.id}
              className={cn(
                "grid grid-cols-1 gap-2 border-t py-6 first:border-t-0 first:pt-0 @md:grid-cols-[9rem_minmax(0,1fr)] @md:gap-8",
                line,
              )}
            >
              <p className={cn("pt-0.5 text-sm tabular-nums", mute)}>
                {formatDateRange(edu.startDate, edu.endDate) || "—"}
              </p>
              <div className="min-w-0">
                <h3 className={cn(displayFont, "text-lg font-semibold", ink)}>
                  <RichText text={edu.degree} />
                  {edu.field && (
                    <span className="font-normal text-slate-400">
                      {" "}
                      in <RichText text={edu.field} />
                    </span>
                  )}
                </h3>
                <p className={cn("mt-1 text-sm", mute)}>
                  <RichText text={edu.institution} />
                </p>
                {edu.gpa && <p className="mt-2 text-xs text-slate-500">{edu.gpa}</p>}
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    certifications: certifications.length > 0 ? (
      <section key="certifications">
        <SectionHeading>{labels.certifications}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {certifications.map((cert) => (
            <article
              key={cert.id}
              className={cn(
                "flex min-w-0 flex-col gap-1 border-t py-5 first:border-t-0 first:pt-0 @md:flex-row @md:items-baseline @md:justify-between @md:gap-8",
                line,
              )}
            >
              <div className="min-w-0">
                <h3 className={cn("text-base font-medium", ink)}>
                  {cert.url ? (
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline-offset-4 hover:underline"
                    >
                      {cert.name}
                    </a>
                  ) : (
                    cert.name
                  )}
                </h3>
                <p className={cn("mt-1 text-sm", mute)}>{cert.issuer}</p>
              </div>
              {cert.issueDate && (
                <p className="shrink-0 text-sm tabular-nums text-slate-500">
                  {formatMonthYear(cert.issueDate)}
                </p>
              )}
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    achievements: achievements.length > 0 ? (
      <section key="achievements">
        <SectionHeading>{labels.achievements}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {achievements.map((ach) => (
            <article
              key={ach.id}
              className={cn(
                "flex items-start gap-4 border-t py-5 first:border-t-0 first:pt-0",
                line,
              )}
            >
              <span
                aria-hidden
                className="mt-2.5 size-1.5 shrink-0 rounded-full bg-[var(--lf-accent)]"
              />
              <div className="min-w-0 flex-1">
                <p className={cn("text-base leading-relaxed", ink)}>
                  <RichText text={ach.title} />
                </p>
                {ach.date && (
                  <p className="mt-1 text-xs text-slate-500">{formatMonthYear(ach.date)}</p>
                )}
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    articles: articles.length > 0 ? (
      <section key="articles" id="writing" className="scroll-mt-24">
        <SectionHeading>{labels.articles}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {articles.map((article) => (
            <article
              key={article.id}
              className={cn("border-t py-6 first:border-t-0 first:pt-0", line)}
            >
              <ArticleSourceLabel source={article.source} className="mb-1.5 text-slate-500" />
              <div className="flex min-w-0 flex-col gap-1 @md:flex-row @md:items-baseline @md:justify-between @md:gap-8">
                <h3 className={cn(displayFont, "min-w-0 text-lg font-semibold tracking-tight", ink)}>
                  <a
                    href={article.url}
                    data-lf-track="article"
                    data-lf-label={stripRichTextToPlain(article.title)}
                    data-lf-id={article.id}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline-offset-4 hover:text-[var(--lf-accent)] hover:underline"
                  >
                    <RichText text={article.title} />
                  </a>
                </h3>
                <p className="shrink-0 text-sm tabular-nums text-slate-500">
                  {article.publishedAt ? formatMonthYear(article.publishedAt) : null}
                  {article.readTime != null ? (
                    <span>
                      {article.publishedAt ? ", " : null}
                      {article.readTime} min read
                    </span>
                  ) : null}
                </p>
              </div>
              {article.description && (
                <p className={cn("mt-2 max-w-2xl text-sm leading-7", mute)}>{article.description}</p>
              )}
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    profiles: hasProfiles ? (
      <section key="profiles" id="profiles" className="scroll-mt-24">
        <SectionHeading>{labels.profiles}</SectionHeading>
        <ProfileLinksSection
          portfolio={portfolio}
          profiles={socialProfiles}
          chipClassName={cn("rounded-sm border px-2.5 py-1 text-sm text-slate-300", line)}
          pillClassName={cn(
            "rounded-sm border px-2.5 py-1 text-sm text-slate-100 transition-colors hover:border-[var(--lf-accent)]/60",
            line,
          )}
          titleClassName={cn(displayFont, "text-xl font-semibold", ink)}
          textClassName={mute}
        />
      </section>
    ) : null,

    github: contributionCalendar ? (
      <section key="github">
        <SectionHeading>{labels.github}</SectionHeading>
        <div className={cn("overflow-x-auto rounded-sm border p-5 custom-scrollbar", line)}>
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
      className={cn(
        TEMPLATE_CONTAINER,
        sora.variable,
        figtree.variable,
        jetbrains.variable,
        "relative min-h-screen bg-[#04050a] font-[family-name:var(--font-space-sans)] antialiased selection:bg-[var(--lf-accent)] selection:text-[#04050a]",
        ink,
      )}
      style={accentRootStyle(primaryColor)}
    >
      {/* Star field: tiny fixed-size dots, faded out toward the bottom of the page. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: STARFIELD,
          backgroundSize:
            "420px 420px, 310px 310px, 370px 370px, 520px 520px, 280px 280px, 460px 460px, 640px 640px, 340px 340px",
          backgroundPosition:
            "0 0, 90px 40px, 30px 140px, 200px 20px, 150px 220px, 60px 90px, 300px 160px, 10px 260px",
          maskImage: "linear-gradient(to bottom, black 0%, black 35%, transparent 85%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 35%, transparent 85%)",
        }}
      />

      {navbarEnabled && (
        <TemplateNavbar
          items={sections}
          className="border-x-0 border-t-0 border-white/10 bg-[#04050a]/80"
          linkClassName="px-3 py-2 text-sm text-slate-400 transition-colors hover:text-slate-100"
        />
      )}

      <div className="relative mx-auto min-w-0 max-w-6xl px-5 pb-20 pt-14 sm:px-6 md:px-8 md:pb-32 md:pt-24">
        <header className="relative min-w-0">
          <Orbit />
          <p
            aria-hidden
            className="mb-8 font-[family-name:var(--font-space-mono)] text-xs text-slate-500"
          >
            {coordinateFor(portfolio.title)}
          </p>
          <h1
            className={cn(
              HERO_TITLE_BASE,
              displayFont,
              "relative max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.04em] @sm:text-5xl @md:text-6xl @lg:text-7xl",
              ink,
            )}
          >
            <RichText text={portfolio.title} />
          </h1>
          {portfolio.headline && (
            <p className="relative mt-6 max-w-xl text-lg leading-8 text-slate-400 @md:text-xl">
              <RichText text={portfolio.headline} />
            </p>
          )}

          <div className="relative mt-9 flex flex-col gap-4">
            <HeroProfileButtons
              profiles={socialProfiles}
              className="rounded-sm bg-[var(--lf-accent)] px-4 py-2 text-sm font-semibold text-[#04050a] transition-opacity hover:opacity-90"
            />
            <ContactChips portfolio={portfolio} chipClassName="text-sm text-slate-400" />
            {hasNonHeroSocialProfiles(socialProfiles) && (
              <SocialPills
                profiles={socialProfiles}
                showUsername
                excludeHeroPlatforms
                className="text-sm text-slate-400 underline-offset-4 transition-colors hover:text-slate-100 hover:underline"
              />
            )}
          </div>
        </header>

        <div className="relative mt-24 flex min-w-0 flex-col gap-20 md:mt-32 md:gap-28">
          {renderSections(resolved, "full", { ...blocks, linkedin: linkedinSection })}

          {customSections.length > 0 &&
            customSections.map((cs) => (
              <section key={cs.id} className="scroll-mt-24">
                <SectionHeading>{cs.label}</SectionHeading>
                <CustomSectionItems
                  items={cs.items}
                  titleClassName={cn(displayFont, "text-lg font-semibold", ink)}
                  textClassName={cn("text-sm leading-7", mute)}
                  chipClassName={cn("rounded-sm border px-2 py-0.5 text-xs", line, mute)}
                  buttonClassName={moreBtn}
                />
              </section>
            ))}
        </div>
      </div>
    </div>
  );
}

/** One thin orbit with a single satellite: the only illustration on the page. */
function Orbit() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 400 400"
      className="pointer-events-none absolute -right-24 -top-16 hidden size-[26rem] text-white/15 @lg:block"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      <circle cx="200" cy="200" r="190" />
      <circle cx="200" cy="200" r="120" />
      <circle cx="200" cy="200" r="3" fill="currentColor" stroke="none" />
      <circle
        cx="84"
        cy="94"
        r="4"
        stroke="none"
        style={{ fill: "var(--lf-accent)" }}
      />
    </svg>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  const label = typeof children === "string" ? children : "";
  return (
    <div className="mb-9">
      <div className="flex items-baseline justify-between gap-4">
        <h2
          className={cn(
            "font-[family-name:var(--font-space-display)] text-2xl font-semibold tracking-tight md:text-3xl",
            ink,
          )}
        >
          {children}
        </h2>
        <span
          aria-hidden
          className="shrink-0 font-[family-name:var(--font-space-mono)] text-[11px] text-slate-600"
        >
          {coordinateFor(label || "section")}
        </span>
      </div>
      <Separator className="mt-4 bg-white/10" />
    </div>
  );
}
