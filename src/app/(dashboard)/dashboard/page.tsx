"use client";

import { useState, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Users, TrendingUp, DollarSign, Activity,
  ArrowUpRight, ArrowDownRight, RefreshCw,
  CheckCircle2, AlertTriangle, Clock, Zap,
  ShieldCheck, Headphones,
} from "lucide-react";
import {
  MOCK_REVENUE_DATA,
  MOCK_USER_GROWTH,
  MOCK_VOLUME_DATA,
} from "../../../lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import type { Metadata } from "next";
import type {
  RevenueDataPoint,
} from "../../../types/index";

/* ─────────────────────────────────────────────────────────────
   TYPE DEFINITIONS
───────────────────────────────────────────────────────────── */
type HealthStatus = "good" | "warning" | "critical";
type ChangeType   = "up" | "down" | "neutral";
type ActivityType = "kyc" | "alert" | "user" | "trade" | "ticket";
type Period       = "7d" | "1m" | "ytd";

interface KpiCard {
  title:      string;
  value:      string;
  change:     string;
  changeType: ChangeType;
  sub:        string;
  icon:       React.ElementType;
  iconColor:  string;
  iconBg:     string;
}

interface HealthMetric {
  label:  string;
  value:  string;
  status: HealthStatus;
}

interface AccountDistribution {
  name:  string;
  value: number;
  color: string;
}

interface ActivityItem {
  type:  ActivityType;
  text:  string;
  time:  string;
  icon:  React.ElementType;
  color: string;
}

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
const KPI_CARDS: KpiCard[] = [
  {
    title:      "Total Users",
    value:      "48,291",
    change:     "+2.4%",
    changeType: "up",
    sub:        "1,142 new this week",
    icon:       Users,
    iconColor:  "text-blue-700 dark:text-blue-400",
    iconBg:     "bg-blue-50 dark:bg-blue-900/40",
  },
  {
    title:      "Assets Under Management",
    value:      "Ksh. 2.41B",
    change:     "+5.8%",
    changeType: "up",
    sub:        "vs last month",
    icon:       DollarSign,
    iconColor:  "text-emerald-700 dark:text-emerald-400",
    iconBg:     "bg-emerald-50 dark:bg-emerald-900/40",
  },
  {
    title:      "Daily Trade Volume",
    value:      "Ksh. 142.3M",
    change:     "+12.1%",
    changeType: "up",
    sub:        "vs yesterday",
    icon:       TrendingUp,
    iconColor:  "text-sky-700 dark:text-sky-400",
    iconBg:     "bg-sky-50 dark:bg-sky-900/40",
  },
  {
    title:      "Revenue (MTD)",
    value:      "Ksh. 4.82M",
    change:     "+8.3%",
    changeType: "up",
    sub:        "fees + commissions",
    icon:       Activity,
    iconColor:  "text-violet-700 dark:text-violet-400",
    iconBg:     "bg-violet-50 dark:bg-violet-900/40",
  },
];

const HEALTH_METRICS: HealthMetric[] = [
  { label: "App Uptime",         value: "99.98%", status: "good" },
  { label: "API Response (P95)", value: "142ms",  status: "good" },
  { label: "Failed Tx Rate",     value: "0.12%",  status: "good" },
  { label: "Open Tickets",       value: "47",     status: "warning" },
  { label: "Pending KYC",        value: "24",     status: "warning" },
  { label: "AML Alerts",         value: "7",      status: "critical" },
];

const ACCOUNT_DISTRIBUTION: AccountDistribution[] = [
  { name: "Individual", value: 38420, color: "#1E40AF" },
  { name: "Joint",      value: 6840,  color: "#0EA5E9" },
  { name: "Junior",     value: 3031,  color: "#38BDF8" },
];

const RECENT_ACTIVITY: ActivityItem[] = [
  {
    type:  "kyc",
    text:  "KYC approved for James Mwangi",
    time:  "2 min ago",
    icon:  CheckCircle2,
    color: "text-emerald-600",
  },
  {
    type:  "alert",
    text:  "AML alert: Large transaction Ksh. 2.5M",
    time:  "8 min ago",
    icon:  AlertTriangle,
    color: "text-red-600",
  },
  {
    type:  "user",
    text:  "New user registration: Faith Njeri",
    time:  "15 min ago",
    icon:  Users,
    color: "text-blue-600",
  },
  {
    type:  "trade",
    text:  "Large order: 10,000 SCOM @ 18.75",
    time:  "22 min ago",
    icon:  TrendingUp,
    color: "text-sky-600",
  },
  {
    type:  "ticket",
    text:  "Urgent ticket: Withdrawal overdue",
    time:  "35 min ago",
    icon:  Clock,
    color: "text-amber-600",
  },
];

const ACTIVITY_ICON_BG: Record<ActivityType, string> = {
  kyc:    "bg-emerald-50 dark:bg-emerald-900/30",
  alert:  "bg-red-50 dark:bg-red-900/30",
  user:   "bg-blue-50 dark:bg-blue-900/30",
  trade:  "bg-sky-50 dark:bg-sky-900/30",
  ticket: "bg-amber-50 dark:bg-amber-900/30",
};

const HEALTH_DOT: Record<HealthStatus, string> = {
  good:     "bg-emerald-500",
  warning:  "bg-amber-500",
  critical: "bg-red-500",
};

const HEALTH_VALUE_COLOUR: Record<HealthStatus, string> = {
  good:     "text-slate-800 dark:text-slate-100",
  warning:  "text-amber-700 dark:text-amber-400",
  critical: "text-red-700 dark:text-red-400",
};

/* ─────────────────────────────────────────────────────────────
   RECHARTS TOOLTIP STYLES
───────────────────────────────────────────────────────────── */
const TOOLTIP_STYLE: React.CSSProperties = {
  fontSize:     12,
  borderRadius: 8,
  border:       "1px solid #E2E8F0",
  boxShadow:    "0 4px 6px -1px rgba(0,0,0,0.07)",
};

/* ─────────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────────── */

/** KPI stat card */
function KpiCard({ kpi }: { kpi: KpiCard }) {
  const Icon = kpi.icon;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-150 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {kpi.title}
          </p>
          <p className="text-[27px] font-bold text-slate-900 dark:text-slate-50 font-mono tracking-tight mt-1.5 leading-none">
            {kpi.value}
          </p>
          <div className="flex items-center gap-1.5 mt-2.5">
            {kpi.changeType === "up" ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 text-red-500 shrink-0" />
            )}
            <span
              className={
                kpi.changeType === "up"
                  ? "text-xs font-semibold text-emerald-600"
                  : "text-xs font-semibold text-red-500"
              }
            >
              {kpi.change}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
              {kpi.sub}
            </span>
          </div>
        </div>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${kpi.iconBg}`}
        >
          <Icon className={`w-5 h-5 ${kpi.iconColor}`} />
        </div>
      </div>
    </div>
  );
}

/** Period tab button */
function PeriodBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
        active
          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-sm"
          : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

/** Revenue area chart */
function RevenueChart({ data }: { data: RevenueDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <defs>
          <linearGradient id="tradingGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#1E40AF" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#1E40AF" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="p2pGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#0EA5E9" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "#94A3B8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#94A3B8" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(1)}M`}
        />
        <Tooltip
          formatter={(v: number, name: string) => [
            `KSH ${(v / 1_000).toFixed(0)}K`,
            name,
          ]}
          contentStyle={TOOLTIP_STYLE}
        />
        <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        <Area
          type="monotone"
          dataKey="trading"
          name="Trading Fees"
          stroke="#1E40AF"
          fill="url(#tradingGrad)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="p2p"
          name="P2P Fees"
          stroke="#0EA5E9"
          fill="url(#p2pGrad)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="withdrawal"
          name="Withdrawal Fees"
          stroke="#10B981"
          fill="none"
          strokeWidth={2}
          strokeDasharray="4 2"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** User growth line chart */
function UserGrowthChart() {
  return (
    <ResponsiveContainer width="100%" height={165}>
      <LineChart
        data={MOCK_USER_GROWTH}
        margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "#94A3B8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#94A3B8" }}
          axisLine={false}
          tickLine={false}
          domain={["dataMin - 200", "dataMax + 100"]}
          tickFormatter={(v: number) => `${(v / 1_000).toFixed(1)}K`}
        />
        <Tooltip
          formatter={(v: number) => [v.toLocaleString(), "Users"]}
          contentStyle={TOOLTIP_STYLE}
        />
        <Line
          type="monotone"
          dataKey="users"
          stroke="#1E40AF"
          strokeWidth={2.5}
          dot={{ fill: "#1E40AF", r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#1E40AF" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Trade volume bar chart */
function VolumeChart() {
  return (
    <ResponsiveContainer width="100%" height={165}>
      <BarChart
        data={MOCK_VOLUME_DATA}
        margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
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
          formatter={(v: number) => [`KSH ${(v / 1_000_000).toFixed(1)}M`, "Volume"]}
          contentStyle={TOOLTIP_STYLE}
        />
        <Bar dataKey="volume" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Account types donut chart */
function AccountTypesChart() {
  return (
    <>
      <ResponsiveContainer width="100%" height={165}>
        <PieChart>
          <Pie
            data={ACCOUNT_DISTRIBUTION}
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={72}
            paddingAngle={3}
            dataKey="value"
          >
            {ACCOUNT_DISTRIBUTION.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: number) => [v.toLocaleString(), ""]}
            contentStyle={TOOLTIP_STYLE}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="space-y-2.5 mt-1">
        {ACCOUNT_DISTRIBUTION.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-slate-600 dark:text-slate-300">
                {item.name}
              </span>
            </div>
            <span className="font-mono font-medium text-slate-800 dark:text-slate-100">
              {item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

/** System health metric row */
function HealthRow({ metric }: { metric: HealthMetric }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-sm text-slate-600 dark:text-slate-300">
        {metric.label}
      </span>
      <div className="flex items-center gap-2.5">
        <span
          className={`text-sm font-mono font-semibold ${HEALTH_VALUE_COLOUR[metric.status]}`}
        >
          {metric.value}
        </span>
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${HEALTH_DOT[metric.status]}`}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAGE COMPONENT
───────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [period,      setPeriod]      = useState<Period>("ytd");
  const [refreshKey,  setRefreshKey]  = useState(0);
  const [isRefreshing,setIsRefreshing]= useState(false);

  /* Simulate a data refresh */
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setRefreshKey((k) => k + 1);
      setIsRefreshing(false);
    }, 800);
  }, []);

  /* Filter revenue data by period */
  const revenueData: RevenueDataPoint[] =
    period === "7d"
      ? MOCK_REVENUE_DATA.slice(-2)
      : period === "1m"
      ? MOCK_REVENUE_DATA.slice(-4)
      : MOCK_REVENUE_DATA;

  /* Date header */
  const today = new Date().toLocaleDateString("en-KE", {
    weekday: "long",
    day:     "numeric",
    month:   "long",
    year:    "numeric",
  });

  return (
    <div className="space-y-5 animate-fade-in" key={refreshKey}>

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            Executive Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Real-time platform overview — {today}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Live
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-1.5 h-8 text-xs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {KPI_CARDS.map((kpi) => (
          <KpiCard key={kpi.title} kpi={kpi} />
        ))}
      </div>

      {/* ── Revenue chart + Account types ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Revenue Breakdown — 2/3 width */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Revenue Breakdown</CardTitle>
              {/* Period selector */}
              <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
                {(["7d", "1m", "ytd"] as Period[]).map((p) => (
                  <PeriodBtn
                    key={p}
                    label={p.toUpperCase()}
                    active={period === p}
                    onClick={() => setPeriod(p)}
                  />
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <RevenueChart data={revenueData} />
          </CardContent>
        </Card>

        {/* Account Types — 1/3 width */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Account Types</CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            <AccountTypesChart />
          </CardContent>
        </Card>
      </div>

      {/* ── User growth + Volume + System health ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* User Growth */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>User Growth (7 days)</CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            <UserGrowthChart />
          </CardContent>
        </Card>

        {/* Trade Volume */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Trade Volume (This Week)</CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            <VolumeChart />
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>System Health</CardTitle>
              <Zap className="w-4 h-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-3">
              {HEALTH_METRICS.map((m) => (
                <HealthRow key={m.label} metric={m} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Activity ── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Last 60 minutes
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-0">
            {RECENT_ACTIVITY.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3.5 py-3 border-b border-slate-50 dark:border-slate-700/50 last:border-0"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${ACTIVITY_ICON_BG[item.type]}`}
                  >
                    <Icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">
                    {item.text}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0 font-mono">
                    {item.time}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}