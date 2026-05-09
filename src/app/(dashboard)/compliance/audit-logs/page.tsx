"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Search, Download, Filter, RefreshCw,
  User, Shield, Settings, TrendingUp, Headphones,
  ChevronDown, Info,
} from "lucide-react";

import { MOCK_AUDIT_LOGS } from "../../../../lib/mockData";
import { useDebounce } from "../../../../hooks/useDebounce";
import { usePagination } from "../../../../hooks/usePagination";
import { cn, initials, avatarColour } from "../../../../lib/utils";
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

import type { AuditLog } from "../../../../types/index";

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
type CategoryFilter = "all" | NonNullable<AuditLog["category"]>;
type AdminFilter    = "all" | string;

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
const PAGE_SIZE = 15;

const CATEGORY_META: Record<
  NonNullable<AuditLog["category"]>,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  user:       { label: "User",       icon: User,       color: "text-blue-600",    bg: "bg-blue-50 dark:bg-blue-900/30" },
  compliance: { label: "Compliance", icon: Shield,     color: "text-red-600",     bg: "bg-red-50 dark:bg-red-900/30" },
  system:     { label: "System",     icon: Settings,   color: "text-purple-600",  bg: "bg-purple-50 dark:bg-purple-900/30" },
  trading:    { label: "Trading",    icon: TrendingUp,  color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/30" },
  support:    { label: "Support",    icon: Headphones,  color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-900/30" },
};

/* Unique admins for filter dropdown */
const UNIQUE_ADMINS = Array.from(
  new Set(MOCK_AUDIT_LOGS.map((l) => l.admin))
).sort();

/* ─────────────────────────────────────────────────────────────
   LOG DETAIL MODAL
───────────────────────────────────────────────────────────── */
function LogDetailModal({
  log,
  onClose,
}: {
  log:     AuditLog;
  onClose: () => void;
}) {
  const cat = log.category ? CATEGORY_META[log.category] : null;
  const Icon = cat?.icon ?? Info;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent size="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            {cat && (
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", cat.bg)}>
                <Icon className={cn("w-3.5 h-3.5", cat.color)} />
              </div>
            )}
            Audit Log — <span className="font-mono">{log.id}</span>
          </DialogTitle>
          <DialogDescription>{log.action}</DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-3">
          {[
            { label: "Log ID",    value: log.id,        mono: true },
            { label: "Admin",     value: log.admin,     mono: false },
            { label: "Action",    value: log.action,    mono: false },
            { label: "Target",    value: log.target,    mono: false },
            { label: "IP Address",value: log.ip,        mono: true },
            { label: "Timestamp", value: log.timestamp, mono: true },
            { label: "Category",  value: cat?.label ?? "—", mono: false },
          ].map(({ label, value, mono }) => (
            <div
              key={label}
              className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0"
            >
              <span className="text-sm text-slate-500 dark:text-slate-400 shrink-0">
                {label}
              </span>
              <span
                className={cn(
                  "text-sm text-slate-800 dark:text-slate-100 text-right",
                  mono && "font-mono"
                )}
              >
                {value}
              </span>
            </div>
          ))}
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(log, null, 2));
              toast.success("Log copied to clipboard");
            }}
          >
            Copy JSON
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────── */
export default function AuditLogsPage() {
  const [rawSearch,      setRawSearch]      = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [adminFilter,    setAdminFilter]    = useState<AdminFilter>("all");
  const [expandedRows,   setExpandedRows]   = useState<Set<string>>(new Set());
  const [detailLog,      setDetailLog]      = useState<AuditLog | null>(null);

  const search = useDebounce(rawSearch, 250);

  /* ── Filter ── */
  const filtered = useMemo<AuditLog[]>(() => {
    const q = search.toLowerCase();
    return MOCK_AUDIT_LOGS.filter((l) => {
      const matchSearch =
        !q ||
        l.id.toLowerCase().includes(q) ||
        l.admin.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.target.toLowerCase().includes(q) ||
        l.ip.includes(q);
      const matchCat   = categoryFilter === "all" || l.category === categoryFilter;
      const matchAdmin = adminFilter    === "all" || l.admin    === adminFilter;
      return matchSearch && matchCat && matchAdmin;
    });
  }, [search, categoryFilter, adminFilter]);

  /* ── Pagination ── */
  const pag      = usePagination({ total: filtered.length, pageSize: PAGE_SIZE });
  const pageData = pag.paginate(filtered);

  /* ── Category counts ── */
  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    MOCK_AUDIT_LOGS.forEach((l) => {
      const c = l.category ?? "unknown";
      counts[c] = (counts[c] ?? 0) + 1;
    });
    return counts;
  }, []);

  /* ── Export ── */
  const handleExport = () => {
    const headers = ["ID", "Admin", "Action", "Target", "IP", "Timestamp", "Category"];
    const rows    = filtered.map((l) => [
      l.id, l.admin, l.action, l.target, l.ip, l.timestamp, l.category ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(","))
      .join("\n");
    const a = Object.assign(document.createElement("a"), {
      href:     URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`,
    });
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success(`Exported ${filtered.length} log entries`);
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            Audit Logs
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Complete audit trail of all admin actions
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

      {/* ── Category summary chips ── */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(CATEGORY_META) as NonNullable<AuditLog["category"]>[]).map((cat) => {
          const meta   = CATEGORY_META[cat];
          const Icon   = meta.icon;
          const count  = catCounts[cat] ?? 0;
          const active = categoryFilter === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(active ? "all" : cat)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                active
                  ? cn(meta.bg, meta.color, "border-transparent shadow-sm")
                  : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300"
              )}
            >
              <Icon className="w-3 h-3" />
              {meta.label}
              <span className={cn(
                "font-bold ml-0.5",
                active ? "opacity-80" : "text-slate-400"
              )}>
                {count}
              </span>
            </button>
          );
        })}
        {categoryFilter !== "all" && (
          <button
            onClick={() => setCategoryFilter("all")}
            className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5"
          >
            Clear ×
          </button>
        )}
      </div>

      {/* ── Search + admin filter bar ── */}
      <Card className="shadow-sm">
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                placeholder="Search by admin, action, or target…"
                value={rawSearch}
                onChange={(e) => setRawSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Select
              value={adminFilter}
              onValueChange={(v) => setAdminFilter(v as AdminFilter)}
            >
              <SelectTrigger className="w-full sm:w-[180px] h-9 text-sm">
                <Filter className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                <SelectValue placeholder="All Admins" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Admins</SelectItem>
                {UNIQUE_ADMINS.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ── Log table ── */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Log Entries
              <span className="ml-2 text-xs font-normal text-slate-400">
                {filtered.length.toLocaleString()} entries
              </span>
            </CardTitle>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                {[
                  { label: "Log ID",     align: "left" },
                  { label: "Admin",      align: "left" },
                  { label: "Category",   align: "left" },
                  { label: "Action",     align: "left" },
                  { label: "Target",     align: "left" },
                  { label: "IP Address", align: "left" },
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
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center text-slate-400 text-sm">
                    No audit logs match your search.
                  </td>
                </tr>
              ) : (
                pageData.map((log) => {
                  const cat  = log.category ? CATEGORY_META[log.category] : null;
                  const Icon = cat?.icon ?? Info;
                  const bg   = avatarColour(log.admin ?? "A");
                  const ini  = initials(log.admin ?? "Admin");

                  return (
                    <tr
                      key={log.id}
                      className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* ID */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-blue-600 dark:text-blue-400 font-medium">
                          {log.id}
                        </span>
                      </td>

                      {/* Admin */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0",
                              bg
                            )}
                          >
                            {ini}
                          </div>
                          <span className="font-medium text-slate-800 dark:text-slate-100 whitespace-nowrap">
                            {log.admin}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        {cat ? (
                          <div
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium",
                              cat.bg,
                              cat.color
                            )}
                          >
                            <Icon className="w-2.5 h-2.5" />
                            {cat.label}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">
                        {log.action}
                      </td>

                      {/* Target */}
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs max-w-[200px] truncate">
                        {log.target}
                      </td>

                      {/* IP */}
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {log.ip}
                      </td>

                      {/* Timestamp */}
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {log.timestamp}
                      </td>

                      {/* Detail button */}
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => setDetailLog(log)}
                          aria-label="View log details"
                        >
                          <Info className="w-3.5 h-3.5 text-slate-400" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {pag.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {pag.rangeLabel("entries")}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={pag.goPrev}
                disabled={!pag.hasPrev}
              >
                Prev
              </Button>
              <span className="text-xs text-slate-600 dark:text-slate-300 px-3 font-medium">
                {pag.page} / {pag.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={pag.goNext}
                disabled={!pag.hasNext}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Log detail modal ── */}
      {detailLog && (
        <LogDetailModal log={detailLog} onClose={() => setDetailLog(null)} />
      )}
    </div>
  );
}