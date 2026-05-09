"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertCircle, TrendingUp, TrendingDown, ArrowRight,
  RefreshCw, BarChart3, Activity, Layers, GitMerge,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line,
} from "recharts";

import {
  MOCK_ORDERS, MOCK_VOLUME_DATA, MOCK_NSE_STOCKS,
  MOCK_NSE_OPTIONS,
} from "../../../lib/mockData";
import { formatKSh, cn } from "../../../lib/utils";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";

import type { NSEStock, Order } from "../../../types/index";

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
interface NSEEtf {
  symbol:        string;
  name:          string;
  nav:           number;
  changePercent: number;
  aum:           number;
  expense:       number;
  sector:        string;
}

/* ─────────────────────────────────────────────────────────────
   MOCK DATA — ETFs (not in original mockData, added here)
───────────────────────────────────────────────────────────── */
const MOCK_NSE_ETFS: NSEEtf[] = [
  { symbol: "NASI",    name: "NSE All-Share Index ETF",  nav: 145.80, changePercent:  1.6, aum: 2_850_000_000, expense: 0.25, sector: "Mixed" },
  { symbol: "NBANK",   name: "NSE Banking Sector ETF",   nav:  98.50, changePercent:  1.9, aum: 1_950_000_000, expense: 0.30, sector: "Banking" },
  { symbol: "NENERGY", name: "NSE Energy Sector ETF",    nav:  72.40, changePercent: -0.7, aum: 1_440_000_000, expense: 0.35, sector: "Energy" },
  { symbol: "NINSURE", name: "NSE Insurance Sector ETF", nav:  56.20, changePercent:  1.3, aum: 1_120_000_000, expense: 0.30, sector: "Insurance" },
];

const TOOLTIP_STYLE: React.CSSProperties = {
  fontSize: 12, borderRadius: 8,
  border: "1px solid #E2E8F0",
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07)",
};

/* ─────────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────────── */

/* Type pill — BUY / SELL */
function TypePill({ type }: { type: "BUY" | "SELL" }) {
  return (
    <span className={cn(
      "text-xs font-bold px-2 py-0.5 rounded",
      type === "BUY"
        ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
        : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400"
    )}>
      {type}
    </span>
  );
}

/* Change cell with arrow icon */
function ChangeCell({ pct }: { pct: number }) {
  const up = pct >= 0;
  return (
    <div className={cn(
      "flex items-center justify-end gap-1 font-mono text-sm font-semibold",
      up ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
    )}>
      {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
      {up ? "+" : ""}{pct.toFixed(2)}%
    </div>
  );
}

/* Sector badge */
function SectorBadge({ sector }: { sector: string }) {
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800">
      {sector}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────── */
export default function TradingPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [halted, setHalted]       = useState(false);

  const pendingOrders = MOCK_ORDERS.filter((o) => o.status === "pending").length;
  const filledOrders  = MOCK_ORDERS.filter((o) => o.status === "filled").length;

  const handleHalt = () => {
    setHalted((h) => !h);
    if (!halted) {
      toast.error("🛑 Emergency trading halt activated! All pending orders frozen.");
    } else {
      toast.success("✅ Trading resumed. Market operations restored.");
    }
  };

  /* Top movers */
  const topGainers = [...MOCK_NSE_STOCKS]
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 3);
  const topLosers  = [...MOCK_NSE_STOCKS]
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 3);

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            Trading Overview
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Live order book, market data, and NSE breakdown
          </p>
        </div>
        <Button
          size="sm"
          className={cn(
            "gap-1.5 h-8 text-xs shrink-0",
            halted
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
          )}
          onClick={handleHalt}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          {halted ? "Resume Trading" : "Emergency Halt"}
        </Button>
      </div>

      {/* ── Halt banner ── */}
      {halted && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 animate-pulse" />
          <p className="text-sm font-semibold text-red-800 dark:text-red-300">
            🛑 Trading is currently halted — all new order placement is blocked. Click "Resume Trading" to restore.
          </p>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Pending Orders", value: String(pendingOrders), color: "text-amber-700 dark:text-amber-400",  href: "/trading/orders" },
          { label: "Filled Today",   value: String(filledOrders),  color: "text-emerald-700 dark:text-emerald-400", href: "/trading/orders" },
          { label: "Daily Volume",   value: "Ksh. 142.3M",         color: "text-blue-700 dark:text-blue-400",   href: null },
          { label: "Buy/Sell Ratio", value: "58% / 42%",           color: "text-slate-800 dark:text-slate-100", href: null },
        ].map(({ label, value, color, href }) => (
          <Card key={label} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {label}
              </p>
              <p className={cn("text-[22px] font-bold font-mono mt-1.5", color)}>
                {value}
              </p>
              {href && (
                <Link
                  href={href}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
                >
                  View orders →
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 h-9">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="stocks"   className="text-xs">Stocks</TabsTrigger>
          <TabsTrigger value="etfs"     className="text-xs">ETFs</TabsTrigger>
          <TabsTrigger value="options"  className="text-xs">Options</TabsTrigger>
        </TabsList>

        {/* ── Overview tab ── */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Live order book */}
            <Card className="shadow-sm overflow-hidden">
              <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Live Order Book
                  </CardTitle>
                  <Link href="/trading/orders">
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
                      {["User", "Stock", "Type", "Value", "Status"].map((h, i) => (
                        <th
                          key={h}
                          className={cn(
                            "px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide",
                            i === 3 ? "text-right" : "text-left"
                          )}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_ORDERS.map((o: Order) => (
                      <tr
                        key={o.id}
                        className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 text-xs">{o.user}</td>
                        <td className="px-4 py-2.5 font-mono font-bold text-slate-900 dark:text-slate-50">{o.stock}</td>
                        <td className="px-4 py-2.5"><TypePill type={o.type} /></td>
                        <td className="px-4 py-2.5 text-right font-mono text-xs text-slate-800 dark:text-slate-100">
                          {formatKSh(o.value)}
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={o.status} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Weekly trade volume */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-700">
                <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Weekly Trade Volume
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={MOCK_VOLUME_DATA}
                    margin={{ top: 5, right: 5, bottom: 5, left: -15 }}
                  >
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
                      tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}M`}
                    />
                    <Tooltip
                      formatter={(value) => {
                        const v = typeof value === "number" ? value : 0;
                        return [`KES ${(v / 1_000_000).toFixed(1)}M`, "Volume"];
                      }}
                      contentStyle={TOOLTIP_STYLE}
                    />
                    <Bar dataKey="volume" fill="#1E40AF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* NSE movers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700">
                <CardTitle className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 pb-3 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Top Gainers
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {topGainers.map((s: NSEStock) => (
                  <div
                    key={s.symbol}
                    className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0"
                  >
                    <div>
                      <span className="font-mono font-bold text-sm text-slate-800 dark:text-slate-100">
                        {s.symbol}
                      </span>
                      <span className="text-xs text-slate-400 ml-2">{s.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm text-slate-800 dark:text-slate-100">
                        KES {s.price.toFixed(2)}
                      </div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                        +{s.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700">
                <CardTitle className="text-sm font-semibold text-red-700 dark:text-red-400 pb-3 flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5" />
                  Top Losers
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {topLosers.map((s: NSEStock) => (
                  <div
                    key={s.symbol}
                    className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0"
                  >
                    <div>
                      <span className="font-mono font-bold text-sm text-slate-800 dark:text-slate-100">
                        {s.symbol}
                      </span>
                      <span className="text-xs text-slate-400 ml-2">{s.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm text-slate-800 dark:text-slate-100">
                        KES {s.price.toFixed(2)}
                      </div>
                      <div className="text-xs text-red-600 dark:text-red-400 font-semibold">
                        {s.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[
              { label: "View Holdings",  sub: "Portfolio positions & P&L",  href: "/trading/holdings",     icon: BarChart3 },
              { label: "Market Data",    sub: "NSE quotes & order book",    href: "/trading/market-data",  icon: Activity },
              { label: "All Orders",     sub: "Complete order history",      href: "/trading/orders",       icon: Layers },
              { label: "Derivatives",    sub: "Options, futures & margin",  href: "/trading/derivatives",  icon: GitMerge },
            ].map(({ label, sub, href, icon: Icon }) => (
              <Link key={href} href={href}>
                <Card className="shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer transition-all">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{sub}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 ml-auto shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>

        {/* ── Stocks tab ── */}
        <TabsContent value="stocks" className="mt-4">
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700">
              <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100 pb-3">
                NSE Listed Stocks
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                    {["Symbol", "Company", "Price", "Change", "Volume", "Market Cap", "Sector"].map((h, i) => (
                      <th
                        key={h}
                        className={cn(
                          "px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide",
                          i >= 2 && i <= 5 ? "text-right" : "text-left"
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_NSE_STOCKS.map((stock) => (
                    <tr
                      key={stock.symbol}
                      className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-50">
                        {stock.symbol}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
                        {stock.name}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-slate-800 dark:text-slate-100">
                        KES {stock.price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <ChangeCell pct={stock.changePercent} />
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-600 dark:text-slate-400">
                        {(stock.volume / 1_000_000).toFixed(1)}M
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-600 dark:text-slate-400">
                        KES {(stock.marketCap / 1_000_000_000).toFixed(1)}B
                      </td>
                      <td className="px-4 py-3">
                        <SectorBadge sector={stock.sector} />
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
                NSE ETFs
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                    {["Symbol", "Name", "NAV", "Change", "AUM", "Expense Ratio", "Sector"].map((h, i) => (
                      <th
                        key={h}
                        className={cn(
                          "px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide",
                          i >= 2 && i <= 5 ? "text-right" : "text-left"
                        )}
                      >
                        {h}
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
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-50">
                        {etf.symbol}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">{etf.name}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-slate-800 dark:text-slate-100">
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
        <TabsContent value="options" className="mt-4">
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700">
              <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100 pb-3">
                NSE Options Contracts
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                    {["Contract", "Type", "Strike", "Expiry", "Bid", "Ask", "Volume", "OI", "IV"].map((h, i) => (
                      <th
                        key={h}
                        className={cn(
                          "px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide",
                          i >= 2 ? "text-right" : "text-left"
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_NSE_OPTIONS.map((opt) => (
                    <tr
                      key={opt.symbol}
                      className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                        {opt.symbol}
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
                        KES {opt.strikePrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-slate-500 dark:text-slate-400">
                        {opt.expiry}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-700 dark:text-emerald-400 font-medium">
                        {opt.bid.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-red-700 dark:text-red-400 font-medium">
                        {opt.ask.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-600 dark:text-slate-400">
                        {(opt.volume / 1000).toFixed(0)}K
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-600 dark:text-slate-400">
                        {(opt.openInterest / 1000).toFixed(0)}K
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                        {(opt.impliedVol * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}