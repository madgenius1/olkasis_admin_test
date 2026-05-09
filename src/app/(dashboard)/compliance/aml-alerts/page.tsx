"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle, Eye, CheckCircle2, XCircle,
  RefreshCw, Scale, Filter, Search,
  ArrowUpRight, Clock, User, DollarSign,
} from "lucide-react";

import { MOCK_AML_ALERTS } from "../../../../lib/mockData";
import { useDebounce } from "../../../../hooks/useDebounce";
import { formatKSh, cn } from "../../../../lib/utils";
import { StatusBadge } from "../../../../components/shared/StatusBadge";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "../../../../components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogBody, DialogFooter,
} from "../../../../components/ui/dialog";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";

import type { AMLAlert, AlertSeverity, AlertStatus } from "../../../../types/index";

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
type SeverityFilter = "all" | AlertSeverity;
type StatusFilter   = "all" | AlertStatus;

interface AlertState {
  alerts:   AMLAlert[];
  reviewed: Set<string>;
  resolved: Set<string>;
}

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
const SEVERITY_DOT: Record<AlertSeverity, string> = {
  critical: "bg-red-500",
  high:     "bg-amber-500",
  medium:   "bg-sky-500",
  low:      "bg-slate-400",
};

const SEVERITY_ROW_BG: Record<AlertSeverity, string> = {
  critical: "border-l-4 border-l-red-500",
  high:     "border-l-4 border-l-amber-500",
  medium:   "border-l-4 border-l-sky-500",
  low:      "",
};

const TOOLTIP_STYLE: React.CSSProperties = {
  fontSize:     12,
  borderRadius: 8,
  border:       "1px solid #E2E8F0",
};

/* ─────────────────────────────────────────────────────────────
   REVIEW MODAL
───────────────────────────────────────────────────────────── */
function ReviewModal({
  alert,
  onClose,
  onResolve,
  onEscalate,
}: {
  alert:      AMLAlert;
  onClose:    () => void;
  onResolve:  (id: string, note: string) => void;
  onEscalate: (id: string) => void;
}) {
  const [note, setNote] = useState(alert.notes ?? "");
  const router = useRouter();

  const transactionHistory = [
    { date: "2024-04-13 06:00", type: "Deposit",    amount: 200000, method: "M-Pesa" },
    { date: "2024-04-13 07:30", type: "Transfer",   amount: 1500000,method: "Bank" },
    { date: "2024-04-13 08:23", type: "Withdrawal", amount: alert.amount, method: "Bank" },
  ];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent size="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <span
              className={cn(
                "w-2.5 h-2.5 rounded-full shrink-0",
                SEVERITY_DOT[alert.severity]
              )}
            />
            AML Review —{" "}
            <span className="font-mono text-base">{alert.id}</span>
          </DialogTitle>
          <DialogDescription>
            {alert.type} · {alert.user} ·{" "}
            <span className="font-mono font-medium">{formatKSh(alert.amount)}</span>
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-5">
          {/* Alert detail grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            {[
              { label: "Alert ID",    value: alert.id,                    mono: true },
              { label: "Type",        value: alert.type,                  mono: false },
              { label: "User",        value: alert.user,                  mono: false },
              { label: "Amount",      value: formatKSh(alert.amount),     mono: true },
              { label: "Threshold",   value: alert.threshold > 0 ? formatKSh(alert.threshold) : "Pattern-based", mono: true },
              { label: "Timestamp",   value: alert.timestamp,             mono: true },
              { label: "Severity",    value: alert.severity,              mono: false },
              { label: "Current Status", value: alert.status,             mono: false },
            ].map(({ label, value, mono }) => (
              <div key={label}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  {label}
                </p>
                <p
                  className={cn(
                    "text-sm mt-0.5 text-slate-800 dark:text-slate-100 capitalize",
                    mono && "font-mono"
                  )}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Transaction context */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Transaction Context (24h)
            </p>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                    {["Date", "Type", "Amount", "Method"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactionHistory.map((tx, i) => (
                    <tr
                      key={i}
                      className={cn(
                        "border-b border-slate-50 dark:border-slate-700/50 last:border-0",
                        i === transactionHistory.length - 1 &&
                          "bg-amber-50/50 dark:bg-amber-900/10"
                      )}
                    >
                      <td className="px-3 py-2 text-xs font-mono text-slate-500">
                        {tx.date}
                      </td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                        {tx.type}
                        {i === transactionHistory.length - 1 && (
                          <span className="ml-1.5 text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded-full">
                            FLAGGED
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono font-semibold text-slate-800 dark:text-slate-100">
                        {formatKSh(tx.amount)}
                      </td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                        {tx.method}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Review notes */}
          <div className="space-y-1.5">
            <Label htmlFor="aml-note">Review Notes</Label>
            <Textarea
              id="aml-note"
              placeholder="Document your review findings, investigation steps, and conclusion…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>
        </DialogBody>

        <DialogFooter className="flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 text-blue-700 border-blue-200 hover:bg-blue-50"
            onClick={() => {
              onClose();
              router.push(
                `/compliance/str-generator?alertId=${alert.id}&userId=${alert.userId ?? ""}`
              );
            }}
          >
            <Scale className="w-3.5 h-3.5" />
            Escalate to STR
          </Button>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => onResolve(alert.id, note)}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mark Resolved
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────── */
export default function AMLAlertsPage() {
  const [rawSearch,      setRawSearch]      = useState("");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [statusFilter,   setStatusFilter]   = useState<StatusFilter>("all");
  const [selected,       setSelected]       = useState<string[]>([]);
  const [reviewAlert,    setReviewAlert]    = useState<AMLAlert | null>(null);

  const [alertState, setAlertState] = useState<AlertState>({
    alerts:   MOCK_AML_ALERTS,
    reviewed: new Set<string>(),
    resolved: new Set<string>(),
  });

  const search = useDebounce(rawSearch, 250);

  /* ── Filter ── */
  const filtered = useMemo<AMLAlert[]>(() => {
    const q = search.toLowerCase();
    return alertState.alerts.filter((a) => {
      const matchSearch =
        !q ||
        a.id.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q) ||
        a.user.toLowerCase().includes(q);
      const matchSeverity = severityFilter === "all" || a.severity === severityFilter;
      const matchStatus   = statusFilter   === "all" || a.status   === statusFilter;
      return matchSearch && matchSeverity && matchStatus;
    });
  }, [search, severityFilter, statusFilter, alertState.alerts]);

  /* ── Derived counts ── */
  const openCount     = alertState.alerts.filter((a) => a.status === "open").length;
  const reviewingCount = alertState.alerts.filter((a) => a.status === "reviewing").length;
  const resolvedCount = alertState.alerts.filter((a) => a.status === "resolved").length;

  /* ── Selection ── */
  const allSelected  = filtered.length > 0 && selected.length === filtered.length;
  const someSelected = selected.length > 0 && !allSelected;

  const toggleOne = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleAll = () =>
    setSelected(allSelected ? [] : filtered.map((a) => a.id));

  /* ── Actions ── */
  const resolveAlert = (id: string, note: string) => {
    setAlertState((prev) => ({
      ...prev,
      alerts: prev.alerts.map((a) =>
        a.id === id ? { ...a, status: "resolved", notes: note } : a
      ),
      resolved: new Set([...prev.resolved, id]),
    }));
    setReviewAlert(null);
    toast.success(`Alert ${id} marked as resolved`);
  };

  const bulkResolve = () => {
    setAlertState((prev) => ({
      ...prev,
      alerts: prev.alerts.map((a) =>
        selected.includes(a.id) ? { ...a, status: "resolved" } : a
      ),
      resolved: new Set([...prev.resolved, ...selected]),
    }));
    toast.success(`${selected.length} alert${selected.length > 1 ? "s" : ""} resolved`);
    setSelected([]);
  };

  const bulkReview = () => {
    setAlertState((prev) => ({
      ...prev,
      alerts: prev.alerts.map((a) =>
        selected.includes(a.id) && a.status === "open"
          ? { ...a, status: "reviewing" }
          : a
      ),
    }));
    toast.info(`${selected.length} alert${selected.length > 1 ? "s" : ""} moved to reviewing`);
    setSelected([]);
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            AML Alerts
          </h1>
          <p className="text-blue-600 dark:text-blue-400 text-sm mt-0.5">
            Anti-money laundering monitoring and suspicious activity detection
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {selected.length > 0 && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50"
                onClick={bulkReview}
              >
                <Clock className="w-3.5 h-3.5" />
                Mark Reviewing ({selected.length})
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                onClick={bulkResolve}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Resolve ({selected.length})
              </Button>
            </>
          )}
          <Link href="/compliance/str-generator">
            <Button
              size="sm"
              className="h-8 text-xs gap-1.5 bg-blue-700 hover:bg-blue-800"
            >
              <Scale className="w-3.5 h-3.5" />
              Generate STR
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Stat mini-strip ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Open",      value: openCount,     color: "text-red-700 dark:text-red-400",     bg: "bg-red-50 dark:bg-red-900/30",     icon: AlertTriangle },
          { label: "Reviewing", value: reviewingCount, color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/30", icon: Clock },
          { label: "Resolved",  value: resolvedCount,  color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/30", icon: CheckCircle2 },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", bg)}>
                <Icon className={cn("w-3.5 h-3.5", color)} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{label}</p>
                <p className={cn("text-lg font-bold font-mono leading-tight", color)}>{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Filters ── */}
      <Card className="shadow-sm">
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                placeholder="Search by ID, type, or user…"
                value={rawSearch}
                onChange={(e) => setRawSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Select
              value={severityFilter}
              onValueChange={(v) => setSeverityFilter(v as SeverityFilter)}
            >
              <SelectTrigger className="w-full sm:w-[140px] h-9 text-sm">
                <Filter className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="w-full sm:w-[140px] h-9 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="reviewing">Reviewing</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ── Alert table ── */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Active Alerts
              <span className="ml-2 text-xs font-normal text-slate-400">
                {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              </span>
            </CardTitle>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={toggleAll}
                    className="rounded border-slate-300 text-blue-600"
                    aria-label="Select all alerts"
                  />
                </th>
                {[
                  { label: "Alert ID",  className: "text-left" },
                  { label: "Type",      className: "text-left" },
                  { label: "User",      className: "text-left" },
                  { label: "Amount",    className: "text-right" },
                  { label: "Threshold", className: "text-right" },
                  { label: "Severity",  className: "text-left" },
                  { label: "Status",    className: "text-left" },
                  { label: "Timestamp", className: "text-left" },
                  { label: "",          className: "" },
                ].map(({ label, className }) => (
                  <th
                    key={label}
                    className={cn(
                      "px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide",
                      className
                    )}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center text-slate-400 text-sm">
                    No alerts match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((alert) => (
                  <tr
                    key={alert.id}
                    className={cn(
                      "border-b border-slate-50 dark:border-slate-700/50 transition-colors",
                      SEVERITY_ROW_BG[alert.severity],
                      selected.includes(alert.id)
                        ? "bg-blue-50/60 dark:bg-blue-900/20"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40",
                      alertState.resolved.has(alert.id) && "opacity-60"
                    )}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(alert.id)}
                        onChange={() => toggleOne(alert.id)}
                        className="rounded border-slate-300 text-blue-600"
                        aria-label={`Select alert ${alert.id}`}
                      />
                    </td>

                    {/* ID */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-blue-600 dark:text-blue-400 font-medium">
                        {alert.id}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            SEVERITY_DOT[alert.severity]
                          )}
                        />
                        {alert.type}
                      </div>
                    </td>

                    {/* User */}
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {alert.userId ? (
                        <Link
                          href={`/users/${alert.userId}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {alert.user}
                        </Link>
                      ) : (
                        <span>{alert.user}</span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-100">
                      {formatKSh(alert.amount)}
                    </td>

                    {/* Threshold */}
                    <td className="px-4 py-3 text-right font-mono text-slate-500 dark:text-slate-400 text-xs">
                      {alert.threshold > 0 ? formatKSh(alert.threshold) : "—"}
                    </td>

                    {/* Severity */}
                    <td className="px-4 py-3">
                      <StatusBadge status={alert.severity} />
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={alert.status} />
                    </td>

                    {/* Timestamp */}
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {alert.timestamp}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => setReviewAlert(alert)}
                        >
                          <Eye className="w-3 h-3" />
                          Review
                        </Button>
                        {alert.status !== "resolved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => resolveAlert(alert.id, "")}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Resolve
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Review modal ── */}
      {reviewAlert && (
        <ReviewModal
          alert={reviewAlert}
          onClose={() => setReviewAlert(null)}
          onResolve={resolveAlert}
          onEscalate={(id) => {
            toast.info(`Alert ${id} escalated to STR`);
            setReviewAlert(null);
          }}
        />
      )}
    </div>
  );
}