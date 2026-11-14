import { accountAndBilling } from "@/features/docs/content/account-and-billing";
import { analytics } from "@/features/docs/content/analytics";
import { buildYourPortfolio } from "@/features/docs/content/build-your-portfolio";
import { design } from "@/features/docs/content/design";
import { gettingStarted } from "@/features/docs/content/getting-started";
import { publishAndShare } from "@/features/docs/content/publish-and-share";
import { references } from "@/features/docs/content/references";
import type { DocCategory } from "@/features/docs/types";

/** Sidebar order. */
export const DOC_CATEGORIES: DocCategory[] = [
  gettingStarted,
  buildYourPortfolio,
  design,
  publishAndShare,
  references,
  analytics,
  accountAndBilling,
];
