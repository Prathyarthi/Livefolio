"use client";

import { Children, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function CollapsibleList({
  children,
  initial = 4,
  wrapperClassName,
  buttonClassName,
  showLabel = "Show {n} more",
  hideLabel = "Show less",
}: {
  children: ReactNode;
  initial?: number;
  wrapperClassName?: string;
  buttonClassName?: string;
  showLabel?: string;
  hideLabel?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const items = Children.toArray(children);
  const total = items.length;
  const hidden = Math.max(0, total - initial);
  const visible = expanded ? items : items.slice(0, initial);

  const toggle =
    hidden > 0 ? (
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "inline-flex w-fit cursor-pointer items-center justify-center",
          buttonClassName,
        )}
      >
        {expanded ? hideLabel : showLabel.replace("{n}", String(hidden))}
      </button>
    ) : null;

  if (wrapperClassName) {
    return (
      <>
        <div className={wrapperClassName}>{visible}</div>
        {toggle}
      </>
    );
  }

  return (
    <>
      {visible}
      {toggle}
    </>
  );
}
