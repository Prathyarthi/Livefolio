import { LinkedinIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { LinkedInShowcase } from "@/lib/linkedin";

export type LinkedInSectionClasses = {
  section?: string;
  heading?: string;
  card?: string;
  title?: string;
  text?: string;
  muted?: string;
  chip?: string;
  link?: string;
};

/**
 * Shared, template-agnostic LinkedIn showcase. Templates pass their own
 * class names; only the fields the owner selected are in `data`. Selected
 * posts render in the Articles section (source "linkedin"), not here.
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
            {profile.headline ? <p className={classes.text}>{profile.headline}</p> : null}
            {profile.currentPosition || profile.location ? (
              <p className={classes.muted}>
                {[profile.currentPosition, profile.location].filter(Boolean).join(" · ")}
              </p>
            ) : null}
            {profile.about ? (
              <p className={cn("whitespace-pre-line pt-2", classes.text)}>{profile.about}</p>
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
