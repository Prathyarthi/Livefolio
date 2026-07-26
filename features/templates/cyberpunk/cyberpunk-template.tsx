import type { PortfolioData } from "../types";
import { cn } from "@/lib/utils";
import {
  GitHubContributionHeatmap,
  parseContributionCalendar,
} from "../github-contribution-heatmap";
import { Terminal, Zap, Cpu } from "lucide-react";
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


export function CyberpunkTemplate({ data }: { data: PortfolioData }) {
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
    getTemplateSectionLayout("cyberpunk"),
    portfolio.customization,
  );


  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: portfolio.summary ? (
      <section key="about" id="about" className="scroll-mt-24">

            <SectionHeading icon={<Cpu className="w-5 h-5" />}>{labels.about}</SectionHeading>
            <div className="border border-[#00ff00]/30 bg-[#00ff00]/5 p-6 md:p-8 shadow-[inset_0_0_20px_rgba(0,255,0,0.05)]">
              <DescriptionBlock
                text={portfolio.summary}
                paragraphClassName="text-sm md:text-base leading-relaxed text-slate-300"
                listClassName="space-y-2 pl-5 text-sm md:text-base leading-relaxed text-slate-300 marker:text-[#ff00ff]"
              />
            </div>
      </section>
    ) : null,

    projects: visibleProjects.length > 0 ? (
      <section key="projects" id="work" className="scroll-mt-24">

            <SectionHeading icon={<Zap className="w-5 h-5" />}>{labels.projects}</SectionHeading>
            <CollapsibleList
              initial={4}
              wrapperClassName={PROJECTS_GRID_2}
              buttonClassName="col-span-full mt-8 mx-auto block border border-[#00ffff] bg-transparent px-8 py-3 text-xs font-bold uppercase tracking-widest text-[#00ffff] transition-colors hover:bg-[#00ffff] hover:text-black shadow-[0_0_15px_rgba(0,255,255,0.3)]"
            >
              {visibleProjects.map((project) => (
                <article key={project.id} className={cn(PROJECT_CARD, "group relative border border-[#00ff00]/30 bg-[#050505] hover:border-[#00ff00] transition-colors")}>
                  <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-[#00ff00] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative border-b border-[#00ff00]/30">
                    <TemplateProjectPreview templateId="cyberpunk"
                      liveUrl={project.liveUrl ?? null}
                      projectId={project.id}
                      livePreviewProjectIds={livePreviewProjectIds}
                      alt={project.title}
                      loading="lazy"
                      containerClassName="bg-[#050505]"
                      className="h-full w-full object-cover object-top opacity-70 filter contrast-125 transition-all duration-500 group-hover:opacity-100"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-[#00ff00]/10 mix-blend-overlay" />
                  </div>

                  <div className={cn(PROJECT_CARD_BODY, "flex flex-col grow")}>
                    <div className={cn(PROJECT_CARD_HEADER, "mb-4")}>
                      <div className={PROJECT_CARD_META}>
                        <h3 className={cn(PROJECT_CARD_TITLE, "text-xl font-bold text-white uppercase tracking-wider group-hover:text-[#00ff00] transition-colors")}>
                          {project.title}
                        </h3>
                        {project.featured && (
                          <span className="text-[10px] font-bold uppercase tracking-widest bg-[#ff00ff] text-white px-2 py-1 shrink-0 shadow-[0_0_10px_rgba(255,0,255,0.5)]">
                            Prime
                          </span>
                        )}
                      </div>
                    </div>

                    {project.description && (
                      <DescriptionBlock
                        text={project.description}
                        paragraphClassName="text-sm text-slate-400 leading-relaxed mb-6 grow"
                        listClassName="mb-6 grow space-y-2 pl-5 text-sm text-slate-400 leading-relaxed marker:text-[#ff00ff]"
                      />
                    )}

                    <div className="flex flex-wrap gap-2 mb-6">
                      {project.techStack.map((tech) => (
                        <span key={tech} className="text-[10px] font-bold uppercase tracking-widest border border-[#00ffff]/50 text-[#00ffff] px-2 py-1 bg-[#00ffff]/5">
                          {tech}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto">
                      <ProjectActions
                        liveUrl={project.liveUrl}
                        sourceUrl={project.sourceUrl}
                        label={project.title}
                        projectId={project.id}
                        liveClassName="text-xs font-bold uppercase tracking-widest bg-[#00ff00] text-black px-4 py-2 hover:bg-white transition-colors mr-3 shadow-[0_0_10px_rgba(0,255,0,0.4)]"
                        sourceClassName="text-xs font-bold uppercase tracking-widest border border-[#00ff00] text-[#00ff00] px-4 py-2 hover:bg-[#00ff00] hover:text-black transition-colors"
                      />
                    </div>
                  </div>
                </article>
              ))}
            </CollapsibleList>
      </section>
    ) : null,

    experience: experiences.length > 0 ? (
      <section key="experience" id="experience" className="scroll-mt-24">

              <SectionHeading>{labels.experience}</SectionHeading>
              <CollapsibleList
                initial={4}
                wrapperClassName="space-y-6"
                buttonClassName="mt-6 border border-[#ff00ff] bg-transparent px-6 py-2 text-xs font-bold uppercase tracking-widest text-[#ff00ff] transition-colors hover:bg-[#ff00ff] hover:text-white shadow-[0_0_10px_rgba(255,0,255,0.2)]"
              >
                {experiences.map((exp) => (
                  <article key={exp.id} className="border-l-2 border-[#ff00ff] pl-4 py-2 relative group">
                    <div className="absolute left-[-5px] top-3 w-2 h-2 bg-[#050505] border border-[#ff00ff] group-hover:bg-[#ff00ff] transition-colors" />
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">{exp.role}</h3>
                    <p className="text-[#00ffff] text-sm mt-1 uppercase tracking-widest">{exp.company}</p>
                    {(exp.startDate || exp.endDate) && (
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-2">
                        [{formatDateRange(exp.startDate, exp.endDate)}]
                      </p>
                    )}
                    {exp.description && (
                      <div className="mt-3 text-sm text-slate-400 leading-relaxed">
                        <DescriptionBlock
                          text={exp.description}
                          paragraphClassName="mb-2"
                          listClassName="list-disc pl-4 space-y-1 marker:text-[#00ffff]"
                        />
                      </div>
                    )}
                  </article>
                ))}
              </CollapsibleList>
      </section>
    ) : null,

    skills: skills.length > 0 ? (
      <section key="skills">

                <SectionHeading>{labels.skills}</SectionHeading>
                <div className="space-y-6 border border-[#00ff00]/30 p-6 bg-[#00ff00]/5">
                  {Object.entries(groupedSkills).map(([category, names]) => (
                    <div key={category}>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[#00ff00] mb-3">
                        {"//"} {category}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {names.map((name) => (
                          <span key={name} className="text-xs font-bold uppercase tracking-wider bg-[#050505] border border-[#00ff00]/50 text-slate-300 px-3 py-1 hover:border-[#00ff00] hover:text-[#00ff00] transition-colors cursor-default">
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
      <section key="education">

                <SectionHeading>{labels.education}</SectionHeading>
                <CollapsibleList
                  initial={3}
                  wrapperClassName="space-y-4"
                  buttonClassName="mt-6 border border-[#00ffff] bg-transparent px-6 py-2 text-xs font-bold uppercase tracking-widest text-[#00ffff] transition-colors hover:bg-[#00ffff] hover:text-black shadow-[0_0_10px_rgba(0,255,255,0.2)]"
                >
                  {educations.map((edu) => (
                    <article key={edu.id} className="border border-[#00ffff]/30 p-4 bg-[#00ffff]/5 hover:border-[#00ffff] transition-colors">
                      <h3 className="text-base font-bold text-white uppercase tracking-wider">{edu.degree}</h3>
                      <p className="text-[#00ffff] text-sm mt-1">{edu.institution}</p>
                      <div className="flex justify-between items-center mt-3 text-[10px] uppercase tracking-widest text-slate-500">
                        {(edu.startDate || edu.endDate) && (
                          <span>[{formatDateRange(edu.startDate, edu.endDate)}]</span>
                        )}
                        {edu.gpa && <span className="border border-slate-700 px-2 py-1">GPA: {edu.gpa}</span>}
                      </div>
                    </article>
                  ))}
                </CollapsibleList>
      </section>
    ) : null,

    certifications: certifications.length > 0 ? (
      <section key="certifications">

                <SectionHeading>{labels.certifications}</SectionHeading>
                <CollapsibleList
                  initial={4}
                  wrapperClassName="space-y-4"
                  buttonClassName="mt-6 border border-[#ff00ff] bg-transparent px-6 py-2 text-xs font-bold uppercase tracking-widest text-[#ff00ff] transition-colors hover:bg-[#ff00ff] hover:text-white"
                >
                  {certifications.map((cert) => (
                    <article key={cert.id} className="flex justify-between items-center border-b border-[#00ff00]/30 pb-3 group">
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                          {cert.url ? (
                            <a href={cert.url} target="_blank" rel="noopener noreferrer" className="hover:text-[#00ff00] transition-colors">
                              {cert.name}
                            </a>
                          ) : (
                            cert.name
                          )}
                        </h3>
                        <p className="text-xs text-[#00ffff] mt-1">{cert.issuer}</p>
                      </div>
                      {cert.issueDate && (
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-[#ff00ff]/20 text-[#ff00ff] px-2 py-1 border border-[#ff00ff]/50">
                          {new Date(cert.issueDate).getFullYear()}
                        </span>
                      )}
                    </article>
                  ))}
                </CollapsibleList>
      </section>
    ) : null,

    achievements: achievements.length > 0 ? (
      <section key="achievements">

                <SectionHeading>{labels.achievements}</SectionHeading>
                <CollapsibleList
                  initial={4}
                  wrapperClassName="space-y-4"
                  buttonClassName="mt-6 border border-[#00ffff] bg-transparent px-6 py-2 text-xs font-bold uppercase tracking-widest text-[#00ffff] transition-colors hover:bg-[#00ffff] hover:text-black"
                >
                  {achievements.map((ach) => (
                    <article key={ach.id} className="flex items-start gap-4 border border-[#00ff00]/30 p-4 bg-[#050505] group hover:border-[#00ff00] transition-colors">
                      <div className="text-[#ff00ff] mt-0.5 group-hover:animate-pulse">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">{ach.title}</h3>
                        {ach.date && (
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-2">
                            [{new Date(ach.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}]
                          </p>
                        )}
                      </div>
                    </article>
                  ))}
                </CollapsibleList>
      </section>
    ) : null,

    articles: articles.length > 0 ? (
      <section key="articles" id="writing" className="scroll-mt-24">

            <SectionHeading>{labels.articles}</SectionHeading>
            <CollapsibleList
              initial={4}
              wrapperClassName="grid grid-cols-1 sm:grid-cols-2 gap-6"
              buttonClassName="col-span-full mt-8 mx-auto block border border-[#00ff00] bg-transparent px-8 py-3 text-xs font-bold uppercase tracking-widest text-[#00ff00] transition-colors hover:bg-[#00ff00] hover:text-black shadow-[0_0_15px_rgba(0,255,0,0.3)]"
            >
              {articles.map((article) => (
                <article key={article.id} className="border border-[#00ffff]/30 p-5 bg-[#00ffff]/5 hover:border-[#00ffff] transition-colors group flex flex-col">
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-3 group-hover:text-[#00ffff] transition-colors">
                    <a href={article.url} data-lf-track="article" data-lf-label={article.title} data-lf-id={article.id} target="_blank" rel="noopener noreferrer">
                      {article.title}
                    </a>
                  </h3>
                  {article.description && (
                    <p className="text-sm text-slate-400 leading-relaxed mb-4 grow">
                      {article.description}
                    </p>
                  )}
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#00ff00] flex gap-4 mt-auto pt-4 border-t border-[#00ffff]/20">
                    {article.publishedAt && (
                      <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                    )}
                    {article.readTime != null && <span>{article.readTime} MIN_READ</span>}
                  </div>
                </article>
              ))}
            </CollapsibleList>
      </section>
    ) : null,

    profiles: hasProfiles ? (
      <section key="profiles" id="profiles" className="scroll-mt-24">

            <SectionHeading>{labels.profiles}</SectionHeading>
            <div className="border border-[#00ff00]/30 p-8 bg-[#00ff00]/5 text-center">
              <ProfileLinksSection
                portfolio={portfolio}
                profiles={socialProfiles}
                chipClassName="text-xs font-bold uppercase tracking-widest border border-[#00ffff] text-[#00ffff] px-4 py-2 hover:bg-[#00ffff] hover:text-black transition-colors"
                pillClassName="text-xs font-bold uppercase tracking-widest border border-[#00ffff] text-[#00ffff] px-4 py-2 hover:bg-[#00ffff] hover:text-black transition-colors"
                titleClassName="text-white font-bold uppercase tracking-wider"
                textClassName="text-slate-400"
              />
            </div>
      </section>
    ) : null,

    github: contributionCalendar ? (
      <section key="github" className="scroll-mt-24">

            <SectionHeading>{labels.github}</SectionHeading>
            <div className="border border-[#00ff00] p-6 bg-[#050505] overflow-x-auto custom-scrollbar shadow-[0_0_20px_rgba(0,255,0,0.1)]">
              <GitHubContributionHeatmap
                calendar={contributionCalendar}
                profileUrl={githubProfile?.url}
                username={githubProfile?.username}
                variant="minimal"
                label="// GITHUB_CONTRIBUTIONS"
              />
            </div>
      </section>
    ) : null,
  };

  return (
    <div className={cn(TEMPLATE_CONTAINER, "min-h-screen bg-[#050505] text-[#00ff00] font-mono selection:bg-[#ff00ff] selection:text-white overflow-hidden relative pb-20")}>
      {/* Grid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `linear-gradient(#00ff00 1px, transparent 1px), linear-gradient(90deg, #00ff00 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          transform: 'perspective(500px) rotateX(60deg) translateY(-100px) translateZ(-200px)',
        }}
      />
      <div className="absolute inset-0 z-0 pointer-events-none bg-linear-to-b from-[#050505] via-transparent to-[#050505]" />

      <div className="mx-auto max-w-5xl px-4 py-12 relative z-10 space-y-16">

        {navbarEnabled && (
          <div className="sticky top-4 z-50 flex justify-center mb-16">
            <TemplateNavbar
              items={sections}
              className="flex gap-2 bg-[#050505]/90 border border-[#00ff00]/50 p-2 backdrop-blur-md shadow-[0_0_15px_rgba(0,255,0,0.2)]"
              linkClassName="px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#00ff00] hover:bg-[#00ff00] hover:text-black transition-colors"
            />
          </div>
        )}

        <header className="relative border-l-4 border-[#00ff00] pl-6 md:pl-10">
          <div className="absolute top-0 left-[-14px] w-6 h-6 bg-[#050505] border-2 border-[#00ff00] flex items-center justify-center">
            <div className="w-2 h-2 bg-[#ff00ff] animate-pulse" />
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="grow">
              <div className="inline-flex items-center border border-[#ff00ff] bg-[#ff00ff]/10 px-3 py-1 text-xs font-bold text-[#ff00ff] mb-6 uppercase tracking-widest shadow-[0_0_10px_rgba(255,0,255,0.3)]">
                <Terminal className="w-3 h-3 mr-2" />
                System.Init()
              </div>
              <h1 className="min-w-0 text-balance [overflow-wrap:anywhere] text-2xl @sm:text-4xl @md:text-5xl @lg:text-7xl font-black uppercase tracking-tighter text-white drop-shadow-[0_0_10px_rgba(0,255,0,0.8)] mb-4">
                {portfolio.title}
              </h1>
              {portfolio.headline && (
                <p className="text-xl text-[#00ffff] font-medium max-w-2xl mb-8 uppercase tracking-wide">
                  &gt; {portfolio.headline}_
                </p>
              )}

              <div className="flex flex-wrap gap-4 mb-6">
                <ContactChips
                  portfolio={portfolio}
                  chipClassName="border border-[#00ff00] bg-transparent px-4 py-2 text-xs font-bold text-[#00ff00] uppercase tracking-widest hover:bg-[#00ff00] hover:text-black transition-colors shadow-[0_0_10px_rgba(0,255,0,0.2)]"
                />
              </div>

              <div className="flex flex-wrap gap-4">
                <HeroProfileButtons
                  profiles={socialProfiles}
                  className="bg-[#ff00ff] text-white px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-[#ff00ff] transition-colors shadow-[0_0_15px_rgba(255,0,255,0.5)]"
                />
              </div>
            </div>

          </div>

          {socialProfiles.length > 0 && (
            <div className="mt-8 pt-6 border-t border-[#00ff00]/30">
              <SocialPills
                profiles={socialProfiles}
                showUsername
                className="text-xs font-bold uppercase tracking-widest text-[#008800] hover:text-[#00ff00] transition-colors"
              />
            </div>
          )}
        </header>

        {renderSections(resolved, "full", blocks)}

        {customSections.length > 0 && customSections.map((cs) => (
          <section key={cs.id} className="scroll-mt-24">
            <SectionHeading>{cs.label}</SectionHeading>
            <div className="border border-[#ff00ff]/30 p-6 bg-[#ff00ff]/5">
              <CustomSectionItems
                items={cs.items}
                titleClassName="text-base font-bold text-white uppercase tracking-wider mb-2"
                textClassName="text-sm text-slate-400 leading-relaxed"
                chipClassName="text-[10px] font-bold uppercase tracking-widest border border-[#ff00ff]/50 text-[#ff00ff] px-2 py-1 bg-[#ff00ff]/5"
              />
            </div>
          </section>
        ))}

      </div>
    </div>
  );
}

function SectionHeading({ children, icon }: { children: React.ReactNode, icon?: React.ReactNode }) {
  return (
    <h2 className="text-base @md:text-lg @lg:text-2xl font-bold uppercase tracking-widest text-white mb-8 flex items-center gap-3">
      <span className="text-[#00ff00]">{icon || <Terminal className="w-5 h-5" />}</span>
      {children}
      <span className="ml-4 h-px grow bg-[linear-gradient(90deg,#00ff00_0%,transparent_100%)] opacity-50" />
    </h2>
  );
}
