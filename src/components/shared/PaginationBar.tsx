"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import type { usePagination } from "../../hooks/usePagination";

type PaginationState = ReturnType<typeof usePagination>;

interface PaginationBarProps extends Pick<
  PaginationState,
  "page" | "totalPages" | "hasPrev" | "hasNext" | "goTo" | "goNext" | "goPrev" | "goFirst" | "goLast" | "rangeLabel"
> {
  noun?:     string;
  className?: string;
}

export function PaginationBar({
  page,
  totalPages,
  hasPrev,
  hasNext,
  goTo,
  goNext,
  goPrev,
  goFirst,
  goLast,
  rangeLabel,
  noun,
  className,
}: PaginationBarProps) {
  if (totalPages <= 1) return null;

  /* Build visible page numbers around current page */
  const pages: (number | "ellipsis")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("ellipsis");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("ellipsis");
    pages.push(totalPages);
  }

  return (
    <div className={cn("flex items-center justify-between gap-4 py-3 px-1", className)}>
      {/* Range label */}
      <p className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
        {rangeLabel(noun)}
      </p>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={goFirst}
          disabled={!hasPrev}
          aria-label="First page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={goPrev}
          disabled={!hasPrev}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>

        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <span key={`e-${i}`} className="w-7 text-center text-xs text-slate-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => goTo(p)}
              className={cn(
                "h-7 w-7 rounded-md text-xs font-medium transition-colors",
                p === page
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              )}
            >
              {p}
            </button>
          )
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={goNext}
          disabled={!hasNext}
          aria-label="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={goLast}
          disabled={!hasNext}
          aria-label="Last page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}