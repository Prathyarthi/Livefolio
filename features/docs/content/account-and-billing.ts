import { CreditCard } from "lucide-react";
import { shot } from "@/features/docs/content/screenshots";
import type { DocCategory } from "@/features/docs/types";

export const accountAndBilling: DocCategory = {
  slug: "account-and-billing",
  title: "Account and billing",
  description: "Plans, upgrades, cancellations and your account.",
  icon: CreditCard,
  articles: [
    {
      slug: "plans-and-trial",
      title: "Plans, trial and Pro",
      description: "What is included in Free, the trial and Pro.",
      appPath: "/pricing",
      blocks: [
        { type: "screenshot", screenshot: shot("pricing") },
        {
          type: "list",
          items: [
            "**Free**: create and publish a portfolio with the free templates, and ask up to 3 people for references.",
            "**Free trial**: every new account gets **30 days** with all templates, imports and analytics unlocked.",
            "**Pro**: keeps all templates, imports and analytics after the trial, plus up to 12 project thumbnails, live project previews and up to 15 reference requests.",
          ],
        },
        {
          type: "paragraph",
          text: "Pro is billed monthly, quarterly or yearly. See [Pricing](/pricing) for current prices.",
        },
      ],
    },
    {
      slug: "upgrade-to-pro",
      title: "How to upgrade to Pro",
      description: "Start a Pro subscription from the dashboard.",
      appPath: "/dashboard/billing",
      blocks: [
        {
          type: "steps",
          steps: [
            {
              title: "Open Billing",
              body: "Click **Billing** in the sidebar.",
              screenshot: shot("billing"),
            },
            {
              title: "Choose a billing interval",
              body: "Pick **Monthly**, **Quarterly** or **Yearly**.",
            },
            {
              title: "Check out",
              body: "Click the upgrade button and complete payment in the Razorpay checkout.",
            },
            {
              title: "Wait for confirmation",
              body: "You may briefly see **Payment is being processed**. Once confirmed, your plan shows as Pro.",
            },
          ],
        },
      ],
    },
    {
      slug: "cancel-subscription",
      title: "How to cancel your subscription",
      description: "Stop Pro from renewing.",
      appPath: "/dashboard/billing",
      blocks: [
        {
          type: "steps",
          steps: [
            { title: "Open Billing", body: "Click **Billing** in the sidebar." },
            {
              title: "Cancel",
              body: "Click **Cancel Subscription** and confirm in the dialog. Pro access remains active until the billing cycle ends.",
            },
          ],
        },
        {
          type: "callout",
          variant: "warning",
          text: "Cancellation takes effect at the end of your current paid cycle. Payments are non-refundable. See the [cancellation policy](/refund-policy).",
        },
      ],
    },
    {
      slug: "delete-account",
      title: "How to delete your account",
      description: "Permanently remove your account and data.",
      appPath: "/dashboard/settings",
      blocks: [
        {
          type: "steps",
          steps: [
            {
              title: "Open Settings",
              body: "Click **Settings** in the sidebar and scroll to **Danger Zone**.",
            },
            {
              title: "Delete",
              body: "Click **Delete account** and confirm in the dialog.",
            },
          ],
        },
        {
          type: "callout",
          variant: "warning",
          text: "This removes your portfolio, imports, analytics and subscription. It cannot be undone.",
        },
      ],
    },
    {
      slug: "get-help",
      title: "How to get help",
      description: "Contact the Livefolio team.",
      appPath: "/contact",
      blocks: [
        {
          type: "paragraph",
          text: "Email [team@livefolio.me](mailto:team@livefolio.me) or use the [contact page](/contact). We typically respond within one business day.",
        },
        { type: "screenshot", screenshot: shot("contact") },
      ],
    },
  ],
};
