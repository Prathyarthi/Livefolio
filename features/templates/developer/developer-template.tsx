import { cn } from "@/lib/utils";
import {
  formatDateRange,
  groupSkillsByCategory,
  getPlatformIcon,
} from "@/features/templates/utils";
import type { PortfolioData } from "@/features/templates/types";
import { getTemplateSectionLayout } from "@/features/templates/section-layouts";
import {
  renderSections,
  resolveSectionLayout,
  type ReorderableSectionKey,
} from "@/features/templates/section-order";
import {
  GitHubContributionHeatmap,
  parseContributionCalendar,
} from "@/features/templates/github-contribution-heatmap";
import { Trophy } from "lucide-react";
import {
  buildTemplateSections,
  ContactChips,
  CustomSectionItems,
  DescriptionBlock,
  HeroProfileButtons,
  PROJECT_CARD,
  PROJECT_CARD_HEADER,
  PROJECT_CARD_META,
  PROJECT_CARD_TITLE,
  PROJECTS_GRID_2,
  TEMPLATE_CONTAINER,
  TemplateNavbar,
} from "@/features/templates/shared";
import { CollapsibleList } from "@/features/templates/collapsible-list";

// import { getPreviewImage } from "@/lib/link-preview-code";
import { TemplateProjectPreview } from "@/components/template-project-preview";


export default function DeveloperTemplate({ data }: { data: PortfolioData }) {
  const { portfolio, experiences, educations, skills, projects, socialProfiles, certifications, achievements, customSections, livePreviewProjectIds } =
    data;
  const skillsByCategory = groupSkillsByCategory(skills);

  // Extract stats from social profiles
  const githubProfile = socialProfiles.find(
    (p) => p.platform.toLowerCase() === "github"
  );
  const leetcodeProfile = socialProfiles.find(
    (p) => p.platform.toLowerCase() === "leetcode"
  );
  const githubStats = githubProfile?.cachedStats as Record<string, unknown> | null;
  const leetcodeStats = leetcodeProfile?.cachedStats as Record<string, unknown> | null;
  const contributionCalendar = parseContributionCalendar(
    githubStats?.contributionCalendar
  );
  const { hasProfiles, navbarEnabled, sections } = buildTemplateSections(data);

  const resolved = resolveSectionLayout(
    getTemplateSectionLayout("developer"),
    portfolio.customization,
  );
  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: portfolio.summary && (
            <section key="about" id="about" className="scroll-mt-24 border-b border-green-900/30 bg-gray-950/50">
              <div className="mx-auto max-w-5xl px-5 py-14 sm:px-6 md:py-16">
                <p className="mb-4 text-sm text-gray-600">
                  guest@portfolio:~$ cat summary.md
                </p>
                <div className="rounded-lg border border-green-900/50 bg-gray-900/60 overflow-hidden">
                  <div className="flex items-center gap-2 border-b border-green-900/30 bg-gray-900 px-4 py-2">
                    <span className="h-3 w-3 rounded-full bg-red-500/60" />
                    <span className="h-3 w-3 rounded-full bg-yellow-500/60" />
                    <span className="h-3 w-3 rounded-full bg-green-500/60" />
                    <span className="ml-3 text-xs text-gray-600">summary.md</span>
                  </div>
                  <div className="flex">
                    <div className="hidden select-none border-r border-green-900/30 px-4 py-4 text-right text-sm text-gray-700 sm:block">
                      {portfolio.summary.split("\n").length > 1
                        ? portfolio.summary.split("\n").map((_, i) => (
                          <div key={i}>{i + 1}</div>
                        ))
                        : [1, 2, 3].map((n) => <div key={n}>{n}</div>)}
                    </div>
                    <div className="p-4">
                      <DescriptionBlock
                        text={portfolio.summary}
                        paragraphClassName="text-green-300/90 leading-relaxed whitespace-pre-wrap"
                        listClassName="space-y-2 pl-5 text-green-300/90 leading-relaxed marker:text-green-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ),
    projects: projects.length > 0 && (
            <section key="projects" id="work" className="scroll-mt-24 border-b border-green-900/30">
              <div className="mx-auto max-w-5xl px-5 py-14 sm:px-6 md:py-16">
                <p className="mb-8 text-sm text-gray-600">
                  guest@portfolio:~$ ls -la ~/projects/
                </p>
                <CollapsibleList
                  initial={4}
                  wrapperClassName={cn(PROJECTS_GRID_2, "gap-5 @md:gap-6")}
                  showLabel="cat ./more ({n})"
                  hideLabel="collapse"
                  buttonClassName="@md:col-span-2 mt-2 rounded border border-green-900/40 bg-gray-900/50 px-4 py-2 font-mono text-xs text-green-500 hover:border-green-700/60 hover:text-green-300 transition-colors"
                >
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className={cn(
                        PROJECT_CARD,
                        "group rounded-lg border border-green-900/40 bg-gray-900/50 hover:border-green-700/60 hover:bg-gray-900/80 transition-all duration-300"
                      )}
                    >
                      <TemplateProjectPreview templateId="developer"
                        liveUrl={project.liveUrl ?? null}
                        projectId={project.id}
                        livePreviewProjectIds={livePreviewProjectIds}
                        alt={project.title}
                        loading="lazy"
                      />
                      <div className="p-5">
                        <div className={PROJECT_CARD_HEADER}>
                          <div className="min-w-0 flex-1">
                            <div className={PROJECT_CARD_META}>
                              <h3 className={cn(PROJECT_CARD_TITLE, "text-base font-semibold text-green-300 group-hover:text-green-200 transition-colors")}>
                                {project.title}
                              </h3>
                              {project.featured && (
                                <span className="shrink-0 rounded border border-yellow-700/50 bg-yellow-900/20 px-1.5 py-0.5 text-[10px] text-yellow-500 uppercase tracking-wider">
                                  featured
                                </span>
                              )}
                            </div>
                            {project.language && (
                              <div className="mt-1.5 flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                                <span className="text-xs text-gray-500">
                                  {project.language}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-3 text-xs text-gray-500">
                            {project.githubStars != null && project.githubStars > 0 && (
                              <span className="flex items-center gap-1" title="Stars">
                                <svg
                                  className="h-3.5 w-3.5 text-yellow-500/70"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                {project.githubStars}
                              </span>
                            )}
                            {project.githubForks != null && project.githubForks > 0 && (
                              <span className="flex items-center gap-1" title="Forks">
                                <svg
                                  className="h-3.5 w-3.5 text-gray-500"
                                  fill="currentColor"
                                  viewBox="0 0 16 16"
                                >
                                  <path d="M5 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm0 9.5a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm7.5-9.5a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM5 12.75v-1a4 4 0 0 1 4-4h1.25v-1A2.25 2.25 0 0 1 12.5 4.5V3.25a2.25 2.25 0 1 0-4.5 0v1.25A4 4 0 0 0 4 8.5v1a2.25 2.25 0 1 0 1 3.25ZM4.25 11a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM11.5 1a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z" />
                                </svg>
                                {project.githubForks}
                              </span>
                            )}
                          </div>
                        </div>

                        <DescriptionBlock
                          text={project.description}
                          paragraphClassName="mt-3 text-sm text-gray-400 leading-relaxed"
                          listClassName="mt-3 space-y-2 pl-5 text-sm text-gray-400 leading-relaxed marker:text-green-900"
                        />

                        {project.techStack.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {project.techStack.map((tech) => (
                              <span
                                key={tech}
                                className="rounded bg-green-900/20 px-2 py-0.5 text-[11px] text-green-500/80 border border-green-900/30"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-4 flex items-center gap-4">
                          {project.sourceUrl && (
                            <a
                              href={project.sourceUrl} data-lf-track="project_source" data-lf-label={project.title} data-lf-id={project.id}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-green-600 underline decoration-green-900 hover:text-green-400 transition-colors"
                            >
                              source
                            </a>
                          )}
                          {project.liveUrl && (
                            <a
                              href={project.liveUrl} data-lf-track="project_live" data-lf-label={project.title} data-lf-id={project.id}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-green-600 underline decoration-green-900 hover:text-green-400 transition-colors"
                            >
                              live demo
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CollapsibleList>
              </div>
            </section>
          ),
    experience: experiences.length > 0 && (
            <section key="experience" id="experience" className="scroll-mt-24 border-b border-green-900/30">
              <div className="mx-auto max-w-5xl px-5 py-14 sm:px-6 md:py-16">
                <p className="mb-8 text-sm text-gray-600">
                  guest@portfolio:~$ git log --oneline --graph career.log
                </p>
                <div className="relative space-y-8 border-l-2 border-green-900/50 pl-6 ml-2">
                  {experiences.map((exp) => {
                    const hash = exp.id.slice(0, 7);
                    return (
                      <div key={exp.id} className="relative group">
                        {/* Dot on timeline */}
                        <div className="absolute -left-8 top-1 h-3 w-3 rounded-full border-2 border-green-700 bg-gray-950 group-hover:bg-green-600 transition-colors" />
                        <div className="rounded-lg border border-green-900/30 bg-gray-900/40 p-5 hover:border-green-800/60 transition-colors">
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <span className="text-yellow-500/80 text-xs">
                              commit {hash}
                            </span>
                            {(exp.startDate || exp.endDate) && (
                              <span className="text-gray-600 text-xs">
                                {formatDateRange(exp.startDate, exp.endDate)}
                              </span>
                            )}
                          </div>
                          <h3 className="mt-2 text-lg font-semibold text-green-300">
                            {exp.role}
                          </h3>
                          <p className="text-sm text-green-600">
                            @ {exp.company}
                            {exp.location && (
                              <span className="text-gray-600"> ({exp.location})</span>
                            )}
                          </p>
                          {exp.description && (
                            <DescriptionBlock
                              text={exp.description}
                              paragraphClassName="mt-3 text-sm text-gray-400 leading-relaxed"
                              listClassName="mt-3 space-y-2 pl-5 text-sm text-gray-400 leading-relaxed marker:text-green-900"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          ),
    education: educations.length > 0 && (
            <section key="education" className="border-b border-green-900/30">
              <div className="mx-auto max-w-5xl px-5 py-14 sm:px-6 md:py-16">
                <p className="mb-6 text-sm text-gray-600">
                  guest@portfolio:~$ cat education.log
                </p>
                <div className="space-y-4">
                  {educations.map((edu) => (
                    <div
                      key={edu.id}
                      className="rounded-lg border border-green-900/30 bg-gray-900/40 p-4"
                    >
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h3 className="text-green-300 font-semibold">
                          {edu.degree}
                          {edu.field && <span className="text-green-500/70"> in {edu.field}</span>}
                        </h3>
                        {edu.gpa && (
                          <span className="text-xs text-yellow-500/70">GPA: {edu.gpa}</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {edu.institution}
                        {(edu.startDate || edu.endDate) && (
                          <>
                            <span className="text-gray-700"> | </span>
                            <span className="text-gray-600">
                              {formatDateRange(edu.startDate, edu.endDate)}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ),
    skills: skills.length > 0 && (
            <section key="skills" className="border-b border-green-900/30">
              <div className="mx-auto max-w-5xl px-5 py-14 sm:px-6 md:py-16">
                <p className="mb-6 text-sm text-gray-600">
                  guest@portfolio:~$ cat package.json | jq &apos;.dependencies&apos;
                </p>
                <div className="rounded-lg border border-green-900/50 bg-gray-900/60 overflow-hidden">
                  <div className="flex items-center gap-2 border-b border-green-900/30 bg-gray-900 px-4 py-2">
                    <span className="h-3 w-3 rounded-full bg-red-500/60" />
                    <span className="h-3 w-3 rounded-full bg-yellow-500/60" />
                    <span className="h-3 w-3 rounded-full bg-green-500/60" />
                    <span className="ml-3 text-xs text-gray-600">skills.json</span>
                  </div>
                  <div className="p-5">
                    <pre className="text-sm leading-7">
                      <span className="text-gray-600">{"{"}</span>
                      {"\n"}
                      {Object.entries(skillsByCategory).map(([category, categorySkills], catIdx, catArr) => (
                        <span key={category}>
                          <span className="text-gray-600">{"  "}</span>
                          <span className="text-green-500/60">
                            {"// "}
                            {category}
                          </span>
                          {"\n"}
                          {categorySkills.map((skill, i) => {
                            const isLastSkill =
                              catIdx === catArr.length - 1 &&
                              i === categorySkills.length - 1;
                            return (
                              <span key={skill}>
                                <span className="text-gray-600">{"  "}</span>
                                <span className="text-green-300">
                                  &quot;{skill}&quot;
                                </span>
                                <span className="text-gray-600">: </span>
                                <span className="text-yellow-500/80">
                                  &quot;*&quot;
                                </span>
                                {!isLastSkill && (
                                  <span className="text-gray-600">,</span>
                                )}
                                {"\n"}
                              </span>
                            );
                          })}
                        </span>
                      ))}
                      <span className="text-gray-600">{"}"}</span>
                    </pre>
                  </div>
                </div>
              </div>
            </section>
          ),
    certifications: certifications.length > 0 && (
            <section key="certifications" className="border-b border-green-900/30">
              <div className="mx-auto max-w-5xl px-5 py-14 sm:px-6 md:py-16">
                <p className="mb-6 text-sm text-gray-600">
                  guest@portfolio:~$ ls ~/certifications/
                </p>
                <div className="flex flex-wrap gap-3">
                  {certifications.map((cert) => (
                    <div
                      key={cert.id}
                      className="rounded border border-green-900/40 bg-gray-900/40 px-4 py-3"
                    >
                      <p className="text-sm text-green-300">
                        {cert.url ? (
                          <a
                            href={cert.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline decoration-green-900 hover:text-green-200 transition-colors"
                          >
                            {cert.name}
                          </a>
                        ) : (
                          cert.name
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-600">
                        {cert.issuer}
                        {cert.issueDate && ` | ${formatDateRange(cert.issueDate, null).split(" - ")[0]}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ),
    achievements: achievements.length > 0 && (
            <section key="achievements" className="border-b border-green-900/30 bg-gray-950">
              <div className="mx-auto max-w-5xl px-5 py-14 sm:px-6 md:py-16">
                <p className="mb-6 text-sm text-gray-600">
                  guest@portfolio:~$ cat ~/achievements.txt
                </p>
                <div className="space-y-3">
                  {achievements.map((ach) => (
                    <div key={ach.id} className="flex items-start gap-3 rounded border border-green-900/40 bg-gray-900/40 px-4 py-3">
                      <Trophy className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300 leading-relaxed">{ach.title}</p>
                        {ach.date && (
                          <p className="mt-1 text-xs text-gray-600">
                            {new Date(ach.date).toLocaleDateString("en-US", {
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ),
    profiles: hasProfiles && (
            <section key="profiles" id="profiles" className="scroll-mt-24 border-b border-green-900/30 bg-gray-950/60">
              <div className="mx-auto max-w-5xl px-5 py-14 sm:px-6 md:py-16">
                <p className="mb-6 text-sm text-gray-600">
                  guest@portfolio:~$ cat profiles.json
                </p>
                <div className="rounded-lg border border-green-900/40 bg-gray-900/50 p-5">
                  <p className="text-sm text-green-300">connect</p>
                  <p className="mt-2 text-sm text-gray-500">
                    Open the profiles below to verify identity, code, and contact details.
                  </p>
                  <div className="mt-5">
                    <ContactChips
                      portfolio={portfolio}
                      chipClassName="rounded border border-green-900/40 bg-gray-950 px-3 py-1.5 text-sm text-gray-400"
                    />
                  </div>
                  {socialProfiles.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-3">
                      {socialProfiles.map((profile) => (
                        <a
                          key={`${profile.platform}-${profile.url}`}
                          href={profile.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded border border-green-900/40 bg-gray-950 px-3 py-1.5 text-sm text-green-400/80 transition-colors hover:text-green-300"
                        >
                          {getPlatformIcon(profile.platform)}
                          {profile.username && (
                            <span className="text-gray-500"> ({profile.username})</span>
                          )}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          ),
    github: (githubStats || leetcodeStats || contributionCalendar) && (
            <section key="github" className="border-b border-green-900/30">
              <div className="mx-auto max-w-5xl px-5 py-10 sm:px-6 md:py-12">
                <p className="mb-6 text-sm text-gray-600">
                  guest@portfolio:~$ neofetch --stats
                </p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {githubStats?.public_repos != null && (
                    <StatBlock label="repos" value={String(githubStats.public_repos)} />
                  )}
                  {githubStats?.followers != null && (
                    <StatBlock label="followers" value={String(githubStats.followers)} />
                  )}
                  {githubStats?.following != null && (
                    <StatBlock label="following" value={String(githubStats.following)} />
                  )}
                  {githubStats?.stars != null && (
                    <StatBlock label="total stars" value={String(githubStats.stars)} />
                  )}
                  {leetcodeStats?.solved != null && (
                    <StatBlock label="LC solved" value={String(leetcodeStats.solved)} />
                  )}
                  {leetcodeStats?.ranking != null && (
                    <StatBlock label="LC rank" value={String(leetcodeStats.ranking)} />
                  )}
                  {leetcodeStats?.acceptanceRate != null && (
                    <StatBlock
                      label="acceptance"
                      value={`${leetcodeStats.acceptanceRate}%`}
                    />
                  )}
                </div>
                {contributionCalendar && (
                  <GitHubContributionHeatmap
                    calendar={contributionCalendar}
                    profileUrl={githubProfile?.url}
                    username={githubProfile?.username}
                  />
                )}
              </div>
            </section>
          ),
  };

  return (
    <div className={cn(TEMPLATE_CONTAINER, "relative min-h-screen overflow-hidden bg-gray-950 font-mono text-green-400 selection:bg-green-400/20")}>
      <div className="pointer-events-none absolute inset-0 z-50 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.03)_2px,rgba(0,0,0,0.03)_4px)]" />
      <header className="relative border-b border-green-900/50 bg-gray-950">
        <div className="mx-auto max-w-5xl px-5 py-14 sm:px-6 md:py-20">
          <div className="mb-2 text-sm text-gray-600">
            guest@portfolio:~$
          </div>
          <div className="flex items-start gap-6 md:gap-8">
            <div className="flex-1">
              <p className="mb-1 text-gray-500 text-xs tracking-widest uppercase">
                $ whoami
              </p>
              <h1 className="min-w-0 text-balance [overflow-wrap:anywhere] text-xl @sm:text-2xl @md:text-3xl @lg:text-5xl font-bold text-green-300">
                {portfolio.title}
              </h1>
              <p className="mt-3 text-lg text-green-500/80">
                <span className="text-gray-600">{"// "}</span>
                {portfolio.headline}
              </p>
              {portfolio.location && (
                <p className="mt-2 text-sm text-gray-500">
                  <span className="text-green-700">location:</span> {portfolio.location}
                </p>
              )}
              {portfolio.contactEmail && (
                <p className="text-sm text-gray-500">
                  <span className="text-green-700">email:</span>{" "}
                  <a
                    href={`mailto:${portfolio.contactEmail}`}
                    className="text-green-400/70 underline decoration-green-800 hover:text-green-300 transition-colors"
                  >
                    {portfolio.contactEmail}
                  </a>
                </p>
              )}
              <div className="mt-4">
                <HeroProfileButtons
                  profiles={socialProfiles}
                  className="rounded border border-green-900/40 bg-gray-900/70 px-3 py-1.5 text-sm text-green-400/80 transition-colors hover:text-green-300"
                />
              </div>
              <div className="mt-4 inline-block h-5 w-2.5 animate-pulse bg-green-400" />
            </div>
          </div>
        </div>
      </header>

      {navbarEnabled && (
        <div className="border-b border-green-900/40 bg-gray-950/90">
          <div className="mx-auto max-w-5xl px-5 py-2.5 sm:px-6 md:py-3">
            <TemplateNavbar
              items={sections}
              className="rounded-full border-green-900/40 bg-gray-900/70"
              linkClassName="rounded-full px-4 py-2 text-sm text-gray-500 transition-colors hover:bg-green-950/50 hover:text-green-300"
            />
          </div>
        </div>
      )}

      {/* About / cat summary.md */}
      {renderSections(resolved, "full", blocks)}

      {customSections.map((cs) => (
        <section key={cs.id} className="border-b border-green-900/30">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <p className="mb-6 text-sm text-gray-600">
              guest@portfolio:~$ cat ~/{cs.sectionType}.txt
            </p>
            <div className="rounded-lg border border-green-900/40 bg-gray-900/50 p-5">
              <p className="text-sm text-green-300 mb-4">{cs.label}</p>
              <CustomSectionItems
                items={cs.items}
                titleClassName="font-semibold text-green-300"
                textClassName="text-sm text-gray-400"
                chipClassName="rounded bg-green-900/20 px-2 py-0.5 text-[11px] text-green-500/80 border border-green-900/30"
              />
            </div>
          </div>
        </section>
      ))}

      {/* Contact / Social Footer */}
      <footer className="bg-gray-950">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <p className="mb-6 text-sm text-gray-600">
            guest@portfolio:~$ cat .social-links
          </p>
          <div className="space-y-2">
            {socialProfiles.map((profile) => (
              <div key={profile.platform} className="text-sm">
                <span className="text-green-700">$</span>{" "}
                <span className="text-gray-500">open</span>{" "}
                <a
                  href={profile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400/80 underline decoration-green-900 hover:text-green-300 transition-colors"
                >
                  {getPlatformIcon(profile.platform)}
                  {profile.username && (
                    <span className="text-gray-500"> ({profile.username})</span>
                  )}
                </a>
              </div>
            ))}
            {portfolio.websiteUrl && (
              <div className="text-sm">
                <span className="text-green-700">$</span>{" "}
                <span className="text-gray-500">open</span>{" "}
                <a
                  href={portfolio.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400/80 underline decoration-green-900 hover:text-green-300 transition-colors"
                >
                  {portfolio.websiteUrl}
                </a>
              </div>
            )}
            {portfolio.phone && (
              <div className="text-sm">
                <span className="text-green-700">$</span>{" "}
                <span className="text-gray-500">call</span>{" "}
                <a
                  href={`tel:${portfolio.phone}`}
                  className="text-green-400/80 underline decoration-green-900 hover:text-green-300 transition-colors"
                >
                  {portfolio.phone}
                </a>
              </div>
            )}
          </div>
          <div className="mt-12 border-t border-green-900/30 pt-6">
            <p className="text-xs text-gray-700">
              <span className="text-green-900">guest@portfolio:~$</span>{" "}
              <span className="inline-block h-3.5 w-1.5 animate-pulse bg-green-800" />
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ---- Sub-components ---- */

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-green-900/40 bg-gray-900/40 px-4 py-3 text-center">
      <p className="text-xl font-bold text-green-300">{value}</p>
      <p className="mt-0.5 text-[11px] uppercase tracking-wider text-gray-600">
        {label}
      </p>
    </div>
  );
}
