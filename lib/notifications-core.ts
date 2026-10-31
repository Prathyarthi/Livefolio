/**
 * Notification types, channels and dispatch logic. Pure (no DB/IO imports) so
 * it can be unit-tested and shared with the client; `lib/notifications.ts`
 * wires it to Prisma.
 */

export const NOTIFICATION_TYPES = [
  "linkedin.sync_succeeded",
  "linkedin.sync_failed",
  "badge_earned",
  "system",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_CHANNELS = ["in_app", "email"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

/** Defaults when the user has no preference row. In-app on; email opt-in. */
export const DEFAULT_CHANNEL_ENABLED: Record<NotificationChannel, boolean> = {
  in_app: true,
  email: false,
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  "linkedin.sync_succeeded": "LinkedIn sync succeeded",
  "linkedin.sync_failed": "LinkedIn sync failed",
  badge_earned: "Badges earned",
  system: "Product & account updates",
};

export function isNotificationType(value: unknown): value is NotificationType {
  return typeof value === "string" && (NOTIFICATION_TYPES as readonly string[]).includes(value);
}

export function isNotificationChannel(value: unknown): value is NotificationChannel {
  return typeof value === "string" && (NOTIFICATION_CHANNELS as readonly string[]).includes(value);
}

export interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  href?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface NotificationChannelAdapter {
  channel: NotificationChannel;
  send(input: NotifyInput): Promise<void>;
}

export interface PreferenceRow {
  type: string;
  channel: string;
  enabled: boolean;
}

export function isChannelEnabled(
  prefs: PreferenceRow[],
  type: NotificationType,
  channel: NotificationChannel,
): boolean {
  const row = prefs.find((p) => p.type === type && p.channel === channel);
  return row ? row.enabled : DEFAULT_CHANNEL_ENABLED[channel];
}

/** Full preference matrix (every type × channel) with defaults filled in. */
export function resolvePreferences(prefs: PreferenceRow[]) {
  return NOTIFICATION_TYPES.map((type) => ({
    type,
    label: NOTIFICATION_TYPE_LABELS[type],
    channels: Object.fromEntries(
      NOTIFICATION_CHANNELS.map((channel) => [channel, isChannelEnabled(prefs, type, channel)]),
    ) as Record<NotificationChannel, boolean>,
  }));
}

const MAX_TITLE = 200;
const MAX_BODY = 2000;

export function normalizeNotifyInput(input: NotifyInput): NotifyInput | null {
  const title = input.title?.trim().slice(0, MAX_TITLE);
  if (!input.userId || !title || !isNotificationType(input.type)) return null;
  const href = input.href?.trim();
  return {
    userId: input.userId,
    type: input.type,
    title,
    body: input.body?.trim().slice(0, MAX_BODY) || null,
    // Only same-origin relative links, to avoid open redirects from the bell.
    href: href && href.startsWith("/") && !href.startsWith("//") ? href : null,
    metadata: input.metadata ?? null,
  };
}

export interface NotifierDeps {
  loadPreferences(userId: string, type: NotificationType): Promise<PreferenceRow[]>;
  channels: NotificationChannelAdapter[];
  logError?: (message: string, error: unknown) => void;
}

/**
 * Builds a `notify` that never throws: invalid input, preference lookups and
 * channel failures are logged and swallowed. Resolves to the channels that
 * delivered successfully.
 */
export function createNotifier(deps: NotifierDeps) {
  const log = deps.logError ?? ((message, error) => console.error(message, error));
  return async function notify(raw: NotifyInput): Promise<NotificationChannel[]> {
    try {
      const input = normalizeNotifyInput(raw);
      if (!input) {
        log("[notifications] invalid notify input", { type: raw?.type });
        return [];
      }
      let prefs: PreferenceRow[] = [];
      try {
        prefs = await deps.loadPreferences(input.userId, input.type);
      } catch (error) {
        log("[notifications] failed to load preferences; using defaults", error);
      }
      const targets = deps.channels.filter((c) => isChannelEnabled(prefs, input.type, c.channel));
      const results = await Promise.allSettled(targets.map((c) => c.send(input)));
      const delivered: NotificationChannel[] = [];
      results.forEach((result, i) => {
        if (result.status === "fulfilled") delivered.push(targets[i].channel);
        else log(`[notifications] ${targets[i].channel} channel failed`, result.reason);
      });
      return delivered;
    } catch (error) {
      log("[notifications] notify failed", error);
      return [];
    }
  };
}

/** Opaque cursor = "<createdAt ISO>|<id>" for stable keyset pagination. */
export function encodeCursor(row: { createdAt: Date; id: string }) {
  return `${row.createdAt.toISOString()}|${row.id}`;
}

export function decodeCursor(cursor: string | null | undefined) {
  if (!cursor) return null;
  const sep = cursor.indexOf("|");
  if (sep < 0) return null;
  const createdAt = new Date(cursor.slice(0, sep));
  const id = cursor.slice(sep + 1);
  if (Number.isNaN(createdAt.getTime()) || !id) return null;
  return { createdAt, id };
}
