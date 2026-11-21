import { Schibsted_Grotesk } from "next/font/google";
import { MapPin, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PlatformIcon } from "@/components/icons";
import { TemplateProjectPreview } from "@/components/template-project-preview";
import { LinkedInSection } from "@/features/templates/components/linkedin-section";
import {
  resolveAccentColor,
  accentRootStyle,
} from "@/features/templates/template-accent-palettes";
import { stripRichTextToPlain } from "@/lib/rich-text";
import { cn } from "@/lib/utils";
import { CollapsibleList } from "../collapsible-list";
import {
  GitHubContributionHeatmap,
  parseContributionCalendar,
} from "../github-contribution-heatmap";
import { getTemplateSectionLayout } from "../section-layouts";
import {
  renderSections,
  resolveSectionLayout,
  type ReorderableSectionKey,
} from "../section-order";
import {
  ArticleSourceLabel,
  RichText,
  buildTemplateSections,
  CustomSectionItems,
  DescriptionBlock,
  HERO_TITLE_BASE,
  PROJECT_CARD,
  PROJECTS_GRID_2,
  ProfileLinksSection,
  ProjectActions,
  TechChip,
  TEMPLATE_CONTAINER,
  TemplateNavbar,
  getSectionLabels,
  visibleSocialProfiles,
} from "../shared";
import type { PortfolioData } from "../types";
import { formatDateRange, groupSkillsByCategory } from "../utils";

/**
 * Lantern — soft dark personal homepage
 * Reference feel: scenic cover, overlapping portrait, work chips, soft project shelves.
 * Color: #0a0a0a void, #e8e8e8 mist, #a1a1aa mute, #303033 border, olive --lf-accent
 * Type: Schibsted Grotesk
 * Layout: cover hero → work chips → github panel → equal project cards (Livefolio contracts)
 */
const grotesk = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-lantern",
});

const ink = "text-[#e8e8e8]";
const mute = "text-[#a1a1aa]";
const border = "border-[#303033]";
const softCard =
  "rounded-[1.5rem] border border-[#303033] bg-[rgba(16,15,13,0.72)]";
const moreBtn =
  "mx-auto mt-10 block rounded-full border border-[#303033] bg-[#100f0d] px-6 py-2.5 text-sm font-medium text-[#a1a1aa] transition-colors hover:border-[var(--lf-accent)] hover:text-[var(--lf-accent)]";

export function LanternTemplate({ data }: { data: PortfolioData }) {
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
  const primaryColor = resolveAccentColor("lantern", portfolio.customization);
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
    getTemplateSectionLayout("lantern"),
    portfolio.customization,
  );
  const portraitSrc = portfolio.profileImageUrl || portfolio.avatarUrl;
  const socials = visibleSocialProfiles(socialProfiles);

  const linkedinSection = data.linkedin ? (
    <LinkedInSection
      data={data.linkedin}
      heading={<SectionHeading>{labels.linkedin}</SectionHeading>}
      classes={{
        aboutList: cn("flex flex-col gap-3 pl-5 text-base leading-8 marker:text-[var(--lf-accent)]", mute),
        aboutParagraph: cn("text-base leading-8", mute),
        postList: cn("flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed", ink),
        postParagraph: cn("text-sm leading-relaxed", ink),
        descriptionParagraph: cn("text-sm leading-7", mute),
        descriptionList: cn("flex flex-col gap-2 pl-5 text-sm leading-7 marker:text-[var(--lf-accent)]", mute),
        card: cn(softCard, "p-5"),
        title: cn("text-xl font-semibold tracking-[-0.03em]", ink),
        text: cn("text-sm leading-7", mute),
        muted: cn("text-sm", mute),
        chip: "rounded-full border border-[#303033] bg-[#100f0d] px-3 py-1 text-sm text-[#a1a1aa]",
        link: "text-sm font-medium text-[var(--lf-accent)] underline-offset-4 hover:underline",
        section: "scroll-mt-28",
      }}
    />
  ) : null;

  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: portfolio.summary ? (
      <section key="about" id="about" className="scroll-mt-28">
        <SectionHeading>{labels.about}</SectionHeading>
        <div className={cn(softCard, "p-6 @md:p-8")}>
          <DescriptionBlock
            text={portfolio.summary}
            paragraphClassName={cn("max-w-[42rem] text-base leading-8", mute)}
            listClassName={cn(
              "flex max-w-[42rem] flex-col gap-3 pl-5 text-base leading-8 marker:text-[var(--lf-accent)]",
              mute,
            )}
          />
        </div>
      </section>
    ) : null,

    experience: experiences.length > 0 ? (
      <section key="experience" id="experience" className="scroll-mt-28">
        <SectionHeading>{labels.experience}</SectionHeading>
        <CollapsibleList
          initial={6}
          wrapperClassName="grid grid-cols-1 gap-3 @sm:grid-cols-2 @lg:grid-cols-3"
          buttonClassName={moreBtn}
        >
          {experiences.map((exp) => {
            const current = !exp.endDate;
            const company = stripRichTextToPlain(exp.company);
            const initial = company.slice(0, 1).toUpperCase() || "•";
            return (
              <article
                key={exp.id}
                className={cn(
                  softCard,
                  "flex min-w-0 items-start gap-3 p-4 transition-colors hover:border-[color-mix(in_srgb,var(--lf-accent)_40%,#303033)]",
                )}
              >
                <div
                  className="grid size-11 shrink-0 place-items-center rounded-xl border border-[#303033] bg-[#0a0a0a] text-sm font-semibold text-[var(--lf-accent)]"
                  aria-hidden
                >
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={cn("truncate text-[15px] font-semibold tracking-[-0.02em]", ink)}>
                      <RichText text={exp.company} />
                    </h3>
                    {current && (
                      <Badge
                        variant="outline"
                        className="h-auto rounded-full border-emerald-500/35 bg-emerald-500/15 px-2 py-0 text-[10px] font-semibold tracking-normal text-emerald-300"
                      >
                        Now
                      </Badge>
                    )}
                  </div>
                  <p className={cn("mt-0.5 truncate text-sm", mute)}>
                    <RichText text={exp.role} />
                  </p>
                  {exp.description && (
                    <DescriptionBlock
                      text={exp.description}
                      paragraphClassName={cn("mt-3 text-sm leading-6", mute)}
                      listClassName={cn("mt-3 flex flex-col gap-1.5 pl-5 text-sm leading-6", mute)}
                    />
                  )}
                </div>
              </article>
            );
          })}
        </CollapsibleList>
      </section>
    ) : null,

    github: contributionCalendar ? (
      <section key="github" className="scroll-mt-28">
        <div className={cn(softCard, "overflow-x-auto p-5 @md:p-6")}>
          <GitHubContributionHeatmap
            calendar={contributionCalendar}
            profileUrl={githubProfile?.url}
            username={githubProfile?.username}
            variant="minimal"
            label={
              contributionCalendar.totalContributions
                ? `${contributionCalendar.totalContributions} contributions`
                : labels.github
            }
          />
        </div>
      </section>
    ) : null,

    projects: visibleProjects.length > 0 ? (
      <section key="projects" id="work" className="scroll-mt-28 min-w-0">
        <SectionHeading>{labels.projects}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName={PROJECTS_GRID_2}
          buttonClassName={moreBtn}
        >
          {visibleProjects.map((project) => (
            <article key={project.id} className={cn(PROJECT_CARD, softCard, "overflow-hidden")}>
              <div className="overflow-hidden bg-[#100f0d]">
                <TemplateProjectPreview
                  templateId="lantern"
                  liveUrl={project.liveUrl ?? null}
                  imageUrl={project.imageUrl ?? null}
                  projectId={project.id}
                  livePreviewProjectIds={livePreviewProjectIds}
                  alt={stripRichTextToPlain(project.title)}
                  loading="lazy"
                  containerClassName="aspect-[16/10] bg-[#100f0d]"
                  className="h-full w-full object-cover object-top"
                  accentColor={primaryColor}
                />
              </div>
              <div className="flex flex-col gap-3 p-5">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h3 className={cn("text-xl font-semibold tracking-[-0.03em]", ink)}>
                    <RichText text={project.title} />
                  </h3>
                  {project.featured && (
                    <Badge
                      variant="outline"
                      className="h-auto rounded-full border-[var(--lf-accent)]/40 bg-[color-mix(in_srgb,var(--lf-accent)_12%,transparent)] px-2.5 py-0.5 text-[11px] font-medium tracking-normal text-[var(--lf-accent)]"
                    >
                      Featured
                    </Badge>
                  )}
                </div>
                {project.description && (
                  <DescriptionBlock
                    text={project.description}
                    paragraphClassName={cn("text-sm leading-7", mute)}
                    listClassName={cn("flex flex-col gap-1.5 pl-5 text-sm leading-7", mute)}
                  />
                )}
                {project.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {project.techStack.slice(0, 5).map((tech) => (
                      <TechChip
                        key={tech}
                        name={tech}
                        className="rounded-full border border-[#303033] bg-[#0a0a0a] px-2.5 py-0.5 text-[11px] text-[#a1a1aa]"
                      />
                    ))}
                  </div>
                )}
                <div className="mt-1">
                  <ProjectActions
                    liveUrl={project.liveUrl}
                    sourceUrl={project.sourceUrl}
                    label={stripRichTextToPlain(project.title)}
                    projectId={project.id}
                    liveClassName="rounded-full bg-[#e8e8e8] px-4 py-1.5 text-xs font-semibold text-[#0a0a0a] hover:bg-white"
                    sourceClassName="rounded-full border border-[#303033] bg-transparent px-4 py-1.5 text-xs font-semibold text-[#a1a1aa] hover:border-[var(--lf-accent)] hover:text-[var(--lf-accent)]"
                  />
                </div>
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    skills: skills.length > 0 ? (
      <section key="skills" className="scroll-mt-28">
        <SectionHeading>{labels.skills}</SectionHeading>
        <div className="grid gap-3 @md:grid-cols-2">
          {Object.entries(groupedSkills).map(([category, names]) => (
            <div key={category} className={cn(softCard, "p-5")}>
              <h3 className="mb-3 text-sm font-semibold text-[var(--lf-accent)]">{category}</h3>
              <div className="flex flex-wrap gap-2">
                {names.map((name) => (
                  <TechChip
                    key={name}
                    name={name}
                    className="rounded-full border border-[#303033] bg-[#0a0a0a] px-3 py-1 text-xs text-[#a1a1aa]"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    ) : null,

    education: educations.length > 0 ? (
      <section key="education" className="scroll-mt-28">
        <SectionHeading>{labels.education}</SectionHeading>
        <CollapsibleList initial={3} wrapperClassName="flex flex-col gap-3" buttonClassName={moreBtn}>
          {educations.map((edu) => (
            <article key={edu.id} className={cn(softCard, "p-5")}>
              <h3 className={cn("text-lg font-semibold tracking-[-0.03em]", ink)}>
                <RichText text={edu.degree} />
                {edu.field ? (
                  <span className={mute}>
                    {" in "}
                    <RichText text={edu.field} />
                  </span>
                ) : null}
              </h3>
              <p className={cn("mt-1 text-sm", mute)}>
                <RichText text={edu.institution} />
                {formatDateRange(edu.startDate, edu.endDate)
                  ? ` · ${formatDateRange(edu.startDate, edu.endDate)}`
                  : ""}
              </p>
              {edu.gpa ? <p className={cn("mt-2 text-xs", mute)}>{edu.gpa}</p> : null}
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    certifications: certifications.length > 0 ? (
      <section key="certifications" className="scroll-mt-28">
        <SectionHeading>{labels.certifications}</SectionHeading>
        <CollapsibleList initial={3} wrapperClassName="flex flex-col gap-3" buttonClassName={moreBtn}>
          {certifications.map((cert) => (
            <article key={cert.id} className={cn(softCard, "p-5")}>
              <h3 className={cn("text-base font-medium", ink)}>
                {cert.url ? (
                  <a href={cert.url} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
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
                  : ""}
              </p>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    achievements: achievements.length > 0 ? (
      <section key="achievements" className="scroll-mt-28">
        <SectionHeading>{labels.achievements}</SectionHeading>
        <CollapsibleList initial={3} wrapperClassName="flex flex-col gap-3" buttonClassName={moreBtn}>
          {achievements.map((ach) => (
            <article key={ach.id} className={cn(softCard, "flex items-start gap-3 p-5")}>
              <Trophy className="mt-0.5 size-4 shrink-0 text-[var(--lf-accent)]" aria-hidden />
              <div>
                <h3 className={cn("text-base font-medium", ink)}>
                  <RichText text={ach.title} />
                </h3>
                {ach.date ? (
                  <p className={cn("mt-1 text-xs", mute)}>
                    {new Date(ach.date).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    articles: articles.length > 0 ? (
      <section key="articles" id="writing" className="scroll-mt-28">
        <SectionHeading>{labels.articles}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName="grid grid-cols-1 gap-3 @md:grid-cols-2"
          buttonClassName={moreBtn}
        >
          {articles.map((article) => (
            <article key={article.id} className={cn(softCard, "p-5")}>
              <ArticleSourceLabel source={article.source} className={cn("mb-2", mute)} />
              <h3 className={cn("text-lg font-semibold tracking-[-0.03em]", ink)}>
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
              {article.description && (
                <p className={cn("mt-3 text-sm leading-6", mute)}><RichText text={article.description} /></p>
              )}
              <p className={cn("mt-4 text-xs", mute)}>
                {article.publishedAt
                  ? new Date(article.publishedAt).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })
                  : null}
                {article.publishedAt && article.readTime != null ? " · " : null}
                {article.readTime != null ? `${article.readTime} min` : null}
              </p>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    profiles: hasProfiles ? (
      <section key="profiles" id="profiles" className="scroll-mt-28">
        <SectionHeading>{labels.profiles}</SectionHeading>
        <div className={cn(softCard, "p-6")}>
          <ProfileLinksSection
            portfolio={portfolio}
            profiles={socialProfiles}
            chipClassName="rounded-full border border-[#303033] bg-[#100f0d] px-3 py-1.5 text-sm text-[#a1a1aa]"
            pillClassName="rounded-full border border-[#303033] bg-[#100f0d] px-3 py-1.5 text-sm text-[#e8e8e8] transition-colors hover:border-[var(--lf-accent)] hover:text-[var(--lf-accent)]"
            titleClassName={ink}
            textClassName={mute}
          />
        </div>
      </section>
    ) : null,
  };

  return (
    <div
      className={cn(
        TEMPLATE_CONTAINER,
        grotesk.variable,
        "min-h-screen bg-[#0a0a0a] font-[family-name:var(--font-lantern)] antialiased selection:bg-[var(--lf-accent)] selection:text-[#0a0a0a]",
        ink,
      )}
      style={accentRootStyle(primaryColor)}
    >
      <div className="relative mx-auto min-w-0 max-w-6xl overflow-x-clip px-4 pb-24 pt-5 sm:px-6 md:pb-32 md:pt-8">
        {navbarEnabled && (
          <TemplateNavbar
            items={sections}
            className="mb-6 rounded-full border border-[#303033] bg-[#100f0d]/90 px-2 py-1.5 backdrop-blur-md"
            linkClassName="rounded-full px-3 py-2 text-sm text-[#a1a1aa] transition-colors hover:text-white"
          />
        )}

        {/* Cover + identity — matches the reference homepage composition */}
        <header className="relative mb-12">
          <div
            className={cn(
              "relative h-[220px] overflow-hidden rounded-[1.75rem] border sm:h-[260px] @md:h-[300px]",
              border,
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- static template cover art */}
            <img
              src="/templates/lantern/cover.jpg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(10,10,10,0.35)_100%)]"
            />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" />
          </div>

          <div className="relative z-10 -mt-10 flex flex-col gap-5 px-1 sm:-mt-12 sm:flex-row sm:items-end sm:gap-5 sm:px-3">
            {portraitSrc ? (
              // eslint-disable-next-line @next/next/no-img-element -- remote portfolio portrait
              <img
                src={portraitSrc}
                alt=""
                className="size-[88px] shrink-0 rounded-[1.35rem] border-[3px] border-[#0a0a0a] object-cover shadow-[0_16px_40px_-16px_rgba(0,0,0,0.9)] sm:size-[104px]"
              />
            ) : (
              <div
                aria-hidden
                className="grid size-[88px] shrink-0 place-items-center rounded-[1.35rem] border-[3px] border-[#0a0a0a] bg-[#100f0d] text-2xl font-semibold text-[var(--lf-accent)] shadow-[0_16px_40px_-16px_rgba(0,0,0,0.9)] sm:size-[104px]"
              >
                {stripRichTextToPlain(portfolio.title).slice(0, 1) || "•"}
              </div>
            )}

            <div className="min-w-0 flex-1 pb-1">
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
                <h1
                  className={cn(
                    HERO_TITLE_BASE,
                    "text-[1.75rem] font-semibold leading-none tracking-[-0.04em] text-white sm:text-[2rem]",
                  )}
                >
                  <RichText text={portfolio.title} />
                </h1>
                {portfolio.location && (
                  <p className={cn("inline-flex items-center gap-1 text-sm", mute)}>
                    <MapPin className="size-3.5 shrink-0 opacity-80" aria-hidden />
                    <span className="min-w-0 [overflow-wrap:anywhere]">{portfolio.location}</span>
                  </p>
                )}
              </div>
              {portfolio.headline && (
                <p className={cn("mt-2 max-w-[36rem] text-[15px] leading-6", mute)}>
                  <RichText text={portfolio.headline} />
                </p>
              )}
              {socials.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {socials.map((profile) => (
                    <a
                      key={`${profile.platform}-${profile.url}`}
                      href={profile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-lf-track="social"
                      data-lf-label={profile.platform}
                      aria-label={profile.platform}
                      className="grid size-9 place-items-center rounded-xl border border-[#303033] bg-[#100f0d] text-[#e8e8e8] transition-colors hover:border-[var(--lf-accent)] hover:text-[var(--lf-accent)]"
                    >
                      <PlatformIcon platform={profile.platform} className="size-4" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex min-w-0 flex-col gap-12">
          {renderSections(resolved, "full", { ...blocks, linkedin: linkedinSection })}
        </main>

        {customSections.length > 0 && (
          <div className="mt-12 grid gap-8 @md:grid-cols-2">
            {customSections.map((cs) => (
              <section key={cs.id}>
                <SectionHeading>{cs.label}</SectionHeading>
                <div className={cn(softCard, "p-5")}>
                  <CustomSectionItems
                    items={cs.items}
                    titleClassName="font-semibold text-[#e8e8e8]"
                    textClassName={cn("text-sm", mute)}
                    chipClassName="mr-2 mt-2 inline-block rounded-full border border-[#303033] bg-[#100f0d] px-2.5 py-0.5 text-xs text-[#a1a1aa]"
                    buttonClassName={moreBtn}
                  />
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Soft closing band + contact pill */}
        <div className="mt-16 space-y-8">
          <div
            className={cn(
              "relative overflow-hidden rounded-[1.75rem] border px-6 py-16 text-center sm:py-20",
              border,
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- static template meadow art */}
            <img
              src="/templates/lantern/meadow.jpg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-[#0a0a0a]/45"
            />
            <p className="relative text-sm font-medium tracking-[0.18em] text-white sm:text-base">
              Keep building
            </p>
          </div>

          {(portfolio.contactEmail || portfolio.websiteUrl) && (
            <div className="flex justify-center">
              <div className="inline-flex max-w-full flex-col items-center gap-1 rounded-full border border-[#303033] bg-[#100f0d] px-5 py-3 text-center sm:flex-row sm:gap-3">
                {portfolio.contactEmail && (
                  <a
                    href={`mailto:${portfolio.contactEmail}`}
                    className="max-w-full truncate text-sm text-[#e8e8e8] hover:text-[var(--lf-accent)]"
                  >
                    {portfolio.contactEmail}
                  </a>
                )}
                {portfolio.contactEmail && portfolio.websiteUrl && (
                  <span className="hidden text-[#303033] sm:inline" aria-hidden>
                    ·
                  </span>
                )}
                {portfolio.websiteUrl && (
                  <a
                    href={portfolio.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="max-w-full truncate text-sm text-[var(--lf-accent)] hover:underline"
                  >
                    {portfolio.websiteUrl.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-5 text-[1.65rem] font-semibold tracking-[-0.04em] text-white sm:text-3xl">
      {children}
    </h2>
  );
}
