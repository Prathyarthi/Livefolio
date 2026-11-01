import { LinkedinIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { LinkedInShowcase } from "@/lib/linkedin";
import { DescriptionBlock } from "@/features/templates/shared";

export type LinkedInSectionClasses = {
  section?: string;
  heading?: string;
  card?: string;
  title?: string;
  text?: string;
  muted?: string;
  chip?: string;
  link?: string;
  /** Paragraph/list classes for long text (about, posts); mirror the template's project description. */
  descriptionParagraph?: string;
  descriptionList?: string;
  /** Wrapper around the posts list (defaults to a responsive grid). */
  posts?: string;
  post?: string;
};

/**
 * Shared, template-agnostic LinkedIn showcase. Templates pass their own
 * class names; only the fields and posts the owner selected are in `data`.
 * Every template renders it right before its Profiles section.
 */
export function LinkedInSection({
  data,
  heading,
  classes = {},
  id = "linkedin",
}: {
  data: LinkedInShowcase | null | undefined;
  heading: React.ReactNode;
  classes?: LinkedInSectionClasses;
  id?: string;
}) {
  if (!data) return null;
  const { profile } = data;
  const hasIntro =
    profile.name || profile.headline || profile.currentPosition || profile.location || profile.profileImageUrl;

  return (
    <section id={id} className={cn("space-y-6", classes.section)}>
      {heading}

      {hasIntro || profile.about ? (
        <div className={cn("flex gap-4", classes.card)}>
          {profile.profileImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.profileImageUrl}
              alt={profile.name ?? "LinkedIn profile photo"}
              className="h-14 w-14 shrink-0 rounded-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : null}
          <div className="min-w-0 space-y-1">
            {profile.name ? <p className={classes.title}>{profile.name}</p> : null}
            {profile.headline ? (
              // Same read-more pattern as the bio/posts; never truncated to one line.
              <DescriptionBlock
                text={profile.headline}
                paragraphClassName={classes.descriptionParagraph ?? classes.text}
                listClassName={classes.descriptionList ?? classes.text}
              />
            ) : null}
            {profile.currentPosition || profile.location ? (
              <p className={classes.muted}>
                {[profile.currentPosition, profile.location].filter(Boolean).join(" · ")}
              </p>
            ) : null}
            {profile.about ? (
              <div className="pt-2">
                <DescriptionBlock
                  text={profile.about}
                  paragraphClassName={classes.descriptionParagraph ?? classes.text}
                  listClassName={classes.descriptionList ?? classes.text}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {profile.experience?.length ? (
        <div className={cn("space-y-3", classes.card)}>
          {profile.experience.map((item, index) => (
            <div key={`${item.company}-${index}`}>
              <p className={classes.title}>
                {item.title} · {item.company}
              </p>
              <p className={classes.muted}>
                {[[item.startDate, item.endDate].filter(Boolean).join(" – "), item.location]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {item.description ? <p className={classes.text}>{item.description}</p> : null}
            </div>
          ))}
        </div>
      ) : null}

      {profile.education?.length ? (
        <div className={cn("space-y-3", classes.card)}>
          {profile.education.map((item, index) => (
            <div key={`${item.school}-${index}`}>
              <p className={classes.title}>{item.school}</p>
              <p className={classes.muted}>
                {[[item.degree, item.field].filter(Boolean).join(", "), [item.startDate, item.endDate].filter(Boolean).join(" – ")]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {profile.skills?.length ? (
        <div className="flex flex-wrap gap-2">
          {profile.skills.map((skill) => (
            <span key={skill} className={classes.chip}>
              {skill}
            </span>
          ))}
        </div>
      ) : null}

      {data.posts.length ? (
        <div className={cn("grid gap-4 @md:grid-cols-2", classes.posts)}>
          {data.posts.map((post) => (
            <article key={post.id} className={cn("flex min-w-0 flex-col gap-2", classes.card, classes.post)}>
              <div className="min-w-0 [overflow-wrap:anywhere]">
                <DescriptionBlock
                  text={post.text}
                  paragraphClassName={classes.descriptionParagraph ?? classes.text}
                  listClassName={classes.descriptionList ?? classes.text}
                />
              </div>
              <div className={cn("mt-auto flex flex-wrap items-center gap-x-3 gap-y-1", classes.muted)}>
                {post.date ? <span>{post.date}</span> : null}
                {post.reactions ? <span>{post.reactions} reactions</span> : null}
                {post.comments ? <span>{post.comments} comments</span> : null}
                {post.url ? (
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn("ml-auto", classes.link)}
                  >
                    Read on LinkedIn →
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <a
        href={data.profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("inline-flex items-center gap-2", classes.link)}
      >
        <LinkedinIcon className="h-4 w-4" />
        View full LinkedIn profile
      </a>
    </section>
  );
}
