import { describe, expect, test } from "bun:test";
import {
  plainText,
  splitName,
  toExtensionProfile,
  type ExtensionProfileSource,
} from "@/lib/extension-profile";

function source(
  overrides: Partial<ExtensionProfileSource> = {},
): ExtensionProfileSource {
  return {
    user: { name: "Kiran Kumar Busari", email: "kiran@example.com" },
    portfolioUrl: "https://kiran.livefolio.me",
    origin: "https://livefolio.me",
    portfolio: {
      contactEmail: "hello@kiran.dev",
      phone: "555-0100",
      location: "Hyderabad",
      headline: "Engineer",
      summary: "<p>Builds <strong>tools</strong>.</p>",
      websiteUrl: "https://kiran.dev",
      resumeUrl: "/api/uploads/resume-1",
      experiences: [
        {
          company: "Acme",
          role: "Engineer",
          description: "Shipped billing",
          startDate: new Date("2022-01-15T00:00:00.000Z"),
          endDate: null,
          location: "Remote",
        },
      ],
      educations: [
        {
          institution: "State University",
          degree: "B.Tech",
          field: "Computer Science",
          description: null,
          startDate: "2018-08-01",
          endDate: "2022-05-01",
          gpa: "8.4",
        },
      ],
      skills: [{ name: "TypeScript", category: "language" }],
      projects: [
        {
          title: "Livefolio",
          description: "Portfolio builder",
          liveUrl: "https://livefolio.me",
          sourceUrl: null,
          techStack: ["Next.js"],
        },
      ],
      socialProfiles: [
        {
          platform: "GitHub",
          url: "https://github.com/kiran",
          username: "kiran",
        },
        {
          platform: "linkedin",
          url: "https://linkedin.com/in/kiran",
          username: "kiran",
        },
      ],
      certifications: [
        {
          name: "AWS",
          issuer: "Amazon",
          issueDate: new Date("2024-03-01T00:00:00.000Z"),
          url: null,
        },
      ],
    },
    ...overrides,
  };
}

describe("splitName", () => {
  test("keeps the remainder as the last name", () => {
    expect(splitName("  Kiran   Kumar Busari ")).toEqual({
      fullName: "Kiran Kumar Busari",
      firstName: "Kiran",
      lastName: "Kumar Busari",
    });
  });
});

describe("plainText", () => {
  test("strips markup", () => {
    expect(plainText("<p>Builds <strong>tools</strong>.</p>")).toBe(
      "Builds tools.",
    );
  });
});

describe("toExtensionProfile", () => {
  test("maps the signed-in portfolio into autofill fields", () => {
    const profile = toExtensionProfile(source());
    expect(profile.firstName).toBe("Kiran");
    expect(profile.lastName).toBe("Kumar Busari");
    expect(profile.email).toBe("hello@kiran.dev");
    expect(profile.summary).toBe("Builds tools.");
    expect(profile.resumeUrl).toBe("https://livefolio.me/api/uploads/resume-1");
    expect(profile.portfolioUrl).toBe("https://kiran.livefolio.me");
    expect(profile.github).toBe("https://github.com/kiran");
    expect(profile.linkedin).toBe("https://linkedin.com/in/kiran");
    expect(profile.experiences[0]).toMatchObject({
      company: "Acme",
      startDate: "2022-01-15",
      endDate: null,
    });
    expect(profile.educations[0]?.field).toBe("Computer Science");
    expect(profile.skills.map((skill) => skill.name)).toEqual(["TypeScript"]);
    expect(profile.certifications[0]?.issueDate).toBe("2024-03-01");
  });

  test("falls back to the account email", () => {
    const profile = toExtensionProfile(
      source({
        portfolio: {
          ...source().portfolio,
          contactEmail: "  ",
        },
      }),
    );
    expect(profile.email).toBe("kiran@example.com");
  });
});
