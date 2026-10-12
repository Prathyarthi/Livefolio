"use client";

import { Children, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const LINE_CLAMP: Record<number, string> = {
  1: "line-clamp-1",
  2: "line-clamp-2",
  3: "line-clamp-3",
  4: "line-clamp-4",
  5: "line-clamp-5",
  6: "line-clamp-6",
};

export default function ExpandableText({
  children,
  initialLines = 3,
  buttonClassName,
  className,
  as: Tag = "p",
}: {
  children: ReactNode;
  initialLines?: number;
  buttonClassName?: string;
  className?: string;
  as?: "p" | "ul" | "div";
}) {
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentId = useId();
  const clampClass = LINE_CLAMP[initialLines] ?? "line-clamp-3";
  const listItems = Tag === "ul" ? Children.toArray(children) : null;
  const listCanExpand = Boolean(listItems && listItems.length > initialLines);
  const visibleChildren =
    listItems && !expanded && listCanExpand
      ? listItems.slice(0, initialLines)
      : children;

  useEffect(() => {
    if (Tag === "ul") {
      setCanExpand(listCanExpand);
      return;
    }
    if (expanded) return;

    const content = containerRef.current?.firstElementChild;
    if (!(content instanceof HTMLElement)) return;

    const checkOverflow = () => {
      setCanExpand(content.scrollHeight > content.clientHeight + 1);
    };

    checkOverflow();
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(content);
    return () => observer.disconnect();
  }, [Tag, children, expanded, initialLines, listCanExpand]);

  return (
    <div ref={containerRef}>
      <Tag
        id={contentId}
        className={cn(className, Tag !== "ul" && !expanded && clampClass)}
      >
        {visibleChildren}
      </Tag>
      {canExpand && (
        <button
          type="button"
          aria-controls={contentId}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className={cn(
            "mt-2 cursor-pointer text-xs font-medium text-current/70 underline-offset-2 hover:text-current hover:underline",
            buttonClassName
          )}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
