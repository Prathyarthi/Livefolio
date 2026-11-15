"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import type { NotificationChannel, NotificationType } from "@/lib/notifications-core";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  metadata: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

interface NotificationPage {
  data: NotificationItem[];
  nextCursor: string | null;
}

export interface NotificationPreferenceRow {
  type: NotificationType;
  label: string;
  channels: Record<NotificationChannel, boolean>;
}

export class NotificationsApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(url: string, init: RequestInit | undefined, fallback: string): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...init });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new NotificationsApiError(
      typeof json.error === "string" && json.error ? json.error : fallback,
      res.status,
    );
  }
  return res.json();
}

const ROOT = ["notifications"] as const;
const LIST_KEY = [...ROOT, "list"] as const;
const COUNT_KEY = [...ROOT, "unread-count"] as const;
const PREFS_KEY = [...ROOT, "preferences"] as const;
const UNREAD_POLL_MS = 60 * 1000;

const noRetry4xx = (failureCount: number, error: Error) =>
  failureCount < 1 &&
  !(error instanceof NotificationsApiError && error.status >= 400 && error.status < 500);

/** Gentle poll for the bell badge: every 60s, never on window focus. */
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: COUNT_KEY,
    refetchInterval: UNREAD_POLL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000,
    retry: noRetry4xx,
    queryFn: async () =>
      (await request<{ count: number }>("/api/notifications/unread-count", undefined, "Failed to load notifications")).count,
  });
}

export function useNotifications(enabled = true) {
  return useInfiniteQuery({
    queryKey: LIST_KEY,
    enabled,
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000,
    retry: noRetry4xx,
    initialPageParam: null as string | null,
    getNextPageParam: (last: NotificationPage) => last.nextCursor,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: "20" });
      if (pageParam) params.set("cursor", pageParam);
      return request<NotificationPage>(`/api/notifications?${params}`, undefined, "Failed to load notifications");
    },
  });
}

type ListCache = InfiniteData<NotificationPage, string | null> | undefined;

function mapItems(cache: ListCache, fn: (item: NotificationItem) => NotificationItem | null): ListCache {
  if (!cache) return cache;
  return {
    ...cache,
    pages: cache.pages.map((page) => ({
      ...page,
      data: page.data.map(fn).filter((item): item is NotificationItem => item !== null),
    })),
  };
}

/** Shared optimistic scaffolding: snapshot list + count, apply, roll back on error. */
function useOptimisticNotificationMutation<T>(
  mutationFn: (input: T) => Promise<unknown>,
  apply: (input: T, list: ListCache, count: number | undefined) => { list: ListCache; count: number | undefined },
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onMutate: async (input: T) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: LIST_KEY }),
        qc.cancelQueries({ queryKey: COUNT_KEY }),
      ]);
      const previousList = qc.getQueryData<ListCache>(LIST_KEY);
      const previousCount = qc.getQueryData<number>(COUNT_KEY);
      const next = apply(input, previousList, previousCount);
      qc.setQueryData(LIST_KEY, next.list);
      if (next.count !== undefined) qc.setQueryData(COUNT_KEY, next.count);
      return { previousList, previousCount };
    },
    onError: (_error, _input, context) => {
      if (!context) return;
      qc.setQueryData(LIST_KEY, context.previousList);
      qc.setQueryData(COUNT_KEY, context.previousCount);
    },
  });
}

function findItem(list: ListCache, id: string) {
  return list?.pages.flatMap((p) => p.data).find((item) => item.id === id);
}

export function useMarkNotificationRead() {
  return useOptimisticNotificationMutation(
    (id: string) =>
      request(`/api/notifications/${encodeURIComponent(id)}/read`, { method: "POST" }, "Failed to mark as read"),
    (id, list, count) => {
      const wasUnread = findItem(list, id)?.readAt === null;
      const now = new Date().toISOString();
      return {
        list: mapItems(list, (item) => (item.id === id && !item.readAt ? { ...item, readAt: now } : item)),
        count: count !== undefined && wasUnread ? Math.max(0, count - 1) : count,
      };
    },
  );
}

export function useMarkAllNotificationsRead() {
  return useOptimisticNotificationMutation(
    () => request("/api/notifications/read-all", { method: "POST" }, "Failed to mark all as read"),
    (_input, list) => {
      const now = new Date().toISOString();
      return { list: mapItems(list, (item) => (item.readAt ? item : { ...item, readAt: now })), count: 0 };
    },
  );
}

export function useDeleteNotification() {
  return useOptimisticNotificationMutation(
    (id: string) =>
      request(`/api/notifications/${encodeURIComponent(id)}`, { method: "DELETE" }, "Failed to delete notification"),
    (id, list, count) => {
      const wasUnread = findItem(list, id)?.readAt === null;
      return {
        list: mapItems(list, (item) => (item.id === id ? null : item)),
        count: count !== undefined && wasUnread ? Math.max(0, count - 1) : count,
      };
    },
  );
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: PREFS_KEY,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    retry: noRetry4xx,
    queryFn: async () =>
      (await request<{ data: NotificationPreferenceRow[] }>("/api/notifications/preferences", undefined, "Failed to load preferences")).data,
  });
}

export function useUpdateNotificationPreference() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { type: NotificationType; channel: NotificationChannel; enabled: boolean }) =>
      (
        await request<{ data: NotificationPreferenceRow[] }>(
          "/api/notifications/preferences",
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ preferences: [input] }),
          },
          "Failed to update preferences",
        )
      ).data,
    onMutate: async ({ type, channel, enabled }) => {
      await qc.cancelQueries({ queryKey: PREFS_KEY });
      const previous = qc.getQueryData<NotificationPreferenceRow[]>(PREFS_KEY);
      qc.setQueryData<NotificationPreferenceRow[]>(PREFS_KEY, (rows) =>
        rows?.map((row) => (row.type === type ? { ...row, channels: { ...row.channels, [channel]: enabled } } : row)),
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) qc.setQueryData(PREFS_KEY, context.previous);
    },
    onSuccess: (data) => qc.setQueryData(PREFS_KEY, data),
  });
}
