# Livefolio market analysis

_Last updated: September 2026. Figures marked "assumption" should be validated in customer conversations._

**Bottom line:** the market is real and growing, and the timing is good. Two things need attention before the numbers work:

1. **Company pricing is about 10x too low for the value delivered.** Org Pro costs $29/month ($290/year), while the average non-executive hire costs a company $5,475.
2. **Candidate subscriptions alone won't sustain the business.** Portfolio-only products with this model have shut down recently. Companies have to be where most of the revenue comes from.

---

## 1. Why now: the problem is measurable and getting worse

- **Application volume exploded.** Across 128M applications in public applicant-tracking data, the median number of applications per role went from 5 (roles opened in 2022) to 45 (2026), a 9x rise ([Metaview](https://www.metaview.ai/resources/blog/application-volume-recruiting-agentic-ai)). Applications per hire tripled from 2021 to 2024, and software roles now average 369 per hire ([HRBench/Ashby](https://www.hrbench.com/resource/learn/application-count)).
- **AI broke the resume.** LinkedIn processes about 11,000 applications per minute, up 45% in a year, and recruiters say it's "increasingly hard to tell who is genuinely qualified" ([Semafor](https://www.semafor.com/article/06/24/2025/recruiters-swamped-with-ai-generated-job-applications)). 74% of hiring managers have seen AI-generated content in applications ([JobScore](https://www.jobscore.com/articles/applicants-per-job/)). Gartner projects that by 2028, 1 in 4 candidate profiles could be fake.
- **India has the problem at its most extreme.** There are 39.6 lakh active engineering candidates for 6.68 lakh jobs, 5.9 per opening. For 0–3 years of experience it's 9.5 per opening ([People Matters/foundit](https://www.peoplematters.in/news/business/india-has-396-lakh-engineers-chasing-67-lakh-jobs-report-reveals-52108)).
- **Screening is expensive.** SHRM's 2025 cost per hire is $5,475 for non-executive roles, and that excludes interviewer time. Engineering hires run $6,200–8,000. A senior engineering hire can take 24 interviews, or about 36 engineer-hours ([SHRM](https://www.shrm.org/about/press-room/shrm-releases-2025-benchmarking-reports--how-does-your-organizat), [Pin](https://www.pin.com/blog/cost-per-hire-benchmarks/), [Dobr.AI](https://blog.dobr.ai/2025/06/01/the-roi-of-ai-technical-interviewers-cost-analysis-and-business-impact-2/)).

**Investor framing:** resumes stopped carrying signal once AI made them free to write. Proof of work is the replacement signal, and it already exists on GitHub and elsewhere.

---

## 2. Market size

### Top-down (the categories Livefolio sits between)

| Category | 2025 size | Growth per year |
|---|---|---|
| Applicant tracking systems (narrow definition) | $3.0–3.3B | 7–8% |
| Pre-employment assessment and screening | $3.1–6.4B | 9–13% |
| LinkedIn Talent Solutions (a single incumbent) | ~$8–9B (analyst estimate) | ~9% (all of LinkedIn) |
| Naukri recruitment (India incumbent) | ₹1,983 cr (~$230M) | 10% |

Analyst reports on these markets disagree by up to 6.9x, depending on what they count ([Pin](https://www.pin.com/blog/ats-market-share-report/)). Use the conservative figures, since investors discount inflated ones.

Sources: [MarketsandMarkets ATS](https://www.marketsandmarkets.com/Market-Reports/applicant-tracking-system-market-27004100.html), [Polaris ATS](https://www.polarismarketresearch.com/industry-analysis/applicant-tracking-system-market/request-for-discount-pricing), [Market Research Future assessments](https://www.marketresearchfuture.com/reports/pre-employment-testing-software-market-38305), [PW Consulting pre-hire assessment](https://pmarketresearch.com/worldwide-pre-hire-assessment-service-market-research/), [Microsoft FY25 10-K](https://www.sec.gov/Archives/edgar/data/789019/000095017025100235/R45.htm), [Info Edge Q4 FY25 call](https://www.infoedge.in/pdfs/financial_pdfs/f_Earnings/investor-concall-transcript-03Jun2025.pdf).

**Top-down TAM: about $6–10B.** That's the spend on screening, assessment and tracking applicants. Livefolio replaces or improves the part that screens and verifies.

### Bottom-up (more credible, and investors prefer it)

- **Candidate supply:** 48.4M professional developers worldwide ([SlashData](https://www.slashdata.co/research/developer-population)), 180M GitHub accounts, and 21.9M GitHub users in India, adding 5.2M a year ([Octoverse](https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/)).
- **Hiring events (assumption):** about 15% of developers change jobs each year, so roughly 7M tech hires a year worldwide.
- **Value Livefolio can capture per hire (assumption):** $150–300. For comparison, AI technical-interview tools charge $100–300 per interview.

| Layer | Calculation | Size |
|---|---|---|
| **TAM** (global tech hiring, verification layer) | ~7M hires × ~$200 | **~$1.4B/year** |
| **TAM, all "proof-of-work" roles** (adding design, writing, content once those integrations exist) | ~2–3x engineering | **~$3–4B/year** |
| **SAM** (India tech-hiring companies, beachhead) | ~40,000 companies (assumption, see below) × $2,500/year | **~$100M/year** |
| **SOM** (3-year target) | 1,500 paying companies × $2,500 + candidate Pro revenue | **~$4–5M ARR** |

The 40,000 figure is an assumption: a subset of India's 2.4 lakh DPIIT-recognized startups ([Lok Sabha, June 2026](https://sansad.in/getFile/lsapps/loksabhaquestions/annex/188/AU1446_N4i3CT.pdf)) plus IT and services firms that actively hire engineers. Validate it in customer conversations.

**Why pricing decides whether this works:** at today's Org Pro price (₹24,999/year), the same India SAM is only about $11M. Pricing has a bigger effect on the business than market size does.

---

## 3. Competitive landscape

| Player | What they do | Where Livefolio wins |
|---|---|---|
| **LinkedIn** (1.3B members) | Self-reported profiles, keyword search | They can't verify claims, and verifying would undercut profiles they sell to recruiters. |
| **Naukri** (128,000 corporate customers) | India job board with keyword search | Same problem, with even noisier volume. |
| **Applicant tracking systems** (Greenhouse, Lever, Ashby, Zoho Recruit) | Workflow: stages, scheduling | They organize applicants; they don't judge quality. Integrate with them rather than compete. |
| **Assessments** (HackerRank ~$221M revenue, HackerEarth, Codility, TestGorilla) | Tests candidates take | Tests add friction candidates hate and are now easy to cheat with AI. Livefolio needs no extra effort from the candidate: it reads work they've already done. |
| **AI interviewers** (HireVue, Metaview; Mercor at a $10B valuation) | Automated interviews | Expensive per candidate and used late in the funnel. Livefolio works at the top of the funnel, before any interview. |
| **Portfolio builders** (Read.cv shut down May 2025, Polywork shut down) | Pretty profiles | **The key lesson:** a portfolio alone isn't a business. Those products had no buyer on the company side. |

Sources: [TechCrunch on Read.cv](https://techcrunch.com/2025/01/17/perplexity-acquires-read-cv-a-social-media-platform-for-professionals/), [Sacra on Mercor](https://sacra.com/c/mercor/).

**Positioning:** assessments test candidates, and Livefolio verifies them. It's the only option that proves skill without making the candidate do extra work.

**Biggest competitive threat:** LinkedIn or GitHub adding verification. The defenses are:

- **Cross-platform evidence.** GitHub won't verify Medium, LeetCode or Dribbble.
- **Anti-gaming depth.** Detecting borrowed code, scripted activity and fake live projects is Livefolio's core product; for them it would be a side feature.
- **Hiring-outcome data.** Every hire on Livefolio teaches the ranking what actually predicts success.

---

## 4. Go-to-market plan

### Beachhead customer (who to sell to first)

**Indian startups from Seed to Series B (10–200 employees) hiring software engineers, with no dedicated recruiter.**

- The founder or engineering manager screens applicants personally, so they feel the pain directly.
- They get 300+ applications per role from Naukri and LinkedIn, most of them noise.
- They can't justify an $8k/year LinkedIn Recruiter seat or a HackerRank contract.
- They decide in days, not quarters, and they're reachable through founder networks, LinkedIn and startup communities.

### Candidate side: supply is the wedge

1. **Final-year CS students and developers with 0–3 years of experience.** About 2.6 lakh computer-engineering graduates a year ([AISHE](https://newsdive.net/2026/07/10/computer-engineering-surges-to-the-forefront-as-india-s-most-favored-discipline-according-to-aishe-findings/)), and this group is the most oversupplied at 9.5 candidates per job. They need a way to stand out and have real GitHub work to show.
2. **Channels:**
   - College placement cells and coding clubs
   - Hackathons (partner as the "submit your project" layer)
   - A "Verified by Livefolio" badge in GitHub READMEs
   - Developer communities on Discord, Reddit and X
3. **Hook:** "Your portfolio in 2 minutes from your GitHub, plus a verified badge recruiters trust."

### Company side: product-led, then sales-assisted

1. **Months 0–6: founder-led sales for the first 30–50 customers.** Use customer discovery outreach. Offer design partners free Org Pro in exchange for weekly feedback and permission to measure time saved. The goal is a real before-and-after number for the deck.
2. **Months 6–18: product-led growth.**
   - Free workspace, then post a job, then see applicants ranked, then upgrade.
   - Add an **instant shortlist**: as soon as a job is posted, show matching candidates already on Livefolio who are open to work. This is the moment that sells the product.
   - Add an **"Apply with Livefolio"** link candidates can attach to any application, on Naukri, LinkedIn or email. Recruiters at non-customer companies then see verified profiles, which brings in inbound leads at no cost.
3. **Months 18–36: expand.**
   - Integrations with Greenhouse, Lever, Ashby and Zoho Recruit, so companies can use Livefolio without switching tools.
   - Design integrations (Dribbble, Behance, Figma) to reach non-engineering roles.
   - A verification API for recruiting agencies and staffing firms.

### Pricing: the most important GTM change

Current Org Pro is $29/month ($290/year). For comparison:

- LinkedIn Recruiter Lite: about $170/month per seat
- AI technical interviews: $100–300 per interview
- SHRM cost per hire: $5,475

Price on value delivered, not on costs. Options to test with design partners:

| Model | Example price | Best for |
|---|---|---|
| Per active job | $79–149 per job per month (ranking plus verification) | Startups that hire occasionally (easy to justify) |
| Platform subscription | $199–499/month, includes talent search | Companies that hire continuously |
| Per hire | $300–800 per hire through Livefolio | Aligns price with outcomes; hardest to track |

**Candidate side:** keep a generous free tier, since candidates are the supply. Pro at $7/month is fine, but job seekers stop paying once they're hired, so expect high churn. Treat candidate revenue as a bonus, not the core.

---

## 5. Unit economics to prove (targets, not claims)

| Metric | Target by Series A |
|---|---|
| Company CAC (founder-led, then product-led) | < $500 |
| Annual contract value | $2,000–5,000 |
| Payback period | < 6 months |
| Net revenue retention (companies) | > 110%, via more jobs and seats |
| Verified profiles, meaning at least one integration connected (candidates) | 50,000+ |
| Minutes to shortlist (versus before Livefolio) | 70%+ reduction; this becomes the pitch number |

---

## 6. Risks investors will raise, and the answers

1. **"Portfolio platforms failed."** Read.cv and Polywork had no company-side buyer. Livefolio makes its money from companies; the portfolio is how candidates arrive.
2. **"You depend on GitHub's API."**
   - The analysis uses public data within documented rate limits.
   - Every new integration (Medium, LeetCode, design platforms) reduces dependence on any single platform.
   - Anti-gaming analysis is Livefolio's own work, not GitHub's.
3. **"Only for developers."** True today. Say it plainly and show the roadmap into design, writing and content. Engineering hiring alone is a market of about $1.4B.
4. **Regulation.** The EU AI Act classifies AI used in hiring as high-risk, and India's DPDP Act governs personal data. The ranking explains every score, candidates opt in, and there are no black-box scores. Present that as a compliance advantage, and start documenting fairness checks now.
5. **Two-sided cold start.** Lead with candidates, because a free portfolio has value on its own. Then create demand on the company side with instant shortlists from the existing pool.

---

## 7. Next 90 days

1. **Talk to 30 hiring founders and managers** to validate the pain and their willingness to pay $100+/month.
2. **Sign 10 design partners** and measure time-to-shortlist before and after.
3. **Test new pricing** with those partners before changing public pricing.
4. **Run one campus pilot** (2–3 colleges) to test how cheaply candidates can be acquired.
5. **Build the instant shortlist.** It's the feature that turns a free workspace into a paid one.
