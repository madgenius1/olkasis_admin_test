"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Search, TrendingUp, TrendingDown, Download, BarChart3, DollarSign } from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid,
} from "recharts";

import { MOCK_HOLDINGS } from "../../../../lib/mockData";
import { useDebounce } from "../../../../hooks/useDebounce";
import { formatKSh, cn } from "../../../../lib/utils";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "../../../../components/ui/select";

import type { Holding } from "../../../../types/index";

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
type SectorFilter = "all" | string;
type PLFilter     = "all" | "gainers" | "losers";

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
const SECTOR_COLOURS: Record<string, string> = {
  Banking:   "#1E40AF",
  Telecom:   "#0EA5E9",
  Energy:    "#10B981",
  Insurance: "#8B5CF6",
  Mixed:     "#F59E0B",
  Consumer:  "#EC4899",
};

const TOOLTIP_STYLE: React.CSSProperties = {
  fontSize: 12, borderRadius: 8,
  border: "1px solid #E2E8F0",
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07)",
};

/* ─────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────── */
export default function HoldingsPage() {
  const [rawSearch,    setRawSearch]    = useState("");
  const [sectorFilter, setSectorFilter] = useState<SectorFilter>("all");
  const [plFilter,     setPlFilter]     = useState<PLFilter>("all");

  const search = useDebounce(rawSearch, 250);

  const allSectors = Array.from(new Set(MOCK_HOLDINGS.map((h) => h.sector))).sort();

  /* ── Filtered holdings ── */
  const filtered = useMemo<Holding[]>(() => {
    const q = search.toLowerCase();
    return MOCK_HOLDINGS.filter((h) => {
      const matchSearch =
        !q ||
        h.symbol.toLowerCase().includes(q) ||
        h.name.toLowerCase().includes(q);
      const matchSector = sectorFilter === "all" || h.sector === sectorFilter;
      const matchPL     =
        plFilter === "all" ||
        (plFilter === "gainers" && h.gain >= 0) ||
        (plFilter === "losers"  && h.gain < 0);
      return matchSearch && matchSector && matchPL;
    });
  }, [search, sectorFilter, plFilter]);

  /* ── Aggregates ── */
  const totalValue    = MOCK_HOLDINGS.reduce((s, h) => s + h.value, 0);
  const totalGain     = MOCK_HOLDINGS.reduce((s, h) => s + h.gain,  0);
  const gainCount     = MOCK_HOLDINGS.filter((h) => h.gain >= 0).length;
  const lossCount     = MOCK_HOLDINGS.filter((h) => h.gain < 0).length;
  const totalGainPct  = (totalGain / (totalValue - totalGain)) * 100;

  /* ── Sector breakdown ── */
  const sectorBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    MOCK_HOLDINGS.forEach((h) => {
      map[h.sector] = (map[h.sector] ?? 0) + h.value;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, []);

  /* ── Top holdings bar data ── */
  const topHoldings = [...MOCK_HOLDINGS]
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
    .map((h) => ({ symbol: h.symbol, value: h.value / 1000 }));

  const handleExport = () => {
    const headers = ["Symbol", "Name", "Qty", "Avg Cost", "Current Price", "Value", "Gain", "Gain %", "Sector"];
    const rows    = MOCK_HOLDINGS.map((h) => [
      h.symbol, h.name,
      h.quantity.toString(),
      h.entryPrice.toFixed(2),
      h.currentPrice.toFixed(2),
      h.value.toString(),
      h.gain.toFixed(0),
      h.gainPercent.toFixed(2),
      h.sector,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a   = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `holdings-${new Date().toISOString().slice(0, 10)}.csv`,
    });
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success("Holdings exported");
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            Platform Holdings
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Aggregate portfolio positions across all user accounts
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

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label:  "Total Portfolio Value",
            value:  formatKSh(totalValue),
            color:  "text-blue-700 dark:text-blue-400",
            icon:   DollarSign,
            iconBg: "bg-blue-50 dark:bg-blue-900/40",
          },
          {
            label:  "Unrealised P&L",
            value:  `${totalGain >= 0 ? "+" : ""}${formatKSh(totalGain)}`,
            color:  totalGain >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400",
            icon:   totalGain >= 0 ? TrendingUp : TrendingDown,
            iconBg: totalGain >= 0 ? "bg-emerald-50 dark:bg-emerald-900/40" : "bg-red-50 dark:bg-red-900/40",
          },
          {
            label:  "Overall Return",
            value:  `${totalGainPct >= 0 ? "+" : ""}${totalGainPct.toFixed(1)}%`,
            color:  totalGainPct >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400",
            icon:   BarChart3,
            iconBg: "bg-slate-100 dark:bg-slate-700",
          },
          {
            label:  "Winners / Losers",
            value:  `${gainCount} / ${lossCount}`,
            color:  "text-slate-800 dark:text-slate-100",
            icon:   BarChart3,
            iconBg: "bg-slate-100 dark:bg-slate-700",
          },
        ].map(({ label, value, color, icon: Icon, iconBg }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="p-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {label}
                </p>
                <p className={cn("text-lg font-bold font-mono mt-1.5 leading-tight", color)}>
                  {value}
                </p>
              </div>
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
                <Icon className={cn("w-4 h-4", color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Sector breakdown donut */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-700">
            <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Holdings by Sector
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie
                    data={sectorBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {sectorBreakdown.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={SECTOR_COLOURS[entry.name] ?? "#94A3B8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => {
                      const v = typeof value === "number" ? value : 0;
                      return [formatKSh(v), "Value"];
                    }}
                    contentStyle={TOOLTIP_STYLE}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {sectorBreakdown.map(({ name, value }) => (
                  <div key={name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: SECTOR_COLOURS[name] ?? "#94A3B8" }}
                      />
                      <span className="text-slate-600 dark:text-slate-300">{name}</span>
                    </div>
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-100">
                      {((value / totalValue) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top holdings by value */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-700">
            <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Top Holdings by Value
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={topHoldings}
                layout="vertical"
                margin={{ top: 0, right: 10, bottom: 0, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v}K`}
                />
                <YAxis
                  type="category"
                  dataKey="symbol"
                  tick={{ fontSize: 11, fill: "#64748B", fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                  width={45}
                />
                <Tooltip
                  formatter={(value) => {
                    const v = typeof value === "number" ? value : 0;
                    return [`KES ${(v).toFixed(0)}K`, "Value"];
                  }}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Bar dataKey="value" fill="#1E40AF" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
                placeholder="Search by symbol or company name…"
                value={rawSearch}
                onChange={(e) => setRawSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Select value={sectorFilter} onValueChange={(v) => setSectorFilter(v as SectorFilter)}>
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
            <Select value={plFilter} onValueChange={(v) => setPlFilter(v as PLFilter)}>
              <SelectTrigger className="w-full sm:w-[120px] h-9 text-sm">
                <SelectValue placeholder="P&L" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All P&L</SelectItem>
                <SelectItem value="gainers">Gainers</SelectItem>
                <SelectItem value="losers">Losers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ── Holdings table ── */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700">
          <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100 pb-3">
            All Positions
            <span className="ml-2 text-xs font-normal text-slate-400">
              {filtered.length} holding{filtered.length !== 1 ? "s" : ""}
            </span>
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                {[
                  { label: "Symbol",        align: "left" },
                  { label: "Name",          align: "left" },
                  { label: "Sector",        align: "left" },
                  { label: "Quantity",      align: "right" },
                  { label: "Avg Cost",      align: "right" },
                  { label: "Current Price", align: "right" },
                  { label: "Market Value",  align: "right" },
                  { label: "P&L",           align: "right" },
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
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-sm">
                    No holdings match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((h: Holding) => {
                  const isUp = h.gain >= 0;
                  return (
                    <tr
                      key={h.id}
                      className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-50 text-sm bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                          {h.symbol}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 text-sm">
                        {h.name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded border"
                          style={{
                            backgroundColor: (SECTOR_COLOURS[h.sector] ?? "#94A3B8") + "20",
                            borderColor:     (SECTOR_COLOURS[h.sector] ?? "#94A3B8") + "40",
                            color:            SECTOR_COLOURS[h.sector] ?? "#64748B",
                          }}
                        >
                          {h.sector}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-slate-800 dark:text-slate-100">
                        {h.quantity.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-slate-600 dark:text-slate-400">
                        {h.entryPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {h.currentPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-100">
                        {formatKSh(h.value)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className={cn(
                          "font-mono text-sm font-semibold flex items-center justify-end gap-1",
                          isUp ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                        )}>
                          {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          <div className="text-right">
                            <div>{isUp ? "+" : ""}{formatKSh(Math.abs(h.gain))}</div>
                            <div className="text-[10px] font-normal">
                              ({isUp ? "+" : ""}{h.gainPercent.toFixed(1)}%)
                            </div>
                          </div>
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
    </div>
  );
}