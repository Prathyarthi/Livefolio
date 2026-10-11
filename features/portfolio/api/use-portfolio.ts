"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function throwPortfolioApiError(
  response: Response,
  fallbackMessage: string,
): Promise<never> {
  const body = await response.clone().json().catch(() => null) as
    | { error?: unknown; message?: unknown; summary?: unknown }
    | null;
  const text = body ? "" : await response.text().catch(() => "");
  const message = [body?.error, body?.message, body?.summary]
    .find((value): value is string => typeof value === "string" && value.trim().length > 0);

  throw new Error(message?.trim() || text.trim() || fallbackMessage);
}

export function usePortfolio() {
  return useQuery({
    queryKey: ["portfolio"],
    queryFn: async () => {
      const res = await fetch("/api/portfolio", { cache: "no-store" });
      if (res.status === 404) return null;
      if (!res.ok) await throwPortfolioApiError(res, "Failed to fetch portfolio");
      return res.json();
    },
  });
}

export function useCreatePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) await throwPortfolioApiError(res, "Failed to create portfolio");

      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

export function useUpdatePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const res = await fetch("/api/portfolio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) await throwPortfolioApiError(res, "Failed to update portfolio");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

export function useUpdateLivePreview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (projectIds: string[]) => {
      const res = await fetch("/api/portfolio/live-preview", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectIds }),
      });
      if (!res.ok) {
        await throwPortfolioApiError(res, "Failed to update live preview preferences");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

/** Deletes experiences, education, skills, projects, certifications, and achievements for the current portfolio. */
export function useClearImportableContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/portfolio/clear-importable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) await throwPortfolioApiError(res, "Failed to clear content");
      return res.json() as Promise<{ success: boolean }>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (templateId: string) => {
      const sendUpdate = async (url: string) =>
        fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateId }),
        });

      let res = await sendUpdate("/api/portfolio/template");
      if (!res.ok && (res.status === 404 || res.status === 405 || res.status >= 500)) {
        // Fallback for environments where only /api/portfolio PATCH is wired.
        res = await sendUpdate("/api/portfolio");
      }

      if (!res.ok) await throwPortfolioApiError(res, "Failed to update template");

      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

export function usePublishPortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (isPublished: boolean) => {
      const res = await fetch("/api/portfolio/publish", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished }),
      });
      if (!res.ok) {
        await throwPortfolioApiError(res, "Failed to update publish status");
      }
      const data = await res.json();
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

export function useUpdateSlug() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (slug: string) => {
      const res = await fetch("/api/portfolio/slug", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (!res.ok) await throwPortfolioApiError(res, "Failed to update slug");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

// Experience
export function useAddExperience() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/portfolio/experience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) await throwPortfolioApiError(res, "Failed to add experience");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

export function useUpdateExperience() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/portfolio/experience/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) await throwPortfolioApiError(res, "Failed to update experience");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

export function useDeleteExperience() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/portfolio/experience/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) await throwPortfolioApiError(res, "Failed to delete experience");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

// Education
export function useAddEducation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/portfolio/education", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) await throwPortfolioApiError(res, "Failed to add education");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

export function useDeleteEducation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/portfolio/education/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) await throwPortfolioApiError(res, "Failed to delete education");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

// Skills
export function useAddSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; category?: string }) => {
      const res = await fetch("/api/portfolio/skill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) await throwPortfolioApiError(res, "Failed to add skill");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

export function useDeleteSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/portfolio/skill/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) await throwPortfolioApiError(res, "Failed to delete skill");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

// Projects
export function useAddProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/portfolio/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) await throwPortfolioApiError(res, "Failed to add project");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/portfolio/project/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) await throwPortfolioApiError(res, "Failed to update project");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/portfolio/project/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) await throwPortfolioApiError(res, "Failed to delete project");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

// Social profiles
export function useUpsertSocial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      platform: string;
      url: string;
      username?: string;
    }) => {
      const res = await fetch("/api/portfolio/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) await throwPortfolioApiError(res, "Failed to update social profile");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

// Certifications
export function useAddCertification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/portfolio/certification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) await throwPortfolioApiError(res, "Failed to add certification");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

export function useDeleteCertification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/portfolio/certification/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) await throwPortfolioApiError(res, "Failed to delete certification");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

// Custom Sections
export function useUpsertCustomSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      sectionType: string;
      label: string;
      items?: Record<string, unknown>[];
    }) => {
      const res = await fetch("/api/portfolio/custom-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) await throwPortfolioApiError(res, "Failed to save custom section");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

export function useUpdateCustomSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/portfolio/custom-section/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) await throwPortfolioApiError(res, "Failed to update custom section");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

export function useDeleteCustomSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/portfolio/custom-section/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) await throwPortfolioApiError(res, "Failed to delete custom section");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

// Achievements
export function useAddAchievement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/portfolio/achievement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) await throwPortfolioApiError(res, "Failed to add achievement");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

export function useUpdateAchievement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/portfolio/achievement/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) await throwPortfolioApiError(res, "Failed to update achievement");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

export function useDeleteAchievement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/portfolio/achievement/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) await throwPortfolioApiError(res, "Failed to delete achievement");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}
