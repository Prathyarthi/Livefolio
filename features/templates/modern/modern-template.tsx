import type { PortfolioData } from "../types";
import { cn } from "@/lib/utils";
import {
  GitHubContributionHeatmap,
  parseContributionCalendar,
} from "../github-contribution-heatmap";
import { Trophy } from "lucide-react";
import {
  buildTemplateSections,
  ContactChips,
  CustomSectionItems,
  DescriptionBlock,
  HeroProfileButtons,
  ProfileLinksSection,
  ProjectActions,
  PROJECT_CARD,
  PROJECT_CARD_ACTIONS,
  PROJECT_CARD_BODY,
  PROJECT_CARD_HEADER,
  PROJECT_CARD_META,
  PROJECT_CARD_TITLE,
  HERO_HEADER_COLUMN,
  HERO_HEADLINE_SCALE,
  HERO_TITLE_BASE,
  HERO_TITLE_SCALE_7XL,
  PROJECTS_GRID_2,
  SocialPills,
  TEMPLATE_CONTAINER,
  TemplateNavbar,
  getSectionLabels,
} from "../shared";
import { CollapsibleList } from "../collapsible-list";
import { formatDateRange, groupSkillsByCategory } from "../utils";
import { getPreviewImage } from "@/lib/link-preview-code";
import { TemplateProjectPreview } from "@/components/template-project-preview";
import { getTemplateSectionLayout } from "../section-layouts";
import {
  renderSections,
  resolveSectionLayout,
  type ReorderableSectionKey,
} from "../section-order";

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
  const labels = getSectionLabels(portfolio.customization);
  const groupedSkills = groupSkillsByCategory(skills);
  const githubProfile = socialProfiles.find(
    (profile) => profile.platform.toLowerCase() === "github"
  );
  const githubStats = githubProfile?.cachedStats as Record<string, unknown> | null;
  const contributionCalendar = parseContributionCalendar(
    githubStats?.contributionCalendar
  );
  const featuredProjects = projects.filter((project) => project.featured);
  const leadProjects =
    featuredProjects.length > 0
      ? [...featuredProjects, ...projects.filter((p) => !p.featured)]
      : projects;
  const { hasProfiles, navbarEnabled, sections } = buildTemplateSections(data);
  const resolved = resolveSectionLayout(
    getTemplateSectionLayout("modern"),
    portfolio.customization,
  );

  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: portfolio.summary ? (
      <section
        key="about"
        id="about"
        className="scroll-mt-24 rounded-[1.85rem] border border-white/10 bg-white/[0.045] p-6 md:p-8"
      >
        <SectionHeading>{labels.about}</SectionHeading>
        <DescriptionBlock
          text={portfolio.summary}
          paragraphClassName="whitespace-pre-line text-base leading-8 text-zinc-300"
          listClassName="space-y-3 pl-5 text-base leading-8 text-zinc-300 marker:text-zinc-600"
        />
      </section>
    ) : null,

    projects: leadProjects.length > 0 ? (
      <section
        key="projects"
        id="work"
        className="scroll-mt-24 min-w-0 rounded-[1.85rem] border border-white/10 bg-white/[0.045] p-6 md:p-8"
      >
        <SectionHeading>{labels.projects}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName={PROJECTS_GRID_2}
          buttonClassName="col-span-full mt-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-300 transition-colors hover:bg-white/[0.08]"
        >
          {leadProjects.map((project) => (
            <article
              key={project.id}
              className={cn(
                PROJECT_CARD,
                "rounded-[1.6rem] border border-white/10 bg-black/20 transition-transform duration-300 hover:-translate-y-1"
              )}
            >
              <TemplateProjectPreview templateId="modern"
                liveUrl={project.liveUrl ?? null}
                projectId={project.id}
                livePreviewProjectIds={livePreviewProjectIds}
                alt={project.title}
                loading="lazy"
              />

              <div className={PROJECT_CARD_BODY}>
                <div className={PROJECT_CARD_HEADER}>
                  <div className="min-w-0 flex-1">
                    <div className={PROJECT_CARD_META}>
                      <h3 className={cn(PROJECT_CARD_TITLE, "text-2xl font-semibold text-white")}>
                        {project.title}
                      </h3>
                      {project.featured && (
                        <span className="rounded-full border border-cyan-300/20 bg-linear-to-r from-violet-500 to-cyan-400 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-white">
                          Featured
                        </span>
                      )}
                    </div>
                    {project.language && (
                      <p className="mt-2 text-xs uppercase tracking-[0.22em] text-zinc-500">
                        {project.language}
                      </p>
                    )}
                  </div>

                  <div className={PROJECT_CARD_ACTIONS}>
                    <ProjectActions
                      liveUrl={project.liveUrl}
                      sourceUrl={project.sourceUrl}
                      label={project.title}
                      projectId={project.id}
                      liveClassName="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900 transition-colors hover:bg-zinc-200"
                      sourceClassName="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:bg-white/[0.08]"
                    />
                  </div>
                </div>

                {project.description && (
                  <DescriptionBlock
                    text={project.description}
                    paragraphClassName="mt-4 text-sm leading-7 text-zinc-300"
                    listClassName="mt-4 space-y-2 pl-5 text-sm leading-7 text-zinc-300 marker:text-zinc-600"
                  />
                )}

                {(project.techStack.length > 0 ||
                  project.githubStars !== null ||
                  project.githubForks !== null) && (
                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      {project.techStack.map((tech) => (
                        <span
                          key={tech}
                          className="rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs text-zinc-400"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.githubStars !== null && (
                        <span className="rounded-full bg-white/4 px-3 py-1 text-xs text-zinc-400">
                          {project.githubStars} stars
                        </span>
                      )}
                      {project.githubForks !== null && (
                        <span className="rounded-full bg-white/4 px-3 py-1 text-xs text-zinc-400">
                          {project.githubForks} forks
                        </span>
                      )}
                    </div>
                  )}
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
        className="scroll-mt-24 rounded-[1.85rem] border border-white/10 bg-white/[0.045] p-6 md:p-8"
      >
        <SectionHeading>{labels.experience}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName="space-y-5"
          buttonClassName="mt-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-300 transition-colors hover:bg-white/[0.08]"
        >
          {experiences.map((exp) => (
            <article
              key={exp.id}
              className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-white">{exp.role}</h3>
                  <p className="mt-1 text-sm text-cyan-300">{exp.company}</p>
                  {exp.location && (
                    <p className="mt-1 text-sm text-zinc-500">{exp.location}</p>
                  )}
                </div>
                {(exp.startDate || exp.endDate) && (
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                    {formatDateRange(exp.startDate, exp.endDate)}
                  </p>
                )}
              </div>
              {exp.description && (
                <DescriptionBlock
                  text={exp.description}
                  paragraphClassName="mt-4 text-sm leading-7 text-zinc-300"
                  listClassName="mt-4 space-y-2 pl-5 text-sm leading-7 text-zinc-300 marker:text-zinc-600"
                />
              )}
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    articles: articles.length > 0 ? (
      <section
        key="articles"
        id="writing"
        className="scroll-mt-24 rounded-[1.85rem] border border-white/10 bg-white/[0.045] p-6 md:p-8"
      >
        <SectionHeading>{labels.articles}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName="space-y-4"
          buttonClassName="mt-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-300 transition-colors hover:bg-white/[0.08]"
        >
          {articles.map((article) => (
            <article
              key={article.id}
              className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5"
            >
              <h3 className="text-lg font-semibold text-white">
                <a
                  href={article.url} data-lf-track="article" data-lf-label={article.title} data-lf-id={article.id}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-cyan-300"
                >
                  {article.title}
                </a>
              </h3>
              {article.description && (
                <p className="mt-2 text-sm leading-7 text-zinc-300">{article.description}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                {article.publishedAt && (
                  <span>
                    {new Date(article.publishedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                )}
                {article.readTime != null && <span>{article.readTime} min read</span>}
              </div>
              {article.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs text-zinc-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    skills: skills.length > 0 ? (
      <section
        key="skills"
        className="rounded-[1.85rem] border border-white/10 bg-white/[0.045] p-6 md:p-8"
      >
        <SectionHeading>{labels.skills}</SectionHeading>
        <div className="space-y-6">
          {Object.entries(groupedSkills).map(([category, names]) => (
            <div key={category}>
              <h3 className="mb-3 text-xs uppercase tracking-[0.22em] text-zinc-500">
                {category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {names.map((name) => (
                  <span
                    key={name}
                    className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-sm text-zinc-300"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    ) : null,

    education: educations.length > 0 ? (
      <section
        key="education"
        className="rounded-[1.85rem] border border-white/10 bg-white/[0.045] p-6 md:p-8"
      >
        <SectionHeading>{labels.education}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName="space-y-4"
          buttonClassName="mt-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-300 transition-colors hover:bg-white/[0.08]"
        >
          {educations.map((edu) => (
            <article
              key={edu.id}
              className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5"
            >
              <h3 className="text-lg font-semibold text-white">
                {edu.degree}
                {edu.field && <span className="text-zinc-400"> in {edu.field}</span>}
              </h3>
              <p className="mt-2 text-sm text-zinc-300">{edu.institution}</p>
              {(edu.startDate || edu.endDate) && (
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-zinc-500">
                  {formatDateRange(edu.startDate, edu.endDate)}
                </p>
              )}
              {edu.gpa && <p className="mt-3 text-xs text-zinc-400">GPA: {edu.gpa}</p>}
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    certifications: certifications.length > 0 ? (
      <section
        key="certifications"
        className="rounded-[1.85rem] border border-white/10 bg-white/[0.045] p-6 md:p-8"
      >
        <SectionHeading>{labels.certifications}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName="space-y-4"
          buttonClassName="mt-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-300 transition-colors hover:bg-white/[0.08]"
        >
          {certifications.map((cert) => (
            <article
              key={cert.id}
              className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5"
            >
              <h3 className="text-base font-semibold text-white">
                {cert.url ? (
                  <a
                    href={cert.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-cyan-300"
                  >
                    {cert.name}
                  </a>
                ) : (
                  cert.name
                )}
              </h3>
              <p className="mt-1 text-sm text-zinc-400">{cert.issuer}</p>
              {cert.issueDate && (
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-zinc-500">
                  {new Date(cert.issueDate).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              )}
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    achievements: achievements.length > 0 ? (
      <section
        key="achievements"
        className="rounded-[1.85rem] border border-white/10 bg-white/[0.045] p-6 md:p-8"
      >
        <SectionHeading>{labels.achievements}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName="space-y-3"
          buttonClassName="mt-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-300 transition-colors hover:bg-white/[0.08]"
        >
          {achievements.map((ach) => (
            <article
              key={ach.id}
              className="flex items-start gap-3 rounded-[1.5rem] border border-white/10 bg-black/20 p-5"
            >
              <Trophy className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white leading-relaxed">{ach.title}</p>
                {ach.date && (
                  <p className="mt-1 text-xs text-zinc-500">
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
      <section
        key="profiles"
        id="profiles"
        className="scroll-mt-24 rounded-[1.85rem] border border-white/10 bg-white/[0.045] p-6 md:p-8"
      >
        <SectionHeading>{labels.profiles}</SectionHeading>
        <ProfileLinksSection
          portfolio={portfolio}
          profiles={socialProfiles}
          chipClassName="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-sm text-zinc-400"
          pillClassName="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-white/[0.1]"
          titleClassName="text-white"
          textClassName="text-zinc-400"
        />
      </section>
    ) : null,

    github: contributionCalendar ? (
      <section
        key="github"
        className="rounded-[1.85rem] border border-white/10 bg-white/[0.045] p-6 md:p-8"
      >
        <SectionHeading>{labels.github}</SectionHeading>
        <GitHubContributionHeatmap
          calendar={contributionCalendar}
          profileUrl={githubProfile?.url}
          username={githubProfile?.username}
          variant="modern"
          label={labels.github}
        />
      </section>
    ) : null,
  };

  return (
    <div className={cn(TEMPLATE_CONTAINER, "min-h-screen bg-[#060816] text-zinc-100")}>
      <div className="relative w-full max-w-full overflow-x-clip">
        <div className="pointer-events-none absolute -left-40 -top-32 h-96 w-96 rounded-full bg-violet-500/16 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-cyan-400/12 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.18]" />

        <div className="relative mx-auto min-w-0 max-w-6xl overflow-x-clip px-5 pb-14 pt-8 sm:px-6 md:px-10 md:pb-24 md:pt-16">
          <header className="rounded-[2.1rem] border border-white/10 bg-white/[0.045] p-6 @md:p-10">
            <div className="min-w-0">
              <div className={HERO_HEADER_COLUMN}>
                <h1
                  className={cn(
                    HERO_TITLE_BASE,
                    HERO_TITLE_SCALE_7XL,
                    "font-black tracking-tight text-white"
                  )}
                >
                  {portfolio.title}
                </h1>
                {portfolio.headline && (
                  <p className={cn(HERO_HEADLINE_SCALE, "mt-5 max-w-2xl text-zinc-300/95")}>
                    {portfolio.headline}
                  </p>
                )}

                <div className="mt-6">
                  <ContactChips
                    portfolio={portfolio}
                    chipClassName="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-sm text-zinc-400"
                  />
                </div>

                <div className="mt-4">
                  <HeroProfileButtons
                    profiles={socialProfiles}
                    className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-zinc-200 transition-colors hover:bg-white/[0.1]"
                  />
                </div>

                {socialProfiles.length > 0 && (
                  <div className="mt-6">
                    <SocialPills
                      profiles={socialProfiles}
                      showUsername
                      className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-white/[0.1]"
                    />
                  </div>
                )}
              </div>
            </div>
          </header>

          {navbarEnabled && (
            <div className="mt-6">
              <TemplateNavbar
                items={sections}
                className="rounded-full border-white/10 bg-white/[0.05]"
                linkClassName="rounded-full px-4 py-2 text-sm text-zinc-400 transition-colors hover:bg-white/[0.1] hover:text-white"
              />
            </div>
          )}

          <div className="mt-8 min-w-0 space-y-8 md:mt-10 md:space-y-10">
            {renderSections(resolved, "full", blocks)}
          </div>

          {customSections.length > 0 && (
            <div className="mt-8 grid gap-8 md:mt-10 md:gap-10 md:grid-cols-2">
              {customSections.map((cs) => (
                <section key={cs.id} className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-8">
                  <SectionHeading>{cs.label}</SectionHeading>
                  <CustomSectionItems
                    items={cs.items}
                    titleClassName="font-medium text-white"
                    textClassName="text-sm text-zinc-400"
                    chipClassName="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-400"
                  />
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-5 flex items-center gap-3 text-2xl font-semibold tracking-tight text-white md:mb-6 md:text-3xl">
      <span className="h-px w-8 bg-white/18" />
      {children}
    </h2>
  );
}
