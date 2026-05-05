"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./../contexts/AuthContext";
import { canAccessPage } from "../../lib/permissions";
import { cn, initials, avatarColour } from "../../lib/utils";
import { ScrollArea } from "../../components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  TrendingUp,
  Wallet,
  ArrowLeftRight,
  Headphones,
  BookOpen,
  Bot,
  BarChart3,
  Megaphone,
  AlertTriangle,
  Settings,
  UserCog,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  LogOut,
  FileText,
  Activity,
  CreditCard,
  MessageSquare,
  Flag,
  DollarSign,
  Shield,
  Zap,
  GitMerge,
  Scale,
  Shuffle,
} from "lucide-react";
import type { AdminRole } from "../../types/index";
import type { LucideIcon } from "lucide-react";

/* ── Types ─────────────────────────────────────────────────── */
interface NavChild {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  badgeVariant?: "danger" | "warning" | "info";
}

interface NavGroup {
  label: string;
  icon: LucideIcon;
  badge?: number;
  badgeVariant?: "danger" | "warning" | "info";
  children: NavChild[];
}

interface NavLink {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  badgeVariant?: "danger" | "warning" | "info";
}

type NavItem = NavGroup | NavLink;

function isNavLink(item: NavItem): item is NavLink {
  return "href" in item;
}

/* ── Navigation definition ─────────────────────────────────── */
const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Users",
    icon: Users,
    children: [
      { label: "User Directory", href: "/users", icon: Users },
      {
        label: "KYC Review",
        href: "/kyc",
        icon: ShieldCheck,
        badge: 24,
        badgeVariant: "warning",
      },
      { label: "Waitlist", href: "/users/waitlist", icon: Users },
    ],
  },
  {
    label: "Compliance",
    icon: Shield,
    children: [
      { label: "Overview", href: "/compliance", icon: Shield },
      {
        label: "AML Alerts",
        href: "/compliance/aml-alerts",
        icon: Flag,
        badge: 7,
        badgeVariant: "danger",
      },
      { label: "Audit Logs", href: "/compliance/audit-logs", icon: FileText },
      {
        label: "STR Generator",
        href: "/compliance/str-generator",
        icon: Scale,
      },
    ],
  },
  {
    label: "Trading",
    icon: TrendingUp,
    children: [
      { label: "Overview", href: "/trading", icon: TrendingUp },
      { label: "Orders", href: "/trading/orders", icon: Activity },
      { label: "Holdings", href: "/trading/holdings", icon: BarChart3 },
      { label: "Market Data", href: "/trading/market-data", icon: DollarSign },
      { label: "Derivatives", href: "/trading/derivatives", icon: GitMerge },
    ],
  },
  {
    label: "Wallets & Payments",
    icon: Wallet,
    children: [
      { label: "Overview", href: "/wallets", icon: Wallet },
      {
        label: "Transactions",
        href: "/wallets/transactions",
        icon: CreditCard,
      },
      {
        label: "Reconciliation",
        href: "/wallets/reconciliation",
        icon: Shuffle,
      },
    ],
  },
  {
    label: "P2P Transfers",
    icon: ArrowLeftRight,
    children: [
      { label: "Overview", href: "/p2p", icon: ArrowLeftRight },
      {
        label: "Disputes",
        href: "/p2p/disputes",
        icon: MessageSquare,
        badge: 3,
        badgeVariant: "warning",
      },
    ],
  },
  {
    label: "Customer Support",
    icon: Headphones,
    children: [
      { label: "Overview", href: "/support", icon: Headphones },
      {
        label: "Tickets",
        href: "/support/tickets",
        icon: MessageSquare,
        badge: 12,
        badgeVariant: "info",
      },
    ],
  },
  {
    label: "Content",
    icon: BookOpen,
    children: [
      { label: "Hub", href: "/content", icon: BookOpen },
      { label: "Learning", href: "/content/learning", icon: BookOpen },
    ],
  },
  {
    label: "Rafiki AI",
    href: "/rafiki",
    icon: Bot,
    badge: 2,
    badgeVariant: "warning",
  },
  {
    label: "Reports",
    icon: BarChart3,
    children: [
      { label: "Overview", href: "/reports", icon: BarChart3 },
      { label: "Financial", href: "/reports/financial", icon: DollarSign },
      { label: "Trading", href: "/reports/trading", icon: TrendingUp },
      { label: "Regulatory", href: "/reports/regulatory", icon: FileText },
    ],
  },
  { label: "Marketing", href: "/marketing", icon: Megaphone },
  { label: "Risk Management", href: "/risk", icon: AlertTriangle },
  {
    label: "System",
    icon: Zap,
    children: [
      { label: "Administration", href: "/system", icon: Settings },
      { label: "Admin Users", href: "/admins", icon: UserCog },
    ],
  },
  { label: "Settings", href: "/settings", icon: Settings },
];

/* ── Badge pill ─────────────────────────────────────────────── */
function NavBadge({
  count,
  variant = "info",
}: {
  count: number;
  variant?: "danger" | "warning" | "info";
}) {
  return (
    <span
      className={cn(
        "text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono leading-none",
        variant === "danger" && "bg-red-500/25 text-red-400",
        variant === "warning" && "bg-amber-500/25 text-amber-400",
        variant === "info" && "bg-sky-500/25 text-sky-400",
      )}
    >
      {count}
    </span>
  );
}

/* ── NavLink item ───────────────────────────────────────────── */
function NavLinkItem({
  item,
  collapsed,
  depth = 0,
}: {
  item: NavLink;
  collapsed: boolean;
  depth?: number;
}) {
  const pathname = usePathname();
  const { user } = useAuth();

  // RBAC check
  if (user && user.role !== "super_admin") {
    const allowed = canAccessPage(user.role as AdminRole, item.href);
    if (!allowed) return null;
  }

  const isActive =
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === item.href || pathname.startsWith(item.href + "/");

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            className={cn(
              "flex items-center justify-center w-9 h-9 rounded-lg mx-auto transition-all",
              isActive
                ? "bg-blue-900/70 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
            )}
          >
            <item.icon className="w-4 h-4" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.label}
          {item.badge !== undefined && (
            <span className="ml-1.5 text-amber-400">({item.badge})</span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-sm font-medium transition-all select-none",
        depth === 0
          ? isActive
            ? "bg-blue-900/60 text-white border-l-2 border-sky-400 pl-[10px]"
            : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-200"
          : isActive
            ? "text-white bg-white/8 border-l-2 border-sky-500 pl-[10px]"
            : "text-slate-500 hover:text-slate-300 hover:bg-white/5",
      )}
    >
      <item.icon className="w-4 h-4 shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge !== undefined && (
        <NavBadge count={item.badge} variant={item.badgeVariant} />
      )}
    </Link>
  );
}

/* ── NavGroup item ──────────────────────────────────────────── */
function NavGroupItem({
  item,
  collapsed,
}: {
  item: NavGroup;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const { user } = useAuth();

  const accessibleChildren = item.children.filter((child) => {
    if (!user || user.role === "super_admin") return true;
    return canAccessPage(user.role as AdminRole, child.href);
  });

  if (accessibleChildren.length === 0) return null;

  const isAnyChildActive = accessibleChildren.some(
    (c) => pathname === c.href || pathname.startsWith(c.href + "/"),
  );

  const [open, setOpen] = useState(() => isAnyChildActive);

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center justify-center w-9 h-9 rounded-lg mx-auto transition-all text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <h6 className="invisible">h</h6>
            <item.icon className="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-sm font-medium transition-all",
          "text-slate-400 hover:bg-slate-800/70 hover:text-slate-200",
          (open || isAnyChildActive) && "text-slate-200",
        )}
      >
        <item.icon className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left truncate">{item.label}</span>
        {item.badge !== undefined && (
          <NavBadge count={item.badge} variant={item.badgeVariant} />
        )}
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        )}
      </button>

      {open && (
        <div className="ml-3 mt-0.5 border-l border-white/8 pl-3 space-y-0.5">
          {accessibleChildren.map((child) => (
            <NavLinkItem
              key={child.href}
              item={child}
              collapsed={false}
              depth={1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Sidebar ────────────────────────────────────────────────── */
interface SidebarProps {
  collapsed: boolean;
  onCollapse: (v: boolean) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({
  collapsed,
  onCollapse,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const { user, logout } = useAuth();

  const userInitials = user ? initials(user.name) : "A";
  const avatarBg = user ? avatarColour(user.id) : "bg-blue-600";
  const roleLabel = user?.role.replace(/_/g, " ") ?? "";

  return (
    <TooltipProvider delayDuration={200}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-[#0F172A]",
          "transition-[width] duration-200 ease-in-out",
          collapsed ? "w-[64px]" : "w-[224px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* ── Logo ── */}
        <div
          className={cn(
            "flex items-center gap-3 border-b border-white/8",
            collapsed ? "justify-center px-0 py-4" : "px-4 py-[14px]",
          )}
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-black text-sm">O</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="text-white font-bold text-[15px] leading-tight tracking-tight">
                Olkasis
              </div>
              <div className="text-slate-400 text-[10px] font-medium tracking-wider uppercase">
                Admin Console
              </div>
            </div>
          )}
        </div>

        {/* ── Navigation ── */}
        <ScrollArea className="flex-1 py-3">
          <nav className={cn("space-y-0.5", collapsed ? "px-2" : "px-2")}>
            {NAV_ITEMS.map((item) =>
              isNavLink(item) ? (
                <NavLinkItem
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                />
              ) : (
                <NavGroupItem
                  key={item.label}
                  item={item}
                  collapsed={collapsed}
                />
              ),
            )}
          </nav>
        </ScrollArea>

        {/* ── User footer ── */}
        <div
          className={cn(
            "border-t border-white/8 p-3",
            collapsed && "flex justify-center",
          )}
        >
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-default",
                    avatarBg,
                  )}
                >
                  {userInitials}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-medium">{user?.name}</p>
                <p className="text-xs capitalize text-slate-400">{roleLabel}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0",
                  avatarBg,
                )}
              >
                {userInitials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-semibold truncate leading-tight">
                  {user?.name}
                </div>
                <div className="text-slate-400 text-[11px] capitalize truncate">
                  {roleLabel}
                </div>
              </div>
              <button
                onClick={logout}
                className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                aria-label="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* ── Collapse toggle (desktop) ── */}
        <button
          onClick={() => onCollapse(!collapsed)}
          className="hidden lg:flex items-center justify-center h-8 border-t border-white/8 text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors shrink-0"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </aside>
    </TooltipProvider>
  );
}
