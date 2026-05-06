"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "../../lib/utils";

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  /** Colour variant for the indicator */
  variant?: "default" | "success" | "warning" | "danger";
  /** Show value label inside/beside the bar */
  showValue?: boolean;
}

const INDICATOR_COLOURS: Record<NonNullable<ProgressProps["variant"]>, string> = {
  default: "bg-blue-600",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger:  "bg-red-500",
};

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant = "default", showValue, ...props }, ref) => (
  <div className="flex items-center gap-2 w-full">
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full flex-1 transition-all duration-300 ease-in-out rounded-full",
          INDICATOR_COLOURS[variant]
        )}
        style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
      />
    </ProgressPrimitive.Root>
    {showValue && (
      <span className="text-xs font-mono text-slate-600 dark:text-slate-400 shrink-0 w-9 text-right">
        {value ?? 0}%
      </span>
    )}
  </div>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };