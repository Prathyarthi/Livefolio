#!/usr/bin/env bun
/**
 * Bulk-send personalized recruiter emails via Gmail SMTP (App Password).
 * No Resend — one SMTP message per recipient.
 *
 * Usage:
 *   bun scripts/bulk-smtp-email.mjs --csv ./Prospects.csv
 *   bun scripts/bulk-smtp-email.mjs --csv ./Prospects.csv --i-approve-drafts --only hr@connexiongroup.in --send
 *   bun scripts/bulk-smtp-email.mjs --to kiranbusari.dev@gmail.com --subject "SMTP test" --body "Hello" --send
 *
 * Requires in .env (project root):
 *   GMAIL_USER=prathyarthi@livefolio.me
 *   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
 * Optional:
 *   GMAIL_FROM="Prathyarthi Kashyap <prathyarthi@livefolio.me>"
 *   BULK_EMAIL_SHEET_ID=...
 *   BULK_EMAIL_SHEET_TAB=Prospects
 *   BULK_EMAIL_DELAY_MS=1500
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ENV_PATH = join(ROOT, ".env");
const DEFAULT_SHEET_ID = "1ppFSsPhO__gtXIQWtgpVb1p-so1IT-Ay5nwfzk_CWIQ";
const DEFAULT_SHEET_TAB = "Prospects";
const DEFAULT_FROM = "Prathyarthi Kashyap <prathyarthi@livefolio.me>";
const SITE_URL = "https://livefolio.me";
const RECRUITERS_URL = `${SITE_URL}/recruiters`;
/** Hosted PNG — email clients do not reliably load SVG. */
const LOGO_URL = `${SITE_URL}/logo-email.png`;
const BRAND = {
  coral: "#ed7a6d",
  page: "#f4f5f7",
  card: "#ffffff",
  footer: "#f9fafb",
  text: "#374151",
  heading: "#111827",
  muted: "#9ca3af",
  white: "#ffffff",
};
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const SENT_STAGE_RE = /^(emailed|sent|replied|closed|do not contact)/i;
const SIGN_OFF_RE =
  /\n+(?:Best regards|Cheers|Thanks|Thank you),?\s*\n+Prathyarthi Kashyap[\s\S]*$/i;

dotenv.config({ path: ENV_PATH });

const require = createRequire(import.meta.url);

function parseArgs(argv) {
  const args = {
    csv: null,
    send: false,
    iApproveDrafts: false,
    markSent: false,
    limit: null,
    only: null,
    to: null,
    subject: null,
    body: null,
    delayMs: Number(process.env.BULK_EMAIL_DELAY_MS || 1500),
    sheetId: process.env.BULK_EMAIL_SHEET_ID || DEFAULT_SHEET_ID,
    sheetTab: process.env.BULK_EMAIL_SHEET_TAB || DEFAULT_SHEET_TAB,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--help" || a === "-h") args.help = true;
    else if (a === "--send") args.send = true;
    else if (a === "--i-approve-drafts") args.iApproveDrafts = true;
    else if (a === "--mark-sent") args.markSent = true;
    else if (a === "--csv") args.csv = argv[++i];
    else if (a === "--limit") args.limit = Number(argv[++i]);
    else if (a === "--only") args.only = String(argv[++i] || "").toLowerCase();
    else if (a === "--to") args.to = String(argv[++i] || "").toLowerCase();
    else if (a === "--subject") args.subject = argv[++i];
    else if (a === "--body") args.body = argv[++i];
    else if (a === "--delay-ms") args.delayMs = Number(argv[++i]);
    else if (a === "--sheet-id") args.sheetId = argv[++i];
    else if (a === "--sheet-tab") args.sheetTab = argv[++i];
    else throw new Error(`Unknown argument: ${a}`);
  }

  if (args.limit != null && (!Number.isFinite(args.limit) || args.limit < 1)) {
    throw new Error("--limit must be a positive number");
  }
  if (!Number.isFinite(args.delayMs) || args.delayMs < 0) {
    throw new Error("--delay-ms must be a non-negative number");
  }
  return args;
}

function printHelp() {
  console.log(`Bulk Gmail SMTP email from the Prospects sheet.

Options:
  --csv <path>           Read a CSV export of the Prospects tab
  --send                 Actually send (default is dry-run)
  --i-approve-drafts     Required when stage still says "awaiting approval"
  --mark-sent            Update stage via Sheets API after send
  --limit <n>            Send at most n emails
  --only <email>         Only this sheet recipient
  --to <email>           One-off test address (not from the sheet)
  --subject <text>       Required with --to
  --body <text>          Required with --to
  --delay-ms <n>         Pause between sends (default 1500)
  -h, --help             Show help

App password goes in the project root .env as GMAIL_APP_PASSWORD=
`);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let i = 0;
  let inQuotes = false;

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      cell += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      row.push(cell);
      cell = "";
      i += 1;
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      i += 1;
      continue;
    }
    cell += ch;
    i += 1;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((cols, index) => {
    const obj = { __rowNumber: index + 2 };
    for (let c = 0; c < headers.length; c += 1) {
      obj[headers[c]] = cols[c] ?? "";
    }
    return obj;
  });
}

function extractEmail(raw) {
  const match = String(raw || "").match(EMAIL_RE);
  return match ? match[0].toLowerCase() : null;
}

function parseDraft(draft) {
  const text = String(draft || "").replace(/\r\n/g, "\n").trim();
  if (!text) return null;
  const match = text.match(/^Subject:\s*(.+?)\n+([\s\S]*)$/i);
  if (match) {
    return { subject: match[1].trim(), body: match[2].trim() };
  }
  return { subject: "Quick note from Livefolio", body: text };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function linkify(escaped) {
  return escaped.replace(
    /(https?:\/\/[^\s<]+|livefolio\.me\/[^\s<]*)/gi,
    (url) => {
      const href = url.startsWith("http") ? url : `https://${url}`;
      return `<a href="${escapeHtml(href)}" style="color:${BRAND.coral};text-decoration:none;" target="_blank">${escapeHtml(url)}</a>`;
    },
  );
}

function paragraphHtml(text, { last = false } = {}) {
  const margin = last ? "0 0 28px" : "0 0 16px";
  return `<p style="font-size:15px;color:${BRAND.text};line-height:1.6;margin:${margin};">${linkify(escapeHtml(text)).replaceAll("\n", "<br />")}</p>`;
}

function ctaButton(href, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
  <tr>
    <td align="center" style="border-radius:8px;background-color:${BRAND.coral};">
      <a href="${escapeHtml(href)}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:${BRAND.white};text-decoration:none;border-radius:8px;">
        ${escapeHtml(label)}
      </a>
    </td>
  </tr>
</table>`;
}

function founderSignOff() {
  return `<p style="font-size:15px;color:${BRAND.text};line-height:1.6;margin:0 0 4px;">Best regards,</p>
<p style="font-size:15px;color:${BRAND.heading};font-weight:600;margin:0;">Prathyarthi Kashyap</p>
<p style="font-size:13px;color:${BRAND.muted};margin:2px 0 0;">Founder, Livefolio</p>`;
}

function outreachFooterHtml() {
  return `<p style="font-size:12px;color:${BRAND.muted};margin:0;">
    Sent by Prathyarthi at Livefolio.
    Questions? Just reply to this email.
    <br />
    <a href="${SITE_URL}" style="color:${BRAND.coral};text-decoration:none;">livefolio.me</a>
    ·
    <a href="${RECRUITERS_URL}" style="color:${BRAND.coral};text-decoration:none;">For recruiters</a>
  </p>`;
}

/** Branded shell matching lib/email-templates.ts, with logo for outreach. */
function emailShell({ title, preheader = "", bodyHtml, footerHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.page};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  ${
    preheader
      ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>`
      : ""
  }
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.page};padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background-color:${BRAND.card};border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <tr>
            <td style="padding:32px 40px 0;text-align:left;">
              <a href="${SITE_URL}" style="text-decoration:none;display:inline-block;">
                <img src="${LOGO_URL}" width="40" height="40" alt="Livefolio" style="display:block;border:0;outline:none;" />
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 40px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="background-color:${BRAND.footer};padding:24px 40px;text-align:center;">
              ${footerHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function textToHtml(body, { subject } = {}) {
  const cleaned = String(body || "")
    .replace(/\r\n/g, "\n")
    .replace(SIGN_OFF_RE, "")
    .trim();

  const blocks = cleaned
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const bodyHtml = [
    ...blocks.map((block, index) =>
      paragraphHtml(block, { last: index === blocks.length - 1 }),
    ),
    ctaButton(RECRUITERS_URL, "See Livefolio for recruiters"),
    founderSignOff(),
  ].join("\n");

  return emailShell({
    title: subject || "Livefolio",
    preheader: blocks[0]?.slice(0, 120) || "",
    bodyHtml,
    footerHtml: outreachFooterHtml(),
  });
}

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

function normalizeHeaderKey(row, candidates) {
  for (const key of candidates) {
    if (key in row) return key;
  }
  const lower = Object.fromEntries(
    Object.keys(row).map((k) => [k.toLowerCase(), k]),
  );
  for (const key of candidates) {
    if (lower[key.toLowerCase()]) return lower[key.toLowerCase()];
  }
  return null;
}

function rowToRecipient(row) {
  const emailKey = normalizeHeaderKey(row, [
    "email if public",
    "email",
    "Email",
  ]);
  const draftKey = normalizeHeaderKey(row, ["draft message", "draft", "message"]);
  const stageKey = normalizeHeaderKey(row, ["stage", "status"]);
  const nameKey = normalizeHeaderKey(row, ["name", "Name"]);
  const companyKey = normalizeHeaderKey(row, ["company", "Company"]);

  const email = extractEmail(emailKey ? row[emailKey] : "");
  const draft = parseDraft(draftKey ? row[draftKey] : "");
  const stage = String(stageKey ? row[stageKey] : "").trim();

  if (!email || !draft) return null;

  return {
    rowNumber: row.__rowNumber,
    name: String(nameKey ? row[nameKey] : "").trim(),
    company: String(companyKey ? row[companyKey] : "").trim(),
    email,
    stage,
    subject: draft.subject,
    text: draft.body,
    html: textToHtml(draft.body, { subject: draft.subject }),
  };
}

async function loadCsv(path) {
  const abs = resolve(path);
  if (!existsSync(abs)) throw new Error(`CSV not found: ${abs}`);
  const text = readFileSync(abs, "utf8");
  return parseCsv(text);
}

async function getServiceAccountAuth(scopes) {
  const jsonPath = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!jsonPath) return null;
  const abs = resolve(ROOT, jsonPath);
  const { google } = require("googleapis");
  const auth = new google.auth.GoogleAuth({
    keyFile: abs,
    scopes,
  });
  return auth;
}

async function loadRowsFromSheetsApi({ sheetId, sheetTab }) {
  const range = `${sheetTab}!A:L`;
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY?.trim();
  const sa = await getServiceAccountAuth([
    "https://www.googleapis.com/auth/spreadsheets.readonly",
  ]);

  let values;
  if (sa) {
    const { google } = require("googleapis");
    const sheets = google.sheets({ version: "v4", auth: sa });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });
    values = res.data.values || [];
  } else if (apiKey) {
    const url = new URL(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`,
    );
    url.searchParams.set("key", apiKey);
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Sheets API ${res.status}: ${body}`);
    }
    const data = await res.json();
    values = data.values || [];
  } else {
    throw new Error(
      "No sheet source. Pass --csv <file>, or set GOOGLE_SHEETS_API_KEY / GOOGLE_SERVICE_ACCOUNT_JSON.",
    );
  }

  if (values.length === 0) return [];
  const headers = values[0].map((h) => String(h).trim());
  return values.slice(1).map((cols, index) => {
    const obj = { __rowNumber: index + 2 };
    for (let c = 0; c < headers.length; c += 1) {
      obj[headers[c]] = cols[c] ?? "";
    }
    return obj;
  });
}

async function markStageSent({ sheetId, sheetTab, rowNumber, stageText }) {
  const sa = await getServiceAccountAuth([
    "https://www.googleapis.com/auth/spreadsheets",
  ]);
  if (!sa) {
    throw new Error(
      "--mark-sent requires GOOGLE_SERVICE_ACCOUNT_JSON with edit access to the sheet.",
    );
  }
  const { google } = require("googleapis");
  const sheets = google.sheets({ version: "v4", auth: sa });
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${sheetTab}!I${rowNumber}`,
    valueInputOption: "RAW",
    requestBody: { values: [[stageText]] },
  });
}

function getFromAddress() {
  return (
    process.env.GMAIL_FROM?.trim() ||
    process.env.EMAIL_FROM?.trim() ||
    DEFAULT_FROM
  );
}

function createTransport() {
  const user = process.env.GMAIL_USER?.trim() || "prathyarthi@livefolio.me";
  const pass = process.env.GMAIL_APP_PASSWORD?.trim()?.replaceAll(" ", "");
  if (!pass) {
    throw new Error(
      `Set GMAIL_APP_PASSWORD in ${ENV_PATH}\nCreate one at https://myaccount.google.com/apppasswords (account: ${user})`,
    );
  }

  return {
    user,
    from: getFromAddress(),
    transporter: nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
    }),
  };
}

function idempotencyFingerprint(recipient) {
  return createHash("sha256")
    .update(`${recipient.email}|${recipient.subject}|${recipient.text}`)
    .digest("hex")
    .slice(0, 12);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  let recipients = [];
  let rows = [];

  if (args.to) {
    if (!EMAIL_RE.test(args.to)) {
      throw new Error(`Invalid --to email: ${args.to}`);
    }
    if (!args.subject?.trim() || !args.body?.trim()) {
      throw new Error("--to requires --subject and --body");
    }
    const subject = args.subject.trim();
    const text = args.body.trim();
    recipients = [
      {
        rowNumber: null,
        name: args.to.split("@")[0],
        company: "",
        email: args.to,
        stage: "test",
        subject,
        text,
        html: textToHtml(text, { subject }),
      },
    ];
  } else {
    rows = args.csv
      ? await loadCsv(args.csv)
      : await loadRowsFromSheetsApi({
          sheetId: args.sheetId,
          sheetTab: args.sheetTab,
        });

    recipients = rows
      .map(rowToRecipient)
      .filter(Boolean)
      .filter((r) => !SENT_STAGE_RE.test(r.stage));

    if (args.only) {
      recipients = recipients.filter((r) => r.email === args.only);
    }
    if (args.limit) {
      recipients = recipients.slice(0, args.limit);
    }
  }

  const awaiting = recipients.filter((r) =>
    /awaiting approval/i.test(r.stage),
  );

  const from = getFromAddress();
  console.log(`From: ${from}`);
  if (!args.to) {
    console.log(`Loaded ${rows.length} sheet rows.`);
  }
  console.log(`Eligible recipients: ${recipients.length}`);
  if (awaiting.length > 0) {
    console.log(
      `  of which ${awaiting.length} still say "awaiting approval"`,
    );
  }

  if (recipients.length === 0) {
    console.log("Nothing to send.");
    return;
  }

  if (awaiting.length > 0 && !args.iApproveDrafts) {
    throw new Error(
      `${awaiting.length} recipient(s) are still "Draft - awaiting approval". Re-run with --i-approve-drafts after you approve the copy, or change stage in the sheet.`,
    );
  }

  for (const r of recipients) {
    const loc = r.rowNumber != null ? `row ${r.rowNumber}: ` : "";
    console.log(
      `  ${loc}${r.email}  |  ${r.name}${r.company ? ` @ ${r.company}` : ""}  |  ${r.subject}`,
    );
  }

  if (!args.send) {
    console.log("\nDry-run only. Pass --send to deliver via Gmail SMTP.");
    return;
  }

  const { transporter, user } = createTransport();
  await transporter.verify();
  console.log(`\nSMTP ok as ${user}. Sending ${recipients.length} email(s)…`);

  const outDir = join(ROOT, "scripts", "bulk-email-out");
  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replaceAll(":", "-");
  const logPath = join(outDir, `send-${stamp}.jsonl`);
  const results = [];

  for (let i = 0; i < recipients.length; i += 1) {
    const recipient = recipients[i];
    const fingerprint = idempotencyFingerprint(recipient);
    const started = new Date().toISOString();
    try {
      const info = await transporter.sendMail({
        from,
        to: recipient.email,
        subject: recipient.subject,
        text: recipient.text,
        html: recipient.html,
        headers: {
          "X-Livefolio-Bulk": fingerprint,
        },
      });

      if (args.markSent && recipient.rowNumber != null) {
        await markStageSent({
          sheetId: args.sheetId,
          sheetTab: args.sheetTab,
          rowNumber: recipient.rowNumber,
          stageText: `Emailed ${new Date().toISOString().slice(0, 10)}`,
        });
      }

      const entry = {
        ok: true,
        at: started,
        rowNumber: recipient.rowNumber,
        email: recipient.email,
        subject: recipient.subject,
        messageId: info.messageId,
        response: info.response,
        fingerprint,
      };
      results.push(entry);
      writeFileSync(
        logPath,
        results.map((r) => JSON.stringify(r)).join("\n") + "\n",
      );
      console.log(
        `  [${i + 1}/${recipients.length}] sent → ${recipient.email} (${info.messageId})`,
      );
    } catch (error) {
      const entry = {
        ok: false,
        at: started,
        rowNumber: recipient.rowNumber,
        email: recipient.email,
        subject: recipient.subject,
        error: error instanceof Error ? error.message : String(error),
        fingerprint,
      };
      results.push(entry);
      writeFileSync(
        logPath,
        results.map((r) => JSON.stringify(r)).join("\n") + "\n",
      );
      console.error(
        `  [${i + 1}/${recipients.length}] FAILED → ${recipient.email}: ${entry.error}`,
      );
    }

    if (i < recipients.length - 1 && args.delayMs > 0) {
      await sleep(args.delayMs);
    }
  }

  const sent = results.filter((r) => r.ok).length;
  const failed = results.length - sent;
  console.log(`\nDone. sent=${sent} failed=${failed}`);
  console.log(`Log: ${logPath}`);
  if (failed > 0) process.exitCode = 1;
}

const isMain =
  import.meta.path === Bun.main ||
  process.argv[1]?.endsWith("bulk-smtp-email.mjs");

if (isMain) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

export { textToHtml, parseDraft, extractEmail };