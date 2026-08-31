#!/usr/bin/env node
/**
 * Create Razorpay subscription plans for Livefolio Pro and/or Org Pro.
 *
 * Matches lib/pricing.ts PRO_PRICING / ORG_PRO_PRICING.
 *
 * Usage:
 *   node scripts/razorpay-setup-plans.mjs                    # personal Pro (INR)
 *   node scripts/razorpay-setup-plans.mjs --product=org      # Org Pro
 *   node scripts/razorpay-setup-plans.mjs --product=all
 *   node scripts/razorpay-setup-plans.mjs --currency=usd
 *   node scripts/razorpay-setup-plans.mjs --dry-run
 *   node scripts/razorpay-setup-plans.mjs --list
 *   node scripts/razorpay-setup-plans.mjs --write-env
 *
 * Requires in .env:
 *   RAZORPAY_KEY_ID
 *   RAZORPAY_KEY_SECRET
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import Razorpay from "razorpay";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ENV_PATH = join(ROOT, ".env");

dotenv.config({ path: ENV_PATH });

/** Keep in sync with lib/pricing.ts */
const PRO_PRICING = {
  monthly: { usd: 7, inr: 599 },
  quarterly: { usd: 19, inr: 1599 },
  yearly: { usd: 70, inr: 5999 },
};

const ORG_PRO_PRICING = {
  monthly: { usd: 29, inr: 2499 },
  quarterly: { usd: 79, inr: 6799 },
  yearly: { usd: 290, inr: 24999 },
};

const PRODUCTS = {
  personal: {
    id: "personal",
    pricing: PRO_PRICING,
    namePrefixEnv: "RAZORPAY_PLAN_NAME_PREFIX",
    defaultNamePrefix: "Livefolio Pro",
    notesProduct: "pro",
    planDefs: [
      {
        key: "monthly",
        envVar: "RAZORPAY_PRO_PLAN_ID_MONTHLY",
        legacyEnvVar: "RAZORPAY_PRO_PLAN_ID",
        label: "Monthly",
        period: "monthly",
        interval: 1,
      },
      {
        key: "quarterly",
        envVar: "RAZORPAY_PRO_PLAN_ID_QUARTERLY",
        label: "Quarterly",
        period: "monthly",
        interval: 3,
      },
      {
        key: "yearly",
        envVar: "RAZORPAY_PRO_PLAN_ID_YEARLY",
        label: "Yearly",
        period: "yearly",
        interval: 1,
      },
    ],
  },
  org: {
    id: "org",
    pricing: ORG_PRO_PRICING,
    namePrefixEnv: "RAZORPAY_ORG_PLAN_NAME_PREFIX",
    defaultNamePrefix: "Livefolio Org Pro",
    notesProduct: "org_pro",
    planDefs: [
      {
        key: "monthly",
        envVar: "RAZORPAY_ORG_PRO_PLAN_ID_MONTHLY",
        label: "Monthly",
        period: "monthly",
        interval: 1,
      },
      {
        key: "quarterly",
        envVar: "RAZORPAY_ORG_PRO_PLAN_ID_QUARTERLY",
        label: "Quarterly",
        period: "monthly",
        interval: 3,
      },
      {
        key: "yearly",
        envVar: "RAZORPAY_ORG_PRO_PLAN_ID_YEARLY",
        label: "Yearly",
        period: "yearly",
        interval: 1,
      },
    ],
  },
};

function parseArgs(argv) {
  const flags = {
    dryRun: false,
    list: false,
    writeEnv: false,
    product: "personal",
    currency:
      process.env.NEXT_PUBLIC_BILLING_CURRENCY?.toLowerCase() === "usd"
        ? "usd"
        : "inr",
  };

  for (const arg of argv) {
    if (arg === "--dry-run") flags.dryRun = true;
    else if (arg === "--list") flags.list = true;
    else if (arg === "--write-env") flags.writeEnv = true;
    else if (arg.startsWith("--product=")) {
      const value = arg.split("=")[1]?.toLowerCase();
      if (value === "personal" || value === "org" || value === "all") {
        flags.product = value;
      } else {
        throw new Error(
          `Invalid product "${value}". Use personal, org, or all.`,
        );
      }
    } else if (arg.startsWith("--currency=")) {
      const value = arg.split("=")[1]?.toLowerCase();
      if (value === "inr" || value === "usd") flags.currency = value;
      else throw new Error(`Invalid currency "${value}". Use inr or usd.`);
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return flags;
}

function printHelp() {
  console.log(`
Razorpay plan setup (personal Pro and/or Org Pro)

  node scripts/razorpay-setup-plans.mjs [options]

Options:
  --product=personal|org|all   Which plans to create (default: personal)
  --currency=inr|usd           Plan currency (default: NEXT_PUBLIC_BILLING_CURRENCY or inr)
  --dry-run                    Print payloads without calling Razorpay
  --list                       List existing plans in the account
  --write-env                  Write plan IDs into .env
  -h, --help                   Show this help

Personal Pro (INR): ₹599 / ₹1,599 / ₹5,999
Org Pro (INR):      ₹2,499 / ₹6,799 / ₹24,999

After creating plans, configure webhook in Razorpay Dashboard:
  POST https://your-domain.com/api/billing/webhook
  Events: subscription.authenticated, subscription.pending, subscription.activated,
          subscription.charged, subscription.cancelled, subscription.halted,
          subscription.paused, subscription.resumed, subscription.completed
`);
}

function getCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) {
    throw new Error(
      "Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in .env",
    );
  }

  return { keyId, keySecret };
}

function toSubunits(amount, currency) {
  if (currency === "inr" || currency === "usd") return Math.round(amount * 100);
  throw new Error(`Unsupported currency: ${currency}`);
}

function formatDisplayAmount(amount, currency) {
  if (currency === "inr") return `₹${amount.toLocaleString("en-IN")}`;
  return `$${amount}`;
}

function resolveProducts(productFlag) {
  if (productFlag === "all") return [PRODUCTS.personal, PRODUCTS.org];
  return [PRODUCTS[productFlag]];
}

function buildPlanPayload(product, def, currency) {
  const namePrefix =
    process.env[product.namePrefixEnv]?.trim() || product.defaultNamePrefix;
  const displayAmount = product.pricing[def.key][currency];
  const name = `${namePrefix} — ${def.label}`;

  return {
    period: def.period,
    interval: def.interval,
    item: {
      name,
      amount: toSubunits(displayAmount, currency),
      currency: currency.toUpperCase(),
      description: `${namePrefix} ${def.label.toLowerCase()} subscription`,
    },
    notes: {
      product: product.notesProduct,
      interval: def.key,
      app: "livefolio",
    },
  };
}

async function fetchAllPlans(razorpay) {
  const items = [];
  let skip = 0;
  const count = 100;

  while (true) {
    const page = await razorpay.plans.all({ count, skip });
    items.push(...(page.items ?? []));
    if (!page.items?.length || page.items.length < count) break;
    skip += count;
  }

  return items;
}

async function listPlans(razorpay) {
  const plans = await fetchAllPlans(razorpay);

  if (!plans.length) {
    console.log("No plans found in this Razorpay account.");
    return;
  }

  console.log(`Found ${plans.length} plan(s):\n`);
  for (const plan of plans) {
    const amount = plan.item?.amount ?? 0;
    const currency = plan.item?.currency ?? "?";
    const major = amount / 100;
    console.log(
      `- ${plan.id}  ${plan.item?.name ?? "Unnamed"}  ${currency} ${major}  (${plan.period} × ${plan.interval})`,
    );
  }
}

function findExistingPlan(plans, payload) {
  return plans.find(
    (plan) =>
      plan.item?.name === payload.item.name &&
      plan.item?.currency === payload.item.currency &&
      plan.item?.amount === payload.item.amount &&
      plan.period === payload.period &&
      plan.interval === payload.interval,
  );
}

function printEnvBlock(results) {
  console.log("\n# Add to .env:\n");
  for (const { def, planId, created } of results) {
    const tag = created ? "created" : "existing";
    console.log(`# ${def.label} (${tag})`);
    console.log(`${def.envVar}=${planId}`);
    if (def.legacyEnvVar) {
      console.log(`${def.legacyEnvVar}=${planId}`);
    }
    console.log("");
  }
}

function upsertEnvVars(results) {
  let content = readFileSync(ENV_PATH, "utf8");

  for (const { def, planId } of results) {
    for (const key of [def.envVar, def.legacyEnvVar].filter(Boolean)) {
      const line = `${key}=${planId}`;
      const pattern = new RegExp(`^${key}=.*$`, "m");

      if (pattern.test(content)) {
        content = content.replace(pattern, line);
      } else {
        content = content.trimEnd() + `\n${line}\n`;
      }
    }
  }

  writeFileSync(ENV_PATH, content, "utf8");
  console.log(`\nUpdated ${ENV_PATH} with plan IDs.`);
}

async function createPlansForProduct(razorpay, product, flags, existingPlans) {
  const results = [];

  console.log(`\n=== ${product.defaultNamePrefix} ===\n`);

  for (const def of product.planDefs) {
    const payload = buildPlanPayload(product, def, flags.currency);
    const displayAmount = product.pricing[def.key][flags.currency];

    console.log(`→ ${def.label}`);
    console.log(
      `  ${payload.item.name} — ${formatDisplayAmount(displayAmount, flags.currency)} (${payload.period}, interval ${payload.interval})`,
    );

    if (flags.dryRun) {
      console.log(`  payload: ${JSON.stringify(payload, null, 2)}\n`);
      results.push({
        def,
        planId: `plan_DRY_RUN_${product.id}_${def.key}`,
        created: true,
      });
      continue;
    }

    const existing = findExistingPlan(existingPlans, payload);
    if (existing) {
      console.log(`  reuse existing plan: ${existing.id}\n`);
      results.push({ def, planId: existing.id, created: false });
      continue;
    }

    const plan = await razorpay.plans.create(payload);
    console.log(`  created plan: ${plan.id}\n`);
    results.push({ def, planId: plan.id, created: true });
  }

  return results;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const { keyId, keySecret } = getCredentials();
  const mode = keyId.includes("_live_") ? "LIVE" : "TEST";
  const products = resolveProducts(flags.product);

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

  console.log(`Razorpay mode: ${mode}`);
  console.log(`Currency: ${flags.currency.toUpperCase()}`);
  console.log(`Product: ${flags.product}`);

  if (flags.list) {
    await listPlans(razorpay);
    return;
  }

  const existingPlans = flags.dryRun ? [] : await fetchAllPlans(razorpay);
  const results = [];

  for (const product of products) {
    results.push(
      ...(await createPlansForProduct(razorpay, product, flags, existingPlans)),
    );
  }

  printEnvBlock(results);

  if (flags.writeEnv && !flags.dryRun) {
    upsertEnvVars(results);
  } else if (!flags.dryRun) {
    console.log(
      "Tip: run with --write-env to save plan IDs to .env automatically.",
    );
  }

  console.log(
    "\nNext: set RAZORPAY_WEBHOOK_SECRET and configure webhook URL in Razorpay Dashboard.",
  );
}

main().catch((error) => {
  console.error("\nError:", error.message ?? error);
  process.exit(1);
});
