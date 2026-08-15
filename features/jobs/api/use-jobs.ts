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

export type JobRequirement = {
  id?: string;
  type: "required" | "preferred";
  category?: "skill" | "experience" | "education" | "other";
  label: string;
  description?: string | null;
  sortOrder?: number;
};

export type JobOrganization = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  brandColor: string | null;
  description: string | null;
  websiteUrl?: string | null;
  location?: string | null;
};

export type Job = {
  id: string;
  organizationId: string;
  title: string;
  slug: string;
  description: string;
  department: string | null;
  employmentType: string | null;
  location: string | null;
  workplaceType: string | null;
  experienceMin: number | null;
  experienceMax: number | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  responsibilities: string | null;
  qualifications: string | null;
  benefits: string | null;
  applicationDeadline: string | null;
  status: "draft" | "published" | "paused" | "closed";
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  organization: JobOrganization;
  requirements: JobRequirement[];
  _count?: { applications: number };
  storedFiles?: Array<{
    id: string;
    contentType: string;
    sizeBytes: number;
    createdAt: string;
  }>;
};

export type JobInput = {
  title: string;
  description: string;
  department?: string;
  employmentType?: string;
  location?: string;
  workplaceType?: string;
  experienceMin?: number | null;
  experienceMax?: number | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string;
  responsibilities?: string;
  qualifications?: string;
  benefits?: string;
  applicationDeadline?: string | null;
  status?: "draft" | "published" | "paused" | "closed";
  requirements?: JobRequirement[];
};

export function usePublicJob(slug: string | undefined) {
  return useQuery({
    queryKey: ["jobs", "public", slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      const res = await fetch(`/api/jobs/public/${slug}`, { cache: "no-store" });
      if (res.status === 404) return null;
      if (!res.ok) await throwApiError(res, "Failed to load job");
      return res.json() as Promise<Job>;
    },
  });
}

export function useOrgJobs(orgSlug: string | undefined, status?: string) {
  return useQuery({
    queryKey: ["jobs", "org", orgSlug, status ?? "all"],
    enabled: Boolean(orgSlug),
    queryFn: async () => {
      const params = status ? `?status=${encodeURIComponent(status)}` : "";
      const res = await fetch(`/api/jobs/org/${orgSlug}${params}`, {
        cache: "no-store",
      });
      if (!res.ok) await throwApiError(res, "Failed to load jobs");
      return res.json() as Promise<Job[]>;
    },
  });
}

export function useJob(id: string | undefined) {
  return useQuery({
    queryKey: ["jobs", "id", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await fetch(`/api/jobs/id/${id}`, { cache: "no-store" });
      if (!res.ok) await throwApiError(res, "Failed to load job");
      return res.json() as Promise<Job>;
    },
  });
}

export function useCreateJob(orgSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: JobInput) => {
      const res = await fetch(`/api/jobs/org/${orgSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) await throwApiError(res, "Failed to create job");
      return res.json() as Promise<Job>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs", "org", orgSlug] });
      qc.invalidateQueries({ queryKey: ["organizations", orgSlug] });
    },
  });
}

export function useUpdateJob(orgSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<JobInput>;
    }) => {
      const res = await fetch(`/api/jobs/id/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) await throwApiError(res, "Failed to update job");
      return res.json() as Promise<Job>;
    },
    onSuccess: (job) => {
      qc.invalidateQueries({ queryKey: ["jobs", "org", orgSlug] });
      qc.invalidateQueries({ queryKey: ["jobs", "id", job.id] });
      qc.invalidateQueries({ queryKey: ["jobs", "public", job.slug] });
      qc.invalidateQueries({ queryKey: ["organizations", orgSlug] });
    },
  });
}

export function useDeleteJob(orgSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/jobs/id/${id}`, { method: "DELETE" });
      if (!res.ok) await throwApiError(res, "Failed to delete job");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs", "org", orgSlug] });
      qc.invalidateQueries({ queryKey: ["organizations", orgSlug] });
    },
  });
}
