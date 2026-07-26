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
  HERO_TITLE_SCALE_6XL,
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


export function CorporateTemplate({ data }: { data: PortfolioData }) {
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
  const skillsByCategory = groupSkillsByCategory(skills);
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
    getTemplateSectionLayout("corporate"),
    portfolio.customization,
  );

  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: portfolio.summary ? (
      <section
        key="about"
        id="about"
        className="scroll-mt-24 rounded-[1.9rem] border border-white bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)] md:p-8"
      >
        <SectionHeading>{labels.about}</SectionHeading>
        <DescriptionBlock
          text={portfolio.summary}
          paragraphClassName="whitespace-pre-line text-base leading-8 text-slate-600"
          listClassName="space-y-3 pl-5 text-base leading-8 text-slate-600 marker:text-slate-300"
        />
      </section>
    ) : null,

    projects: visibleProjects.length > 0 ? (
      <section
        key="projects"
        id="work"
        className="scroll-mt-24 rounded-[1.9rem] border border-white bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)] md:p-8"
      >
        <SectionHeading>{labels.projects}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName={cn(PROJECTS_GRID_2, "gap-5")}
          buttonClassName="col-span-full mt-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900"
        >
          {visibleProjects.map((project) => (
            <article
              key={project.id}
              className={cn(
                PROJECT_CARD,
                "rounded-[1.5rem] border border-slate-200 bg-slate-50 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
              )}
            >
              <TemplateProjectPreview templateId="corporate"
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
                      <h3 className={cn(PROJECT_CARD_TITLE, "text-lg font-semibold text-slate-900")}>
                        {project.title}
                      </h3>
                      {project.featured && (
                        <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-white">
                          Featured
                        </span>
                      )}
                    </div>
                    {project.language && (
                      <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-400">
                        {project.language}
                      </p>
                    )}
                  </div>
                </div>

                {project.description && (
                  <DescriptionBlock
                    text={project.description}
                    paragraphClassName="mt-4 text-sm leading-7 text-slate-600"
                    listClassName="mt-4 space-y-2 pl-5 text-sm leading-7 text-slate-600 marker:text-slate-300"
                  />
                )}

                {project.techStack.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full bg-white px-3 py-1 text-xs text-slate-500 ring-1 ring-slate-200"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}

                {(project.githubStars !== null || project.githubForks !== null) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.githubStars !== null && (
                      <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-500 ring-1 ring-slate-200">
                        {project.githubStars} stars
                      </span>
                    )}
                    {project.githubForks !== null && (
                      <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-500 ring-1 ring-slate-200">
                        {project.githubForks} forks
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-5">
                  <ProjectActions
                    liveUrl={project.liveUrl}
                    sourceUrl={project.sourceUrl}
                    label={project.title}
                    projectId={project.id}
                    liveClassName="rounded-full bg-sky-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-800"
                    sourceClassName="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900"
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
        className="scroll-mt-24 rounded-[1.9rem] border border-white bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)] md:p-8"
      >
        <SectionHeading>{labels.experience}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName="space-y-5"
          buttonClassName="mt-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900"
        >
          {experiences.map((exp) => (
            <article
              key={exp.id}
              className="rounded-[1.5rem] border border-slate-200 bg-slate-50/60 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    {exp.role}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-sky-800">
                    {exp.company}
                  </p>
                  {exp.location && (
                    <p className="mt-1 text-sm text-slate-500">{exp.location}</p>
                  )}
                </div>
                {(exp.startDate || exp.endDate) && (
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                    {formatDateRange(exp.startDate, exp.endDate)}
                  </p>
                )}
              </div>
              {exp.description && (
                <DescriptionBlock
                  text={exp.description}
                  paragraphClassName="mt-4 text-sm leading-7 text-slate-600"
                  listClassName="mt-4 space-y-2 pl-5 text-sm leading-7 text-slate-600 marker:text-slate-300"
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
        className="scroll-mt-24 rounded-[1.9rem] border border-white bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)] md:p-8"
      >
        <SectionHeading>{labels.articles}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName="space-y-4"
          buttonClassName="mt-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900"
        >
          {articles.map((article) => (
            <article
              key={article.id}
              className="rounded-[1.5rem] border border-slate-200 bg-slate-50/60 p-5"
            >
              <h3 className="text-base font-semibold text-slate-900">
                <a
                  href={article.url} data-lf-track="article" data-lf-label={article.title} data-lf-id={article.id}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-sky-700"
                >
                  {article.title}
                </a>
              </h3>
              {article.description && (
                <p className="mt-2 text-sm leading-7 text-slate-600">{article.description}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
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
                      className="rounded-full bg-white px-3 py-1 text-xs text-slate-500 ring-1 ring-slate-200"
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
        className="rounded-[1.9rem] border border-white bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)] md:p-8"
      >
        <SectionHeading>{labels.skills}</SectionHeading>
        <div className="space-y-6">
          {Object.entries(skillsByCategory).map(([category, names]) => (
            <div key={category}>
              <h3 className="mb-3 text-xs uppercase tracking-[0.22em] text-slate-500">
                {category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {names.map((name) => (
                  <span
                    key={name}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700"
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
        className="rounded-[1.9rem] border border-white bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)] md:p-8"
      >
        <SectionHeading>{labels.education}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName="space-y-4"
          buttonClassName="mt-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900"
        >
          {educations.map((edu) => (
            <article
              key={edu.id}
              className="rounded-[1.5rem] border border-slate-200 bg-slate-50/60 p-5"
            >
              <h3 className="text-lg font-semibold text-slate-900">
                {edu.degree}
                {edu.field && <span className="text-slate-500"> in {edu.field}</span>}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{edu.institution}</p>
              {(edu.startDate || edu.endDate) && (
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-400">
                  {formatDateRange(edu.startDate, edu.endDate)}
                </p>
              )}
              {edu.gpa && <p className="mt-3 text-xs text-slate-500">GPA: {edu.gpa}</p>}
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    certifications: certifications.length > 0 ? (
      <section
        key="certifications"
        className="rounded-[1.9rem] border border-white bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)] md:p-8"
      >
        <SectionHeading>{labels.certifications}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName="space-y-4"
          buttonClassName="mt-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900"
        >
          {certifications.map((cert) => (
            <article
              key={cert.id}
              className="rounded-[1.5rem] border border-slate-200 bg-slate-50/60 p-5"
            >
              <h3 className="text-base font-semibold text-slate-900">
                {cert.url ? (
                  <a
                    href={cert.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-sky-700"
                  >
                    {cert.name}
                  </a>
                ) : (
                  cert.name
                )}
              </h3>
              <p className="mt-1 text-sm text-slate-500">{cert.issuer}</p>
              {cert.issueDate && (
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-400">
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
        className="rounded-[1.9rem] border border-white bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)] md:p-8"
      >
        <SectionHeading>{labels.achievements}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName="space-y-3"
          buttonClassName="mt-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900"
        >
          {achievements.map((ach) => (
            <article
              key={ach.id}
              className="flex items-start gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/60 p-5"
            >
              <Trophy className="h-4 w-4 text-sky-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-900 leading-relaxed">{ach.title}</p>
                {ach.date && (
                  <p className="mt-1 text-xs text-slate-500">
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
        className="scroll-mt-24 rounded-[1.9rem] border border-white bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)] md:p-8"
      >
        <SectionHeading>{labels.profiles}</SectionHeading>
        <ProfileLinksSection
          portfolio={portfolio}
          profiles={socialProfiles}
          chipClassName="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600"
          pillClassName="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
          titleClassName="text-slate-900"
          textClassName="text-slate-500"
        />
      </section>
    ) : null,

    github: contributionCalendar ? (
      <section
        key="github"
        className="rounded-[1.9rem] border border-white bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)] md:p-8"
      >
        <SectionHeading>{labels.github}</SectionHeading>
        <GitHubContributionHeatmap
          calendar={contributionCalendar}
          profileUrl={githubProfile?.url}
          username={githubProfile?.username}
          variant="corporate"
          label={labels.github}
        />
      </section>
    ) : null,
  };

  return (
    <div className={cn(TEMPLATE_CONTAINER, "min-h-screen bg-[#f3f6fb] text-slate-900 antialiased")}>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6 md:px-10 md:py-12">
        <header className="overflow-hidden rounded-[2.2rem] border border-slate-200/40 bg-[#0f172a] text-white shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
          <div className="min-w-0">
            <div className={cn(HERO_HEADER_COLUMN, "p-6 @md:p-10")}>
              <h1
                className={cn(
                  HERO_TITLE_BASE,
                  HERO_TITLE_SCALE_6XL,
                  "max-w-3xl font-semibold tracking-tight text-white"
                )}
              >
                {portfolio.title}
              </h1>
              {portfolio.headline && (
                <p className={cn(HERO_HEADLINE_SCALE, "mt-5 max-w-2xl text-slate-300")}>
                  {portfolio.headline}
                </p>
              )}

              <div className="mt-6">
                <ContactChips
                  portfolio={portfolio}
                  chipClassName="rounded-full border border-white/10 bg-white/6 px-3.5 py-1.5 text-sm text-slate-300"
                />
              </div>

              <div className="mt-4">
                <HeroProfileButtons
                  profiles={socialProfiles}
                  className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm text-slate-100 transition-colors hover:bg-white/14"
                />
              </div>

              {socialProfiles.length > 0 && (
                <div className="mt-6">
                  <SocialPills
                    profiles={socialProfiles}
                    showUsername
                    className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:bg-white/12"
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
              className="rounded-full border-white bg-white/90 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
              linkClassName="rounded-full px-4 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-900 hover:text-white"
            />
          </div>
        )}

        <div className="mt-6 space-y-6 md:mt-8 md:space-y-8">
          {renderSections(resolved, "full", blocks)}
        </div>

        {customSections.length > 0 && (
          <div className="mt-6 grid gap-6 md:mt-8 md:gap-8 md:grid-cols-2">
            {customSections.map((cs) => (
              <section key={cs.id} className="rounded-[1.75rem] bg-white p-8 shadow-sm">
                <SectionHeading>{cs.label}</SectionHeading>
                <CustomSectionItems
                  items={cs.items}
                  titleClassName="font-medium text-slate-900"
                  textClassName="text-sm text-slate-500"
                  chipClassName="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-500"
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
    <h2 className="mb-6 text-2xl font-semibold tracking-tight text-slate-900">{children}</h2>
  );
}
