import { Rocket } from "lucide-react";
import { shot } from "@/features/docs/content/screenshots";
import type { DocCategory } from "@/features/docs/types";

export const gettingStarted: DocCategory = {
  slug: "getting-started",
  title: "Getting started",
  description: "Create your account, set up your portfolio and find your way around.",
  icon: Rocket,
  articles: [
    {
      slug: "what-is-livefolio",
      title: "What is Livefolio?",
      description: "A quick overview of what you can do with Livefolio.",
      blocks: [
        {
          type: "paragraph",
          text: "Livefolio turns your resume and the work scattered across the internet into one live portfolio on your own subdomain, like `yourname.livefolio.me`.",
        },
        { type: "screenshot", screenshot: shot("landing") },
        { type: "heading", text: "What you can do" },
        {
          type: "list",
          items: [
            "**Import** your resume PDF and pull in work from GitHub, Medium, Dev.to, Hashnode, LeetCode, Stack Overflow and Codeforces.",
            "**Edit** every section: basic info, experience, education, skills, projects, achievements, custom sections and social links.",
            "**Design** your portfolio by picking a template, an accent colour and the order of sections.",
            "**Publish** on a subdomain of your choice and share the link anywhere.",
            "**Collect references** from people who have worked with you.",
            "**Track** visits and link clicks with analytics.",
          ],
        },
        {
          type: "callout",
          variant: "tip",
          text: "New here? Follow [Create your account](/docs/getting-started/create-account) and then [Create your portfolio](/docs/getting-started/create-portfolio).",
        },
      ],
    },
    {
      slug: "create-account",
      title: "How to create a Livefolio account",
      description: "Sign up with Google or GitHub in a few seconds.",
      appPath: "/sign-up",
      blocks: [
        {
          type: "paragraph",
          text: "Livefolio uses single sign-on, so there is no password to remember.",
        },
        {
          type: "steps",
          steps: [
            {
              title: "Open the sign up page",
              body: "Go to [livefolio.me/sign-up](/sign-up), or click **Get started** in the top navigation of the home page.",
              screenshot: shot("sign-up"),
            },
            {
              title: "Choose Google or GitHub",
              body: "Click **Continue with Google** or **Continue with GitHub** and approve access on the provider's screen.",
            },
            {
              title: "Land on your dashboard",
              body: "Once you are signed in, you are taken to your [dashboard](/dashboard). From here you can create your portfolio.",
            },
          ],
        },
        {
          type: "callout",
          variant: "info",
          title: "Signing in later",
          text: "Use [Sign in](/sign-in) with the same provider you signed up with. If both your Google and GitHub accounts use the same email address, either one opens the same Livefolio account.",
        },
        { type: "screenshot", screenshot: shot("sign-in") },
      ],
    },
    {
      slug: "create-portfolio",
      title: "How to create your portfolio",
      description: "Create your portfolio and fill it in from your resume.",
      appPath: "/dashboard",
      blocks: [
        {
          type: "steps",
          steps: [
            {
              title: "Open the dashboard",
              body: "After signing in, go to **Overview** in the left sidebar.",
              screenshot: shot("dashboard-overview"),
            },
            {
              title: "Click Create portfolio",
              body: "If you do not have a portfolio yet, click **Create portfolio**. Livefolio creates an empty, unpublished portfolio for you.",
              screenshot: shot("dashboard-create-portfolio"),
            },
            {
              title: "Fill it in",
              body: "The fastest way is to [import your resume](/docs/build-your-portfolio/import-resume). You can also add everything by hand from **Edit**.",
            },
            {
              title: "Pick a template and publish",
              body: "Choose a look in [Templates](/docs/design/choose-template), then [publish](/docs/publish-and-share/publish-portfolio) when you are ready.",
            },
          ],
        },
        {
          type: "callout",
          variant: "info",
          text: "Your portfolio stays private until you publish it, so you can take your time.",
        },
      ],
    },
    {
      slug: "dashboard-tour",
      title: "Finding your way around the dashboard",
      description: "What each item in the dashboard sidebar does.",
      appPath: "/dashboard",
      blocks: [
        {
          type: "paragraph",
          text: "Everything lives in the left sidebar of the dashboard. On mobile, tap the menu button to open it. On desktop, you can collapse it to icons with the panel button next to the logo.",
        },
        {
          type: "list",
          items: [
            "**Overview** shows your portfolio status, its public link and quick links.",
            "**Edit** is where you change the content of every section.",
            "**Templates** lets you pick the design of your portfolio.",
            "**Import** brings in your resume and work from other platforms.",
            "**Preview** shows your portfolio exactly as visitors see it, with design controls and publishing.",
            "**Analytics** shows visits and link clicks.",
            "**Billing** manages your plan.",
            "**Settings** holds account details, the portfolio navbar and account deletion.",
          ],
        },
        {
          type: "callout",
          variant: "tip",
          text: "The theme toggle and the sign out button are at the bottom of the sidebar, next to your name.",
        },
      ],
    },
  ],
};
