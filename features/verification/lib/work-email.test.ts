import { describe, expect, test } from "bun:test";
import {
  domainMatchesWebsite,
  maskWorkEmail,
  workEmailRejection,
} from "./work-email";

describe("workEmailRejection", () => {
  test("accepts a company domain", () => {
    expect(workEmailRejection("ada@stripe.com")).toBeNull();
  });

  test("rejects personal inboxes", () => {
    expect(workEmailRejection("ada@gmail.com")).toMatch(/company email/i);
    expect(workEmailRejection("ada@proton.me")).toMatch(/company email/i);
  });

  test("rejects school domains", () => {
    expect(workEmailRejection("ada@mit.edu")).toMatch(/student/i);
    expect(workEmailRejection("ada@college.ac.in")).toMatch(/student/i);
  });
});

describe("maskWorkEmail", () => {
  test("hides the local part", () => {
    expect(maskWorkEmail("ada@stripe.com")).toBe("a***@stripe.com");
  });
});

describe("domainMatchesWebsite", () => {
  test("matches the website host, www, and either side as a subdomain", () => {
    expect(domainMatchesWebsite("stripe.com", "https://stripe.com")).toBe(true);
    expect(domainMatchesWebsite("stripe.com", "https://www.stripe.com")).toBe(true);
    expect(domainMatchesWebsite("stripe.com", "https://careers.stripe.com")).toBe(true);
    expect(domainMatchesWebsite("mail.stripe.com", "stripe.com")).toBe(true);
  });

  test("rejects a different company or a missing website", () => {
    expect(domainMatchesWebsite("notion.com", "https://stripe.com")).toBe(false);
    expect(domainMatchesWebsite("stripe.com", null)).toBe(false);
    expect(domainMatchesWebsite("stripe.com", "")).toBe(false);
  });
});
