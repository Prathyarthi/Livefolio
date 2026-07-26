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


export function ParchmentTemplate({ data }: { data: PortfolioData }) {
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
    getTemplateSectionLayout("parchment"),
    portfolio.customization,
  );
  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: portfolio.summary && (
                <section key="about" id="about" className="scroll-mt-32">
                  <div className="flex items-center gap-6 mb-8">
                    <h2 className="text-3xl font-black uppercase tracking-widest whitespace-nowrap">{labels.about}</h2>
                    <div className="h-px w-full bg-[#2B2B2B]" />
                  </div>
                  <div className="md:col-span-2 text-justify">
                    <DescriptionBlock
                      text={portfolio.summary}
                      paragraphClassName="text-xl leading-relaxed font-normal mb-4"
                      listClassName="space-y-2 pl-8 text-xl font-normal list-disc"
                    />
                  </div>
                </section>
              ),
    projects: projects.length > 0 && (
                <section key="projects" id="work" className="scroll-mt-32">
                  <div className="flex items-center gap-6 mb-12">
                    <h2 className="text-3xl font-black uppercase tracking-widest whitespace-nowrap">{labels.projects}</h2>
                    <div className="h-px w-full bg-[#2B2B2B]" />
                  </div>
                  <CollapsibleList initial={3} wrapperClassName="space-y-16" buttonClassName="mt-12 mx-auto block uppercase tracking-[0.2em] font-bold border-2 border-[#2B2B2B] px-8 py-3 hover:bg-[#2B2B2B] hover:text-[#F1EEDC] transition-colors">
                    {projects.map((project, idx) => (
                      <article key={project.id} className={cn(PROJECT_CARD, "grid grid-cols-1 min-w-0 @md:grid-cols-12 gap-8 items-start")}>
                        <div className={cn("@md:col-span-5", idx % 2 !== 0 && "@md:order-last")}>
                          <div className="border-2 border-[#2B2B2B] bg-white p-1">
                            <TemplateProjectPreview templateId="parchment"
                              liveUrl={project.liveUrl ?? null}
                              projectId={project.id}
                              livePreviewProjectIds={livePreviewProjectIds}
                              alt={project.title}
                              containerClassName="overflow-hidden bg-white"
                              className="h-full w-full object-cover object-top filter transition-all duration-700"
                            />
                          </div>
                        </div>

                        <div className="@md:col-span-7 flex flex-col h-full justify-center">
                          <h3 className={cn(PROJECT_CARD_TITLE, "text-4xl font-black uppercase mb-4 text-[#8C2727]")}>{project.title}</h3>
                          {project.description && (
                            <DescriptionBlock
                              text={project.description}
                              paragraphClassName="mb-6 text-xl leading-relaxed text-justify"
                              listClassName="mb-6 space-y-2 pl-8 text-xl leading-relaxed text-justify list-disc"
                            />
                          )}
                          <div className="flex flex-wrap gap-2 mb-8">
                            {project.techStack.map((tech) => (
                              <span key={tech} className="border border-[#2B2B2B] px-3 py-1 text-sm font-bold uppercase tracking-widest">
                                {tech}
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-6 mt-auto">
                            {project.liveUrl && (
                              <a href={project.liveUrl} data-lf-track="project_live" data-lf-label={project.title} data-lf-id={project.id} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-bold uppercase tracking-widest border-b-2 border-[#8C2727] text-[#8C2727] hover:text-[#2B2B2B] hover:border-[#2B2B2B] transition-colors pb-1">
                                Examine
                              </a>
                            )}
                            {project.sourceUrl && (
                              <a href={project.sourceUrl} data-lf-track="project_source" data-lf-label={project.title} data-lf-id={project.id} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-bold uppercase tracking-widest border-b-2 border-[#2B2B2B] text-[#2B2B2B] hover:text-[#8C2727] hover:border-[#8C2727] transition-colors pb-1">
                                Manuscript
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
                <section key="experience" id="experience" className="scroll-mt-32">
                  <div className="flex items-center gap-6 mb-12">
                    <h2 className="text-3xl font-black uppercase tracking-widest whitespace-nowrap">{labels.experience}</h2>
                    <div className="h-px w-full bg-[#2B2B2B]" />
                  </div>
                  <CollapsibleList initial={3} wrapperClassName="grid md:grid-cols-2 gap-x-12 gap-y-16" buttonClassName="mt-16 mx-auto block uppercase tracking-[0.2em] font-bold border-2 border-[#2B2B2B] px-8 py-3 hover:bg-[#2B2B2B] hover:text-[#F1EEDC] transition-colors">
                    {experiences.map((exp) => (
                      <div key={exp.id} className="relative">
                        <div className="border-b-2 border-[#2B2B2B] mb-4 pb-4">
                          <h3 className="text-2xl font-black uppercase">{exp.role}</h3>
                          <div className="flex justify-between items-baseline mt-2">
                            <p className="text-xl font-bold italic text-[#8C2727]">{exp.company}</p>
                            <span className="font-bold tracking-widest uppercase text-sm">{formatDateRange(exp.startDate, exp.endDate)}</span>
                          </div>
                        </div>
                        {exp.description && (
                          <DescriptionBlock text={exp.description} paragraphClassName="text-lg leading-relaxed text-justify" />
                        )}
                      </div>
                    ))}
                  </CollapsibleList>
                </section>
              ),
    education: educations.length > 0 && (
                  <section key="education" className="scroll-mt-32">
                    <div className="flex items-center gap-6 mb-10">
                      <h2 className="text-3xl font-black uppercase tracking-widest whitespace-nowrap">{labels.education}</h2>
                      <div className="h-px w-full bg-[#2B2B2B]" />
                    </div>
                    <CollapsibleList initial={3} wrapperClassName="space-y-10" buttonClassName="mt-8 uppercase tracking-[0.2em] font-bold border-b-2 border-[#2B2B2B] pb-1 hover:text-[#8C2727] transition-colors">
                      {educations.map((edu) => (
                        <div key={edu.id} className="relative pl-6 border-l-4 border-[#2B2B2B]">
                          <h3 className="text-xl font-black uppercase">
                            {edu.degree} {edu.field ? `in ${edu.field}` : ""}
                          </h3>
                          <p className="text-lg font-bold italic text-[#8C2727] mt-1">{edu.institution}</p>
                          <p className="mt-3 text-sm font-bold tracking-widest uppercase">{formatDateRange(edu.startDate, edu.endDate)}</p>
                        </div>
                      ))}
                    </CollapsibleList>
                  </section>
                ),
    skills: skills.length > 0 && (
                  <section key="skills" className="scroll-mt-32">
                    <div className="flex items-center gap-6 mb-10">
                      <h2 className="text-3xl font-black uppercase tracking-widest whitespace-nowrap">{labels.skills}</h2>
                      <div className="h-px w-full bg-[#2B2B2B]" />
                    </div>
                    <div className="space-y-10">
                      {Object.entries(groupedSkills).map(([category, items]) => (
                        <div key={category}>
                          <h3 className="mb-4 text-sm font-black uppercase tracking-[0.2em] border-b border-[#2B2B2B] pb-2 inline-block">{category}</h3>
                          <div className="flex flex-wrap gap-x-6 gap-y-3 mt-4">
                            {items.map((skill) => (
                              <span key={skill} className="text-lg font-bold">
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
                      <div className="flex items-center gap-6 mb-10">
                        <h2 className="text-3xl font-black uppercase tracking-widest whitespace-nowrap">{labels.certifications}</h2>
                        <div className="h-px w-full bg-[#2B2B2B]" />
                      </div>
                      <CollapsibleList initial={3} wrapperClassName="space-y-8" buttonClassName="mt-8 uppercase tracking-[0.2em] font-bold border-b-2 border-[#2B2B2B] pb-1 hover:text-[#8C2727] transition-colors">
                        {certifications.map((cert) => (
                          <div key={cert.id} className="border border-[#2B2B2B] p-6 text-center">
                            <h3 className="text-lg font-black uppercase">
                              {cert.url ? (
                                <a href={cert.url} target="_blank" rel="noreferrer" className="hover:text-[#8C2727] transition-colors">{cert.name}</a>
                              ) : cert.name}
                            </h3>
                            <p className="text-base font-bold italic mt-2 text-[#8C2727]">{cert.issuer}</p>
                          </div>
                        ))}
                      </CollapsibleList>
                    </section>
                  ),
    achievements: achievements.length > 0 && (
                    <section key="achievements">
                      <div className="flex items-center gap-6 mb-10">
                        <h2 className="text-3xl font-black uppercase tracking-widest whitespace-nowrap">{labels.achievements}</h2>
                        <div className="h-px w-full bg-[#2B2B2B]" />
                      </div>
                      <CollapsibleList initial={3} wrapperClassName="space-y-8" buttonClassName="mt-8 uppercase tracking-[0.2em] font-bold border-b-2 border-[#2B2B2B] pb-1 hover:text-[#8C2727] transition-colors">
                        {achievements.map((ach) => (
                          <div key={ach.id} className="flex gap-6 items-center">
                            <Trophy className="h-10 w-10 text-[#8C2727] shrink-0" strokeWidth={1.5} />
                            <div>
                              <h3 className="text-lg font-black uppercase">{ach.title}</h3>
                              {ach.date && (
                                <p className="text-sm font-bold tracking-widest uppercase mt-2">
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
                <section key="articles" id="articles" className="scroll-mt-32">
                  <div className="flex items-center gap-6 mb-12">
                    <h2 className="text-3xl font-black uppercase tracking-widest whitespace-nowrap">{labels.articles}</h2>
                    <div className="h-px w-full bg-[#2B2B2B]" />
                  </div>
                  <CollapsibleList initial={3} wrapperClassName="grid md:grid-cols-2 gap-8" buttonClassName="mt-12 mx-auto block uppercase tracking-[0.2em] font-bold border-2 border-[#2B2B2B] px-8 py-3 hover:bg-[#2B2B2B] hover:text-[#F1EEDC] transition-colors">
                    {articles.map((article) => (
                      <a key={article.id} href={article.url} data-lf-track="article" data-lf-label={article.title} data-lf-id={article.id} target="_blank" rel="noreferrer" className="block border-2 border-[#2B2B2B] p-8 hover:bg-[#2B2B2B] hover:text-[#F1EEDC] transition-all group">
                        <h3 className="text-2xl font-black uppercase mb-4 group-hover:text-[#8C2727] transition-colors">{article.title}</h3>
                        {article.description && <p className="text-lg leading-relaxed mb-6 font-normal group-hover:text-[#F1EEDC]/80">{article.description}</p>}
                        <div className="flex items-center gap-4 text-xs font-bold tracking-widest uppercase">
                          {article.publishedAt && <span>{new Date(article.publishedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>}
                          {article.readTime && <span>{article.readTime} min read</span>}
                        </div>
                      </a>
                    ))}
                  </CollapsibleList>
                </section>
              ),
    github: contributionCalendar && (
                <section key="github" className="scroll-mt-32 overflow-x-auto pb-4">
                  <div className="flex items-center gap-6 mb-12">
                    <h2 className="text-3xl font-black uppercase tracking-widest whitespace-nowrap">{labels.github}</h2>
                    <div className="h-px w-full bg-[#2B2B2B]" />
                  </div>
                  <div className="min-w-[700px] border-4 border-[#2B2B2B] p-8 bg-white">
                    <GitHubContributionHeatmap
                      calendar={contributionCalendar}
                      profileUrl={githubProfile?.url}
                      username={githubProfile?.username}
                      variant="corporate"
                      label={labels.github}
                    />
                  </div>
                </section>
              ),
  };

  return (
    <div className={cn(TEMPLATE_CONTAINER, "min-h-screen bg-[#F1EEDC] text-[#2B2B2B] font-serif overflow-x-hidden selection:bg-[#8C2727] selection:text-[#F1EEDC]")}>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 md:py-16">

        <header className="mb-16 border-b-4 border-double border-[#2B2B2B] pb-12 text-center relative">
          <div className="absolute top-0 left-0 w-full h-1 border-b border-[#2B2B2B]" />
          <div className="absolute top-2 left-0 w-full h-px bg-[#2B2B2B]" />

          <div className="pt-12">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="min-w-0 text-balance [overflow-wrap:anywhere] text-2xl @sm:text-4xl @md:text-6xl @lg:text-8xl font-black tracking-tight uppercase"
              style={{ fontVariant: "small-caps" }}
            >
              {portfolio.title}
            </motion.h1>
            {portfolio.headline && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-6 text-lg @md:text-xl @lg:text-3xl font-normal italic text-[#8C2727] px-4 @md:px-8"
              >
                {portfolio.headline}
              </motion.p>
            )}

            <div className="mt-10 flex flex-col items-center gap-6">
              <ContactChips portfolio={portfolio} chipClassName="text-sm font-semibold tracking-widest uppercase border-b border-[#2B2B2B] pb-1" />
              <SocialPills profiles={socialProfiles} className="text-[#2B2B2B] border border-[#2B2B2B] p-2 hover:bg-[#2B2B2B] hover:text-[#F1EEDC] transition-all" />
            </div>
          </div>
        </header>

        {navbarEnabled && (
          <nav className="mb-16 border-y-2 border-[#2B2B2B] py-3">
            <TemplateNavbar
              items={sections}
              className="justify-center gap-6 md:gap-12 border-none bg-transparent"
              linkClassName="text-sm md:text-base font-bold uppercase tracking-[0.2em] text-[#2B2B2B] hover:text-[#8C2727] transition-colors"
            />
          </nav>
        )}

        <main className="space-y-32">
          {renderSections(resolved, "full", blocks)}

          {customSections.map((cs) => (
                <section key={cs.id}>
                  <div className="flex items-center gap-6 mb-12">
                    <h2 className="text-3xl font-black uppercase tracking-widest whitespace-nowrap">{cs.label}</h2>
                    <div className="h-px w-full bg-[#2B2B2B]" />
                  </div>
                  <CustomSectionItems
                    items={cs.items}
                    titleClassName="text-2xl font-black uppercase"
                    textClassName="text-xl leading-relaxed mt-2"
                    chipClassName="inline-block mt-4 mr-4 border border-[#2B2B2B] px-3 py-1 text-sm font-bold uppercase tracking-widest"
                    buttonClassName="mt-12 block uppercase tracking-[0.2em] font-bold border-2 border-[#2B2B2B] px-8 py-3 hover:bg-[#2B2B2B] hover:text-[#F1EEDC] transition-colors w-max"
                  />
                </section>
              ))}

        </main>
      </div>
    </div>
  );
}