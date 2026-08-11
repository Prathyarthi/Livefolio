"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export class ApiRequestError extends Error {
  upgradeRequired?: boolean;
  upgradeOrgSlug?: string | null;

  constructor(
    message: string,
    extras?: { upgradeRequired?: boolean; upgradeOrgSlug?: string | null },
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.upgradeRequired = extras?.upgradeRequired;
    this.upgradeOrgSlug = extras?.upgradeOrgSlug;
  }
}

async function throwApiError(
  response: Response,
  fallbackMessage: string,
): Promise<never> {
  const body = (await response
    .clone()
    .json()
    .catch(() => null)) as {
    error?: unknown;
    message?: unknown;
    upgradeRequired?: unknown;
    upgradeOrgSlug?: unknown;
  } | null;
  const text = body ? "" : await response.text().catch(() => "");
  const message = [body?.error, body?.message].find(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );
  throw new ApiRequestError(
    message?.trim() || text.trim() || fallbackMessage,
    {
      upgradeRequired: body?.upgradeRequired === true,
      upgradeOrgSlug:
        typeof body?.upgradeOrgSlug === "string" ? body.upgradeOrgSlug : null,
    },
  );
}

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  brandColor: string | null;
  description: string | null;
  _count?: { jobs: number; members: number };
};

export type OrganizationMembership = {
  role: string;
  organization: OrganizationSummary;
};

export type OrganizationDetail = OrganizationSummary & {
  websiteUrl: string | null;
  location: string | null;
  role: string;
  permissions: {
    manageOrganization: boolean;
    manageJobs: boolean;
  };
  jobCounts: {
    draft: number;
    published: number;
    paused: number;
    closed: number;
    total: number;
  };
};

export function useOrganizations(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["organizations"],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const res = await fetch("/api/organizations", { cache: "no-store" });
      if (!res.ok) await throwApiError(res, "Failed to load organizations");
      return res.json() as Promise<OrganizationMembership[]>;
    },
  });
}

export function useOrganization(slug: string | undefined) {
  return useQuery({
    queryKey: ["organizations", slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${slug}`, {
        cache: "no-store",
      });
      if (!res.ok) await throwApiError(res, "Failed to load organization");
      return res.json() as Promise<OrganizationDetail>;
    },
  });
}

export function useCreateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      slug?: string;
      description?: string;
      websiteUrl?: string;
      location?: string;
    }) => {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) await throwApiError(res, "Failed to create organization");
      return res.json() as Promise<OrganizationMembership>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["organizations"] }),
  });
}

export function useUpdateOrganization(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/organizations/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) await throwApiError(res, "Failed to update organization");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["organizations"] });
      qc.invalidateQueries({ queryKey: ["organizations", slug] });
    },
  });
}

export type OrgMember = {
  id: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  };
};

export function useOrgMembers(slug: string | undefined) {
  return useQuery({
    queryKey: ["organizations", slug, "members"],
    enabled: Boolean(slug),
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${slug}/members`, {
        cache: "no-store",
      });
      if (!res.ok) await throwApiError(res, "Failed to load members");
      return res.json() as Promise<OrgMember[]>;
    },
  });
}

function invalidateOrgMembers(qc: ReturnType<typeof useQueryClient>, slug: string) {
  qc.invalidateQueries({ queryKey: ["organizations", slug, "members"] });
  qc.invalidateQueries({ queryKey: ["organizations"] });
  qc.invalidateQueries({ queryKey: ["organizations", slug] });
}

export function useAddOrgMember(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { email: string; role: string }) => {
      const res = await fetch(`/api/organizations/${slug}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) await throwApiError(res, "Failed to add member");
      return res.json() as Promise<OrgMember>;
    },
    onSuccess: () => invalidateOrgMembers(qc, slug),
  });
}

export function useUpdateOrgMemberRole(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { memberId: string; role: string }) => {
      const res = await fetch(
        `/api/organizations/${slug}/members/${data.memberId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: data.role }),
        },
      );
      if (!res.ok) await throwApiError(res, "Failed to update member role");
      return res.json() as Promise<OrgMember>;
    },
    onSuccess: () => invalidateOrgMembers(qc, slug),
  });
}

export function useRemoveOrgMember(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) => {
      const res = await fetch(
        `/api/organizations/${slug}/members/${memberId}`,
        { method: "DELETE" },
      );
      if (!res.ok) await throwApiError(res, "Failed to remove member");
      return res.json() as Promise<{ ok: boolean }>;
    },
    onSuccess: () => invalidateOrgMembers(qc, slug),
  });
}