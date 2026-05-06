"use client";

import { useState, useMemo } from "react";

interface UsePaginationOptions {
  total:       number;
  pageSize?:   number;
  initialPage?: number;
}

interface UsePaginationReturn {
  page:       number;
  pageSize:   number;
  totalPages: number;
  offset:     number;
  hasPrev:    boolean;
  hasNext:    boolean;
  goTo:       (page: number) => void;
  goNext:     () => void;
  goPrev:     () => void;
  goFirst:    () => void;
  goLast:     () => void;
  /** Slice a data array to the current page */
  paginate:   <T>(items: T[]) => T[];
  /** Range label: "Showing 1–20 of 150" */
  rangeLabel: (noun?: string) => string;
}

export function usePagination({
  total,
  pageSize = 20,
  initialPage = 1,
}: UsePaginationOptions): UsePaginationReturn {
  const [page, setPage] = useState(initialPage);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage   = Math.min(Math.max(1, page), totalPages);
  const offset     = (safePage - 1) * pageSize;

  const goTo    = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));
  const goNext  = () => goTo(safePage + 1);
  const goPrev  = () => goTo(safePage - 1);
  const goFirst = () => goTo(1);
  const goLast  = () => goTo(totalPages);

  const paginate = <T>(items: T[]): T[] =>
    items.slice(offset, offset + pageSize);

  const rangeLabel = (noun = "items"): string => {
    if (total === 0) return `No ${noun}`;
    const from = offset + 1;
    const to   = Math.min(offset + pageSize, total);
    return `Showing ${from}–${to} of ${total.toLocaleString()} ${noun}`;
  };

  return {
    page: safePage,
    pageSize,
    totalPages,
    offset,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
    goTo,
    goNext,
    goPrev,
    goFirst,
    goLast,
    paginate,
    rangeLabel,
  };
}