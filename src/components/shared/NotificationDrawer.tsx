"use client";

import { useState } from "react";
import Link from "next/link";
import { MOCK_NOTIFICATIONS } from "../../lib/mockData";
import type { Notification } from "../../types/index";
import { cn, timeAgo } from "../../lib/utils";
import {
  AlertTriangle, ShieldCheck, Headphones, Zap, TrendingUp, X, Check,
} from "lucide-react";

const CATEGORY_META: Record<
  Notification["category"],
  { label: string; icon: React.ElementType; colour: string }
> = {
  aml:     { label: "AML",     icon: AlertTriangle, colour: "text-red-500 bg-red-50 dark:bg-red-950" },
  kyc:     { label: "KYC",     icon: ShieldCheck,   colour: "text-amber-500 bg-amber-50 dark:bg-amber-950" },
  ticket:  { label: "Support", icon: Headphones,    colour: "text-blue-500 bg-blue-50 dark:bg-blue-950" },
  system:  { label: "System",  icon: Zap,           colour: "text-purple-500 bg-purple-50 dark:bg-purple-950" },
  trading: { label: "Trading", icon: TrendingUp,    colour: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950" },
};

interface Props {
  open:    boolean;
  onClose: () => void;
}

export function NotificationDrawer({ open, onClose }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState<Notification["category"] | "all">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const visible = filter === "all"
    ? notifications
    : notifications.filter((n) => n.category === filter);

  const markAllRead = () =>
    setNotifications((ns) => ns.map((n) => ({ ...n, read: true })));

  const markRead = (id: string) =>
    setNotifications((ns) =>
      ns.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

  const categories = (
    ["all", "aml", "kyc", "ticket", "trading", "system"] as const
  );

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-[380px] bg-white dark:bg-slate-900 shadow-2xl",
          "flex flex-col border-l border-slate-200 dark:border-slate-700",
          "transition-transform duration-250 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <h2 className="font-semibold text-slate-900 dark:text-slate-50 text-sm">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="text-[11px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
            <h6 className="invisible">h</h6>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-1 px-4 py-2 border-b border-slate-100 dark:border-slate-700 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                filter === cat
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              {cat === "all" ? "All" : CATEGORY_META[cat].label}
              {cat === "all"
                ? unreadCount > 0 && ` (${unreadCount})`
                : ""}
            </button>
          ))}
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm">
              <ShieldCheck className="w-8 h-8 mb-2 text-slate-300" />
              No notifications here
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {visible.map((n) => {
                const meta = CATEGORY_META[n.category];
                const Icon = meta.icon;
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "flex gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40",
                      !n.read && "bg-blue-50/50 dark:bg-blue-950/20"
                    )}
                    onClick={() => markRead(n.id)}
                  >
                    {/* Icon */}
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", meta.colour)}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-sm leading-snug",
                          n.read ? "text-slate-600 dark:text-slate-300" : "text-slate-900 dark:text-slate-50 font-medium"
                        )}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {n.message}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[11px] text-slate-400">
                          {timeAgo(n.timestamp)}
                        </span>
                        {n.href && (
                          <Link
                            href={n.href}
                            onClick={onClose}
                            className="text-[11px] text-blue-600 hover:underline font-medium"
                          >
                            View →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700">
          <button className="w-full text-center text-xs text-slate-400 hover:text-slate-600 transition-colors">
            View notification history →
          </button>
        </div>
      </div>
    </>
  );
}
