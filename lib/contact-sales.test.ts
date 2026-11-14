import { describe, expect, mock, test } from "bun:test";
import { buildContactSalesEmail, handleContactSales } from "@/lib/contact-sales";

const valid = { name: "Asha", email: "Asha@Acme.com", company: "Acme", teamSize: "21-50", message: "Need SSO" };

describe("contact sales", () => {
  test("rejects invalid input without sending", async () => {
    const send = mock(async () => ({ id: "x", error: null }));
    for (const bad of [{}, { ...valid, email: "nope" }, { ...valid, name: "" }, { ...valid, teamSize: "lots" }]) {
      const r = await handleContactSales(bad, { to: "team@livefolio.me", send });
      expect(r.status).toBe(400);
    }
    expect(send).not.toHaveBeenCalled();
  });
  test("sends one email to the team inbox (mocked)", async () => {
    const send = mock(async () => ({ id: "x", error: null }));
    const r = await handleContactSales(valid, { to: "team@livefolio.me", send });
    expect(r).toEqual({ status: 200, body: { ok: true } });
    expect(send).toHaveBeenCalledTimes(1);
    const sent = (send.mock.calls[0] as unknown as [{ to: string; subject: string; html: string }])[0];
    expect(sent.to).toBe("team@livefolio.me");
    expect(sent.subject).toContain("Acme");
    expect(sent.html).toContain("asha@acme.com");
  });
  test("dry run and honeypot never send", async () => {
    const send = mock(async () => ({ id: "x", error: null }));
    expect((await handleContactSales(valid, { to: "t@x", send, dryRun: true })).body).toEqual({ ok: true, dryRun: true });
    expect((await handleContactSales({ ...valid, website: "spam" }, { to: "t@x", send })).status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });
  test("send failure returns 502 with fallback address", async () => {
    const send = mock(async () => ({ id: null, error: "down" }));
    const r = await handleContactSales(valid, { to: "team@livefolio.me", send });
    expect(r.status).toBe(502);
  });
  test("escapes HTML", () => {
    const e = buildContactSalesEmail({ ...valid, teamSize: "1-5", message: "<script>x</script>" } as never, "t@x");
    expect(e.html).not.toContain("<script>");
  });
});
