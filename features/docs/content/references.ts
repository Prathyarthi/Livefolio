import { Handshake } from "lucide-react";
import { shot } from "@/features/docs/content/screenshots";
import type { DocCategory } from "@/features/docs/types";

export const references: DocCategory = {
  slug: "references",
  title: "References",
  description: "Ask people you have worked with to vouch for you.",
  icon: Handshake,
  articles: [
    {
      slug: "ask-for-reference",
      title: "How to ask for a reference",
      description: "Send a reference request to a manager, peer or collaborator.",
      appPath: "/dashboard/references",
      blocks: [
        {
          type: "steps",
          steps: [
            {
              title: "Open References",
              body: "In **Edit**, choose **References**, then click **Manage requests** to open the references page.",
              screenshot: shot("references"),
            },
            {
              title: "Fill in the request",
              body: "Enter **Their email**, an optional name, and choose **How do you know them?** (for example Manager, Peer or Collaborator). Add an optional short note to remind them where you worked together.",
            },
            {
              title: "Send it",
              body: "Click **Ask for a reference**. They get an email, and you can also copy the link and send it yourself.",
            },
            {
              title: "Track the status",
              body: "Under **People you asked**, each request shows as **Waiting**, **Vouched** or **Cancelled**. You can cancel a pending request.",
            },
          ],
        },
        {
          type: "callout",
          variant: "info",
          title: "Limits",
          text: "Free accounts can ask **3** people. Pro can ask **15**.",
        },
        {
          type: "callout",
          variant: "tip",
          text: "Completed references are visible to recruiters and in your editor. They are not shown on your public portfolio.",
        },
      ],
    },
    {
      slug: "write-a-reference",
      title: "How to write a reference for someone",
      description: "Vouch for someone who asked you.",
      blocks: [
        {
          type: "steps",
          steps: [
            {
              title: "Open the link",
              body: "Click the link in the email you received.",
            },
            {
              title: "Sign in",
              body: "Click **Sign in to vouch** and sign in with Google or GitHub. Use the account for the email address the request was sent to.",
            },
            {
              title: "Answer two short questions",
              body: "Write a concrete story about working together, not just “great teammate”. It takes under a minute.",
            },
            { title: "Submit", body: "Click **Vouch** to submit your reference." },
          ],
        },
        {
          type: "callout",
          variant: "warning",
          text: "Each link can only be used once. If you see **Already submitted**, someone has already vouched with it.",
        },
      ],
    },
  ],
};
