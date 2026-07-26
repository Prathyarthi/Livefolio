import type { PortfolioData } from "../types";
import { getTemplateSectionLayout } from "../section-layouts";
import {
  renderSections,
  resolveSectionLayout,
  type ReorderableSectionKey,
} from "../section-order";
import { cn } from "@/lib/utils";
import {
  GitHubContributionHeatmap,
  parseContributionCalendar,
} from "../github-contribution-heatmap";
import { ArrowUpRight, Star } from "lucide-react";
import {
  buildTemplateSections,
  ContactChips,
  getSectionLabels,
  CustomSectionItems,
  DescriptionBlock,
  HeroProfileButtons,
  ProfileLinksSection,
  ProjectActions,
  PROJECT_CARD,
  PROJECT_CARD_BODY,
  PROJECT_CARD_HEADER,
  PROJECT_CARD_TITLE,
  PROJECTS_GRID_2,
  SocialPills,
  SPLIT_CARD_ROW,
  TEMPLATE_CONTAINER,
  TemplateNavbar,
} from "../shared";
import { CollapsibleList } from "../collapsible-list";
import { formatDateRange, groupSkillsByCategory } from "../utils";
import { TemplateProjectPreview } from "@/components/template-project-preview";


export function SpaceTemplate({ data }: { data: PortfolioData }) {
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
    getTemplateSectionLayout("space"),
    portfolio.customization,
  );
  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: portfolio.summary && (
                <section key="about" id="about" className="scroll-mt-32">
                  <div className="rounded-3xl bg-[#0B0F19]/60 backdrop-blur-xl border border-cyan-900/30 p-8 md:p-12 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-cyan-500/30 transition-colors duration-500">
                    <SectionHeading>{labels.about}</SectionHeading>
                    <DescriptionBlock
                      text={portfolio.summary}
                      paragraphClassName="text-lg leading-relaxed text-slate-300"
                      listClassName="space-y-2 pl-5 text-lg leading-relaxed text-slate-300 marker:text-cyan-500"
                    />
                  </div>
                </section>
              ),
    projects: visibleProjects.length > 0 && (
                <section key="projects" id="work" className="scroll-mt-32">
                  <SectionHeading>{labels.projects}</SectionHeading>
                  <CollapsibleList
                    initial={4}
                    wrapperClassName={cn(PROJECTS_GRID_2, "gap-8")}
                    buttonClassName="col-span-full mt-8 mx-auto rounded-full border border-cyan-500/30 bg-cyan-950/30 px-8 py-3 text-sm font-semibold uppercase tracking-wider text-cyan-400 transition-all hover:bg-cyan-900/50 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                  >
                    {visibleProjects.map((project) => (
                      <article
                        key={project.id}
                        className={cn(
                          PROJECT_CARD,
                          "group flex flex-col rounded-3xl border border-cyan-900/30 bg-[#0B0F19]/60 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]"
                        )}
                      >
                        <div className="relative">
                          <TemplateProjectPreview templateId="space"
                            liveUrl={project.liveUrl ?? null}
                            projectId={project.id}
                            livePreviewProjectIds={livePreviewProjectIds}
                            alt={project.title}
                            loading="lazy"
                            containerClassName="overflow-hidden bg-[#030014]"
                            className="h-full w-full object-cover object-top opacity-80 transition-transform duration-700 group-hover:scale-110 group-hover:opacity-100"
                          />
                        </div>
                        <div className={cn(PROJECT_CARD_BODY, "relative z-20 flex flex-col grow p-8")}>
                          <div className={cn(PROJECT_CARD_HEADER, "mb-4")}>
                            <h3 className={cn(PROJECT_CARD_TITLE, "text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors")}>
                              {project.title}
                            </h3>
                            <ProjectActions
                              liveUrl={project.liveUrl}
                              sourceUrl={project.sourceUrl}
                              label={project.title}
                              projectId={project.id}
                              liveClassName="rounded-full bg-cyan-600/20 p-2 text-cyan-400 hover:bg-cyan-500 hover:text-white transition-colors border border-cyan-500/30"
                              sourceClassName="rounded-full bg-white/5 p-2 text-slate-300 hover:bg-white/20 transition-colors border border-white/10"
                            />
                          </div>

                          {project.description && (
                            <DescriptionBlock
                              text={project.description}
                              paragraphClassName="text-slate-400 leading-relaxed mb-6 grow"
                              listClassName="mb-6 grow space-y-2 pl-5 text-slate-400 leading-relaxed marker:text-cyan-500"
                            />
                          )}

                          <div className="mt-auto pt-6 border-t border-cyan-900/30 flex flex-wrap items-center gap-2">
                            {project.techStack.map((tech) => (
                              <span
                                key={tech}
                                className="rounded-full bg-[#030014] px-3 py-1 text-xs font-medium text-cyan-300 border border-cyan-900/50"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      </article>
                    ))}
                  </CollapsibleList>
                </section>
              ),
    experience: experiences.length > 0 && (
                  <section key="experience" id="experience" className="scroll-mt-32">
                    <SectionHeading>{labels.experience}</SectionHeading>
                    <CollapsibleList
                      initial={4}
                      wrapperClassName="space-y-6"
                      buttonClassName="mt-6 rounded-full border border-cyan-500/30 bg-cyan-950/30 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-cyan-400 transition-all hover:bg-cyan-900/50 hover:border-cyan-400/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                    >
                      {experiences.map((exp) => (
                        <article
                          key={exp.id}
                          className="rounded-3xl bg-[#0B0F19]/60 backdrop-blur-xl border border-cyan-900/30 p-8 transition-all hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-white">
                                {exp.role}
                              </h3>
                              <p className="text-cyan-400 font-medium mt-1">
                                {exp.company}
                                {exp.location ? <span className="text-slate-500"> · {exp.location}</span> : ""}
                              </p>
                            </div>
                            {(exp.startDate || exp.endDate) && (
                              <span className="rounded-full bg-cyan-950/50 px-3 py-1 text-xs font-medium text-cyan-300 border border-cyan-900/50">
                                {formatDateRange(exp.startDate, exp.endDate)}
                              </span>
                            )}
                          </div>
                          {exp.description && (
                            <DescriptionBlock
                              text={exp.description}
                              paragraphClassName="text-slate-400 leading-relaxed"
                              listClassName="space-y-2 pl-5 text-slate-400 leading-relaxed marker:text-cyan-500"
                            />
                          )}
                        </article>
                      ))}
                    </CollapsibleList>
                  </section>
                ),
    education: educations.length > 0 && (
                    <section key="education">
                      <SectionHeading>{labels.education}</SectionHeading>
                      <CollapsibleList
                        initial={4}
                        wrapperClassName="space-y-4"
                        buttonClassName="mt-6 rounded-full border border-cyan-500/30 bg-cyan-950/30 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-cyan-400 transition-all hover:bg-cyan-900/50 hover:border-cyan-400/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                      >
                        {educations.map((edu) => (
                          <article
                            key={edu.id}
                            className="rounded-2xl bg-[#0B0F19]/60 backdrop-blur-xl border border-cyan-900/30 p-6"
                          >
                            <h3 className="text-lg font-bold text-white">
                              {edu.degree}
                              {edu.field && <span className="text-slate-400 font-normal"> in {edu.field}</span>}
                            </h3>
                            <p className="text-violet-400 mt-1">{edu.institution}</p>
                            <div className="flex items-center justify-between mt-4">
                              {(edu.startDate || edu.endDate) && (
                                <span className="text-sm text-slate-500">
                                  {formatDateRange(edu.startDate, edu.endDate)}
                                </span>
                              )}
                              {edu.gpa && <span className="text-sm font-medium text-slate-300">GPA: {edu.gpa}</span>}
                            </div>
                          </article>
                        ))}
                      </CollapsibleList>
                    </section>
                  ),
    skills: skills.length > 0 && (
                    <section key="skills">
                      <SectionHeading>{labels.skills}</SectionHeading>
                      <div className="rounded-3xl bg-[#0B0F19]/60 backdrop-blur-xl border border-cyan-900/30 p-8">
                        <div className="space-y-8">
                          {Object.entries(groupedSkills).map(([category, names]) => (
                            <div key={category}>
                              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
                                {category}
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                {names.map((name) => (
                                  <span
                                    key={name}
                                    className="rounded-xl bg-[#030014] px-4 py-2 text-sm font-medium text-cyan-100 border border-cyan-900/50 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors cursor-default shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                                  >
                                    {name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  ),
    certifications: certifications.length > 0 && (
                    <section key="certifications">
                      <SectionHeading>{labels.certifications}</SectionHeading>
                      <CollapsibleList
                        initial={4}
                        wrapperClassName="space-y-4"
                        buttonClassName="mt-6 rounded-full border border-cyan-500/30 bg-cyan-950/30 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-cyan-400 transition-all hover:bg-cyan-900/50 hover:border-cyan-400/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                      >
                        {certifications.map((cert) => (
                          <article
                            key={cert.id}
                            className={cn(SPLIT_CARD_ROW, "rounded-2xl bg-[#0B0F19]/60 backdrop-blur-xl border border-cyan-900/30 p-6 transition-all hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]")}
                          >
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-white">
                                {cert.url ? (
                                  <a href={cert.url} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">
                                    {cert.name}
                                  </a>
                                ) : (
                                  cert.name
                                )}
                              </h3>
                              <p className="text-xs text-slate-400 mt-1">{cert.issuer}</p>
                            </div>
                            {cert.issueDate && (
                              <span className="text-xs font-medium text-cyan-300 bg-cyan-950/50 px-2 py-1 rounded-md border border-cyan-900/50">
                                {new Date(cert.issueDate).getFullYear()}
                              </span>
                            )}
                          </article>
                        ))}
                      </CollapsibleList>
                    </section>
                  ),
    achievements: achievements.length > 0 && (
                    <section key="achievements">
                      <SectionHeading>{labels.achievements}</SectionHeading>
                      <CollapsibleList
                        initial={4}
                        wrapperClassName="space-y-4"
                        buttonClassName="mt-6 rounded-full border border-cyan-500/30 bg-cyan-950/30 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-cyan-400 transition-all hover:bg-cyan-900/50 hover:border-cyan-400/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                      >
                        {achievements.map((ach) => (
                          <article
                            key={ach.id}
                            className="rounded-2xl bg-[#0B0F19]/60 backdrop-blur-xl border border-cyan-900/30 p-6 flex items-start gap-4 transition-all hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                          >
                            <div className="bg-cyan-950/50 p-2 rounded-lg border border-cyan-900/50 text-cyan-400 shrink-0">
                              <Star className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white leading-relaxed">{ach.title}</p>
                              {ach.date && (
                                <p className="text-xs text-slate-400 mt-1">
                                  {new Date(ach.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                                </p>
                              )}
                            </div>
                          </article>
                        ))}
                      </CollapsibleList>
                    </section>
                  ),
    articles: articles.length > 0 && (
                <section key="articles" id="writing" className="scroll-mt-32">
                  <SectionHeading>{labels.articles}</SectionHeading>
                  <CollapsibleList
                    initial={4}
                    wrapperClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    buttonClassName="col-span-full mt-8 mx-auto rounded-full border border-cyan-500/30 bg-cyan-950/30 px-8 py-3 text-sm font-semibold uppercase tracking-wider text-cyan-400 transition-all hover:bg-cyan-900/50 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                  >
                    {articles.map((article) => (
                      <article
                        key={article.id}
                        className="rounded-3xl bg-[#0B0F19]/60 backdrop-blur-xl border border-cyan-900/30 p-6 transition-all hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:-translate-y-1"
                      >
                        <h3 className="text-lg font-bold text-white mb-3">
                          <a
                            href={article.url} data-lf-track="article" data-lf-label={article.title} data-lf-id={article.id}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-cyan-400 transition-colors flex items-center justify-between group"
                          >
                            <span className="truncate pr-4">{article.title}</span>
                            <ArrowUpRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-cyan-400" />
                          </a>
                        </h3>
                        {article.description && (
                          <p className="text-sm text-slate-400 line-clamp-3 mb-4">
                            {article.description}
                          </p>
                        )}
                        <div className="mt-auto flex flex-wrap items-center gap-3 text-xs text-slate-500">
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
                      </article>
                    ))}
                  </CollapsibleList>
                </section>
              ),
    profiles: hasProfiles && (
                <section key="profiles" id="profiles" className="scroll-mt-32">
                  <SectionHeading>{labels.profiles}</SectionHeading>
                  <div className="rounded-3xl bg-[#0B0F19]/60 backdrop-blur-xl border border-cyan-900/30 p-8">
                    <ProfileLinksSection
                      portfolio={portfolio}
                      profiles={socialProfiles}
                      chipClassName="rounded-full border border-cyan-900/50 bg-[#030014] px-4 py-2 text-sm font-medium text-cyan-100 transition-all hover:bg-cyan-950/50 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                      pillClassName="rounded-full border border-cyan-900/50 bg-[#030014] px-4 py-2 text-sm font-medium text-cyan-100 transition-all hover:bg-cyan-950/50 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                      titleClassName="text-white font-bold"
                      textClassName="text-slate-400"
                    />
                  </div>
                </section>
              ),
    github: contributionCalendar && (
                <section key="github" className="scroll-mt-32">
                  <SectionHeading>{labels.github}</SectionHeading>
                  <div className="rounded-3xl bg-[#0B0F19]/60 backdrop-blur-xl border border-cyan-900/30 p-8 overflow-x-auto custom-scrollbar">
                    <GitHubContributionHeatmap
                      calendar={contributionCalendar}
                      profileUrl={githubProfile?.url}
                      username={githubProfile?.username}
                      variant="modern"
                      label={labels.github}
                    />
                  </div>
                </section>
              ),
  };

  return (
    <div className={cn(TEMPLATE_CONTAINER, "min-h-screen bg-[#030014] text-slate-300 font-sans selection:bg-cyan-500/30 overflow-hidden relative")}>
      {/* Deep Space Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/10 blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[150px]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-40 mix-blend-screen" />
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 md:px-8 md:pb-24 md:pt-16 relative z-10">
        {navbarEnabled && (
          <div className="mb-12 flex justify-center sticky top-6 z-50">
            <TemplateNavbar
              items={sections}
              className="rounded-full bg-[#0B0F19]/80 backdrop-blur-xl border border-cyan-900/30 shadow-[0_0_30px_rgba(6,182,212,0.1)] px-2 py-2"
              linkClassName="px-5 py-2 text-sm font-medium text-cyan-100/70 transition-all hover:text-cyan-300 hover:bg-cyan-950/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] rounded-full"
            />
          </div>
        )}

        <header className="relative mb-24 flex min-w-0 w-full flex-col items-center text-center">
          <h1 className="min-w-0 text-balance [overflow-wrap:anywhere] text-2xl @sm:text-4xl @md:text-5xl @lg:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-linear-to-b from-white to-slate-400 mb-6">
            {portfolio.title}
          </h1>

          {portfolio.headline && (
            <p className="text-base @md:text-lg @lg:text-2xl text-cyan-100/60 font-medium max-w-3xl mb-10 leading-relaxed">
              {portfolio.headline}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-4">
            <ContactChips
              portfolio={portfolio}
              chipClassName="rounded-full border border-cyan-900/50 bg-[#0B0F19]/80 backdrop-blur-md px-6 py-3 text-sm font-medium text-cyan-100 transition-all hover:bg-cyan-950/50 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            />
            <HeroProfileButtons
              profiles={socialProfiles}
              className="rounded-full bg-cyan-600 px-8 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:bg-cyan-500"
            />
          </div>

          {socialProfiles.length > 0 && (
            <div className="mt-8">
              <SocialPills
                profiles={socialProfiles}
                showUsername
                className="rounded-full border border-white/5 bg-transparent px-4 py-2 text-sm font-medium text-slate-400 transition-all hover:text-cyan-300 hover:bg-white/5"
              />
            </div>
          )}
        </header>

        <div className="space-y-24">
          {renderSections(resolved, "full", blocks)}

          {customSections.length > 0 && customSections.map((cs) => (
            <section key={cs.id} className="scroll-mt-32">
              <SectionHeading>{cs.label}</SectionHeading>
              <div className="rounded-3xl bg-[#0B0F19]/60 backdrop-blur-xl border border-cyan-900/30 p-8">
                <CustomSectionItems
                  items={cs.items}
                  titleClassName="text-lg font-bold text-white"
                  textClassName="text-sm text-slate-400"
                  chipClassName="rounded-full bg-[#030014] px-3 py-1 text-xs font-medium text-cyan-300 border border-cyan-900/50"
                />
              </div>
            </section>
          ))}

        </div>
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-10 text-2xl md:text-3xl font-bold text-white flex items-center">
      <Star className="w-6 h-6 mr-4 text-cyan-500" />
      {children}
      <span className="ml-6 h-px grow bg-linear-to-r from-cyan-900/50 to-transparent" />
    </h2>
  );
}
