import type { PortfolioData } from "../types";
import { cn } from "@/lib/utils";
import {
  GitHubContributionHeatmap,
  parseContributionCalendar,
} from "../github-contribution-heatmap";
import { ArrowRight } from "lucide-react";
import {
  buildTemplateSections,
  ContactChips,
  CustomSectionItems,
  DescriptionBlock,
  HeroProfileButtons,
  ProfileLinksSection,
  ProjectActions,
  PROJECT_CARD,
  PROJECT_CARD_HEADER,
  PROJECT_CARD_META,
  PROJECT_CARD_TITLE,
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


export function MonochromeTemplate({ data }: { data: PortfolioData }) {
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
    getTemplateSectionLayout("monochrome"),
    portfolio.customization,
  );

  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: portfolio.summary ? (
      <section
        key="about"
        id="about"
        className="scroll-mt-32 grid grid-cols-1 lg:grid-cols-12 gap-12 border-t border-black pt-12"
      >
        <div className="lg:col-span-4">
          <SectionHeading>{labels.about}</SectionHeading>
        </div>
        <div className="lg:col-span-8">
          <DescriptionBlock
            text={portfolio.summary}
            paragraphClassName="text-2xl md:text-3xl leading-snug font-medium text-black"
            listClassName="space-y-4 pl-8 text-2xl md:text-3xl leading-snug font-medium text-black marker:text-black"
          />
        </div>
      </section>
    ) : null,

    projects: visibleProjects.length > 0 ? (
      <section key="projects" id="work" className="scroll-mt-32 border-t border-black pt-12">
        <SectionHeading className="mb-12">{labels.projects}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName={cn(PROJECTS_GRID_2, "gap-x-8 gap-y-16")}
          buttonClassName="col-span-full mt-16 mx-auto block border border-black bg-white px-12 py-4 text-sm font-bold uppercase tracking-widest text-black hover:bg-black hover:text-white transition-colors"
        >
          {visibleProjects.map((project) => (
            <article key={project.id} className={cn(PROJECT_CARD, "group flex flex-col")}>
              <TemplateProjectPreview templateId="monochrome"
                liveUrl={project.liveUrl ?? null}
                projectId={project.id}
                livePreviewProjectIds={livePreviewProjectIds}
                alt={project.title}
                loading="lazy"
                containerClassName="mb-6 overflow-hidden bg-gray-100"
                className="h-full w-full object-cover object-top filter transition-all duration-700 group-hover:scale-105"
              />

              <div className="flex flex-col grow">
                <div className={cn(PROJECT_CARD_HEADER, "mb-4")}>
                  <h3 className={cn(PROJECT_CARD_TITLE, "flex-1 text-3xl font-black uppercase tracking-tighter")}>
                    {project.title}
                  </h3>
                  {project.featured && (
                    <span className="shrink-0 border border-black px-2 py-1 text-[10px] font-bold uppercase tracking-widest">
                      Featured
                    </span>
                  )}
                </div>

                {project.description && (
                  <DescriptionBlock
                    text={project.description}
                    paragraphClassName="mb-6 grow text-gray-600 leading-relaxed"
                    listClassName="mb-6 grow space-y-2 pl-5 text-gray-600 leading-relaxed marker:text-black"
                  />
                )}

                <div className="flex flex-wrap gap-2 mb-8">
                  {project.techStack.map((tech) => (
                    <span key={tech} className="text-xs font-bold uppercase tracking-widest text-gray-500">
                      {tech}
                    </span>
                  ))}
                </div>

                <div className="mt-auto flex gap-4">
                  <ProjectActions
                    liveUrl={project.liveUrl}
                    sourceUrl={project.sourceUrl}
                    label={project.title}
                    projectId={project.id}
                    liveClassName="text-sm font-bold uppercase tracking-widest border-b-2 border-black pb-1 hover:text-gray-500 hover:border-gray-500 transition-colors flex items-center gap-2"
                    sourceClassName="text-sm font-bold uppercase tracking-widest border-b-2 border-gray-300 pb-1 text-gray-500 hover:text-black hover:border-black transition-colors"
                  />
                </div>
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    experience: experiences.length > 0 ? (
      <section key="experience" id="experience" className="scroll-mt-32 border-t border-black pt-12">
        <SectionHeading className="mb-12">{labels.experience}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName="space-y-12"
          buttonClassName="mt-12 border border-black bg-white px-8 py-3 text-sm font-bold uppercase tracking-widest text-black hover:bg-black hover:text-white transition-colors"
        >
          {experiences.map((exp) => (
            <article key={exp.id} className="border-l-4 border-black pl-6">
              <h3 className="text-2xl font-black uppercase tracking-tight mb-1">{exp.role}</h3>
              <p className="text-xl font-medium text-gray-600 mb-4">{exp.company}</p>
              {(exp.startDate || exp.endDate) && (
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
                  {formatDateRange(exp.startDate, exp.endDate)}
                </p>
              )}
              {exp.description && (
                <div className="text-gray-600 leading-relaxed">
                  <DescriptionBlock
                    text={exp.description}
                    paragraphClassName="mb-2"
                    listClassName="list-disc pl-5 space-y-1 marker:text-black"
                  />
                </div>
              )}
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    skills: skills.length > 0 ? (
      <section key="skills" className="border-t border-black pt-12">
        <SectionHeading className="mb-12">{labels.skills}</SectionHeading>
        <div className="space-y-12">
          {Object.entries(groupedSkills).map(([category, names]) => (
            <div key={category}>
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">
                {category}
              </h3>
              <div className="flex flex-wrap gap-x-6 gap-y-4">
                {names.map((name) => (
                  <span key={name} className="text-lg font-bold uppercase tracking-tight">
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
      <section key="education" className="border-t border-black pt-12">
        <SectionHeading className="mb-12">{labels.education}</SectionHeading>
        <CollapsibleList
          initial={3}
          wrapperClassName="space-y-8"
          buttonClassName="mt-8 border border-black bg-white px-8 py-3 text-sm font-bold uppercase tracking-widest text-black hover:bg-black hover:text-white transition-colors"
        >
          {educations.map((edu) => (
            <article key={edu.id} className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-black uppercase tracking-tight">{edu.degree}</h3>
              <p className="text-lg text-gray-600 mt-1">{edu.institution}</p>
              <div className="flex justify-between items-center mt-4 text-xs font-bold uppercase tracking-widest text-gray-400">
                {(edu.startDate || edu.endDate) && (
                  <span>{formatDateRange(edu.startDate, edu.endDate)}</span>
                )}
                {edu.gpa && <span className="border border-gray-300 px-2 py-1">GPA {edu.gpa}</span>}
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    certifications: certifications.length > 0 ? (
      <section key="certifications" className="border-t border-black pt-12">
        <SectionHeading className="mb-12">{labels.certifications}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName="space-y-6"
          buttonClassName="mt-8 border border-black bg-white px-8 py-3 text-sm font-bold uppercase tracking-widest text-black hover:bg-black hover:text-white transition-colors"
        >
          {certifications.map((cert) => (
            <article key={cert.id} className="flex items-center justify-between border-b border-gray-200 pb-4 group">
              <div>
                <h3 className="text-lg font-bold uppercase tracking-tight">
                  {cert.url ? (
                    <a href={cert.url} target="_blank" rel="noopener noreferrer" className="hover:underline underline-offset-4 flex items-center gap-2">
                      {cert.name} <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </a>
                  ) : (
                    cert.name
                  )}
                </h3>
                <p className="text-sm font-medium text-gray-500 mt-1">{cert.issuer}</p>
              </div>
              {cert.issueDate && (
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400 shrink-0">
                  {new Date(cert.issueDate).getFullYear()}
                </span>
              )}
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    achievements: achievements.length > 0 ? (
      <section key="achievements" className="border-t border-black pt-12">
        <SectionHeading className="mb-12">{labels.achievements}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName="space-y-6"
          buttonClassName="mt-8 border border-black bg-white px-8 py-3 text-sm font-bold uppercase tracking-widest text-black hover:bg-black hover:text-white transition-colors"
        >
          {achievements.map((ach) => (
            <article key={ach.id} className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-bold uppercase tracking-tight leading-snug">{ach.title}</h3>
              {ach.date && (
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-2">
                  {new Date(ach.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </p>
              )}
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    articles: articles.length > 0 ? (
      <section key="articles" id="writing" className="scroll-mt-32 border-t border-black pt-12">
        <SectionHeading className="mb-12">{labels.articles}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12"
          buttonClassName="col-span-full mt-16 mx-auto block border border-black bg-white px-12 py-4 text-sm font-bold uppercase tracking-widest text-black hover:bg-black hover:text-white transition-colors"
        >
          {articles.map((article) => (
            <article key={article.id} className="group flex flex-col">
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 leading-tight">
                <a href={article.url} data-lf-track="article" data-lf-label={article.title} data-lf-id={article.id} target="_blank" rel="noopener noreferrer" className="hover:underline underline-offset-4 flex items-start justify-between">
                  {article.title}
                  <ArrowRight className="w-6 h-6 shrink-0 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </a>
              </h3>
              {article.description && (
                <p className="text-gray-600 leading-relaxed mb-6 grow">
                  {article.description}
                </p>
              )}
              <div className="mt-auto flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-widest text-gray-400 pt-6 border-t border-gray-200">
                {article.publishedAt && (
                  <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                )}
                {article.readTime != null && <span>{article.readTime} min read</span>}
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    profiles: hasProfiles ? (
      <section key="profiles" id="profiles" className="scroll-mt-32 border-t border-black pt-12">
        <SectionHeading className="mb-12">{labels.profiles}</SectionHeading>
        <ProfileLinksSection
          portfolio={portfolio}
          profiles={socialProfiles}
          chipClassName="text-sm font-bold uppercase tracking-widest border border-black px-6 py-3 hover:bg-black hover:text-white transition-colors"
          pillClassName="text-sm font-bold uppercase tracking-widest border border-black px-6 py-3 hover:bg-black hover:text-white transition-colors"
          titleClassName="text-2xl font-black uppercase tracking-tighter"
          textClassName="text-gray-500 font-medium"
        />
      </section>
    ) : null,

    github: contributionCalendar ? (
      <section key="github" className="scroll-mt-32 border-t border-black pt-12">
        <SectionHeading className="mb-12">{labels.github}</SectionHeading>
        <div className="overflow-x-auto custom-scrollbar pb-4">
          <GitHubContributionHeatmap
            calendar={contributionCalendar}
            profileUrl={githubProfile?.url}
            username={githubProfile?.username}
            variant="minimal"
            label={labels.github}
          />
        </div>
      </section>
    ) : null,
  };

  return (
    <div className={cn(TEMPLATE_CONTAINER, "min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white")}>

      {navbarEnabled && (
        <div className="sticky top-0 z-50 bg-white border-b border-black">
          <div className="mx-auto max-w-7xl px-4 md:px-8 py-4 flex justify-between items-center">
            <div className="font-bold text-xl tracking-tighter uppercase">{portfolio.title.split(' ')[0]}</div>
            <TemplateNavbar
              items={sections}
              className="flex gap-6"
              linkClassName="text-sm font-medium uppercase tracking-widest text-black hover:underline underline-offset-4"
            />
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 md:px-8 py-12 md:py-24 space-y-32">

        <header className="grid min-w-0 grid-cols-1 @lg:grid-cols-12 gap-12 items-end">
          <div className="min-w-0 @lg:col-span-8">
            <h1 className="min-w-0 text-balance [overflow-wrap:anywhere] text-2xl @sm:text-4xl @md:text-6xl @lg:text-8xl @xl:text-[9rem] font-black uppercase tracking-tighter leading-[0.85] mb-8">
              {portfolio.title}
            </h1>
            {portfolio.headline && (
              <p className="text-lg @md:text-2xl @lg:text-4xl font-medium tracking-tight max-w-3xl">
                {portfolio.headline}
              </p>
            )}
          </div>

          <div className="min-w-0 @lg:col-span-4 flex flex-col items-start @lg:items-end gap-8">
            <div className="flex flex-col items-start lg:items-end gap-4 w-full">
              <ContactChips
                portfolio={portfolio}
                chipClassName="w-full text-left lg:text-right text-sm font-bold uppercase tracking-widest border-b border-black pb-2 hover:bg-black hover:text-white transition-colors px-2"
              />
              <HeroProfileButtons
                profiles={socialProfiles}
                className="w-full text-left lg:text-right text-sm font-bold uppercase tracking-widest bg-black text-white px-6 py-3 hover:bg-white hover:text-black border border-black transition-colors"
              />
              {socialProfiles.length > 0 && (
                <SocialPills
                  profiles={socialProfiles}
                  showUsername
                  className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors"
                />
              )}
            </div>
          </div>
        </header>

        {renderSections(resolved, "full", blocks)}

        {customSections.length > 0 && customSections.map((cs) => (
          <section key={cs.id} className="scroll-mt-32 border-t border-black pt-12">
            <SectionHeading className="mb-12">{cs.label}</SectionHeading>
            <CustomSectionItems
              items={cs.items}
              titleClassName="text-xl font-black uppercase tracking-tight mb-2"
              textClassName="text-gray-600 leading-relaxed"
              chipClassName="text-xs font-bold uppercase tracking-widest text-gray-500 border border-gray-200 px-3 py-1"
            />
          </section>
        ))}
      </div>
    </div>
  );
}

function SectionHeading({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <h2 className={`text-sm font-bold uppercase tracking-widest text-gray-400 ${className || ''}`}>
      {children}
    </h2>
  );
}
