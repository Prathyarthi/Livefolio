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
import { TemplateProjectPreview } from "@/components/template-project-preview";
import { getTemplateSectionLayout } from "../section-layouts";
import {
  renderSections,
  resolveSectionLayout,
  type ReorderableSectionKey,
} from "../section-order";


export function MinimalTemplate({ data }: { data: PortfolioData }) {
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
  const visibleProjects =
    featuredProjects.length > 0
      ? [...featuredProjects, ...projects.filter((p) => !p.featured)]
      : projects;
  const { hasProfiles, navbarEnabled, sections } = buildTemplateSections(data);
  const resolved = resolveSectionLayout(
    getTemplateSectionLayout("minimal"),
    portfolio.customization,
  );

  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: portfolio.summary ? (
      <section
        key="about"
        id="about"
        className="scroll-mt-24 rounded-[1.9rem] border border-white/80 bg-white/72 p-6 shadow-[0_16px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl md:p-8"
      >
        <SectionHeading>{labels.about}</SectionHeading>
        <DescriptionBlock
          text={portfolio.summary}
          paragraphClassName="whitespace-pre-line text-base leading-8 text-stone-600"
          listClassName="space-y-3 pl-5 text-base leading-8 text-stone-600 marker:text-stone-300"
        />
      </section>
    ) : null,

    projects: visibleProjects.length > 0 ? (
      <section
        key="projects"
        id="work"
        className="scroll-mt-24 rounded-[1.9rem] border border-white/80 bg-white/72 p-6 shadow-[0_16px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl md:p-8"
      >
        <SectionHeading>{labels.projects}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName={PROJECTS_GRID_2}
          buttonClassName="col-span-full mt-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-xs font-medium uppercase tracking-[0.2em] text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-900"
        >
          {visibleProjects.map((project) => (
            <article
              key={project.id}
              className={cn(
                PROJECT_CARD,
                "rounded-[1.6rem] border border-stone-200/80 bg-[#fffdf9] shadow-[0_14px_40px_rgba(28,25,23,0.05)] transition-transform duration-300 hover:-translate-y-1"
              )}
            >
              <TemplateProjectPreview templateId="minimal"
                liveUrl={project.liveUrl ?? null}
                projectId={project.id}
                livePreviewProjectIds={livePreviewProjectIds}
                alt={project.title}
                loading="lazy"
                containerClassName="overflow-hidden bg-stone-100"
              />
              <div className={PROJECT_CARD_BODY}>
                <div className={PROJECT_CARD_HEADER}>
                  <div className="min-w-0 flex-1">
                    <div className={PROJECT_CARD_META}>
                      <h3 className={cn(PROJECT_CARD_TITLE, "font-serif text-2xl font-semibold text-stone-950")}>
                        {project.title}
                      </h3>
                      {project.featured && (
                        <span className="rounded-full border border-stone-900 bg-stone-900 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-stone-100">
                          Featured
                        </span>
                      )}
                    </div>
                    {project.language && (
                      <p className="mt-2 text-xs uppercase tracking-[0.22em] text-stone-400">
                        {project.language}
                      </p>
                    )}
                  </div>

                  <ProjectActions
                    liveUrl={project.liveUrl}
                    sourceUrl={project.sourceUrl}
                    label={project.title}
                    projectId={project.id}
                    liveClassName="rounded-full bg-stone-950 px-4 py-2 text-xs font-medium text-stone-100 transition-colors hover:bg-stone-800"
                    sourceClassName="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-medium text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-900"
                  />
                </div>

                {project.description && (
                  <DescriptionBlock
                    text={project.description}
                    paragraphClassName="mt-4 text-sm leading-7 text-stone-600"
                    listClassName="mt-4 space-y-2 pl-5 text-sm leading-7 text-stone-600 marker:text-stone-300"
                  />
                )}

                {(project.techStack.length > 0 ||
                  project.githubStars !== null ||
                  project.githubForks !== null) && (
                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      {project.techStack.map((tech) => (
                        <span
                          key={tech}
                          className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-500"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.githubStars !== null && (
                        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-500">
                          {project.githubStars} stars
                        </span>
                      )}
                      {project.githubForks !== null && (
                        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-500">
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
        className="scroll-mt-24 rounded-[1.9rem] border border-white/80 bg-white/72 p-6 shadow-[0_16px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl md:p-8"
      >
        <SectionHeading>{labels.experience}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName="space-y-6"
          buttonClassName="mt-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-xs font-medium uppercase tracking-[0.2em] text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-900"
        >
          {experiences.map((exp) => (
            <article
              key={exp.id}
              className="rounded-[1.6rem] border border-stone-200/80 bg-[#fffdf9] p-5 shadow-[0_10px_30px_rgba(28,25,23,0.04)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-serif text-xl font-semibold text-stone-900">
                    {exp.role}
                  </h3>
                  <p className="mt-1 text-sm text-stone-500">
                    {exp.company}
                    {exp.location ? ` · ${exp.location}` : ""}
                  </p>
                </div>
                {(exp.startDate || exp.endDate) && (
                  <p className="text-xs uppercase tracking-[0.22em] text-stone-400">
                    {formatDateRange(exp.startDate, exp.endDate)}
                  </p>
                )}
              </div>
              {exp.description && (
                <DescriptionBlock
                  text={exp.description}
                  paragraphClassName="mt-4 text-sm leading-7 text-stone-600"
                  listClassName="mt-4 space-y-2 pl-5 text-sm leading-7 text-stone-600 marker:text-stone-300"
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
        className="scroll-mt-24 rounded-[1.9rem] border border-white/80 bg-white/72 p-6 shadow-[0_16px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl md:p-8"
      >
        <SectionHeading>{labels.articles}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName="space-y-4"
          buttonClassName="mt-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-xs font-medium uppercase tracking-[0.2em] text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-900"
        >
          {articles.map((article) => (
            <article
              key={article.id}
              className="rounded-[1.6rem] border border-stone-200/80 bg-[#fffdf9] p-5 shadow-[0_10px_30px_rgba(28,25,23,0.04)]"
            >
              <h3 className="font-serif text-lg font-semibold text-stone-900">
                <a
                  href={article.url} data-lf-track="article" data-lf-label={article.title} data-lf-id={article.id}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-stone-600"
                >
                  {article.title}
                </a>
              </h3>
              {article.description && (
                <p className="mt-2 text-sm leading-7 text-stone-600">{article.description}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-stone-500">
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
                      className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-500"
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
        className="rounded-[1.9rem] border border-white/80 bg-white/72 p-6 shadow-[0_16px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl md:p-8"
      >
        <SectionHeading>{labels.skills}</SectionHeading>
        <div className="space-y-6">
          {Object.entries(groupedSkills).map(([category, names]) => (
            <div key={category}>
              <h3 className="mb-3 text-xs uppercase tracking-[0.22em] text-stone-400">
                {category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {names.map((name) => (
                  <span
                    key={name}
                    className="rounded-full border border-stone-200/80 bg-stone-50 px-3 py-1.5 text-sm text-stone-600"
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
        className="rounded-[1.9rem] border border-white/80 bg-white/72 p-6 shadow-[0_16px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl md:p-8"
      >
        <SectionHeading>{labels.education}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName="space-y-5"
          buttonClassName="mt-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-xs font-medium uppercase tracking-[0.2em] text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-900"
        >
          {educations.map((edu) => (
            <article
              key={edu.id}
              className="rounded-[1.6rem] border border-stone-200/80 bg-[#fffdf9] p-5 shadow-[0_10px_30px_rgba(28,25,23,0.04)]"
            >
              <h3 className="font-serif text-lg font-semibold text-stone-900">
                {edu.degree}
                {edu.field && <span className="text-stone-500"> in {edu.field}</span>}
              </h3>
              <p className="mt-2 text-sm text-stone-500">{edu.institution}</p>
              {(edu.startDate || edu.endDate) && (
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-400">
                  {formatDateRange(edu.startDate, edu.endDate)}
                </p>
              )}
              {edu.gpa && <p className="mt-3 text-xs text-stone-500">GPA: {edu.gpa}</p>}
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    certifications: certifications.length > 0 ? (
      <section
        key="certifications"
        className="rounded-[1.9rem] border border-white/80 bg-white/72 p-6 shadow-[0_16px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl md:p-8"
      >
        <SectionHeading>{labels.certifications}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName="space-y-4"
          buttonClassName="mt-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-xs font-medium uppercase tracking-[0.2em] text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-900"
        >
          {certifications.map((cert) => (
            <article
              key={cert.id}
              className="rounded-[1.6rem] border border-stone-200/80 bg-[#fffdf9] p-5 shadow-[0_10px_30px_rgba(28,25,23,0.04)]"
            >
              <h3 className="font-medium text-stone-900">
                {cert.url ? (
                  <a
                    href={cert.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-stone-600"
                  >
                    {cert.name}
                  </a>
                ) : (
                  cert.name
                )}
              </h3>
              <p className="mt-1 text-sm text-stone-500">{cert.issuer}</p>
              {cert.issueDate && (
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-stone-400">
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
        className="rounded-[1.9rem] border border-white/80 bg-white/72 p-6 shadow-[0_16px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl md:p-8"
      >
        <SectionHeading>{labels.achievements}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName="space-y-3"
          buttonClassName="mt-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-xs font-medium uppercase tracking-[0.2em] text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-900"
        >
          {achievements.map((ach) => (
            <article
              key={ach.id}
              className="flex items-start gap-3 rounded-[1.6rem] border border-stone-200/80 bg-[#fffdf9] p-5 shadow-[0_10px_30px_rgba(28,25,23,0.04)]"
            >
              <Trophy className="h-4 w-4 text-stone-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-stone-900 leading-relaxed">{ach.title}</p>
                {ach.date && (
                  <p className="mt-1 text-xs text-stone-500">
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
        className="scroll-mt-24 rounded-[1.9rem] border border-white/80 bg-white/72 p-6 shadow-[0_16px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl md:p-8"
      >
        <SectionHeading>{labels.profiles}</SectionHeading>
        <ProfileLinksSection
          portfolio={portfolio}
          profiles={socialProfiles}
          chipClassName="rounded-full border border-stone-200/80 bg-stone-50 px-3 py-1.5 text-sm text-stone-500"
          pillClassName="rounded-full border border-stone-200/80 bg-white px-3 py-1.5 text-sm text-stone-600 transition-colors hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900"
          titleClassName="text-stone-900"
          textClassName="text-stone-500"
        />
      </section>
    ) : null,

    github: contributionCalendar ? (
      <section
        key="github"
        className="rounded-[1.9rem] border border-white/80 bg-white/72 p-6 shadow-[0_16px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl md:p-8"
      >
        <SectionHeading>{labels.github}</SectionHeading>
        <GitHubContributionHeatmap
          calendar={contributionCalendar}
          profileUrl={githubProfile?.url}
          username={githubProfile?.username}
          variant="minimal"
          label={labels.github}
        />
      </section>
    ) : null,
  };

  return (
    <div className={cn(TEMPLATE_CONTAINER, "min-h-screen bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.14),transparent_34%),linear-gradient(180deg,#f8f7f4_0%,#efede6_100%)] text-stone-800")}>
      <div className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-6 md:px-10 md:pb-24 md:pt-14">
        <header className="relative overflow-hidden rounded-[2.25rem] border border-white/80 bg-white/75 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.08)] backdrop-blur-xl @md:p-10">
          <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-stone-300/70 to-transparent" />
          <div className="min-w-0">
            <div className={HERO_HEADER_COLUMN}>
              <h1
                className={cn(
                  HERO_TITLE_BASE,
                  HERO_TITLE_SCALE_7XL,
                  "max-w-3xl font-serif font-semibold tracking-tight text-stone-950"
                )}
              >
                {portfolio.title}
              </h1>
              {portfolio.headline && (
                <p className={cn(HERO_HEADLINE_SCALE, "mt-5 max-w-2xl text-stone-600")}>
                  {portfolio.headline}
                </p>
              )}

              <div className="mt-7">
                <ContactChips
                  portfolio={portfolio}
                  chipClassName="rounded-full border border-stone-200/80 bg-stone-50/90 px-3.5 py-1.5 text-sm text-stone-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]"
                />
              </div>

              <div className="mt-4">
                <HeroProfileButtons
                  profiles={socialProfiles}
                  className="rounded-full border border-stone-200/80 bg-stone-950 px-4 py-2 text-sm text-stone-100 transition-colors hover:bg-stone-800"
                />
              </div>

              {socialProfiles.length > 0 && (
                <div className="mt-6">
                  <SocialPills
                    profiles={socialProfiles}
                    showUsername
                    className="rounded-full border border-stone-200/80 bg-white/85 px-3 py-1.5 text-sm text-stone-600 transition-colors hover:border-stone-300 hover:bg-white hover:text-stone-900"
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
              className="rounded-full border-white/80 bg-white/80 shadow-[0_12px_30px_rgba(15,23,42,0.05)]"
              linkClassName="rounded-full px-4 py-2 text-sm text-stone-500 transition-colors hover:bg-stone-950 hover:text-stone-50"
            />
          </div>
        )}

        <div className="mt-8 space-y-8 md:mt-10 md:space-y-10">
          {renderSections(resolved, "full", blocks)}
        </div>

        {customSections.length > 0 && (
          <div className="mt-8 grid gap-8 md:mt-10 md:gap-10 md:grid-cols-2">
            {customSections.map((cs) => (
              <section key={cs.id} className="rounded-[1.75rem] border border-stone-200/80 bg-white/70 p-8">
                <SectionHeading>{cs.label}</SectionHeading>
                <CustomSectionItems
                  items={cs.items}
                  titleClassName="font-medium text-stone-900"
                  textClassName="text-sm text-stone-500"
                  chipClassName="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs text-stone-500"
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
    <h2 className="mb-5 flex items-center gap-3 font-serif text-2xl font-semibold tracking-tight text-stone-900 md:mb-6 md:text-3xl">
      <span className="h-px w-8 bg-stone-300" />
      {children}
    </h2>
  );
}
