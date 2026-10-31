"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Clock, Loader2, Lock, RefreshCw, Save, Search, Trash2 } from "lucide-react";
import { LinkedinIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LinkedInApiError,
  useLinkedInImport,
  useRemoveLinkedIn,
  useSaveLinkedInSelection,
  useSyncLinkedIn,
  useToggleLinkedInVisibility,
} from "@/features/profile/api/use-linkedin";
import {
  LINKEDIN_FIELDS,
  normalizeLinkedInProfileUrl,
  type LinkedInField,
  type LinkedInProfileData,
  type LinkedInSelection,
} from "@/lib/linkedin";

const FIELD_LABELS: Record<LinkedInField, string> = {
  name: "Name",
  headline: "Headline",
  location: "Location",
  about: "About",
  profileImageUrl: "Profile photo",
  currentPosition: "Current position",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
};

function fieldPreview(profile: LinkedInProfileData, field: LinkedInField): string | null {
  switch (field) {
    case "experience":
      return profile.experience.length
        ? profile.experience.map((e) => `${e.title} · ${e.company}`).join(", ")
        : null;
    case "education":
      return profile.education.length
        ? profile.education.map((e) => e.school).join(", ")
        : null;
    case "skills":
      return profile.skills.length ? profile.skills.join(", ") : null;
    case "profileImageUrl":
      return profile.profileImageUrl ? "Available" : null;
    default:
      return profile[field];
  }
}

function formatWhen(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/** Locked state shown to non-Pro users (mirrors the import page upgrade banner). */
function LinkedInLocked() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          LinkedIn import is a Pro feature
        </CardTitle>
        <CardDescription>
          Upgrade to Pro to pull your LinkedIn headline, experience, and recent posts
          into your portfolio and choose exactly what to showcase.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="secondary">
          <Link href="/pricing">Upgrade to Pro</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function LinkedInImporter() {
  const query = useLinkedInImport();
  const sync = useSyncLinkedIn();
  const save = useSaveLinkedInSelection();
  const toggleVisibility = useToggleLinkedInVisibility();
  const remove = useRemoveLinkedIn();

  const state = query.data?.data ?? null;
  const [url, setUrl] = useState("");
  const [selection, setSelection] = useState<LinkedInSelection | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Reset local edits whenever the server state changes (sync/save/remove).
  const [syncedState, setSyncedState] = useState(state);
  if (state !== syncedState) {
    setSyncedState(state);
    if (state) {
      setSelection(state.selection);
      if (!url) setUrl(state.profileUrl);
    }
  }

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const dirty = useMemo(() => {
    if (!state || !selection) return false;
    const a = state.selection;
    return (
      [...a.fields].sort().join() !== [...selection.fields].sort().join() ||
      [...a.postIds].sort().join() !== [...selection.postIds].sort().join()
    );
  }, [state, selection]);

  // Only block the UI on the very first load; background refetches keep showing data.
  if (query.isPending && !query.data) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading LinkedIn import…
      </div>
    );
  }
  if (query.error instanceof LinkedInApiError && query.error.status === 403) {
    return <LinkedInLocked />;
  }
  if (query.error && !query.data) {
    return <p className="text-sm text-destructive">{query.error.message}</p>;
  }

  const quota = query.data?.quota;
  // A block lapses on its own once nextAvailableAt passes (UTC midnight / month start).
  const blocked = Boolean(
    quota?.nextAvailableAt && new Date(quota.nextAvailableAt).getTime() > now,
  );
  const monthlyBlocked = blocked && quota?.blockedBy === "monthly";
  const unlockLabel = quota?.nextAvailableAt
    ? monthlyBlocked
      ? new Date(quota.nextAvailableAt).toLocaleDateString(undefined, { dateStyle: "medium" })
      : new Date(quota.nextAvailableAt).toLocaleString(undefined, {
          weekday: "short",
          hour: "numeric",
          minute: "2-digit",
        })
    : null;
  const monthResetLabel = quota
    ? new Date(quota.resetsAt).toLocaleDateString(undefined, { dateStyle: "medium" })
    : null;
  const remaining =
    quota && new Date(quota.resetsAt).getTime() <= now ? quota.limit : (quota?.remaining ?? null);
  const quotaText = !quota
    ? null
    : monthlyBlocked
      ? `No syncs left this month · resets ${monthResetLabel}`
      : blocked
        ? `${remaining} of ${quota.limit} syncs left this month · next sync available tomorrow (${unlockLabel})`
        : `${remaining} of ${quota.limit} syncs left this month`;

  const handleSync = async () => {
    if (!normalizeLinkedInProfileUrl(url)) {
      toast.error("Enter a LinkedIn profile URL like https://www.linkedin.com/in/your-name");
      return;
    }
    try {
      const { warning } = await sync.mutateAsync(url.trim());
      if (warning) toast.warning(warning);
      else toast.success("LinkedIn profile synced. Choose what to showcase below.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to sync LinkedIn profile");
    }
  };

  const handleSave = async () => {
    if (!selection) return;
    try {
      const { warning } = await save.mutateAsync({ selection });
      if (warning) toast.warning(warning);
      else toast.success("LinkedIn selection saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save selection");
    }
  };

  const toggleField = (field: LinkedInField, on: boolean) =>
    setSelection((prev) =>
      prev && {
        ...prev,
        fields: on ? [...new Set([...prev.fields, field])] : prev.fields.filter((f) => f !== field),
      },
    );

  const togglePost = (id: string, on: boolean) =>
    setSelection((prev) =>
      prev && {
        ...prev,
        postIds: on ? [...new Set([...prev.postIds, id])] : prev.postIds.filter((p) => p !== id),
      },
    );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkedinIcon className="h-5 w-5" />
            Import from LinkedIn
            <Badge variant="secondary">Pro</Badge>
          </CardTitle>
          <CardDescription>
            Paste your public LinkedIn profile URL. We&apos;ll fetch your details and recent
            posts so you can pick what appears on your portfolio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {query.data && !query.data.configured ? (
            <p className="text-sm text-muted-foreground">
              LinkedIn import isn&apos;t configured on this server yet.
            </p>
          ) : null}
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="linkedin-url" className="sr-only">
                LinkedIn profile URL
              </Label>
              <Input
                id="linkedin-url"
                placeholder="https://www.linkedin.com/in/your-name"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !blocked) void handleSync();
                }}
                disabled={sync.isPending}
              />
            </div>
            <Button
              onClick={() => void handleSync()}
              disabled={sync.isPending || !url.trim() || blocked}
            >
              {/* A running sync wins over quota state: the server claims the slot before scraping. */}
              {sync.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : blocked ? (
                <Clock className="mr-2 h-4 w-4" />
              ) : state ? (
                <RefreshCw className="mr-2 h-4 w-4" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              {sync.isPending
                ? "Syncing…"
                : blocked
                  ? monthlyBlocked
                    ? `Available ${unlockLabel}`
                    : "Available tomorrow"
                  : state
                    ? "Re-sync"
                    : "Fetch"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {sync.isPending
              ? "Fetching your profile — this can take up to a minute."
              : [
                  state?.lastSyncedAt ? `Last synced ${formatWhen(state.lastSyncedAt)}` : null,
                  quotaText,
                  state ? null : "Only public profile information is fetched.",
                ]
                  .filter(Boolean)
                  .join(" · ")}
          </p>
        </CardContent>
      </Card>

      {state?.profile && selection ? (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <CardTitle className="text-lg">{state.profile.name}</CardTitle>
                  {state.profile.headline ? (
                    <CardDescription>{state.profile.headline}</CardDescription>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="linkedin-show" className="text-xs text-muted-foreground">
                    Show on portfolio
                  </Label>
                  <Switch
                    id="linkedin-show"
                    checked={state.showOnPortfolio}
                    onCheckedChange={(showOnPortfolio) =>
                      toggleVisibility.mutate(
                        { selection: state.selection, showOnPortfolio },
                        {
                          onSuccess: ({ warning }) => {
                            if (warning) toast.warning(warning);
                          },
                          onError: (error) => toast.error(error.message),
                        },
                      )
                    }
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="mb-2 text-sm font-medium">Profile details</p>
              {LINKEDIN_FIELDS.map((field) => {
                const preview = fieldPreview(state.profile!, field);
                const id = `linkedin-field-${field}`;
                return (
                  <div
                    key={field}
                    className="flex items-start gap-3 rounded-md px-2 py-2 hover:bg-muted/50"
                  >
                    <Checkbox
                      id={id}
                      className="mt-0.5"
                      checked={selection.fields.includes(field)}
                      disabled={!preview}
                      onCheckedChange={(on) => toggleField(field, on === true)}
                    />
                    <Label htmlFor={id} className="block min-w-0 flex-1 cursor-pointer font-normal">
                      <span className="text-sm font-medium">{FIELD_LABELS[field]}</span>
                      <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                        {preview ?? "Not found on your profile"}
                      </span>
                    </Label>
                  </div>
                );
              })}

              <Separator className="my-4" />

              <p className="mb-2 text-sm font-medium">
                Posts{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  ({selection.postIds.length} of {state.posts.length} selected)
                </span>
              </p>
              <p className="mb-2 px-2 text-xs text-muted-foreground">
                Selected posts are added to your Articles section, labeled LinkedIn.
              </p>
              {state.posts.length === 0 ? (
                <p className="px-2 text-xs text-muted-foreground">
                  No public posts were found on this profile.
                </p>
              ) : (
                state.posts.map((post) => {
                  const id = `linkedin-post-${post.id}`;
                  return (
                    <div
                      key={post.id}
                      className="flex items-start gap-3 rounded-md px-2 py-2 hover:bg-muted/50"
                    >
                      <Checkbox
                        id={id}
                        className="mt-0.5"
                        checked={selection.postIds.includes(post.id)}
                        onCheckedChange={(on) => togglePost(post.id, on === true)}
                      />
                      <Label htmlFor={id} className="block min-w-0 flex-1 cursor-pointer font-normal">
                        <span className="line-clamp-3 block text-sm">{post.text}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {[
                            post.date,
                            post.reactions != null ? `${post.reactions} reactions` : null,
                            post.comments != null ? `${post.comments} comments` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </Label>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between gap-3">
            <Button
              variant="ghost"
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(undefined, {
                  onSuccess: () => {
                    setSelection(null);
                    setUrl("");
                    toast.success("LinkedIn import removed");
                  },
                  onError: (error) => toast.error(error.message),
                })
              }
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </Button>
            <Button onClick={() => void handleSave()} disabled={!dirty || save.isPending}>
              {save.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save selection
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
