/**
 * Meta descriptions for docs pages, keyed by path (from the SEO fix pack).
 * The on-page subheads in features/docs/content are unchanged.
 */
const DOC_META_DESCRIPTIONS: Record<string, string> = {
  "/docs/account-and-billing":
    "Understand Free, the 30-day trial and Pro, upgrade or cancel a subscription, delete your account and get help from the Livefolio team.",
  "/docs/account-and-billing/cancel-subscription":
    "Cancel your Livefolio Pro subscription from Billing in a few clicks. Pro stays active until the end of the paid cycle, and payments are non-refundable.",
  "/docs/account-and-billing/delete-account":
    "Permanently delete your Livefolio account from Settings. This removes your portfolio, imports, analytics and subscription and cannot be undone.",
  "/docs/account-and-billing/get-help":
    "Contact the Livefolio team at team@livefolio.me or through the contact page. We typically respond within one business day.",
  "/docs/account-and-billing/plans-and-trial":
    "See what is included in Free, the 30-day trial and Pro, including imports, analytics, project thumbnails, live previews and reference requests.",
  "/docs/account-and-billing/upgrade-to-pro":
    "Upgrade to Livefolio Pro from Billing. Choose monthly, quarterly or yearly billing and pay with Razorpay checkout.",
  "/docs/analytics":
    "See who visits your Livefolio portfolio and what they click, with views, link clicks and trends over time.",
  "/docs/analytics/view-analytics":
    "Read your portfolio analytics: total views, last 30 days, peak hour, busiest day and best streak, plus link clicks for each of your links.",
  "/docs/build-your-portfolio":
    "Import your resume PDF and work from other platforms, then edit every section of your Livefolio portfolio.",
  "/docs/build-your-portfolio/achievements-and-custom-sections":
    "Add awards, certifications and custom sections to your Livefolio portfolio for any kind of work you want to show.",
  "/docs/build-your-portfolio/edit-basic-info":
    "Edit your name, headline, summary, photo and contact details on your Livefolio portfolio.",
  "/docs/build-your-portfolio/experience-and-education":
    "Add your roles, companies, schools and dates to your Livefolio portfolio, or review what the resume import filled in.",
  "/docs/build-your-portfolio/import-from-platforms":
    "Import repositories, published articles and coding stats from GitHub, Medium, Dev.to, Hashnode, LeetCode, Stack Overflow and Codeforces.",
  "/docs/build-your-portfolio/import-resume":
    "Auto-fill your portfolio from a resume PDF up to 10 MB. Livefolio extracts experience, education, skills and projects for you to review.",
  "/docs/build-your-portfolio/skills-and-projects":
    "Add your skills and featured projects with descriptions, links and thumbnails. Pro adds live project previews.",
  "/docs/build-your-portfolio/social-links":
    "Add links to your profiles across the web so visitors and recruiters can find your work in one place.",
  "/docs/design":
    "Choose a template, accent colour, section order and navigation for your Livefolio portfolio.",
  "/docs/design/choose-template":
    "Browse the template gallery, apply a design and check it in Preview with your own content before you publish.",
  "/docs/design/portfolio-navbar":
    "Choose which sections appear in your portfolio's navigation bar.",
  "/docs/design/preview-and-customize":
    "Preview your portfolio on desktop and mobile, change the accent colour and drag sections into a new order.",
  "/docs/getting-started":
    "Create your Livefolio account, set up your portfolio from your resume and find your way around the dashboard.",
  "/docs/getting-started/create-account":
    "Sign up for Livefolio with Google or GitHub in a few seconds. There is no password to remember.",
  "/docs/getting-started/create-portfolio":
    "Create your Livefolio portfolio and fill it in from your resume PDF. It stays private until you publish.",
  "/docs/getting-started/dashboard-tour":
    "A tour of the Livefolio dashboard sidebar and what each item does.",
  "/docs/getting-started/what-is-livefolio":
    "Livefolio turns your resume and the work scattered across the internet into one live portfolio on your own subdomain, like yourname.livefolio.me.",
  "/docs/publish-and-share":
    "Go live on your own livefolio.me subdomain, change it later, share your link and turn on Open to work.",
  "/docs/publish-and-share/change-subdomain-or-unpublish":
    "Change your livefolio.me subdomain or hide your portfolio. Changing the subdomain changes your public URL, so old links stop working.",
  "/docs/publish-and-share/open-to-work":
    "Turn on Open to work so recruiters can find your published portfolio in Livefolio's recruiter search.",
  "/docs/publish-and-share/publish-portfolio":
    "Preview your portfolio, choose a subdomain with lowercase letters, numbers and hyphens, and go live.",
  "/docs/publish-and-share/share-portfolio":
    "Copy your public Livefolio link and share it from the Edit page or the Preview toolbar.",
  "/docs/references":
    "Ask people you have worked with to vouch for you, or write a reference for someone who asked you.",
  "/docs/references/ask-for-reference":
    "Send a reference request to a manager, peer or collaborator. Free accounts can ask 3 people and Pro can ask 15.",
  "/docs/references/write-a-reference":
    "Vouch for someone who asked you. Sign in, answer two short questions with a concrete story, and submit in under a minute.",
};

export function getDocMetaDescription(path: string, fallback: string): string {
  return DOC_META_DESCRIPTIONS[path] ?? fallback;
}
