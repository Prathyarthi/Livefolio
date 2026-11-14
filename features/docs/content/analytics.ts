import { BarChart3 } from "lucide-react";
import { shot } from "@/features/docs/content/screenshots";
import type { DocCategory } from "@/features/docs/types";

export const analytics: DocCategory = {
  slug: "analytics",
  title: "Analytics",
  description: "See who visits your portfolio and what they click.",
  icon: BarChart3,
  articles: [
    {
      slug: "view-analytics",
      title: "How to view your portfolio analytics",
      description: "Views, link clicks and trends.",
      appPath: "/dashboard/analytics",
      blocks: [
        {
          type: "steps",
          steps: [
            {
              title: "Open Analytics",
              body: "Click **Analytics** in the sidebar, or choose **Analytics** from the **⋯** menu in Preview.",
              screenshot: shot("analytics"),
            },
            {
              title: "Read the summary",
              body: "The cards at the top show **Total views**, **Today**, **Last 30 days**, **Peak hour**, **Busiest day** and **Best streak**.",
            },
            {
              title: "Explore the charts",
              body: "Switch the date range to see views over time and **Link clicks** for each of your links.",
            },
          ],
        },
        {
          type: "callout",
          variant: "info",
          text: "Analytics is available during the free trial and on Pro.",
        },
      ],
    },
  ],
};
