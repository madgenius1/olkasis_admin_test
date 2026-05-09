"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle, Shield, FileText, TrendingUp,
  CheckCircle2, Clock, BarChart3, ExternalLink,
  Download, RefreshCw, Scale,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

import { MOCK_AML_ALERTS, MOCK_STR_RECORDS } from "../../../lib/mockData";
import { formatKSh, cn } from "../../../lib/utils";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";

import type { AMLAlert, AlertSeverity } from "../../../types/index";

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
interface StatCard {
  label:     string;
  value:     string;
  icon:      React.ElementType;
  color:     string;
  bg:        string;
  border:    string;
}

interface QuickAction {
  label:   string;
  icon:    React.ElementType;
  href?:   string;
  action?: () => void;
  variant: "default" | "danger" | "warning";
}

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
const STAT_CARDS: StatCard[] = [
  {
    label:  "Open AML Alerts",
    value:  "7",
    icon:   AlertTriangle,
    color:  "text-red-700 dark:text-red-400",
    bg:     "bg-red-50 dark:bg-red-900/30",
    border: "border-red-100 dark:border-red-800",
  },
  {
    label:  "Under Review",
    value:  "3",
    icon:   Clock,
    color:  "text-amber-700 dark:text-amber-400",
    bg:     "bg-amber-50 dark:bg-amber-900/30",
    border: "border-amber-100 dark:border-amber-800",
  },
  {
    label:  "Resolved Today",
    value:  "12",
    icon:   CheckCircle2,
    color:  "text-emerald-700 dark:text-emerald-400",
    bg:     "bg-emerald-50 dark:bg-emerald-900/30",
    border: "border-emerald-100 dark:border-emerald-800",
  },
  {
    label:  "STRs Filed (MTD)",
    value:  "2",
    icon:   FileText,
    color:  "text-blue-700 dark:text-blue-400",
    bg:     "bg-blue-50 dark:bg-blue-900/30",
    border: "border-blue-100 dark:border-blue-800",
  },
];

/* Weekly AML trend mock data */
const WEEKLY_TREND = [
  { day: "Mon", alerts: 4, resolved: 3 },
  { day: "Tue", alerts: 6, resolved: 5 },
  { day: "Wed", alerts: 3, resolved: 3 },
  { day: "Thu", alerts: 8, resolved: 6 },
  { day: "Fri", alerts: 5, resolved: 4 },
  { day: "Sat", alerts: 2, resolved: 2 },
  { day: "Sun", alerts: 7, resolved: 5 },
];

/* Severity colour for alert dot */
const SEVERITY_DOT: Record<AlertSeverity, string> = {
  critical: "bg-red-500",
  high:     "bg-amber-500",
  medium:   "bg-sky-500",
  low:      "bg-slate-400",
};

const TOOLTIP_STYLE: React.CSSProperties = {
  fontSize:     12,
  borderRadius: 8,
  border:       "1px solid #E2E8F0",
  boxShadow:    "0 4px 6px -1px rgba(0,0,0,0.07)",
};

/* ─────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────── */
export default function CompliancePage() {
  const router            = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const openAlerts    = MOCK_AML_ALERTS.filter((a) => a.status === "open").length;
  const criticalCount = MOCK_AML_ALERTS.filter((a) => a.severity === "critical").length;

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const quickActions: QuickAction[] = [
    {
      label:   "View Audit Logs",
      icon:    FileText,
      href:    "/compliance/audit-logs",
      variant: "default",
    },
    {
      label:   "AML Alert Queue",
      icon:    AlertTriangle,
      href:    "/compliance/aml-alerts",
      variant: openAlerts > 0 ? "danger" : "default",
    },
    {
      label:   "Generate Monthly AML Report",
      icon:    TrendingUp,
      action:  () => toast.info("Generating monthly AML report…"),
      variant: "default",
    },
    {
      label:   "Export User Data (CBK)",
      icon:    Download,
      action:  () => toast.info("Preparing CBK export…"),
      variant: "default",
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            Compliance Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            AML monitoring, transaction oversight, and regulatory reporting
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
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
          <Button
            size="sm"
            className="gap-1.5 h-8 text-xs bg-blue-700 hover:bg-blue-800"
            onClick={() => router.push("/compliance/str-generator")}
          >
            <Scale className="w-3.5 h-3.5" />
            Generate STR
          </Button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CARDS.map((s) => {
          const Icon = s.icon;
          return (
            <Card
              key={s.label}
              className={cn("shadow-sm border", s.border)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", s.bg)}>
                  <Icon className={cn("w-5 h-5", s.color)} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-tight">
                    {s.label}
                  </p>
                  <p className={cn("text-[28px] font-bold font-mono leading-tight mt-0.5", s.color)}>
                    {s.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Critical alert banner ── */}
      {criticalCount > 0 && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">
              {criticalCount} critical AML alert{criticalCount > 1 ? "s" : ""} require immediate attention
            </p>
          </div>
          <Link href="/compliance/aml-alerts">
            <Button size="sm" className="h-7 text-xs gap-1.5 bg-red-600 hover:bg-red-700 shrink-0">
              <ExternalLink className="w-3 h-3" />
              Review Now
            </Button>
          </Link>
        </div>
      )}

      {/* ── Main two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent AML alerts — 2/3 */}
        <Card className="lg:col-span-2 shadow-sm overflow-hidden">
          <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Recent AML Alerts
              </CardTitle>
              <Link href="/compliance/aml-alerts">
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {MOCK_AML_ALERTS.slice(0, 6).map((alert: AMLAlert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {/* Severity dot */}
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full mt-1.5 shrink-0",
                      SEVERITY_DOT[alert.severity]
                    )}
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {alert.type}
                      </span>
                      <StatusBadge status={alert.severity} size="sm" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {alert.user}
                      {" · "}
                      <span className="font-mono font-medium">
                        {formatKSh(alert.amount)}
                      </span>
                    </p>
                  </div>

                  {/* Time + status */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                      {alert.timestamp.split(" ")[1]}
                    </span>
                    <StatusBadge status={alert.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick actions — 1/3 */}
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700">
              <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100 pb-3">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-2">
              {quickActions.map((action, i) => {
                const Icon = action.icon;
                const inner = (
                  <div
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer",
                      action.variant === "danger"
                        ? "border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                        : action.variant === "warning"
                        ? "border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                    onClick={action.action}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0",
                        action.variant === "danger"  && "text-red-500",
                        action.variant === "warning" && "text-amber-500",
                        action.variant === "default" && "text-slate-500 dark:text-slate-400"
                      )}
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-200">
                      {action.label}
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-400 ml-auto shrink-0" />
                  </div>
                );

                return action.href ? (
                  <Link key={i} href={action.href}>
                    {inner}
                  </Link>
                ) : (
                  <div key={i}>{inner}</div>
                );
              })}
            </CardContent>
          </Card>

          {/* STR summary card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700">
              <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100 pb-3">
                STR Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-2.5">
              {MOCK_STR_RECORDS.map((str) => (
                <div
                  key={str.id}
                  className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-700/50 last:border-0"
                >
                  <div>
                    <p className="text-xs font-mono font-medium text-slate-700 dark:text-slate-200">
                      {str.id}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[140px]">
                      {str.subject}
                    </p>
                  </div>
                  <StatusBadge status={str.status} size="sm" />
                </div>
              ))}
              <Link href="/compliance/str-generator">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 h-7 text-xs mt-1"
                >
                  <Scale className="w-3 h-3" />
                  New STR
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Weekly AML trend chart ── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between pb-0">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Weekly AML Trend
              </CardTitle>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Alerts raised vs resolved this week
              </p>
            </div>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>
        </CardHeader>
        <CardContent className="pt-3">
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart
              data={WEEKLY_TREND}
              margin={{ top: 5, right: 5, bottom: 0, left: -20 }}
            >
              <defs>
                <linearGradient id="alertsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10B981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area
                type="monotone"
                dataKey="alerts"
                name="Alerts Raised"
                stroke="#EF4444"
                fill="url(#alertsGrad)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="resolved"
                name="Resolved"
                stroke="#10B981"
                fill="url(#resolvedGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}