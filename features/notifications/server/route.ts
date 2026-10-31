import Elysia, { t } from "elysia";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  decodeCursor,
  encodeCursor,
  isNotificationChannel,
  isNotificationType,
  resolvePreferences,
} from "@/lib/notifications";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function toPayload(row: {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  metadata: unknown;
  readAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    href: row.href,
    metadata: row.metadata ?? null,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

async function requireUser(request: Request) {
  const session = await getSession(request);
  return session?.userId ?? null;
}

export const notifications = new Elysia({ prefix: "/notifications" })
  .get(
    "/",
    async (ctx) => {
      const userId = await requireUser(ctx.request);
      if (!userId) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }
      const limit = Math.min(Math.max(Number(ctx.query.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
      const cursor = decodeCursor(ctx.query.cursor);
      const rows = await prisma.notification.findMany({
        where: {
          userId,
          ...(ctx.query.unread === "true" ? { readAt: null } : {}),
          ...(cursor
            ? {
                OR: [
                  { createdAt: { lt: cursor.createdAt } },
                  { createdAt: cursor.createdAt, id: { lt: cursor.id } },
                ],
              }
            : {}),
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
      });
      const page = rows.slice(0, limit);
      return {
        success: true,
        data: page.map(toPayload),
        nextCursor: rows.length > limit ? encodeCursor(page[page.length - 1]) : null,
      };
    },
    {
      query: t.Object({
        cursor: t.Optional(t.String({ maxLength: 200 })),
        limit: t.Optional(t.String({ maxLength: 3 })),
        unread: t.Optional(t.String({ maxLength: 5 })),
      }),
    },
  )

  .get("/unread-count", async (ctx) => {
    const userId = await requireUser(ctx.request);
    if (!userId) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }
    const count = await prisma.notification.count({ where: { userId, readAt: null } });
    return { success: true, count };
  })

  .post("/read-all", async (ctx) => {
    const userId = await requireUser(ctx.request);
    if (!userId) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }
    const { count } = await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true, updated: count };
  })

  .post("/:id/read", async (ctx) => {
    const userId = await requireUser(ctx.request);
    if (!userId) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }
    // Scoped by userId so users can't touch others' notifications.
    const { count } = await prisma.notification.updateMany({
      where: { id: ctx.params.id, userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true, updated: count };
  })

  .delete("/:id", async (ctx) => {
    const userId = await requireUser(ctx.request);
    if (!userId) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }
    const { count } = await prisma.notification.deleteMany({
      where: { id: ctx.params.id, userId },
    });
    if (!count) {
      ctx.set.status = 404;
      return { error: "Notification not found" };
    }
    return { success: true };
  })

  .get("/preferences", async (ctx) => {
    const userId = await requireUser(ctx.request);
    if (!userId) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }
    const rows = await prisma.notificationPreference.findMany({
      where: { userId },
      select: { type: true, channel: true, enabled: true },
    });
    return { success: true, data: resolvePreferences(rows) };
  })

  .put(
    "/preferences",
    async (ctx) => {
      const userId = await requireUser(ctx.request);
      if (!userId) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }
      const updates = ctx.body.preferences;
      if (updates.some((p) => !isNotificationType(p.type) || !isNotificationChannel(p.channel))) {
        ctx.set.status = 400;
        return { error: "Unknown notification type or channel" };
      }
      await prisma.$transaction(
        updates.map((p) =>
          prisma.notificationPreference.upsert({
            where: { userId_type_channel: { userId, type: p.type, channel: p.channel } },
            create: { userId, type: p.type, channel: p.channel, enabled: p.enabled },
            update: { enabled: p.enabled },
          }),
        ),
      );
      const rows = await prisma.notificationPreference.findMany({
        where: { userId },
        select: { type: true, channel: true, enabled: true },
      });
      return { success: true, data: resolvePreferences(rows) };
    },
    {
      body: t.Object({
        preferences: t.Array(
          t.Object({
            type: t.String({ maxLength: 64 }),
            channel: t.String({ maxLength: 32 }),
            enabled: t.Boolean(),
          }),
          { minItems: 1, maxItems: 50 },
        ),
      }),
    },
  );
