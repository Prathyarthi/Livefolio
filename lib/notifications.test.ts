import { describe, expect, it } from "bun:test";
import {
  createNotifier,
  decodeCursor,
  encodeCursor,
  isChannelEnabled,
  normalizeNotifyInput,
  resolvePreferences,
  type NotificationChannelAdapter,
  type NotifyInput,
} from "./notifications-core";

const base: NotifyInput = {
  userId: "u1",
  type: "linkedin.sync_succeeded",
  title: "LinkedIn synced",
};

function recorder(channel: "in_app" | "email", fail = false) {
  const sent: NotifyInput[] = [];
  const adapter: NotificationChannelAdapter = {
    channel,
    async send(input) {
      if (fail) throw new Error("boom");
      sent.push(input);
    },
  };
  return { adapter, sent };
}

describe("preferences", () => {
  it("defaults in-app on and email off", () => {
    expect(isChannelEnabled([], "system", "in_app")).toBe(true);
    expect(isChannelEnabled([], "system", "email")).toBe(false);
  });

  it("respects explicit rows", () => {
    const prefs = [{ type: "system", channel: "in_app", enabled: false }];
    expect(isChannelEnabled(prefs, "system", "in_app")).toBe(false);
    expect(isChannelEnabled(prefs, "linkedin.sync_failed", "in_app")).toBe(true);
  });

  it("resolves a full matrix", () => {
    const matrix = resolvePreferences([{ type: "system", channel: "email", enabled: true }]);
    const system = matrix.find((m) => m.type === "system");
    expect(system?.channels).toEqual({ in_app: true, email: true });
    expect(matrix.length).toBeGreaterThan(1);
  });
});

describe("normalizeNotifyInput", () => {
  it("rejects missing title or unknown type", () => {
    expect(normalizeNotifyInput({ ...base, title: "  " })).toBeNull();
    expect(normalizeNotifyInput({ ...base, type: "nope" as never })).toBeNull();
  });

  it("drops external and protocol-relative hrefs", () => {
    expect(normalizeNotifyInput({ ...base, href: "https://evil.com" })?.href).toBeNull();
    expect(normalizeNotifyInput({ ...base, href: "//evil.com" })?.href).toBeNull();
    expect(normalizeNotifyInput({ ...base, href: "/dashboard/import" })?.href).toBe("/dashboard/import");
  });
});

describe("createNotifier", () => {
  it("dispatches to enabled channels only", async () => {
    const inApp = recorder("in_app");
    const email = recorder("email");
    const notify = createNotifier({
      channels: [inApp.adapter, email.adapter],
      loadPreferences: async () => [],
    });
    expect(await notify(base)).toEqual(["in_app"]);
    expect(inApp.sent).toHaveLength(1);
    expect(email.sent).toHaveLength(0);
  });

  it("never throws when a channel or preference lookup fails", async () => {
    const errors: string[] = [];
    const broken = recorder("in_app", true);
    const notify = createNotifier({
      channels: [broken.adapter],
      loadPreferences: async () => {
        throw new Error("db down");
      },
      logError: (message) => errors.push(message),
    });
    expect(await notify(base)).toEqual([]);
    expect(errors.length).toBe(2);
  });

  it("skips invalid input without calling channels", async () => {
    const inApp = recorder("in_app");
    const notify = createNotifier({
      channels: [inApp.adapter],
      loadPreferences: async () => [],
      logError: () => {},
    });
    expect(await notify({ ...base, userId: "" })).toEqual([]);
    expect(inApp.sent).toHaveLength(0);
  });
});

describe("cursor", () => {
  it("round-trips", () => {
    const row = { createdAt: new Date("2026-10-31T10:00:00.000Z"), id: "abc|1" };
    expect(decodeCursor(encodeCursor(row))).toEqual(row);
  });

  it("rejects garbage", () => {
    expect(decodeCursor("nope")).toBeNull();
    expect(decodeCursor("not-a-date|x")).toBeNull();
    expect(decodeCursor(undefined)).toBeNull();
  });
});
