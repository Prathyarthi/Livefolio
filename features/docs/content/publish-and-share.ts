import { Globe } from "lucide-react";
import { shot } from "@/features/docs/content/screenshots";
import type { DocCategory } from "@/features/docs/types";

export const publishAndShare: DocCategory = {
  slug: "publish-and-share",
  title: "Publish and share",
  description: "Go live on your own subdomain and share your link.",
  icon: Globe,
  articles: [
    {
      slug: "publish-portfolio",
      title: "How to publish your portfolio",
      description: "Choose a subdomain and make your portfolio public.",
      appPath: "/dashboard/preview",
      blocks: [
        {
          type: "steps",
          steps: [
            {
              title: "Open Preview",
              body: "Click **Preview** in the sidebar and check that everything looks right.",
            },
            {
              title: "Click Publish",
              body: "Click **Publish** in the preview toolbar.",
            },
            {
              title: "Choose your subdomain",
              body: "Type the subdomain you want, for example `your-name`. Livefolio checks it as you type and shows **Available** or **Already taken or invalid**.",
              screenshot: shot("publish-dialog"),
            },
            {
              title: "Confirm",
              body: "Click **Publish**. When you see **Portfolio is live**, click **Open Portfolio** to visit it.",
            },
          ],
        },
        {
          type: "callout",
          variant: "tip",
          text: "Subdomains can use lowercase letters, numbers and hyphens.",
        },
      ],
    },
    {
      slug: "change-subdomain-or-unpublish",
      title: "How to change your subdomain or unpublish",
      description: "Update your link or hide your portfolio.",
      appPath: "/dashboard/edit?step=publish",
      blocks: [
        {
          type: "steps",
          steps: [
            {
              title: "Open the Publish step",
              body: "In **Edit**, choose **Publish** at the bottom of the section list.",
              screenshot: shot("edit-publish-step"),
            },
            {
              title: "Change the subdomain",
              body: "Edit **Choose your subdomain** and click **Update subdomain**.",
            },
            {
              title: "Publish or hide",
              body: "Use the publish switch to go live or hide your portfolio. When hidden, visitors can no longer open your public URL.",
            },
          ],
        },
        {
          type: "callout",
          variant: "warning",
          text: "Changing your subdomain changes your public URL. Links you shared before will stop working.",
        },
      ],
    },
    {
      slug: "share-portfolio",
      title: "How to share your portfolio",
      description: "Copy your public link.",
      appPath: "/dashboard/edit",
      blocks: [
        {
          type: "steps",
          steps: [
            {
              title: "Open the share dialog",
              body: "Click **Share** on the Edit page, or open the **⋯** menu in the Preview toolbar and choose **Share**.",
            },
            {
              title: "Copy the link",
              body: "Click **Copy** next to your public URL, or **Open Portfolio** to visit it.",
              screenshot: shot("share-dialog"),
            },
          ],
        },
        {
          type: "callout",
          variant: "info",
          text: "If your portfolio is not published yet, the dialog reminds you to publish first. The link will not work for visitors until you do.",
        },
      ],
    },
    {
      slug: "open-to-work",
      title: "How to mark yourself as open to work",
      description: "Let recruiters find you.",
      appPath: "/dashboard/edit?step=publish",
      blocks: [
        {
          type: "steps",
          steps: [
            {
              title: "Open the Publish step",
              body: "In **Edit**, choose **Publish**.",
            },
            {
              title: "Turn on Open to work",
              body: "Switch on **Open to work**. Recruiters can then find you.",
            },
          ],
        },
        {
          type: "callout",
          variant: "warning",
          text: "Your portfolio must be published to appear in recruiter search.",
        },
      ],
    },
  ],
};
