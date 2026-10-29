/**
 * Synonym groups used to widen recall and ranking across every kind of Livefolio,
 * not only engineering. Keep groups tight so `js` never matches `java`.
 */
const SKILL_GROUPS: string[][] = [
  // Engineering
  ["react", "reactjs"],
  ["react native", "react-native"],
  ["node", "nodejs"],
  ["typescript", "ts"],
  ["javascript", "js", "es6"],
  ["python", "py"],
  ["c++", "cpp"],
  ["c#", "csharp"],
  ["ruby on rails", "rails"],
  ["postgres", "postgresql"],
  ["mongodb", "mongo"],
  ["elasticsearch", "opensearch"],
  ["aws", "amazon web services"],
  ["gcp", "google cloud"],
  ["kubernetes", "k8s"],
  ["vue", "vuejs"],
  ["angular", "angularjs"],
  ["spring", "spring boot"],
  ["nestjs", "nest"],
  ["tailwind", "tailwindcss"],
  ["ci/cd", "cicd"],
  ["machine learning", "ml"],
  ["llm", "large language models", "genai", "generative ai"],

  // Data and analytics
  ["excel", "microsoft excel", "spreadsheets"],
  ["power bi", "powerbi"],
  ["tableau"],
  ["google analytics", "ga4"],
  ["data analysis", "data analytics"],
  ["a/b testing", "ab testing", "experimentation"],

  // Design
  ["ui design", "ui"],
  ["ux design", "ux", "user experience"],
  ["ui/ux", "ux/ui", "product design"],
  ["figma"],
  ["adobe photoshop", "photoshop"],
  ["adobe illustrator", "illustrator"],
  ["adobe after effects", "after effects"],
  ["adobe premiere pro", "premiere pro"],
  ["motion design", "motion graphics"],
  ["graphic design", "visual design"],
  ["user research", "ux research"],
  ["wireframing", "wireframes", "prototyping"],
  ["design systems", "design system"],

  // Marketing and growth
  ["seo", "search engine optimization"],
  ["sem", "search engine marketing", "google ads", "ppc"],
  ["social media marketing", "smm", "social media"],
  ["content marketing", "content strategy"],
  ["performance marketing", "paid marketing", "paid ads"],
  ["email marketing", "lifecycle marketing", "crm marketing"],
  ["brand marketing", "branding", "brand strategy"],
  ["growth marketing", "growth marketer"],
  ["go-to-market", "gtm"],
  ["product marketing", "pmm"],
  ["hubspot"],
  ["meta ads", "facebook ads"],

  // Writing and content
  ["copywriting", "copywriter"],
  ["technical writing", "technical writer", "documentation"],
  ["content writing", "content writer"],
  ["editing", "copyediting", "proofreading"],
  ["devrel", "developer relations", "developer advocate"],

  // Sales and customer
  ["business development", "bizdev"],
  ["account executive"],
  ["sales development", "sdr", "bdr"],
  ["account management", "key account management", "kam"],
  ["customer success", "csm"],
  ["customer support", "customer service"],
  ["b2b sales", "enterprise sales"],
  ["salesforce", "sfdc"],
  ["lead generation", "lead gen", "prospecting"],
  ["negotiation", "deal closing"],

  // Product and project
  ["product management", "product manager", "pm"],
  ["product owner"],
  ["project management", "project manager"],
  ["program management", "program manager", "tpm"],
  ["agile", "scrum"],
  ["roadmapping", "product roadmap"],
  ["jira"],

  // People, operations, finance
  ["recruiting", "recruitment", "talent acquisition"],
  ["human resources", "hr", "people operations", "people ops"],
  ["operations", "ops", "business operations"],
  ["supply chain", "logistics", "procurement"],
  ["financial modeling", "financial modelling"],
  ["fp&a", "financial planning and analysis"],
  ["accounting", "bookkeeping"],
  ["chartered accountant"],
  ["tally", "tally erp"],
  ["quickbooks"],

  // Common credentials
  ["mba", "master of business administration"],
  ["pmp", "project management professional"],
];

const INDEX = new Map<string, string[]>();

/** Lowercase and fold `Next.js` / `node.js` to `nextjs` / `nodejs`; apply to both terms and profile text. */
export function normalizeSearchText(text: string): string {
  return text.toLowerCase().replace(/([a-z0-9])\.js\b/g, "$1js");
}

function canonicalize(term: string): string {
  return normalizeSearchText(term)
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

for (const group of SKILL_GROUPS) {
  const members = [...new Set(group.map(canonicalize).filter(Boolean))];
  for (const key of members) {
    const existing = INDEX.get(key) ?? [];
    INDEX.set(key, [...new Set([...existing, ...members])]);
  }
}

export function expandSkillTerm(term: string): string[] {
  const key = canonicalize(term);
  if (!key) return [];
  return INDEX.get(key) ?? [key];
}

export function expandSkillTerms(terms: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const term of terms) {
    for (const variant of expandSkillTerm(term)) {
      if (seen.has(variant)) continue;
      seen.add(variant);
      out.push(variant);
    }
  }
  return out;
}
