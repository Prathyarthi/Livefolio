# Next.js Starter Template

A modern full-stack starter template built with technologies for rapid development.

## Tech Stack

This starter template includes:

- **[Next.js](https://nextjs.org)** - React framework for production
- **[Elysia](https://elysiajs.com)** - Fast and ergonomic web framework for backend API routes
- **[TanStack Query](https://tanstack.com/query)** - Powerful data synchronization and state management
- **[Tailwind CSS](https://tailwindcss.com)** - Utility-first CSS framework for styling
- **[shadcn/ui](https://ui.shadcn.com)** - Beautifully designed components built with Radix UI and Tailwind CSS
- **[Prisma](https://www.prisma.io)** - Next-generation ORM for database management

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Features

- ✨ Type-safe database queries with Prisma ORM
- 🚀 High-performance backend with Elysia
- 🔄 Optimized data fetching with TanStack Query
- 🎨 Beautiful UI with Tailwind CSS and shadcn/ui components
- ⚡ Fast refresh and modern development experience

## Learn More

To learn more about the technologies used in this template:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Elysia Documentation](https://elysiajs.com/introduction.html) - explore Elysia framework
- [TanStack Query Docs](https://tanstack.com/query/latest) - master data fetching patterns
- [Tailwind CSS Docs](https://tailwindcss.com/docs) - learn utility-first CSS
- [shadcn/ui Docs](https://ui.shadcn.com) - explore the component library
- [Prisma Documentation](https://www.prisma.io/docs) - understand Prisma ORM

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Per-seat hiring billing

Hiring plans live in `lib/hiring-plans.ts` (Free, Pro and Business, priced per seat, both paid plans from 1 seat). Limits: Free 1 seat / 1 open job / 1 workspace; Pro up to `PRO_MAX_WORKSPACES` (5) workspaces and `PRO_OPEN_JOBS_PER_WORKSPACE` (5) open jobs per workspace, enforced when a job is opened, published or reopened; Business unlimited. Talent search is Pro and above (`canUseTalentSearch`; the talent API returns 403 with `upgradeRequired` for Free). Enterprise "Contact sales" opens a dialog that posts to `/api/contact-sales`, which emails `siteConfig.supportEmail` via Resend (`CONTACT_SALES_DRY_RUN=1` validates without sending). Orgs over a limit after a downgrade keep everything and are only blocked from opening or creating more. Enterprise is display-only ("Custom", Contact sales via `siteConfig.supportEmail`) with no Razorpay plan or checkout. Seats used = org members + pending invites; inviting beyond paid seats returns 402.

Before going live:
1. Apply migration `20261102210000_org_per_seat_plans` (adds plan and seat columns).
2. Create Razorpay plans (amount per seat): `node scripts/razorpay-setup-plans.mjs --product=org-seat --dry-run`, then run it for real, test mode first.
3. Set `RAZORPAY_ORG_PRO_SEAT_PLAN_ID_{MONTHLY,QUARTERLY,YEARLY}` and `RAZORPAY_ORG_BUSINESS_SEAT_PLAN_ID_{MONTHLY,QUARTERLY,YEARLY}`.
4. In test mode, check seat changes (`/api/org-billing/seats` uses `subscriptions.update` with `quantity`), including mid-cycle charges and which payment methods allow updates.
