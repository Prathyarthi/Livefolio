import { Outfit, Space_Grotesk } from "next/font/google";
import { resolveAccentColor, accentRootStyle } from "@/features/templates/template-accent-palettes";
import { stripRichTextToPlain } from "@/lib/rich-text";
import type { PortfolioData } from "../types";
import { getTemplateSectionLayout } from "../section-layouts";
import { resolveSectionLayout } from "../section-order";
import { cn } from "@/lib/utils";
import {
  GitHubContributionHeatmap,
  parseContributionCalendar,
} from "../github-contribution-heatmap";
import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  PROJECT_CARD,
  PROJECT_CARD_BODY,
  SocialPills,
  hasNonHeroSocialProfiles,
  BENTO_GRID,
  TEMPLATE_CONTAINER,
  TemplateNavbar,
  getSectionLabels,
} from "../shared";
import { CollapsibleList } from "../collapsible-list";
import { formatDateRange, groupSkillsByCategory } from "../utils";
import { TemplateProjectPreview } from "@/components/template-project-preview";
import { LinkedInSection } from "@/features/templates/components/linkedin-section";

/**
 * Bento — modular desk
 * Color: paper #eef0f2, ink #12141a, mute #667083, dark tile #12141a
 * Type: Space Grotesk (titles) + Outfit (body)
 * Layout: real bento proportions; one dark tile; no glow orbs / colored heading dots
 */
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-bento-display",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-bento-sans",
});

const tile =
  "rounded-2xl border border-[#12141a]/10 bg-white p-6 @md:p-7";
const tileDark =
  "rounded-2xl border border-transparent bg-[#12141a] p-6 text-[#eef0f2] @md:p-7";
const moreBtn =
  "mt-4 self-start rounded-lg border border-[#12141a]/12 bg-transparent px-3 py-1.5 text-sm text-[#667083] transition-colors hover:border-[#12141a]/25 hover:text-[#12141a]";

function TileTitle({
  children,
  dark = false,
}: {
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <h2
      className={cn(
        "mb-5 font-[family-name:var(--font-bento-display)] text-lg font-semibold tracking-tight @md:text-xl",
        dark ? "text-[#eef0f2]" : "text-[#12141a]",
      )}
    >
      {children}
    </h2>
  );
}

export function BentoTemplate({ data }: { data: PortfolioData }) {
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
  const primaryColor = resolveAccentColor("bento", portfolio.customization);
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
  const orderedProjects = visibleProjects;
  const { hasProfiles, navbarEnabled, sections } = buildTemplateSections(data);
  const resolved = resolveSectionLayout(
    getTemplateSectionLayout("bento"),
    portfolio.customization,
  );

  return (
    <div
      className={cn(
        TEMPLATE_CONTAINER,
        spaceGrotesk.variable,
        outfit.variable,
        "min-h-screen bg-[#eef0f2] font-[family-name:var(--font-bento-sans)] text-[#12141a] antialiased",
      )}
      style={accentRootStyle(primaryColor)}
    >
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 md:px-8 md:pb-24 md:pt-12">
        {navbarEnabled && (
          <div className="mb-8 flex justify-center">
            <TemplateNavbar
              items={sections}
              className="rounded-2xl border border-[#12141a]/10 bg-white"
              linkClassName="rounded-xl px-4 py-2 text-sm text-[#667083] transition-colors hover:bg-[#12141a]/[0.04] hover:text-[#12141a]"
            />
          </div>
        )}

        <div className={BENTO_GRID}>
          <header
            className={cn(
              tile,
              "relative col-span-1 flex min-w-0 flex-col gap-6 overflow-hidden @md:col-span-2 @lg:col-span-3",
            )}
          >
            <div>
              <h1 className="min-w-0 text-balance font-[family-name:var(--font-bento-display)] text-3xl font-semibold tracking-[-0.03em] [overflow-wrap:anywhere] @sm:text-4xl @md:text-5xl @lg:text-6xl">
                <RichText text={portfolio.title} />
              </h1>
              {portfolio.headline && (
                <p className="mt-3 max-w-2xl text-base text-[#667083] @md:text-lg @lg:text-xl">
                  <RichText text={portfolio.headline} />
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ContactChips
                portfolio={portfolio}
                chipClassName="rounded-xl border border-[#12141a]/10 bg-[#eef0f2] px-3 py-1.5 text-sm text-[#667083]"
              />
              <HeroProfileButtons
                profiles={socialProfiles}
                className="rounded-xl bg-[#12141a] px-4 py-1.5 text-sm text-white transition-colors hover:bg-black"
              />
            </div>
          </header>

          {portfolio.summary && !resolved.isHidden("about") && (
            <section id="about" className={cn(tileDark, "col-span-1 scroll-mt-24 @md:col-span-3 @lg:col-span-2")}>
              <TileTitle dark>{labels.about}</TileTitle>
              <DescriptionBlock
                text={portfolio.summary}
                paragraphClassName="text-base leading-7 text-[#eef0f2]/80"
                listClassName="flex flex-col gap-2 pl-5 text-base leading-7 text-[#eef0f2]/80 marker:text-[#eef0f2]/35"
              />
            </section>
          )}

          {hasNonHeroSocialProfiles(socialProfiles) && !resolved.isHidden("profiles") && (
            <div className={cn(tile, "col-span-1 flex flex-col justify-center @lg:col-span-2")}>
              <TileTitle>{labels.profiles}</TileTitle>
              <SocialPills
                profiles={socialProfiles}
                showUsername
                excludeHeroPlatforms
                className="rounded-xl border border-[#12141a]/10 bg-[#eef0f2] px-3 py-2 text-sm text-[#12141a] transition-colors hover:bg-white"
              />
            </div>
          )}

          {orderedProjects.length > 0 && !resolved.isHidden("projects") && (
            <section
              id="work"
              className={cn(tile, "col-span-1 scroll-mt-24 @md:col-span-3 @lg:col-span-4")}
            >
              <TileTitle>{labels.projects}</TileTitle>
              <CollapsibleList
                initial={3}
                wrapperClassName="grid min-w-0 grid-cols-1 gap-4 @md:grid-cols-2 @lg:grid-cols-3 [&>*]:min-w-0"
                buttonClassName={cn(moreBtn, "col-span-full")}
              >
                {orderedProjects.map((project) => (
                  <article
                    key={project.id}
                    className={cn(
                      PROJECT_CARD,
                      "flex flex-col overflow-hidden rounded-xl border border-[#12141a]/10 bg-[#eef0f2]/70",
                    )}
                  >
                    <TemplateProjectPreview
                      templateId="bento"
                      liveUrl={project.liveUrl ?? null}
                      imageUrl={project.imageUrl ?? null}
                      projectId={project.id}
                      livePreviewProjectIds={livePreviewProjectIds}
                      alt={stripRichTextToPlain(project.title)}
                      loading="lazy"
                      accentColor={primaryColor}
                    />
                    <div className={cn(PROJECT_CARD_BODY, "flex grow flex-col p-4")}>
                      <div className="flex flex-wrap items-baseline gap-2">
                        <h3 className="font-[family-name:var(--font-bento-display)] text-base font-semibold">
                          <RichText text={project.title} />
                        </h3>
                        {project.featured && (
                          <Badge
                            variant="outline"
                            className="h-auto rounded-md border-[var(--lf-accent)]/40 bg-transparent px-1.5 py-0 font-sans text-[11px] font-medium tracking-normal text-[var(--lf-accent)]"
                          >
                            Featured
                          </Badge>
                        )}
                      </div>
                      {project.description && (
                        <DescriptionBlock
                          text={project.description}
                          paragraphClassName="mt-2 text-sm leading-6 text-[#667083]"
                          listClassName="mt-2 flex flex-col gap-1 pl-4 text-sm leading-6 text-[#667083]"
                        />
                      )}
                      <div className="mt-auto border-t border-[#12141a]/8 pt-3">
                        <ProjectActions
                          liveUrl={project.liveUrl}
                          sourceUrl={project.sourceUrl}
                          label={stripRichTextToPlain(project.title)}
                          projectId={project.id}
                          liveClassName="rounded-lg bg-[#12141a] px-3 py-1.5 text-xs font-medium text-white hover:bg-black"
                          sourceClassName="rounded-lg border border-[#12141a]/12 bg-white px-3 py-1.5 text-xs font-medium text-[#667083] hover:text-[#12141a]"
                        />
                      </div>
                    </div>
                  </article>
                ))}
              </CollapsibleList>
            </section>
          )}

          {experiences.length > 0 && !resolved.isHidden("experience") && (
            <section
              id="experience"
              className={cn(tile, "col-span-1 row-span-2 scroll-mt-24 @md:col-span-2 @lg:col-span-2")}
            >
              <TileTitle>{labels.experience}</TileTitle>
              <CollapsibleList
                initial={4}
                wrapperClassName="flex flex-col gap-4"
                buttonClassName={moreBtn}
              >
                {experiences.map((exp) => (
                  <article key={exp.id} className="border-t border-[#12141a]/10 pt-4 first:border-t-0 first:pt-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-[family-name:var(--font-bento-display)] font-semibold">
                        <RichText text={exp.role} />
                      </h3>
                      {(exp.startDate || exp.endDate) && (
                        <span className="text-xs tabular-nums text-[#667083]">
                          {formatDateRange(exp.startDate, exp.endDate)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-[var(--lf-accent)]">
                      <RichText text={exp.company} />
                      {exp.location ? (
                        <span className="text-[#667083]">
                          {" · "}
                          {stripRichTextToPlain(exp.location)}
                        </span>
                      ) : null}
                    </p>
                    {exp.description && (
                      <DescriptionBlock
                        text={exp.description}
                        paragraphClassName="mt-2 text-sm leading-6 text-[#667083]"
                        listClassName="mt-2 flex flex-col gap-1 pl-4 text-sm leading-6 text-[#667083]"
                      />
                    )}
                  </article>
                ))}
              </CollapsibleList>
            </section>
          )}

          {skills.length > 0 && !resolved.isHidden("skills") && (
            <section
              className={cn(
                "col-span-1 overflow-hidden rounded-2xl p-6 text-white @md:col-span-1 @lg:col-span-2 @md:p-7",
              )}
              style={{ background: "var(--lf-accent)" }}
            >
              <h2 className="mb-5 font-[family-name:var(--font-bento-display)] text-lg font-semibold tracking-tight @md:text-xl">
                {labels.skills}
              </h2>
              <div className="flex flex-col gap-5">
                {Object.entries(groupedSkills).map(([category, names]) => (
                  <div key={category}>
                    <h3 className="mb-2 text-sm text-white/75">{category}</h3>
                    <div className="flex flex-wrap gap-2">
                      {names.map((name) => (
                        <TechChip
                          key={name}
                          name={name}
                          className="rounded-lg border border-white/15 bg-white/15 px-2.5 py-1 text-sm text-white"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {educations.length > 0 && !resolved.isHidden("education") && (
            <section className={cn(tile, "col-span-1 @md:col-span-2 @lg:col-span-2")}>
              <TileTitle>{labels.education}</TileTitle>
              <CollapsibleList
                initial={4}
                wrapperClassName="flex flex-col gap-4"
                buttonClassName={moreBtn}
              >
                {educations.map((edu) => (
                  <article key={edu.id} className="border-t border-[#12141a]/10 pt-4 first:border-t-0 first:pt-0">
                    <h3 className="font-[family-name:var(--font-bento-display)] font-semibold">
                      <RichText text={edu.degree} />
                      {edu.field && (
                        <span className="font-normal text-[#667083]">
                          {" "}
                          in <RichText text={edu.field} />
                        </span>
                      )}
                    </h3>
                    <p className="mt-1 text-sm text-[#667083]">
                      <RichText text={edu.institution} />
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#667083]">
                      {(edu.startDate || edu.endDate) && (
                        <span className="tabular-nums">
                          {formatDateRange(edu.startDate, edu.endDate)}
                        </span>
                      )}
                      {edu.gpa && <span>{edu.gpa}</span>}
                    </div>
                  </article>
                ))}
              </CollapsibleList>
            </section>
          )}

          {articles.length > 0 && !resolved.isHidden("articles") && (
            <section
              id="writing"
              className={cn(tile, "col-span-1 scroll-mt-24 @md:col-span-1 @lg:col-span-2")}
            >
              <TileTitle>{labels.articles}</TileTitle>
              <CollapsibleList
                initial={4}
                wrapperClassName="flex flex-col gap-3"
                buttonClassName={moreBtn}
              >
                {articles.map((article) => (
                  <article key={article.id} className="border-t border-[#12141a]/10 pt-3 first:border-t-0 first:pt-0">
                    <ArticleSourceLabel source={article.source} className="mb-1 text-[#667083]" />
                    <h3 className="font-[family-name:var(--font-bento-display)] font-semibold">
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
                    <p className="mt-1 text-xs tabular-nums text-[#667083]">
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
                  </article>
                ))}
              </CollapsibleList>
            </section>
          )}

          {contributionCalendar && !resolved.isHidden("github") && (
            <section className={cn(tileDark, "col-span-1 @md:col-span-3 @lg:col-span-4")}>
              <TileTitle dark>{labels.github}</TileTitle>
              <div className="overflow-x-auto pb-2">
                <GitHubContributionHeatmap
                  calendar={contributionCalendar}
                  profileUrl={githubProfile?.url}
                  username={githubProfile?.username}
                  variant="minimal"
                  label={labels.github}
                />
              </div>
            </section>
          )}

          {certifications.length > 0 && !resolved.isHidden("certifications") && (
            <section className={cn(tile, "col-span-full")}>
              <TileTitle>{labels.certifications}</TileTitle>
              <CollapsibleList
                initial={4}
                wrapperClassName="flex flex-col gap-3"
                buttonClassName={moreBtn}
              >
                {certifications.map((cert) => (
                  <article
                    key={cert.id}
                    className="flex flex-wrap items-baseline justify-between gap-2 border-t border-[#12141a]/10 pt-3 first:border-t-0 first:pt-0"
                  >
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold">
                        {cert.url ? (
                          <a href={cert.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {cert.name}
                          </a>
                        ) : (
                          cert.name
                        )}
                      </h3>
                      <p className="mt-0.5 text-xs text-[#667083]">{cert.issuer}</p>
                    </div>
                    {cert.issueDate && (
                      <span className="text-xs tabular-nums text-[#667083]">
                        {new Date(cert.issueDate).getFullYear()}
                      </span>
                    )}
                  </article>
                ))}
              </CollapsibleList>
            </section>
          )}

          {achievements.length > 0 && !resolved.isHidden("achievements") && (
            <section className={cn(tile, "col-span-full")}>
              <TileTitle>{labels.achievements}</TileTitle>
              <CollapsibleList
                initial={4}
                wrapperClassName="flex flex-col gap-3"
                buttonClassName={moreBtn}
              >
                {achievements.map((ach) => (
                  <article
                    key={ach.id}
                    className="flex items-start gap-3 border-t border-[#12141a]/10 pt-3 first:border-t-0 first:pt-0"
                  >
                    <Trophy className="mt-0.5 size-4 shrink-0 text-[var(--lf-accent)]" aria-hidden />
                    <div>
                      <p className="text-sm font-medium">
                        <RichText text={ach.title} />
                      </p>
                      {ach.date && (
                        <p className="mt-0.5 text-xs text-[#667083]">
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
          )}

          {customSections.map((cs) => (
            <section key={cs.id} className={cn(tile, "col-span-1 @md:col-span-2 @lg:col-span-2")}>
              <TileTitle>{cs.label}</TileTitle>
              <CustomSectionItems
                items={cs.items}
                titleClassName="font-semibold text-[#12141a]"
                textClassName="text-sm text-[#667083]"
                chipClassName="rounded-lg bg-[#eef0f2] px-2.5 py-1 text-xs text-[#667083]"
                buttonClassName={moreBtn}
              />
            </section>
          ))}

          {data.linkedin && !resolved.isHidden("linkedin") && (
            <div className={cn(tile, "col-span-1 @md:col-span-3 @lg:col-span-4")}>
              <LinkedInSection
                data={data.linkedin}
                heading={<TileTitle>{labels.linkedin}</TileTitle>}
                classes={{
                  aboutList: "list-disc flex flex-col gap-2 pl-5 text-sm leading-relaxed text-[#667083]",
                  aboutParagraph: "text-sm leading-relaxed text-[#667083]",
                  postList: "list-disc flex flex-col gap-2 pl-5 text-sm font-semibold text-[#12141a]",
                  postParagraph: "text-sm font-semibold text-[#12141a]",
                  descriptionParagraph: "text-sm leading-relaxed text-[#667083]",
                  descriptionList: "flex flex-col gap-1 pl-4 text-sm leading-relaxed text-[#667083]",
                  section: "scroll-mt-24",
                  card: "rounded-xl border border-[#12141a]/10 bg-[#eef0f2] p-5",
                  title: "font-[family-name:var(--font-bento-display)] font-semibold text-[#12141a]",
                  text: "text-sm leading-relaxed text-[#667083]",
                  muted: "text-xs text-[#667083]",
                  chip: "rounded-lg bg-white px-2.5 py-1 text-xs text-[#667083]",
                  link: "text-sm font-medium text-[var(--lf-accent)] hover:underline",
                }}
              />
            </div>
          )}

          {hasProfiles && !resolved.isHidden("profiles") && (
            <section
              id="profiles"
              className={cn(tile, "col-span-1 scroll-mt-24 @md:col-span-3 @lg:col-span-4")}
            >
              <TileTitle>{labels.profiles}</TileTitle>
              <ProfileLinksSection
                portfolio={portfolio}
                profiles={socialProfiles}
                chipClassName="rounded-xl border border-[#12141a]/10 bg-[#eef0f2] px-3 py-2 text-sm text-[#667083]"
                pillClassName="rounded-xl border border-[#12141a]/10 bg-[#eef0f2] px-3 py-2 text-sm text-[#12141a] transition-colors hover:bg-white"
                titleClassName="font-semibold text-[#12141a]"
                textClassName="text-sm text-[#667083]"
              />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
