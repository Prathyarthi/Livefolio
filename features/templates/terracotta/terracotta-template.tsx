"use client";

import type { PortfolioData } from "../types";
import { getTemplateSectionLayout } from "../section-layouts";
import {
  renderSections,
  resolveSectionLayout,
  type ReorderableSectionKey,
} from "../section-order";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { CollapsibleList } from "../collapsible-list";
import {
  DescriptionBlock,
  TemplateNavbar,
  buildTemplateSections,
  SocialPills,
  ContactChips,
  CustomSectionItems,
  PROJECT_CARD,
  PROJECT_CARD_TITLE,
  TEMPLATE_CONTAINER,
  getSectionLabels,
} from "../shared";
import { TemplateProjectPreview } from "@/components/template-project-preview";
import { formatDateRange, groupSkillsByCategory } from "../utils";
import { GitHubContributionHeatmap, parseContributionCalendar } from "../github-contribution-heatmap";
import { motion } from "motion/react";


export function TerracottaTemplate({ data }: { data: PortfolioData }) {
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
  const { navbarEnabled, sections } = buildTemplateSections(data);
  const groupedSkills = groupSkillsByCategory(skills);

  const githubProfile = socialProfiles.find((p) => p.platform.toLowerCase() === "github");
  const githubStats = githubProfile?.cachedStats as Record<string, unknown> | null;
  const contributionCalendar = parseContributionCalendar(githubStats?.contributionCalendar);

  const resolved = resolveSectionLayout(
    getTemplateSectionLayout("terracotta"),
    portfolio.customization,
  );
  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: portfolio.summary && (
                <section key="about" id="about" className="scroll-mt-32 max-w-4xl">
                  <h2 className="mb-8 text-3xl font-medium text-[#E07A5F] flex items-center gap-4">
                    {labels.about} <span className="h-px flex-1 bg-[#3D405B]/10" />
                  </h2>
                  <DescriptionBlock
                    text={portfolio.summary}
                    paragraphClassName="text-xl leading-loose text-[#3D405B]/90 font-light"
                    listClassName="space-y-2 pl-5 text-xl font-light text-[#3D405B]/90 marker:text-[#E07A5F]"
                  />
                </section>
              ),
    projects: projects.length > 0 && (
                <section key="projects" id="work" className="scroll-mt-32">
                  <h2 className="mb-12 text-3xl font-medium text-[#E07A5F] flex items-center gap-4">
                    {labels.projects} <span className="h-px flex-1 bg-[#3D405B]/10" />
                  </h2>
                  <CollapsibleList initial={4} wrapperClassName={cn("grid min-w-0 grid-cols-1 gap-12", "@lg:grid-cols-2")} buttonClassName="mt-12 mx-auto block uppercase tracking-widest text-sm font-semibold border-b border-[#E07A5F] text-[#E07A5F] pb-1 hover:text-[#3D405B] hover:border-[#3D405B] transition-colors">
                    {projects.map((project) => (
                      <article key={project.id} className={cn(PROJECT_CARD, "group flex flex-col gap-6")}>
                        <div className="overflow-hidden rounded-t-[50px]">
                          <TemplateProjectPreview templateId="terracotta"
                            liveUrl={project.liveUrl ?? null}
                            projectId={project.id}
                            livePreviewProjectIds={livePreviewProjectIds}
                            alt={project.title}
                            containerClassName="overflow-hidden bg-[#F4F1DE]"
                            className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                          />
                        </div>
                        <div>
                          <h3 className={cn(PROJECT_CARD_TITLE, "text-2xl font-medium text-[#3D405B] mb-3")}>{project.title}</h3>
                          {project.description && (
                            <DescriptionBlock
                              text={project.description}
                              paragraphClassName="mb-6 text-lg leading-relaxed font-light text-[#3D405B]/80"
                              listClassName="mb-6 space-y-2 pl-5 text-lg leading-relaxed font-light text-[#3D405B]/80 marker:text-[#E07A5F]"
                            />
                          )}
                          <div className="flex flex-wrap gap-2 mb-6">
                            {project.techStack.map((tech) => (
                              <span key={tech} className="text-xs uppercase tracking-widest font-semibold text-[#E07A5F]">
                                {tech}
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-6">
                            {project.liveUrl && (
                              <a href={project.liveUrl} data-lf-track="project_live" data-lf-label={project.title} data-lf-id={project.id} target="_blank" rel="noreferrer" className="text-sm uppercase tracking-widest font-semibold border-b border-[#3D405B] pb-1 hover:text-[#E07A5F] hover:border-[#E07A5F] transition-all">
                                Visit Site
                              </a>
                            )}
                            {project.sourceUrl && (
                              <a href={project.sourceUrl} data-lf-track="project_source" data-lf-label={project.title} data-lf-id={project.id} target="_blank" rel="noreferrer" className="text-sm uppercase tracking-widest font-semibold border-b border-transparent pb-1 hover:text-[#3D405B] hover:border-[#3D405B] transition-all text-[#3D405B]/60">
                                Source
                              </a>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </CollapsibleList>
                </section>
              ),
    experience: experiences.length > 0 && (
                <section key="experience" id="experience" className="scroll-mt-32 max-w-4xl">
                  <h2 className="mb-12 text-3xl font-medium text-[#E07A5F] flex items-center gap-4">
                    {labels.experience} <span className="h-px flex-1 bg-[#3D405B]/10" />
                  </h2>
                  <CollapsibleList initial={3} wrapperClassName="space-y-12" buttonClassName="mt-12 mx-auto block uppercase tracking-widest text-sm font-semibold border-b border-[#E07A5F] text-[#E07A5F] pb-1 hover:text-[#3D405B] hover:border-[#3D405B] transition-colors">
                    {experiences.map((exp) => (
                      <div key={exp.id} className="relative pl-8 md:pl-0">
                        <div className="absolute left-0 top-2 h-full w-px bg-[#E07A5F]/20 md:hidden" />
                        <div className="absolute left-[-4px] top-2 h-2 w-2 rounded-full bg-[#E07A5F] md:hidden" />
                        <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-8 mb-4">
                          <span className="text-sm uppercase tracking-widest font-semibold text-[#E07A5F] md:w-1/4 shrink-0">
                            {formatDateRange(exp.startDate, exp.endDate)}
                          </span>
                          <div className="md:w-3/4">
                            <h3 className="text-2xl font-medium text-[#3D405B]">{exp.role}</h3>
                            <p className="text-xl font-light italic text-[#3D405B]/60 mt-1">{exp.company}</p>
                          </div>
                        </div>
                        {exp.description && (
                          <div className="md:pl-[calc(25%+2rem)]">
                            <DescriptionBlock text={exp.description} paragraphClassName="text-[#3D405B]/80 font-light leading-relaxed text-lg" />
                          </div>
                        )}
                      </div>
                    ))}
                  </CollapsibleList>
                </section>
              ),
    education: educations.length > 0 && (
                  <section key="education" className="scroll-mt-32">
                    <h2 className="mb-8 text-3xl font-medium text-[#E07A5F] flex items-center gap-4">
                      {labels.education} <span className="h-px flex-1 bg-[#3D405B]/10" />
                    </h2>
                    <CollapsibleList initial={3} wrapperClassName="space-y-8" buttonClassName="mt-8 uppercase tracking-widest text-sm font-semibold border-b border-[#E07A5F] text-[#E07A5F] pb-1 hover:text-[#3D405B] hover:border-[#3D405B] transition-colors">
                      {educations.map((edu) => (
                        <div key={edu.id}>
                          <h3 className="text-xl font-medium text-[#3D405B]">
                            {edu.degree} {edu.field ? `in ${edu.field}` : ""}
                          </h3>
                          <p className="text-lg font-light italic text-[#3D405B]/60 mt-1">{edu.institution}</p>
                          <p className="mt-2 text-sm uppercase tracking-widest font-semibold text-[#E07A5F]">{formatDateRange(edu.startDate, edu.endDate)}</p>
                        </div>
                      ))}
                    </CollapsibleList>
                  </section>
                ),
    skills: skills.length > 0 && (
                  <section key="skills" className="scroll-mt-32">
                    <h2 className="mb-8 text-3xl font-medium text-[#E07A5F] flex items-center gap-4">
                      {labels.skills} <span className="h-px flex-1 bg-[#3D405B]/10" />
                    </h2>
                    <div className="space-y-8">
                      {Object.entries(groupedSkills).map(([category, items]) => (
                        <div key={category}>
                          <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#3D405B]/50">{category}</h3>
                          <div className="flex flex-wrap gap-x-6 gap-y-3">
                            {items.map((skill) => (
                              <span key={skill} className="text-lg font-light text-[#3D405B]">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ),
    certifications: certifications.length > 0 && (
                    <section key="certifications">
                      <h2 className="mb-8 text-3xl font-medium text-[#E07A5F] flex items-center gap-4">
                        {labels.certifications} <span className="h-px flex-1 bg-[#3D405B]/10" />
                      </h2>
                      <CollapsibleList initial={3} wrapperClassName="space-y-6" buttonClassName="mt-8 uppercase tracking-widest text-sm font-semibold border-b border-[#E07A5F] text-[#E07A5F] pb-1 hover:text-[#3D405B] hover:border-[#3D405B] transition-colors">
                        {certifications.map((cert) => (
                          <div key={cert.id}>
                            <h3 className="text-xl font-medium text-[#3D405B]">
                              {cert.url ? (
                                <a href={cert.url} target="_blank" rel="noreferrer" className="hover:text-[#E07A5F] transition-colors">{cert.name}</a>
                              ) : cert.name}
                            </h3>
                            <p className="text-lg font-light italic text-[#3D405B]/60 mt-1">{cert.issuer}</p>
                          </div>
                        ))}
                      </CollapsibleList>
                    </section>
                  ),
    achievements: achievements.length > 0 && (
                    <section key="achievements">
                      <h2 className="mb-8 text-3xl font-medium text-[#E07A5F] flex items-center gap-4">
                        {labels.achievements} <span className="h-px flex-1 bg-[#3D405B]/10" />
                      </h2>
                      <CollapsibleList initial={3} wrapperClassName="space-y-6" buttonClassName="mt-8 uppercase tracking-widest text-sm font-semibold border-b border-[#E07A5F] text-[#E07A5F] pb-1 hover:text-[#3D405B] hover:border-[#3D405B] transition-colors">
                        {achievements.map((ach) => (
                          <div key={ach.id} className="flex gap-4">
                            <Trophy className="h-6 w-6 text-[#E07A5F] shrink-0 mt-1" />
                            <div>
                              <h3 className="text-xl font-medium text-[#3D405B]">{ach.title}</h3>
                              {ach.date && (
                                <p className="text-sm uppercase tracking-widest font-semibold text-[#3D405B]/50 mt-2">
                                  {new Date(ach.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </CollapsibleList>
                    </section>
                  ),
    articles: articles.length > 0 && (
                <section key="articles" id="articles" className="scroll-mt-32 max-w-4xl">
                  <h2 className="mb-12 text-3xl font-medium text-[#E07A5F] flex items-center gap-4">
                    {labels.articles} <span className="h-px flex-1 bg-[#3D405B]/10" />
                  </h2>
                  <CollapsibleList initial={3} wrapperClassName="space-y-12" buttonClassName="mt-12 mx-auto block uppercase tracking-widest text-sm font-semibold border-b border-[#E07A5F] text-[#E07A5F] pb-1 hover:text-[#3D405B] hover:border-[#3D405B] transition-colors">
                    {articles.map((article) => (
                      <a key={article.id} href={article.url} data-lf-track="article" data-lf-label={article.title} data-lf-id={article.id} target="_blank" rel="noreferrer" className="block group">
                        <h3 className="text-2xl font-medium text-[#3D405B] group-hover:text-[#E07A5F] transition-colors mb-3">{article.title}</h3>
                        {article.description && <p className="text-lg font-light text-[#3D405B]/80 mb-4">{article.description}</p>}
                        <div className="flex items-center gap-4 text-sm uppercase tracking-widest font-semibold text-[#E07A5F]">
                          {article.publishedAt && <span>{new Date(article.publishedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>}
                          {article.readTime && <span>{article.readTime} min read</span>}
                        </div>
                      </a>
                    ))}
                  </CollapsibleList>
                </section>
              ),
    github: contributionCalendar && (
                <section key="github" className="scroll-mt-32 max-w-5xl overflow-x-auto pb-4">
                  <h2 className="mb-12 text-3xl font-medium text-[#E07A5F] flex items-center gap-4">
                    {labels.github} <span className="h-px flex-1 bg-[#3D405B]/10" />
                  </h2>
                  <div className="min-w-[700px] bg-white p-8 rounded-3xl shadow-xs border border-[#3D405B]/5">
                    <GitHubContributionHeatmap
                      calendar={contributionCalendar}
                      profileUrl={githubProfile?.url}
                      username={githubProfile?.username}
                      variant="minimal"
                      label={labels.github}
                    />
                  </div>
                </section>
              ),
  };

  return (
    <div className={cn(TEMPLATE_CONTAINER, "min-h-screen bg-[#FDFBF7] text-[#3D405B] font-serif overflow-x-hidden")}>
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-12 md:py-24">

        <header className="mb-24 flex min-w-0 w-full flex-col @md:flex-row @md:items-center gap-12">
          <div className="min-w-0">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="min-w-0 text-balance [overflow-wrap:anywhere] text-2xl @sm:text-4xl @md:text-5xl @lg:text-7xl font-medium tracking-tight text-[#E07A5F]"
            >
              {portfolio.title}
            </motion.h1>
            {portfolio.headline && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-4 text-base @md:text-lg @lg:text-2xl text-[#3D405B]/80 font-light italic"
              >
                {portfolio.headline}
              </motion.p>
            )}

            <div className="mt-8 flex flex-col items-start gap-4">
              <ContactChips portfolio={portfolio} chipClassName="text-sm uppercase tracking-widest text-[#E07A5F]" />
              <SocialPills profiles={socialProfiles} className="text-[#3D405B] hover:text-[#E07A5F] transition-colors p-2" />
            </div>
          </div>
        </header>

        {navbarEnabled && (
          <nav className="mb-16 border-y border-[#3D405B]/10 py-4">
            <TemplateNavbar
              items={sections}
              className="justify-center md:justify-start gap-8 border-none"
              linkClassName="text-sm uppercase tracking-[0.2em] font-semibold text-[#3D405B] hover:text-[#E07A5F] transition-colors"
            />
          </nav>
        )}

        <main className="space-y-32">
          {renderSections(resolved, "full", blocks)}

          {customSections.map((cs) => (
                <section key={cs.id}>
                  <h2 className="mb-12 text-3xl font-medium text-[#E07A5F] flex items-center gap-4">
                    {cs.label} <span className="h-px flex-1 bg-[#3D405B]/10" />
                  </h2>
                  <CustomSectionItems
                    items={cs.items}
                    titleClassName="text-xl font-medium text-[#3D405B]"
                    textClassName="text-lg font-light text-[#3D405B]/80 mt-2"
                    chipClassName="inline-block mt-4 mr-4 text-xs uppercase tracking-widest font-semibold text-[#E07A5F]"
                    buttonClassName="mt-8 uppercase tracking-widest text-sm font-semibold border-b border-[#E07A5F] text-[#E07A5F] pb-1 hover:text-[#3D405B] hover:border-[#3D405B] transition-colors"
                  />
                </section>
              ))}

        </main>
      </div>
    </div>
  );
}