export const siteConfig = {
  name: "Livefolio",
  taglinePrefix:
    "A portfolio that grows with you. All your scattered work in one place, connected through ",
  tagline:
    "A portfolio that grows with you. All your scattered work in one place, connected through integrations.",
  description:
    "Upload your resume PDF and publish a live portfolio at yourname.livefolio.me. Add projects, writing, work samples and references. Free to start.",
  supportEmail: "team@livefolio.me",
  legalEntity: "Livefolio",
} as const;

export const integrationCycle = [
  "GitHub",
  "Medium",
  "Dev.to",
  "Hashnode",
  "LeetCode",
  "Stack Overflow",
  "Codeforces",
] as const;

export const integrations = [
  {
    id: "github",
    name: "GitHub",
    description:
      "Repos, contributions, and open-source work, pulled in automatically.",
  },
  {
    id: "medium",
    name: "Medium",
    description:
      "Articles and essays you have published, showcased alongside your projects.",
  },
  {
    id: "devto",
    name: "Dev.to",
    description: "Posts from Dev.to, imported into your writing section.",
  },
  {
    id: "hashnode",
    name: "Hashnode",
    description: "Blog posts from Hashnode, including custom-domain blogs.",
  },
  {
    id: "leetcode",
    name: "LeetCode",
    description:
      "Problem-solving progress and coding stats that prove your craft.",
  },
  {
    id: "stackoverflow",
    name: "Stack Overflow",
    description: "Reputation and your highest-voted answers.",
  },
  {
    id: "codeforces",
    name: "Codeforces",
    description: "Contest rating, rank, and problems you have solved.",
  },
] as const;
