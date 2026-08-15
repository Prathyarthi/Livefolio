"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApplicationSnapshotData } from "@/features/applications/lib/types";

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
    code?: unknown;
  } | null;
  const text = body ? "" : await response.text().catch(() => "");
  const message = [body?.error, body?.message].find(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );
  const error = new Error(message?.trim() || text.trim() || fallbackMessage) as Error & {
    code?: string;
  };
  if (typeof body?.code === "string") error.code = body.code;
  throw error;
}

export type CandidateApplication = {
  id: string;
  jobId: string;
  status: string;
  stage: string;
  coverNote: string | null;
  submittedAt: string;
  job: {
    id: string;
    title: string;
    slug: string;
    status: string;
    location: string | null;
    employmentType: string | null;
    workplaceType: string | null;
    organization: {
      id: string;
      name: string;
      slug: string;
      logoUrl: string | null;
      brandColor: string | null;
    };
  };
  snapshot: {
    id: string;
    createdAt: string;
    data: ApplicationSnapshotData;
  } | null;
};

export type ApplicationPreview = {
  job: {
    id: string;
    title: string;
    slug: string;
    status: string;
    organization: {
      id: string;
      name: string;
      slug: string;
      logoUrl: string | null;
    };
  };
  alreadyApplied: boolean;
  existingApplication: {
    id: string;
    submittedAt: string;
    status: string;
  } | null;
  snapshot: ApplicationSnapshotData;
  portfolioId: string;
};

export function useMyApplications() {
  return useQuery({
    queryKey: ["applications", "mine"],
    queryFn: async () => {
      const res = await fetch("/api/applications/mine", { cache: "no-store" });
      if (!res.ok) await throwApiError(res, "Failed to load applications");
      return res.json() as Promise<CandidateApplication[]>;
    },
  });
}

export function useMyApplication(id: string | undefined) {
  return useQuery({
    queryKey: ["applications", "mine", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await fetch(`/api/applications/mine/${id}`, {
        cache: "no-store",
      });
      if (!res.ok) await throwApiError(res, "Failed to load application");
      return res.json() as Promise<CandidateApplication>;
    },
  });
}

export function useApplicationPreview(jobSlug: string | undefined) {
  return useQuery({
    queryKey: ["applications", "preview", jobSlug],
    enabled: Boolean(jobSlug),
    queryFn: async () => {
      const res = await fetch(`/api/applications/preview/${jobSlug}`, {
        cache: "no-store",
      });
      if (!res.ok) await throwApiError(res, "Failed to load application preview");
      return res.json() as Promise<ApplicationPreview>;
    },
  });
}

export function useSubmitApplication(jobSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data?: { coverNote?: string }) => {
      const res = await fetch(`/api/applications/apply/${jobSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data ?? {}),
      });
      if (!res.ok) await throwApiError(res, "Failed to submit application");
      return res.json() as Promise<CandidateApplication>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications", "mine"] });
      qc.invalidateQueries({ queryKey: ["applications", "preview", jobSlug] });
    },
  });
}

export type EvidenceItem = {
  kind: string;
  label: string;
  detail?: string;
};

export type RequirementMatch = {
  label: string;
  type: string;
  category: string;
  matched: boolean;
  evidence: EvidenceItem[];
};

export type ApplicantEvidenceSummary = {
  highlights: EvidenceItem[];
  requirementMatches: RequirementMatch[];
  matchedRequired: number;
  totalRequired: number;
  matchedPreferred: number;
  totalPreferred: number;
};

export type ApplicantCard = {
  id: string;
  stage: string;
  status: string;
  shortlisted: boolean;
  shortlistedAt: string | null;
  submittedAt: string;
  coverNote: string | null;
  noteCount: number;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  summary: {
    name: string;
    headline: string | null;
    avatarUrl: string | null;
    location: string | null;
    slug: string | null;
    yearsExperience: number | null;
    recentRoles: string[];
    skills: string[];
    projectHighlights: string[];
    educationHighlights: string[];
  };
  evidence: ApplicantEvidenceSummary;
  resumeFileId: string | null;
};

export type ApplicantPoolFilters = {
  q?: string;
  location?: string;
  skill?: string;
  role?: string;
  education?: string;
  minExperience?: number;
  maxExperience?: number;
  appliedAfter?: string;
  appliedBefore?: string;
};

export type InterpretedApplicantQuery = {
  raw: string;
  keywords: string[];
  skills: string[];
  minExperience?: number;
  location?: string;
};

export type ApplicantPool = {
  job: {
    id: string;
    title: string;
    slug: string;
    status: string;
    organizationId: string;
    organization: { id: string; name: string; slug: string };
    requirements: Array<{
      id: string;
      type: string;
      category: string;
      label: string;
    }>;
  };
  stageCounts: Record<string, number>;
  matchedCount: number;
  filters: ApplicantPoolFilters;
  interpreted?: InterpretedApplicantQuery;
  applicants: ApplicantCard[];
};

export type RecruiterNote = {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string; avatar: string | null };
};

export type CompanyApplicationDetail = {
  id: string;
  stage: string;
  status: string;
  shortlisted: boolean;
  shortlistedAt: string | null;
  coverNote: string | null;
  submittedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  notes: RecruiterNote[];
  job: {
    id: string;
    title: string;
    slug: string;
    status: string;
    organizationId: string;
    organization: { id: string; name: string; slug: string };
  };
  summary: ApplicantCard["summary"];
  snapshotData: ApplicationSnapshotData | null;
  evidence: ApplicantEvidenceSummary;
  resumeFileId: string | null;
  requirements?: Array<{
    id: string;
    type: string;
    category: string;
    label: string;
  }>;
};

export function useApplicantPool(
  jobId: string | undefined,
  options?: {
    stage?: string;
  } & ApplicantPoolFilters,
) {
  const stage = options?.stage;
  const q = options?.q;
  const location = options?.location;
  const skill = options?.skill;
  const role = options?.role;
  const education = options?.education;
  const minExperience = options?.minExperience;
  const maxExperience = options?.maxExperience;
  const appliedAfter = options?.appliedAfter;
  const appliedBefore = options?.appliedBefore;

  return useQuery({
    queryKey: [
      "applications",
      "job",
      jobId,
      stage ?? "all",
      q ?? "",
      location ?? "",
      skill ?? "",
      role ?? "",
      education ?? "",
      minExperience ?? "",
      maxExperience ?? "",
      appliedAfter ?? "",
      appliedBefore ?? "",
    ],
    enabled: Boolean(jobId),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (stage) params.set("stage", stage);
      if (q) params.set("q", q);
      if (location) params.set("location", location);
      if (skill) params.set("skill", skill);
      if (role) params.set("role", role);
      if (education) params.set("education", education);
      if (minExperience != null) params.set("minExperience", String(minExperience));
      if (maxExperience != null) params.set("maxExperience", String(maxExperience));
      if (appliedAfter) params.set("appliedAfter", appliedAfter);
      if (appliedBefore) params.set("appliedBefore", appliedBefore);
      const qs = params.toString();
      const res = await fetch(
        `/api/applications/job/${jobId}${qs ? `?${qs}` : ""}`,
        { cache: "no-store" },
      );
      if (!res.ok) await throwApiError(res, "Failed to load applicants");
      return res.json() as Promise<ApplicantPool>;
    },
  });
}

export function useCompanyApplication(
  jobId: string | undefined,
  applicationId: string | undefined,
) {
  return useQuery({
    queryKey: ["applications", "job", jobId, applicationId],
    enabled: Boolean(jobId && applicationId),
    queryFn: async () => {
      const res = await fetch(
        `/api/applications/job/${jobId}/${applicationId}`,
        { cache: "no-store" },
      );
      if (!res.ok) await throwApiError(res, "Failed to load applicant");
      return res.json() as Promise<CompanyApplicationDetail>;
    },
  });
}

export function useUpdateApplicationStage(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      applicationId,
      stage,
    }: {
      applicationId: string;
      stage: string;
    }) => {
      const res = await fetch(
        `/api/applications/job/${jobId}/${applicationId}/stage`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage }),
        },
      );
      if (!res.ok) await throwApiError(res, "Failed to update stage");
      return res.json();
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["applications", "job", jobId] });
      qc.invalidateQueries({
        queryKey: ["applications", "job", jobId, vars.applicationId],
      });
    },
  });
}

export function useToggleShortlist(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      applicationId,
      shortlisted,
    }: {
      applicationId: string;
      shortlisted: boolean;
    }) => {
      const res = await fetch(
        `/api/applications/job/${jobId}/${applicationId}/shortlist`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shortlisted }),
        },
      );
      if (!res.ok) await throwApiError(res, "Failed to update shortlist");
      return res.json();
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["applications", "job", jobId] });
      qc.invalidateQueries({
        queryKey: ["applications", "job", jobId, vars.applicationId],
      });
    },
  });
}

export function useAddRecruiterNote(jobId: string, applicationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      const res = await fetch(
        `/api/applications/job/${jobId}/${applicationId}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        },
      );
      if (!res.ok) await throwApiError(res, "Failed to add note");
      return res.json() as Promise<RecruiterNote>;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["applications", "job", jobId, applicationId],
      });
      qc.invalidateQueries({ queryKey: ["applications", "job", jobId] });
    },
  });
}

export function useDeleteRecruiterNote(jobId: string, applicationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (noteId: string) => {
      const res = await fetch(
        `/api/applications/job/${jobId}/${applicationId}/notes/${noteId}`,
        { method: "DELETE" },
      );
      if (!res.ok) await throwApiError(res, "Failed to delete note");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["applications", "job", jobId, applicationId],
      });
      qc.invalidateQueries({ queryKey: ["applications", "job", jobId] });
    },
  });
}
