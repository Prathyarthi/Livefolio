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

const job = { title: "Engineer", organizationName: "Acme" };

function lastNotifyInput(): NotifyInput {
  const call = notifyMock.mock.calls.at(-1);
  if (!call) throw new Error("notify was not called");
  return call[0];
}

describe("notifyApplicationSubmitted", () => {
  it("fires an in-app notification for the candidate", () => {
    notifyMock.mockClear();
    notifyApplicationSubmitted({ userId: "u1", applicationId: "a1", job });
    expect(notifyMock).toHaveBeenCalledTimes(1);
    expect(lastNotifyInput()).toMatchObject({
      userId: "u1",
      type: "application.submitted",
      href: "/dashboard/applications/a1",
    });
  });
});

describe("notifyApplicationStageChanged", () => {
  it("skips intermediate stages", () => {
    notifyMock.mockClear();
    for (const stage of ["reviewing", "shortlisted", "interview", "offer"] as const) {
      notifyApplicationStageChanged({
        userId: "u1",
        applicationId: "a1",
        previousStage: "new",
        stage,
        job,
      });
    }
    expect(notifyMock).toHaveBeenCalledTimes(0);
  });

  it("skips when the stage did not change", () => {
    notifyMock.mockClear();
    notifyApplicationStageChanged({
      userId: "u1",
      applicationId: "a1",
      previousStage: "rejected",
      stage: "rejected",
      job,
    });
    expect(notifyMock).toHaveBeenCalledTimes(0);
  });

  it("notifies when hired", () => {
    notifyMock.mockClear();
    notifyApplicationStageChanged({
      userId: "u1",
      applicationId: "a1",
      previousStage: "offer",
      stage: "hired",
      job,
    });
    expect(notifyMock).toHaveBeenCalledTimes(1);
    expect(lastNotifyInput()).toMatchObject({
      type: "application.stage_changed",
      title: "You're hired: Engineer",
      href: "/dashboard/applications/a1",
      metadata: { stage: "hired" },
    });
  });

  it("notifies when rejected", () => {
    notifyMock.mockClear();
    notifyApplicationStageChanged({
      userId: "u1",
      applicationId: "a1",
      previousStage: "reviewing",
      stage: "rejected",
      job,
    });
    expect(notifyMock).toHaveBeenCalledTimes(1);
    expect(lastNotifyInput()).toMatchObject({
      type: "application.stage_changed",
      title: "Update on Engineer",
      metadata: { stage: "rejected" },
    });
  });
});
