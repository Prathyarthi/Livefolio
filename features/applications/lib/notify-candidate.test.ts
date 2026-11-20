import { describe, expect, it, mock } from "bun:test";
import type { NotifyInput } from "@/lib/notifications-core";

const notifyMock = mock(async (_input: NotifyInput) => ["in_app"]);

mock.module("@/lib/notifications", () => ({
  notify: notifyMock,
}));

const {
  notifyApplicationStageChanged,
  notifyApplicationSubmitted,
} = await import("./notify-candidate");

function lastNotifyInput(): NotifyInput {
  const call = notifyMock.mock.calls.at(-1);
  if (!call) throw new Error("notify was not called");
  return call[0];
}

describe("notifyApplicationSubmitted", () => {
  it("fires an in-app notification for the candidate", () => {
    notifyMock.mockClear();
    notifyApplicationSubmitted({
      userId: "u1",
      applicationId: "a1",
      job: { title: "Engineer", organizationName: "Acme" },
    });
    expect(notifyMock).toHaveBeenCalledTimes(1);
    expect(lastNotifyInput()).toMatchObject({
      userId: "u1",
      type: "application.submitted",
      href: "/dashboard/applications/a1",
    });
  });
});

describe("notifyApplicationStageChanged", () => {
  it("skips when the stage did not change", () => {
    notifyMock.mockClear();
    notifyApplicationStageChanged({
      userId: "u1",
      applicationId: "a1",
      previousStage: "shortlisted",
      stage: "shortlisted",
      job: { title: "Engineer", organizationName: "Acme" },
    });
    expect(notifyMock).toHaveBeenCalledTimes(0);
  });

  it("notifies when the stage changes", () => {
    notifyMock.mockClear();
    notifyApplicationStageChanged({
      userId: "u1",
      applicationId: "a1",
      previousStage: "new",
      stage: "shortlisted",
      job: { title: "Engineer", organizationName: "Acme" },
    });
    expect(notifyMock).toHaveBeenCalledTimes(1);
    expect(lastNotifyInput()).toMatchObject({
      userId: "u1",
      type: "application.stage_changed",
      title: "Shortlisted: Engineer",
      href: "/dashboard/applications/a1",
      metadata: { stage: "shortlisted", status: "shortlisted" },
    });
  });
});
