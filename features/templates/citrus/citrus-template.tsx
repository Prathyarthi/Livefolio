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


export function CitrusTemplate({ data }: { data: PortfolioData }) {
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
    getTemplateSectionLayout("citrus"),
    portfolio.customization,
  );
  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: portfolio.summary && (
                <section key="about" id="about" className="scroll-mt-32 max-w-4xl relative">
                  <div className="absolute -left-8 top-0 bottom-0 w-2 bg-[#E9C46A]" />
                  <h2 className="mb-6 text-4xl font-black text-[#264653] uppercase tracking-tight">{labels.about}</h2>
                  <DescriptionBlock
                    text={portfolio.summary}
                    paragraphClassName="text-xl leading-relaxed text-[#264653]/80 font-medium"
                    listClassName="space-y-2 pl-5 text-xl font-medium text-[#264653]/80 marker:text-[#F4A261]"
                  />
                </section>
              ),
    projects: projects.length > 0 && (
                <section key="projects" id="work" className="scroll-mt-32">
                  <h2 className="mb-12 text-4xl font-black text-[#264653] uppercase tracking-tight">{labels.projects}</h2>
                  <CollapsibleList initial={4} wrapperClassName={cn("grid min-w-0 grid-cols-1 gap-12", "@lg:grid-cols-2")} buttonClassName="mt-12 mx-auto bg-[#264653] text-white px-8 py-3 font-bold uppercase tracking-widest hover:bg-[#F4A261] transition-colors">
                    {projects.map((project) => (
                      <article key={project.id} className={cn(PROJECT_CARD, "group relative")}>
                        <div className="absolute inset-0 bg-[#E9C46A] translate-x-3 translate-y-3 rounded-2xl transition-transform group-hover:translate-x-4 group-hover:translate-y-4" />
                        <div className="relative flex flex-col overflow-hidden rounded-2xl border-4 border-[#264653] bg-white h-full">
                          <TemplateProjectPreview templateId="citrus"
                            liveUrl={project.liveUrl ?? null}
                            projectId={project.id}
                            livePreviewProjectIds={livePreviewProjectIds}
                            alt={project.title}
                            containerClassName="overflow-hidden border-b-4 border-[#264653] bg-[#264653]/10"
                            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="p-8 flex-1 flex flex-col">
                            <h3 className={cn(PROJECT_CARD_TITLE, "text-2xl font-black text-[#264653] mb-4 uppercase")}>{project.title}</h3>
                            {project.description && (
                              <DescriptionBlock
                                text={project.description}
                                paragraphClassName="mb-6 text-lg text-[#264653]/80"
                                listClassName="mb-6 space-y-2 pl-5 text-lg text-[#264653]/80 marker:text-[#F4A261]"
                              />
                            )}
                            <div className="flex flex-wrap gap-2 mb-8">
                              {project.techStack.map((tech) => (
                                <span key={tech} className="bg-[#FFFCF2] border-2 border-[#264653] px-3 py-1 text-xs font-bold text-[#264653] uppercase tracking-wider">
                                  {tech}
                                </span>
                              ))}
                            </div>
                            <div className="mt-auto flex gap-4">
                              {project.liveUrl && (
                                <a href={project.liveUrl} data-lf-track="project_live" data-lf-label={project.title} data-lf-id={project.id} target="_blank" rel="noreferrer" className="bg-[#F4A261] text-white px-5 py-2 font-bold uppercase tracking-wider border-2 border-[#264653] hover:bg-[#E9C46A] hover:text-[#264653] transition-colors">
                                  Live Demo
                                </a>
                              )}
                              {project.sourceUrl && (
                                <a href={project.sourceUrl} data-lf-track="project_source" data-lf-label={project.title} data-lf-id={project.id} target="_blank" rel="noreferrer" className="bg-white text-[#264653] px-5 py-2 font-bold uppercase tracking-wider border-2 border-[#264653] hover:bg-[#264653] hover:text-white transition-colors">
                                  Source
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </CollapsibleList>
                </section>
              ),
    experience: experiences.length > 0 && (
                <section key="experience" id="experience" className="scroll-mt-32 max-w-5xl">
                  <h2 className="mb-12 text-4xl font-black text-[#264653] uppercase tracking-tight">{labels.experience}</h2>
                  <CollapsibleList initial={4} wrapperClassName="space-y-8" buttonClassName="mt-12 bg-[#264653] text-white px-8 py-3 font-bold uppercase tracking-widest hover:bg-[#F4A261] transition-colors">
                    {experiences.map((exp) => (
                      <div key={exp.id} className="relative bg-white border-4 border-[#264653] p-8 rounded-xl shadow-[8px_8px_0_0_#F4A261]">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b-4 border-[#264653]/10 pb-6">
                          <div>
                            <h3 className="text-2xl font-black text-[#264653] uppercase">{exp.role}</h3>
                            <p className="text-xl font-bold text-[#F4A261] mt-1">{exp.company}</p>
                          </div>
                          <span className="bg-[#E9C46A] text-[#264653] px-4 py-2 font-bold uppercase tracking-widest border-2 border-[#264653] rounded">
                            {formatDateRange(exp.startDate, exp.endDate)}
                          </span>
                        </div>
                        {exp.description && (
                          <DescriptionBlock text={exp.description} paragraphClassName="text-[#264653]/90 text-lg leading-relaxed font-medium" />
                        )}
                      </div>
                    ))}
                  </CollapsibleList>
                </section>
              ),
    education: educations.length > 0 && (
                  <section key="education" className="scroll-mt-32">
                    <h2 className="mb-10 text-4xl font-black text-[#264653] uppercase tracking-tight">{labels.education}</h2>
                    <CollapsibleList initial={3} wrapperClassName="space-y-6" buttonClassName="mt-8 bg-[#264653] text-white px-8 py-3 font-bold uppercase tracking-widest hover:bg-[#F4A261] transition-colors">
                      {educations.map((edu) => (
                        <div key={edu.id} className="bg-white border-4 border-[#264653] p-6 rounded-xl shadow-[6px_6px_0_0_#264653]">
                          <h3 className="text-xl font-black text-[#264653] uppercase">
                            {edu.degree} {edu.field ? `in ${edu.field}` : ""}
                          </h3>
                          <p className="text-lg font-bold text-[#F4A261] mt-2">{edu.institution}</p>
                          <p className="mt-4 text-sm font-bold tracking-widest text-[#264653]/60 uppercase">{formatDateRange(edu.startDate, edu.endDate)}</p>
                        </div>
                      ))}
                    </CollapsibleList>
                  </section>
                ),
    skills: skills.length > 0 && (
                  <section key="skills" className="scroll-mt-32">
                    <h2 className="mb-10 text-4xl font-black text-[#264653] uppercase tracking-tight">{labels.skills}</h2>
                    <div className="space-y-8">
                      {Object.entries(groupedSkills).map(([category, items]) => (
                        <div key={category} className="bg-white border-4 border-[#264653] p-6 rounded-xl shadow-[6px_6px_0_0_#E9C46A]">
                          <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-[#F4A261]">{category}</h3>
                          <div className="flex flex-wrap gap-2">
                            {items.map((skill) => (
                              <span key={skill} className="bg-[#FFFCF2] border-2 border-[#264653] px-3 py-1.5 text-sm font-bold text-[#264653]">
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
                      <h2 className="mb-10 text-4xl font-black text-[#264653] uppercase tracking-tight">{labels.certifications}</h2>
                      <CollapsibleList initial={3} wrapperClassName="space-y-6" buttonClassName="mt-8 bg-[#264653] text-white px-8 py-3 font-bold uppercase tracking-widest hover:bg-[#F4A261] transition-colors">
                        {certifications.map((cert) => (
                          <div key={cert.id} className="bg-[#E9C46A]/20 border-l-8 border-[#F4A261] p-6">
                            <h3 className="text-lg font-black text-[#264653] uppercase">
                              {cert.url ? (
                                <a href={cert.url} target="_blank" rel="noreferrer" className="hover:text-[#F4A261] transition-colors">{cert.name}</a>
                              ) : cert.name}
                            </h3>
                            <p className="text-base font-bold text-[#264653]/70 mt-1">{cert.issuer}</p>
                          </div>
                        ))}
                      </CollapsibleList>
                    </section>
                  ),
    achievements: achievements.length > 0 && (
                    <section key="achievements">
                      <h2 className="mb-10 text-4xl font-black text-[#264653] uppercase tracking-tight">{labels.achievements}</h2>
                      <CollapsibleList initial={3} wrapperClassName="space-y-6" buttonClassName="mt-8 bg-[#264653] text-white px-8 py-3 font-bold uppercase tracking-widest hover:bg-[#F4A261] transition-colors">
                        {achievements.map((ach) => (
                          <div key={ach.id} className="flex gap-4 bg-[#F4A261]/20 border-l-8 border-[#E9C46A] p-6">
                            <Trophy className="h-8 w-8 text-[#F4A261] shrink-0" />
                            <div>
                              <h3 className="text-lg font-black text-[#264653] uppercase">{ach.title}</h3>
                              {ach.date && (
                                <p className="text-sm font-bold tracking-widest text-[#264653]/60 uppercase mt-2">
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
                <section key="articles" id="articles" className="scroll-mt-32 max-w-5xl">
                  <h2 className="mb-12 text-4xl font-black text-[#264653] uppercase tracking-tight">{labels.articles}</h2>
                  <CollapsibleList initial={3} wrapperClassName="grid gap-8 md:grid-cols-2" buttonClassName="mt-12 mx-auto bg-[#264653] text-white px-8 py-3 font-bold uppercase tracking-widest hover:bg-[#F4A261] transition-colors">
                    {articles.map((article) => (
                      <a key={article.id} href={article.url} data-lf-track="article" data-lf-label={article.title} data-lf-id={article.id} target="_blank" rel="noreferrer" className="block bg-white border-4 border-[#264653] p-8 rounded-xl shadow-[8px_8px_0_0_#264653] hover:-translate-y-2 hover:shadow-[12px_12px_0_0_#F4A261] transition-all">
                        <h3 className="text-2xl font-black text-[#264653] uppercase mb-4">{article.title}</h3>
                        {article.description && <p className="text-lg font-medium text-[#264653]/80 mb-6">{article.description}</p>}
                        <div className="flex items-center gap-4 text-sm font-bold tracking-widest uppercase text-[#F4A261]">
                          {article.publishedAt && <span>{new Date(article.publishedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>}
                          {article.readTime && <span>{article.readTime} min read</span>}
                        </div>
                      </a>
                    ))}
                  </CollapsibleList>
                </section>
              ),
    github: contributionCalendar && (
                <section key="github" className="scroll-mt-32 max-w-6xl overflow-x-auto pb-4">
                  <h2 className="mb-12 text-4xl font-black text-[#264653] uppercase tracking-tight">{labels.github}</h2>
                  <div className="min-w-[700px] bg-white border-4 border-[#264653] p-8 rounded-xl shadow-[8px_8px_0_0_#E9C46A]">
                    <GitHubContributionHeatmap
                      calendar={contributionCalendar}
                      profileUrl={githubProfile?.url}
                      username={githubProfile?.username}
                      variant="creative"
                      label={labels.github}
                    />
                  </div>
                </section>
              ),
  };

  return (
    <div className={cn(TEMPLATE_CONTAINER, "min-h-screen bg-[#FFFCF2] text-[#264653] font-sans font-medium overflow-x-hidden")}>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8 md:py-20">

        {navbarEnabled && (
          <nav className="mb-16">
            <TemplateNavbar
              items={sections}
              className="justify-start gap-4 md:gap-8 border-none bg-transparent"
              linkClassName="text-sm font-bold uppercase tracking-widest text-[#264653] hover:text-[#F4A261] transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-1 after:bg-[#F4A261] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left"
            />
          </nav>
        )}

        <header className="mb-24 relative">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-[#E9C46A] rounded-full mix-blend-multiply blur-2xl opacity-60 pointer-events-none" />
          <div className="absolute top-20 right-40 w-48 h-48 bg-[#F4A261] rounded-full mix-blend-multiply blur-2xl opacity-60 pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row gap-12 items-start">
            <div className="flex-1">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="min-w-0 text-balance [overflow-wrap:anywhere] text-2xl @sm:text-4xl @md:text-6xl @lg:text-8xl font-black tracking-tighter text-[#264653] uppercase leading-none"
              >
                {portfolio.title}
              </motion.h1>
              {portfolio.headline && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mt-6 text-2xl md:text-3xl text-[#F4A261] font-bold tracking-tight"
                >
                  {portfolio.headline}
                </motion.p>
              )}

              <div className="mt-8 flex flex-col gap-4">
                <ContactChips portfolio={portfolio} chipClassName="text-sm font-bold text-[#264653] bg-[#E9C46A]/30 px-3 py-1.5 rounded" />
                <SocialPills profiles={socialProfiles} className="bg-[#264653] hover:bg-[#F4A261] text-white rounded p-2 transition-colors" />
              </div>
            </div>

          </div>
        </header>

        <main className="space-y-32">
          {renderSections(resolved, "full", blocks)}

          {customSections.map((cs) => (
                <section key={cs.id}>
                  <h2 className="mb-12 text-4xl font-black text-[#264653] uppercase tracking-tight">{cs.label}</h2>
                  <CustomSectionItems
                    items={cs.items}
                    titleClassName="text-2xl font-black text-[#264653] uppercase"
                    textClassName="text-lg font-medium text-[#264653]/80 mt-2"
                    chipClassName="inline-block mt-4 mr-4 bg-[#FFFCF2] border-2 border-[#264653] px-3 py-1.5 text-xs font-bold text-[#264653] uppercase tracking-wider"
                    buttonClassName="mt-12 bg-[#264653] text-white px-8 py-3 font-bold uppercase tracking-widest hover:bg-[#F4A261] transition-colors inline-block"
                  />
                </section>
              ))}

        </main>
      </div>
    </div>
  );
}