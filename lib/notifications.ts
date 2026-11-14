import type { Prisma } from "@/db/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  createNotifier,
  type NotificationChannelAdapter,
  type NotifyInput,
} from "@/lib/notifications-core";

export * from "@/lib/notifications-core";

export const inAppChannel: NotificationChannelAdapter = {
  channel: "in_app",
  async send(input: NotifyInput) {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        href: input.href ?? null,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  },
};

/**
 * Email channel stub. Off by default (DEFAULT_CHANNEL_ENABLED.email = false);
 * wire to lib/email.ts + a template when email notifications are designed.
 */
export const emailChannel: NotificationChannelAdapter = {
  channel: "email",
  async send(input: NotifyInput) {
    console.info("[notifications] email channel not implemented; skipping", { type: input.type });
  },
};

/** Fire-and-forget safe: never throws. `void notify(...)` from route handlers. */
export const notify = createNotifier({
  channels: [inAppChannel, emailChannel],
  loadPreferences: (userId, type) =>
    prisma.notificationPreference.findMany({
      where: { userId, type },
      select: { type: true, channel: true, enabled: true },
    }),
});
