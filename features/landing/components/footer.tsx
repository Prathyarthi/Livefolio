import Link from "next/link";
import { Mail } from "lucide-react";
import { TwitterIcon, LinkedinIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { siteConfig } from "@/lib/site";

const NAV = {
  Product: [
    { label: "How it works", href: "/#features" },
    { label: "Examples", href: "/#showcase" },
    { label: "For recruiters", href: "/#recruiters" },
    { label: "Pricing", href: "/#pricing" },
    { label: "FAQ", href: "/#faq" },
  ],
  Account: [
    { label: "Sign in", href: "/sign-in" },
    { label: "Sign up free", href: "/sign-up" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Recruiter workspace", href: "/recruiter" },
  ],
  Resources: [
    { label: "Contact & support", href: "/contact" },
    { label: "Resume import", href: "/sign-up" },
    { label: "All templates", href: "/sign-up" },
    { label: "Full pricing", href: "/pricing" },
  ],
};

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/refund-policy", label: "Cancellation" },
  { href: "/contact", label: "Contact" },
] as const;

const SOCIAL = [

  { label: "Twitter", href: "https://x.com/livefolio_me", icon: TwitterIcon },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/livefolio/", icon: LinkedinIcon },
];

export function Footer() {
  return (
    <footer className="marketing-footer px-6 py-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-[2fr_1fr_1fr_1fr] md:gap-8">
          <div className="col-span-2 md:col-span-1">
            <Logo wordmarkClassName="mf-heading" />
            <p className="mf-text mt-2 max-w-[260px] text-xs leading-relaxed">
              {siteConfig.tagline}
            </p>
            <a
              href={`mailto:${siteConfig.supportEmail}`}
              className="mf-link mt-3 inline-flex items-center gap-1.5 text-xs"
            >
              <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {siteConfig.supportEmail}
            </a>
            <div className="mt-3 flex items-center gap-1.5">
              {SOCIAL.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="mf-social flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)]"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(NAV).map(([title, links]) => (
            <nav key={title} aria-label={title}>
              <p className="mf-muted text-[11px] font-medium uppercase tracking-wide">
                {title}
              </p>
              <ul className="mt-2.5 flex flex-col gap-2">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="mf-link text-xs">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mf-divider mt-8 flex flex-col items-center justify-between gap-3 border-t pt-4 sm:flex-row">
          <p className="mf-muted text-xs">
            &copy; {new Date().getFullYear()} {siteConfig.legalEntity}. All rights
            reserved.
          </p>
          <nav
            className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5"
            aria-label="Legal"
          >
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="mf-link text-xs">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
