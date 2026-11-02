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

Hiring plans live in `lib/hiring-plans.ts` (Free, Pro and Business, priced per seat; Business needs at least 3 seats). Seats used = org members + pending invites; inviting beyond paid seats returns 402. Orgs that are active with no `subscriptionPlan` are legacy Org Pro and keep their original terms.

Before going live:
1. Apply migration `20261102210000_org_per_seat_plans` (additive, nullable columns).
2. Create Razorpay plans (amount per seat): `node scripts/razorpay-setup-plans.mjs --product=org-seat --dry-run`, then run it for real, test mode first.
3. Set `RAZORPAY_ORG_PRO_SEAT_PLAN_ID_{MONTHLY,QUARTERLY,YEARLY}` and `RAZORPAY_ORG_BUSINESS_SEAT_PLAN_ID_{MONTHLY,QUARTERLY,YEARLY}`. Keep `RAZORPAY_ORG_PRO_PLAN_ID_*` for legacy renewals.
4. In test mode, check seat changes (`/api/org-billing/seats` uses `subscriptions.update` with `quantity`), including mid-cycle charges and which payment methods allow updates.
