import { type ReactNode } from "react";
import { cn } from "../../lib/utils";

interface PageHeaderProps {
  title:       string;
  subtitle?:   string;
  actions?:    ReactNode;
  className?:  string;
  /** Show a "Live" status dot */
  live?:       boolean;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
  live,
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-6", className)}>
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            {title}
          </h1>
          {live && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
