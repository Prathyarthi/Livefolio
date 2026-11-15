import { expandSkillTerms } from "@/features/search/lib/skill-families";
import { tokenize } from "@/features/search/lib/match";

export type SearchSort = "relevance" | "recent";

export function parseSearchSort(value: string | undefined): SearchSort {
  return value === "recent" ? "recent" : "relevance";
}

export type InterpretedSearchQuery = {
  raw: string;
  keywords: string[];
  skills: string[];
  phrases: string[];
  exclude: string[];
  matchAny: boolean;
  minExperience?: number;
  location?: string;
};

const QUERY_FILLER = new Set([
  "suggest",
  "recommend",
  "recommendation",
  "show",
  "find",
  "need",
  "want",
  "looking",
  "please",
  "me",
  "us",
  "a",
  "an",
  "the",
  "to",
  "for",
  "of",
  "and",
  "or",
  "with",
  "who",
  "that",
  "this",
  "their",
  "them",
  "they",
  "has",
  "have",
  "having",
  "someone",
  "somebody",
  "person",
  "people",
  "candidate",
  "candidates",
  "applicant",
  "applicants",
  "profile",
  "profiles",
  "good",
  "great",
  "strong",
  "solid",
  "decent",
  "nice",
  "best",
  "top",
  "ideal",
  "amount",
  "lot",
  "lots",
  "plenty",
  "knowledge",
  "knows",
  "know",
  "skilled",
  "skill",
  "skills",
  "background",
  "proficiency",
  "proficient",
  "familiar",
  "experience",
  "experienced",
  "exp",
  "years",
  "year",
  "yrs",
  "yr",
  "plus",
  "least",
  "minimum",
  "min",
  "about",
  "around",
  "over",
  "more",
  "than",
  "some",
  "any",
  "from",
  "based",
  "located",
  "working",
  "work",
  "worked",
  "using",
  "use",
  "used",
  "in",
  "on",
  "at",
]);

function uniqueTerms(terms: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const term of terms) {
    const normalized = term.toLowerCase().trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

/** A parsed (lowercased) term in the casing the recruiter typed, for display. */
export function termAsTyped(raw: string, term: string): string {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return raw.match(new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, "i"))?.[0] ?? term;
}

/**
 * Turn a recruiter sentence into structured filters + leftover keywords.
 * "suggest a candidate with 4 years of experience in React and Node"
 * → { minExperience: 4, keywords: ["react", "node"] }
 *
 * Boolean-lite (Naukri / LinkedIn Recruiter style, without copying their engines):
 * - quoted phrases stay atomic
 * - OR switches the keyword group to any-match
 * - NOT term / -term excludes
 * - AND is the default
 */
export function interpretSearchQuery(
  query: string | undefined,
): InterpretedSearchQuery {
  const empty: InterpretedSearchQuery = {
    raw: "",
    keywords: [],
    skills: [],
    phrases: [],
    exclude: [],
    matchAny: false,
  };
  const raw = query?.trim() ?? "";
  if (!raw) return { ...empty, raw };

  let rest = raw;
  let minExperience: number | undefined;
  let location: string | undefined;
  const phrases: string[] = [];
  const exclude: string[] = [];

  rest = rest.replace(/(?:\bNOT\s+|(?:^|\s)-)"([^"]{1,80})"/gi, (_, phrase: string) => {
    const trimmed = phrase.trim();
    if (trimmed) exclude.push(trimmed.toLowerCase());
    return " ";
  });
  rest = rest.replace(/"([^"]{1,80})"/g, (_, phrase: string) => {
    const trimmed = phrase.trim();
    if (trimmed) phrases.push(trimmed.toLowerCase());
    return " ";
  });

  rest = rest.replace(
    /\bNOT\s+([a-z0-9+#][a-z0-9+\-#.]*)/gi,
    (_, token: string) => {
      exclude.push(token.toLowerCase());
      return " ";
    },
  );
  rest = rest.replace(/(?:^|\s)-([a-z0-9+#][a-z0-9+\-#.]*)/gi, (_, token: string) => {
    exclude.push(token.toLowerCase());
    return " ";
  });

  const yearMatch = rest.match(
    /(?:at\s+least|minimum|min\.?|over|more\s+than|around|about)?\s*(\d+)\s*\+?\s*(?:years?|yrs?)\b/i,
  );
  if (yearMatch) {
    const years = Number(yearMatch[1]);
    if (Number.isFinite(years) && years > 0 && years < 60) {
      minExperience = years;
    }
    rest = rest.replace(yearMatch[0], " ");
  }

  const locationMatch = rest.match(
    /\b(?:in|from|based\s+in|located\s+in)\s+([a-z][a-z.\s-]{1,40}?)(?=\s+(?:with|who|and|or|,)|$)/i,
  );
  if (locationMatch) {
    const place = locationMatch[1].trim().replace(/[.,]+$/, "");
    if (place && !QUERY_FILLER.has(place.toLowerCase())) {
      location = place;
    }
    rest = rest.replace(locationMatch[0], " ");
  } else if (/\bremote\b/i.test(rest)) {
    location = "remote";
    rest = rest.replace(/\bremote\b/i, " ");
  }

  const matchAny = /\bOR\b/i.test(rest);
  rest = rest.replace(/\b(?:OR|AND)\b/gi, " ");

  const keywords = uniqueTerms([
    ...phrases,
    ...tokenize(rest).filter((token) => {
      if (QUERY_FILLER.has(token)) return false;
      if (/^\d+$/.test(token)) return false;
      return true;
    }),
  ]);

  return {
    raw,
    keywords,
    skills: expandSkillTerms(keywords),
    phrases,
    exclude: uniqueTerms(exclude),
    matchAny,
    minExperience,
    location,
  };
}