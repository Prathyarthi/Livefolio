/** Plain-text FAQ entries for UI + JSON-LD (no JSX). */
export const FAQ_ITEMS = [
  {
    question: "How does Livefolio work?",
    answer:
      "Upload your resume PDF, pick a template, and publish a live portfolio link. You can also import from GitHub, Medium, and LeetCode to keep everything in one place.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "Yes. You can create and publish a portfolio on the Minimal template. A free trial unlocks all templates and imports; Pro keeps those features after the trial.",
  },
  {
    question: "Can I use my own subdomain?",
    answer:
      "Yes. When you publish, you choose a subdomain like yourname.livefolio.me. You can change it from the dashboard before or after going live.",
  },
  {
    question: "What file types can I import for my resume?",
    answer:
      "Resume import supports PDF files up to 10 MB. We extract experience, education, skills, projects, and more into editable portfolio sections.",
  },
  {
    question: "How do billing, cancellations, and refunds work?",
    answer:
      "Pro renews automatically. Cancellation takes effect at the end of the current paid cycle, and payments are non-refundable.",
  },
  {
    question: "How do I get help?",
    answer:
      "Email team@livefolio.me or visit our contact page. We typically respond within one business day.",
  },
] as const;
