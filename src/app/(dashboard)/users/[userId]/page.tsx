"use client";

import { useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, Bell, RefreshCw, ShieldAlert, FileText,
  DollarSign, LogOut, TrendingUp, TrendingDown, Flag,
  User, Shield, Wallet, Activity, ClipboardList, StickyNote,
  Phone, Mail, MapPin, Calendar, Hash,
} from "lucide-react";

import {
  MOCK_USERS, MOCK_TRANSACTIONS, MOCK_ORDERS,
  MOCK_USER_ACTIVITY, MOCK_ADMIN_NOTES,
} from "../../../../lib/mockData";
import {
  formatKSh, formatDate, timeAgo, initials,
  avatarColour, cn,
} from "../../../../lib/utils";
import { StatusBadge } from "../../../../components/shared/StatusBadge";
import { Button } from "../../../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Textarea } from "../../../../components/ui/textarea";

import type {
  PlatformUser, Transaction, Order,
} from "../../../../types/index";

/* ── Prop types ─────────────────────────────────────────────── */
interface PageProps {
  params: Promise<{ userId: string }>;
}

/* ── Holdings mock for portfolio tab ─────────────────────────── */
const PORTFOLIO_ITEMS = [
  { symbol: "KCB",   name: "KCB Group Holdings",     qty: 5000,  avgCost: 35.20, currentPrice: 38.50,  value: 192500 },
  { symbol: "SCOM",  name: "Safaricom PLC",           qty: 10000, avgCost: 19.50, currentPrice: 18.75,  value: 187500 },
  { symbol: "EQTY",  name: "Equity Group Holdings",   qty: 2000,  avgCost: 54.00, currentPrice: 52.75,  value: 105500 },
  { symbol: "KPLC",  name: "Kenya Power & Lighting",  qty: 3500,  avgCost: 21.00, currentPrice: 22.50,  value: 78750  },
] as const;

/* ── Info row ────────────────────────────────────────────────── */
function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className={cn("text-sm font-medium text-slate-800 dark:text-slate-100", mono && "font-mono")}>
        {value}
      </span>
    </div>
  );
}

/* ── Section card ────────────────────────────────────────────── */
function SectionCard({ title, children, action }: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {title}
          </CardTitle>
          {action}
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

/* ── Page ───────────────────────────────────────────────────── */
export default async function UserDetailPage({ params }: PageProps) {
  const { userId } = await params;
  const user = MOCK_USERS.find((u) => u.id === userId);

  if (!user) notFound();

  const activity = MOCK_USER_ACTIVITY[user.id] ?? [];
  const notes    = MOCK_ADMIN_NOTES[user.id]   ?? [];

  return <UserDetailClient user={user} activity={activity} notes={notes} />;
}

/* ── Client component ────────────────────────────────────────── */
function UserDetailClient({
  user,
  activity,
  notes: initialNotes,
}: {
  user:     PlatformUser;
  activity: Array<{ event: string; detail: string; ip: string; timestamp: string }>;
  notes:    Array<{ authorName: string; note: string; createdAt: string; flagged: boolean }>;
}) {
  const [newNote, setNewNote]       = useState("");
  const [notesList, setNotesList]   = useState(initialNotes);
  const [activeTab, setActiveTab]   = useState("overview");

  const avatarBg  = avatarColour(user.id);
  const userInitials = initials(user.name);

  const handleSaveNote = () => {
    if (!newNote.trim()) {
      toast.error("Note cannot be empty");
      return;
    }
    setNotesList((prev) => [
      {
        authorName: "Sarah Kimani",
        note:       newNote.trim(),
        createdAt:  new Date().toISOString(),
        flagged:    false,
      },
      ...prev,
    ]);
    setNewNote("");
    toast.success("Note saved");
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Back + identity */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Link href="/users">
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs shrink-0">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </Button>
          </Link>

          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0", avatarBg)}>
            {userInitials}
          </div>

          <div className="min-w-0">
            <h1 className="text-[22px] font-bold text-slate-900 dark:text-slate-50 tracking-tight truncate">
              {user.name}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              <span className="font-mono">{user.id}</span>
              {" · "}
              {user.accountType} Account
              {" · "}
              <StatusBadge status={user.status} size="sm" />
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 text-xs"
            onClick={() => toast.info("Push notification sent")}
          >
            <Bell className="w-3.5 h-3.5" />
            Notify
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 text-xs text-amber-600 border-amber-200 hover:bg-amber-50"
            onClick={() => toast.warning("PIN reset email sent")}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset PIN
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => toast.error("Account suspended")}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Suspend
          </Button>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Personal info */}
        <SectionCard title="Personal Information">
          <div className="space-y-0 pt-2">
            <InfoRow label="Full Name"     value={user.name} />
            <InfoRow label="Email"         value={user.email} />
            <InfoRow label="Phone"         value={user.phone} />
            <InfoRow label="Location"      value={user.location} />
            <InfoRow label="Registered"    value={formatDate(user.registeredAt)} />
            <InfoRow label="Account Type"  value={user.accountType} />
          </div>
        </SectionCard>

        {/* KYC & Compliance */}
        <SectionCard
          title="KYC & Compliance"
          action={
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-blue-600"
              onClick={() => toast.info("Escalated to compliance")}
            >
              <FileText className="w-3 h-3" />
              Escalate
            </Button>
          }
        >
          <div className="space-y-0 pt-2">
            <div className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-700/50">
              <span className="text-sm text-slate-500">KYC Status</span>
              <StatusBadge status={user.kycStatus} />
            </div>
            <InfoRow label="Risk Score"       value="12 / 100" />
            <InfoRow label="Compliance Flags" value="None" />
            <InfoRow label="Last Login"       value="Today 08:42" />
            <InfoRow label="AML Alerts"       value="1 open" />
          </div>
        </SectionCard>

        {/* Wallet */}
        <SectionCard
          title="Wallet Balances"
          action={
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-blue-600"
              onClick={() => toast.info("Manual credit/debit modal")}
            >
              <DollarSign className="w-3 h-3" />
              Adjust
            </Button>
          }
        >
          <div className="space-y-0 pt-2">
            <InfoRow label="Check-in Wallet" value="KES 12,500"  mono />
            <InfoRow label="Account Wallet"  value="KES 45,800"  mono />
            <InfoRow label="Portfolio Value" value={formatKSh(user.portfolioValue)} mono />
            <InfoRow label="Pending Orders"  value="KES 8,200"   mono />
            <InfoRow label="Total P&L"       value="+KES 24,300" mono />
          </div>
        </SectionCard>
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-slate-100 dark:bg-slate-800 p-1">
          {[
            { value: "overview",     label: "Overview",      icon: User },
            { value: "kyc",          label: "KYC Documents", icon: Shield },
            { value: "portfolio",    label: "Portfolio",     icon: TrendingUp },
            { value: "transactions", label: "Transactions",  icon: Wallet },
            { value: "activity",     label: "Activity Log",  icon: Activity },
            { value: "notes",        label: "Admin Notes",   icon: StickyNote },
          ].map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="gap-1.5 text-xs h-7">
              <Icon className="w-3.5 h-3.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Total Deposits",     value: "KES 285,000", icon: DollarSign,    color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/30" },
              { label: "Total Withdrawals",  value: "KES 142,000", icon: TrendingDown,  color: "text-red-500",    bg: "bg-red-50 dark:bg-red-900/30" },
              { label: "Orders Placed",      value: "47",          icon: ClipboardList, color: "text-blue-600",   bg: "bg-blue-50 dark:bg-blue-900/30" },
              { label: "P2P Transfers",      value: "12",          icon: Activity,      color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/30" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <Card key={label} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{label}</p>
                      <p className="text-lg font-bold font-mono text-slate-800 dark:text-slate-100 mt-1">{value}</p>
                    </div>
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", bg)}>
                      <Icon className={cn("w-4 h-4", color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* User details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-700">
                <CardTitle className="text-sm text-slate-700 dark:text-slate-200">Contact Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-3">
                {[
                  { icon: Mail,     label: user.email },
                  { icon: Phone,    label: user.phone },
                  { icon: MapPin,   label: `${user.location}, Kenya` },
                  { icon: Calendar, label: `Joined ${formatDate(user.registeredAt)}` },
                  { icon: Hash,     label: user.id },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2.5 text-sm">
                    <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">{label}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-700">
                <CardTitle className="text-sm text-slate-700 dark:text-slate-200">Account Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-0">
                  <InfoRow label="Account Type"    value={user.accountType} />
                  <InfoRow label="Status"          value={user.status} />
                  <InfoRow label="KYC Status"      value={user.kycStatus} />
                  <InfoRow label="Portfolio Value" value={user.portfolioValue > 0 ? formatKSh(user.portfolioValue) : "N/A"} mono />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* KYC Documents tab */}
        <TabsContent value="kyc" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: "National ID — Front", label: "ID Document (Front)", sub: "Click to view full resolution" },
              { title: "National ID — Back",  label: "ID Document (Back)",  sub: "Click to view full resolution" },
              { title: "Selfie / Liveness",   label: "Selfie Photo",        sub: "Liveness check: PASSED" },
              { title: "Proof of Address",    label: "Address Document",    sub: "Uploaded 2024-01-14" },
            ].map(({ title, label, sub }) => (
              <Card key={title} className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-700 dark:text-slate-200">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-100 dark:bg-slate-700 rounded-xl h-44 flex items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors group">
                    <div className="text-center">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-slate-400 group-hover:text-slate-500 transition-colors" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* KYC history */}
          <Card className="shadow-sm mt-4">
            <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-700">
              <CardTitle className="text-sm text-slate-700 dark:text-slate-200">Review History</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {[
                { action: "KYC Approved",  admin: "John Mwenda",   date: "2024-01-16 10:45", note: "Documents verified, OCR match 98%" },
                { action: "KYC Submitted", admin: "System",        date: "2024-01-14 11:30", note: "User submitted National ID front + back + selfie" },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 py-3 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                  <div className={cn("w-2 h-2 rounded-full mt-2 shrink-0", i === 0 ? "bg-emerald-500" : "bg-slate-300")} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.action}</span>
                      <span className="text-xs text-slate-400">{item.date}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{item.note}</p>
                    <p className="text-xs text-slate-400 mt-0.5">By: {item.admin}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Portfolio tab */}
        <TabsContent value="portfolio" className="mt-4">
          <Card className="shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                    {["Symbol", "Name", "Qty", "Avg Cost", "Current", "Value", "P&L"].map((h, i) => (
                      <th
                        key={h}
                        className={cn(
                          "px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide",
                          i >= 2 ? "text-right" : "text-left"
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PORTFOLIO_ITEMS.map((item) => {
                    const pnl     = (item.currentPrice - item.avgCost) * item.qty;
                    const pnlPct  = ((item.currentPrice - item.avgCost) / item.avgCost) * 100;
                    const isUp    = pnl >= 0;
                    return (
                      <tr
                        key={item.symbol}
                        className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-100 text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                            {item.symbol}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 text-sm">{item.name}</td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-slate-700 dark:text-slate-300">
                          {item.qty.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-slate-600 dark:text-slate-400">
                          {item.avgCost.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-slate-800 dark:text-slate-100">
                          {item.currentPrice.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {formatKSh(item.value)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className={cn("text-xs font-semibold font-mono", isUp ? "text-emerald-600" : "text-red-500")}>
                            {isUp ? "+" : ""}
                            {formatKSh(Math.abs(pnl))}
                            <br />
                            <span className="text-[10px] font-normal">
                              ({isUp ? "+" : ""}{pnlPct.toFixed(1)}%)
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Transactions tab */}
        <TabsContent value="transactions" className="mt-4">
          <Card className="shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                    {["Reference", "Type", "Method", "Amount", "Status", "Date"].map((h, i) => (
                      <th
                        key={h}
                        className={cn(
                          "px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide",
                          i === 3 ? "text-right" : "text-left"
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_TRANSACTIONS.slice(0, 6).map((tx: Transaction) => (
                    <tr
                      key={tx.id}
                      className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">{tx.ref}</td>
                      <td className="px-4 py-3 capitalize text-slate-700 dark:text-slate-300">{tx.type}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{tx.method}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-100">
                        {formatKSh(tx.amount)}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={tx.status} /></td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{tx.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Activity Log tab */}
        <TabsContent value="activity" className="mt-4 space-y-3">
          <Card className="shadow-sm">
            <CardContent className="p-0">
              {activity.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No activity recorded for this user.
                </div>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                  {activity.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                            {item.event}
                          </span>
                          <span className="text-xs text-slate-400 shrink-0 font-mono">{item.timestamp}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          {item.detail && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">{item.detail}</span>
                          )}
                          {item.ip && (
                            <span className="text-xs text-slate-400 font-mono">IP: {item.ip}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Login history */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between pb-0">
                <CardTitle className="text-sm text-slate-700 dark:text-slate-200">Login Sessions</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => toast.error("All sessions terminated")}
                >
                  <LogOut className="w-3 h-3" />
                  Force Logout All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {[
                { device: "iPhone 14 Pro",  location: "Nairobi, KE",  ip: "196.201.12.45", time: "Today 08:42",        current: true },
                { device: "Chrome / macOS", location: "Nairobi, KE",  ip: "196.201.12.45", time: "Yesterday 19:15",    current: false },
                { device: "Firefox / Win",  location: "Mombasa, KE",  ip: "41.80.195.22",  time: "Apr 11 14:30",       current: false },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{s.device}</span>
                      {s.current && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {s.location} · {s.ip}
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">{s.time}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Notes tab */}
        <TabsContent value="notes" className="mt-4 space-y-4">
          {/* Add note */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-700">
              <CardTitle className="text-sm text-slate-700 dark:text-slate-200">Add Internal Note</CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-3">
              <Textarea
                placeholder="Add internal note (not visible to user)…"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="bg-blue-700 hover:bg-blue-800 gap-1.5 text-xs h-8"
                  onClick={handleSaveNote}
                >
                  Save Note
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs h-8 text-amber-600 border-amber-200 hover:bg-amber-50"
                  onClick={() => {
                    toast.warning("User flagged for review");
                  }}
                >
                  <Flag className="w-3.5 h-3.5" />
                  Flag for Review
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Existing notes */}
          {notesList.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="py-10 text-center text-slate-400 text-sm">
                No internal notes yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notesList.map((note, i) => (
                <Card key={i} className={cn("shadow-sm", note.flagged && "border-red-200 dark:border-red-800 bg-red-50/40 dark:bg-red-950/20")}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {note.authorName}
                        </span>
                        {note.flagged && (
                          <span className="badge-danger text-[10px]">Flagged</span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">{timeAgo(note.createdAt)}</span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {note.note}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}