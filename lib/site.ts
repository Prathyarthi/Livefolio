export const siteConfig = {
  name: "Livefolio",
  taglinePrefix:
    "A portfolio that grows with you. All your scattered work in one place, connected through ",
  tagline:
    "A portfolio that grows with you. All your scattered work in one place, connected through integrations.",
  description:
    "Build and publish a professional portfolio under 2 minutes. Import your resume PDF, connect GitHub, Medium, and LeetCode, choose a template, and go live on your own subdomain.",
  supportEmail: "team@livefolio.me",
  legalEntity: "Livefolio",
} as const;

export const integrationCycle = [
  "GitHub",
  "Medium",
  "LeetCode",
  "LinkedIn",
] as const;

export const integrations = [
  {
    id: "github",
    name: "GitHub",
    description:
      "Repos, contributions, and open-source work — pulled in automatically.",
  },
  {
    id: "medium",
    name: "Medium",
    description:
      "Articles and essays you have published, showcased alongside your projects.",
  },
  {
    id: "leetcode",
    name: "LeetCode",
    description:
      "Problem-solving progress and coding stats that prove your craft.",
  },
] as const;
