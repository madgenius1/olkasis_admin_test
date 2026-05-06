import * as React from "react";
import { cn } from "../../lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2",
        "text-sm shadow-sm placeholder:text-slate-400",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500",
        "disabled:cursor-not-allowed disabled:opacity-50 resize-y",
        "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50",
        "dark:placeholder:text-slate-500",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };