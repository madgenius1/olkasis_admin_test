"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./../contexts/AuthContext";
import { cn, initials, avatarColour } from "../../lib/utils";
import { MOCK_NOTIFICATIONS } from "../../lib/mockData";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { NotificationDrawer } from "../../components/shared/NotificationDrawer";
import { CommandPalette } from "../../components/layout/CommandPalette";
import {
  ChevronRight, Menu, Bell, Search, LogOut, Settings, User,
  Moon, Sun,
} from "lucide-react";
import { useTheme } from "next-themes";

/* ── Breadcrumb label map ───────────────────────────────────── */
const LABELS: Record<string, string> = {
  dashboard:       "Dashboard",
  users:           "Users",
  kyc:             "KYC Review",
  "joint-junior":  "Joint & Junior",
  review:          "Review",
  waitlist:        "Waitlist",
  compliance:      "Compliance",
  "aml-alerts":    "AML Alerts",
  "audit-logs":    "Audit Logs",
  "str-generator": "STR Generator",
  trading:         "Trading",
  orders:          "Orders",
  holdings:        "Holdings",
  "market-data":   "Market Data",
  derivatives:     "Derivatives",
  wallets:         "Wallets & Payments",
  transactions:    "Transactions",
  reconciliation:  "Reconciliation",
  p2p:             "P2P Transfers",
  disputes:        "Disputes",
  support:         "Customer Support",
  tickets:         "Tickets",
  content:         "Content",
  learning:        "Learning",
  rafiki:          "Rafiki AI",
  reports:         "Reports",
  financial:       "Financial",
  regulatory:      "Regulatory",
  marketing:       "Marketing",
  risk:            "Risk Management",
  system:          "System",
  admins:          "Admin Users",
  settings:        "Settings",
};

function Breadcrumb({ onMobileMenu }: { onMobileMenu: () => void }) {
  const pathname = usePathname();
  const parts    = pathname.split("/").filter(Boolean);

  return (
    <div className="flex items-center gap-2 min-w-0">
      {/* Mobile hamburger */}
      <button
        className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors mr-1"
        onClick={onMobileMenu}
        aria-label="Open menu"
      >
        <Menu className="w-4.5 h-4.5" />
      </button>

      <nav className="flex items-center gap-1 text-sm min-w-0">
        <span className="text-slate-400 shrink-0">Olkasis</span>
        {parts.map((part, i) => {
          const isLast  = i === parts.length - 1;
          const label   = LABELS[part] ?? part;

          return (
            <React.Fragment key={i}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <span
                className={cn(
                  "truncate",
                  isLast
                    ? "text-slate-700 dark:text-slate-200 font-medium"
                    : "text-slate-400 dark:text-slate-500"
                )}
              >
                {label}
              </span>
            </React.Fragment>
          );
        })}
      </nav>
    </div>
  );
}

interface Props {
  onMobileMenu: () => void;
}

export function Header({ onMobileMenu }: Props) {
  const { user, logout }      = useAuth();
  const router                = useRouter();
  const { theme, setTheme }   = useTheme();
  const [notifOpen, setNotifOpen]   = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

  const userInitials = user ? initials(user.name) : "A";
  const avatarBg     = user ? avatarColour(user.id) : "bg-blue-600";

  return (
    <>
      <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3 px-4 lg:px-6 shrink-0 z-30">
        {/* Breadcrumb / mobile trigger */}
        <Breadcrumb onMobileMenu={onMobileMenu} />

        <div className="flex-1" />

        {/* Search trigger */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-400 w-52 transition-colors"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1 text-left text-slate-400 text-sm">Search…</span>
          <kbd className="text-[10px] bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-1.5 py-0.5 font-mono text-slate-400">
            ⌘K
          </kbd>
        </button>

        {/* Mobile search icon */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>

        {/* Notifications */}
        <button
          onClick={() => setNotifOpen(true)}
          className="relative w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4.5 h-4.5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
          )}
        </button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0",
                  avatarBg
                )}
              >
                {userInitials}
              </div>
              <span className="hidden md:block text-sm font-medium text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
                {user?.name}
              </span>
              <ChevronRight className="hidden md:block w-3 h-3 text-slate-400 rotate-90" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <div className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {user?.name}
              </p>
              <p className="text-xs text-slate-500 capitalize truncate">
                {user?.role?.replace(/_/g, " ")}
              </p>
            </div>

            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <User className="w-4 h-4" />
                Profile & Settings
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={logout}
              className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Notification drawer */}
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

      {/* Command palette */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
