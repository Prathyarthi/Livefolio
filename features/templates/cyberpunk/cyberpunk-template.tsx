import { Chakra_Petch, JetBrains_Mono } from "next/font/google";
import { resolveAccentColor, accentRootStyle } from "@/features/templates/template-accent-palettes";
import { stripRichTextToPlain } from "@/lib/rich-text";
import type { PortfolioData } from "../types";
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
  getSectionLabels,
} from "../shared";
import { CollapsibleList } from "../collapsible-list";
import { formatDateRange, groupSkillsByCategory } from "../utils";
import { TemplateProjectPreview } from "@/components/template-project-preview";
import { getTemplateSectionLayout } from "../section-layouts";
import {
  renderSections,
  resolveSectionLayout,
  type ReorderableSectionKey,
} from "../section-order";
import { LinkedInSection } from "@/features/templates/components/linkedin-section";

/**
 * Cyberpunk — neon on asphalt
 * Subject: a dense status readout. Asphalt black, one neon (the accent) used as
 * a thin rule or marker, and exactly one glitch moment: the name in the hero.
 * Type: Chakra Petch (display + body) + JetBrains Mono (dates, stack, meta)
 * Layout: table-like rows, mono key/value metadata, a single boxed lead project
 */
const chakra = Chakra_Petch({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cyber-display",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-cyber-mono",
});

const ink = "text-zinc-100";
const body = "text-zinc-300";
const mute = "text-zinc-500";
const line = "border-white/10";
const monoFont = "font-[family-name:var(--font-cyber-mono)]";
const displayFont = "font-[family-name:var(--font-cyber-display)]";
const moreBtn = cn(
  "mt-5 self-start border border-white/15 bg-transparent px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-[var(--lf-accent)] hover:text-[var(--lf-accent)]",
  monoFont,
);
const metaChip = cn(
  "rounded-none border bg-transparent px-2 py-0.5 text-[11px] text-zinc-400",
  line,
  monoFont,
);

function formatMonthYear(value: string | Date) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export function CyberpunkTemplate({ data }: { data: PortfolioData }) {
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
  const primaryColor = resolveAccentColor("cyberpunk", portfolio.customization);
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
    getTemplateSectionLayout("cyberpunk"),
    portfolio.customization,
  );

  const linkedinSection = data.linkedin ? (
    <LinkedInSection
      data={data.linkedin}
      heading={<SectionHeading>{labels.linkedin}</SectionHeading>}
      classes={{
        aboutList: `flex flex-col gap-2 pl-5 text-sm leading-7 ${body} marker:text-[var(--lf-accent)]`,
        aboutParagraph: `text-sm leading-7 ${body}`,
        postList: `list-disc flex flex-col gap-2 pl-5 text-sm leading-relaxed ${ink}`,
        postParagraph: `text-sm leading-relaxed ${ink}`,
        descriptionParagraph: `text-sm leading-7 ${body}`,
        descriptionList: `flex flex-col gap-2 pl-5 text-sm leading-7 ${body} marker:text-[var(--lf-accent)]`,
        card: `border ${line} bg-white/[0.02] p-4`,
        title: `${displayFont} text-base font-semibold ${ink}`,
        text: `text-sm leading-7 ${body}`,
        muted: `${monoFont} text-xs ${mute}`,
        chip: metaChip,
        link: `${monoFont} text-xs text-[var(--lf-accent)] underline-offset-4 hover:underline`,
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
          paragraphClassName={cn("whitespace-pre-line text-base leading-8", body)}
          listClassName={cn(
            "flex flex-col gap-2 pl-5 text-base leading-8 marker:text-[var(--lf-accent)]",
            body,
          )}
        />
      </section>
    ) : null,

    projects: visibleProjects.length > 0 ? (
      <section key="projects" id="work" className="scroll-mt-24 min-w-0">
        <SectionHeading>{labels.projects}</SectionHeading>

        <CollapsibleList
          initial={4}
          wrapperClassName="grid min-w-0 grid-cols-1 gap-5 @md:grid-cols-2 [&>*]:min-w-0"
          buttonClassName={cn(moreBtn, "col-span-full justify-self-start")}
        >
          {visibleProjects.map((project) => (
            <article
              key={project.id}
              className="flex min-w-0 flex-col overflow-hidden border border-white/10 bg-black/30"
            >
              <TemplateProjectPreview
                templateId="cyberpunk"
                liveUrl={project.liveUrl ?? null}
                imageUrl={project.imageUrl ?? null}
                projectId={project.id}
                livePreviewProjectIds={livePreviewProjectIds}
                alt={stripRichTextToPlain(project.title)}
                loading="lazy"
                containerClassName="overflow-hidden border-b border-white/10 bg-[#0a0a0c]"
                accentColor={primaryColor}
              />
              <div className="flex min-w-0 grow flex-col p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className={cn(displayFont, "text-lg font-semibold", ink)}>
                    <RichText text={project.title} />
                  </h3>
                  {project.featured && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "h-auto rounded-none border-[var(--lf-accent)]/60 bg-transparent px-1.5 py-0 text-[10px] font-medium tracking-normal text-[var(--lf-accent)]",
                        monoFont,
                      )}
                    >
                      Featured
                    </Badge>
                  )}
                </div>
                {project.description && (
                  <DescriptionBlock
                    text={project.description}
                    paragraphClassName={cn("mt-2 text-sm leading-6", mute, "text-zinc-400")}
                    listClassName="mt-2 flex flex-col gap-1 pl-5 text-sm leading-6 text-zinc-400 marker:text-[var(--lf-accent)]"
                  />
                )}
                {project.techStack.length > 0 && (
                  <p className={cn("mt-3 text-[11px]", monoFont, mute)}>
                    {project.techStack.slice(0, 6).join(" / ")}
                  </p>
                )}
                <div className="mt-auto pt-5">
                  <ProjectActions
                    liveUrl={project.liveUrl}
                    sourceUrl={project.sourceUrl}
                    label={stripRichTextToPlain(project.title)}
                    projectId={project.id}
                    liveClassName="rounded-none border border-white/20 bg-transparent px-3 py-1.5 text-xs font-medium text-zinc-100 hover:border-[var(--lf-accent)] hover:bg-transparent hover:text-[var(--lf-accent)]"
                    sourceClassName="rounded-none px-2 py-1.5 text-xs font-medium text-zinc-400 hover:bg-transparent hover:text-[var(--lf-accent)]"
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
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {experiences.map((exp, index) => (
            <article
              key={exp.id}
              className={cn(
                "relative grid grid-cols-1 gap-2 border-t py-6 first:border-t-0 first:pt-0 @md:grid-cols-[10rem_minmax(0,1fr)] @md:gap-6",
                line,
              )}
            >
              {index === 0 && (
                <span
                  aria-hidden
                  className="absolute -top-px left-0 h-px w-16 bg-[var(--lf-accent)]"
                />
              )}
              <p className={cn("pt-1 text-xs", monoFont, index === 0 ? "text-[var(--lf-accent)]" : mute)}>
                {formatDateRange(exp.startDate, exp.endDate) || "—"}
              </p>
              <div className="min-w-0">
                <h3 className={cn(displayFont, "text-xl font-semibold", ink)}>
                  <RichText text={exp.role} />
                </h3>
                <p className="mt-0.5 text-sm text-zinc-400">
                  <RichText text={exp.company} />
                  {exp.location ? (
                    <span className="text-zinc-600">
                      , <RichText text={exp.location} />
                    </span>
                  ) : null}
                </p>
                {exp.description && (
                  <DescriptionBlock
                    text={exp.description}
                    paragraphClassName={cn("mt-3 max-w-3xl text-sm leading-7", body)}
                    listClassName={cn(
                      "mt-3 max-w-3xl flex flex-col gap-1.5 pl-5 text-sm leading-7 marker:text-[var(--lf-accent)]",
                      body,
                    )}
                  />
                )}
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    skills: skills.length > 0 ? (
      <section key="skills">
        <SectionHeading>{labels.skills}</SectionHeading>
        <div className="flex flex-col">
          {Object.entries(groupedSkills).map(([category, names]) => (
            <div
              key={category}
              className={cn(
                "grid grid-cols-1 gap-3 border-t py-4 first:border-t-0 first:pt-0 @md:grid-cols-[10rem_minmax(0,1fr)] @md:gap-6",
                line,
              )}
            >
              <h3 className={cn("text-xs", monoFont, mute)}>{category}</h3>
              <div className="flex flex-wrap gap-1.5">
                {names.map((name) => (
                  <TechChip
                    key={name}
                    name={name}
                    className="cursor-default rounded-none border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-zinc-200 transition-colors hover:border-[var(--lf-accent)]/60"
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
                "grid grid-cols-1 gap-2 border-t py-5 first:border-t-0 first:pt-0 @md:grid-cols-[10rem_minmax(0,1fr)] @md:gap-6",
                line,
              )}
            >
              <p className={cn("pt-0.5 text-xs", monoFont, mute)}>
                {formatDateRange(edu.startDate, edu.endDate) || "—"}
              </p>
              <div className="min-w-0">
                <h3 className={cn(displayFont, "text-base font-semibold", ink)}>
                  <RichText text={edu.degree} />
                  {edu.field ? (
                    <>
                      {" "}
                      in <RichText text={edu.field} />
                    </>
                  ) : null}
                </h3>
                <p className="mt-0.5 text-sm text-zinc-400">
                  <RichText text={edu.institution} />
                </p>
                {edu.gpa && <p className={cn("mt-2 text-xs", monoFont, mute)}>{edu.gpa}</p>}
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
                "grid grid-cols-1 gap-1 border-t py-4 first:border-t-0 first:pt-0 @md:grid-cols-[10rem_minmax(0,1fr)] @md:gap-6",
                line,
              )}
            >
              <p className={cn("text-xs", monoFont, mute)}>
                {cert.issueDate ? formatMonthYear(cert.issueDate) : "—"}
              </p>
              <div className="min-w-0">
                <h3 className={cn("text-base font-medium", ink)}>
                  {cert.url ? (
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline-offset-4 hover:text-[var(--lf-accent)] hover:underline"
                    >
                      {cert.name}
                    </a>
                  ) : (
                    cert.name
                  )}
                </h3>
                <p className="mt-0.5 text-sm text-zinc-400">{cert.issuer}</p>
              </div>
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
                "grid grid-cols-1 gap-1 border-t py-4 first:border-t-0 first:pt-0 @md:grid-cols-[10rem_minmax(0,1fr)] @md:gap-6",
                line,
              )}
            >
              <p className={cn("text-xs", monoFont, mute)}>
                {ach.date ? formatMonthYear(ach.date) : "—"}
              </p>
              <p className={cn("min-w-0 text-base leading-relaxed", ink)}>
                <RichText text={ach.title} />
              </p>
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
              className={cn(
                "grid grid-cols-1 gap-2 border-t py-5 first:border-t-0 first:pt-0 @md:grid-cols-[10rem_minmax(0,1fr)] @md:gap-6",
                line,
              )}
            >
              <p className={cn("pt-1 text-xs", monoFont, mute)}>
                {article.publishedAt ? formatMonthYear(article.publishedAt) : "—"}
                {article.readTime != null ? (
                  <span className="block">{article.readTime} min read</span>
                ) : null}
              </p>
              <div className="min-w-0">
                <ArticleSourceLabel source={article.source} className="mb-1 text-zinc-600" />
                <h3 className={cn(displayFont, "text-lg font-semibold", ink)}>
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
                {article.description && (
                  <p className="mt-1.5 max-w-3xl text-sm leading-7 text-zinc-400">
                    <RichText text={article.description} />
                  </p>
                )}
              </div>
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
          chipClassName={cn("rounded-none border px-2.5 py-1 text-xs text-zinc-300", line, monoFont)}
          pillClassName={cn(
            "rounded-none border px-2.5 py-1 text-xs text-zinc-100 transition-colors hover:border-[var(--lf-accent)] hover:text-[var(--lf-accent)]",
            line,
            monoFont,
          )}
          titleClassName={cn(displayFont, "text-xl font-semibold", ink)}
          textClassName="text-zinc-400"
        />
      </section>
    ) : null,

    github: contributionCalendar ? (
      <section key="github" className="scroll-mt-24 min-w-0">
        <SectionHeading>{labels.github}</SectionHeading>
        <div className="min-w-0 overflow-x-auto custom-scrollbar">
          <GitHubContributionHeatmap
            calendar={contributionCalendar}
            profileUrl={githubProfile?.url}
            username={githubProfile?.username}
            variant="modern"
            stretch
            className="mt-0 border-0 pt-0"
            frameClassName="rounded-none border-0 bg-[#0a0a0c] p-0 shadow-none"
            label={null}
          />
        </div>
      </section>
    ) : null,
  };

  return (
    <div
      className={cn(
        TEMPLATE_CONTAINER,
        chakra.variable,
        mono.variable,
        "relative min-h-screen bg-[#0a0a0c] font-[family-name:var(--font-cyber-display)] antialiased selection:bg-[var(--lf-accent)] selection:text-black",
        ink,
      )}
      style={accentRootStyle(primaryColor)}
    >
      {/* Faint street grid, hero only, fading into asphalt. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[560px] opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(var(--lf-accent) 1px, transparent 1px), linear-gradient(90deg, var(--lf-accent) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "linear-gradient(to bottom, black, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
        }}
      />

      {navbarEnabled && (
        <TemplateNavbar
          items={sections}
          className="border-x-0 border-t-0 border-white/10 bg-[#0a0a0c]/85"
          linkClassName={cn(
            "px-3 py-2 text-xs text-zinc-400 transition-colors hover:text-[var(--lf-accent)]",
            monoFont,
          )}
        />
      )}

      <div className="relative mx-auto min-w-0 max-w-6xl px-5 pb-20 pt-14 sm:px-6 md:px-8 md:pb-32 md:pt-24">
        <header className="min-w-0">
          <h1
            className={cn(
              HERO_TITLE_BASE,
              "text-5xl font-bold leading-[0.95] tracking-[-0.03em] @sm:text-6xl @md:text-7xl @lg:text-8xl",
              ink,
            )}
          >
            <RichText text={portfolio.title} />
          </h1>

          {portfolio.headline && (
            <p className={cn("mt-6 max-w-2xl text-sm leading-7 text-zinc-300 @md:text-base", monoFont)}>
              <span className="text-[var(--lf-accent)]">&gt;</span>{" "}
              <RichText text={portfolio.headline} />
            </p>
          )}

          <div className={cn("mt-8 flex flex-col gap-4 border-t pt-6", line)}>
            <HeroProfileButtons
              profiles={socialProfiles}
              className="rounded-none bg-[var(--lf-accent)] px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-white"
            />
            <ContactChips
              portfolio={portfolio}
              chipClassName={cn("text-xs text-zinc-400", monoFont)}
            />
            {hasNonHeroSocialProfiles(socialProfiles) && (
              <SocialPills
                profiles={socialProfiles}
                showUsername
                excludeHeroPlatforms
                className={cn(
                  "text-xs text-zinc-400 transition-colors hover:text-[var(--lf-accent)]",
                  monoFont,
                )}
              />
            )}
          </div>
        </header>

        <div className="relative mt-20 flex min-w-0 flex-col gap-20 md:mt-28 md:gap-24">
          {renderSections(resolved, "full", { ...blocks, linkedin: linkedinSection })}

          {customSections.length > 0 &&
            customSections.map((cs) => (
              <section key={cs.id} className="scroll-mt-24">
                <SectionHeading>{cs.label}</SectionHeading>
                <CustomSectionItems
                  items={cs.items}
                  titleClassName={cn(displayFont, "text-base font-semibold", ink)}
                  textClassName="text-sm leading-7 text-zinc-400"
                  chipClassName={metaChip}
                  buttonClassName={moreBtn}
                />
              </section>
            ))}
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2
        className={cn(
          "flex items-baseline gap-3 font-[family-name:var(--font-cyber-display)] text-2xl font-semibold tracking-tight md:text-3xl",
          ink,
        )}
      >
        <span
          aria-hidden
          className="font-[family-name:var(--font-cyber-mono)] text-base text-[var(--lf-accent)]"
        >
          {"//"}
        </span>
        {children}
      </h2>
      <Separator className="mt-4 bg-white/10" />
    </div>
  );
}
