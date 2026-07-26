import type { PortfolioData } from "../types";
import { cn } from "@/lib/utils";
import {
  GitHubContributionHeatmap,
  parseContributionCalendar,
} from "../github-contribution-heatmap";
import { Heart, Star } from "lucide-react";
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
  PROJECT_CARD_META,
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
import { getTemplateSectionLayout } from "../section-layouts";
import {
  renderSections,
  resolveSectionLayout,
  type ReorderableSectionKey,
} from "../section-order";


export function PastelTemplate({ data }: { data: PortfolioData }) {
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
    getTemplateSectionLayout("pastel"),
    portfolio.customization,
  );


  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: portfolio.summary ? (
      <section key="about" id="about" className="scroll-mt-32">

            <div className="bg-white/80 backdrop-blur-lg rounded-[3rem] p-10 md:p-14 shadow-[0_20px_50px_rgba(255,179,186,0.15)] border border-white relative">
              <div className="absolute top-10 right-10 text-[#ffdfba] opacity-50">
                <Heart className="w-12 h-12" fill="currentColor" />
              </div>
              <SectionHeading>{labels.about}</SectionHeading>
              <DescriptionBlock
                text={portfolio.summary}
                paragraphClassName="text-lg md:text-xl leading-relaxed text-[#666] font-medium relative z-10"
                listClassName="space-y-3 pl-6 text-lg md:text-xl leading-relaxed text-[#666] font-medium marker:text-[#ffb3ba] relative z-10"
              />
            </div>
      </section>
    ) : null,

    projects: visibleProjects.length > 0 ? (
      <section key="projects" id="work" className="scroll-mt-32">

            <SectionHeading className="justify-center text-center mb-12">{labels.projects}</SectionHeading>
            <CollapsibleList
              initial={4}
              wrapperClassName={cn(PROJECTS_GRID_2, "gap-8")}
              buttonClassName="col-span-full mt-10 mx-auto block bg-white px-8 py-4 rounded-full text-sm font-bold text-[#ffb3ba] shadow-sm hover:shadow-md transition-all hover:scale-105"
            >
              {visibleProjects.map((project) => (
                <article key={project.id} className={cn(PROJECT_CARD, "group flex flex-col rounded-[2.5rem] bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.03)] transition-all duration-500 hover:shadow-[0_20px_40px_rgba(255,179,186,0.2)]")}>
                  <TemplateProjectPreview templateId="pastel"
                    liveUrl={project.liveUrl ?? null}
                    projectId={project.id}
                    livePreviewProjectIds={livePreviewProjectIds}
                    alt={project.title}
                    loading="lazy"
                    containerClassName="mb-6 overflow-hidden rounded-[2rem] bg-[#fff5f8]"
                    className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />

                  <div className={cn(PROJECT_CARD_BODY, "flex flex-col grow px-4 pb-4")}>
                    <div className={cn(PROJECT_CARD_HEADER, "mb-3")}>
                      <h3 className={cn(PROJECT_CARD_TITLE, "text-2xl font-extrabold text-[#2d2d2d] group-hover:text-[#ffb3ba] transition-colors")}>
                        {project.title}
                      </h3>
                      {project.featured && (
                        <span className="bg-[#fff8c4] text-[#8a8200] text-xs font-bold px-3 py-1 rounded-full shrink-0">
                          Featured
                        </span>
                      )}
                    </div>

                    {project.description && (
                      <DescriptionBlock
                        text={project.description}
                        paragraphClassName="text-[#888] leading-relaxed mb-6 grow font-medium"
                        listClassName="mb-6 grow space-y-2 pl-5 text-[#888] leading-relaxed font-medium marker:text-[#ffb3ba]"
                      />
                    )}

                    <div className="flex flex-wrap gap-2 mb-6">
                      {project.techStack.map((tech) => (
                        <span key={tech} className="bg-[#f4f4f4] text-[#666] text-xs font-bold px-3 py-1.5 rounded-xl">
                          {tech}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-100">
                      <ProjectActions
                        liveUrl={project.liveUrl}
                        sourceUrl={project.sourceUrl}
                        label={project.title}
                        projectId={project.id}
                        liveClassName="bg-[#bae1ff] text-[#0066b3] text-sm font-bold px-5 py-2.5 rounded-full hover:bg-[#a0d4ff] transition-colors mr-3"
                        sourceClassName="bg-gray-100 text-gray-600 text-sm font-bold px-5 py-2.5 rounded-full hover:bg-gray-200 transition-colors"
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

              <SectionHeading>{labels.experience}</SectionHeading>
              <CollapsibleList
                initial={4}
                wrapperClassName="space-y-6"
                buttonClassName="mt-6 bg-white px-6 py-3 rounded-full text-sm font-bold text-[#ffb3ba] shadow-sm hover:shadow-md transition-all"
              >
                {experiences.map((exp) => (
                  <article key={exp.id} className="bg-white rounded-[2rem] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_35px_rgba(255,179,186,0.15)] transition-all">
                    <h3 className="text-xl font-extrabold text-[#2d2d2d] mb-1">{exp.role}</h3>
                    <p className="text-[#ffb3ba] font-bold text-lg mb-3">{exp.company}</p>
                    {(exp.startDate || exp.endDate) && (
                      <div className="inline-block bg-[#f4f4f4] text-[#888] text-xs font-bold px-3 py-1 rounded-full mb-4">
                        {formatDateRange(exp.startDate, exp.endDate)}
                      </div>
                    )}
                    {exp.description && (
                      <div className="text-[#666] text-sm leading-relaxed font-medium">
                        <DescriptionBlock
                          text={exp.description}
                          paragraphClassName="mb-2"
                          listClassName="list-disc pl-5 space-y-1 marker:text-[#ffdfba]"
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
                <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
                  <div className="space-y-8">
                    {Object.entries(groupedSkills).map(([category, names]) => (
                      <div key={category}>
                        <h3 className="text-sm font-extrabold text-[#6aabdf] uppercase tracking-wider mb-4">
                          {category}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {names.map((name) => (
                            <span key={name} className="bg-[#fdf6e3] text-[#b89547] text-sm font-bold px-4 py-2 rounded-2xl hover:scale-105 transition-transform cursor-default">
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

                <SectionHeading>{labels.education}</SectionHeading>
                <CollapsibleList
                  initial={3}
                  wrapperClassName="space-y-4"
                  buttonClassName="mt-6 bg-white px-6 py-3 rounded-full text-sm font-bold text-[#ffb3ba] shadow-sm hover:shadow-md transition-all"
                >
                  {educations.map((edu) => (
                    <article key={edu.id} className="bg-white rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
                      <h3 className="text-lg font-extrabold text-[#2d2d2d]">{edu.degree}</h3>
                      <p className="mt-1 text-base font-bold text-[#6aabdf]">{edu.institution}</p>
                      <div className="flex justify-between items-center mt-4 text-xs font-bold text-[#888]">
                        {(edu.startDate || edu.endDate) && (
                          <span className="bg-[#f4f4f4] px-3 py-1 rounded-full">{formatDateRange(edu.startDate, edu.endDate)}</span>
                        )}
                        {edu.gpa && <span className="bg-[#fff8c4] text-[#8a8200] px-3 py-1 rounded-full">GPA {edu.gpa}</span>}
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
                  buttonClassName="mt-6 bg-white px-6 py-3 rounded-full text-sm font-bold text-[#ffb3ba] shadow-sm hover:shadow-md transition-all"
                >
                  {certifications.map((cert) => (
                    <article key={cert.id} className={cn(SPLIT_CARD_ROW, "bg-white rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.02)]")}>
                      <div className="min-w-0">
                        <h3 className="text-base font-extrabold text-[#2d2d2d]">
                          {cert.url ? (
                            <a href={cert.url} target="_blank" rel="noopener noreferrer" className="hover:text-[#ffb3ba] transition-colors">
                              {cert.name}
                            </a>
                          ) : (
                            cert.name
                          )}
                        </h3>
                        <p className="text-sm font-bold text-[#888] mt-1">{cert.issuer}</p>
                      </div>
                      {cert.issueDate && (
                        <span className="bg-[#f4f4f4] text-[#666] text-xs font-bold px-3 py-1.5 rounded-full shrink-0">
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
                  buttonClassName="mt-6 bg-white px-6 py-3 rounded-full text-sm font-bold text-[#ffb3ba] shadow-sm hover:shadow-md transition-all"
                >
                  {achievements.map((ach) => (
                    <article key={ach.id} className="bg-white rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.02)] flex items-center gap-4">
                      <div className="bg-[#fff8c4] text-[#8a8200] p-3 rounded-full shrink-0">
                        <Star className="w-5 h-5" fill="currentColor" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-[#2d2d2d] leading-snug">{ach.title}</h3>
                        {ach.date && (
                          <p className="text-xs font-bold text-[#888] mt-1">
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

            <SectionHeading className="justify-center text-center mb-12">{labels.articles}</SectionHeading>
            <CollapsibleList
              initial={4}
              wrapperClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              buttonClassName="col-span-full mt-10 mx-auto block bg-white px-8 py-4 rounded-full text-sm font-bold text-[#ffb3ba] shadow-sm hover:shadow-md transition-all hover:scale-105"
            >
              {articles.map((article) => (
                <article key={article.id} className="bg-white rounded-[2.5rem] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_35px_rgba(255,179,186,0.15)] transition-all flex flex-col group">
                  <h3 className="text-xl font-extrabold text-[#2d2d2d] mb-4 group-hover:text-[#6aabdf] transition-colors leading-tight">
                    <a href={article.url} data-lf-track="article" data-lf-label={article.title} data-lf-id={article.id} target="_blank" rel="noopener noreferrer">
                      {article.title}
                    </a>
                  </h3>
                  {article.description && (
                    <p className="text-[#666] text-sm leading-relaxed mb-6 grow font-medium">
                      {article.description}
                    </p>
                  )}
                  <div className="mt-auto flex flex-wrap items-center gap-3 text-xs font-bold text-[#aaa] pt-4 border-t border-gray-100">
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
      <section key="profiles" id="profiles" className="scroll-mt-32">

            <div className="bg-linear-to-br from-[#ffb3ba] to-[#ffdfba] rounded-[3rem] p-10 md:p-14 text-center shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-20 rounded-full blur-3xl" />
              <h2 className="text-3xl font-extrabold text-white mb-8 relative z-10">{labels.profiles}</h2>
              <div className="relative z-10 flex justify-center">
                <ProfileLinksSection
                  portfolio={portfolio}
                  profiles={socialProfiles}
                  chipClassName="bg-white/20 hover:bg-white/40 border border-white/30 px-6 py-3 rounded-full text-sm font-bold text-white transition-all shadow-sm"
                  pillClassName="bg-white/20 hover:bg-white/40 border border-white/30 px-6 py-3 rounded-full text-sm font-bold text-white transition-all shadow-sm"
                  titleClassName="text-white font-extrabold"
                  textClassName="text-white/80"
                />
              </div>
            </div>
      </section>
    ) : null,

    github: contributionCalendar ? (
      <section key="github" className="scroll-mt-32">

            <SectionHeading className="justify-center text-center mb-8">{labels.github}</SectionHeading>
            <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.02)] overflow-x-auto custom-scrollbar">
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
    <div className={cn(TEMPLATE_CONTAINER, "min-h-screen bg-[#fff5f8] text-[#4a4a4a] font-sans selection:bg-[#ffb3ba] selection:text-white overflow-hidden relative pb-20")}>
      {/* Soft Blobs Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#ffdfba] opacity-40 blur-[100px] animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#bae1ff] opacity-40 blur-[100px] animate-[pulse_10s_ease-in-out_infinite_reverse]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-[#baffc9] opacity-30 blur-[120px] animate-[pulse_12s_ease-in-out_infinite]" />
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12 relative z-10 space-y-20">

        {navbarEnabled && (
          <div className="sticky top-6 z-50 flex justify-center mb-16">
            <TemplateNavbar
              items={sections}
              className="flex gap-2 bg-white/70 backdrop-blur-xl border border-white p-2 rounded-[2rem] shadow-[0_8px_30px_rgba(255,179,186,0.2)]"
              linkClassName="px-5 py-2.5 text-sm font-bold text-[#888] hover:bg-[#ffb3ba] hover:text-white transition-all rounded-full"
            />
          </div>
        )}

        <header className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <h1 className="min-w-0 text-balance [overflow-wrap:anywhere] text-2xl @sm:text-4xl @md:text-5xl @lg:text-7xl font-extrabold text-[#2d2d2d] mb-6 tracking-tight">
            {portfolio.title}
          </h1>

          {portfolio.headline && (
            <p className="text-base @md:text-lg @lg:text-2xl text-[#888] font-medium mb-10 leading-relaxed">
              {portfolio.headline}
            </p>
          )}

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <ContactChips
              portfolio={portfolio}
              chipClassName="bg-white border-2 border-transparent hover:border-[#bae1ff] px-6 py-3 rounded-full text-sm font-bold text-[#666] transition-all shadow-sm hover:shadow-md"
            />
            <HeroProfileButtons
              profiles={socialProfiles}
              className="bg-linear-to-r from-[#ffb3ba] to-[#ffdfba] text-white px-8 py-3 rounded-full text-sm font-bold transition-all shadow-md hover:shadow-lg hover:scale-105"
            />
          </div>

          {socialProfiles.length > 0 && (
            <div className="mt-4">
              <SocialPills
                profiles={socialProfiles}
                showUsername
                className="text-sm font-bold text-[#aaa] hover:text-[#ffb3ba] transition-colors px-4 py-2 bg-white/50 rounded-full"
              />
            </div>
          )}
        </header>

        {renderSections(resolved, "full", blocks)}

        {customSections.length > 0 && customSections.map((cs) => (
          <section key={cs.id} className="scroll-mt-32">
            <SectionHeading>{cs.label}</SectionHeading>
            <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
              <CustomSectionItems
                items={cs.items}
                titleClassName="text-lg font-extrabold text-[#2d2d2d] mb-1"
                textClassName="text-[#666] text-sm font-medium leading-relaxed"
                chipClassName="bg-[#f4f4f4] text-[#888] text-xs font-bold px-3 py-1.5 rounded-xl"
              />
            </div>
          </section>
        ))}

      </div>
    </div>
  );
}

function SectionHeading({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <h2 className={`text-3xl font-extrabold text-[#2d2d2d] mb-8 flex items-center gap-3 ${className || ''}`}>
      {children}
    </h2>
  );
}
