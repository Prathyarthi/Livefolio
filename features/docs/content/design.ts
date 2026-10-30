import { Palette } from "lucide-react";
import { shot } from "@/features/docs/content/screenshots";
import type { DocCategory } from "@/features/docs/types";

export const design: DocCategory = {
  slug: "design",
  title: "Design your portfolio",
  description: "Templates, accent colours, section order and navigation.",
  icon: Palette,
  articles: [
    {
      slug: "choose-template",
      title: "How to choose a template",
      description: "Pick the look of your portfolio.",
      appPath: "/dashboard/templates",
      blocks: [
        {
          type: "steps",
          steps: [
            {
              title: "Open Templates",
              body: "Click **Templates** in the sidebar to see the full gallery with a live thumbnail of each design.",
              screenshot: shot("templates"),
            },
            {
              title: "Pick a template",
              body: "Click a template to apply it. Templates marked with a lock need the free trial or Pro.",
            },
            {
              title: "Check it in Preview",
              body: "Open **Preview** to see your own content in the new design.",
            },
          ],
        },
        {
          type: "callout",
          variant: "info",
          title: "Free templates",
          text: "Minimal, Modern, Corporate, Developer, Vibrant, Paper and Airy are always free. Every other template is unlocked during the trial and on Pro.",
        },
      ],
    },
    {
      slug: "preview-and-customize",
      title: "How to preview and customise your portfolio",
      description: "Switch devices, change the accent colour and reorder sections.",
      appPath: "/dashboard/preview",
      blocks: [
        {
          type: "steps",
          steps: [
            {
              title: "Open Preview",
              body: "Click **Preview** in the sidebar. Your portfolio renders exactly as visitors will see it.",
              screenshot: shot("preview"),
            },
            {
              title: "Switch between desktop and mobile",
              body: "Use the device buttons in the toolbar to check both layouts.",
            },
            {
              title: "Open the editor panel",
              body: "Click **Edit** in the toolbar to open the side panel. **Design** lets you switch templates and accent colours; **Sections** lets you drag sections into a new order.",
              screenshot: shot("preview-sections"),
            },
            {
              title: "Apply your changes",
              body: "When you change the template or design, click **Apply** in the toolbar to save it.",
            },
          ],
        },
        {
          type: "callout",
          variant: "tip",
          text: "You can also edit content right from the panel without leaving Preview.",
        },
      ],
    },
    {
      slug: "portfolio-navbar",
      title: "How to configure the portfolio navbar",
      description: "Choose which sections appear in your portfolio's navigation.",
      appPath: "/dashboard/settings",
      blocks: [
        {
          type: "steps",
          steps: [
            {
              title: "Open Settings",
              body: "Click **Settings** in the sidebar and find **Portfolio Navbar**.",
              screenshot: shot("settings"),
            },
            {
              title: "Turn the navbar on or off",
              body: "Use **Show navbar** to let visitors jump to sections on your page.",
            },
            {
              title: "Pick the sections",
              body: "Toggle the sections you want in the navbar, such as About, Work, Experience and Profiles. Up to 4 items are shown.",
            },
            { title: "Save", body: "Click **Save Navbar Preferences**." },
          ],
        },
        {
          type: "callout",
          variant: "info",
          text: "A section only appears in the navbar when your portfolio actually has content for it.",
        },
      ],
    },
  ],
};
