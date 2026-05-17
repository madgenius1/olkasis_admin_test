"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Search, Download, ArrowUpDown, CheckCircle2, Info } from "lucide-react";

import { WALLET_TRANSACTIONS } from "../../../../lib/walletMockData";
import { parseRef, refBadgeClass } from "../../../../lib/txRef";
import { useDebounce } from "../../../../hooks/useDebounce";
import { usePagination } from "../../../../hooks/usePagination";
import { formatKSh, cn } from "../../../../lib/utils";
import { StatusBadge } from "../../../../components/shared/StatusBadge";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Card, CardContent } from "../../../../components/ui/card";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "../../../../components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogBody, DialogFooter,
} from "../../../../components/ui/dialog";

import type { Transaction, TxType, TxStatus, TxMethod } from "../../../../types/index";

type SortKey = "timestamp" | "amount" | "fee";
type SortDir = "asc" | "desc";
const PAGE_SIZE = 12;

function TxDetailModal({ tx, onClose, onApprove }: {
  tx: Transaction; onClose: () => void; onApprove: (id: string) => void;
}) {
  const parsed = parseRef(tx.ref);
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent size="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <span className={cn("font-mono text-xs font-bold px-2 py-1 rounded border", refBadgeClass(tx.ref))}>
              {tx.ref}
            </span>
            <span className="text-base font-semibold text-slate-800 dark:text-slate-100 capitalize">{tx.type}</span>
          </DialogTitle>
          <DialogDescription>{parsed.label} · {tx.user} · {tx.timestamp}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          {[
            { label: "Reference",   value: tx.ref,                            mono: true },
            { label: "User",        value: tx.user,                           mono: false },
            { label: "Type",        value: tx.type,                           mono: false },
            { label: "Category",    value: tx.category ?? "—",               mono: false },
            { label: "Method",      value: tx.method,                         mono: false },
            { label: "Amount",      value: formatKSh(tx.amount),             mono: true },
            { label: "Fee",         value: tx.fee > 0 ? formatKSh(tx.fee) : "No fee", mono: true },
            { label: "Net Amount",  value: formatKSh(tx.amount - tx.fee),    mono: true },
            { label: "Status",      value: tx.status,                         mono: false },
            { label: "Timestamp",   value: tx.timestamp,                      mono: true },
            { label: "Description", value: tx.description ?? "—",            mono: false },
          ].map(({ label, value, mono }) => (
            <div key={label} className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
              <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
              <span className={cn("text-sm font-medium text-slate-800 dark:text-slate-100 capitalize text-right max-w-[220px] truncate", mono && "font-mono")}>
                {value}
              </span>
            </div>
          ))}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          {tx.status === "processing" && (
            <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => { onApprove(tx.id); onClose(); }}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TransactionsPage() {
  const [rawSearch,  setRawSearch]  = useState("");
  const [typeFilter, setTypeFilter] = useState<TxType | "all">("all");
  const [methFilter, setMethFilter] = useState<TxMethod | "all">("all");
  const [statFilter, setStatFilter] = useState<TxStatus | "all">("all");
  const [sortKey,    setSortKey]    = useState<SortKey>("timestamp");
  const [sortDir,    setSortDir]    = useState<SortDir>("desc");
  const [detailTx,   setDetailTx]   = useState<Transaction | null>(null);
  const [txList,     setTxList]     = useState<Transaction[]>(WALLET_TRANSACTIONS);

  const search = useDebounce(rawSearch, 250);

  const filtered = useMemo<Transaction[]>(() => {
    const q = search.toLowerCase();
    let list = txList.filter((t) => {
      const matchSearch = !q || t.ref.toLowerCase().includes(q) ||
        t.user.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q);
      const matchType = typeFilter === "all" || t.type   === typeFilter;
      const matchMeth = methFilter === "all" || t.method === methFilter;
      const matchStat = statFilter === "all" || t.status === statFilter;
      return matchSearch && matchType && matchMeth && matchStat;
    });
    list = [...list].sort((a, b) => {
      const av = sortKey === "timestamp" ? a.timestamp : sortKey === "amount" ? a.amount : a.fee;
      const bv = sortKey === "timestamp" ? b.timestamp : sortKey === "amount" ? b.amount : b.fee;
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ?  1 : -1;
      return 0;
    });
    return list;
  }, [search, typeFilter, methFilter, statFilter, sortKey, sortDir, txList]);

  const pag      = usePagination({ total: filtered.length, pageSize: PAGE_SIZE });
  const pageData = pag.paginate(filtered);

  const handleApprove = (id: string) => {
    setTxList((prev) => prev.map((t) => t.id === id ? { ...t, status: "completed" } : t));
    toast.success("Transaction approved");
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const handleExport = () => {
    const headers = ["Ref", "User", "Type", "Category", "Method", "Amount", "Fee", "Status", "Timestamp"];
    const rows    = filtered.map((t) => [
      t.ref, t.user, t.type, t.category ?? "", t.method,
      t.amount.toString(), t.fee.toString(), t.status, t.timestamp,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a   = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `transactions-${new Date().toISOString().slice(0, 10)}.csv`,
    });
    document.body.appendChild(a); a.click(); a.remove();
    toast.success(`Exported ${filtered.length} transactions`);
  };

  const totalAmount = filtered.reduce((s, t) => s + t.amount, 0);
  const totalFees   = filtered.reduce((s, t) => s + t.fee, 0);

  const COL_HEADERS = [
    { label: "Reference", key: null,        align: "left" },
    { label: "User",      key: null,        align: "left" },
    { label: "Type",      key: null,        align: "left" },
    { label: "Method",    key: null,        align: "left" },
    { label: "Amount",    key: "amount",    align: "right" },
    { label: "Fee",       key: "fee",       align: "right" },
    { label: "Status",    key: null,        align: "left" },
    { label: "Timestamp", key: "timestamp", align: "left" },
    { label: "",          key: null,        align: "left" },
  ] as const;

  return (
    <div className="space-y-5 animate-fade-in">

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            Wallet Transactions
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            All deposits, withdrawals, and transfers
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs shrink-0" onClick={handleExport}>
          <Download className="w-3.5 h-3.5" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input placeholder="Search transactions…" value={rawSearch}
                onChange={(e) => setRawSearch(e.target.value)} className="pl-9 h-9 text-sm" />
            </div>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TxType | "all")}>
              <SelectTrigger className="w-full sm:w-[120px] h-9 text-sm"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="deposit">Deposit</SelectItem>
                <SelectItem value="withdrawal">Withdrawal</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
                <SelectItem value="fee">Fee</SelectItem>
                <SelectItem value="dividend">Dividend</SelectItem>
              </SelectContent>
            </Select>
            <Select value={methFilter} onValueChange={(v) => setMethFilter(v as TxMethod | "all")}>
              <SelectTrigger className="w-full sm:w-[120px] h-9 text-sm"><SelectValue placeholder="Method" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                <SelectItem value="Bank">Bank</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
                <SelectItem value="P2P">P2P</SelectItem>
                <SelectItem value="System">System</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statFilter} onValueChange={(v) => setStatFilter(v as TxStatus | "all")}>
              <SelectTrigger className="w-full sm:w-[120px] h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 px-1">
          <span><span className="font-semibold text-slate-700 dark:text-slate-200">{filtered.length}</span> transactions</span>
          <span>Total: <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{formatKSh(totalAmount)}</span></span>
          <span>Fees: <span className="font-mono font-semibold text-amber-700 dark:text-amber-400">{formatKSh(totalFees)}</span></span>
        </div>
      )}

      {/* Table */}
      <Card className="shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                {COL_HEADERS.map(({ label, key, align }, i) => (
                  <th key={label + i} className={cn(
                    "px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide",
                    align === "right" ? "text-right" : "text-left"
                  )}>
                    {key ? (
                      <button onClick={() => toggleSort(key as SortKey)}
                        className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200">
                        {label}
                        <ArrowUpDown className={cn("w-3 h-3", sortKey === key ? "text-blue-600" : "text-slate-300")} />
                      </button>
                    ) : label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-14 text-center text-slate-400 text-sm">No transactions match your filters.</td></tr>
              ) : pageData.map((tx) => (
                <tr key={tx.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setDetailTx(tx)}
                      className={cn("font-mono text-xs font-bold px-2 py-1 rounded border", refBadgeClass(tx.ref))}
                    >
                      {tx.ref}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {tx.userId ? (
                      <Link href={`/users/${tx.userId}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
                        {tx.user}
                      </Link>
                    ) : (
                      <span className="text-sm text-slate-700 dark:text-slate-300">{tx.user}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-700 dark:text-slate-300 font-medium">{tx.type}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{tx.method}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-100">{formatKSh(tx.amount)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-slate-500 dark:text-slate-400">
                    {tx.fee > 0 ? formatKSh(tx.fee) : "—"}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={tx.status} /></td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{tx.timestamp}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setDetailTx(tx)} aria-label={`Details for ${tx.ref}`}>
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                      </Button>
                      {tx.status === "processing" && (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                          onClick={() => handleApprove(tx.id)}>
                          <CheckCircle2 className="w-3 h-3" /> Approve
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pag.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
            <span className="text-xs text-slate-500 dark:text-slate-400">{pag.rangeLabel("transactions")}</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={pag.goPrev} disabled={!pag.hasPrev}>Prev</Button>
              <span className="text-xs px-3 font-medium text-slate-600 dark:text-slate-300">{pag.page} / {pag.totalPages}</span>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={pag.goNext} disabled={!pag.hasNext}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      {detailTx && <TxDetailModal tx={detailTx} onClose={() => setDetailTx(null)} onApprove={handleApprove} />}
    </div>
  );
}