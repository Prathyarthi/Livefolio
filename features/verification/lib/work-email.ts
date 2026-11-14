const CONSUMER_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "ymail.com",
  "rocketmail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "gmx.com",
  "gmx.net",
  "mail.com",
  "zoho.com",
  "yandex.com",
  "yandex.ru",
  "fastmail.com",
  "hey.com",
  "tutanota.com",
  "tuta.com",
  "qq.com",
  "163.com",
  "rediffmail.com",
  "inbox.com",
]);

const ACADEMIC_SUFFIXES = [
  ".edu",
  ".ac.uk",
  ".ac.in",
  ".edu.in",
  ".edu.au",
  ".ac.nz",
  ".edu.sg",
  ".ac.jp",
  ".edu.cn",
  ".ac.za",
  ".edu.pk",
  ".ac.kr",
  ".edu.my",
  ".ac.th",
  ".edu.hk",
  ".ac.il",
];

export function workEmailDomain(email: string) {
  const separator = email.lastIndexOf("@");
  if (separator <= 0) return "";
  return email.slice(separator + 1);
}

export function maskWorkEmail(email: string) {
  const separator = email.lastIndexOf("@");
  if (separator <= 0) return "your work email";
  const local = email.slice(0, separator);
  const domain = email.slice(separator + 1);
  const visible = local.slice(0, 1);
  return `${visible}***@${domain}`;
}

/** Returns a user-facing reason, or null when the address can verify a company. */
export function workEmailRejection(email: string): string | null {
  const domain = workEmailDomain(email);
  if (!domain) return "Enter a valid work email.";
  if (CONSUMER_DOMAINS.has(domain)) {
    return "Use a company email. Personal inboxes like Gmail can't verify a company.";
  }
  if (ACADEMIC_SUFFIXES.some((suffix) => domain.endsWith(suffix))) {
    return "School and student emails can't verify a company.";
  }
  return null;
}

/** Hostname of a company website, without a leading www. */
export function websiteHostname(websiteUrl: string | null | undefined): string | null {
  const raw = websiteUrl?.trim();
  if (!raw) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const host = new URL(withProtocol).hostname
      .toLowerCase()
      .replace(/\.$/, "")
      .replace(/^www\./, "");
    return host || null;
  } catch {
    return null;
  }
}

/** True when the email domain is the website, or one is a subdomain of the other. */
export function domainMatchesWebsite(
  emailDomain: string,
  websiteUrl: string | null | undefined,
) {
  const host = websiteHostname(websiteUrl);
  const domain = emailDomain.trim().toLowerCase();
  if (!host || !domain) return false;
  return host === domain || host.endsWith(`.${domain}`) || domain.endsWith(`.${host}`);
}
