import { type LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from '../../lib/utils';

export interface StatCardProps {
  title:       string;
  value:       string;
  change?:     string;
  changeType?: "up" | "down" | "neutral";
  sub?:        string;
  icon?:       LucideIcon;
  iconColor?:  string;
  iconBg?:     string;
  className?:  string;
  /** Compact variant: smaller padding */
  compact?:    boolean;
}

export function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  sub,
  icon: Icon,
  iconColor = "text-blue-700",
  iconBg    = "bg-blue-50 dark:bg-blue-900/40",
  className,
  compact,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700",
        "rounded-xl shadow-sm hover:shadow-md transition-shadow",
        compact ? "p-4" : "p-5",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Title */}
          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">
            {title}
          </p>

          {/* Value */}
          <p
            className={cn(
              "font-bold text-slate-900 dark:text-slate-50 font-mono tracking-tight mt-1.5 leading-none",
              compact ? "text-xl" : "text-[26px]"
            )}
          >
            {value}
          </p>

          {/* Change + sub-label */}
          {(change ?? sub) && (
            <div className="flex items-center gap-1.5 mt-2">
              {change && (
                <>
                  {changeType === "up" && (
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  )}
                  {changeType === "down" && (
                    <ArrowDownRight className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  )}
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      changeType === "up"      && "text-emerald-600",
                      changeType === "down"    && "text-red-500",
                      changeType === "neutral" && "text-slate-500"
                    )}
                  >
                    {change}
                  </span>
                </>
              )}
              {sub && (
                <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
                  {sub}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Icon */}
        {Icon && (
          <div
            className={cn(
              "rounded-xl flex items-center justify-center shrink-0",
              compact ? "w-9 h-9" : "w-10 h-10",
              iconBg
            )}
          >
            <Icon
              className={cn(
                iconColor,
                compact ? "w-4 h-4" : "w-5 h-5"
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
}