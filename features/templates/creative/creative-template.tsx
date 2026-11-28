import { DM_Sans, Fraunces } from "next/font/google";
import { cn } from "@/lib/utils";
import { stripRichTextToPlain } from "@/lib/rich-text";
import {
  GitHubContributionHeatmap,
  parseContributionCalendar,
} from "@/features/templates/github-contribution-heatmap";
import {
  ArticleSourceLabel,
  RichText,
  buildTemplateSections,
  ContactChips,
  getSectionLabels,
  DescriptionBlock,
  TechChip,
  CustomSectionItems,
  HeroProfileButtons,
  ProfileLinksSection,
  ProjectActions,
  HERO_HEADER_COLUMN,
  HERO_HEADLINE_SCALE,
  HERO_TITLE_BASE,
  HERO_TITLE_SCALE_7XL,
  SocialPills,
  hasNonHeroSocialProfiles,
  TEMPLATE_CONTAINER,
  TemplateNavbar,
} from "@/features/templates/shared";
import { CollapsibleList } from "@/features/templates/collapsible-list";
import type { PortfolioData } from "@/features/templates/types";
import { resolveAccentColor, accentRootStyle } from "@/features/templates/template-accent-palettes";
import { formatDate, formatDateRange, groupSkillsByCategory } from "@/features/templates/utils";
import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TemplateProjectPreview } from "@/components/template-project-preview";
import { getTemplateSectionLayout } from "../section-layouts";
import {
  renderSections,
  resolveSectionLayout,
  type ReorderableSectionKey,
} from "../section-order";
import { LinkedInSection } from "@/features/templates/components/linkedin-section";

/**
 * Creative — print studio collage
 * Subject: a working designer's desk — color scraps, soft mats, bold display type.
 * Expressive without the SaaS frosted-card kit or a flat quiet gallery.
 *
 * Color: wash lilac→peach→paper, ink #171412, mats peach/lilac/mint/blush, accent --lf-accent
 * Type: Fraunces (display, soft) + DM Sans (body)
 * Layout: scrap shapes in hero; equal project mats with cycling color; open bands below
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "WONK"],
  variable: "--font-creative-display",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-creative-sans",
});

const MATS = ["#ffd8c2", "#e4d4f5", "#c8eadc", "#ffd0da"] as const;

const ink = "text-[#171412]";
const mute = "text-[#6d645c]";
const moreBtn =
  "mt-8 self-start rounded-full border border-[#171412]/15 bg-white/80 px-4 py-2 text-sm font-medium text-[#6d645c] transition-colors hover:border-[var(--lf-accent)] hover:text-[var(--lf-accent)]";

export default function CreativeTemplate({ data }: { data: PortfolioData }) {
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
  const primaryColor = resolveAccentColor("creative", portfolio.customization);
  const labels = getSectionLabels(portfolio.customization);
  const skillsByCategory = groupSkillsByCategory(skills);
  const githubProfile = socialProfiles.find(
    (profile) => profile.platform.toLowerCase() === "github",
  );
  const githubStats = githubProfile?.cachedStats as Record<string, unknown> | null;
  const contributionCalendar = parseContributionCalendar(
    githubStats?.contributionCalendar,
  );
  const featuredProjects = projects.filter((project) => project.featured);
  const orderedProjects =
    featuredProjects.length > 0
      ? [...featuredProjects, ...projects.filter((p) => !p.featured)]
      : projects;
  const { hasProfiles, navbarEnabled, sections } = buildTemplateSections(data);
  const resolved = resolveSectionLayout(
    getTemplateSectionLayout("creative"),
    portfolio.customization,
  );

  const linkedinSection = data.linkedin ? (
    <LinkedInSection
      data={data.linkedin}
      heading={<SectionHeading>{labels.linkedin}</SectionHeading>}
      classes={{
        aboutList: cn("flex flex-col gap-3 pl-5 text-base leading-8 marker:text-[var(--lf-accent)]", mute),
        aboutParagraph: cn("text-base leading-8", mute),
        postList: cn("flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed", ink),
        postParagraph: cn("text-sm leading-relaxed", ink),
        descriptionParagraph: cn("text-sm leading-7", mute),
        descriptionList: cn("flex flex-col gap-2 pl-5 text-sm leading-7 marker:text-[var(--lf-accent)]", mute),
        card: "rounded-[1.5rem] border border-[#171412]/08 bg-white/85 p-5 shadow-[0_18px_50px_-28px_rgba(23,20,18,0.25)]",
        title: "font-[family-name:var(--font-creative-display)] text-xl font-medium text-[#171412]",
        text: cn("text-sm leading-7", mute),
        muted: "text-sm text-[#8a8076]",
        chip: "rounded-full border border-[#171412]/10 bg-[#fff6ee] px-3 py-1.5 text-sm text-[#6d645c]",
        link: "text-sm font-medium text-[var(--lf-accent)] underline-offset-4 hover:underline",
        section: "scroll-mt-28",
      }}
    />
  ) : null;

  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: portfolio.summary ? (
      <section key="about" id="about" className="scroll-mt-28">
        <SectionHeading>{labels.about}</SectionHeading>
        <div className="relative">
          <div
            aria-hidden
            className="absolute -left-3 -top-3 h-16 w-16 rounded-[1.25rem] bg-[#e4d4f5]/70"
          />
          <DescriptionBlock
            text={portfolio.summary}
            paragraphClassName={cn("relative text-lg leading-9", mute)}
            listClassName={cn("relative flex flex-col gap-3 pl-5 text-lg leading-9 marker:text-[var(--lf-accent)]", mute)}
          />
        </div>
      </section>
    ) : null,

    projects: orderedProjects.length > 0 ? (
      <section key="projects" id="work" className="scroll-mt-28 min-w-0">
        <SectionHeading>{labels.projects}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName="grid min-w-0 grid-cols-1 gap-8 @md:grid-cols-2 [&>*]:min-w-0"
          buttonClassName={cn(moreBtn, "col-span-full")}
        >
          {orderedProjects.map((project, index) => {
            const mat = MATS[index % MATS.length];
            return (
              <article
                key={project.id}
                className="flex min-w-0 flex-col overflow-hidden rounded-[1.75rem] border border-[#171412]/08 bg-white shadow-[0_22px_60px_-30px_rgba(23,20,18,0.35)]"
              >
                <div className="rounded-b-[1.25rem] p-3" style={{ backgroundColor: mat }}>
                  <div className="overflow-hidden rounded-[1.25rem] border border-[#171412]/08 bg-white/40">
                    <TemplateProjectPreview
                      templateId="creative"
                      liveUrl={project.liveUrl ?? null}
                      imageUrl={project.imageUrl ?? null}
                      projectId={project.id}
                      livePreviewProjectIds={livePreviewProjectIds}
                      alt={stripRichTextToPlain(project.title)}
                      loading="lazy"
                      accentColor={primaryColor}
                      containerClassName="bg-white/50"
                    />
                  </div>
                </div>
                <div className="flex grow flex-col gap-3 p-5">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h3 className={cn("font-[family-name:var(--font-creative-display)] text-2xl font-medium tracking-[-0.02em]", ink)}>
                      <RichText text={project.title} />
                    </h3>
                    {project.featured && (
                      <Badge
                        variant="outline"
                        className="h-auto rounded-full border-[var(--lf-accent)]/45 bg-[color-mix(in_srgb,var(--lf-accent)_12%,white)] px-2 py-0 font-sans text-[11px] font-medium tracking-normal text-[var(--lf-accent)]"
                      >
                        Featured
                      </Badge>
                    )}
                  </div>
                  {project.description && (
                    <DescriptionBlock
                      text={project.description}
                      paragraphClassName={cn("text-sm leading-6", mute)}
                      listClassName={cn("flex flex-col gap-1.5 pl-5 text-sm leading-6", mute)}
                    />
                  )}
                  {project.techStack.length > 0 && (
                    <p className="text-xs text-[#8a8076]">
                      {project.techStack.slice(0, 6).join("  ·  ")}
                    </p>
                  )}
                  <div className="mt-auto pt-2">
                    <ProjectActions
                      liveUrl={project.liveUrl}
                      sourceUrl={project.sourceUrl}
                      label={stripRichTextToPlain(project.title)}
                      projectId={project.id}
                      liveClassName="rounded-full bg-[#171412] px-4 py-1.5 text-xs font-semibold text-[#fff8f1] hover:bg-black hover:text-[#fff8f1]"
                      sourceClassName="rounded-full border border-[#171412]/12 bg-[#fff6ee] px-4 py-1.5 text-xs font-semibold text-[#6d645c] hover:border-[var(--lf-accent)] hover:text-[var(--lf-accent)]"
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </CollapsibleList>
      </section>
    ) : null,

    experience: experiences.length > 0 ? (
      <section key="experience" id="experience" className="scroll-mt-28">
        <SectionHeading>{labels.experience}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName="grid grid-cols-1 gap-4 @md:grid-cols-2"
          buttonClassName={cn(moreBtn, "col-span-full")}
        >
          {experiences.map((exp, index) => (
            <article
              key={exp.id}
              className="rounded-[1.5rem] border border-[#171412]/08 bg-white/90 p-5 shadow-[0_14px_40px_-24px_rgba(23,20,18,0.3)]"
              style={{ borderTopWidth: 4, borderTopColor: MATS[index % MATS.length] }}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className={cn("font-[family-name:var(--font-creative-display)] text-xl font-medium", ink)}>
                  <RichText text={exp.role} />
                </h3>
                {(exp.startDate || exp.endDate) && (
                  <span className="rounded-full bg-[#fff6ee] px-2.5 py-1 text-xs tabular-nums text-[#6d645c]">
                    {formatDateRange(exp.startDate, exp.endDate)}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm font-medium text-[var(--lf-accent)]">
                <RichText text={exp.company} />
                {exp.location ? (
                  <span className={cn("font-normal", mute)}>
                    {" · "}
                    <RichText text={exp.location} />
                  </span>
                ) : null}
              </p>
              {exp.description && (
                <DescriptionBlock
                  text={exp.description}
                  paragraphClassName={cn("mt-3 text-sm leading-7", mute)}
                  listClassName={cn("mt-3 flex flex-col gap-2 pl-5 text-sm leading-7", mute)}
                />
              )}
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    articles: articles.length > 0 ? (
      <section key="articles" id="writing" className="scroll-mt-28">
        <SectionHeading>{labels.articles}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col gap-3" buttonClassName={moreBtn}>
          {articles.map((article, index) => (
            <article
              key={article.id}
              className="flex gap-4 rounded-[1.35rem] border border-[#171412]/08 bg-white/90 p-4"
            >
              <span
                aria-hidden
                className="mt-1 size-3 shrink-0 rounded-full"
                style={{ backgroundColor: MATS[index % MATS.length] }}
              />
              <div className="min-w-0 flex-1">
                <ArticleSourceLabel source={article.source} className={cn("mb-1", mute)} />
                <h3 className={cn("font-[family-name:var(--font-creative-display)] text-lg font-medium", ink)}>
                  <a
                    href={article.url}
                    data-lf-track="article"
                    data-lf-label={stripRichTextToPlain(article.title)}
                    data-lf-id={article.id}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline-offset-4 hover:text-[var(--lf-accent)] hover:underline"
                  >
                    <RichText text={article.title} />
                  </a>
                </h3>
                {article.description && (
                  <p className={cn("mt-1 text-sm leading-6", mute)}><RichText text={article.description} /></p>
                )}
                <p className="mt-2 text-xs tabular-nums text-[#8a8076]">
                  {article.publishedAt
                    ? new Date(article.publishedAt).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })
                    : null}
                  {article.readTime != null ? (
                    <span>
                      {article.publishedAt ? " · " : null}
                      {article.readTime} min
                    </span>
                  ) : null}
                </p>
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    skills: skills.length > 0 ? (
      <section key="skills">
        <SectionHeading>{labels.skills}</SectionHeading>
        <div className="grid gap-6 @md:grid-cols-2">
          {Object.entries(skillsByCategory).map(([category, names], index) => (
            <div
              key={category}
              className="rounded-[1.5rem] border border-[#171412]/08 bg-white/90 p-5"
              style={{ backgroundImage: `linear-gradient(135deg, ${MATS[index % MATS.length]}55, transparent 55%)` }}
            >
              <h3 className={cn("mb-3 font-[family-name:var(--font-creative-display)] text-lg font-medium", ink)}>
                {category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {names.map((name) => (
                  <TechChip
                    key={name}
                    name={name}
                    className="rounded-full border border-[#171412]/10 bg-white/90 px-3 py-1.5 text-sm text-[#6d645c]"
                  />
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
        <CollapsibleList initial={4} wrapperClassName="flex flex-col gap-3" buttonClassName={moreBtn}>
          {educations.map((edu) => (
            <article
              key={edu.id}
              className="rounded-[1.35rem] border border-[#171412]/08 bg-white/90 px-5 py-4"
            >
              <h3 className={cn("font-[family-name:var(--font-creative-display)] text-lg font-medium", ink)}>
                <RichText text={edu.degree} />
                {edu.field ? (
                  <>
                    {" "}
                    in <RichText text={edu.field} />
                  </>
                ) : null}
              </h3>
              <p className={cn("mt-1 text-sm", mute)}>
                <RichText text={edu.institution} />
              </p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#8a8076]">
                {(edu.startDate || edu.endDate) && (
                  <span className="tabular-nums">{formatDateRange(edu.startDate, edu.endDate)}</span>
                )}
                {edu.gpa && <span>{edu.gpa}</span>}
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    certifications: certifications.length > 0 ? (
      <section key="certifications">
        <SectionHeading>{labels.certifications}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col gap-2" buttonClassName={moreBtn}>
          {certifications.map((cert) => (
            <article
              key={cert.id}
              className="flex flex-wrap items-baseline justify-between gap-2 rounded-full border border-[#171412]/08 bg-white/90 px-5 py-3"
            >
              <div>
                <h3 className={cn("text-sm font-semibold", ink)}>
                  {cert.url ? (
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[var(--lf-accent)] hover:underline"
                    >
                      {cert.name}
                    </a>
                  ) : (
                    cert.name
                  )}
                </h3>
                <p className="text-xs text-[#8a8076]">{cert.issuer}</p>
              </div>
              {cert.issueDate && (
                <span className="text-xs tabular-nums text-[#8a8076]">{formatDate(cert.issueDate)}</span>
              )}
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    achievements: achievements.length > 0 ? (
      <section key="achievements">
        <SectionHeading>{labels.achievements}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col gap-3" buttonClassName={moreBtn}>
          {achievements.map((ach) => (
            <article key={ach.id} className="flex items-start gap-3">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#ffd0da]/80">
                <Trophy className="size-3.5 text-[var(--lf-accent)]" aria-hidden />
              </span>
              <div>
                <p className={cn("text-sm font-medium", ink)}>
                  <RichText text={ach.title} />
                </p>
                {ach.date && (
                  <p className="mt-0.5 text-xs text-[#8a8076]">
                    {new Date(ach.date).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    profiles: hasProfiles ? (
      <section key="profiles" id="profiles" className="scroll-mt-28">
        <SectionHeading>{labels.profiles}</SectionHeading>
        <ProfileLinksSection
          portfolio={portfolio}
          profiles={socialProfiles}
          chipClassName="rounded-full border border-[#171412]/10 bg-[#fff6ee] px-3 py-1.5 text-sm text-[#6d645c]"
          pillClassName="rounded-full border border-[#171412]/10 bg-white px-3 py-1.5 text-sm text-[#171412] hover:border-[var(--lf-accent)]"
          titleClassName={ink}
          textClassName="text-[#8a8076]"
        />
      </section>
    ) : null,

    github: contributionCalendar ? (
      <section key="github">
        <SectionHeading>{labels.github}</SectionHeading>
        <div className="min-w-0 overflow-x-auto rounded-[1.5rem] border border-[#171412]/08 bg-white/90 p-4">
          <GitHubContributionHeatmap
            calendar={contributionCalendar}
            profileUrl={githubProfile?.url}
            username={githubProfile?.username}
            variant="creative"
            stretch
            label={null}
          />
        </div>
      </section>
    ) : null,
  };

  return (
    <div
      className={cn(
        TEMPLATE_CONTAINER,
        fraunces.variable,
        dmSans.variable,
        "relative min-h-screen overflow-hidden font-[family-name:var(--font-creative-sans)] antialiased",
        ink,
      )}
      style={accentRootStyle(primaryColor)}
    >
      {/* Print-wash ground */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(165deg,#ebe4f4_0%,#ffe8d6_38%,#fff6ee_68%,#ffffff_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_12%,color-mix(in_srgb,var(--lf-accent)_22%,transparent),transparent_42%)]" />

      <style>{`
        @keyframes creative-bob {
          0%, 100% { transform: translateY(0) rotate(var(--r, 0deg)); }
          50% { transform: translateY(-0.6rem) rotate(var(--r, 0deg)); }
        }
        @media (prefers-reduced-motion: reduce) {
          .creative-scrap { animation: none !important; }
        }
      `}</style>

      <div className="relative mx-auto min-w-0 max-w-6xl overflow-x-clip px-5 pb-24 pt-8 sm:px-8 md:pb-32 md:pt-10">
        {navbarEnabled && (
          <div className="mb-10 min-w-0">
            <TemplateNavbar
              items={sections}
              wrap
              className="rounded-3xl border border-[#171412]/08 bg-white/75 shadow-[0_14px_40px_-18px_rgba(23,20,18,0.35)] backdrop-blur-md @md:rounded-full"
              linkClassName="rounded-full px-3 py-1.5 text-sm font-medium text-[#6d645c] transition-colors hover:bg-[#fff6ee] hover:text-[var(--lf-accent)] @md:px-4 @md:py-2"
            />
          </div>
        )}

        <header className="relative mb-20 grid min-h-[20rem] items-end gap-10 @lg:mb-28 @lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className={cn(HERO_HEADER_COLUMN, "relative z-10")}>
            <h1
              className={cn(
                HERO_TITLE_BASE,
                HERO_TITLE_SCALE_7XL,
                "font-[family-name:var(--font-creative-display)] font-medium leading-[0.98] tracking-[-0.035em]",
                ink,
              )}
            >
              <RichText text={portfolio.title} />
            </h1>
            {portfolio.headline && (
              <p className={cn(HERO_HEADLINE_SCALE, "mt-6 max-w-[34rem] leading-8", mute)}>
                <RichText text={portfolio.headline} />
              </p>
            )}
            <div className="mt-8 flex flex-col gap-3">
              <ContactChips
                portfolio={portfolio}
                chipClassName="rounded-full border border-[#171412]/10 bg-white/85 px-3 py-1.5 text-sm text-[#6d645c]"
              />
              <div className="flex flex-wrap gap-2">
                <HeroProfileButtons
                  profiles={socialProfiles}
                  className="rounded-full bg-[#171412] px-4 py-2 text-sm font-medium text-[#fff8f1] hover:bg-black"
                />
                {hasNonHeroSocialProfiles(socialProfiles) && (
                  <SocialPills
                    profiles={socialProfiles}
                    showUsername
                    excludeHeroPlatforms
                    className="rounded-full border border-[#171412]/10 bg-white/85 px-3 py-1.5 text-sm text-[#171412] hover:border-[var(--lf-accent)]"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Color scraps — the creative signal at thumbnail size */}
          <div className="relative mx-auto hidden h-64 w-full max-w-sm @lg:block @lg:h-80" aria-hidden>
            <span
              className="creative-scrap absolute left-6 top-8 size-28 rounded-[2rem] bg-[#e4d4f5] shadow-lg [--r:8deg] [animation:creative-bob_7s_ease-in-out_infinite]"
              style={{ transform: "rotate(8deg)" }}
            />
            <span
              className="creative-scrap absolute right-4 top-16 size-36 rounded-full bg-[#ffd8c2] shadow-lg [--r:-6deg] [animation:creative-bob_9s_ease-in-out_infinite_0.4s]"
            />
            <span
              className="creative-scrap absolute bottom-10 left-16 h-24 w-40 rounded-[1.5rem] bg-[#c8eadc] shadow-md [--r:4deg] [animation:creative-bob_8s_ease-in-out_infinite_0.8s]"
              style={{ transform: "rotate(-4deg)" }}
            />
            <span
              className="absolute right-10 bottom-16 size-16 rounded-[1rem] bg-[var(--lf-accent)] opacity-90 shadow-md"
              style={{ transform: "rotate(12deg)" }}
            />
          </div>
        </header>

        <div className="flex min-w-0 flex-col gap-16 @md:gap-20">
          {renderSections(resolved, "full", { ...blocks, linkedin: linkedinSection })}
        </div>

        {customSections.length > 0 && (
          <div className="mt-16 grid gap-6 @md:grid-cols-2">
            {customSections.map((cs, index) => (
              <section
                key={cs.id}
                className="rounded-[1.5rem] border border-[#171412]/08 bg-white/90 p-6"
                style={{ borderTopWidth: 4, borderTopColor: MATS[index % MATS.length] }}
              >
                <SectionHeading>{cs.label}</SectionHeading>
                <CustomSectionItems
                  items={cs.items}
                  titleClassName={cn("font-medium", ink)}
                  textClassName={cn("text-sm", mute)}
                  chipClassName="rounded-full border border-[#171412]/10 bg-[#fff6ee] px-2.5 py-1 text-xs text-[#6d645c]"
                />
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-7 font-[family-name:var(--font-creative-display)] text-3xl font-medium tracking-[-0.02em] text-[#171412] @md:text-[2rem]">
      {children}
    </h2>
  );
}
