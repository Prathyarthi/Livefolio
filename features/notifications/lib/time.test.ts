import { describe, expect, it } from "bun:test";
import { formatRelativeTime, formatUnreadBadge } from "./time";

const now = new Date("2026-10-31T12:00:00Z").getTime();

describe("formatRelativeTime", () => {
  it("formats recent times compactly", () => {
    expect(formatRelativeTime("2026-10-31T11:59:30Z", now)).toBe("just now");
    expect(formatRelativeTime("2026-10-31T11:55:00Z", now)).toBe("5m ago");
    expect(formatRelativeTime("2026-10-31T09:00:00Z", now)).toBe("3h ago");
    expect(formatRelativeTime("2026-10-29T12:00:00Z", now)).toBe("2d ago");
  });

  it("handles bad input", () => {
    expect(formatRelativeTime("nope", now)).toBe("");
  });
});

describe("formatUnreadBadge", () => {
  it("hides zero and caps at 99+", () => {
    expect(formatUnreadBadge(0)).toBeNull();
    expect(formatUnreadBadge(undefined)).toBeNull();
    expect(formatUnreadBadge(7)).toBe("7");
    expect(formatUnreadBadge(150)).toBe("99+");
  });
});
