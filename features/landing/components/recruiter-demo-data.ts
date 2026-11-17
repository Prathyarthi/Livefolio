import type { ReferenceForSearch } from "@/features/search/lib/references";

/** Sample applicants for the recruiters landing page. Not real people or scores. */
export type DemoApplicant = {
  id: string;
  name: string;
  headline: string;
  /** Livefolio score (0–100) before references, as shown with the toggle off. */
  livefolio: number;
  /** One short line of plain reasons, as the shortlist shows them. */
  reasons: string;
  references: (ReferenceForSearch & { referee: string })[];
};

/** The demo job's search terms; reference stories that mention them count in full. */
export const DEMO_TERMS = ["react", "node"];

export const DEMO_APPLICANTS: DemoApplicant[] = [
  {
    id: "asha",
    name: "Asha K.",
    headline: "Full-stack engineer",
    livefolio: 84,
    reasons: "React, Node · Live expense tracker · Active on GitHub",
    references: [],
  },
  {
    id: "rohan",
    name: "Rohan S.",
    headline: "Frontend engineer",
    livefolio: 80,
    reasons: "React · Design system with source",
    references: [
      {
        relationship: "manager",
        referee: "Nikhil R.",
        story: "Rohan rebuilt our React checkout and cut load time in half.",
      },
    ],
  },
  {
    id: "meera",
    name: "Meera P.",
    headline: "Backend engineer",
    livefolio: 79,
    reasons: "Node · Writes about APIs · LeetCode 45 hard",
    references: [
      {
        relationship: "peer",
        referee: "Karan M.",
        story: "Meera owned our Node API migration end to end.",
      },
      {
        relationship: "collaborator",
        referee: "Lena V.",
        story: "Paired with Meera on a React and Node hackathon app.",
      },
    ],
  },
];
