"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function throwApiError(
  response: Response,
  fallbackMessage: string,
): Promise<never> {
  const body = (await response
    .clone()
    .json()
    .catch(() => null)) as { error?: unknown; message?: unknown } | null;
  const text = body ? "" : await response.text().catch(() => "");
  const message = [body?.error, body?.message].find(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );
  throw new Error(message?.trim() || text.trim() || fallbackMessage);
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

export function useOrganizations() {
  return useQuery({
    queryKey: ["organizations"],
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
