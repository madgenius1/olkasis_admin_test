"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Search, TrendingUp, TrendingDown, RefreshCw,
  BarChart3, Activity, Layers, Info,
} from "lucide-react";

import {
  MOCK_NSE_STOCKS, MOCK_NSE_OPTIONS,
} from "../../../../lib/mockData";
import { useDebounce } from "../../../../hooks/useDebounce";
import { cn, formatKSh } from "../../../../lib/utils";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../../components/ui/tabs";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "../../../../../components/ui/select";
import {../../../../lib/mockData
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogBody, DialogFooter,
} from "../../../../components/ui/dialog";

import type { NSEStock, NSEOption } from "../../../../types/index";

/* ─────────────────────────────────────────────────────────────
   MOCK ETFs (local — matches trading/page.tsx)
───────────────────────────────────────────────────────────── */
interface NSEEtf {
  symbol: string; name: string; nav: number; changePercent: number;
  aum: number; expense: number; sector: string;
}

const MOCK_NSE_ETFS: NSEEtf[] = [
  { symbol: "NASI",    name: "NSE All-Share Index ETF",  nav: 145.80, changePercent:  1.6, aum: 2_850_000_000, expense: 0.25, sector: "Mixed" },
  { symbol: "NBANK",   name: "NSE Banking Sector ETF",   nav:  98.50, changePercent:  1.9, aum: 1_950_000_000, expense: 0.30, sector: "Banking" },
  { symbol: "NENERGY", name: "NSE Energy Sector ETF",    nav:  72.40, changePercent: -0.7, aum: 1_440_000_000, expense: 0.35, sector: "Energy" },
  { symbol: "NINSURE", name: "NSE Insurance Sector ETF", nav:  56.20, changePercent:  1.3, aum: 1_120_000_000, expense: 0.30, sector: "Insurance" },
];

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
type SectorFilter = "all" | string;
type ChangeFilter = "all" | "gainers" | "losers";
type OptionType   = "all" | "CALL" | "PUT";

const SECTOR_COLOURS: Record<string, string> = {
  Banking: "#1E40AF", Telecom: "#0EA5E9", Energy: "#10B981",
  Insurance: "#8B5CF6", Mixed: "#F59E0B", Consumer: "#EC4899",
};

const TOOLTIP_STYLE: React.CSSProperties = {
  fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0",
};

/* ─────────────────────────────────────────────────────────────
   STOCK DETAIL DRAWER
───────────────────────────────────────────────────────────── */
function StockDetailModal({ stock, onClose }: { stock: NSEStock; onClose: () => void }) {
  const isUp = stock.changePercent >= 0;
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent size="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <span className="font-mono font-black text-slate-900 dark:text-slate-50 text-lg">
              {stock.symbol}
            </span>
            <span className={cn(
              "text-sm font-bold",
              isUp ? "text-emerald-600" : "text-red-600"
            )}>
              {isUp ? "+" : ""}{stock.changePercent.toFixed(2)}%
            </span>
          </DialogTitle>
          <DialogDescription>{stock.name} · {stock.sector}</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-0">
          {[
            { label: "Current Price",    value: `KES ${stock.price.toFixed(2)}`, mono: true },
            { label: "Change (Today)",   value: `${isUp ? "+" : ""}KES ${stock.change.toFixed(2)} (${stock.changePercent.toFixed(2)}%)`, mono: true },
            { label: "Volume (Today)",   value: `${(stock.volume / 1_000_000).toFixed(2)}M shares`, mono: true },
            { label: "Market Cap",       value: `KES ${(stock.marketCap / 1_000_000_000).toFixed(2)}B`, mono: true },
            { label: "P/E Ratio",        value: stock.pe.toFixed(1), mono: true },
            { label: "Dividend Yield",   value: `KES ${stock.dividend.toFixed(2)} per share`, mono: true },
            { label: "Sector",           value: stock.sector, mono: false },
          ].map(({ label, value, mono }) => (
            <div
              key={label}
              className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0"
            >
              <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
              <span className={cn(
                "text-sm font-medium text-slate-800 dark:text-slate-100",
                mono && "font-mono"
              )}>
                {value}
              </span>
            </div>
          ))}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          <Button
            size="sm"
            className="gap-1.5 bg-blue-700 hover:bg-blue-800"
            onClick={() => { toast.info(`Viewing orders for ${stock.symbol}`); onClose(); }}
          >
            <Activity className="w-3.5 h-3.5" />
            View Orders
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────────────────
   CHANGE CELL
───────────────────────────────────────────────────────────── */
function ChangeCell({ pct, abs }: { pct: number; abs?: number }) {
  const up = pct >= 0;
  return (
    <div className={cn(
      "flex items-center justify-end gap-1 font-mono text-sm font-semibold",
      up ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
    )}>
      {up ? <TrendingUp className="w-3.5 h-3.5 shrink-0" /> : <TrendingDown className="w-3.5 h-3.5 shrink-0" />}
      <div className="text-right">
        {abs !== undefined && (
          <div className="text-[10px] font-normal">
            {up ? "+" : ""}{abs.toFixed(2)}
          </div>
        )}
        <div>{up ? "+" : ""}{pct.toFixed(2)}%</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SECTOR BADGE
───────────────────────────────────────────────────────────── */
function SectorBadge({ sector }: { sector: string }) {
  const colour = SECTOR_COLOURS[sector] ?? "#94A3B8";
  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded border"
      style={{
        backgroundColor: colour + "18",
        borderColor:     colour + "40",
        color:           colour,
      }}
    >
      {sector}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────── */
export default function MarketDataPage() {
  const [activeTab,    setActiveTab]    = useState("stocks");
  const [rawSearch,    setRawSearch]    = useState("");
  const [sectorFilter, setSectorFilter] = useState<SectorFilter>("all");
  const [changeFilter, setChangeFilter] = useState<ChangeFilter>("all");
  const [optionType,   setOptionType]   = useState<OptionType>("all");
  const [underlying,   setUnderlying]   = useState("all");
  const [detailStock,  setDetailStock]  = useState<NSEStock | null>(null);
  const [refreshing,   setRefreshing]   = useState(false);

  const search = useDebounce(rawSearch, 250);

  const allSectors    = Array.from(new Set(MOCK_NSE_STOCKS.map((s) => s.sector))).sort();
  const allUnderlying = Array.from(new Set(MOCK_NSE_OPTIONS.map((o) => o.underlying))).sort();

  /* ── Filtered stocks ── */
  const filteredStocks = useMemo<NSEStock[]>(() => {
    const q = search.toLowerCase();
    return MOCK_NSE_STOCKS.filter((s) => {
      const matchSearch =
        !q || s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
      const matchSector = sectorFilter === "all" || s.sector === sectorFilter;
      const matchChange =
        changeFilter === "all" ||
        (changeFilter === "gainers" && s.changePercent >= 0) ||
        (changeFilter === "losers"  && s.changePercent < 0);
      return matchSearch && matchSector && matchChange;
    });
  }, [search, sectorFilter, changeFilter]);

  /* ── Filtered options ── */
  const filteredOptions = useMemo<NSEOption[]>(() => {
    const q = search.toLowerCase();
    return MOCK_NSE_OPTIONS.filter((o) => {
      const matchSearch  = !q || o.symbol.toLowerCase().includes(q) || o.underlying.toLowerCase().includes(q);
      const matchType    = optionType  === "all" || o.type       === optionType;
      const matchUnderly = underlying  === "all" || o.underlying === underlying;
      return matchSearch && matchType && matchUnderly;
    });
  }, [search, optionType, underlying]);

  /* ── Market summary ── */
  const gainers = MOCK_NSE_STOCKS.filter((s) => s.changePercent >= 0).length;
  const losers  = MOCK_NSE_STOCKS.filter((s) => s.changePercent < 0).length;
  const avgChange = MOCK_NSE_STOCKS.reduce((s, x) => s + x.changePercent, 0) / MOCK_NSE_STOCKS.length;
  const totalVol  = MOCK_NSE_STOCKS.reduce((s, x) => s + x.volume, 0);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); toast.success("Market data refreshed"); }, 900);
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            NSE Market Data
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Real-time Nairobi Securities Exchange quotes, ETFs, and options
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Live
          </div>
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

      {/* ── Market summary strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Listed Stocks", value: `${MOCK_NSE_STOCKS.length}`, color: "text-slate-800 dark:text-slate-100" },
          { label: "Gainers / Losers", value: `${gainers} / ${losers}`, color: gainers > losers ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400" },
          { label: "Avg Change", value: `${avgChange >= 0 ? "+" : ""}${avgChange.toFixed(2)}%`, color: avgChange >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400" },
          { label: "Total Volume", value: `${(totalVol / 1_000_000).toFixed(1)}M`, color: "text-blue-700 dark:text-blue-400" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {label}
              </p>
              <p className={cn("text-[20px] font-bold font-mono mt-1", color)}>
                {value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between gap-4">
          <TabsList className="h-9">
            <TabsTrigger value="stocks"  className="gap-1.5 text-xs">
              <BarChart3 className="w-3.5 h-3.5" />
              Stocks ({MOCK_NSE_STOCKS.length})
            </TabsTrigger>
            <TabsTrigger value="etfs"    className="gap-1.5 text-xs">
              <Layers className="w-3.5 h-3.5" />
              ETFs ({MOCK_NSE_ETFS.length})
            </TabsTrigger>
            <TabsTrigger value="options" className="gap-1.5 text-xs">
              <Activity className="w-3.5 h-3.5" />
              Options ({MOCK_NSE_OPTIONS.length})
            </TabsTrigger>
          </TabsList>

          {/* Search always visible */}
          <div className="relative w-52 hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              placeholder="Search…"
              value={rawSearch}
              onChange={(e) => setRawSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        {/* ── Stocks tab ── */}
        <TabsContent value="stocks" className="mt-4 space-y-3">
          {/* Stocks filter bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 sm:hidden">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                placeholder="Search stocks…"
                value={rawSearch}
                onChange={(e) => setRawSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Select value={sectorFilter} onValueChange={(v) => setSectorFilter(v)}>
              <SelectTrigger className="w-full sm:w-[130px] h-9 text-sm">
                <SelectValue placeholder="Sector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                {allSectors.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={changeFilter} onValueChange={(v) => setChangeFilter(v as ChangeFilter)}>
              <SelectTrigger className="w-full sm:w-[120px] h-9 text-sm">
                <SelectValue placeholder="Movement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="gainers">Gainers</SelectItem>
                <SelectItem value="losers">Losers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                    {[
                      { label: "Symbol",     align: "left" },
                      { label: "Company",    align: "left" },
                      { label: "Price",      align: "right" },
                      { label: "Change",     align: "right" },
                      { label: "Volume",     align: "right" },
                      { label: "Market Cap", align: "right" },
                      { label: "P/E",        align: "right" },
                      { label: "Dividend",   align: "right" },
                      { label: "Sector",     align: "left" },
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
                  {filteredStocks.map((stock) => (
                    <tr
                      key={stock.symbol}
                      className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => setDetailStock(stock)}
                    >
                      <td className="px-4 py-3 font-mono font-black text-slate-900 dark:text-slate-50">
                        {stock.symbol}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs max-w-[180px] truncate">
                        {stock.name}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-100">
                        {stock.price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <ChangeCell pct={stock.changePercent} abs={stock.change} />
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-600 dark:text-slate-400">
                        {(stock.volume / 1_000_000).toFixed(1)}M
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-600 dark:text-slate-400">
                        {(stock.marketCap / 1_000_000_000).toFixed(1)}B
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                        {stock.pe.toFixed(1)}x
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-600 dark:text-slate-400">
                        {stock.dividend.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <SectorBadge sector={stock.sector} />
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7"
                          onClick={(e) => { e.stopPropagation(); setDetailStock(stock); }}
                          aria-label={`View ${stock.symbol} details`}
                        >
                          <Info className="w-3.5 h-3.5 text-slate-400" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ── ETFs tab ── */}
        <TabsContent value="etfs" className="mt-4">
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700">
              <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100 pb-3">
                NSE Exchange-Traded Funds
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                    {[
                      { label: "Symbol",        align: "left" },
                      { label: "Name",          align: "left" },
                      { label: "NAV",           align: "right" },
                      { label: "Change",        align: "right" },
                      { label: "AUM",           align: "right" },
                      { label: "Expense Ratio", align: "right" },
                      { label: "Sector",        align: "left" },
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
                  {MOCK_NSE_ETFS.map((etf) => (
                    <tr
                      key={etf.symbol}
                      className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-black text-slate-900 dark:text-slate-50">
                        {etf.symbol}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">{etf.name}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-100">
                        KES {etf.nav.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <ChangeCell pct={etf.changePercent} />
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-600 dark:text-slate-400">
                        KES {(etf.aum / 1_000_000_000).toFixed(2)}B
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-400">
                        {etf.expense.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3">
                        <SectorBadge sector={etf.sector} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ── Options tab ── */}
        <TabsContent value="options" className="mt-4 space-y-3">
          {/* Options filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={underlying} onValueChange={setUnderlying}>
              <SelectTrigger className="w-full sm:w-[140px] h-9 text-sm">
                <SelectValue placeholder="Underlying" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Underlyings</SelectItem>
                {allUnderlying.map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={optionType} onValueChange={(v) => setOptionType(v as OptionType)}>
              <SelectTrigger className="w-full sm:w-[110px] h-9 text-sm">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">CALL + PUT</SelectItem>
                <SelectItem value="CALL">CALL only</SelectItem>
                <SelectItem value="PUT">PUT only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700">
              <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100 pb-3">
                NSE Options Chain
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                    {[
                      { label: "Contract",      align: "left" },
                      { label: "Underlying",    align: "left" },
                      { label: "Type",          align: "left" },
                      { label: "Strike",        align: "right" },
                      { label: "Expiry",        align: "right" },
                      { label: "Bid",           align: "right" },
                      { label: "Ask",           align: "right" },
                      { label: "Spread",        align: "right" },
                      { label: "Volume",        align: "right" },
                      { label: "Open Interest", align: "right" },
                      { label: "IV",            align: "right" },
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
                  {filteredOptions.map((opt) => {
                    const spread = opt.ask - opt.bid;
                    return (
                      <tr
                        key={opt.symbol}
                        className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                          {opt.symbol}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-100">
                          {opt.underlying}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "text-xs font-bold px-2 py-0.5 rounded",
                            opt.type === "CALL"
                              ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                              : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                          )}>
                            {opt.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                          {opt.strikePrice.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-slate-500 dark:text-slate-400">
                          {opt.expiry}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                          {opt.bid.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-red-700 dark:text-red-400">
                          {opt.ask.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-slate-500 dark:text-slate-400">
                          {spread.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-slate-600 dark:text-slate-400">
                          {(opt.volume / 1000).toFixed(0)}K
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-slate-600 dark:text-slate-400">
                          {(opt.openInterest / 1000).toFixed(0)}K
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={cn(
                            "font-mono text-sm font-semibold",
                            opt.impliedVol > 0.3
                              ? "text-red-600 dark:text-red-400"
                              : opt.impliedVol > 0.25
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          )}>
                            {(opt.impliedVol * 100).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Options legend */}
          <div className="flex flex-wrap items-center gap-4 px-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              IV &lt; 25% — Low volatility
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              IV 25–30% — Moderate
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              IV &gt; 30% — High volatility
            </span>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Stock detail modal ── */}
      {detailStock && (
        <StockDetailModal stock={detailStock} onClose={() => setDetailStock(null)} />
      )}
    </div>
  );
}