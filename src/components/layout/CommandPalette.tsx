"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MOCK_USERS, MOCK_TICKETS } from "../../lib/mockData";
import { cn } from "../../lib/utils";
import {
  Search,
  LayoutDashboard,
  Users,
  Shield,
  TrendingUp,
  Wallet,
  ArrowLeftRight,
  Headphones,
  Bot,
  BarChart3,
  Megaphone,
  AlertTriangle,
  Settings,
  X,
  User,
  Ticket,
} from "lucide-react";

/* ── Result types ───────────────────────────────────────────── */
interface CommandResult {
  id: string;
  type: "page" | "user" | "ticket";
  label: string;
  sublabel?: string;
  href: string;
  icon: React.ElementType;
  keywords: string;
}

/* ── Static page results ────────────────────────────────────── */
const PAGE_RESULTS: CommandResult[] = [
  {
    id: "p1",
    type: "page",
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    keywords: "home overview",
  },
  {
    id: "p2",
    type: "page",
    label: "User Directory",
    href: "/users",
    icon: Users,
    keywords: "users customers accounts",
  },
  {
    id: "p3",
    type: "page",
    label: "KYC Review",
    href: "/kyc",
    icon: Shield,
    keywords: "kyc verification identity documents",
  },
  {
    id: "p4",
    type: "page",
    label: "Compliance Overview",
    href: "/compliance",
    icon: Shield,
    keywords: "compliance aml regulatory",
  },
  {
    id: "p5",
    type: "page",
    label: "AML Alerts",
    href: "/compliance/aml-alerts",
    icon: AlertTriangle,
    keywords: "aml alerts money laundering",
  },
  {
    id: "p6",
    type: "page",
    label: "Audit Logs",
    href: "/compliance/audit-logs",
    icon: Shield,
    keywords: "audit logs history",
  },
  {
    id: "p7",
    type: "page",
    label: "STR Generator",
    href: "/compliance/str-generator",
    icon: Shield,
    keywords: "str suspicious transaction report",
  },
  {
    id: "p8",
    type: "page",
    label: "Trading Overview",
    href: "/trading",
    icon: TrendingUp,
    keywords: "trading nse stocks",
  },
  {
    id: "p9",
    type: "page",
    label: "Orders",
    href: "/trading/orders",
    icon: TrendingUp,
    keywords: "orders buy sell",
  },
  {
    id: "p10",
    type: "page",
    label: "Derivatives",
    href: "/trading/derivatives",
    icon: TrendingUp,
    keywords: "derivatives options futures margin",
  },
  {
    id: "p11",
    type: "page",
    label: "Wallets",
    href: "/wallets",
    icon: Wallet,
    keywords: "wallets payments mpesa",
  },
  {
    id: "p12",
    type: "page",
    label: "Transactions",
    href: "/wallets/transactions",
    icon: Wallet,
    keywords: "transactions deposits withdrawals",
  },
  {
    id: "p13",
    type: "page",
    label: "Reconciliation",
    href: "/wallets/reconciliation",
    icon: Wallet,
    keywords: "reconciliation mpesa matching",
  },
  {
    id: "p14",
    type: "page",
    label: "P2P Transfers",
    href: "/p2p",
    icon: ArrowLeftRight,
    keywords: "p2p transfers peer to peer",
  },
  {
    id: "p15",
    type: "page",
    label: "P2P Disputes",
    href: "/p2p/disputes",
    icon: ArrowLeftRight,
    keywords: "disputes p2p",
  },
  {
    id: "p16",
    type: "page",
    label: "Customer Support",
    href: "/support",
    icon: Headphones,
    keywords: "support tickets help",
  },
  {
    id: "p17",
    type: "page",
    label: "Rafiki AI",
    href: "/rafiki",
    icon: Bot,
    keywords: "rafiki ai chatbot",
  },
  {
    id: "p18",
    type: "page",
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    keywords: "reports analytics",
  },
  {
    id: "p19",
    type: "page",
    label: "Financial Reports",
    href: "/reports/financial",
    icon: BarChart3,
    keywords: "financial revenue reports",
  },
  {
    id: "p20",
    type: "page",
    label: "Trading Reports",
    href: "/reports/trading",
    icon: BarChart3,
    keywords: "trading reports volume",
  },
  {
    id: "p21",
    type: "page",
    label: "Regulatory Reports",
    href: "/reports/regulatory",
    icon: BarChart3,
    keywords: "regulatory cbk cma submissions",
  },
  {
    id: "p22",
    type: "page",
    label: "Marketing",
    href: "/marketing",
    icon: Megaphone,
    keywords: "marketing campaigns referrals",
  },
  {
    id: "p23",
    type: "page",
    label: "Risk Management",
    href: "/risk",
    icon: AlertTriangle,
    keywords: "risk management alerts",
  },
  {
    id: "p24",
    type: "page",
    label: "System Settings",
    href: "/system",
    icon: Settings,
    keywords: "system feature flags settings",
  },
  {
    id: "p25",
    type: "page",
    label: "Admin Users",
    href: "/admins",
    icon: Users,
    keywords: "admins users roles",
  },
  {
    id: "p26",
    type: "page",
    label: "Settings",
    href: "/settings",
    icon: Settings,
    keywords: "settings profile api keys security",
  },
];

function buildResults(): CommandResult[] {
  const userResults: CommandResult[] = MOCK_USERS.map((u) => ({
    id: `u-${u.id}`,
    type: "user",
    label: u.name,
    sublabel: `${u.id} · ${u.email}`,
    href: `/users/${u.id}`,
    icon: User,
    keywords: `${u.name} ${u.email} ${u.id} ${u.phone}`.toLowerCase(),
  }));

  const ticketResults: CommandResult[] = MOCK_TICKETS.map((t) => ({
    id: `t-${t.id}`,
    type: "ticket",
    label: t.subject,
    sublabel: `${t.id} · ${t.user} · ${t.status}`,
    href: `/support/tickets`,
    icon: Ticket,
    keywords: `${t.id} ${t.subject} ${t.user} ${t.category}`.toLowerCase(),
  }));

  return [...PAGE_RESULTS, ...userResults, ...ticketResults];
}

const ALL_RESULTS = buildResults();

const TYPE_LABELS: Record<CommandResult["type"], string> = {
  page: "Pages",
  user: "Users",
  ticket: "Tickets",
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  /* Focus input when opened */
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setCursor(0);
    }
  }, [open]);

  /* Keyboard shortcut Cmd+K / Ctrl+K */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) onClose();
      }
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const filtered = query.trim()
    ? ALL_RESULTS.filter(
        (r) =>
          r.label.toLowerCase().includes(query.toLowerCase()) ||
          r.keywords.includes(query.toLowerCase()) ||
          (r.sublabel ?? "").toLowerCase().includes(query.toLowerCase()),
      )
    : PAGE_RESULTS.slice(0, 8);

  /* Group results by type */
  const grouped: Record<string, CommandResult[]> = {};
  for (const r of filtered) {
    const key = TYPE_LABELS[r.type];
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  }

  const flatList = filtered;

  const navigate = useCallback(
    (href: string) => {
      router.push(href);
      onClose();
    },
    [router, onClose],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, flatList.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter" && flatList[cursor]) {
      navigate(flatList[cursor].href);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Palette */}
      <div className="relative w-full max-w-[560px] mx-4 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <Search className="w-4.5 h-4.5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, users, tickets…"
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-slate-400 hover:text-slate-600"
            >
              <h6 className="invisible">h</h6>
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[10px] text-slate-400 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[400px] overflow-y-auto py-2">
          {flatList.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-slate-400 text-sm gap-2">
              <Search className="w-6 h-6" />
              <span>No results for &quot;{query}&quot;</span>
            </div>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <p className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {group}
                </p>
                {items.map((item) => {
                  const idx = flatList.indexOf(item);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.href)}
                      onMouseEnter={() => setCursor(idx)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                        cursor === idx
                          ? "bg-blue-50 dark:bg-blue-900/30"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                      )}
                    >
                      <div
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                          cursor === idx
                            ? "bg-blue-100 dark:bg-blue-800"
                            : "bg-slate-100 dark:bg-slate-700",
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-3.5 h-3.5",
                            cursor === idx
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-slate-500",
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                          {item.label}
                        </p>
                        {item.sublabel && (
                          <p className="text-xs text-slate-400 truncate">
                            {item.sublabel}
                          </p>
                        )}
                      </div>
                      {cursor === idx && (
                        <kbd className="text-[10px] text-slate-400 border border-slate-200 dark:border-slate-600 rounded px-1.5 py-0.5 font-mono shrink-0">
                          ↵
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-slate-100 dark:border-slate-700">
          {[
            { key: "↑↓", label: "navigate" },
            { key: "↵", label: "open" },
            { key: "ESC", label: "close" },
          ].map(({ key, label }) => (
            <span
              key={key}
              className="flex items-center gap-1.5 text-[10px] text-slate-400"
            >
              <kbd className="border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 font-mono">
                {key}
              </kbd>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
