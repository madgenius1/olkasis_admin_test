import { cn } from "../../lib/utils";

type Status =
  /* User / KYC */
  | "verified" | "pending" | "rejected" | "not_submitted"
  | "active"   | "inactive" | "suspended"
  /* Orders / Transactions */
  | "filled"   | "cancelled" | "partial"
  | "completed"| "processing"| "failed"
  /* AML / Risk */
  | "open"     | "reviewing"  | "resolved" | "escalated"
  | "critical" | "high"       | "medium"   | "low"
  /* Campaigns */
  | "paused"   | "scheduled"  | "ended"
  /* STR */
  | "draft"    | "submitted"  | "acknowledged" | "under_review"
  /* Derivatives */
  | "margin_call" | "pending_liquidation"
  /* Disputes */
  | "investigating"
  /* Approvals */
  | "approved"
  | string; // allow any string as fallback

const STATUS_MAP: Record<string, { label?: string; class: string }> = {
  /* ── Positive ── */
  verified:            { class: "badge-success" },
  active:              { class: "badge-success" },
  filled:              { class: "badge-success" },
  completed:           { class: "badge-success" },
  resolved:            { class: "badge-success" },
  approved:            { class: "badge-success" },
  acknowledged:        { class: "badge-success" },
  /* ── Warning ── */
  pending:             { class: "badge-warning" },
  reviewing:           { class: "badge-warning" },
  processing:          { class: "badge-warning" },
  investigating:       { class: "badge-warning" },
  under_review:        { label: "Under Review",    class: "badge-warning" },
  pending_liquidation: { label: "Liquidation",     class: "badge-warning" },
  paused:              { class: "badge-warning" },
  scheduled:           { class: "badge-info" },
  margin_call:         { label: "Margin Call",     class: "badge-warning" },
  draft:               { class: "badge-neutral" },
  partial:             { class: "badge-info" },
  /* ── Danger ── */
  rejected:            { class: "badge-danger" },
  suspended:           { class: "badge-danger" },
  failed:              { class: "badge-danger" },
  cancelled:           { class: "badge-neutral" },
  escalated:           { class: "badge-danger" },
  critical:            { class: "badge-danger" },
  high:                { class: "badge-warning" },
  open:                { class: "badge-warning" },
  /* ── Neutral ── */
  inactive:            { class: "badge-neutral" },
  medium:              { class: "badge-info" },
  low:                 { class: "badge-neutral" },
  not_submitted:       { label: "Not Submitted",   class: "badge-neutral" },
  ended:               { class: "badge-neutral" },
};

interface StatusBadgeProps {
  status:     Status;
  className?: string;
  size?:      "sm" | "default";
}

export function StatusBadge({ status, className, size = "default" }: StatusBadgeProps) {
  const entry = STATUS_MAP[status];
  const cls   = entry?.class ?? "badge-neutral";

  // Format label: "not_submitted" → "Not Submitted"
  const label =
    entry?.label ??
    status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={cn(
        cls,
        size === "sm" && "text-[10px] px-1.5 py-0.5",
        className
      )}
    >
      {label}
    </span>
  );
}