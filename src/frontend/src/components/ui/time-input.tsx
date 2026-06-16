import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import * as React from "react";

export interface TimeInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label shown above the input; if omitted, no label is rendered */
  label?: string;
  /** Show the clock icon (default: true) */
  showIcon?: boolean;
}

/**
 * A beautifully styled time input that replaces the plain browser-native
 * `<input type="time">`. Hides the native picker chrome, provides a clock
 * icon, focus ring, and consistent design-system styling.
 */
const TimeInput = React.forwardRef<HTMLInputElement, TimeInputProps>(
  ({ className, label, showIcon = true, id, ...props }, ref) => {
    const inputId = id ?? React.useId();

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[10px] font-bold uppercase tracking-widest text-slate-500 select-none"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            "group flex items-center gap-2 px-3 py-2 rounded-lg",
            "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800",
            "shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-700",
            "transition-all duration-200",
            "focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:shadow-orange-500/10",
            className,
          )}
        >
          {showIcon && (
            <span
              className={cn(
                "flex items-center justify-center w-5 h-5 rounded-md shrink-0",
                "bg-gradient-to-br from-orange-500 to-orange-600",
                "shadow-sm shadow-orange-500/30",
                "transition-all duration-200 group-focus-within:scale-110",
              )}
            >
              <Clock className="h-3 w-3 text-white" />
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            type="time"
            className={cn(
              "flex-1 min-w-0 bg-transparent border-0 outline-none",
              "text-[12px] font-bold text-slate-800 dark:text-slate-100",
              "cursor-pointer focus:ring-0 focus:outline-none",
              "placeholder:text-slate-400",
              // Hide browser native chrome
              "[&::-webkit-calendar-picker-indicator]:opacity-0",
              "[&::-webkit-calendar-picker-indicator]:absolute",
              "[&::-webkit-inner-spin-button]:hidden",
              "[&::-webkit-clear-button]:hidden",
            )}
            {...props}
          />
        </div>
      </div>
    );
  },
);
TimeInput.displayName = "TimeInput";

export { TimeInput };
