import { resolveAccentColor, accentRootStyle } from "@/features/templates/template-accent-palettes";
import { stripRichTextToPlain } from "@/lib/rich-text";
import type { PortfolioData } from "../types";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  GitHubContributionHeatmap,
  parseContributionCalendar,
} from "../github-contribution-heatmap";
import {
  FileText,
  FolderOpen,
  Globe,
  LayoutGrid,
  Minus,
  Square,
  Terminal,
  Trophy,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArticleSourceLabel,
  RichText,
  buildTemplateSections,
  ContactChips,
  CustomSectionItems,
  DescriptionBlock,
  TechChip,
  HeroProfileButtons,
  ProfileLinksSection,
  ProjectActions,
  HERO_TITLE_BASE,
  SocialPills,
  hasNonHeroSocialProfiles,
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
import { LinkedInSection } from "@/features/templates/components/linkedin-section";

/**
 * Windows — a desktop, windows as the framing device
 * Subject: one calm desktop with one window per section. Title bars carry the
 * accent; bevels are used only on the window frame and buttons. Content sits in
 * flat white wells with plain ruled rows instead of nested bevel boxes.
 * Type: system UI stack (Tahoma / Segoe UI), real mono only inside Notepad
 * Layout: lead project in a preview pane, an Explorer-style list, taskbar nav
 */
const SYSTEM_FONT = "Tahoma, Verdana, 'Segoe UI', system-ui, sans-serif";

const frame =
  "border border-black bg-[#ececec] shadow-[inset_1px_1px_0_#ffffff,inset_-1px_-1px_0_#808080,5px_5px_0_rgba(0,0,0,0.28)]";
const well =
  "border border-[#808080] bg-white text-black shadow-[inset_1px_1px_0_#404040,1px_1px_0_#ffffff]";
const bevel =
  "shadow-[inset_1px_1px_0_#ffffff,inset_-1px_-1px_0_#808080] active:shadow-[inset_1px_1px_0_#808080,inset_-1px_-1px_0_#ffffff]";
const button = cn(
  "rounded-none border border-black bg-[#ececec] px-3 py-1 text-xs font-semibold text-black hover:bg-white hover:text-black",
  bevel,
);
const moreBtn = cn(button, "mt-3 self-start");
const rowRule = "border-[#d0d0d0]";
const chip = "border border-[#808080] bg-[#ececec] px-2 py-0.5 text-xs text-black";

function formatMonthYear(value: string | Date) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export function WindowsTemplate({ data }: { data: PortfolioData }) {
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
  const primaryColor = resolveAccentColor("windows", portfolio.customization);
  const labels = getSectionLabels(portfolio.customization);
  const groupedSkills = groupSkillsByCategory(skills);
  const githubProfile = socialProfiles.find(
    (profile) => profile.platform.toLowerCase() === "github",
  );
  const githubStats = githubProfile?.cachedStats as Record<string, unknown> | null;
  const contributionCalendar = parseContributionCalendar(
    githubStats?.contributionCalendar,
  );
  const featuredProjects = projects.filter((project) => project.featured);
  const visibleProjects =
    featuredProjects.length > 0
      ? [...featuredProjects, ...projects.filter((p) => !p.featured)]
      : projects;
  const { hasProfiles, navbarEnabled, sections } = buildTemplateSections(data);
  const resolved = resolveSectionLayout(
    getTemplateSectionLayout("windows"),
    portfolio.customization,
  );

  const linkedinSection = data.linkedin ? (
    <Window key="linkedin" id="linkedin" title={`${labels.linkedin} — Profile`}>
      <div className={cn(well, "p-4")}>
        <LinkedInSection
          data={data.linkedin}
          heading={null}
          classes={{
            aboutList: "flex flex-col gap-1.5 pl-4 text-sm leading-relaxed text-black",
            aboutParagraph: "text-sm leading-relaxed text-black",
            postList: "list-disc flex flex-col gap-1.5 pl-5 text-sm",
            postParagraph: "text-sm",
            descriptionParagraph: "text-xs text-black/80",
            descriptionList: "flex flex-col gap-1 pl-4 text-xs text-black/80",
            section: "space-y-4",
            card: cn("border border-[#808080] bg-[#ececec] p-3", bevel),
            title: "text-sm font-bold text-black",
            text: "text-sm text-black",
            muted: "text-xs text-black/70",
            chip,
            link: "text-sm font-semibold text-[var(--lf-accent)] underline underline-offset-2",
          }}
        />
      </div>
    </Window>
  ) : null;

  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: portfolio.summary ? (
      <Window
        key="about"
        id="about"
        title={`Notepad — ${labels.about}.txt`}
        icon={<FileText className="size-4" />}
      >
        <div className={cn(well, "p-4 @md:p-6")}>
          <DescriptionBlock
            text={portfolio.summary}
            paragraphClassName="whitespace-pre-wrap font-mono text-sm leading-7 text-black"
            listClassName="flex flex-col gap-1.5 pl-5 font-mono text-sm leading-7 text-black"
          />
        </div>
      </Window>
    ) : null,

    projects: visibleProjects.length > 0 ? (
      <Window
        key="projects"
        id="work"
        title={`Explorer — ${labels.projects}`}
        icon={<FolderOpen className="size-4" />}
        status={`${visibleProjects.length} ${visibleProjects.length === 1 ? "object" : "objects"}`}
      >
        <div className={cn(well, "p-3 @md:p-4")}>
          <CollapsibleList
            initial={4}
            wrapperClassName="grid min-w-0 grid-cols-1 gap-3 @md:grid-cols-2 [&>*]:min-w-0"
            buttonClassName={cn(moreBtn, "col-span-full justify-self-start")}
          >
            {visibleProjects.map((project) => (
              <article
                key={project.id}
                className="flex min-w-0 flex-col border border-[#808080] bg-[#ececec] p-1.5"
              >
                <TemplateProjectPreview
                  templateId="windows"
                  liveUrl={project.liveUrl ?? null}
                  imageUrl={project.imageUrl ?? null}
                  projectId={project.id}
                  livePreviewProjectIds={livePreviewProjectIds}
                  alt={stripRichTextToPlain(project.title)}
                  loading="lazy"
                  containerClassName="overflow-hidden border border-[#808080] bg-[#ececec]"
                  accentColor={primaryColor}
                />
                <div className="flex min-w-0 grow flex-col px-1 pb-1 pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-black">
                      <RichText text={project.title} />
                    </h3>
                    {project.featured && (
                      <Badge
                        variant="outline"
                        className="h-auto rounded-none border-black bg-[var(--lf-accent)] px-1.5 py-0 font-sans text-[10px] font-semibold tracking-normal text-white"
                      >
                        Featured
                      </Badge>
                    )}
                  </div>
                  {project.description && (
                    <DescriptionBlock
                      text={project.description}
                      paragraphClassName="mt-1.5 text-xs leading-6 text-black/80"
                      listClassName="mt-1.5 flex flex-col gap-1 pl-4 text-xs leading-6 text-black/80"
                    />
                  )}
                  {project.techStack.length > 0 && (
                    <p className="mt-2 text-[11px] text-black/60">
                      {project.techStack.slice(0, 6).join(", ")}
                    </p>
                  )}
                  <div className="mt-auto pt-3">
                    <ProjectActions
                      liveUrl={project.liveUrl}
                      sourceUrl={project.sourceUrl}
                      label={stripRichTextToPlain(project.title)}
                      projectId={project.id}
                      liveClassName={button}
                      sourceClassName={button}
                    />
                  </div>
                </div>
              </article>
            ))}
          </CollapsibleList>
        </div>
      </Window>
    ) : null,

    experience: experiences.length > 0 ? (
      <Window
        key="experience"
        id="experience"
        title={`Task Manager — ${labels.experience}`}
        icon={<LayoutGrid className="size-4" />}
        status={`${experiences.length} ${experiences.length === 1 ? "entry" : "entries"}`}
      >
        <div className={cn(well, "p-3 @md:p-4")}>
          <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
            {experiences.map((exp, index) => (
              <article
                key={exp.id}
                className={cn(
                  "grid grid-cols-1 gap-1.5 border-t py-4 first:border-t-0 first:pt-0 @md:grid-cols-[9rem_minmax(0,1fr)] @md:gap-4",
                  rowRule,
                )}
              >
                <p className="pt-0.5 text-xs tabular-nums text-black/70">
                  {index === 0 && (
                    <span
                      aria-hidden
                      className="mr-1.5 inline-block size-2 bg-[var(--lf-accent)] align-middle"
                    />
                  )}
                  {formatDateRange(exp.startDate, exp.endDate) || "—"}
                </p>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-black">
                    <RichText text={exp.role} />
                  </h3>
                  <p className="mt-0.5 text-sm text-black/70">
                    <RichText text={exp.company} />
                    {exp.location ? (
                      <span className="text-black/50">
                        , <RichText text={exp.location} />
                      </span>
                    ) : null}
                  </p>
                  {exp.description && (
                    <DescriptionBlock
                      text={exp.description}
                      paragraphClassName="mt-2 max-w-2xl text-sm leading-7 text-black"
                      listClassName="mt-2 max-w-2xl flex flex-col gap-1.5 pl-5 text-sm leading-7 text-black"
                    />
                  )}
                </div>
              </article>
            ))}
          </CollapsibleList>
        </div>
      </Window>
    ) : null,

    skills: skills.length > 0 ? (
      <Window key="skills" title={`Control Panel — ${labels.skills}`}>
        <div className={cn(well, "grid grid-cols-1 gap-4 p-4 @md:grid-cols-2")}>
          {Object.entries(groupedSkills).map(([category, names]) => (
            <fieldset
              key={category}
              className="min-w-0 border border-[#808080] px-3 pb-3 pt-1 shadow-[1px_1px_0_#ffffff]"
            >
              <legend className="px-1 text-xs font-bold text-black">{category}</legend>
              <div className="flex flex-wrap gap-1.5">
                {names.map((name) => (
                  <TechChip
                    key={name}
                    name={name}
                    className={cn(chip, "cursor-default")}
                    iconClassName="h-3 w-3"
                  />
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </Window>
    ) : null,

    education: educations.length > 0 ? (
      <Window key="education" title={`Registry — ${labels.education}`}>
        <div className={cn(well, "p-3 @md:p-4")}>
          <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
            {educations.map((edu) => (
              <article
                key={edu.id}
                className={cn(
                  "grid grid-cols-1 gap-1.5 border-t py-3 first:border-t-0 first:pt-0 @md:grid-cols-[9rem_minmax(0,1fr)] @md:gap-4",
                  rowRule,
                )}
              >
                <p className="pt-0.5 text-xs tabular-nums text-black/70">
                  {formatDateRange(edu.startDate, edu.endDate) || "—"}
                </p>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-black">
                    <RichText text={edu.degree} />
                    {edu.field ? (
                      <>
                        {" "}
                        in <RichText text={edu.field} />
                      </>
                    ) : null}
                  </h3>
                  <p className="mt-0.5 text-xs text-black/70">
                    <RichText text={edu.institution} />
                  </p>
                  {edu.gpa && <p className="mt-1 text-xs text-black/60">{edu.gpa}</p>}
                </div>
              </article>
            ))}
          </CollapsibleList>
        </div>
      </Window>
    ) : null,

    certifications: certifications.length > 0 ? (
      <Window key="certifications" title={`${labels.certifications}.exe`}>
        <div className={cn(well, "p-3 @md:p-4")}>
          <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
            {certifications.map((cert) => (
              <article
                key={cert.id}
                className={cn(
                  "flex min-w-0 flex-col gap-1 border-t py-3 first:border-t-0 first:pt-0 @md:flex-row @md:items-baseline @md:justify-between @md:gap-4",
                  rowRule,
                )}
              >
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-black">
                    {cert.url ? (
                      <a
                        href={cert.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--lf-accent)] underline underline-offset-2"
                      >
                        {cert.name}
                      </a>
                    ) : (
                      cert.name
                    )}
                  </h3>
                  <p className="mt-0.5 text-xs text-black/70">{cert.issuer}</p>
                </div>
                {cert.issueDate && (
                  <p className="shrink-0 text-xs tabular-nums text-black/60">
                    {formatMonthYear(cert.issueDate)}
                  </p>
                )}
              </article>
            ))}
          </CollapsibleList>
        </div>
      </Window>
    ) : null,

    achievements: achievements.length > 0 ? (
      <Window key="achievements" title={`${labels.achievements}.sys`}>
        <div className={cn(well, "p-3 @md:p-4")}>
          <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
            {achievements.map((ach) => (
              <article
                key={ach.id}
                className={cn(
                  "flex items-start gap-3 border-t py-3 first:border-t-0 first:pt-0",
                  rowRule,
                )}
              >
                <Trophy className="mt-0.5 size-4 shrink-0 text-[var(--lf-accent)]" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-relaxed text-black">
                    <RichText text={ach.title} />
                  </p>
                  {ach.date && (
                    <p className="mt-0.5 text-xs text-black/60">{formatMonthYear(ach.date)}</p>
                  )}
                </div>
              </article>
            ))}
          </CollapsibleList>
        </div>
      </Window>
    ) : null,

    articles: articles.length > 0 ? (
      <Window
        key="articles"
        id="writing"
        title={`Internet Explorer — ${labels.articles}`}
        icon={<Globe className="size-4" />}
      >
        <div className={cn(well, "p-3 @md:p-4")}>
          <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
            {articles.map((article) => (
              <article
                key={article.id}
                className={cn("border-t py-4 first:border-t-0 first:pt-0", rowRule)}
              >
                <ArticleSourceLabel source={article.source} className="mb-1 text-black/50" />
                <h3 className="text-base font-bold text-black">
                  <a
                    href={article.url}
                    data-lf-track="article"
                    data-lf-label={stripRichTextToPlain(article.title)}
                    data-lf-id={article.id}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--lf-accent)] underline underline-offset-2"
                  >
                    <RichText text={article.title} />
                  </a>
                </h3>
                {article.description && (
                  <p className="mt-1 max-w-2xl text-xs leading-6 text-black/80">
                    <RichText text={article.description} />
                  </p>
                )}
                <p className="mt-1.5 text-[11px] text-black/60">
                  {article.publishedAt ? formatMonthYear(article.publishedAt) : null}
                  {article.readTime != null ? (
                    <span>
                      {article.publishedAt ? ", " : null}
                      {article.readTime} min read
                    </span>
                  ) : null}
                </p>
              </article>
            ))}
          </CollapsibleList>
        </div>
      </Window>
    ) : null,

    profiles: hasProfiles ? (
      <Window key="profiles" id="profiles" title={`Network — ${labels.profiles}`}>
        <div className={cn(well, "p-4")}>
          <ProfileLinksSection
            portfolio={portfolio}
            profiles={socialProfiles}
            chipClassName={chip}
            pillClassName={cn(button, "py-1")}
            titleClassName="text-sm font-bold text-black"
            textClassName="text-xs text-black/70"
          />
        </div>
      </Window>
    ) : null,

    github: contributionCalendar ? (
      <Window
        key="github"
        title={`MS-DOS Prompt — ${labels.github}`}
        icon={<Terminal className="size-4" />}
      >
        <div
          className={cn(
            well,
            "min-w-0 overflow-x-auto p-4 custom-scrollbar [&_.text-stone-400]:!text-stone-700 [&_.text-stone-500]:!text-stone-800",
          )}
        >
          <GitHubContributionHeatmap
            calendar={contributionCalendar}
            profileUrl={githubProfile?.url}
            username={githubProfile?.username}
            variant="minimal"
            stretch
            label={null}
          />
        </div>
      </Window>
    ) : null,
  };

  return (
    <div
      className={cn(
        TEMPLATE_CONTAINER,
        "relative flex min-h-screen flex-col bg-[#2d5a87] text-black selection:bg-[var(--lf-accent)] selection:text-white",
      )}
      style={{ ...accentRootStyle(primaryColor), fontFamily: SYSTEM_FONT }}
    >
      <main className="mx-auto w-full min-w-0 max-w-6xl grow space-y-6 p-4 pb-10 md:space-y-8 md:p-8 md:pb-14">
        <Window title="System Properties">
          <div className={cn(well, "min-w-0 p-5 @md:p-8")}>
            <h1
              className={cn(
                HERO_TITLE_BASE,
                "text-3xl font-bold leading-tight text-black @md:text-5xl",
              )}
            >
              <RichText text={portfolio.title} />
            </h1>
            {portfolio.headline && (
              <p className="mt-3 max-w-2xl text-base leading-7 text-black/80 @md:text-lg">
                <RichText text={portfolio.headline} />
              </p>
            )}

            <Separator className="my-5 bg-[#d0d0d0]" />

            <div className="flex flex-col gap-3">
              <HeroProfileButtons
                profiles={socialProfiles}
                className={cn(button, "py-1.5")}
              />
              <ContactChips
                portfolio={portfolio}
                chipClassName="rounded-[2px] border border-[#808080] bg-white px-2.5 py-1 text-sm text-black/80"
              />
              {hasNonHeroSocialProfiles(socialProfiles) && (
                <SocialPills
                  profiles={socialProfiles}
                  showUsername
                  excludeHeroPlatforms
                  className="text-sm text-[var(--lf-accent)] underline underline-offset-2"
                />
              )}
            </div>
          </div>
        </Window>

        {renderSections(resolved, "full", { ...blocks, linkedin: linkedinSection })}

        {customSections.length > 0 &&
          customSections.map((cs) => (
            <Window key={cs.id} title={`Custom — ${cs.label}`}>
              <div className={cn(well, "p-4")}>
                <CustomSectionItems
                  items={cs.items}
                  titleClassName="text-sm font-bold text-black"
                  textClassName="text-xs leading-6 text-black/80"
                  chipClassName={chip}
                  buttonClassName={moreBtn}
                />
              </div>
            </Window>
          ))}
      </main>

      {/* Taskbar: the template navigation. */}
      {navbarEnabled && (
        <div
          className={cn(
            "sticky bottom-0 z-50 flex h-11 items-center gap-2 border-t border-white bg-[#ececec] px-1.5",
            "shadow-[0_-1px_0_#808080]",
          )}
        >
          <div
            aria-hidden
            className={cn("flex shrink-0 items-center gap-2 border border-black bg-[#ececec] px-2.5 py-1 text-sm font-bold text-black", bevel)}
          >
            <span className="size-3.5 bg-[var(--lf-accent)]" />
            Start
          </div>
          <Separator orientation="vertical" className="h-6 bg-[#808080]" />
          <div className="min-w-0 flex-1">
            <TemplateNavbar
              items={sections}
              className="border-0 bg-transparent backdrop-blur-none"
              linkClassName={cn(
                "border border-black bg-[#ececec] px-3 py-1 text-xs font-semibold text-black hover:bg-white",
                bevel,
              )}
            />
          </div>
          <div
            aria-hidden
            suppressHydrationWarning
            className="hidden shrink-0 items-center border border-[#808080] px-2.5 py-1 text-xs text-black shadow-[inset_1px_1px_0_#808080] @md:flex"
          >
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      )}
    </div>
  );
}

function Window({
  title,
  children,
  id,
  icon,
  status,
}: {
  title: string;
  children: ReactNode;
  id?: string;
  icon?: ReactNode;
  status?: string;
}) {
  const control =
    "flex size-5 items-center justify-center border border-black bg-[#ececec] text-black shadow-[inset_1px_1px_0_#ffffff,inset_-1px_-1px_0_#808080]";
  return (
    <section id={id} className={cn("scroll-mt-12 min-w-0 p-[3px]", frame)}>
      <div className="flex items-center justify-between gap-3 bg-[linear-gradient(90deg,var(--lf-accent),color-mix(in_srgb,var(--lf-accent)_45%,#000))] px-2 py-1 text-white">
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          <span className="shrink-0">{icon || <Terminal className="size-4" />}</span>
          <span className="truncate">{title}</span>
        </div>
        <div aria-hidden className="flex shrink-0 gap-1">
          <span className={control}>
            <Minus className="size-3" />
          </span>
          <span className={control}>
            <Square className="size-2.5" />
          </span>
          <span className={control}>
            <X className="size-3" />
          </span>
        </div>
      </div>
      <div className="p-2.5 @md:p-3">{children}</div>
      {status && (
        <div className="mx-2.5 mb-2.5 border border-[#808080] px-2 py-0.5 text-[11px] text-black/70 shadow-[inset_1px_1px_0_#808080] @md:mx-3 @md:mb-3">
          {status}
        </div>
      )}
    </section>
  );
}
