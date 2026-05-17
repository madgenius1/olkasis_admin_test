"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Search, RefreshCw, CheckCircle2, AlertTriangle,
  XCircle, GitMerge, Download, Eye,
} from "lucide-react";

import { RECONCILIATION_ITEMS } from "../../../../lib/walletMockData";
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

import type { ReconciliationItem } from "../../../../types/index";

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
type RecStatus = "all" | ReconciliationItem["status"];

/* ─────────────────────────────────────────────────────────────
   MANUAL RECONCILE MODAL
───────────────────────────────────────────────────────────── */
function ReconcileModal({
  item,
  onClose,
  onResolve,
}: {
  item:      ReconciliationItem;
  onClose:   () => void;
  onResolve: (id: string, txRef: string, note: string) => void;
}) {
  const [txRef, setTxRef] = useState("");
  const [note,  setNote]  = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txRef.trim()) { toast.error("Transaction reference required"); return; }
    onResolve(item.id, txRef.trim(), note.trim());
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent size="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="w-4 h-4 text-blue-600" />
            Manual Reconciliation
          </DialogTitle>
          <DialogDescription>
            Match M-Pesa callback <span className="font-mono font-bold">{item.mpesaRef}</span> to a platform transaction.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            {/* Callback details */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">M-Pesa Callback</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-slate-400">M-Pesa Ref</p>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-100">{item.mpesaRef}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Amount</p>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-100">{formatKSh(item.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Phone</p>
                  <p className="font-mono text-slate-700 dark:text-slate-300">{item.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Time</p>
                  <p className="font-mono text-slate-700 dark:text-slate-300">{item.timestamp}</p>
                </div>
                {item.discrepancy !== undefined && item.discrepancy > 0 && (
                  <div className="col-span-2">
                    <p className="text-xs text-amber-600">Discrepancy: {formatKSh(item.discrepancy)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Platform transaction ref */}
            <div className="space-y-1.5">
              <Label htmlFor="tx-ref">
                Platform Transaction Reference{" "}
                <span className="text-slate-400 font-normal">(e.g. MPE240413001)</span>
              </Label>
              <Input
                id="tx-ref"
                placeholder="MPE240413XXX"
                value={txRef}
                onChange={(e) => setTxRef(e.target.value.toUpperCase())}
                className="font-mono"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="rec-note">Reconciliation Note</Label>
              <Input
                id="rec-note"
                placeholder="Reason for manual match…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" className="gap-1.5 bg-blue-700 hover:bg-blue-800">
              <GitMerge className="w-3.5 h-3.5" />
              Match & Resolve
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────────────────
   STATUS META
───────────────────────────────────────────────────────────── */
const STATUS_META: Record<ReconciliationItem["status"], {
  label: string; dotClass: string; rowClass: string;
}> = {
  matched:       { label: "Matched",       dotClass: "bg-emerald-500", rowClass: "" },
  unmatched:     { label: "Unmatched",     dotClass: "bg-red-500",     rowClass: "bg-red-50/40 dark:bg-red-900/10" },
  manual_review: { label: "Manual Review", dotClass: "bg-amber-500",   rowClass: "bg-amber-50/40 dark:bg-amber-900/10" },
};

/* ─────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────── */
export default function ReconciliationPage() {
  const [rawSearch,  setRawSearch]  = useState("");
  const [statusFilter, setStatusFilter] = useState<RecStatus>("all");
  const [items,      setItems]      = useState<ReconciliationItem[]>(RECONCILIATION_ITEMS);
  const [reconcileTarget, setReconcileTarget] = useState<ReconciliationItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const search = useDebounce(rawSearch, 250);

  /* ── Filtered ── */
  const filtered = useMemo(() =>
    items.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        item.mpesaRef.toLowerCase().includes(q) ||
        item.phone.includes(q) ||
        (item.matchedTxId ?? "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || item.status === statusFilter;
      return matchSearch && matchStatus;
    }),
  [items, search, statusFilter]);

  /* ── Aggregates ── */
  const matchedCount      = items.filter((i) => i.status === "matched").length;
  const unmatchedCount    = items.filter((i) => i.status === "unmatched").length;
  const reviewCount       = items.filter((i) => i.status === "manual_review").length;
  const totalUnmatched    = items
    .filter((i) => i.status !== "matched")
    .reduce((s, i) => s + (i.discrepancy ?? i.amount), 0);

  /* ── Actions ── */
  const handleResolve = (id: string, txRef: string, note: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: "matched", matchedTxId: txRef }
          : item
      )
    );
    toast.success(`Reconciled — matched to ${txRef}`);
  };

  const handleIgnore = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "matched" } : item
      )
    );
    toast.info("Item marked as resolved");
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); toast.success("M-Pesa callbacks refreshed"); }, 900);
  };

  const handleExport = () => {
    const headers = ["M-Pesa Ref", "Amount", "Phone", "Timestamp", "Status", "Matched Tx", "Discrepancy"];
    const rows    = filtered.map((i) => [
      i.mpesaRef, i.amount.toString(), i.phone,
      i.timestamp, i.status, i.matchedTxId ?? "",
      (i.discrepancy ?? 0).toString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a   = Object.assign(document.createElement("a"), {
      href:     URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `reconciliation-${new Date().toISOString().slice(0, 10)}.csv`,
    });
    document.body.appendChild(a); a.click(); a.remove();
    toast.success(`Exported ${filtered.length} items`);
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            M-Pesa Reconciliation
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Match incoming M-Pesa callbacks to platform transactions
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 text-xs"
            onClick={handleExport}
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 text-xs"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label:  "Matched",
            value:  matchedCount,
            icon:   CheckCircle2,
            color:  "text-emerald-700 dark:text-emerald-400",
            bg:     "bg-emerald-50 dark:bg-emerald-900/40",
          },
          {
            label:  "Unmatched",
            value:  unmatchedCount,
            icon:   XCircle,
            color:  unmatchedCount > 0 ? "text-red-700 dark:text-red-400" : "text-slate-700",
            bg:     unmatchedCount > 0 ? "bg-red-50 dark:bg-red-900/40" : "bg-slate-100 dark:bg-slate-700",
          },
          {
            label:  "Manual Review",
            value:  reviewCount,
            icon:   AlertTriangle,
            color:  reviewCount > 0 ? "text-amber-700 dark:text-amber-400" : "text-slate-700",
            bg:     reviewCount > 0 ? "bg-amber-50 dark:bg-amber-900/40" : "bg-slate-100 dark:bg-slate-700",
          },
          {
            label:  "Unreconciled Amount",
            value:  totalUnmatched > 0 ? formatKSh(totalUnmatched) : "KES 0",
            icon:   GitMerge,
            color:  totalUnmatched > 0 ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400",
            bg:     totalUnmatched > 0 ? "bg-red-50 dark:bg-red-900/40" : "bg-emerald-50 dark:bg-emerald-900/40",
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", bg)}>
                <Icon className={cn("w-4 h-4", color)} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {label}
                </p>
                <p className={cn("text-lg font-bold font-mono leading-tight mt-0.5", color)}>
                  {value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Alert banner ── */}
      {(unmatchedCount + reviewCount) > 0 && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              {unmatchedCount + reviewCount} callback{unmatchedCount + reviewCount > 1 ? "s" : ""} require manual reconciliation
            </p>
          </div>
          <Button
            size="sm"
            className="h-7 text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 shrink-0"
            onClick={() => setStatusFilter("unmatched")}
          >
            View Unmatched
          </Button>
        </div>
      )}

      {/* ── Filters ── */}
      <Card className="shadow-sm">
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                placeholder="Search by M-Pesa ref, phone, or transaction ID…"
                value={rawSearch}
                onChange={(e) => setRawSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as RecStatus)}>
              <SelectTrigger className="w-full sm:w-[160px] h-9 text-sm">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="matched">Matched</SelectItem>
                <SelectItem value="unmatched">Unmatched</SelectItem>
                <SelectItem value="manual_review">Manual Review</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ── Reconciliation table ── */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              M-Pesa Callbacks
              <span className="ml-2 text-xs font-normal text-slate-400">
                {filtered.length} item{filtered.length !== 1 ? "s" : ""}
              </span>
            </CardTitle>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                {[
                  "M-Pesa Ref", "Amount", "Phone",
                  "Timestamp", "Status", "Matched To",
                  "Discrepancy", ""
                ].map((h, i) => (
                  <th
                    key={h + i}
                    className={cn(
                      "px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide",
                      (i === 1 || i === 6) ? "text-right" : "text-left"
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-sm">
                    No items match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const meta = STATUS_META[item.status];
                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        "border-b border-slate-50 dark:border-slate-700/50 transition-colors",
                        meta.rowClass,
                        "hover:brightness-95 dark:hover:brightness-105"
                      )}
                    >
                      {/* M-Pesa ref */}
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-100 text-sm">
                          {item.mpesaRef}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-100">
                        {formatKSh(item.amount)}
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {item.phone}
                      </td>

                      {/* Timestamp */}
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {item.timestamp}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={cn("w-2 h-2 rounded-full shrink-0", meta.dotClass)} />
                          <span className={cn(
                            "text-xs font-semibold",
                            item.status === "matched"       && "text-emerald-700 dark:text-emerald-400",
                            item.status === "unmatched"     && "text-red-700 dark:text-red-400",
                            item.status === "manual_review" && "text-amber-700 dark:text-amber-400"
                          )}>
                            {meta.label}
                          </span>
                        </div>
                      </td>

                      {/* Matched to */}
                      <td className="px-4 py-3">
                        {item.matchedTxId ? (
                          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded">
                            {item.matchedTxId}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Discrepancy */}
                      <td className="px-4 py-3 text-right">
                        {item.discrepancy !== undefined && item.discrepancy > 0 ? (
                          <span className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-400">
                            {formatKSh(item.discrepancy)}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {item.status !== "matched" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1 text-blue-700 border-blue-200 hover:bg-blue-50 whitespace-nowrap"
                                onClick={() => setReconcileTarget(item)}
                              >
                                <GitMerge className="w-3 h-3" />
                                Match
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-slate-400 hover:text-slate-600 whitespace-nowrap"
                                onClick={() => handleIgnore(item.id)}
                              >
                                Ignore
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Manual reconcile modal ── */}
      {reconcileTarget && (
        <ReconcileModal
          item={reconcileTarget}
          onClose={() => setReconcileTarget(null)}
          onResolve={handleResolve}
        />
      )}
    </div>
  );
}