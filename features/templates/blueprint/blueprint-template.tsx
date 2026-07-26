import type { PortfolioData } from "../types";
import { cn } from "@/lib/utils";
import {
  GitHubContributionHeatmap,
  parseContributionCalendar,
} from "../github-contribution-heatmap";
import { Crosshair, Box, Layers } from "lucide-react";
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


export function BlueprintTemplate({ data }: { data: PortfolioData }) {
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
    getTemplateSectionLayout("blueprint"),
    portfolio.customization,
  );


  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: portfolio.summary ? (
      <section key="about" id="about" className="scroll-mt-32">

            <SectionHeading number="01">{labels.about}</SectionHeading>
            <div className="border-2 border-white/50 p-8 md:p-12 bg-[#003366]/80 backdrop-blur-sm relative">
              <div className="absolute top-4 right-4 text-[10px] text-white/50 uppercase tracking-widest">
                SCALE: 1:1
              </div>
              <DescriptionBlock
                text={portfolio.summary}
                paragraphClassName="text-base md:text-lg leading-relaxed text-white/90"
                listClassName="space-y-2 pl-6 text-base md:text-lg leading-relaxed text-white/90 marker:text-white"
              />
            </div>
      </section>
    ) : null,

    projects: visibleProjects.length > 0 ? (
      <section key="projects" id="work" className="scroll-mt-32">

            <SectionHeading number="02">{labels.projects}</SectionHeading>
            <CollapsibleList
              initial={4}
              wrapperClassName={cn(PROJECTS_GRID_2, "gap-8")}
              buttonClassName="col-span-full mt-10 mx-auto block border-2 border-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-[#003366] transition-colors"
            >
              {visibleProjects.map((project, index) => (
                <article key={project.id} className={cn(PROJECT_CARD, "group relative flex flex-col border-2 border-white/50 bg-[#003366]/80 backdrop-blur-sm transition-colors hover:border-white")}>
                  <div className="absolute -top-3 -left-3 bg-[#003366] px-2 text-[10px] uppercase tracking-widest text-white/50">
                    REF.{index + 1}
                  </div>

                  <div className="border-b-2 border-white/50 p-2">
                    <TemplateProjectPreview templateId="blueprint"
                      liveUrl={project.liveUrl ?? null}
                      projectId={project.id}
                      livePreviewProjectIds={livePreviewProjectIds}
                      alt={project.title}
                      loading="lazy"
                      containerClassName="overflow-hidden border border-dashed border-white/30 bg-[#002244]"
                      className="h-full w-full object-cover object-top opacity-70 mix-blend-screen filter contrast-150 transition-opacity group-hover:opacity-100"
                    />
                  </div>

                  <div className={cn(PROJECT_CARD_BODY, "flex flex-col grow")}>
                    <div className={cn(PROJECT_CARD_HEADER, "mb-4")}>
                      <div className={PROJECT_CARD_META}>
                        <h3 className={cn(PROJECT_CARD_TITLE, "text-xl font-bold uppercase tracking-wider")}>
                          {project.title}
                        </h3>
                        {project.featured && (
                          <span className="border border-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest shrink-0">
                            PRIORITY
                          </span>
                        )}
                      </div>
                    </div>

                    {project.description && (
                      <DescriptionBlock
                        text={project.description}
                        paragraphClassName="text-sm text-white/70 leading-relaxed mb-6 grow"
                        listClassName="mb-6 grow space-y-2 pl-5 text-sm text-white/70 leading-relaxed marker:text-white/50"
                      />
                    )}

                    <div className="flex flex-wrap gap-2 mb-6">
                      {project.techStack.map((tech) => (
                        <span key={tech} className="bg-white/10 text-[10px] uppercase tracking-widest px-2 py-1">
                          {tech}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto pt-4 border-t border-white/30 flex gap-4">
                      <ProjectActions
                        liveUrl={project.liveUrl}
                        sourceUrl={project.sourceUrl}
                        label={project.title}
                        projectId={project.id}
                        liveClassName="text-[10px] font-bold uppercase tracking-widest bg-white text-[#003366] px-4 py-2 hover:bg-transparent hover:text-white border border-white transition-colors"
                        sourceClassName="text-[10px] font-bold uppercase tracking-widest border border-white/50 px-4 py-2 hover:border-white transition-colors"
                      />
                    </div>
                  </div>
                </article>
              ))}
            </CollapsibleList>
      </section>
    ) : null,

    experience: experiences.length > 0 ? (
      <section key="experience" id="experience" className="scroll-mt-32">

              <SectionHeading number="03">{labels.experience}</SectionHeading>
              <CollapsibleList
                initial={4}
                wrapperClassName="space-y-8"
                buttonClassName="mt-8 border-2 border-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-[#003366] transition-colors"
              >
                {experiences.map((exp, index) => (
                  <article key={exp.id} className="relative pl-8 border-l-2 border-white/50">
                    <div className="absolute top-0 left-[-5px] w-2 h-2 bg-white" />
                    <div className="text-[10px] text-white/50 uppercase tracking-widest mb-2">
                      OP.{index + 1}
                    </div>
                    <h3 className="text-lg font-bold uppercase tracking-wider mb-1">{exp.role}</h3>
                    <p className="text-white/80 uppercase tracking-widest text-sm mb-2">{exp.company}</p>
                    {(exp.startDate || exp.endDate) && (
                      <p className="text-[10px] uppercase tracking-widest text-white/50 mb-4 border border-white/30 inline-block px-2 py-1">
                        {formatDateRange(exp.startDate, exp.endDate)}
                      </p>
                    )}
                    {exp.description && (
                      <div className="text-sm text-white/80 leading-relaxed">
                        <DescriptionBlock
                          text={exp.description}
                          paragraphClassName="mb-2"
                          listClassName="list-disc pl-4 space-y-1 marker:text-white/50"
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

                <SectionHeading number="04">{labels.skills}</SectionHeading>
                <div className="border-2 border-white/50 p-6 bg-[#003366]/80 backdrop-blur-sm">
                  <div className="space-y-8">
                    {Object.entries(groupedSkills).map(([category, names], idx) => (
                      <div key={category} className="relative">
                        <div className="text-[10px] text-white/50 uppercase tracking-widest mb-3 border-b border-white/30 pb-1">
                          SEC.{idx + 1} {"//"} {category}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {names.map((name) => (
                            <span key={name} className="border border-white/50 text-[10px] uppercase tracking-widest px-2 py-1 hover:bg-white hover:text-[#003366] transition-colors cursor-default">
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
      </section>
    ) : null,

    education: educations.length > 0 ? (
      <section key="education">

                <SectionHeading number="05">{labels.education}</SectionHeading>
                <CollapsibleList
                  initial={3}
                  wrapperClassName="space-y-6"
                  buttonClassName="mt-8 border-2 border-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-[#003366] transition-colors"
                >
                  {educations.map((edu) => (
                    <article key={edu.id} className="border border-white/50 p-6 bg-[#003366]/80 backdrop-blur-sm relative">
                      <div className="absolute top-0 right-0 w-3 h-3 border-b border-l border-white/50" />
                      <h3 className="text-base font-bold uppercase tracking-wider mb-1">{edu.degree}</h3>
                      <p className="text-white/80 text-sm uppercase tracking-widest mb-4">{edu.institution}</p>
                      <div className="flex justify-between items-center pt-4 border-t border-dashed border-white/30 text-[10px] uppercase tracking-widest text-white/60">
                        {(edu.startDate || edu.endDate) && (
                          <span>{formatDateRange(edu.startDate, edu.endDate)}</span>
                        )}
                        {edu.gpa && <span>GPA: {edu.gpa}</span>}
                      </div>
                    </article>
                  ))}
                </CollapsibleList>
      </section>
    ) : null,

    certifications: certifications.length > 0 ? (
      <section key="certifications">

                <SectionHeading number="06">{labels.certifications}</SectionHeading>
                <CollapsibleList
                  initial={4}
                  wrapperClassName="space-y-4"
                  buttonClassName="mt-8 border-2 border-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-[#003366] transition-colors"
                >
                  {certifications.map((cert) => (
                    <article key={cert.id} className="border border-white/30 p-4 flex items-center justify-between bg-[#003366]/80 backdrop-blur-sm">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider">
                          {cert.url ? (
                            <a href={cert.url} target="_blank" rel="noopener noreferrer" className="hover:underline underline-offset-4">
                              {cert.name}
                            </a>
                          ) : (
                            cert.name
                          )}
                        </h3>
                        <p className="text-[10px] text-white/60 mt-1 uppercase tracking-widest">{cert.issuer}</p>
                      </div>
                      {cert.issueDate && (
                        <span className="text-[10px] uppercase tracking-widest border border-white/30 px-2 py-1 shrink-0">
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

                <SectionHeading number="07">{labels.achievements}</SectionHeading>
                <CollapsibleList
                  initial={4}
                  wrapperClassName="space-y-4"
                  buttonClassName="mt-8 border-2 border-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-[#003366] transition-colors"
                >
                  {achievements.map((ach) => (
                    <article key={ach.id} className="border border-white/30 p-4 flex items-start gap-4 bg-[#003366]/80 backdrop-blur-sm">
                      <Layers className="w-4 h-4 text-white/50 mt-0.5 shrink-0" />
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider leading-snug">{ach.title}</h3>
                        {ach.date && (
                          <p className="text-[10px] text-white/60 mt-2 uppercase tracking-widest">
                            {new Date(ach.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                          </p>
                        )}
                      </div>
                    </article>
                  ))}
                </CollapsibleList>
      </section>
    ) : null,

    articles: articles.length > 0 ? (
      <section key="articles" id="writing" className="scroll-mt-32">

            <SectionHeading number="08">{labels.articles}</SectionHeading>
            <CollapsibleList
              initial={4}
              wrapperClassName="grid grid-cols-1 md:grid-cols-3 gap-6"
              buttonClassName="col-span-full mt-10 mx-auto block border-2 border-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-[#003366] transition-colors"
            >
              {articles.map((article) => (
                <article key={article.id} className="border-2 border-white/50 p-6 bg-[#003366]/80 backdrop-blur-sm hover:bg-white/10 transition-colors flex flex-col relative">
                  <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-white/50" />
                  <h3 className="text-base font-bold uppercase tracking-wider mb-4 leading-snug">
                    <a href={article.url} data-lf-track="article" data-lf-label={article.title} data-lf-id={article.id} target="_blank" rel="noopener noreferrer">
                      {article.title}
                    </a>
                  </h3>
                  {article.description && (
                    <p className="text-xs text-white/70 leading-relaxed mb-6 grow">
                      {article.description}
                    </p>
                  )}
                  <div className="mt-auto flex justify-between items-center text-[10px] uppercase tracking-widest text-white/50 pt-4 border-t border-dashed border-white/30">
                    {article.publishedAt && (
                      <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                    )}
                    {article.readTime != null && <span>{article.readTime} MIN</span>}
                  </div>
                </article>
              ))}
            </CollapsibleList>
      </section>
    ) : null,

    profiles: hasProfiles ? (
      <section key="profiles" id="profiles" className="scroll-mt-32">

            <div className="border-2 border-white/50 p-12 text-center bg-[#003366]/80 backdrop-blur-sm relative">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white" />

              <h2 className="text-2xl font-bold uppercase tracking-widest mb-8">{labels.profiles}</h2>
              <div className="flex justify-center">
                <ProfileLinksSection
                  portfolio={portfolio}
                  profiles={socialProfiles}
                  chipClassName="border border-white/50 px-6 py-3 text-xs uppercase tracking-widest hover:bg-white hover:text-[#003366] transition-colors"
                  pillClassName="border border-white/50 px-6 py-3 text-xs uppercase tracking-widest hover:bg-white hover:text-[#003366] transition-colors"
                  titleClassName="text-white font-bold uppercase tracking-wider"
                  textClassName="text-white/60"
                />
              </div>
            </div>
      </section>
    ) : null,

    github: contributionCalendar ? (
      <section key="github" className="scroll-mt-32">

            <SectionHeading number="XX">{labels.github}</SectionHeading>
            <div className="border-2 border-white/50 p-8 bg-[#003366]/80 backdrop-blur-sm overflow-x-auto custom-scrollbar">
              <GitHubContributionHeatmap
                calendar={contributionCalendar}
                profileUrl={githubProfile?.url}
                username={githubProfile?.username}
                variant="minimal"
                label="GIT_COMMITS"
              />
            </div>
      </section>
    ) : null,
  };

  return (
    <div className={cn(TEMPLATE_CONTAINER, "min-h-screen bg-[#003366] text-white font-mono selection:bg-white selection:text-[#003366] overflow-hidden relative pb-20")}>

      {/* Blueprint Grid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
          backgroundSize: `100px 100px, 100px 100px, 20px 20px, 20px 20px`,
          backgroundPosition: `-1px -1px, -1px -1px, -1px -1px, -1px -1px`
        }}
      />

      {/* Blueprint Border Frame */}
      <div className="absolute inset-0 z-0 pointer-events-none border-4 border-white/30 m-4 md:m-8" />
      <div className="absolute inset-0 z-0 pointer-events-none border border-white/30 m-[22px] md:m-[38px]" />

      <div className="mx-auto max-w-6xl px-8 md:px-16 py-20 relative z-10 space-y-24">

        {navbarEnabled && (
          <div className="sticky top-12 z-50 flex justify-center mb-16">
            <TemplateNavbar
              items={sections}
              className="flex gap-2 bg-[#003366] border-2 border-white/50 p-2 shadow-lg"
              linkClassName="px-4 py-2 text-xs font-bold text-white hover:bg-white hover:text-[#003366] transition-colors uppercase tracking-widest"
            />
          </div>
        )}

        <header className="grid min-w-0 grid-cols-1 @md:grid-cols-12 gap-12 items-center border-b-2 border-white/50 pb-16 relative">
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white" />

          <div className="min-w-0 @md:col-span-8">
            <div className="inline-flex items-center gap-2 border border-white/50 px-3 py-1 text-[10px] uppercase tracking-widest mb-8">
              <Crosshair className="w-3 h-3" />
              <span>FIG. 1: MAIN_PROFILE</span>
            </div>

            <h1 className="min-w-0 text-balance [overflow-wrap:anywhere] text-2xl @sm:text-4xl @md:text-5xl @lg:text-7xl font-bold uppercase tracking-tighter mb-6">
              {portfolio.title}
            </h1>

            {portfolio.headline && (
              <p className="text-base @md:text-lg @lg:text-2xl text-white/80 uppercase tracking-widest max-w-2xl mb-10">
                {portfolio.headline}
              </p>
            )}

            <div className="flex flex-wrap gap-4 mb-8">
              <ContactChips
                portfolio={portfolio}
                chipClassName="border border-white/50 bg-transparent px-4 py-2 text-xs uppercase tracking-widest hover:bg-white hover:text-[#003366] transition-colors"
              />
              <HeroProfileButtons
                profiles={socialProfiles}
                className="bg-white text-[#003366] px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-transparent hover:text-white border border-white transition-colors"
              />
            </div>

            {socialProfiles.length > 0 && (
              <div className="mt-4">
                <SocialPills
                  profiles={socialProfiles}
                  showUsername
                  className="text-[10px] uppercase tracking-widest text-white/60 hover:text-white transition-colors"
                />
              </div>
            )}
          </div>

        </header>

        {renderSections(resolved, "full", blocks)}

        {customSections.length > 0 && customSections.map((cs, idx) => (
          <section key={cs.id} className="scroll-mt-32">
            <SectionHeading number={`0${9 + idx}`}>{cs.label}</SectionHeading>
            <div className="border-2 border-white/50 p-8 bg-[#003366]/80 backdrop-blur-sm">
              <CustomSectionItems
                items={cs.items}
                titleClassName="text-base font-bold uppercase tracking-wider mb-2"
                textClassName="text-sm text-white/80 leading-relaxed"
                chipClassName="border border-white/50 text-[10px] uppercase tracking-widest px-2 py-1"
              />
            </div>
          </section>
        ))}

      </div>
    </div>
  );
}

function SectionHeading({ children, number }: { children: React.ReactNode, number: string }) {
  return (
    <h2 className="text-base @md:text-lg @lg:text-2xl font-bold flex items-center gap-4 uppercase tracking-widest mb-8">
      <span className="text-sm font-normal border border-white/50 px-2 py-1">{number}</span>
      {children}
      <span className="h-[2px] grow bg-white/30" />
    </h2>
  );
}
