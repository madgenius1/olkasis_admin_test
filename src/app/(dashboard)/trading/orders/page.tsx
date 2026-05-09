"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Search, XCircle, Eye, Download, Filter,
  ArrowUpDown, TrendingUp, TrendingDown,
} from "lucide-react";

import { MOCK_ORDERS } from "../../../../lib/mockData";
import { useDebounce } from "../../../../hooks/useDebounce";
import { usePagination } from "../../../../hooks/usePagination";
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

import type { Order, OrderType, OrderStatus } from "../../../../types/index";

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
type TypeFilter   = "all" | OrderType;
type StatusFilter = "all" | OrderStatus;
type SortKey      = "placedAt" | "value" | "quantity";
type SortDir      = "asc" | "desc";

const PAGE_SIZE = 10;

/* ─────────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────────── */
function TypePill({ type }: { type: OrderType }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded",
      type === "BUY"
        ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
        : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400"
    )}>
      {type === "BUY"
        ? <TrendingUp className="w-3 h-3" />
        : <TrendingDown className="w-3 h-3" />}
      {type}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   ORDER DETAIL MODAL
───────────────────────────────────────────────────────────── */
function OrderDetailModal({
  order,
  onClose,
  onCancel,
}: {
  order:    Order;
  onClose:  () => void;
  onCancel: (id: string) => void;
}) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent size="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Order Detail —{" "}
            <span className="font-mono">{order.id}</span>
          </DialogTitle>
          <DialogDescription>
            {order.user} · {order.stock} · {order.type}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-0">
          {[
            { label: "Order ID",   value: order.id,                  mono: true },
            { label: "User",       value: order.user,                mono: false },
            { label: "Stock",      value: order.stock,               mono: false },
            { label: "Type",       value: order.type,                mono: false },
            { label: "Quantity",   value: order.quantity.toLocaleString(), mono: true },
            { label: "Price",      value: `KES ${order.price.toFixed(2)}`, mono: true },
            { label: "Total Value",value: formatKSh(order.value),   mono: true },
            { label: "Status",     value: order.status,              mono: false },
            { label: "Placed At",  value: order.placedAt,            mono: true },
          ].map(({ label, value, mono }) => (
            <div
              key={label}
              className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0"
            >
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
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          {order.status === "pending" && (
            <Button
              size="sm"
              variant="destructive"
              className="gap-1.5"
              onClick={() => { onCancel(order.id); onClose(); }}
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel Order
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────── */
export default function OrdersPage() {
  const [rawSearch,    setRawSearch]    = useState("");
  const [typeFilter,   setTypeFilter]   = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [stockFilter,  setStockFilter]  = useState("all");
  const [sortKey,      setSortKey]      = useState<SortKey>("placedAt");
  const [sortDir,      setSortDir]      = useState<SortDir>("desc");
  const [detailOrder,  setDetailOrder]  = useState<Order | null>(null);
  const [orders,       setOrders]       = useState<Order[]>(MOCK_ORDERS);
  const [selected,     setSelected]     = useState<string[]>([]);

  const search = useDebounce(rawSearch, 250);

  /* ── Unique stocks for filter ── */
  const stockSymbols = Array.from(new Set(orders.map((o) => o.stock))).sort();

  /* ── Filter + sort ── */
  const filtered = useMemo<Order[]>(() => {
    const q = search.toLowerCase();
    let list = orders.filter((o) => {
      const matchSearch =
        !q ||
        o.user.toLowerCase().includes(q) ||
        o.stock.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q);
      const matchType   = typeFilter   === "all" || o.type   === typeFilter;
      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      const matchStock  = stockFilter  === "all" || o.stock  === stockFilter;
      return matchSearch && matchType && matchStatus && matchStock;
    });

    list = [...list].sort((a, b) => {
      let av: number | string = 0;
      let bv: number | string = 0;
      if (sortKey === "placedAt") { av = a.placedAt; bv = b.placedAt; }
      if (sortKey === "value")    { av = a.value;    bv = b.value; }
      if (sortKey === "quantity") { av = a.quantity; bv = b.quantity; }
      if (av < bv) return sortDir === "asc" ? -1 :  1;
      if (av > bv) return sortDir === "asc" ?  1 : -1;
      return 0;
    });

    return list;
  }, [search, typeFilter, statusFilter, stockFilter, sortKey, sortDir, orders]);

  /* ── Stats ── */
  const pendingCount  = orders.filter((o) => o.status === "pending").length;
  const filledCount   = orders.filter((o) => o.status === "filled").length;
  const totalValue    = orders.reduce((s, o) => s + o.value, 0);
  const buyCount      = orders.filter((o) => o.type === "BUY").length;
  const sellCount     = orders.filter((o) => o.type === "SELL").length;

  /* ── Pagination ── */
  const pag      = usePagination({ total: filtered.length, pageSize: PAGE_SIZE });
  const pageData = pag.paginate(filtered);

  /* ── Selection ── */
  const allSelected  = pageData.length > 0 && selected.length === pageData.length;
  const someSelected = selected.length > 0 && !allSelected;

  const toggleOne = (id: string) =>
    setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const toggleAll = () =>
    setSelected(allSelected ? [] : pageData.map((o) => o.id));

  /* ── Actions ── */
  const cancelOrder = (id: string) => {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: "cancelled" } : o));
    toast.error(`Order ${id} cancelled`);
    setSelected((p) => p.filter((x) => x !== id));
  };

  const bulkCancel = () => {
    const pending = selected.filter((id) => orders.find((o) => o.id === id)?.status === "pending");
    setOrders((prev) => prev.map((o) => pending.includes(o.id) ? { ...o, status: "cancelled" } : o));
    toast.error(`${pending.length} order${pending.length !== 1 ? "s" : ""} cancelled`);
    setSelected([]);
  };

  const handleExport = () => {
    const headers = ["ID", "User", "Stock", "Type", "Qty", "Price", "Value", "Status", "Placed"];
    const rows    = filtered.map((o) => [
      o.id, o.user, o.stock, o.type,
      o.quantity.toString(), o.price.toFixed(2),
      o.value.toString(), o.status, o.placedAt,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a   = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `orders-${new Date().toISOString().slice(0, 10)}.csv`,
    });
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success(`Exported ${filtered.length} orders`);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            Order Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            All platform orders — pending, filled, and cancelled
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {selected.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
              onClick={bulkCancel}
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel ({selected.length})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={handleExport}
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* ── Stat strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Pending",    value: pendingCount,            color: "text-amber-700 dark:text-amber-400" },
          { label: "Filled",     value: filledCount,             color: "text-emerald-700 dark:text-emerald-400" },
          { label: "Total Value",value: formatKSh(totalValue),   color: "text-blue-700 dark:text-blue-400" },
          { label: "Buy / Sell", value: `${buyCount} / ${sellCount}`, color: "text-slate-800 dark:text-slate-100" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {label}
              </p>
              <p className={cn("text-[20px] font-bold font-mono mt-1", color)}>
                {typeof value === "number" ? value.toLocaleString() : value}
              </p>
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
                placeholder="Search by user, stock, or order ID…"
                value={rawSearch}
                onChange={(e) => setRawSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
              <SelectTrigger className="w-full sm:w-[110px] h-9 text-sm">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="BUY">BUY</SelectItem>
                <SelectItem value="SELL">SELL</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-full sm:w-[120px] h-9 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="filled">Filled</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-full sm:w-[110px] h-9 text-sm">
                <SelectValue placeholder="Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stocks</SelectItem>
                {stockSymbols.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ── Orders table ── */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Orders
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
                    aria-label="Select all orders"
                  />
                </th>
                {[
                  { label: "Order ID",  key: null },
                  { label: "User",      key: null },
                  { label: "Stock",     key: null },
                  { label: "Type",      key: null },
                  { label: "Qty",       key: "quantity" as SortKey },
                  { label: "Price",     key: null },
                  { label: "Value",     key: "value" as SortKey },
                  { label: "Status",    key: null },
                  { label: "Placed",    key: "placedAt" as SortKey },
                  { label: "",          key: null },
                ].map(({ label, key }, i) => (
                  <th
                    key={label + i}
                    className={cn(
                      "px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide",
                      i >= 4 && i <= 6 ? "text-right" : "text-left"
                    )}
                  >
                    {key ? (
                      <button
                        onClick={() => toggleSort(key)}
                        className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                      >
                        {label}
                        <ArrowUpDown className={cn(
                          "w-3 h-3",
                          sortKey === key ? "text-blue-600" : "text-slate-300"
                        )} />
                      </button>
                    ) : label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-14 text-center text-slate-400 text-sm">
                    No orders match your filters.
                  </td>
                </tr>
              ) : (
                pageData.map((order) => (
                  <tr
                    key={order.id}
                    className={cn(
                      "border-b border-slate-50 dark:border-slate-700/50 transition-colors",
                      selected.includes(order.id)
                        ? "bg-blue-50/60 dark:bg-blue-900/20"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    )}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(order.id)}
                        onChange={() => toggleOne(order.id)}
                        className="rounded border-slate-300 text-blue-600"
                        aria-label={`Select order ${order.id}`}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400 font-medium">
                      {order.id}
                    </td>
                    <td className="px-4 py-3">
                      {order.userId ? (
                        <Link
                          href={`/users/${order.userId}`}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {order.user}
                        </Link>
                      ) : (
                        <span className="text-sm text-slate-700 dark:text-slate-300">{order.user}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-50">
                      {order.stock}
                    </td>
                    <td className="px-4 py-3">
                      <TypePill type={order.type} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-slate-800 dark:text-slate-100">
                      {order.quantity.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-slate-700 dark:text-slate-300">
                      {order.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-100">
                      {formatKSh(order.value)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {order.placedAt}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7"
                          onClick={() => setDetailOrder(order)}
                          aria-label="View order details"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                        </Button>
                        {order.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => cancelOrder(order.id)}
                          >
                            <XCircle className="w-3 h-3" />
                            Cancel
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

        {/* Pagination footer */}
        {pag.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {pag.rangeLabel("orders")}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={pag.goPrev} disabled={!pag.hasPrev}>Prev</Button>
              <span className="text-xs text-slate-600 dark:text-slate-300 px-3 font-medium">
                {pag.page} / {pag.totalPages}
              </span>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={pag.goNext} disabled={!pag.hasNext}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Order detail modal ── */}
      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          onCancel={cancelOrder}
        />
      )}
    </div>
  );
}