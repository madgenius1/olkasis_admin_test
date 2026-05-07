"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Search, Download, UserPlus, MoreHorizontal,
  Eye, ShieldAlert, RefreshCw, Users, UserCheck,
  UserMinus, UserX, ChevronLeft, ChevronRight,
} from "lucide-react";

import { MOCK_USERS } from "../../../lib/mockData";
import { useDebounce } from "../../../hooks/useDebounce";
import { usePagination } from "../../../hooks/usePagination";
import { formatKSh, initials, avatarColour, cn } from "../../../lib/utils";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "../../../components/ui/select";

import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { Card, CardContent } from "../../../components/ui/card";

import type { Metadata } from "next";
import type { PlatformUser, KYCStatus, UserStatus } from "../../../types/index";

/* ── Types ─────────────────────────────────────────────────── */
type KYCFilter    = "all" | KYCStatus;
type StatusFilter = "all" | UserStatus;

/* ── Constants ──────────────────────────────────────────────── */
const PAGE_SIZE = 8;

const SUMMARY_STATS = [
  {
    label:      "Total Users",
    value:      "48,291",
    valueClass: "text-slate-800 dark:text-slate-100",
    icon:       Users,
    iconBg:     "bg-slate-50 dark:bg-slate-700",
    iconColor:  "text-slate-600 dark:text-slate-300",
  },
  {
    label:      "Active",
    value:      "41,204",
    valueClass: "text-emerald-700 dark:text-emerald-400",
    icon:       UserCheck,
    iconBg:     "bg-emerald-50 dark:bg-emerald-900/40",
    iconColor:  "text-emerald-600",
  },
  {
    label:      "Inactive",
    value:      "5,832",
    valueClass: "text-amber-700 dark:text-amber-400",
    icon:       UserMinus,
    iconBg:     "bg-amber-50 dark:bg-amber-900/40",
    iconColor:  "text-amber-600",
  },
  {
    label:      "Suspended",
    value:      "1,255",
    valueClass: "text-red-700 dark:text-red-400",
    icon:       UserX,
    iconBg:     "bg-red-50 dark:bg-red-900/40",
    iconColor:  "text-red-600",
  },
] as const;

/* ── User avatar initials ───────────────────────────────────── */
function UserAvatar({ user }: { user: PlatformUser }) {
  const bg  = avatarColour(user.id);
  const ini = initials(user.name);
  return (
    <div
      className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0",
        bg
      )}
    >
      {ini}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────── */
export default function UsersPage() {
  const [rawSearch,    setRawSearch]    = useState("");
  const [kycFilter,    setKycFilter]    = useState<KYCFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const search = useDebounce(rawSearch, 250);

  /* Filter */
  const filtered = useMemo<PlatformUser[]>(() => {
    const q = search.toLowerCase();
    return MOCK_USERS.filter((u) => {
      const matchSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        u.phone.includes(q);
      const matchKyc    = kycFilter    === "all" || u.kycStatus === kycFilter;
      const matchStatus = statusFilter === "all" || u.status    === statusFilter;
      return matchSearch && matchKyc && matchStatus;
    });
  }, [search, kycFilter, statusFilter]);

  /* Pagination */
  const pag = usePagination({ total: filtered.length, pageSize: PAGE_SIZE });
  const pageData = pag.paginate(filtered);

  const handleReset = () => {
    setRawSearch("");
    setKycFilter("all");
    setStatusFilter("all");
  };

  const handleExport = () => {
    const headers = ["ID", "Name", "Email", "Phone", "Account", "KYC", "Status", "Portfolio", "Registered"];
    const rows = filtered.map((u) => [
      u.id, u.name, u.email, u.phone, u.accountType,
      u.kycStatus, u.status,
      u.portfolioValue > 0 ? u.portfolioValue.toString() : "0",
      u.registeredAt,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a   = Object.assign(document.createElement("a"), {
      href:     URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `users-${new Date().toISOString().slice(0, 10)}.csv`,
    });
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success(`Exported ${filtered.length} users`);
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            User Directory
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {MOCK_USERS.length.toLocaleString()} registered users
            {" · "}
            {MOCK_USERS.filter((u) => u.status === "active").length.toLocaleString()} active
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 text-xs"
            onClick={handleExport}
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>
          <Button
            size="sm"
            className="gap-1.5 h-8 text-xs bg-blue-700 hover:bg-blue-800"
            onClick={() => toast.info("Add user — feature coming in backend integration")}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add User
          </Button>
        </div>
      </div>

      {/* ── Summary stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {SUMMARY_STATS.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      {s.label}
                    </p>
                    <p className={cn("text-[22px] font-bold font-mono mt-1", s.valueClass)}>
                      {s.value}
                    </p>
                  </div>
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", s.iconBg)}>
                    <Icon className={cn("w-4 h-4", s.iconColor)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Filter bar ── */}
      <Card className="shadow-sm">
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                placeholder="Search by name, email, phone, or Zanari ID..."
                value={rawSearch}
                onChange={(e) => setRawSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            {/* KYC filter */}
            <Select
              value={kycFilter}
              onValueChange={(v) => setKycFilter(v as KYCFilter)}
            >
              <SelectTrigger className="w-full sm:w-[130px] h-9 text-sm">
                <SelectValue placeholder="All KYC" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All KYC</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="not_submitted">Not Submitted</SelectItem>
              </SelectContent>
            </Select>

            {/* Status filter */}
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="w-full sm:w-[130px] h-9 text-sm">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            {/* Reset */}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-9 text-xs shrink-0"
              onClick={handleReset}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Users table ── */}
      <Card className="shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                {["User", "ID", "Account", "KYC", "Status", "Portfolio", "Registered", ""].map(
                  (h, i) => (
                    <th
                      key={i}
                      className={cn(
                        "px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide",
                        i === 5 ? "text-right" : "text-left"
                      )}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-slate-400 text-sm">
                    No users match your filters.
                  </td>
                </tr>
              ) : (
                pageData.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar user={user} />
                        <div>
                          <Link
                            href={`/users/${user.id}`}
                            className="font-medium text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            {user.name}
                          </Link>
                          <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* ID */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                        {user.id}
                      </span>
                    </td>

                    {/* Account type */}
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-sm">
                      {user.accountType}
                    </td>

                    {/* KYC */}
                    <td className="px-4 py-3">
                      <StatusBadge status={user.kycStatus} />
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={user.status} />
                    </td>

                    {/* Portfolio */}
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-sm text-slate-800 dark:text-slate-100">
                        {user.portfolioValue > 0
                          ? formatKSh(user.portfolioValue)
                          : "—"}
                      </span>
                    </td>

                    {/* Registered */}
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                      {user.registeredAt}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7"
                            aria-label="User actions"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem asChild>
                            <Link href={`/users/${user.id}`}>
                              <Eye className="w-3.5 h-3.5 mr-2" />
                              View Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
                            onClick={() =>
                              toast.warning(`Suspending ${user.name}…`)
                            }
                          >
                            <ShieldAlert className="w-3.5 h-3.5 mr-2" />
                            Suspend Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {pag.rangeLabel("users")}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="w-7 h-7"
              onClick={pag.goPrev}
              disabled={!pag.hasPrev}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="text-xs text-slate-600 dark:text-slate-300 px-2 font-medium">
              Page {pag.page} of {pag.totalPages.toLocaleString()}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="w-7 h-7"
              onClick={pag.goNext}
              disabled={!pag.hasNext}
              aria-label="Next page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}