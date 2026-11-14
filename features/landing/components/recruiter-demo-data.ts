import type { ReferenceForSearch } from "@/features/search/lib/references";

/** Clearly fake demo applicants for the recruiters landing page. Not real people or scores. */
export type DemoApplicant = {
  id: string;
  name: string;
  headline: string;
  /** Livefolio score (0–100) before references, as shown with the toggle off. */
  livefolio: number;
  reasons: string[];
  proof: string[];
  references: (ReferenceForSearch & { referee: string })[];
};

/** The demo job's search terms; reference stories that mention them count in full. */
export const DEMO_TERMS = ["react", "node"];

export const DEMO_APPLICANTS: DemoApplicant[] = [
  {
    id: "a",
    name: "Asha K. (demo)",
    headline: "Full-stack engineer",
    livefolio: 84,
    reasons: [
      "Must-have: React, Node",
      "Live project: Expense tracker",
      "GitHub 72 contributions in 90 days",
    ],
    proof: ["Live work", "Source", "Writing"],
    references: [],
  },
  {
    id: "b",
    name: "Rohan S. (demo)",
    headline: "Frontend engineer",
    livefolio: 80,
    reasons: [
      "Must-have: React",
      "Project with source: Design system",
      "Role: frontend engineer",
    ],
    proof: ["Live work", "Source"],
    references: [
      {
        relationship: "manager",
        referee: "Demo manager",
        story: "Rohan rebuilt our React checkout and cut load time in half.",
      },
    ],
  },
  {
    id: "c",
    name: "Meera P. (demo)",
    headline: "Backend engineer",
    livefolio: 79,
    reasons: [
      "Must-have: Node",
      "LeetCode 45 hard / 120 medium",
      "Published writing on APIs",
    ],
    proof: ["Source", "Writing", "Certifications"],
    references: [
      {
        relationship: "peer",
        referee: "Demo peer",
        story: "Meera owned our Node API migration end to end.",
      },
      {
        relationship: "collaborator",
        referee: "Demo collaborator",
        story: "Paired with Meera on a React and Node hackathon app.",
      },
    ],
  },
];
