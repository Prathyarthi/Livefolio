import { Elysia } from "elysia";
import { auth } from "@/features/auth/server/route";
import { portfolio } from "@/features/portfolio/server/route";
import { profile } from "@/features/profile/server/route";
import { resume } from "@/features/resume/server/route";
import { publicPortfolio } from "@/features/public/server/route";
import { recruiter } from "@/features/recruiter/server/route";

export const maxDuration = 300;

const app = new Elysia({ prefix: "/api" })
  .use(auth)
  .use(portfolio)
  .use(profile)
  .use(resume)
  .use(publicPortfolio)
  .use(recruiter);

export const GET = app.fetch;
export const POST = app.fetch;
export const PUT = app.fetch;
export const PATCH = app.fetch;
export const DELETE = app.fetch;

export type AppType = typeof app;