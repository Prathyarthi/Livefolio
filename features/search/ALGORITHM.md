# Livefolio search and ranking

Livefolio ranks people from the Livefolio they submitted, not from a résumé parser. The same scorer is used for a job’s applicant pool and for talent search. It is built for every profession, and for jobs that open for a short window and receive thousands of applications.

Ranking version: `field-weighted-v5` (`features/search/lib/rank.ts`).

References are not part of that version. They are applied live, only when a recruiter turns on **Include references**. Stored pool scores do not include them.

---

## What a recruiter sees

On a job’s applicant list, and on talent search:

1. Type a sentence or use the chips. The box understands phrases, `OR`, `NOT` / `-term`, “5 years”, and “in Bangalore”.
2. **Include references** is off until the recruiter turns it on. Off, ranking ignores named references. On, their stories join the search text and can add up to 12 points.
3. Results are either **Best match** (score) or **Most recent** (when they applied, or when the Livefolio was updated).
4. Each card shows a score out of 100, up to four **Why this rank** lines, which required items they meet, and proof badges (live work, source, writing, certifications, awards).
5. Chips (skills, city, experience band, proof) count the *current* result set so a click narrows the pool.

Talent search is the same scorer without a frozen snapshot: it reads live portfolios, optionally against a selected job.

Years of experience are a **filter and a requirement**, not a ranking bonus. Someone with 12 years does not beat someone with 4 years if both meet “4+ years” and the rest of the profile is equal.

---

## The score in one picture

A candidate’s Livefolio score is a weighted mix of five parts. Each part is a number from 0 to 1. They are combined, then rounded to 0–100.

| Part | Weight | Question it answers |
|---|---|---|
| Skill match (`overlap`) | 0.45 | Do they have the skills this job needs? |
| Proof of work (`proven`) | 0.22 | Did they *show* that work, anywhere on the Livefolio? |
| Platform activity (`platform`) | 0.15 | Only when the job cares: GitHub, LeetCode, writing cadence. |
| Context fit (`fit`) | 0.10 | Have they actually done this *kind* of role, in this domain, with the education asked? |
| Recency (`freshness`) | 0.08 | How recently they applied. |

If the job has no platform signal (marketing, sales, HR, nursing, most design), the 0.15 is dropped and the other weights are renormalized. Those people can still score 100. An engineer who should have GitHub/LeetCode keeps the 0.15, so missing it hurts.

When the recruiter both has a job open **and** types a query, the Livefolio score is:

`0.7 × job score + 0.3 × query score`

The job sets the bar; the query nudges toward what they are looking at right now.

**Include references off:** that Livefolio score is the card score.

**Include references on:** the five weights do not change. References are not a sixth slice of 100. After the Livefolio score is computed, named references add 0–12 points, and the total is capped at 100. Someone with no references keeps the Livefolio score.

```
livefolio = the 0–100 mix above
added     = reference signal × 12          # only when the toggle is on
card      = min(100, round(livefolio + added))
```

A Livefolio score of 80 with no references stays 80. The same 80 with one manager whose story matches the search becomes 89. Two strong references can add the full 12, so 80 becomes 92. A 95 cannot go past 100.

---

## 6. References (only when the toggle is on)

Code: `features/search/lib/references.ts`.

Completed named references only: a story, a relationship, and a named referee. Pending requests do not count.

### What is searched

The search box and the skill chip also read the reference story (and the relationship label, such as “Manager”). A word that appears only in a story can still match.

These still come only from the Livefolio, not from a story:

- location
- role
- education
- years of experience
- proof chips (live work, source, writing, certifications, awards)

### How the 12 points are divided

Each reference has a relationship weight. If the recruiter typed a query, that query’s words are what a story must mention. If they did not, and a job is selected, the job’s must-haves and nice-to-haves are used instead. A story that does not mention those terms keeps 40% of its relationship weight.

| Relationship | Weight when the story matches | Weight when it does not |
|---|---|---|
| Founder, manager | 1.00 | 0.40 |
| Collaborator | 0.80 | 0.32 |
| Peer | 0.75 | 0.30 |
| Direct report | 0.60 | 0.24 |
| Other | 0.30 | 0.12 |

**Other** stays low on purpose. People often send that option to a friend. It also fills presence more slowly: a working relationship counts as 1 toward presence, and Other counts as 0.35.

Presence is how many references they have, capped once two working relationships are in:

`presence = min(1, (working references + 0.35 × Other references) / 2)`

The reference signal uses the best relationship and that presence:

`signal = min(1, presence × 0.45 + best weight × 0.55)`

`added points = round(signal × 12)`

One reference only half-fills presence, so a single manager cannot take all 12 points. A second working relationship fills the rest.

| What they have | Points added |
|---|---|
| One founder or manager, story matches | 9 |
| One collaborator or peer, story matches | 8 |
| One direct report, story matches | 7 |
| One founder or manager, story does not match | 5 |
| One Other, story matches | 3 |
| One Other, story does not match | 2 |
| Two working relationships, best one matches | 12 |
| Manager plus Other, manager’s story matches | 10 |
| Two Other, stories match | 4 |
| No completed references | 0 |

The card’s first “Why this rank” line says when a reference moved someone up. It does not list people who have none.

---

## Inputs

### The Livefolio snapshot

On apply, Livefolio stores an immutable copy of the candidate’s portfolio (`application_snapshots.data`). Ranking never reads the live editor after that. The snapshot includes:

- profile (title, headline, summary, location)
- work experience (role, company, description, dates)
- education
- skills
- projects (live URL, source URL, tech stack)
- articles
- certifications
- achievements / awards
- social profiles (GitHub, Behance, LeetCode, … plus cached stats when present)
- custom sections (any JSON the candidate added)

Matching walks **every** section, including custom ones. A skill that only appears in a “Campaigns” section still counts.

References are not in the snapshot. They can be written after someone applies, so the toggle reads them live.

### The job search profile

When a recruiter first opens the pool (or the JD changes), Livefolio extracts a structured profile from the job description (`features/jobs/lib/extract-search-profile.ts`):

- `mustHaves` / `niceToHaves`
- `domains`, `responsibilities`, `digest`
- `education`, `minYears`, `location`
- `roleFamily` and `gates` (whether GitHub / LeetCode / Medium / live URLs apply)

The AI is the main path. Regex role-family hints are only a fallback if extraction fails. Those gates decide whether platform activity is in the score, not whether a nurse can rank well.

Structured job **requirements** (required / preferred rows) are separate: they drive the “3/4 required” badge and the pool coverage bars, via evidence matching in `features/applications/lib/evidence.ts`.

---

## 1. Skill match (0.45)

Code: `overlapScore` in `rank.ts`, field weights in `rank-fields.ts`.

### Where a term is found

The same skill is not worth the same everywhere:

| Found in | Weight | Example |
|---|---|---|
| Skills list, or a certification name | 1.00 | Skills: “HubSpot” |
| Projects, articles, custom sections | 0.85 | A campaign write-up titled HubSpot |
| Work experience text | 0.70 | “Owned HubSpot for demand gen” |
| Name / headline | 0.55 | Headline: “HubSpot specialist” |
| Anywhere else (summary, education, cover note) | 0.25 | A passing mention |

First match wins, from strongest field down. Listing a skill beats a passing mention in a bio.

### Combining must-haves and nice-to-haves

For each list we average the field weights of its terms (`matchedTerms`). Hits are the terms with weight > 0.

- Job (AND): need the whole must-have list. Core = `mustScore × 0.7 + niceScore × 0.2`. If the job has no nice-to-haves, core = `mustScore × 0.9` so a complete must-have match is not capped at 70.
- Recruiter `OR` query: the job-like profile puts terms in nice-to-haves and uses the **strongest** term (`nice.best`) instead of the average.

Then small extras, capped so the part stays ≤ 1:

- +0.10 if any job domain hits
- +0.10 if any responsibility hits
- +0.05 if the asked education hits
- +0.10 × (digest keyword hits / 8)

Related skills count (`skill-families.ts`). “SEO” matches “search engine optimization”; “js” does not match “java” (word-boundary matching in `match.ts`).

---

## 2. Proof of work (0.22)

Code: `provenScore` in `rank-signals.ts`.

Proof is not “did they fill every section?” It is “did they show the job’s skills as real work?” Every section can contribute. Links are stronger than a written job history; a written job history is no longer zero.

| Evidence | Weight |
|---|---|
| Live project or custom-section item with a URL | 1.00 |
| Project with source URL only | 0.90 |
| Published article with URL | 0.85 |
| Behance / Dribbble profile | 0.80 |
| GitHub / GitLab / LeetCode / Codeforces / Stack Overflow profile | 0.75 |
| Work experience that mentions the job’s skills | 0.70 |
| Certification with URL | 0.70 |
| Project or custom item with no link | 0.55 |
| Article with no URL | 0.50 |
| Certification with no URL | 0.45 |
| Award | 0.40 |

Experience, projects, articles, certs, awards, and custom items must mention a must-have or nice-to-have (unless the job listed none). Social profiles always count: a GitHub profile is proof of code even if the username is not “Node.js”.

The best three items are combined with decaying extras `[1.0, 0.4, 0.2]`:

`proof = min(1, w1 + 0.4×w2 + 0.2×w3 + liveBonus)`

`liveBonus` is +0.08 when the job prefers live URLs and at least one item is live. One strong piece is most of this part; a second and third only fill the rest.

The **proof chips** (`proof.ts`) are a coarser filter: live / source / writing / certified / awards. They do not have to match the job’s skills; they only say the Livefolio contains that kind of artifact.

---

## 3. Platform activity (0.15, sometimes 0)

Code: `platformScore`, `hasPlatformSignal`.

Used only when the job’s gates say so:

- **GitHub:** contributions in the last 90 days, scaled so 60 ≈ full credit.
- **LeetCode:** 50% hard/40, 30% medium/100, 20% rank (better than 200k).
- **Medium / writing roles:** article count and how many were published in the last year.

If more than one gate applies, those sub-scores are averaged. If none of the gates apply, this whole 15% is removed and the remaining parts are scaled up.

These stats are whatever was stored on the social profile (`cachedStats`). They are **not independently verified** unless the candidate connected the account through a trusted import. Treat them as a signal, not a background check.

Dev.to, Hashnode, and Medium posts are articles, so they are in skill match, proof, and writing cadence. Stack Overflow answers are articles too. Stack Overflow reputation and Codeforces rating sit in `cachedStats` and are not read by this score. Connecting those profiles still counts as source proof.

---

## 4. Context fit (0.10)

Code: `fitScore`.

This replaced seniority. Extra years do not raise the score.

It averages the pieces the job actually specified:

**Role.** Headline + job titles vs the JD digest and responsibilities (filler words like “strong”, “experience”, “team” are ignored). Hits score at least 0.55; no hits score 0.35. If there is no digest/responsibilities but they have experience, the role piece is a neutral 0.5.

**Domain.** If the job lists domains (fintech, healthcare, B2B SaaS): 1.0 on a hit, 0.35 otherwise.

**Education.** If the job asks for education (CA, B.Des, BSc Nursing): 1.0 on a hit in education or certification names, 0.2 if missing. If the JD is silent, education is ignored.

If none of those apply, fit is 0.5 so we do not invent a penalty.

---

## 5. Recency (0.08)

Code: `freshnessScore`.

| Applied | Score |
|---|---|
| ≤ 7 days | 1.00 |
| ≤ 30 days | 0.75 |
| ≤ 90 days | 0.45 |
| ≤ 1 year | 0.25 |
| older | 0.10 |
| unknown | 0.35 |

**Stored pool scores omit freshness.** It would drift every day and force constant re-indexing. “Most recent” sort covers recency for the pool. Freshness is used when ranking live in memory (talent search, or a pool text search that re-ranks).

---

## Combining into 0–100

```
total    = 0.45 + 0.22 + (0.15 if a platform gate applies, else 0) + 0.10 + 0.08
weighted = overlap×0.45 + proven×0.22 + platform×platformWeight + fit×0.10 + freshness×0.08
livefolio = round((weighted / total) × 100)
```

With the toggle on:

```
card = min(100, livefolio + round(referenceSignal × 12))
```

With the toggle off, `card = livefolio`.

| Code | Role |
|---|---|
| `features/search/lib/rank.ts` | Mixes the five parts, then adds references when they were passed in |
| `features/search/lib/references.ts` | Reference text, relationship weights, and the 12-point add |
| `features/search/lib/rank-fields.ts` | Where a skill was found |
| `features/search/lib/rank-signals.ts` | Proof, platform, fit, freshness |
| `features/search/lib/match.ts` | Word-boundary matching |
| `features/search/lib/proof.ts` | Proof chips |
