import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, isValid } from "date-fns";
import { Calendar as CalendarIcon, Clock, X } from "lucide-react";
import * as React from "react";

export interface DateTimePickerProps {
  value?: string;
  onChange: (value: string) => void;
  type?: "date" | "datetime-local";
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DateTimePicker({
  value,
  onChange,
  type = "datetime-local",
  placeholder,
  className,
  disabled = false,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const parsedDate = React.useMemo(() => {
    if (!value) return undefined;
    const d = new Date(value);
    return isValid(d) ? d : undefined;
  }, [value]);

  const timeValue = React.useMemo(() => {
    if (!value || type !== "datetime-local") return "00:00";
    const d = new Date(value);
    if (!isValid(d)) return "00:00";
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }, [value, type]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onChange("");
      if (type === "date") setIsOpen(false);
      return;
    }

    const finalDate = new Date(date);
    if (type === "datetime-local") {
      const [hours, minutes] = timeValue.split(":").map(Number);
      finalDate.setHours(hours || 0);
      finalDate.setMinutes(minutes || 0);
      finalDate.setSeconds(0);
      finalDate.setMilliseconds(0);
      onChange(format(finalDate, "yyyy-MM-dd'T'HH:mm"));
    } else {
      onChange(format(finalDate, "yyyy-MM-dd"));
      setIsOpen(false);
    }
  };

  const handleTimeChange = (newTime: string) => {
    const baseDate = parsedDate || new Date();
    const finalDate = new Date(baseDate);
    const [hours, minutes] = newTime.split(":").map(Number);
    finalDate.setHours(hours || 0);
    finalDate.setMinutes(minutes || 0);
    finalDate.setSeconds(0);
    finalDate.setMilliseconds(0);
    onChange(format(finalDate, "yyyy-MM-dd'T'HH:mm"));
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  const displayString = React.useMemo(() => {
    if (!value)
      return (
        placeholder ||
        (type === "datetime-local" ? "Select Date & Time" : "Select Date")
      );
    const date = new Date(value);
    if (!isValid(date))
      return (
        placeholder ||
        (type === "datetime-local" ? "Select Date & Time" : "Select Date")
      );

    return type === "datetime-local"
      ? format(date, "MMM dd, yyyy  hh:mm a")
      : format(date, "MMM dd, yyyy");
  }, [value, type, placeholder]);

  const hasValue = !!value;

  return (
    <Popover
      open={disabled ? false : isOpen}
      onOpenChange={(open) => {
        if (!disabled) setIsOpen(open);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-9 text-xs justify-between text-left font-medium w-[200px]",
            "border-slate-200 bg-white/80 text-foreground",
            "hover:bg-orange-50/60 hover:border-orange-300",
            "transition-all duration-200 rounded-lg px-3 shadow-sm",
            "focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400",
            hasValue && "border-orange-200/80 bg-orange-50/30",
            !hasValue && "text-muted-foreground",
            className,
          )}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Icon pill */}
            <span
              className={cn(
                "flex items-center justify-center w-5 h-5 rounded-md shrink-0 transition-all duration-200",
                hasValue
                  ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-sm shadow-orange-500/30"
                  : "bg-slate-100 text-slate-400",
              )}
            >
              <CalendarIcon className="h-3 w-3" />
            </span>
            <span className="truncate text-[11px] font-semibold">
              {displayString}
            </span>
          </div>
          {hasValue && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  handleClear();
                }
              }}
              className={cn(
                "ml-1.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center",
                "text-slate-400 hover:text-white hover:bg-slate-400",
                "transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-orange-500",
              )}
            >
              <X className="h-2.5 w-2.5" />
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className={cn(
          "w-auto p-0 rounded-2xl overflow-hidden",
          "border border-slate-200/80 shadow-2xl shadow-black/10",
          "bg-white/95 backdrop-blur-xl",
          "animate-in fade-in-0 zoom-in-95 duration-200",
        )}
        align="start"
      >
        {/* Calendar header accent */}
        <div className="h-1 w-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400" />

        <Calendar
          mode="single"
          selected={parsedDate}
          onSelect={handleDateSelect}
          initialFocus
          className="border-0 rounded-none p-3"
        />

        {type === "datetime-local" && (
          <div className="border-t border-slate-100 px-4 py-3 bg-gradient-to-b from-slate-50/80 to-slate-100/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-md bg-gradient-to-br from-orange-500 to-orange-600 shadow-sm shadow-orange-500/30">
                  <Clock className="h-3 w-3 text-white" />
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest select-none">
                  Time
                </span>
              </div>
              <div
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 rounded-lg",
                  "bg-white border border-slate-200 shadow-sm",
                  "hover:border-orange-300 hover:shadow-md",
                  "transition-all duration-200 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-500/20",
                )}
              >
                <input
                  type="time"
                  value={timeValue}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className={cn(
                    "h-5 w-[72px] text-[11px] font-bold text-slate-800",
                    "bg-transparent border-0 outline-none cursor-pointer text-center p-0",
                    "focus:ring-0 focus:outline-none select-none",
                    // Hide browser native time picker chrome
                    "[&::-webkit-calendar-picker-indicator]:opacity-0",
                    "[&::-webkit-calendar-picker-indicator]:absolute",
                    "[&::-webkit-inner-spin-button]:hidden",
                    "[&::-webkit-clear-button]:hidden",
                  )}
                />
              </div>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
