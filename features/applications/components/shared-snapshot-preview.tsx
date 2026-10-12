"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ApplicationSnapshotData } from "@/features/applications/lib/types";
import { stripRichTextToPlain } from "@/lib/rich-text";
import { cn } from "@/lib/utils";

const SKILL_LIMIT = 12;
const LIST_LIMIT = 4;

export function SharedSnapshotPreview({
  snapshot,
  companyName,
}: {
  snapshot: ApplicationSnapshotData;
  companyName: string;
}) {
  const profile = snapshot.profile;
  const name = readableName(profile.title) || "Your Livefolio";
  const includes = includeSummary(snapshot);
  const companyLabel =
    stripRichTextToPlain(companyName).replace(/\s+/g, " ").trim() ||
    "the company";
  const hasSections = [
    snapshot.skills,
    snapshot.experiences,
    snapshot.projects,
    snapshot.educations,
    snapshot.certifications,
    snapshot.achievements,
    snapshot.articles,
    snapshot.socialProfiles,
    snapshot.customSections,
  ].some((items) => items.length > 0);

  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border border-border-default bg-surface-raised shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-4 border-b border-border-default px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="text-label uppercase text-text-secondary">
            What {companyLabel} will see
          </p>
          <p className="mt-1 text-body-sm text-text-muted">
            Check this copy before you submit.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/edit">Edit</Link>
        </Button>
      </div>

      <div className="px-5 py-5 sm:px-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.avatarUrl ?? undefined} alt="" />
            <AvatarFallback className="text-lg">
              {name.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-1">
            <h2 className="break-words text-h3 text-text-primary">{name}</h2>
            {profile.headline ? (
              <p className="break-words text-body text-text-secondary">
                {profile.headline}
              </p>
            ) : null}
            <ProfileMeta profile={profile} />
          </div>
        </div>

        {includes ? (
          <p className="mt-4 text-body-sm text-text-muted">{includes}</p>
        ) : (
          <p className="mt-4 text-body-sm text-text-secondary">
            This Livefolio does not list experience, projects, skills, or
            education yet.
          </p>
        )}

        {profile.summary ? <ClampedText text={profile.summary} /> : null}
      </div>

      {hasSections ? (
      <div className="space-y-8 border-t border-border-default px-5 py-6 sm:px-6">
        <SkillSection skills={snapshot.skills} />
        <EntrySection
          title="Experience"
          items={snapshot.experiences}
          render={(item) => (
            <Entry
              title={item.role}
              subtitle={item.company}
              meta={joinMeta([
                item.location,
                formatRange(item.startDate, item.endDate),
              ])}
              body={item.description}
            />
          )}
        />
        <EntrySection
          title="Projects"
          items={snapshot.projects}
          render={(item) => (
            <Entry
              title={item.title}
              badge={item.featured ? "Featured" : null}
              meta={
                item.techStack.length > 0
                  ? item.techStack.slice(0, 6).join(" · ")
                  : null
              }
              body={item.description}
            />
          )}
        />
        <EntrySection
          title="Education"
          items={snapshot.educations}
          render={(item) => (
            <Entry
              title={item.degree}
              subtitle={item.institution}
              meta={joinMeta([
                item.field &&
                item.field.trim().toLowerCase() !== item.degree.trim().toLowerCase()
                  ? item.field
                  : null,
                formatRange(item.startDate, item.endDate),
              ])}
              body={item.description}
            />
          )}
        />
        <EntrySection
          title="Certifications"
          items={snapshot.certifications}
          render={(item) => (
            <Entry
              title={item.name}
              subtitle={item.issuer}
              meta={formatMonthYear(item.issueDate)}
            />
          )}
        />
        <EntrySection
          title="Achievements"
          items={snapshot.achievements}
          render={(item) => (
            <Entry title={item.title} meta={formatMonthYear(item.date)} />
          )}
        />
        <EntrySection
          title="Writing"
          items={snapshot.articles}
          render={(item) => (
            <Entry
              title={item.title}
              meta={item.url ? shortUrl(item.url) : null}
              body={item.description}
            />
          )}
        />
        <EntrySection
          title="Profiles"
          items={snapshot.socialProfiles}
          render={(item) => (
            <Entry
              title={item.platform}
              subtitle={item.username}
              meta={shortUrl(item.url)}
            />
          )}
        />
        <EntrySection
          title="More"
          items={snapshot.customSections}
          render={(item) => (
            <Entry
              title={item.label}
              meta={
                Array.isArray(item.items) && item.items.length > 0
                  ? `${item.items.length} item${item.items.length === 1 ? "" : "s"}`
                  : null
              }
            />
          )}
        />
      </div>
      ) : null}
    </section>
  );
}

function ProfileMeta({
  profile,
}: {
  profile: ApplicationSnapshotData["profile"];
}) {
  const bits = [profile.location, profile.contactEmail].filter(
    (value): value is string => Boolean(value),
  );
  if (bits.length === 0 && !profile.websiteUrl) return null;
  return (
    <p className="break-words text-body-sm text-text-muted">
      {bits.join(" · ")}
      {profile.websiteUrl ? (
        <>
          {bits.length > 0 ? " · " : null}
          <a
            href={profile.websiteUrl}
            target="_blank"
            rel="noreferrer"
            className="text-brand-primary"
          >
            {shortUrl(profile.websiteUrl)}
          </a>
        </>
      ) : null}
    </p>
  );
}

function SkillSection({
  skills,
}: {
  skills: ApplicationSnapshotData["skills"];
}) {
  const [open, setOpen] = useState(false);
  if (skills.length === 0) return null;
  const visible = open ? skills : skills.slice(0, SKILL_LIMIT);
  const hidden = skills.length - visible.length;

  return (
    <section>
      <SectionHeading title="Skills" count={skills.length} />
      <ul className="mt-3 flex flex-wrap gap-2">
        {visible.map((skill) => (
          <li
            key={`${skill.category}-${skill.name}`}
            className="rounded-full border border-border-default bg-surface-base px-3 py-1.5 text-body-sm text-text-primary"
          >
            {skill.name}
          </li>
        ))}
      </ul>
      {skills.length > SKILL_LIMIT ? (
        <RevealButton
          className="mt-3"
          onClick={() => setOpen((value) => !value)}
        >
          {hidden > 0 ? `Show ${hidden} more` : "Show less"}
        </RevealButton>
      ) : null}
    </section>
  );
}

function EntrySection<T>({
  title,
  items,
  render,
}: {
  title: string;
  items: T[];
  render: (item: T) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;
  const visible = open ? items : items.slice(0, LIST_LIMIT);
  const hidden = items.length - visible.length;

  return (
    <section>
      <SectionHeading title={title} count={items.length} />
      <ul className="mt-3 divide-y divide-border-default">
        {visible.map((item, index) => (
          <li key={index} className="py-3 first:pt-0 last:pb-0">
            {render(item)}
          </li>
        ))}
      </ul>
      {items.length > LIST_LIMIT ? (
        <RevealButton
          className="mt-3"
          onClick={() => setOpen((value) => !value)}
        >
          {hidden > 0 ? `Show ${hidden} more` : "Show less"}
        </RevealButton>
      ) : null}
    </section>
  );
}

function Entry({
  title,
  subtitle,
  meta,
  body,
  badge,
}: {
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  body?: string | null;
  badge?: string | null;
}) {
  const trimmedBody = body?.trim() ?? "";
  return (
    <div className="min-w-0 space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <p className="break-words font-medium text-text-primary">{title}</p>
        {badge ? <Badge variant="neutral">{badge}</Badge> : null}
      </div>
      {subtitle ? (
        <p className="break-words text-body-sm text-text-secondary">
          {subtitle}
        </p>
      ) : null}
      {meta ? <p className="break-words text-xs text-text-muted">{meta}</p> : null}
      {trimmedBody ? (
        <p className="line-clamp-3 whitespace-pre-wrap text-body-sm text-text-secondary">
          {trimmedBody}
        </p>
      ) : null}
    </div>
  );
}

function SectionHeading({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h3 className="text-label uppercase text-text-secondary">{title}</h3>
      <span className="text-xs text-text-muted">{count}</span>
    </div>
  );
}

function ClampedText({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.trim().length > 280;
  return (
    <div className="mt-4">
      <p
        className={cn(
          "whitespace-pre-wrap text-body-sm text-text-secondary",
          !open && long && "line-clamp-4",
        )}
      >
        {text}
      </p>
      {long ? (
        <RevealButton className="mt-2" onClick={() => setOpen((value) => !value)}>
          {open ? "Show less" : "Show more"}
        </RevealButton>
      ) : null}
    </div>
  );
}

function RevealButton({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-sm font-medium text-brand-primary hover:underline",
        className,
      )}
    >
      {children}
    </button>
  );
}

function includeSummary(snapshot: ApplicationSnapshotData) {
  const parts = [
    countLabel(snapshot.skills.length, "skill", "skills"),
    countLabel(snapshot.experiences.length, "role", "roles"),
    countLabel(snapshot.projects.length, "project", "projects"),
    countLabel(snapshot.educations.length, "education entry", "education entries"),
    countLabel(snapshot.certifications.length, "certification", "certifications"),
    countLabel(snapshot.achievements.length, "achievement", "achievements"),
    countLabel(snapshot.articles.length, "article", "articles"),
  ].filter((part): part is string => Boolean(part));

  if (parts.length === 0) return null;
  return parts.join(" · ");
}

function countLabel(count: number, singular: string, plural: string) {
  if (count === 0) return null;
  return `${count} ${count === 1 ? singular : plural}`;
}

function joinMeta(parts: Array<string | null | undefined>) {
  const value = parts.filter(Boolean).join(" · ");
  return value || null;
}

function readableName(value: string) {
  const trimmed = value.trim();
  const letters = trimmed.replace(/[^A-Za-z]/g, "");
  if (letters.length < 4 || letters !== letters.toUpperCase()) return trimmed;
  return trimmed
    .toLowerCase()
    .replace(
      /(^|[\s'-])([a-z])/g,
      (_, separator, char) => separator + char.toUpperCase(),
    );
}

function formatMonthYear(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function formatRange(start: string | null, end: string | null) {
  const startLabel = formatMonthYear(start);
  const endLabel = formatMonthYear(end);
  if (startLabel && endLabel) return `${startLabel} – ${endLabel}`;
  if (startLabel) return `${startLabel} – Present`;
  return endLabel;
}

function shortUrl(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "");
  }
}