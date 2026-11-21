import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TemplateProjectPreview } from "@/components/template-project-preview";
import { LinkedInSection } from "@/features/templates/components/linkedin-section";
import {
  developerPlexMono as plexMono,
  developerPlexSans as plexSans,
} from "@/features/templates/fonts/ibm-plex";
import {
  GitHubContributionHeatmap,
  parseContributionCalendar,
} from "@/features/templates/github-contribution-heatmap";
import { getTemplateSectionLayout } from "@/features/templates/section-layouts";
import {
  renderSections,
  resolveSectionLayout,
  type ReorderableSectionKey,
} from "@/features/templates/section-order";
import { getCustomSectionLabel, type SectionKey } from "@/features/templates/section-labels";
import { resolveAccentColor } from "@/features/templates/template-accent-palettes";
import type { PortfolioData } from "@/features/templates/types";
import {
  formatDateRange,
  getPlatformIcon,
  groupSkillsByCategory,
} from "@/features/templates/utils";
import { cn } from "@/lib/utils";
import { stripRichTextToPlain } from "@/lib/rich-text";
import { Trophy } from "lucide-react";
import {
  RichText,
  buildTemplateSections,
  ContactChips,
  CustomSectionItems,
  DescriptionBlock,
  HeroProfileButtons,
  ProjectActions,
  SocialPills,
  TechChip,
  TEMPLATE_CONTAINER,
  TemplateNavbar,
  hasNonHeroSocialProfiles,
  visibleSocialProfiles,
} from "@/features/templates/shared";
import { CollapsibleList } from "@/features/templates/collapsible-list";
import styles from "./developer-template.module.css";

/**
 * Developer — phosphor terminal
 * Color: #0b0d0c console glass, #d7e0c8 warm phosphor, #7f8a78 muted output.
 * Type: IBM Plex Mono for shell chrome, IBM Plex Sans for readable prose.
 * Layout: restrained terminal frame, one lead project, log-like career history.
 */

const shellText = "text-[#d7e0c8]";
const shellMuted = "text-[#7f8a78]";
const shellFaint = "text-[#5f6a5a]";
const shellLine = "border-[#d7e0c8]/12";
const shellPanel = "border-[#d7e0c8]/10 bg-[#101410]/72";
const bodyCopy = "font-[family-name:var(--font-developer-sans)] text-[#aeb9a4]";
const mono = "font-[family-name:var(--font-developer-mono)]";
const chipClass =
  "rounded-none border border-[#d7e0c8]/12 bg-[#d7e0c8]/[0.025] px-2 py-0.5 font-[family-name:var(--font-developer-mono)] text-xs text-[#9faa96]";
const moreButtonClass =
  "mt-5 self-start rounded-none border border-[#d7e0c8]/14 bg-transparent px-3 py-1.5 font-[family-name:var(--font-developer-mono)] text-xs text-[#7f8a78] transition-colors hover:border-[var(--lf-accent)]/40 hover:text-[#d7e0c8]";

export default function DeveloperTemplate({ data }: { data: PortfolioData }) {
  const {
    portfolio,
    experiences,
    educations,
    skills,
    projects,
    socialProfiles,
    certifications,
    achievements,
    customSections,
    livePreviewProjectIds,
  } = data;

  // Terminal headings are shell commands; a renamed section shows as a comment.
  const customTitle = (key: SectionKey) => {
    const title = getCustomSectionLabel(portfolio.customization, key);
    return title ? <span className={cn("ml-2", shellFaint)}># {title}</span> : null;
  };

  const skillsByCategory = groupSkillsByCategory(skills);
  const primaryColor = resolveAccentColor("developer", portfolio.customization);
  const githubProfile = socialProfiles.find(
    (profile) => profile.platform.toLowerCase() === "github",
  );
  const leetcodeProfile = socialProfiles.find(
    (profile) => profile.platform.toLowerCase() === "leetcode",
  );
  const githubStats = githubProfile?.cachedStats as Record<string, unknown> | null;
  const leetcodeStats = leetcodeProfile?.cachedStats as Record<string, unknown> | null;
  const contributionCalendar = parseContributionCalendar(
    githubStats?.contributionCalendar,
  );
  const featuredProjects = projects.filter((project) => project.featured);
  const orderedProjects =
    featuredProjects.length > 0
      ? [...featuredProjects, ...projects.filter((project) => !project.featured)]
      : projects;
  const { hasProfiles, navbarEnabled, sections } = buildTemplateSections(data);
  const extraSocials = visibleSocialProfiles(socialProfiles, {
    excludeHeroPlatforms: true,
  });
  const resolved = resolveSectionLayout(
    getTemplateSectionLayout("developer"),
    portfolio.customization,
  );

  const linkedinSection = data.linkedin ? (
    <LinkedInSection
      data={data.linkedin}
      heading={<ShellPrompt command="cat linkedin.json">{customTitle("linkedin")}</ShellPrompt>}
      classes={{
        aboutList: cn(
          "flex flex-col gap-2 pl-5 leading-7 marker:text-[var(--lf-accent)]/70",
          bodyCopy,
        ),
        aboutParagraph: cn("leading-7", bodyCopy),
        postList: cn("list-disc flex flex-col gap-2 pl-5 text-sm leading-6 marker:text-[var(--lf-accent)]/70", bodyCopy),
        postParagraph: cn("text-sm leading-6", bodyCopy),
        descriptionParagraph: cn("text-sm leading-6", bodyCopy),
        descriptionList: cn("flex flex-col gap-2 pl-5 text-sm leading-6 marker:text-[var(--lf-accent)]/70", bodyCopy),
        card: cn("rounded-none border p-5", shellPanel),
        title: cn("text-lg font-semibold", shellText),
        text: cn("text-sm leading-6", bodyCopy),
        muted: cn("text-xs", shellFaint),
        chip: chipClass,
        link: "text-sm text-[var(--lf-accent)] underline-offset-4 hover:underline",
        section: "scroll-mt-28",
      }}
    />
  ) : null;

  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: portfolio.summary ? (
      <SectionFrame key="about" id="about" command="cat summary.md" title={customTitle("about")}>
        <div className={cn("overflow-hidden rounded-sm border", shellPanel)}>
          <TerminalChrome title="summary.md" />
          <div className="grid min-w-0 grid-cols-1 @md:grid-cols-[3.5rem_minmax(0,1fr)]">
            <div className={cn("hidden select-none border-r px-4 py-5 text-right text-sm leading-7 @md:block", shellLine, shellFaint)}>
              {lineNumbers(portfolio.summary).map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
            <div className="min-w-0 p-5 @md:p-6">
              <DescriptionBlock
                text={portfolio.summary}
                paragraphClassName={cn("whitespace-pre-line text-base leading-8 @md:text-lg", bodyCopy)}
                listClassName={cn("flex flex-col gap-2 pl-5 text-base leading-8 @md:text-lg", bodyCopy, "marker:text-[var(--lf-accent)]/70")}
              />
            </div>
          </div>
        </div>
      </SectionFrame>
    ) : null,

    github: githubStats || leetcodeStats || contributionCalendar ? (
      <SectionFrame key="github" command="neofetch --stats" title={customTitle("github")}>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-[#d7e0c8]/10 bg-[#d7e0c8]/10 @md:grid-cols-4">
          {githubStats?.public_repos != null && (
            <StatBlock label="repos" value={String(githubStats.public_repos)} />
          )}
          {githubStats?.followers != null && (
            <StatBlock label="followers" value={String(githubStats.followers)} />
          )}
          {githubStats?.following != null && (
            <StatBlock label="following" value={String(githubStats.following)} />
          )}
          {githubStats?.stars != null && (
            <StatBlock label="stars" value={String(githubStats.stars)} />
          )}
          {leetcodeStats?.solved != null && (
            <StatBlock label="LC solved" value={String(leetcodeStats.solved)} />
          )}
          {leetcodeStats?.ranking != null && (
            <StatBlock label="LC rank" value={String(leetcodeStats.ranking)} />
          )}
          {leetcodeStats?.acceptanceRate != null && (
            <StatBlock label="acceptance" value={`${leetcodeStats.acceptanceRate}%`} />
          )}
        </div>
        {contributionCalendar ? (
          <GitHubContributionHeatmap
            calendar={contributionCalendar}
            profileUrl={githubProfile?.url}
            username={githubProfile?.username}
            variant="developer"
            label="guest@portfolio:~$ gh activity --year"
          />
        ) : null}
      </SectionFrame>
    ) : null,

    experience: experiences.length > 0 ? (
      <SectionFrame key="experience" id="experience" command="tail -f career.log" title={customTitle("experience")}>
        <CollapsibleList initial={5} wrapperClassName="flex flex-col" buttonClassName={moreButtonClass}>
          {experiences.map((exp) => (
            <article
              key={exp.id}
              className={cn(
                "grid min-w-0 grid-cols-1 gap-3 border-t py-6 first:border-t-0 first:pt-0 @md:grid-cols-[15rem_minmax(0,1fr)] @md:gap-8",
                shellLine,
              )}
            >
              <p className={cn("text-sm tabular-nums", mono, shellFaint)}>
                {formatDateRange(exp.startDate, exp.endDate) || "present"} | role @ company
              </p>
              <div className="min-w-0">
                <h3 className={cn("text-xl font-semibold leading-snug", shellText)}>
                  <RichText text={exp.role} />
                  <span className={shellMuted}> @ </span>
                  <RichText text={exp.company} />
                </h3>
                {exp.location ? (
                  <p className={cn("mt-1 text-sm", mono, shellFaint)}>
                    host: <RichText text={exp.location} />
                  </p>
                ) : null}
                {exp.description ? (
                  <DescriptionBlock
                    text={exp.description}
                    paragraphClassName={cn("mt-4 text-sm leading-7", bodyCopy)}
                    listClassName={cn("mt-4 flex flex-col gap-2 pl-5 text-sm leading-7", bodyCopy, "marker:text-[var(--lf-accent)]/70")}
                  />
                ) : null}
              </div>
            </article>
          ))}
        </CollapsibleList>
      </SectionFrame>
    ) : null,

    skills: skills.length > 0 ? (
      <SectionFrame key="skills" command="cat package.json | jq '.dependencies'" title={customTitle("skills")}>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-sm border border-[#d7e0c8]/10 bg-[#d7e0c8]/10 @md:grid-cols-2 @lg:grid-cols-3">
          {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
            <div key={category} className="min-w-0 bg-[#0d110e] p-5">
              <p className={cn("mb-4 text-sm", mono, shellFaint)}>
                <span className="text-[var(--lf-accent)]">~/</span>
                {category}
              </p>
              <div className="flex flex-wrap gap-2">
                {categorySkills.map((skill) => (
                  <TechChip
                    key={skill}
                    name={skill}
                    className={cn(chipClass, "inline-flex items-center gap-1.5")}
                    iconClassName="size-3.5"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionFrame>
    ) : null,

    projects: orderedProjects.length > 0 ? (
      <SectionFrame key="projects" id="work" command="ls -la ~/projects" title={customTitle("projects")}>
        <CollapsibleList
          initial={4}
          wrapperClassName="grid grid-cols-1 gap-5 @lg:grid-cols-2"
          showLabel="cat ./more ({n})"
          hideLabel="collapse"
          buttonClassName={moreButtonClass}
        >
          {orderedProjects.map((project) => (
            <article key={project.id} className={cn("min-w-0 overflow-hidden rounded-sm border", shellPanel)}>
              <TerminalChrome title={`./${stripRichTextToPlain(project.title)}`} />
              <TemplateProjectPreview
                templateId="developer"
                liveUrl={project.liveUrl ?? null}
                imageUrl={project.imageUrl ?? null}
                projectId={project.id}
                livePreviewProjectIds={livePreviewProjectIds}
                alt={stripRichTextToPlain(project.title)}
                loading="lazy"
                accentColor={primaryColor}
                containerClassName="border-b border-[#d7e0c8]/10 bg-[#090b09]"
              />
              <div className="p-5">
                <div className="flex min-w-0 flex-col gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className={cn("min-w-0 text-xl font-semibold tracking-[-0.02em]", shellText)}>
                        <RichText text={project.title} />
                      </h3>
                      {project.featured ? (
                        <Badge
                          variant="outline"
                          className="h-auto rounded-none border-[var(--lf-accent)]/45 bg-transparent px-2 py-0.5 font-[family-name:var(--font-developer-mono)] text-xs font-medium tracking-normal text-[var(--lf-accent)]"
                        >
                          featured
                        </Badge>
                      ) : null}
                    </div>
                    {project.language ? (
                      <p className={cn("mt-2 text-sm", mono, shellFaint)}>
                        runtime: <span className={shellMuted}>{project.language}</span>
                      </p>
                    ) : null}
                  </div>
                  {project.description ? (
                    <DescriptionBlock
                      text={project.description}
                      paragraphClassName={cn("text-sm leading-6", bodyCopy)}
                      listClassName={cn("flex flex-col gap-1.5 pl-5 text-sm leading-6", bodyCopy, "marker:text-[var(--lf-accent)]/70")}
                    />
                  ) : null}
                  {(project.techStack.length > 0 ||
                    (project.githubStars != null && project.githubStars > 0) ||
                    (project.githubForks != null && project.githubForks > 0)) && (
                    <div className="flex flex-wrap items-center gap-2">
                      {project.techStack.slice(0, 6).map((tech) => (
                        <TechChip key={tech} name={tech} className={chipClass} />
                      ))}
                      {project.githubStars != null && project.githubStars > 0 ? (
                        <Badge variant="outline" className={cn("h-auto rounded-none px-2 py-0.5 tracking-normal", chipClass)}>
                          {project.githubStars} stars
                        </Badge>
                      ) : null}
                      {project.githubForks != null && project.githubForks > 0 ? (
                        <Badge variant="outline" className={cn("h-auto rounded-none px-2 py-0.5 tracking-normal", chipClass)}>
                          {project.githubForks} forks
                        </Badge>
                      ) : null}
                    </div>
                  )}
                  <ProjectActions
                    liveUrl={project.liveUrl}
                    sourceUrl={project.sourceUrl}
                    label={stripRichTextToPlain(project.title)}
                    projectId={project.id}
                    liveClassName="rounded-none bg-[var(--lf-accent)] px-3 py-1.5 font-[family-name:var(--font-developer-mono)] text-xs text-[#0b0d0c] hover:bg-[var(--lf-accent)]/85"
                    sourceClassName="rounded-none border border-[#d7e0c8]/16 bg-transparent px-3 py-1.5 font-[family-name:var(--font-developer-mono)] text-xs text-[#d7e0c8] hover:bg-[#d7e0c8]/5"
                  />
                </div>
              </div>
            </article>
          ))}
        </CollapsibleList>
      </SectionFrame>
    ) : null,

    profiles: hasProfiles ? (
      <SectionFrame key="profiles" id="profiles" command="cat profiles.json" title={customTitle("profiles")}>
        <div className={cn("rounded-sm border p-5", shellPanel)}>
          <p className={cn("text-sm", mono, shellText)}>connect</p>
          <p className={cn("mt-2 max-w-[36rem] text-sm leading-6", bodyCopy)}>
            Open the profiles below to verify identity, code, and contact details.
          </p>
          <div className="mt-5 flex flex-col gap-4">
            <ContactChips portfolio={portfolio} chipClassName={chipClass} />
            {extraSocials.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {extraSocials.map((profile) => (
                  <a
                    key={`${profile.platform}-${profile.url}`}
                    href={profile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(chipClass, "transition-colors hover:border-[var(--lf-accent)]/35 hover:text-[#d7e0c8]")}
                  >
                    {getPlatformIcon(profile.platform)}
                    {profile.username ? <span className={shellFaint}> / {profile.username}</span> : null}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </SectionFrame>
    ) : null,

    education: educations.length > 0 ? (
      <SectionFrame key="education" command="cat education.log" title={customTitle("education")}>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreButtonClass}>
          {educations.map((edu) => (
            <article
              key={edu.id}
              className={cn("grid grid-cols-1 gap-3 border-t py-5 first:border-t-0 first:pt-0 @md:grid-cols-[12rem_minmax(0,1fr)]", shellLine)}
            >
              <p className={cn("text-sm tabular-nums", mono, shellFaint)}>
                {formatDateRange(edu.startDate, edu.endDate) || "archived"}
              </p>
              <div className="min-w-0">
                <h3 className={cn("text-base font-semibold", shellText)}>
                  <RichText text={edu.degree} />
                  {edu.field ? (
                    <span className={shellMuted}>
                      {" "}
                      in <RichText text={edu.field} />
                    </span>
                  ) : null}
                </h3>
                <p className={cn("mt-1 text-sm", bodyCopy)}>
                  <RichText text={edu.institution} />
                  {edu.gpa ? <span className={shellFaint}> / {edu.gpa}</span> : null}
                </p>
              </div>
            </article>
          ))}
        </CollapsibleList>
      </SectionFrame>
    ) : null,

    certifications: certifications.length > 0 ? (
      <SectionFrame key="certifications" command="ls ~/certifications" title={customTitle("certifications")}>
        <CollapsibleList initial={6} wrapperClassName="grid grid-cols-1 gap-px overflow-hidden rounded-sm border border-[#d7e0c8]/10 bg-[#d7e0c8]/10 @md:grid-cols-2" buttonClassName={moreButtonClass}>
          {certifications.map((cert) => (
            <article key={cert.id} className="min-w-0 bg-[#0d110e] p-5">
              <h3 className={cn("text-sm font-semibold", shellText)}>
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
              <p className={cn("mt-1 text-xs", mono, shellFaint)}>
                {cert.issuer}
                {cert.issueDate ? ` | ${formatDateRange(cert.issueDate, null).split(" - ")[0]}` : null}
              </p>
            </article>
          ))}
        </CollapsibleList>
      </SectionFrame>
    ) : null,

    achievements: achievements.length > 0 ? (
      <SectionFrame key="achievements" command="cat ~/achievements.txt" title={customTitle("achievements")}>
        <CollapsibleList initial={5} wrapperClassName="flex flex-col" buttonClassName={moreButtonClass}>
          {achievements.map((ach) => (
            <article
              key={ach.id}
              className={cn("flex items-start gap-3 border-t py-4 first:border-t-0 first:pt-0", shellLine)}
            >
              <Trophy className="mt-0.5 size-4 shrink-0 text-[var(--lf-accent)]" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm leading-6", bodyCopy)}>
                  <RichText text={ach.title} />
                </p>
                {ach.date ? (
                  <p className={cn("mt-1 text-xs", mono, shellFaint)}>
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
      </SectionFrame>
    ) : null,
  };

  return (
    <div
      className={cn(
        TEMPLATE_CONTAINER,
        styles.root,
        plexMono.variable,
        plexSans.variable,
        "relative min-h-screen overflow-hidden bg-[#0b0d0c] font-[family-name:var(--font-developer-mono)] text-[#d7e0c8] antialiased selection:bg-[var(--lf-accent)]/25",
      )}
      style={{ ["--lf-accent" as string]: primaryColor }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(215,224,200,0.045),transparent_34rem)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(215,224,200,0.2)_1px,transparent_1px)] [background-size:100%_3px]" />

      <div className="relative mx-auto max-w-6xl px-4 py-5 sm:px-6 md:px-8 md:py-8">
        <div className={cn("overflow-hidden rounded-sm border shadow-[0_24px_80px_rgba(0,0,0,0.35)]", shellPanel)}>
          <TerminalChrome title="~/portfolio" />
          <header className="min-w-0 px-5 py-10 @md:px-8 @md:py-14">
            <ShellPrompt command="whoami" />
            <div className="mt-5 grid min-w-0 grid-cols-1 gap-8 @lg:grid-cols-[minmax(0,1fr)_18rem]">
              <div className="min-w-0">
                <h1 className="min-w-0 text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.04em] [overflow-wrap:anywhere] @md:text-6xl @lg:text-7xl">
                  <RichText text={portfolio.title} />
                </h1>
                {portfolio.headline ? (
                  <p className={cn("mt-5 max-w-[42rem] text-lg leading-8 @md:text-xl", bodyCopy)}>
                    <span className={cn(mono, shellFaint)}># </span>
                    <RichText text={portfolio.headline} />
                  </p>
                ) : null}
              </div>
              <aside className="min-w-0">
                <div className={cn("rounded-sm border p-4", "border-[#d7e0c8]/10 bg-[#080a08]/45")}>
                  <p className={cn("text-xs", mono, shellFaint)}>identity</p>
                  <div className="mt-3 flex flex-col gap-2 text-sm">
                    {portfolio.location ? (
                      <p className={bodyCopy}>
                        <span className={cn(mono, shellFaint)}>loc:</span> {portfolio.location}
                      </p>
                    ) : null}
                    {portfolio.contactEmail ? (
                      <a
                        href={`mailto:${portfolio.contactEmail}`}
                        className={cn(bodyCopy, "underline-offset-4 hover:text-[#d7e0c8] hover:underline")}
                      >
                        <span className={cn(mono, shellFaint)}>mail:</span> {portfolio.contactEmail}
                      </a>
                    ) : null}
                    {portfolio.websiteUrl ? (
                      <a
                        href={portfolio.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(bodyCopy, "underline-offset-4 hover:text-[#d7e0c8] hover:underline")}
                      >
                        <span className={cn(mono, shellFaint)}>web:</span>{" "}
                        {portfolio.websiteUrl.replace(/^https?:\/\//, "")}
                      </a>
                    ) : null}
                  </div>
                  <div className="mt-5 flex flex-col gap-3">
                    <HeroProfileButtons
                      profiles={socialProfiles}
                      className={cn(chipClass, "transition-colors hover:border-[var(--lf-accent)]/35 hover:text-[#d7e0c8]")}
                    />
                    {hasNonHeroSocialProfiles(socialProfiles) ? (
                      <SocialPills
                        profiles={socialProfiles}
                        showUsername
                        excludeHeroPlatforms
                        className={cn(chipClass, "transition-colors hover:border-[var(--lf-accent)]/35 hover:text-[#d7e0c8]")}
                      />
                    ) : null}
                  </div>
                </div>
              </aside>
            </div>
            <div className="mt-8 flex items-center gap-2">
              <span className="text-[var(--lf-accent)]">guest@portfolio:~$</span>
              <span className="h-5 w-2 animate-pulse bg-[var(--lf-accent)]" />
            </div>
          </header>

          {navbarEnabled ? (
            <div className={cn("border-t px-3 py-3 @md:px-5", shellLine)}>
              <TemplateNavbar
                items={sections}
                className={cn("rounded-none border-0 bg-transparent backdrop-blur-none", mono)}
                linkClassName={cn(
                  "rounded-none px-2.5 py-1.5 text-sm text-[#7f8a78] transition-colors hover:bg-[#d7e0c8]/5 hover:text-[#d7e0c8]",
                )}
              />
            </div>
          ) : null}
        </div>

        <main className="mt-8 flex min-w-0 flex-col gap-8 @md:mt-10 @md:gap-10">
          {renderSections(resolved, "full", { ...blocks, linkedin: linkedinSection })}

          {customSections.map((cs) => (
            <SectionFrame
              key={cs.id}
              command={`cat ~/${cs.sectionType}.txt`}
              title={<span className={cn("ml-2", shellFaint)}># {cs.label}</span>}
            >
              <div className={cn("rounded-sm border p-5", shellPanel)}>
                <CustomSectionItems
                  items={cs.items}
                  titleClassName={cn("font-semibold", shellText)}
                  textClassName={cn("text-sm leading-6", bodyCopy)}
                  chipClassName={chipClass}
                  buttonClassName={moreButtonClass}
                />
              </div>
            </SectionFrame>
          ))}
        </main>

        <footer className={cn("mt-10 border-t py-8", shellLine)}>
          <ShellPrompt command="cat .social-links" />
          <div className="mt-5 flex flex-col gap-2">
            {extraSocials.map((profile) => (
              <FooterCommand key={`${profile.platform}-${profile.url}`} command="open">
                <a
                  href={profile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-4 hover:text-[#d7e0c8] hover:underline"
                >
                  {getPlatformIcon(profile.platform)}
                  {profile.username ? <span className={shellFaint}> / {profile.username}</span> : null}
                </a>
              </FooterCommand>
            ))}
            {portfolio.websiteUrl ? (
              <FooterCommand command="open">
                <a
                  href={portfolio.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-4 hover:text-[#d7e0c8] hover:underline"
                >
                  {portfolio.websiteUrl}
                </a>
              </FooterCommand>
            ) : null}
            {portfolio.phone ? (
              <FooterCommand command="call">
                <a href={`tel:${portfolio.phone}`} className="underline-offset-4 hover:text-[#d7e0c8] hover:underline">
                  {portfolio.phone}
                </a>
              </FooterCommand>
            ) : null}
          </div>
        </footer>
      </div>
    </div>
  );
}

function SectionFrame({
  id,
  command,
  title,
  children,
}: {
  id?: string;
  command: string;
  title?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="mb-5 flex flex-col gap-3">
        <ShellPrompt command={command}>{title}</ShellPrompt>
        <Separator className="bg-[#d7e0c8]/10" />
      </div>
      {children}
    </section>
  );
}

function ShellPrompt({
  command,
  children,
}: {
  command: string;
  children?: React.ReactNode;
}) {
  return (
    <p className={cn("text-sm", mono, shellMuted)}>
      <span className="text-[var(--lf-accent)]">guest@portfolio:~$</span>{" "}
      <span>{command}</span>
      {children}
    </p>
  );
}

function TerminalChrome({ title }: { title: string }) {
  return (
    <div className={cn("flex items-center gap-2 border-b px-3 py-2", shellLine, "bg-[#080a08]/75")}>
      <span className="size-2.5 rounded-full border border-[#d7e0c8]/18" />
      <span className="size-2.5 rounded-full border border-[#d7e0c8]/18" />
      <span className="size-2.5 rounded-full border border-[var(--lf-accent)]/45 bg-[var(--lf-accent)]/15" />
      <span className={cn("ml-2 truncate text-xs", shellFaint)}>{title}</span>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 bg-[#0d110e] p-4">
      <p className={cn("text-2xl font-semibold tabular-nums", shellText)}>{value}</p>
      <p className={cn("mt-1 text-xs", mono, shellFaint)}>{label}</p>
    </div>
  );
}

function FooterCommand({
  command,
  children,
}: {
  command: string;
  children: React.ReactNode;
}) {
  return (
    <p className={cn("text-sm", bodyCopy)}>
      <span className="text-[var(--lf-accent)]">$</span>{" "}
      <span className={shellFaint}>{command}</span> {children}
    </p>
  );
}

function lineNumbers(text: string) {
  const count = Math.max(text.split("\n").length, 3);
  return Array.from({ length: count }, (_, index) => index + 1);
}
