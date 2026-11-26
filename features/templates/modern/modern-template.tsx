"use client";

import { Manrope, Syne } from "next/font/google";
import { resolveAccentColor, accentRootStyle } from "@/features/templates/template-accent-palettes";
import { stripRichTextToPlain } from "@/lib/rich-text";
import type { PortfolioData } from "../types";
import { cn } from "@/lib/utils";
import {
  GitHubContributionHeatmap,
  parseContributionCalendar,
} from "../github-contribution-heatmap";
import { Trophy } from "lucide-react";
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
 * Modern — night studio portfolio
 * Color: #09090b ink, #eceae4 paper text, mute #9c9890, accent only as a signal
 * Type: Syne (name / section titles) + Manrope (body)
 * Layout: one cinematic lead project; everything else is a quiet index
 * Inspired by stageshow restraint + frontend-design (not the SaaS card kit)
 */
const syne = Syne({
  subsets: ["latin"],
  variable: "--font-modern-display",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-modern-sans",
});

const ink = "text-[#eceae4]";
const mute = "text-[#9c9890]";
const hairline = "border-[#eceae4]/12";
const moreBtn =
  "mt-6 self-start rounded-none border-0 bg-transparent px-0 py-1.5 font-sans text-sm text-[#9c9890] underline-offset-4 hover:text-[#eceae4] hover:underline";

export function ModernTemplate({ data }: { data: PortfolioData }) {
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
  const primaryColor = resolveAccentColor("modern", portfolio.customization);
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
  const orderedProjects =
    featuredProjects.length > 0
      ? [...featuredProjects, ...projects.filter((p) => !p.featured)]
      : projects;
  const { hasProfiles, navbarEnabled, sections } = buildTemplateSections(data);
  const resolved = resolveSectionLayout(
    getTemplateSectionLayout("modern"),
    portfolio.customization,
  );

  const linkedinSection = data.linkedin ? (
    <LinkedInSection
      data={data.linkedin}
      heading={<SectionHeading>{labels.linkedin}</SectionHeading>}
      classes={{
        aboutList: `flex flex-col gap-3 pl-5 text-base leading-8 ${mute} marker:text-[#eceae4]/30`,
        aboutParagraph: `text-base leading-8 ${mute}`,
        postList: `list-disc flex flex-col gap-2 pl-5 text-sm leading-relaxed ${ink}`,
        postParagraph: `text-sm leading-relaxed ${ink}`,
        descriptionParagraph: `text-sm leading-7 ${mute}`,
        descriptionList: `flex flex-col gap-2 pl-5 text-sm leading-7 ${mute} marker:text-[#eceae4]/30`,
        card: `rounded-none border ${hairline} bg-transparent p-5`,
        title: `font-[family-name:var(--font-modern-display)] text-xl font-semibold ${ink}`,
        text: `text-sm leading-7 ${mute}`,
        muted: `text-sm ${mute}`,
        chip: `rounded-none border ${hairline} px-2.5 py-1 text-sm ${mute}`,
        link: "text-sm font-medium text-[var(--lf-accent)] underline-offset-4 hover:underline",
        section: `scroll-mt-28 border-t ${hairline} pt-12`,
      }}
    />
  ) : null;

  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: portfolio.summary ? (
      <section key="about" id="about" className={cn("scroll-mt-28 border-t pt-12", hairline)}>
        <SectionHeading>{labels.about}</SectionHeading>
        <DescriptionBlock
          text={portfolio.summary}
          paragraphClassName={cn("whitespace-pre-line text-lg leading-8", mute)}
          listClassName={cn("flex flex-col gap-3 pl-5 text-lg leading-8", mute, "marker:text-[#eceae4]/30")}
        />
      </section>
    ) : null,

    projects: orderedProjects.length > 0 ? (
      <section key="projects" id="work" className={cn("scroll-mt-28 min-w-0 border-t pt-12", hairline)}>
        <SectionHeading>{labels.projects}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName="flex flex-col"
          buttonClassName={moreBtn}
        >
          {orderedProjects.map((project) => (
            <article
              key={project.id}
              className={cn(
                "grid min-w-0 grid-cols-1 gap-4 border-t py-7 first:border-t-0 first:pt-0 @md:grid-cols-2 @md:items-start @md:gap-8",
                hairline,
              )}
            >
              <div className="min-w-0 w-full overflow-hidden rounded-sm border border-[#eceae4]/10">
                <TemplateProjectPreview
                  templateId="modern"
                  liveUrl={project.liveUrl ?? null}
                  imageUrl={project.imageUrl ?? null}
                  projectId={project.id}
                  livePreviewProjectIds={livePreviewProjectIds}
                  alt={stripRichTextToPlain(project.title)}
                  loading="lazy"
                  accentColor={primaryColor}
                  containerClassName="aspect-[8/5] w-full bg-[#09090b]"
                />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h3
                    className={cn(
                      "font-[family-name:var(--font-modern-display)] text-xl font-semibold tracking-tight",
                      ink,
                    )}
                  >
                    <RichText text={project.title} />
                  </h3>
                  {project.featured && (
                    <Badge
                      variant="outline"
                      className="h-auto rounded-none border-[var(--lf-accent)]/40 bg-transparent px-1.5 py-0 font-sans text-[11px] font-medium tracking-normal text-[var(--lf-accent)]"
                    >
                      Featured
                    </Badge>
                  )}
                </div>
                {project.description && (
                  <DescriptionBlock
                    text={project.description}
                    paragraphClassName={cn("mt-2 text-sm leading-6", mute)}
                    listClassName={cn("mt-2 flex flex-col gap-1.5 pl-5 text-sm leading-6", mute)}
                  />
                )}
                {project.techStack.length > 0 && (
                  <p className={cn("mt-3 text-xs", mute)}>
                    {project.techStack.slice(0, 6).join(" · ")}
                  </p>
                )}
                <div className="mt-4">
                  <ProjectActions
                    liveUrl={project.liveUrl}
                    sourceUrl={project.sourceUrl}
                    label={stripRichTextToPlain(project.title)}
                    projectId={project.id}
                    liveClassName={cn(
                      "rounded-none border bg-transparent px-3 py-1.5 text-xs font-medium hover:bg-[#eceae4]/5",
                      hairline,
                      ink,
                    )}
                    sourceClassName={cn("rounded-none px-3 py-1.5 text-xs font-medium hover:underline", mute)}
                  />
                </div>
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    experience: experiences.length > 0 ? (
      <section
        key="experience"
        id="experience"
        className={cn("scroll-mt-28 border-t pt-12", hairline)}
      >
        <SectionHeading>{labels.experience}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {experiences.map((exp) => (
            <article
              key={exp.id}
              className={cn(
                "grid grid-cols-1 gap-3 border-t py-7 first:border-t-0 first:pt-0 @md:grid-cols-[9rem_minmax(0,1fr)] @md:gap-10",
                hairline,
              )}
            >
              <p className={cn("pt-1 text-sm tabular-nums", mute)}>
                {formatDateRange(exp.startDate, exp.endDate) || "—"}
              </p>
              <div className="min-w-0">
                <h3
                  className={cn(
                    "font-[family-name:var(--font-modern-display)] text-xl font-semibold tracking-tight",
                    ink,
                  )}
                >
                  <RichText text={exp.role} />
                </h3>
                <p className="mt-1 text-sm text-[var(--lf-accent)]">
                  <RichText text={exp.company} />
                  {exp.location ? (
                    <span className={mute}>
                      {" · "}
                      <RichText text={exp.location} />
                    </span>
                  ) : null}
                </p>
                {exp.description && (
                  <DescriptionBlock
                    text={exp.description}
                    paragraphClassName={cn("mt-4 max-w-[40rem] text-sm leading-7", mute)}
                    listClassName={cn("mt-4 max-w-[40rem] flex flex-col gap-2 pl-5 text-sm leading-7", mute)}
                  />
                )}
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    articles: articles.length > 0 ? (
      <section key="articles" id="writing" className={cn("scroll-mt-28 border-t pt-12", hairline)}>
        <SectionHeading>{labels.articles}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {articles.map((article) => (
            <article
              key={article.id}
              className={cn("border-t py-5 first:border-t-0 first:pt-0", hairline)}
            >
              <ArticleSourceLabel source={article.source} className={cn("mb-1.5 opacity-70", mute)} />
              <div className="flex min-w-0 flex-col gap-2 @md:flex-row @md:items-baseline @md:justify-between @md:gap-8">
                <h3
                  className={cn(
                    "min-w-0 font-[family-name:var(--font-modern-display)] text-lg font-semibold tracking-tight",
                    ink,
                  )}
                >
                  <a
                    href={article.url}
                    data-lf-track="article"
                    data-lf-label={stripRichTextToPlain(article.title)}
                    data-lf-id={article.id}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline-offset-4 hover:underline"
                  >
                    <RichText text={article.title} />
                  </a>
                </h3>
                <p className={cn("shrink-0 text-sm tabular-nums", mute)}>
                  {article.publishedAt
                    ? new Date(article.publishedAt).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })
                    : null}
                  {article.readTime != null ? (
                    <span>
                      {article.publishedAt ? " · " : null}
                      {article.readTime} min
                    </span>
                  ) : null}
                </p>
              </div>
              {article.description && (
                <p className={cn("mt-2 max-w-[40rem] text-sm leading-6", mute)}><RichText text={article.description} /></p>
              )}
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    skills: skills.length > 0 ? (
      <section key="skills" className={cn("border-t pt-12", hairline)}>
        <SectionHeading>{labels.skills}</SectionHeading>
        <div className="grid grid-cols-1 gap-8 @md:grid-cols-2">
          {Object.entries(groupedSkills).map(([category, names]) => (
            <div key={category} className="min-w-0">
              <h3 className={cn("mb-3 text-sm", mute)}>{category}</h3>
              <div className={cn("flex flex-wrap gap-x-4 gap-y-2 text-base leading-7", ink)}>
                {names.map((name) => (
                  <TechChip key={name} name={name} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    ) : null,

    education: educations.length > 0 ? (
      <section key="education" className={cn("border-t pt-12", hairline)}>
        <SectionHeading>{labels.education}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {educations.map((edu) => (
            <article
              key={edu.id}
              className={cn(
                "grid grid-cols-1 gap-3 border-t py-6 first:border-t-0 first:pt-0 @md:grid-cols-[9rem_minmax(0,1fr)] @md:gap-10",
                hairline,
              )}
            >
              <p className={cn("pt-1 text-sm tabular-nums", mute)}>
                {formatDateRange(edu.startDate, edu.endDate) || "—"}
              </p>
              <div>
                <h3
                  className={cn(
                    "font-[family-name:var(--font-modern-display)] text-lg font-semibold",
                    ink,
                  )}
                >
                  <RichText text={edu.degree} />
                  {edu.field ? (
                    <>
                      {" "}
                      in <RichText text={edu.field} />
                    </>
                  ) : null}
                </h3>
                <p className={cn("mt-1 text-sm", mute)}>
                  <RichText text={edu.institution} />
                </p>
                {edu.gpa && <p className={cn("mt-2 text-xs", mute)}>{edu.gpa}</p>}
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    certifications: certifications.length > 0 ? (
      <section key="certifications" className={cn("border-t pt-12", hairline)}>
        <SectionHeading>{labels.certifications}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {certifications.map((cert) => (
            <article key={cert.id} className={cn("border-t py-5 first:border-t-0 first:pt-0", hairline)}>
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
              <p className={cn("mt-1 text-sm", mute)}>
                {cert.issuer}
                {cert.issueDate
                  ? ` · ${new Date(cert.issueDate).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}`
                  : null}
              </p>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    achievements: achievements.length > 0 ? (
      <section key="achievements" className={cn("border-t pt-12", hairline)}>
        <SectionHeading>{labels.achievements}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {achievements.map((ach) => (
            <article key={ach.id} className={cn("flex items-start gap-3 border-t py-5 first:border-t-0 first:pt-0", hairline)}>
              <Trophy className="mt-0.5 size-4 shrink-0 text-[var(--lf-accent)]" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm leading-relaxed", ink)}>
                  <RichText text={ach.title} />
                </p>
                {ach.date && (
                  <p className={cn("mt-1 text-xs", mute)}>
                    {new Date(ach.date).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    profiles: hasProfiles ? (
      <section key="profiles" id="profiles" className={cn("scroll-mt-28 border-t pt-12", hairline)}>
        <SectionHeading>{labels.profiles}</SectionHeading>
        <ProfileLinksSection
          portfolio={portfolio}
          profiles={socialProfiles}
          chipClassName={cn("rounded-none border px-2.5 py-1 text-sm", hairline, mute)}
          pillClassName={cn(
            "rounded-none border px-2.5 py-1 text-sm transition-colors hover:bg-[#eceae4]/5",
            hairline,
            ink,
          )}
          titleClassName={ink}
          textClassName={mute}
        />
      </section>
    ) : null,

    github: contributionCalendar ? (
      <section key="github" className={cn("border-t pt-12", hairline)}>
        <SectionHeading>{labels.github}</SectionHeading>
        <div className="min-w-0 overflow-x-auto">
          <GitHubContributionHeatmap
            calendar={contributionCalendar}
            profileUrl={githubProfile?.url}
            username={githubProfile?.username}
            variant="modern"
            stretch
            className="mt-0 border-0 pt-0"
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
        syne.variable,
        manrope.variable,
        "min-h-screen bg-[#09090b] font-[family-name:var(--font-modern-sans)] antialiased",
        ink,
      )}
      style={accentRootStyle(primaryColor)}
    >
      <div className="relative mx-auto min-w-0 max-w-6xl overflow-x-clip px-5 pb-16 pt-10 sm:px-6 md:px-8 md:pb-28 md:pt-16">
        <header className="min-w-0 pb-4">
          <h1
            className={cn(
              HERO_TITLE_BASE,
              "font-[family-name:var(--font-modern-display)] text-4xl font-semibold leading-[1.05] tracking-[-0.04em] @sm:text-5xl @md:text-6xl @lg:text-7xl",
              ink,
            )}
          >
            <RichText text={portfolio.title} />
          </h1>
          {portfolio.headline && (
            <p className={cn("mt-5 max-w-[34rem] text-lg leading-8 @md:text-xl", mute)}>
              <RichText text={portfolio.headline} />
            </p>
          )}

          <div className="mt-8 flex flex-col gap-3">
            <ContactChips
              portfolio={portfolio}
              chipClassName={cn(
                "rounded-none border-0 bg-transparent px-0 py-0 text-sm underline-offset-4 hover:underline",
                mute,
              )}
            />
            <HeroProfileButtons
              profiles={socialProfiles}
              className={cn(
                "rounded-none border px-3 py-1.5 text-sm transition-colors hover:bg-[#eceae4]/5",
                hairline,
                ink,
              )}
            />
            {hasNonHeroSocialProfiles(socialProfiles) && (
              <SocialPills
                profiles={socialProfiles}
                showUsername
                excludeHeroPlatforms
                className={cn(
                  "rounded-none border px-2.5 py-1 text-sm transition-colors hover:bg-[#eceae4]/5",
                  hairline,
                  mute,
                )}
              />
            )}
          </div>
        </header>

        {navbarEnabled && (
          <div className="mt-10">
            <TemplateNavbar
              items={sections}
              className={cn("rounded-none border-0 bg-transparent", hairline)}
              linkClassName={cn(
                "rounded-none px-0 py-1 text-sm transition-colors hover:text-[#eceae4]",
                mute,
              )}
            />
          </div>
        )}

        <div className="mt-3 flex min-w-0 flex-col gap-4">
          {renderSections(resolved, "full", { ...blocks, linkedin: linkedinSection })}
        </div>

        {customSections.length > 0 && (
          <div className={cn("mt-4 grid gap-12 border-t pt-12 md:grid-cols-2", hairline)}>
            {customSections.map((cs) => (
              <section key={cs.id}>
                <SectionHeading>{cs.label}</SectionHeading>
                <CustomSectionItems
                  items={cs.items}
                  titleClassName={cn("font-medium", ink)}
                  textClassName={cn("text-sm", mute)}
                  chipClassName={cn("rounded-none border px-2 py-0.5 text-xs", hairline, mute)}
                  buttonClassName={moreBtn}
                />
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2
        className={cn(
          "font-[family-name:var(--font-modern-display)] text-2xl font-semibold tracking-tight md:text-[1.75rem]",
          ink,
        )}
      >
        {children}
      </h2>
      <Separator className="mt-4 bg-[#eceae4]/12" />
    </div>
  );
}
