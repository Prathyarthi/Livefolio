import Link from "next/link";
import { Fragment } from "react";
import type { DocText } from "@/features/docs/types";

const TOKEN_PATTERN = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

/** Renders the small inline-markdown subset used by docs content. */
export function DocInlineText({ text }: { text: DocText }) {
  const parts = text.split(TOKEN_PATTERN).filter(Boolean);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={index} className="font-semibold text-text-primary">
              {part.slice(2, -2)}
            </strong>
          );
        }

        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={index}
              className="rounded-sm bg-surface-sunken px-1.5 py-0.5 font-mono text-[0.85em] text-text-primary"
            >
              {part.slice(1, -1)}
            </code>
          );
        }

        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link) {
          const [, label, href] = link;
          const className =
            "font-medium text-brand-primary underline underline-offset-4 hover:opacity-80";
          return href.startsWith("/") ? (
            <Link key={index} href={href} className={className}>
              {label}
            </Link>
          ) : (
            <a key={index} href={href} className={className}>
              {label}
            </a>
          );
        }

        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
}
