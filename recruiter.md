# LIVEFOLIO — HIRING PRODUCT MASTER PROMPT

You are working on the existing Livefolio product.

Before writing code, inspect the entire existing codebase and understand the current architecture, authentication, database, user/profile model, integrations, UI system, routing, and existing Livefolio functionality.

Do NOT rebuild the existing product from scratch.

We are evolving Livefolio into a B2B hiring platform while keeping the existing individual professional profile experience.

---

# 1. PRODUCT VISION

Livefolio is NOT a traditional resume builder.

Livefolio is NOT a traditional ATS.

Livefolio is NOT a developer hiring platform.

Livefolio is a professional identity platform that connects the places where a person's professional work already exists and turns that information into a living professional profile.

The hiring product is built on top of that identity.

Core idea:

> Candidates connect their professional world once and apply to jobs with their Livefolio.

> Companies receive Livefolio applications and can search, filter, understand, and shortlist candidates based on their professional experience and evidence.

The product must work for ALL professions.

Examples:

- Software engineers
- Designers
- Product managers
- Marketers
- Sales professionals
- HR professionals
- Consultants
- Writers
- Photographers
- Finance professionals
- Teachers
- Architects
- Lawyers
- Researchers
- Creators
- Entrepreneurs
- Operations professionals
- Any other profession

Never make the product developer-centric.

GitHub, LeetCode, etc. are only examples of integrations.

---



# 2. CORE PRODUCT LOOP

The main workflow must be:

Company
→ Creates Job
→ Publishes Job
→ Candidate discovers Job
→ Candidate clicks "Apply with Livefolio"
→ Candidate reviews what will be shared
→ Candidate submits Livefolio application
→ Company receives application
→ Applicant enters job-specific applicant pool
→ Recruiter searches ONLY within applicants for that job
→ Recruiter evaluates candidate
→ Recruiter shortlists
→ Interview
→ Offer
→ Hire

This workflow is the heart of the product.

---



# 3. IMPORTANT PRODUCT PRINCIPLE

Do NOT allow recruiters to search the entire Livefolio user base by default.

Recruiters should primarily search and filter the applicants for a specific job.

For example:

Job:
Senior Marketing Manager

Applicants:
428

Recruiter searches:

"Show candidates with B2B SaaS experience and 5+ years of experience."

The search must operate over those 428 applicants.

Later, if we introduce a talent discovery marketplace, it can be separate functionality.

Do NOT build the marketplace now.

---



# 4. INDIVIDUAL LIVEFOLIO

Keep the existing individual Livefolio functionality.

A person should have one persistent professional identity.

The profile can contain:

- Name
- Profile photo
- Headline
- About
- Location
- Work experience
- Education
- Skills
- Projects
- Achievements
- Certifications
- Publications
- Awards
- Testimonials
- Links
- Professional work
- Connected integrations
- Evidence

The profile must be profession-agnostic.

Do not assume everyone has:

- GitHub
- LeetCode
- Code repositories
- Technical projects

Instead use generic concepts:

- Work
- Experience
- Projects
- Evidence
- Skills
- Achievements
- Publications
- Certifications
- Contributions

---



# 5. INTEGRATION-FIRST EXPERIENCE

Integrations are a core differentiator of Livefolio.

Do not treat integrations as simple social login or profile imports.

Livefolio connects the platforms where a person's actual professional work exists.

Examples:

- LinkedIn
- GitHub
- Medium
- Behance
- Dribbble
- YouTube
- Notion
- Google Drive
- Portfolio platforms
- Certification platforms
- Other professional platforms

The integration system must be extensible.

Do not hardcode the architecture around GitHub.

Each integration should define what information it contributes.

For example:

Behance:

- Projects
- Published work
- Skills
- Creative evidence

Medium:

- Publications
- Topics
- Articles
- Writing evidence

GitHub:

- Projects
- Contributions
- Repositories
- Technical evidence

LinkedIn:

- Experience
- Education
- Skills
- Professional history

The UI should communicate:

"Connect the places where your work lives."

---



# 6. PROFESSIONAL EVIDENCE

Introduce a first-class concept called "Evidence."

The purpose is to move beyond claims.

Instead of:

Skill:
"Marketing"

Show:

Marketing

Evidence:

- 12 campaigns
- 4 years experience
- 8 published articles
- 3 case studies
- 5 major projects

For design:

Design

Evidence:

- 24 projects
- 8 published case studies
- 3 awards

For sales:

Enterprise Sales

Evidence:

- Enterprise accounts
- Client projects
- Industry experience
- Achievements

For engineering:

Software Engineering

Evidence:

- Projects
- Open-source contributions
- Publications
- Technical work

The underlying data model must be generic.

A Skill can have many Evidence items.

Evidence can originate from:

- Manual entries
- Work experience
- Projects
- Integrations
- Publications
- Certifications
- Achievements
- Other sources

Every evidence item should maintain its source when possible.

Example:

Evidence:
"Published 12 articles about growth"

Source:
Medium integration

---



# 7. JOB CREATION

Companies must be able to create jobs.

Job fields:

- Job title
- Description
- Department
- Employment type
- Location
- Remote/hybrid/on-site
- Experience range
- Salary range (optional)
- Required skills
- Preferred skills
- Required experience
- Preferred experience
- Responsibilities
- Qualifications
- Application deadline
- Status

Job statuses:

- Draft
- Published
- Paused
- Closed

A company should be able to preview the job before publishing.

---



# 8. JOB REQUIREMENTS

Jobs should have structured requirements.

For example:

Senior Marketing Manager

Required:

B2B Marketing
Demand Generation
5+ years experience

Preferred:

SaaS
Team Leadership
Content Strategy

The system should store requirements separately from the job description.

This allows candidate matching later.

Do not rely only on keyword search.

---



# 9. PUBLIC JOB PAGE

Every published job should have a public page.

Example:

/jobs/[job-slug]

The page should contain:

- Company
- Company logo
- Job title
- Location
- Employment type
- Description
- Responsibilities
- Requirements
- Benefits
- About company
- Application CTA

Primary CTA:

# Apply with Livefolio

The job page should be shareable.

Companies should be able to share it on:

- LinkedIn
- X
- Email
- Their website
- Job boards
- Social media

Do not require Livefolio to own the candidate acquisition channel.

Companies can distribute the job anywhere.

---



# 10. APPLY WITH LIVEFOLIO

This is one of the most important features.

When a candidate clicks:

"Apply with Livefolio"

they should be asked to:

- Log in
OR
- Create a Livefolio

If they already have a Livefolio, use their existing profile.

If they don't, provide a lightweight onboarding flow.

Do NOT require them to manually build a beautiful portfolio before applying.

Allow them to:

- Import resume
- Connect LinkedIn
- Connect other integrations
- Fill basic information

Then Livefolio creates the profile.

The candidate reviews it before submitting.

---



# 11. APPLICATION REVIEW SCREEN

Before submitting an application, show:

"Review your application"

Display:

- Profile photo
- Name
- Headline
- Relevant experience
- Skills
- Projects
- Evidence
- Education
- Certifications
- Selected professional work

Also clearly show:

"What will be shared with this company?"

Allow candidates to control visibility where appropriate.

CTA:

Submit Application

---



# 12. JOB-SPECIFIC APPLICATION PROFILE

This is a critical feature.

A candidate has ONE Livefolio.

But each application should have a job-specific view/snapshot.

Example:

Sarah's Livefolio contains:

Marketing
Product
Research
Writing
Leadership

She applies for:

Senior Marketing Manager

The application should emphasize:

Marketing experience
Relevant projects
Relevant skills
Relevant evidence
Relevant achievements

Do not create a completely separate profile.

Instead create a job-specific application representation derived from the candidate's Livefolio.

Think:

One professional identity
→ Multiple job-specific applications

---



# 13. APPLICATION SNAPSHOT

When the candidate submits an application, create an immutable application snapshot.

The recruiter should see what the candidate submitted at the time of application.

If the candidate later changes their Livefolio, the old application must not silently change.

Store:

- Profile information
- Relevant experience
- Skills
- Evidence
- Projects
- Education
- Certifications
- Selected integrations/work
- Submission timestamp

The candidate may update their Livefolio later.

The application snapshot remains intact.

---



# 14. CANDIDATE APPLICATIONS

Candidates need an "Applications" section.

Example:

My Applications

Senior Marketing Manager
Acme
Applied Aug 10

Product Manager
Company B
Applied Aug 8

Growth Manager
Company C
Applied Aug 5

Each application can show status where the employer chooses to expose it.

Possible statuses:

- Applied
- Under Review
- Shortlisted
- Interview
- Offer
- Hired
- Rejected

Candidates should be able to open an application and see:

- Job
- Company
- Submitted profile
- Application status
- Timeline

---



# 15. COMPANY WORKSPACE

Companies need a dedicated hiring workspace.

Example:

Acme Inc.

Navigation:

Overview
Jobs
Applicants
Teams
Settings

Initially focus on Jobs and Applicants.

Do not build the broader employee/company talent product yet.

That is a future product.

---



# 16. COMPANY JOBS DASHBOARD

Show:

Active jobs
Draft jobs
Closed jobs

Example:

Senior Marketing Manager
428 applicants
Published

Product Designer
182 applicants
Published

Sales Manager
74 applicants
Published

Each job should link directly to its applicant pool.

---



# 17. APPLICANT PIPELINE

Every job gets its own hiring pipeline.

Default stages:

New
Reviewing
Shortlisted
Interview
Offer
Hired
Rejected

Recruiters should be able to move applicants between stages.

A candidate belongs to a specific job application.

Do not create a complicated ATS.

Keep this lightweight.

---



# 18. APPLICANT POOL

For each job:

Senior Marketing Manager

428 Applicants

Tabs:

All
New
Reviewing
Shortlisted
Interview
Offer
Rejected

Candidate cards should show:

- Name
- Photo
- Headline
- Relevant experience
- Relevant skills
- Evidence highlights
- Location
- Years of experience
- Application date
- Match/fit summary

---



# 19. APPLICANT SEARCH

This is a major feature.

Recruiters should be able to search ONLY inside the applicants for the current job.

Examples:

"Candidates with B2B SaaS experience"

"Candidates with 5+ years of experience"

"Candidates who have managed a team"

"Candidates with healthcare experience"

"Candidates in Bangalore"

"Candidates with strong evidence of content strategy"

The search should work across:

- Experience
- Skills
- Evidence
- Projects
- Education
- Certifications
- Publications
- Location
- Job-specific requirements

Design the search so it can eventually support natural language queries.

---



# 20. FILTERS

Add structured filters:

- Experience
- Location
- Skills
- Education
- Certifications
- Industry
- Current/previous role
- Application stage
- Application date

Filters must be profession-agnostic.

Do not create only technical filters.

---



# 21. JOB-SPECIFIC MATCHING

Livefolio should eventually analyze candidates against the job requirements.

For each applicant, provide:

Strong matches
Potential gaps
Relevant evidence

Example:

Candidate:

Sarah Johnson

Why this candidate matches:

Strong B2B SaaS experience
7 years marketing experience
Team leadership experience
8 relevant projects

Potential gaps:

Limited enterprise experience

Do not make a black-box score the primary UI.

A percentage score can be optional later.

Recruiters should understand WHY a candidate matches.

---



# 22. CANDIDATE DETAIL VIEW

Clicking an applicant opens their application.

Structure:

Candidate header

Why this candidate matches

Experience

Skills

Evidence

Relevant projects

Achievements

Education

Certifications

Publications

Connected work

Application information

Recruiter actions:

Shortlist
Move stage
Reject
Add note
Schedule interview
Contact candidate

The recruiter should not need to leave Livefolio to understand the candidate.

---



# 23. RECRUITER NOTES

Allow recruiters to add private notes.

Example:

"Strong leadership experience."

"Need to verify enterprise experience."

Notes must be private to the company/recruiting team.

Candidates must never see internal recruiter notes.

---



# 24. SHORTLISTING

Allow recruiters to:

- Shortlist candidates
- Remove from shortlist
- Compare shortlisted candidates

A comparison view should eventually allow recruiters to compare:

Experience
Skills
Evidence
Projects
Education
Achievements

Keep the comparison simple and readable.

---



# 25. COMPANY TEAM / RECRUITER PERMISSIONS

Create basic company roles:

Owner
Admin
Recruiter
Hiring Manager

Permissions:

Owner:
Everything

Admin:
Manage company and jobs

Recruiter:
Manage jobs and applicants

Hiring Manager:
View assigned jobs and applicants

Keep permissions simple initially.

---



# 26. COMPANY BRANDING

Company job pages should support:

- Logo
- Brand color
- Company name
- Company description

The job application experience should feel like the company's hiring experience while still being powered by Livefolio.

---



# 27. PUBLIC PROFILE VS APPLICATION PROFILE

A candidate's public Livefolio profile and application profile are different concepts.

Public profile:

Owned by candidate
Can be shared publicly
Continuously updated

Application:

Submitted to a specific company for a specific job
Contains a snapshot
Controlled by application permissions
Should not silently update

Model this distinction properly in the database.

---



# 28. DATA MODEL

Design a scalable generic schema.

Core entities should include concepts such as:

User
Profile
Experience
Skill
Project
Evidence
Achievement
Certification
Publication
Integration
IntegrationConnection
IntegrationData
Organization
OrganizationMember
Job
JobRequirement
Application
ApplicationSnapshot
ApplicationStage
RecruiterNote

Avoid developer-specific schemas.

Do not create entities such as:

GitHubDeveloper
LeetCodeCandidate
DeveloperProfile

GitHub should be an Integration.

Behance should be an Integration.

Medium should be an Integration.

The professional identity should remain generic.

---



# 29. INTEGRATION ARCHITECTURE

Create a reusable integration abstraction.

Every integration should be able to:

- Connect
- Authenticate
- Fetch data
- Normalize data
- Map data into Livefolio entities
- Refresh data
- Disconnect

Use normalized internal entities.

Example:

GitHub repository
→ Project

Medium article
→ Publication

Behance project
→ Project

LinkedIn experience
→ Experience

Certification platform
→ Certification

The source should be retained.

Example:

Project
source = Behance
sourceId = XYZ

This allows future refreshes and provenance.

---



# 30. SECURITY AND PRIVACY

This is a hiring product, so privacy matters.

Candidates should control what professional information is visible.

Companies should only see information shared through applications.

Recruiters should only access applications for jobs they have permission to access.

Internal notes must be private.

Do not expose private integration data.

OAuth tokens/secrets must be securely stored.

Do not expose access tokens to the frontend.

---



# 31. DESIGN DIRECTION

Livefolio should feel:

Premium
Minimal
Modern
Human
Trustworthy
Professional

Avoid making it look like:

- Traditional HR software
- Enterprise ATS
- Jira
- Salesforce
- Developer tooling

The candidate experience should feel like a beautiful professional identity product.

The recruiter experience should feel like a modern hiring workspace.

Use the existing Livefolio design system wherever possible.

Do not redesign unrelated parts of the application.

---



# 32. LANDING PAGE / POSITIONING

The hiring landing page should communicate:

# Hire beyond the resume.

Subheading:

"Candidates connect the places where their professional work lives and apply with a living professional profile. Recruiters get a searchable applicant pool enriched with real experience, work, and evidence."

Candidate CTA:

Create your Livefolio

Recruiter/company CTA:

Create a hiring workspace

Additional messaging:

"Connect your professional world."

"One professional identity. Every place your work lives."

"Apply once. Let your work speak for itself."

"See the experience behind the resume."

Do not position Livefolio as a developer product.

---



# 33. MVP BOUNDARIES

Build in this order.

PHASE 1:

Existing Livefolio profile
+
Company account
+
Company workspace
+
Job creation
+
Public job page
+
Apply with Livefolio
+
Application submission
+
Application snapshot

PHASE 2:

Applicant pool
+
Pipeline
+
Candidate detail page
+
Recruiter notes
+
Shortlisting

PHASE 3:

Applicant search
+
Filters
+
Job requirements
+
Relevant evidence

PHASE 4:

Job-specific candidate matching
+
AI-assisted candidate summaries
+
Candidate comparison

PHASE 5:

More integrations
+
Advanced recruiter workflows
+
Analytics
+
Billing
+
Enterprise features

Do not attempt to build all phases at once.

---



# 34. WHAT NOT TO BUILD

Do NOT build:

- Public talent marketplace
- General employee management system
- Payroll
- HR management
- Full ATS replacement
- Interview recording system
- Complex assessment platform
- Job board marketplace
- Developer-only features
- Generic social network
- Recruiter access to all Livefolio users by default

These may be future opportunities but are outside the initial product.

---



# 35. CRITICAL PRODUCT DIFFERENTIATION

Never reduce the product to:

"Portfolio + job board."

The core differentiation is:

1. Professional work is scattered across many platforms.
2. Livefolio connects those platforms.
3. Livefolio turns that information into a living professional identity.
4. Candidates use that identity to apply.
5. Each application creates a job-specific snapshot.
6. Recruiters search and evaluate ONLY the applicants for that job.
7. Recruiters can understand the evidence behind a candidate's claimed skills and experience.

This is the core product.

---



# 36. IMPLEMENTATION INSTRUCTIONS

Before making major changes:

1. Inspect the current repository.
2. Identify the current database schema.
3. Identify authentication.
4. Identify current profile implementation.
5. Identify existing integrations.
6. Identify existing routes.
7. Identify reusable UI components.
8. Identify existing design tokens.
9. Identify current API/server architecture.

Then provide a concise implementation plan.

After the plan, implement Phase 1 only.

Do not implement Phases 2–5 until the Phase 1 architecture is stable.

Reuse existing code wherever possible.

Do not create duplicate profile systems.

Do not break existing Livefolio functionality.

When introducing database changes:

- Use migrations.
- Preserve existing data.
- Add appropriate indexes.
- Add foreign keys and constraints.
- Keep the schema normalized.
- Make the system extensible.

When introducing APIs:

- Validate all inputs.
- Authenticate every protected endpoint.
- Authorize organization membership.
- Prevent cross-company data access.
- Return appropriate errors.

When building UI:

- Reuse existing components.
- Keep responsive behavior.
- Maintain accessibility.
- Include loading states.
- Include empty states.
- Include error states.
- Include success states.

Start by inspecting the codebase and reporting:

1. Current architecture
2. Current profile model
3. Current integration architecture
4. Current authentication
5. Required schema changes
6. Required routes
7. Required components
8. Phase 1 implementation plan

Then implement Phase 1.