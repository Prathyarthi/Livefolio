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
  PROJECT_CARD_HEADER,
  PROJECT_CARD_TITLE,
  SocialPills,
  TEMPLATE_CONTAINER,
  TemplateNavbar,
} from "../shared";
import { CollapsibleList } from "../collapsible-list";
import { formatDateRange, groupSkillsByCategory } from "../utils";
import { TemplateProjectPreview } from "@/components/template-project-preview";


export function PaperTemplate({ data }: { data: PortfolioData }) {
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
    getTemplateSectionLayout("paper"),
    portfolio.customization,
  );
  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: portfolio.summary && (
              <section key="about" id="about" className="scroll-mt-12">
                <SectionHeading>{labels.about}</SectionHeading>
                <div className="text-lg leading-relaxed text-[#444] first-letter:text-5xl first-letter:font-bold first-letter:mr-1 first-letter:float-left">
                  <DescriptionBlock
                    text={portfolio.summary}
                    paragraphClassName="mb-4"
                    listClassName="list-disc pl-6 mb-4 space-y-2"
                  />
                </div>
              </section>
            ),
    projects: visibleProjects.length > 0 && (
              <section key="projects" id="work" className="scroll-mt-12">
                <SectionHeading>{labels.projects}</SectionHeading>
                <CollapsibleList
                  initial={4}
                  wrapperClassName="space-y-12"
                  buttonClassName="mt-8 mx-auto block border border-[#2c2c2c] bg-transparent px-8 py-3 text-xs font-bold uppercase tracking-widest text-[#2c2c2c] transition-colors hover:bg-[#2c2c2c] hover:text-[#f4f1ea]"
                >
                  {visibleProjects.map((project) => (
                    <article key={project.id} className={cn(PROJECT_CARD, "grid grid-cols-1 min-w-0 @md:grid-cols-12 gap-8 items-start")}>
                      <div className="@md:col-span-5">
                        <div className="border border-[#2c2c2c] bg-white p-1">
                          <TemplateProjectPreview templateId="paper"
                            liveUrl={project.liveUrl ?? null}
                            projectId={project.id}
                            livePreviewProjectIds={livePreviewProjectIds}
                            alt={project.title}
                            loading="lazy"
                            containerClassName="overflow-hidden bg-[#f4f1ea]"
                            className="h-full w-full object-cover object-top filter transition-all duration-500"
                          />
                        </div>
                      </div>
                      <div className="@md:col-span-7 space-y-4">
                        <div className={PROJECT_CARD_HEADER}>
                          <h3 className={cn(PROJECT_CARD_TITLE, "text-2xl font-bold leading-tight")}>{project.title}</h3>
                          {project.featured && (
                            <span className="text-[10px] font-sans uppercase tracking-widest border border-[#2c2c2c] px-2 py-1 ml-4 shrink-0">
                              Featured
                            </span>
                          )}
                        </div>
                        {project.description && (
                          <DescriptionBlock
                            text={project.description}
                            paragraphClassName="text-[#555] leading-relaxed"
                            listClassName="space-y-2 pl-5 text-[#555] leading-relaxed"
                          />
                        )}
                        <div className="flex flex-wrap gap-2 pt-2">
                          {project.techStack.map((tech) => (
                            <span key={tech} className="text-xs font-sans uppercase tracking-wider text-[#666] bg-[#e8e4db] px-2 py-1">
                              {tech}
                            </span>
                          ))}
                        </div>
                        <div className="pt-4">
                          <ProjectActions
                            liveUrl={project.liveUrl}
                            sourceUrl={project.sourceUrl}
                            label={project.title}
                            projectId={project.id}
                            liveClassName="text-xs font-sans uppercase tracking-widest border-b border-[#2c2c2c] pb-1 hover:text-[#888] hover:border-[#888] transition-colors mr-6"
                            sourceClassName="text-xs font-sans uppercase tracking-widest border-b border-[#2c2c2c] pb-1 hover:text-[#888] hover:border-[#888] transition-colors"
                          />
                        </div>
                      </div>
                    </article>
                  ))}
                </CollapsibleList>
              </section>
            ),
    experience: experiences.length > 0 && (
                <section key="experience" id="experience" className="scroll-mt-12">
                  <SectionHeading>{labels.experience}</SectionHeading>
                  <CollapsibleList
                    initial={4}
                    wrapperClassName="space-y-8"
                    buttonClassName="mt-6 border border-[#2c2c2c] bg-transparent px-6 py-2 text-xs font-bold uppercase tracking-widest text-[#2c2c2c] transition-colors hover:bg-[#2c2c2c] hover:text-[#f4f1ea]"
                  >
                    {experiences.map((exp) => (
                      <article key={exp.id} className="relative pl-6 border-l border-[#2c2c2c]/30">
                        <div className="absolute w-2 h-2 bg-[#2c2c2c] rounded-full left-[-4.5px] top-2" />
                        <h3 className="text-xl font-bold">{exp.role}</h3>
                        <p className="text-lg italic text-[#555] mt-1">{exp.company}</p>
                        {(exp.startDate || exp.endDate) && (
                          <p className="text-xs font-sans uppercase tracking-widest text-[#888] mt-2">
                            {formatDateRange(exp.startDate, exp.endDate)}
                          </p>
                        )}
                        {exp.description && (
                          <div className="mt-3 text-[#444] text-sm leading-relaxed">
                            <DescriptionBlock
                              text={exp.description}
                              paragraphClassName="mb-2"
                              listClassName="list-disc pl-4 space-y-1"
                            />
                          </div>
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
                      initial={3}
                      wrapperClassName="space-y-6"
                      buttonClassName="mt-6 border border-[#2c2c2c] bg-transparent px-6 py-2 text-xs font-bold uppercase tracking-widest text-[#2c2c2c] transition-colors hover:bg-[#2c2c2c] hover:text-[#f4f1ea]"
                    >
                      {educations.map((edu) => (
                        <article key={edu.id}>
                          <h3 className="text-lg font-bold">{edu.degree}</h3>
                          <p className="text-[#555] italic mt-1">{edu.institution}</p>
                          <div className="flex justify-between items-center mt-2 text-xs font-sans uppercase tracking-widest text-[#888]">
                            {(edu.startDate || edu.endDate) && (
                              <span>{formatDateRange(edu.startDate, edu.endDate)}</span>
                            )}
                            {edu.gpa && <span>GPA {edu.gpa}</span>}
                          </div>
                        </article>
                      ))}
                    </CollapsibleList>
                  </section>
                ),
    skills: skills.length > 0 && (
                  <section key="skills">
                    <SectionHeading>{labels.skills}</SectionHeading>
                    <div className="space-y-6">
                      {Object.entries(groupedSkills).map(([category, names]) => (
                        <div key={category}>
                          <h3 className="text-sm font-bold uppercase tracking-widest mb-3">{category}</h3>
                          <p className="text-[#444] leading-relaxed">
                            {names.join(", ")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                ),
    certifications: certifications.length > 0 && (
                  <section key="certifications">
                    <SectionHeading>{labels.certifications}</SectionHeading>
                    <CollapsibleList
                      initial={4}
                      wrapperClassName="space-y-6"
                      buttonClassName="mt-6 border border-[#2c2c2c] bg-transparent px-6 py-2 text-xs font-bold uppercase tracking-widest text-[#2c2c2c] transition-colors hover:bg-[#2c2c2c] hover:text-[#f4f1ea]"
                    >
                      {certifications.map((cert) => (
                        <article key={cert.id} className="border-b border-[#2c2c2c]/30 pb-4">
                          <h3 className="text-lg font-bold">
                            {cert.url ? (
                              <a href={cert.url} target="_blank" rel="noopener noreferrer" className="hover:underline underline-offset-4">
                                {cert.name}
                              </a>
                            ) : (
                              cert.name
                            )}
                          </h3>
                          <p className="text-[#555] italic mt-1">{cert.issuer}</p>
                          {cert.issueDate && (
                            <div className="mt-2 text-xs font-sans uppercase tracking-widest text-[#888]">
                              {new Date(cert.issueDate).getFullYear()}
                            </div>
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
                      wrapperClassName="space-y-6"
                      buttonClassName="mt-6 border border-[#2c2c2c] bg-transparent px-6 py-2 text-xs font-bold uppercase tracking-widest text-[#2c2c2c] transition-colors hover:bg-[#2c2c2c] hover:text-[#f4f1ea]"
                    >
                      {achievements.map((ach) => (
                        <article key={ach.id} className="border-b border-[#2c2c2c]/30 pb-4">
                          <h3 className="text-lg font-bold">{ach.title}</h3>
                          {ach.date && (
                            <div className="mt-2 text-xs font-sans uppercase tracking-widest text-[#888]">
                              {new Date(ach.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                            </div>
                          )}
                        </article>
                      ))}
                    </CollapsibleList>
                  </section>
                ),
    articles: articles.length > 0 && (
              <section key="articles" id="writing" className="scroll-mt-12">
                <SectionHeading>{labels.articles}</SectionHeading>
                <CollapsibleList
                  initial={4}
                  wrapperClassName="grid grid-cols-1 sm:grid-cols-2 gap-8"
                  buttonClassName="col-span-full mt-8 mx-auto block border border-[#2c2c2c] bg-transparent px-8 py-3 text-xs font-bold uppercase tracking-widest text-[#2c2c2c] transition-colors hover:bg-[#2c2c2c] hover:text-[#f4f1ea]"
                >
                  {articles.map((article) => (
                    <article key={article.id} className="border-t border-[#2c2c2c] pt-4">
                      <h3 className="text-xl font-bold mb-2 hover:underline underline-offset-4">
                        <a href={article.url} data-lf-track="article" data-lf-label={article.title} data-lf-id={article.id} target="_blank" rel="noopener noreferrer">
                          {article.title}
                        </a>
                      </h3>
                      {article.description && (
                        <p className="text-[#555] text-sm leading-relaxed mb-4">
                          {article.description}
                        </p>
                      )}
                      <div className="text-xs font-sans uppercase tracking-widest text-[#888] flex gap-4">
                        {article.publishedAt && (
                          <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                        )}
                        {article.readTime != null && <span>{article.readTime} min read</span>}
                      </div>
                    </article>
                  ))}
                </CollapsibleList>
              </section>
            ),
    profiles: hasProfiles && (
              <section key="profiles" id="profiles" className="scroll-mt-12">
                <SectionHeading>{labels.profiles}</SectionHeading>
                <div className="border border-[#2c2c2c] p-8 bg-white">
                  <ProfileLinksSection
                    portfolio={portfolio}
                    profiles={socialProfiles}
                    chipClassName="text-xs font-sans tracking-wider uppercase border border-[#2c2c2c] px-4 py-2 hover:bg-[#2c2c2c] hover:text-[#f4f1ea] transition-colors"
                    pillClassName="text-xs font-sans tracking-wider uppercase border border-[#2c2c2c] px-4 py-2 hover:bg-[#2c2c2c] hover:text-[#f4f1ea] transition-colors"
                    titleClassName="text-lg font-bold"
                    textClassName="text-[#555]"
                  />
                </div>
              </section>
            ),
    github: contributionCalendar && (
              <section key="github" className="scroll-mt-12">
                <SectionHeading>{labels.openSource}</SectionHeading>
                <div className="border border-[#2c2c2c] p-6 bg-white overflow-x-auto custom-scrollbar">
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
    <div className={cn(TEMPLATE_CONTAINER, "min-h-screen bg-[#f4f1ea] text-[#2c2c2c] font-serif selection:bg-[#2c2c2c] selection:text-[#f4f1ea]")}>
      <div className="mx-auto max-w-4xl px-6 py-12 md:py-20 space-y-16">

        {navbarEnabled && (
          <div className="flex justify-center border-b-2 border-[#2c2c2c] pb-4 mb-12">
            <TemplateNavbar
              items={sections}
              className="flex gap-6"
              linkClassName="text-sm font-bold uppercase tracking-widest text-[#2c2c2c] hover:underline underline-offset-4"
            />
          </div>
        )}

        <header className="text-center space-y-6">
          <h1 className="min-w-0 text-balance [overflow-wrap:anywhere] text-2xl @sm:text-4xl @md:text-5xl @lg:text-7xl font-bold uppercase tracking-widest leading-tight">
            {portfolio.title}
          </h1>
          {portfolio.headline && (
            <p className="text-xl italic text-[#555] max-w-2xl mx-auto">
              {portfolio.headline}
            </p>
          )}

          <div className="flex flex-col items-center gap-4 mt-8 pt-8 border-t border-[#2c2c2c]/30">
            <ContactChips
              portfolio={portfolio}
              chipClassName="text-sm font-sans tracking-wider uppercase border border-[#2c2c2c] px-4 py-2 hover:bg-[#2c2c2c] hover:text-[#f4f1ea] transition-colors"
            />
            <HeroProfileButtons
              profiles={socialProfiles}
              className="text-sm font-sans tracking-wider uppercase bg-[#2c2c2c] text-[#f4f1ea] px-6 py-2 hover:bg-black transition-colors"
            />
          </div>

          {socialProfiles.length > 0 && (
            <div className="mt-6 flex justify-center">
              <SocialPills
                profiles={socialProfiles}
                showUsername
                className="text-xs font-sans tracking-wider uppercase text-[#555] hover:text-[#2c2c2c]"
              />
            </div>
          )}
        </header>

        {renderSections(resolved, "full", blocks)}

        {customSections.length > 0 && customSections.map((cs) => (
          <section key={cs.id} className="scroll-mt-12">
            <SectionHeading>{cs.label}</SectionHeading>
            <div className="border border-[#2c2c2c] p-8 bg-white">
              <CustomSectionItems
                items={cs.items}
                titleClassName="text-xl font-bold mb-2"
                textClassName="text-[#555] leading-relaxed"
                chipClassName="text-xs font-sans uppercase tracking-wider text-[#666] bg-[#e8e4db] px-2 py-1"
              />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-3xl font-bold uppercase tracking-widest border-b-2 border-[#2c2c2c] pb-4 mb-8 text-center">
      {children}
    </h2>
  );
}
