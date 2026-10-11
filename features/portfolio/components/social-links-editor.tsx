"use client";

import { useMemo, useRef, useState } from "react";
import {
  usePortfolio,
  useUpsertSocial,
} from "@/features/portfolio/api/use-portfolio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/features/portfolio/components/field-label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Globe,
  ExternalLink,
  Check,
  X,
  Code2,
} from "lucide-react";
import { GithubIcon as Github, LinkedinIcon as Linkedin, TwitterIcon as Twitter } from "@/components/icons";
import { useEditStepDirty } from "@/features/portfolio/context/edit-dirty-context";
import { fieldDiffers } from "@/features/portfolio/lib/edit-step-dirty";
import {
  clientValidators,
  type FieldErrors,
  validateField,
  validationMessage,
} from "@/features/portfolio/lib/client-validation";
import { normalizeRequiredStoredUrl } from "@/lib/content-policy";

const PLATFORMS = [
  { value: "github", label: "GitHub", icon: Github, urlPrefix: "https://github.com/" },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin, urlPrefix: "https://linkedin.com/in/" },
  { value: "twitter", label: "Twitter / X", icon: Twitter, urlPrefix: "https://x.com/" },
  { value: "leetcode", label: "LeetCode", icon: Code2, urlPrefix: "https://leetcode.com/u/" },
  { value: "website", label: "Personal Website", icon: Globe, urlPrefix: "https://" },
  { value: "devto", label: "Dev.to", icon: Code2, urlPrefix: "https://dev.to/" },
  { value: "medium", label: "Medium", icon: Globe, urlPrefix: "https://medium.com/@" },
  { value: "stackoverflow", label: "Stack Overflow", icon: Code2, urlPrefix: "https://stackoverflow.com/users/" },
  { value: "dribbble", label: "Dribbble", icon: Globe, urlPrefix: "https://dribbble.com/" },
  { value: "behance", label: "Behance", icon: Globe, urlPrefix: "https://behance.net/" },
  { value: "youtube", label: "YouTube", icon: Globe, urlPrefix: "https://youtube.com/@" },
  { value: "other", label: "Other", icon: ExternalLink, urlPrefix: "" },
] as const;

type SocialField = "platform" | "url" | "username";

function validateSocialFields(platform: string, url: string, username: string) {
  const errors: FieldErrors<SocialField> = {};
  validateField(errors, "platform", () =>
    clientValidators.requiredLabel(platform, "Social platform")
  );
  validateField(errors, "url", () =>
    normalizeRequiredStoredUrl(url, "Social profile URL")
  );
  validateField(errors, "username", () =>
    clientValidators.optionalLabel(username, "Social username")
  );
  return errors;
}

function getPlatformIcon(platform: string) {
  const found = PLATFORMS.find((p) => p.value === platform);
  return found?.icon ?? ExternalLink;
}

function getPlatformLabel(platform: string) {
  const found = PLATFORMS.find((p) => p.value === platform);
  return found?.label ?? platform;
}

export function SocialLinksEditor() {
  const { data: portfolio, isLoading } = usePortfolio();
  const upsertSocial = useUpsertSocial();

  const [isAdding, setIsAdding] = useState(false);
  const [platform, setPlatform] = useState<string>("github");
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<SocialField>>({});
  const formBaseline = useRef({ platform: "github", url: "", username: "" });

  function openForm(values: { platform: string; url: string; username: string }) {
    formBaseline.current = values;
    setPlatform(values.platform);
    setUrl(values.url);
    setUsername(values.username);
    setFieldErrors({});
    setIsAdding(true);
  }

  function cancelAdding() {
    setIsAdding(false);
    setPlatform("github");
    setUrl("");
    setUsername("");
    setFieldErrors({});
  }

  function handlePlatformChange(value: string) {
    setPlatform(value);
    setFieldErrors((prev) => ({ ...prev, platform: undefined }));
    // Auto-fill URL prefix when platform changes
    const platformDef = PLATFORMS.find((p) => p.value === value);
    if (platformDef && platformDef.urlPrefix && !url) {
      setUrl(platformDef.urlPrefix);
    }
  }

  async function handleAdd() {
    const errors = validateSocialFields(platform, url, username);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await upsertSocial.mutateAsync({
        platform,
        url: url.trim(),
        username: username.trim() || undefined,
      });
      toast.success(`${getPlatformLabel(platform)} profile saved`);
      cancelAdding();
    } catch (error) {
      toast.error(
        validationMessage(error, "Failed to save social profile")
      );
    }
  }

  function startEditingExisting(social: any) {
    openForm({
      platform: social.platform,
      url: social.url,
      username: social.username ?? "",
    });
  }

  const socials = portfolio?.socialProfiles ?? [];

  const isDirty = useMemo(() => {
    if (!isAdding) return false;
    const existing = socials.find((social: { platform: string }) => social.platform === platform);
    if (existing) {
      return (
        url.trim() !== (existing.url ?? "").trim() ||
        username.trim() !== (existing.username ?? "").trim()
      );
    }
    const platformDef = PLATFORMS.find((entry) => entry.value === platform);
    const defaultUrl = platformDef?.urlPrefix ?? "";
    return url.trim() !== defaultUrl.trim() || username.trim() !== "";
  }, [isAdding, platform, url, username, socials]);

  useEditStepDirty("social", isDirty);

  const isPlatformUnsaved =
    isAdding && platform !== formBaseline.current.platform;
  const isUrlUnsaved =
    isAdding && fieldDiffers(url, formBaseline.current.url);
  const isUsernameUnsaved =
    isAdding && fieldDiffers(username, formBaseline.current.username);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isFormInvalid =
    Object.keys(validateSocialFields(platform, url, username)).length > 0;

  const existingPlatforms = new Set(socials.map((s: { platform: string }) => s.platform));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Social Links
          </h3>
          <p className="text-sm text-muted-foreground">
            Connect your social profiles so visitors can find you elsewhere.
          </p>
        </div>
        {!isAdding && (
          <Button
            onClick={() =>
              openForm({ platform: "github", url: "", username: "" })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Profile
          </Button>
        )}
      </div>

      {/* Add / Edit Form */}
      {isAdding && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">
              {existingPlatforms.has(platform) ? "Update" : "Add"} Social Profile
            </CardTitle>
            <CardDescription>
              {existingPlatforms.has(platform)
                ? "This will update your existing profile for this platform."
                : "Add a link to one of your social profiles."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel unsaved={isPlatformUnsaved}>Platform</FieldLabel>
                <Select value={platform} onValueChange={handlePlatformChange}>
                  <SelectTrigger
                    className="w-full"
                    aria-invalid={Boolean(fieldErrors.platform)}
                    aria-describedby={
                      fieldErrors.platform ? "social-platform-error" : undefined
                    }
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <span className="flex items-center gap-2">
                          {p.label}
                          {existingPlatforms.has(p.value) && (
                            <Badge variant="secondary" className="text-[10px] py-0">
                              added
                            </Badge>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.platform && (
                  <p
                    id="social-platform-error"
                    className="text-sm text-destructive"
                  >
                    {fieldErrors.platform}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="social-username" unsaved={isUsernameUnsaved}>
                  Username (optional)
                </FieldLabel>
                <Input
                  id="social-username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setFieldErrors((prev) => ({
                      ...prev,
                      username: undefined,
                    }));
                  }}
                  onBlur={() =>
                    setFieldErrors((prev) => ({
                      ...prev,
                      username: validateSocialFields(platform, url, username)
                        .username,
                    }))
                  }
                  aria-invalid={Boolean(fieldErrors.username)}
                  aria-describedby={
                    fieldErrors.username ? "social-username-error" : undefined
                  }
                  placeholder="your-username"
                />
                {fieldErrors.username && (
                  <p
                    id="social-username-error"
                    className="text-sm text-destructive"
                  >
                    {fieldErrors.username}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="social-url" unsaved={isUrlUnsaved}>
                Profile URL
              </FieldLabel>
              <Input
                id="social-url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, url: undefined }));
                }}
                onBlur={() =>
                  setFieldErrors((prev) => ({
                    ...prev,
                    url: validateSocialFields(platform, url, username).url,
                  }))
                }
                aria-invalid={Boolean(fieldErrors.url)}
                aria-describedby={
                  fieldErrors.url ? "social-url-error" : undefined
                }
                placeholder="https://github.com/your-username"
                type="url"
              />
              {fieldErrors.url && (
                <p id="social-url-error" className="text-sm text-destructive">
                  {fieldErrors.url}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelAdding}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={upsertSocial.isPending || isFormInvalid}
              >
                {upsertSocial.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                {existingPlatforms.has(platform) ? "Update" : "Add"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Social Links List */}
      {socials.length === 0 && !isAdding ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Globe className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">
              No social profiles added yet. Click &quot;Add Profile&quot; to connect your accounts.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {socials.map((social: any) => {
            const Icon = getPlatformIcon(social.platform);
            return (
              <Card key={social.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {getPlatformLabel(social.platform)}
                      </p>
                      <a
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary truncate block"
                      >
                        {social.url}
                      </a>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditingExisting(social)}
                    >
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
