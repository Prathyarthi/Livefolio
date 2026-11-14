import { PencilLine } from "lucide-react";
import { shot } from "@/features/docs/content/screenshots";
import type { DocCategory } from "@/features/docs/types";

export const buildYourPortfolio: DocCategory = {
  slug: "build-your-portfolio",
  title: "Build your portfolio",
  description: "Import your data and edit every section of your portfolio.",
  icon: PencilLine,
  articles: [
    {
      slug: "import-resume",
      title: "How to import your resume",
      description: "Auto-fill your portfolio from a PDF resume.",
      appPath: "/dashboard/import",
      blocks: [
        {
          type: "steps",
          steps: [
            {
              title: "Open Import",
              body: "Click **Import** in the dashboard sidebar.",
            },
            {
              title: "Select Resume",
              body: "Under **Import from**, choose **Resume**. On smaller screens the sources appear as a row of chips at the top.",
              screenshot: shot("import-resume"),
            },
            {
              title: "Upload your PDF",
              body: "Drop your resume onto the upload area or click to browse. Livefolio reads it and extracts your experience, education, skills, projects and more.",
            },
            {
              title: "Review the result",
              body: "Open **Edit** and check each section. Fix anything that was not picked up correctly.",
            },
          ],
        },
        {
          type: "callout",
          variant: "warning",
          title: "Supported files",
          text: "Only PDF files up to **10 MB** are supported. Scanned images inside a PDF may not be read correctly.",
        },
        {
          type: "callout",
          variant: "info",
          text: "Imports are available on the free trial and on Pro. See [Plans, trial and Pro](/docs/account-and-billing/plans-and-trial).",
        },
      ],
    },
    {
      slug: "import-from-platforms",
      title: "How to import from GitHub and other platforms",
      description: "Bring in repositories, articles and coding stats.",
      appPath: "/dashboard/import",
      blocks: [
        {
          type: "paragraph",
          text: "Besides your resume, Livefolio can import from these sources:",
        },
        {
          type: "list",
          items: [
            "**GitHub**: fetch repositories and import them as portfolio projects.",
            "**Medium**, **Dev.to** and **Hashnode**: pull in articles you have published.",
            "**LeetCode**: sync coding stats and problem-solving progress.",
            "**Stack Overflow**: sync reputation and import your top answers.",
            "**Codeforces**: sync contest rating, rank and solved problems.",
          ],
        },
        {
          type: "steps",
          steps: [
            {
              title: "Open Import and pick a source",
              body: "Click **Import** in the sidebar and choose a platform under **Import from**.",
              screenshot: shot("import-integrations"),
            },
            {
              title: "Enter your username or profile",
              body: "Type your username (or blog address for Hashnode) and fetch your data.",
            },
            {
              title: "Choose what to show",
              body: "Select the items you want and use the switches to control whether each integration is visible on your portfolio.",
            },
            {
              title: "Save",
              body: "Save your selection. Imported items appear in the matching sections of your portfolio.",
            },
          ],
        },
      ],
    },
    {
      slug: "edit-basic-info",
      title: "How to edit your basic info",
      description: "Name, headline, summary, photo and contact details.",
      appPath: "/dashboard/edit?step=basic",
      blocks: [
        {
          type: "steps",
          steps: [
            {
              title: "Open Edit",
              body: "Click **Edit** in the sidebar. The section list on the left starts at **Basic Info**.",
              screenshot: shot("edit-basic-info"),
            },
            {
              title: "Fill in your details",
              body: "Add your name, headline, a short summary and your contact details such as email, phone and location.",
            },
            {
              title: "Add a photo",
              body: "Upload a profile image. You can crop and zoom it before saving.",
            },
            {
              title: "Save your changes",
              body: "An **Unsaved** badge appears while you have changes. Save before moving on to the next section.",
            },
          ],
        },
        {
          type: "callout",
          variant: "tip",
          text: "Use a clear, professional headshot and a one-line headline that says what you do.",
        },
      ],
    },
    {
      slug: "experience-and-education",
      title: "How to add experience and education",
      description: "Add roles, companies, schools and dates.",
      appPath: "/dashboard/edit?step=experience",
      blocks: [
        {
          type: "steps",
          steps: [
            {
              title: "Go to Experience",
              body: "In **Edit**, choose **Experience** from the section list.",
              screenshot: shot("edit-experience"),
            },
            {
              title: "Add a role",
              body: "Add an entry with your title, company, dates and a description of what you did. Repeat for each role.",
            },
            {
              title: "Go to Education",
              body: "Choose **Education** and add your schools, degrees and dates the same way.",
            },
            { title: "Save", body: "Save each section when you are done." },
          ],
        },
      ],
    },
    {
      slug: "skills-and-projects",
      title: "How to add skills and projects",
      description: "Show your stack and your best work.",
      appPath: "/dashboard/edit?step=projects",
      blocks: [
        {
          type: "steps",
          steps: [
            {
              title: "Add skills",
              body: "In **Edit**, open **Skills** and add the tools, languages and frameworks you use.",
            },
            {
              title: "Add a project",
              body: "Open **Projects** and add featured work with a name, description, links and tech stack.",
              screenshot: shot("edit-projects"),
            },
            {
              title: "Add a thumbnail",
              body: "Upload a preview image for a project so it stands out on your portfolio.",
            },
            {
              title: "Turn on live preview (Pro)",
              body: "On Pro you can enable **Live preview on portfolio** for a project, which shows a live preview of its website instead of a static image.",
            },
          ],
        },
        {
          type: "callout",
          variant: "info",
          text: "Free accounts can add up to **3** project thumbnails. Pro raises this to **12** and adds up to **50** live preview slots.",
        },
      ],
    },
    {
      slug: "achievements-and-custom-sections",
      title: "How to add achievements and custom sections",
      description: "Awards, certifications and anything else you want to show.",
      appPath: "/dashboard/edit?step=custom",
      blocks: [
        {
          type: "steps",
          steps: [
            {
              title: "Add achievements",
              body: "In **Edit**, open **Achievements** and add awards, certifications or other wins.",
            },
            {
              title: "Create a custom section",
              body: "Open **Custom Sections** to add a section of your own, for example talks, volunteering or publications.",
              screenshot: shot("edit-custom-sections"),
            },
            { title: "Save", body: "Save, then check the result in **Preview**." },
          ],
        },
      ],
    },
    {
      slug: "social-links",
      title: "How to add social links",
      description: "Link to your profiles across the web.",
      appPath: "/dashboard/edit?step=social",
      blocks: [
        {
          type: "steps",
          steps: [
            {
              title: "Open Social Links",
              body: "In **Edit**, choose **Social Links**.",
              screenshot: shot("edit-social"),
            },
            {
              title: "Add your links",
              body: "Add the profiles you want visitors to find, such as LinkedIn, GitHub or X.",
            },
            { title: "Save", body: "Save your links. They appear on your portfolio." },
          ],
        },
        {
          type: "callout",
          variant: "tip",
          text: "Clicks on your links are counted in [Analytics](/docs/analytics/view-analytics).",
        },
      ],
    },
  ],
};
