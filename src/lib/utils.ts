import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as Kenyan Shillings */
export function formatKES(amount: number, compact = false): string {
  if (compact) {
    if (amount >= 1_000_000_000) return `KSH ${(amount / 1_000_000_000).toFixed(1)}B`;
    if (amount >= 1_000_000)     return `KSH ${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000)         return `KSH ${(amount / 1_000).toFixed(0)}K`;
  }
  return `KSH ${amount.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/** Format a number as KSh (short label used in tables) */
export function formatKSh(amount: number): string {
  return `Ksh. ${amount.toLocaleString("en-KE", { minimumFractionDigits: 0 })}`;
}

/** Format a percentage with sign */
export function formatPercent(value: number, signed = false): string {
  const formatted = `${Math.abs(value).toFixed(1)}%`;
  if (!signed) return formatted;
  return value >= 0 ? `+${formatted}` : `-${formatted}`;
}

/** Format a date string to "DD MMM YYYY" */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Format a datetime string to "DD MMM YYYY, HH:MM" */
export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Return relative time string: "2 min ago", "3h ago", "Yesterday" */
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1)  return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)   return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1)   return "Yesterday";
  return `${days}d ago`;
}

/** Capitalise first letter of each word */
export function titleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Truncate a string with ellipsis */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}…`;
}

/** Generate initials from a full name */
export function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Map KYC status → badge class */
export function kycBadgeClass(status: string): string {
  switch (status) {
    case "verified":      return "badge-success";
    case "pending":       return "badge-warning";
    case "rejected":      return "badge-danger";
    case "not_submitted": return "badge-neutral";
    default:              return "badge-neutral";
  }
}

/** Map user status → badge class */
export function userStatusBadge(status: string): string {
  switch (status) {
    case "active":    return "badge-success";
    case "inactive":  return "badge-neutral";
    case "suspended": return "badge-danger";
    default:          return "badge-neutral";
  }
}

/** Map ticket priority → badge class */
export function priorityBadge(priority: string): string {
  switch (priority) {
    case "urgent": return "badge-danger";
    case "high":   return "badge-warning";
    case "medium": return "badge-info";
    case "low":    return "badge-neutral";
    default:       return "badge-neutral";
  }
}

/** Map AML severity → badge class */
export function severityBadge(severity: string): string {
  switch (severity) {
    case "critical": return "badge-danger";
    case "high":     return "badge-warning";
    case "medium":   return "badge-info";
    case "low":      return "badge-neutral";
    default:         return "badge-neutral";
  }
}

/** Map order status → badge class */
export function orderStatusBadge(status: string): string {
  switch (status) {
    case "filled":    return "badge-success";
    case "pending":   return "badge-warning";
    case "cancelled": return "badge-neutral";
    case "rejected":  return "badge-danger";
    case "partial":   return "badge-info";
    default:          return "badge-neutral";
  }
}

/** Map transaction status → badge class */
export function txStatusBadge(status: string): string {
  switch (status) {
    case "completed":  return "badge-success";
    case "processing": return "badge-info";
    case "pending":    return "badge-warning";
    case "failed":     return "badge-danger";
    case "cancelled":  return "badge-neutral";
    default:           return "badge-neutral";
  }
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Generate a random colour for avatar fallback */
const AVATAR_COLOURS = [
  "bg-blue-600", "bg-emerald-600", "bg-violet-600",
  "bg-amber-600", "bg-rose-600", "bg-cyan-600",
];
export function avatarColour(seed: string): string {
  const index = seed.charCodeAt(0) % AVATAR_COLOURS.length;
  return AVATAR_COLOURS[index];
}