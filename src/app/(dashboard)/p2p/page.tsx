"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeftRight, AlertTriangle, CheckCircle2,
  Clock, TrendingUp, Search, Download, Eye,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

import { P2P_TRANSFERS, P2P_DISPUTES } from "../../../lib/walletMockData";
import { useDebounce } from "../../../hooks/useDebounce";
import { formatKSh, cn } from "../../../lib/utils";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "../../../components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogBody, DialogFooter,
} from "../../../components/ui/dialog";

import type { P2PTransfer } from "../../../types/index";

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
type StatusFilter = "all" | P2PTransfer["status"];

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
const TOOLTIP_STYLE: React.CSSProperties = {
  fontSize: 12, borderRadius: 8,
  border: "1px solid #E2E8F0",
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07)",
};

/* Daily volume mock */
const DAILY_VOLUME = [
  { day: "Mon", volume: 142000 },
  { day: "Tue", volume: 218000 },
  { day: "Wed", volume: 175000 },
  { day: "Thu", volume: 310000 },
  { day: "Fri", volume: 265000 },
  { day: "Sat", volume: 88000 },
  { day: "Sun", volume: 55000 },
];

const STATUS_COLOURS = {
  completed: "#10B981",
  disputed:  "#EF4444",
  pending:   "#F59E0B",
  failed:    "#94A3B8",
};

/* ─────────────────────────────────────────────────────────────
   TRANSFER DETAIL MODAL
───────────────────────────────────────────────────────────── */
function TransferDetailModal({
  transfer,
  onClose,
}: {
  transfer: P2PTransfer;
  onClose:  () => void;
}) {
  const dispute = P2P_DISPUTES.find((d) => d.transferId === transfer.id);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent size="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <ArrowLeftRight className="w-4 h-4 text-sky-600" />
            P2P Transfer — <span className="font-mono">{transfer.id}</span>
          </DialogTitle>
          <DialogDescription>
            {transfer.sender} → {transfer.recipient}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-0">
          {[
            { label: "Transfer ID",    value: transfer.id,                    mono: true },
            { label: "Sender",         value: transfer.sender,                mono: false },
            { label: "Recipient",      value: transfer.recipient,             mono: false },
            { label: "Amount",         value: formatKSh(transfer.amount),     mono: true },
            { label: "Status",         value: transfer.status,                mono: false },
            { label: "Timestamp",      value: transfer.timestamp,             mono: true },
            { label: "Dispute",        value: dispute ? `DIS — ${dispute.id}` : "None", mono: true },
          ].map(({ label, value, mono }) => (
            <div key={label} className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
              <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
              <span className={cn(
                "text-sm font-medium text-slate-800 dark:text-slate-100 capitalize",
                mono && "font-mono"
              )}>
                {value}
              </span>
            </div>
          ))}
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          {transfer.status === "disputed" && (
            <Link href="/p2p/disputes">
              <Button size="sm" className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white">
                <AlertTriangle className="w-3.5 h-3.5" />
                View Dispute
              </Button>
            </Link>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────── */
export default function P2PPage() {
  const [rawSearch,    setRawSearch]    = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [detailTx,     setDetailTx]     = useState<P2PTransfer | null>(null);

  const search = useDebounce(rawSearch, 250);

  /* ── Filter ── */
  const filtered = useMemo<P2PTransfer[]>(() => {
    const q = search.toLowerCase();
    return P2P_TRANSFERS.filter((t) => {
      const matchSearch =
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.sender.toLowerCase().includes(q) ||
        t.recipient.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter]);

  /* ── Stats ── */
  const completedCount = P2P_TRANSFERS.filter((t) => t.status === "completed").length;
  const disputedCount  = P2P_TRANSFERS.filter((t) => t.status === "disputed").length;
  const pendingCount   = P2P_TRANSFERS.filter((t) => t.status === "pending").length;
  const totalVolume    = P2P_TRANSFERS.reduce((s, t) => s + t.amount, 0);

  /* ── Status breakdown for donut ── */
  const statusBreakdown = [
    { name: "Completed", value: completedCount, color: STATUS_COLOURS.completed },
    { name: "Disputed",  value: disputedCount,  color: STATUS_COLOURS.disputed },
    { name: "Pending",   value: pendingCount,   color: STATUS_COLOURS.pending },
    { name: "Failed",    value: P2P_TRANSFERS.filter((t) => t.status === "failed").length, color: STATUS_COLOURS.failed },
  ].filter((s) => s.value > 0);

  /* ── Export ── */
  const handleExport = () => {
    const headers = ["ID", "Sender", "Recipient", "Amount", "Status", "Timestamp"];
    const rows    = filtered.map((t) => [
      t.id, t.sender, t.recipient, t.amount.toString(), t.status, t.timestamp,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a   = Object.assign(document.createElement("a"), {
      href:     URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `p2p-transfers-${new Date().toISOString().slice(0, 10)}.csv`,
    });
    document.body.appendChild(a); a.click(); a.remove();
    toast.success(`Exported ${filtered.length} transfers`);
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            P2P Transfers
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Peer-to-peer transfer overview and dispute tracking
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {disputedCount > 0 && (
            <Link href="/p2p/disputes">
              <Button
                size="sm"
                className="gap-1.5 h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {disputedCount} Dispute{disputedCount > 1 ? "s" : ""}
              </Button>
            </Link>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 text-xs"
            onClick={handleExport}
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total Volume",
            value: formatKSh(totalVolume),
            color: "text-blue-700 dark:text-blue-400",
            icon:  TrendingUp,
            bg:    "bg-blue-50 dark:bg-blue-900/40",
          },
          {
            label: "Completed",
            value: String(completedCount),
            color: "text-emerald-700 dark:text-emerald-400",
            icon:  CheckCircle2,
            bg:    "bg-emerald-50 dark:bg-emerald-900/40",
          },
          {
            label: "Pending",
            value: String(pendingCount),
            color: pendingCount > 0
              ? "text-amber-700 dark:text-amber-400"
              : "text-slate-600 dark:text-slate-400",
            icon:  Clock,
            bg:    pendingCount > 0
              ? "bg-amber-50 dark:bg-amber-900/40"
              : "bg-slate-100 dark:bg-slate-700",
          },
          {
            label: "Open Disputes",
            value: String(disputedCount),
            color: disputedCount > 0
              ? "text-red-700 dark:text-red-400"
              : "text-emerald-700 dark:text-emerald-400",
            icon:  AlertTriangle,
            bg:    disputedCount > 0
              ? "bg-red-50 dark:bg-red-900/40"
              : "bg-emerald-50 dark:bg-emerald-900/40",
          },
        ].map(({ label, value, color, icon: Icon, bg }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="p-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {label}
                </p>
                <p className={cn("text-[20px] font-bold font-mono mt-1.5 leading-tight", color)}>
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

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Daily volume bar chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-700">
            <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Daily P2P Volume (This Week)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={DAILY_VOLUME} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  formatter={(value) => {
                    const v = typeof value === "number" ? value : 0;
                    return [formatKSh(v), "Volume"];
                  }}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Bar dataKey="volume" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status breakdown donut */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-700">
            <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Transfer Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={110}>
                <PieChart>
                  <Pie
                    data={statusBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={32}
                    outerRadius={50}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => {
                      const v = typeof value === "number" ? value : 0;
                      return [v, "transfers"];
                    }}
                    contentStyle={TOOLTIP_STYLE}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 w-full mt-1">
                {statusBreakdown.map(({ name, value, color }) => (
                  <div key={name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-slate-600 dark:text-slate-300">{name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Filter bar ── */}
      <Card className="shadow-sm">
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                placeholder="Search by transfer ID, sender, or recipient…"
                value={rawSearch}
                onChange={(e) => setRawSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="w-full sm:w-[140px] h-9 text-sm">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ── Transfers table ── */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Recent Transfers
              <span className="ml-2 text-xs font-normal text-slate-400">
                {filtered.length} transfer{filtered.length !== 1 ? "s" : ""}
              </span>
            </CardTitle>
            <Link href="/p2p/disputes">
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-amber-700 border-amber-200 hover:bg-amber-50">
                <AlertTriangle className="w-3 h-3" />
                Disputes ({P2P_DISPUTES.filter((d) => d.status !== "resolved").length})
              </Button>
            </Link>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                {[
                  { label: "Transfer ID", align: "left" },
                  { label: "Sender",      align: "left" },
                  { label: "Recipient",   align: "left" },
                  { label: "Amount",      align: "right" },
                  { label: "Status",      align: "left" },
                  { label: "Timestamp",   align: "left" },
                  { label: "",            align: "left" },
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
                  <td colSpan={7} className="px-4 py-14 text-center text-slate-400 text-sm">
                    No transfers match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => {
                  const hasDispute = P2P_DISPUTES.some((d) => d.transferId === tx.id);
                  return (
                    <tr
                      key={tx.id}
                      className={cn(
                        "border-b border-slate-50 dark:border-slate-700/50 transition-colors",
                        tx.status === "disputed"
                          ? "bg-red-50/30 dark:bg-red-900/10"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      )}
                    >
                      {/* Transfer ID */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-800 px-2 py-0.5 rounded">
                            {tx.id}
                          </span>
                          {hasDispute && (
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded-full">
                              Disputed
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Sender */}
                      <td className="px-4 py-3">
                        {tx.senderId ? (
                          <Link
                            href={`/users/${tx.senderId}`}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                          >
                            {tx.sender}
                          </Link>
                        ) : (
                          <span className="text-sm text-slate-700 dark:text-slate-300">{tx.sender}</span>
                        )}
                      </td>

                      {/* Recipient */}
                      <td className="px-4 py-3">
                        {tx.recipientId ? (
                          <Link
                            href={`/users/${tx.recipientId}`}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                          >
                            {tx.recipient}
                          </Link>
                        ) : (
                          <span className="text-sm text-slate-700 dark:text-slate-300">{tx.recipient}</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-100">
                        {formatKSh(tx.amount)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={tx.status} />
                      </td>

                      {/* Timestamp */}
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {tx.timestamp}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7"
                            onClick={() => setDetailTx(tx)}
                            aria-label={`View details for ${tx.id}`}
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                          </Button>
                          {tx.status === "disputed" && (
                            <Link href="/p2p/disputes">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <AlertTriangle className="w-3 h-3" />
                                Review
                              </Button>
                            </Link>
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

      {detailTx && (
        <TransferDetailModal transfer={detailTx} onClose={() => setDetailTx(null)} />
      )}
    </div>
  );
}