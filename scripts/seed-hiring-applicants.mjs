/**
 * One-off seed: sample applicants for hiring Phase 3 testing.
 * Usage: bun run scripts/seed-hiring-applicants.mjs
 */
import { config } from "dotenv";
import { randomUUID } from "crypto";
import { Pool } from "pg";

config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const JOB_ID = "c090f328-b77f-4ead-b6ef-8a2ee5a2b9d8"; // Senior Marketing manager
const TEST_JOB_ID = "e3867821-11b8-4ae1-9d37-43521c64f55e"; // test job

function yearsAgo(n) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return d.toISOString();
}

function monthsAgo(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString();
}

const candidates = [
  {
    name: "Sarah Johnson",
    email: "sarah.johnson.seed@livefolio.test",
    jobId: JOB_ID,
    stage: "new",
    shortlisted: false,
    coverNote: "Excited about B2B SaaS marketing leadership roles.",
    snapshot: {
      version: 1,
      capturedAt: new Date().toISOString(),
      profile: {
        title: "Sarah Johnson",
        headline: "B2B SaaS Marketing Leader · Demand Gen",
        summary:
          "7 years in B2B marketing across SaaS companies. Led demand generation, content strategy, and a team of 6.",
        avatarUrl: null,
        location: "Bangalore",
        contactEmail: "sarah.johnson.seed@livefolio.test",
        websiteUrl: null,
        slug: "sarah-johnson-seed",
      },
      experiences: [
        {
          company: "Acme SaaS",
          role: "Senior Marketing Manager",
          description:
            "Owned B2B marketing and demand generation for enterprise SaaS. Grew pipeline 3x.",
          startDate: yearsAgo(3),
          endDate: null,
          location: "Bangalore",
        },
        {
          company: "GrowthLabs",
          role: "Marketing Manager",
          description: "Content strategy and team leadership for B2B campaigns.",
          startDate: yearsAgo(7),
          endDate: yearsAgo(3),
          location: "Hyderabad",
        },
      ],
      educations: [
        {
          institution: "IIM Bangalore",
          degree: "MBA",
          field: "Marketing",
          description: null,
          startDate: yearsAgo(9),
          endDate: yearsAgo(7),
        },
      ],
      skills: [
        { name: "B2B Marketing", category: "marketing", level: 5 },
        { name: "Demand Generation", category: "marketing", level: 5 },
        { name: "Content Strategy", category: "marketing", level: 4 },
        { name: "Team Leadership", category: "leadership", level: 4 },
        { name: "SaaS", category: "industry", level: 5 },
      ],
      projects: [
        {
          title: "Enterprise Demand Gen Playbook",
          description: "Built a repeatable B2B SaaS demand generation system.",
          liveUrl: null,
          sourceUrl: null,
          techStack: ["HubSpot", "Salesforce"],
          featured: true,
        },
        {
          title: "Content Engine",
          description: "Published 40+ B2B articles and case studies.",
          liveUrl: null,
          sourceUrl: null,
          techStack: ["Content"],
          featured: false,
        },
      ],
      articles: [
        {
          title: "How we scaled B2B SaaS pipeline",
          description: "Lessons from demand generation at Acme.",
          url: "https://example.com/b2b-saas-pipeline",
          tags: ["B2B", "SaaS", "Demand Gen"],
          publishedAt: monthsAgo(4),
        },
      ],
      certifications: [
        {
          name: "HubSpot Inbound",
          issuer: "HubSpot",
          issueDate: yearsAgo(2),
          url: null,
        },
      ],
      achievements: [
        { title: "Grew qualified pipeline 3x in 18 months", date: yearsAgo(1) },
      ],
      socialProfiles: [
        { platform: "linkedin", url: "https://linkedin.com/in/sarah-seed", username: "sarah-seed" },
      ],
      customSections: [],
    },
  },
  {
    name: "Priya Mehta",
    email: "priya.mehta.seed@livefolio.test",
    jobId: JOB_ID,
    stage: "reviewing",
    shortlisted: true,
    coverNote: "Strong content and brand background; learning B2B demand gen.",
    snapshot: {
      version: 1,
      capturedAt: new Date().toISOString(),
      profile: {
        title: "Priya Mehta",
        headline: "Brand & Content Marketer",
        summary: "5 years in consumer brand marketing and content. Recently moved into B2B content.",
        avatarUrl: null,
        location: "Mumbai",
        contactEmail: "priya.mehta.seed@livefolio.test",
        websiteUrl: null,
        slug: "priya-mehta-seed",
      },
      experiences: [
        {
          company: "BrightBrand",
          role: "Content Marketing Lead",
          description: "Led content strategy for D2C brand. Managed writers and SEO.",
          startDate: yearsAgo(2),
          endDate: null,
          location: "Mumbai",
        },
        {
          company: "Studio North",
          role: "Marketing Associate",
          description: "Campaigns and social content for lifestyle brands.",
          startDate: yearsAgo(5),
          endDate: yearsAgo(2),
          location: "Mumbai",
        },
      ],
      educations: [
        {
          institution: "St. Xavier's College",
          degree: "BA",
          field: "Communications",
          description: null,
          startDate: yearsAgo(7),
          endDate: yearsAgo(5),
        },
      ],
      skills: [
        { name: "Content Strategy", category: "marketing", level: 5 },
        { name: "Brand Marketing", category: "marketing", level: 4 },
        { name: "SEO", category: "marketing", level: 3 },
      ],
      projects: [
        {
          title: "Brand Story Series",
          description: "12-part content series that lifted organic traffic 80%.",
          liveUrl: null,
          sourceUrl: null,
          techStack: ["Content", "SEO"],
          featured: true,
        },
      ],
      articles: [
        {
          title: "Building a content engine for startups",
          description: "Practical content strategy tips.",
          url: "https://example.com/content-engine",
          tags: ["Content", "Strategy"],
          publishedAt: monthsAgo(8),
        },
      ],
      certifications: [],
      achievements: [{ title: "Featured in Marketing Week Asia", date: yearsAgo(1) }],
      socialProfiles: [],
      customSections: [],
    },
  },
  {
    name: "Daniel Okonkwo",
    email: "daniel.okonkwo.seed@livefolio.test",
    jobId: JOB_ID,
    stage: "interview",
    shortlisted: true,
    coverNote: "Enterprise sales + marketing hybrid background in healthcare SaaS.",
    snapshot: {
      version: 1,
      capturedAt: new Date().toISOString(),
      profile: {
        title: "Daniel Okonkwo",
        headline: "Enterprise Growth · Healthcare SaaS",
        summary:
          "8 years spanning enterprise sales and B2B marketing in healthcare technology.",
        avatarUrl: null,
        location: "Remote",
        contactEmail: "daniel.okonkwo.seed@livefolio.test",
        websiteUrl: null,
        slug: "daniel-okonkwo-seed",
      },
      experiences: [
        {
          company: "MedStack",
          role: "Head of Growth",
          description:
            "B2B SaaS growth for healthcare. Managed demand generation and enterprise ABM.",
          startDate: yearsAgo(4),
          endDate: null,
          location: "Remote",
        },
        {
          company: "ClinicCloud",
          role: "Enterprise Account Executive",
          description: "Closed healthcare enterprise deals across India and MENA.",
          startDate: yearsAgo(8),
          endDate: yearsAgo(4),
          location: "Delhi",
        },
      ],
      educations: [
        {
          institution: "University of Lagos",
          degree: "BSc",
          field: "Business Administration",
          description: null,
          startDate: yearsAgo(12),
          endDate: yearsAgo(8),
        },
      ],
      skills: [
        { name: "B2B Marketing", category: "marketing", level: 4 },
        { name: "Enterprise Sales", category: "sales", level: 5 },
        { name: "Healthcare", category: "industry", level: 5 },
        { name: "ABM", category: "marketing", level: 4 },
        { name: "Team Leadership", category: "leadership", level: 4 },
      ],
      projects: [
        {
          title: "Healthcare ABM Pilot",
          description: "ABM program for hospital IT buyers.",
          liveUrl: null,
          sourceUrl: null,
          techStack: ["ABM", "Salesforce"],
          featured: true,
        },
      ],
      articles: [],
      certifications: [
        {
          name: "Challenger Sales",
          issuer: "Challenger Inc",
          issueDate: yearsAgo(3),
          url: null,
        },
      ],
      achievements: [
        { title: "President's Club — top 5% enterprise revenue", date: yearsAgo(2) },
      ],
      socialProfiles: [],
      customSections: [],
    },
  },
  {
    name: "Ananya Rao",
    email: "ananya.rao.seed@livefolio.test",
    jobId: JOB_ID,
    stage: "new",
    shortlisted: false,
    coverNote: null,
    snapshot: {
      version: 1,
      capturedAt: new Date().toISOString(),
      profile: {
        title: "Ananya Rao",
        headline: "Product Designer",
        summary: "Product designer with 4 years experience in fintech apps.",
        avatarUrl: null,
        location: "Bangalore",
        contactEmail: "ananya.rao.seed@livefolio.test",
        websiteUrl: null,
        slug: "ananya-rao-seed",
      },
      experiences: [
        {
          company: "PayNest",
          role: "Product Designer",
          description: "Designed mobile onboarding and payments flows.",
          startDate: yearsAgo(2),
          endDate: null,
          location: "Bangalore",
        },
        {
          company: "Studio Pixel",
          role: "UI Designer",
          description: "Visual design for early-stage startups.",
          startDate: yearsAgo(4),
          endDate: yearsAgo(2),
          location: "Bangalore",
        },
      ],
      educations: [
        {
          institution: "NID",
          degree: "B.Des",
          field: "Communication Design",
          description: null,
          startDate: yearsAgo(8),
          endDate: yearsAgo(4),
        },
      ],
      skills: [
        { name: "Figma", category: "design", level: 5 },
        { name: "Product Design", category: "design", level: 4 },
        { name: "User Research", category: "design", level: 3 },
      ],
      projects: [
        {
          title: "Fintech Onboarding Redesign",
          description: "Cut drop-off by 22% with a redesigned KYC flow.",
          liveUrl: null,
          sourceUrl: null,
          techStack: ["Figma"],
          featured: true,
        },
      ],
      articles: [],
      certifications: [],
      achievements: [],
      socialProfiles: [
        { platform: "behance", url: "https://behance.net/ananya-seed", username: "ananya-seed" },
      ],
      customSections: [],
    },
  },
  {
    name: "Marcus Chen",
    email: "marcus.chen.seed@livefolio.test",
    jobId: TEST_JOB_ID,
    stage: "new",
    shortlisted: false,
    coverNote: "Applying to explore the test role.",
    snapshot: {
      version: 1,
      capturedAt: new Date().toISOString(),
      profile: {
        title: "Marcus Chen",
        headline: "Operations Manager · 6 years",
        summary: "Operations professional with logistics and process improvement experience.",
        avatarUrl: null,
        location: "Singapore",
        contactEmail: "marcus.chen.seed@livefolio.test",
        websiteUrl: null,
        slug: "marcus-chen-seed",
      },
      experiences: [
        {
          company: "ShipFast",
          role: "Operations Manager",
          description: "Scaled warehouse ops across APAC.",
          startDate: yearsAgo(3),
          endDate: null,
          location: "Singapore",
        },
      ],
      educations: [
        {
          institution: "NUS",
          degree: "BSc",
          field: "Industrial Engineering",
          description: null,
          startDate: yearsAgo(10),
          endDate: yearsAgo(6),
        },
      ],
      skills: [
        { name: "Operations", category: "ops", level: 5 },
        { name: "Process Improvement", category: "ops", level: 4 },
      ],
      projects: [],
      articles: [],
      certifications: [
        {
          name: "Lean Six Sigma Green Belt",
          issuer: "ASQ",
          issueDate: yearsAgo(2),
          url: null,
        },
      ],
      achievements: [],
      socialProfiles: [],
      customSections: [],
    },
  },
];

async function upsertUser(client, { name, email }) {
  const existing = await client.query(
    `SELECT id FROM users WHERE email = $1`,
    [email],
  );
  if (existing.rows[0]) return existing.rows[0].id;

  const id = randomUUID();
  await client.query(
    `INSERT INTO users (id, name, email, password, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, NOW(), NOW())`,
    [id, name, email, "seed-no-login"],
  );
  return id;
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Enrich Senior Marketing Manager requirements for better matching demos
    await client.query(`DELETE FROM job_requirements WHERE "jobId" = $1`, [JOB_ID]);
    const reqs = [
      ["required", "skill", "B2B Marketing", 0],
      ["required", "skill", "Demand Generation", 1],
      ["required", "experience", "5+ years experience", 2],
      ["preferred", "skill", "SaaS", 3],
      ["preferred", "skill", "Team Leadership", 4],
      ["preferred", "skill", "Content Strategy", 5],
    ];
    for (const [type, category, label, sortOrder] of reqs) {
      await client.query(
        `INSERT INTO job_requirements (id, "jobId", type, category, label, "sortOrder")
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [randomUUID(), JOB_ID, type, category, label, sortOrder],
      );
    }

    for (const candidate of candidates) {
      const userId = await upsertUser(client, candidate);

      const existingApp = await client.query(
        `SELECT id FROM applications WHERE "jobId" = $1 AND "userId" = $2`,
        [candidate.jobId, userId],
      );

      let applicationId;
      if (existingApp.rows[0]) {
        applicationId = existingApp.rows[0].id;
        await client.query(
          `UPDATE applications
           SET stage = $1, status = $2, shortlisted = $3,
               "shortlistedAt" = $4, "coverNote" = $5, "updatedAt" = NOW()
           WHERE id = $6`,
          [
            candidate.stage,
            candidate.stage === "new" ? "applied" : candidate.stage === "reviewing" ? "under_review" : candidate.stage,
            candidate.shortlisted,
            candidate.shortlisted ? new Date().toISOString() : null,
            candidate.coverNote,
            applicationId,
          ],
        );
        await client.query(
          `DELETE FROM application_snapshots WHERE "applicationId" = $1`,
          [applicationId],
        );
      } else {
        applicationId = randomUUID();
        await client.query(
          `INSERT INTO applications (
             id, "jobId", "userId", status, stage, shortlisted, "shortlistedAt",
             "coverNote", "submittedAt", "updatedAt"
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())`,
          [
            applicationId,
            candidate.jobId,
            userId,
            candidate.stage === "new"
              ? "applied"
              : candidate.stage === "reviewing"
                ? "under_review"
                : candidate.stage,
            candidate.stage,
            candidate.shortlisted,
            candidate.shortlisted ? new Date().toISOString() : null,
            candidate.coverNote,
          ],
        );
      }

      await client.query(
        `INSERT INTO application_snapshots (id, "applicationId", data, "createdAt")
         VALUES ($1, $2, $3::jsonb, NOW())`,
        [randomUUID(), applicationId, JSON.stringify(candidate.snapshot)],
      );

      console.log(`✓ ${candidate.name} → job ${candidate.jobId.slice(0, 8)}… (${candidate.stage})`);
    }

    await client.query("COMMIT");
    console.log("\nSeeded applicants.");
    console.log("Open: /company/test1/jobs/c090f328-b77f-4ead-b6ef-8a2ee5a2b9d8/applicants");
    console.log('Try search: "B2B SaaS", "Bangalore", "healthcare", filters: skill=Content, minExperience=5');
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
