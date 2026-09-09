"use client";

import type { MouseEvent } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

function pageItems(page: number, pageCount: number): Array<number | "ellipsis"> {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  const shown = new Set([1, pageCount, page - 1, page, page + 1]);
  const ordered = [...shown]
    .filter((value) => value >= 1 && value <= pageCount)
    .sort((a, b) => a - b);

  const items: Array<number | "ellipsis"> = [];
  let previous = 0;
  for (const value of ordered) {
    if (previous && value - previous > 1) items.push("ellipsis");
    items.push(value);
    previous = value;
  }
  return items;
}

export function ListPagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);
  if (total <= pageSize) return null;

  function goTo(next: number, event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (next < 1 || next > pageCount || next === page) return;
    onPageChange(next);
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            aria-disabled={page <= 1}
            className={page <= 1 ? "pointer-events-none opacity-45" : undefined}
            onClick={(event) => goTo(page - 1, event)}
          />
        </PaginationItem>
        {pageItems(page, pageCount).map((item, index) =>
          item === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationLink
                href="#"
                isActive={item === page}
                onClick={(event) => goTo(item, event)}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext
            href="#"
            aria-disabled={page >= pageCount}
            className={
              page >= pageCount ? "pointer-events-none opacity-45" : undefined
            }
            onClick={(event) => goTo(page + 1, event)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}