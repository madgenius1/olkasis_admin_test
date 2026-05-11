"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowDownLeft, ArrowUpRight, RefreshCw,
  Download, Search, Filter, Wallet,
  CreditCard, CheckCircle2, Clock,
} from "lucide-react";

import { parseRef, refBadgeClass } from "../../../lib/txRef";
import { useDebounce } from "../../../hooks/useDebounce";
import { formatKSh, cn } from "../../../lib/utils";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";

import type { Transaction, TxType, TxStatus } from "../../../types/index";
import { WALLET_TRANSACTIONS } from '../../../lib/walletMockData';

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
type TypeFilter     = "all" | TxType;
type CategoryFilter = "all" | string;
type StatusFilter   = "all" | TxStatus;

/* ─────────────────────────────────────────────────────────────
   FILTER CHIP
───────────────────────────────────────────────────────────── */
function FilterChip({
  label, active, onClick,
}: {
  label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap",
        active
          ? "bg-blue-700 text-white border-blue-700 shadow-sm"
          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
      )}
    >
      {label}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   TYPE BADGE (transaction type colour)
───────────────────────────────────────────────────────────── */
function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    deposit:    "text-emerald-700 dark:text-emerald-400",
    withdrawal: "text-red-600 dark:text-red-400",
    transfer:   "text-blue-600 dark:text-blue-400",
    fee:        "text-slate-500 dark:text-slate-400",
    dividend:   "text-amber-600 dark:text-amber-400",
    p2p:        "text-sky-600 dark:text-sky-400",
  };
  return (
    <span className={cn("text-xs font-semibold capitalize", styles[type] ?? "text-slate-500")}>
      {type}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────── */
export default function WalletsPage() {
  const [rawSearch,      setRawSearch]      = useState("");
  const [typeFilter,     setTypeFilter]     = useState<TypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [statusFilter,   setStatusFilter]   = useState<StatusFilter>("all");
  const [transactions,   setTransactions]   = useState<Transaction[]>(WALLET_TRANSACTIONS);

  const search = useDebounce(rawSearch, 250);

  /* ── Aggregates ── */
  const totalDeposits    = transactions.filter((t) => t.type === "deposit")
    .reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = transactions.filter((t) => t.type === "withdrawal")
    .reduce((s, t) => s + t.amount, 0);
  const totalFees        = transactions.filter((t) => t.type === "fee")
    .reduce((s, t) => s + t.amount, 0);
  const processingCount  = transactions.filter((t) => t.status === "processing").length;

  /* ── Filter ── */
  const filtered = useMemo<Transaction[]>(() => {
    const q = search.toLowerCase();
    return transactions.filter((t) => {
      const matchSearch =
        !q ||
        t.ref.toLowerCase().includes(q) ||
        t.user.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q);
      const matchType     = typeFilter     === "all" || t.type         === typeFilter;
      const matchCategory = categoryFilter === "all" || t.category     === categoryFilter;
      const matchStatus   = statusFilter   === "all" || t.status       === statusFilter;
      return matchSearch && matchType && matchCategory && matchStatus;
    });
  }, [search, typeFilter, categoryFilter, statusFilter, transactions]);

  /* ── Approve processing tx ── */
  const handleApprove = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) => t.id === id ? { ...t, status: "completed" } : t)
    );
    toast.success(`Transaction approved`);
  };

  const handleExport = () => {
    const headers = ["Ref", "User", "Type", "Category", "Method", "Amount", "Fee", "Status", "Timestamp"];
    const rows    = filtered.map((t) => [
      t.ref, t.user, t.type, t.category ?? "", t.method,
      t.amount.toString(), t.fee.toString(), t.status, t.timestamp,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a   = Object.assign(document.createElement("a"), {
      href:     URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `wallets-${new Date().toISOString().slice(0, 10)}.csv`,
    });
    document.body.appendChild(a); a.click(); a.remove();
    toast.success(`Exported ${filtered.length} transactions`);
  };

  /* ── Unique categories ── */
  const categories = Array.from(new Set(transactions.map((t) => t.category).filter(Boolean)));

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            Wallets & Payments
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Deposits, withdrawals, fees, and transaction management
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-8 text-xs shrink-0"
          onClick={handleExport}
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </Button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total Deposits",
            value: formatKSh(totalDeposits),
            icon:  ArrowDownLeft,
            color: "text-emerald-700 dark:text-emerald-400",
            bg:    "bg-emerald-50 dark:bg-emerald-900/40",
          },
          {
            label: "Total Withdrawals",
            value: formatKSh(totalWithdrawals),
            icon:  ArrowUpRight,
            color: "text-red-700 dark:text-red-400",
            bg:    "bg-red-50 dark:bg-red-900/40",
          },
          {
            label: "Total Fees",
            value: formatKSh(totalFees),
            icon:  CreditCard,
            color: "text-amber-700 dark:text-amber-400",
            bg:    "bg-amber-50 dark:bg-amber-900/40",
          },
          {
            label: "Processing",
            value: String(processingCount),
            icon:  Clock,
            color: processingCount > 0 ? "text-blue-700 dark:text-blue-400" : "text-slate-700 dark:text-slate-300",
            bg:    processingCount > 0 ? "bg-blue-50 dark:bg-blue-900/40" : "bg-slate-100 dark:bg-slate-700",
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="p-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {label}
                </p>
                <p className={cn("font-bold font-mono mt-1.5 leading-tight text-[18px]", color)}>
                  {value}
                </p>
              </div>
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", bg)}>
                <Icon className={cn("w-4 h-4", color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Search + filter panel ── */}
      <Card className="shadow-sm">
        <CardContent className="p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              placeholder="Search by reference, user, or description…"
              value={rawSearch}
              onChange={(e) => setRawSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Transaction Type chips */}
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Transaction Type
            </p>
            <div className="flex flex-wrap gap-2">
              {["all", "deposit", "withdrawal", "transfer", "fee", "dividend"].map((t) => (
                <FilterChip
                  key={t}
                  label={t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}
                  active={typeFilter === t}
                  onClick={() => setTypeFilter(t as TypeFilter)}
                />
              ))}
            </div>
          </div>

          {/* Category chips */}
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Category
            </p>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                label="All Categories"
                active={categoryFilter === "all"}
                onClick={() => setCategoryFilter("all")}
              />
              {categories.map((c) => (
                <FilterChip
                  key={c}
                  label={c!.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                  active={categoryFilter === c}
                  onClick={() => setCategoryFilter(c!)}
                />
              ))}
            </div>
          </div>

          {/* Status chips */}
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Status
            </p>
            <div className="flex flex-wrap gap-2">
              {["all", "completed", "processing", "pending", "failed"].map((s) => (
                <FilterChip
                  key={s}
                  label={s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
                  active={statusFilter === s}
                  onClick={() => setStatusFilter(s as StatusFilter)}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Transaction table ── */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Transactions ({filtered.length})
            </CardTitle>
            <Link href="/wallets/transactions">
              <Button variant="outline" size="sm" className="h-7 text-xs">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                {[
                  { label: "Reference",  align: "left" },
                  { label: "User",       align: "left" },
                  { label: "Type",       align: "left" },
                  { label: "Category",   align: "left" },
                  { label: "Method",     align: "left" },
                  { label: "Amount",     align: "right" },
                  { label: "Fee",        align: "right" },
                  { label: "Status",     align: "left" },
                  { label: "Timestamp",  align: "left" },
                  { label: "",           align: "left" },
                ].map(({ label, align }) => (
                  <th
                    key={label}
                    className={cn(
                      "px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide",
                      align === "right" ? "text-right" : "text-left"
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
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400 text-sm">
                    No transactions match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => {
                  const { prefix } = parseRef(tx.ref);
                  return (
                    <tr
                      key={tx.id}
                      className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Reference */}
                      <td className="px-4 py-3">
                        <span className={cn(
                          "font-mono text-xs font-bold px-2 py-1 rounded border",
                          refBadgeClass(tx.ref)
                        )}>
                          {tx.ref}
                        </span>
                      </td>

                      {/* User */}
                      <td className="px-4 py-3">
                        {tx.userId ? (
                          <Link
                            href={`/users/${tx.userId}`}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                          >
                            {tx.user}
                          </Link>
                        ) : (
                          <span className="text-sm text-slate-700 dark:text-slate-300">{tx.user}</span>
                        )}
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3">
                        <TypeBadge type={tx.type} />
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-blue-500 dark:text-blue-400 capitalize">
                          {tx.category ?? "—"}
                        </span>
                      </td>

                      {/* Method */}
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-sm">
                        {tx.method}
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-100">
                        {formatKSh(tx.amount)}
                      </td>

                      {/* Fee */}
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-500 dark:text-slate-400">
                        {tx.fee > 0 ? formatKSh(tx.fee) : "—"}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={tx.status} />
                      </td>

                      {/* Timestamp */}
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {tx.timestamp}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3">
                        {tx.status === "processing" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => handleApprove(tx.id)}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Approve
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Reference legend ── */}
      <div className="flex flex-wrap gap-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide w-full">
          Reference Prefix Legend
        </p>
        {[
          { prefix: "MPE", label: "M-Pesa",          sample: "MPE240413001" },
          { prefix: "BNK", label: "Bank Transfer",   sample: "BNK240413002" },
          { prefix: "CRD", label: "Card",            sample: "CRD240413003" },
          { prefix: "P2P", label: "P2P Transfer",    sample: "P2P240413004" },
          { prefix: "FEE", label: "Platform Fee",    sample: "FEE240413008" },
          { prefix: "DIV", label: "Dividend",        sample: "DIV240413009" },
          { prefix: "WLT", label: "Wallet Transfer", sample: "WLT240413014" },
        ].map(({ sample, label }) => (
          <div key={sample} className="flex items-center gap-1.5 text-xs">
            <span className={cn("font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border", refBadgeClass(sample))}>
              {sample.slice(0, 3)}
            </span>
            <span className="text-slate-500 dark:text-slate-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}