import { cn } from "@/lib/utils";
import { inlineRichTextToSafeHtml } from "@/lib/rich-text";

/** Renders stored markdown/HTML inline marks safely. */
export function RichText({
  text,
  className,
  as: Tag = "span",
}: {
  text: string;
  className?: string;
  as?: "span" | "p" | "div" | "h1" | "h2" | "h3" | "h4";
}) {
  if (!text) return null;
  const html = inlineRichTextToSafeHtml(text);
  if (!html) return null;
  return (
    <Tag
      className={cn(
        "[&_a]:underline [&_u]:underline [&_s]:line-through [&_del]:line-through [&_code]:font-mono",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}