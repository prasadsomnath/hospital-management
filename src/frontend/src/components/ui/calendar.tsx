"use client";

import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import * as React from "react";
import {
  type DayButton,
  DayPicker,
  getDefaultClassNames,
} from "react-day-picker";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-background group/calendar p-2.5 [--cell-size:28px]",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "flex gap-2 flex-col md:flex-row relative",
          defaultClassNames.months,
        ),
        month: cn("flex flex-col w-full gap-1.5", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex items-center justify-between w-full h-7 pointer-events-none z-10 px-0.5",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          "h-6 w-6 p-0 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 bg-white shadow-3xs rounded-md flex items-center justify-center pointer-events-auto transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 cursor-pointer select-none",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          "h-6 w-6 p-0 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 bg-white shadow-3xs rounded-md flex items-center justify-center pointer-events-auto transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 cursor-pointer select-none",
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "relative flex items-center justify-center h-7 w-full mb-1.5 select-none",
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          "w-full flex items-center text-xs font-medium justify-center h-7 gap-1",
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          "relative has-focus:border-orange-500 border border-input shadow-xs has-focus:ring-orange-500/50 has-focus:ring-[3px] rounded-md",
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn(
          "absolute bg-popover inset-0 opacity-0",
          defaultClassNames.dropdown,
        ),
        caption_label: cn(
          "select-none font-semibold text-slate-800 text-xs",
          captionLayout === "label"
            ? "text-xs"
            : "rounded-md pl-2 pr-1 flex items-center gap-1 text-xs h-6 [&>svg]:text-muted-foreground [&>svg]:size-2.5",
          defaultClassNames.caption_label,
        ),
        table: "w-full border-collapse",
        weekdays: cn(
          "flex justify-between w-full mb-0.5",
          defaultClassNames.weekdays,
        ),
        weekday: cn(
          "text-slate-400 font-semibold text-[9px] select-none w-7 h-7 flex items-center justify-center text-center flex-1",
          defaultClassNames.weekday,
        ),
        week: cn("flex w-full mt-0.5 justify-between", defaultClassNames.week),
        week_number_header: cn(
          "select-none w-7",
          defaultClassNames.week_number_header,
        ),
        week_number: cn(
          "text-[9px] select-none text-muted-foreground",
          defaultClassNames.week_number,
        ),
        day: cn(
          "relative w-7 h-7 p-0 text-center flex items-center justify-center aspect-square select-none flex-1",
          defaultClassNames.day,
        ),
        range_start: cn(
          "rounded-l-md bg-orange-50",
          defaultClassNames.range_start,
        ),
        range_middle: cn(
          "rounded-none bg-orange-50/50",
          defaultClassNames.range_middle,
        ),
        range_end: cn("rounded-r-md bg-orange-50", defaultClassNames.range_end),
        today: cn(
          "bg-slate-50 text-slate-900 rounded-md data-[selected=true]:rounded-none",
          defaultClassNames.today,
        ),
        outside: cn(
          "text-muted-foreground/30 aria-selected:text-muted-foreground/30",
          defaultClassNames.outside,
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled,
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          );
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon
                className={cn("size-3 text-slate-500", className)}
                {...props}
              />
            );
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-3 text-slate-500", className)}
                {...props}
              />
            );
          }

          return (
            <ChevronDownIcon
              className={cn("size-3 text-slate-500", className)}
              {...props}
            />
          );
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-7 items-center justify-center text-center">
                {children}
              </div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "flex aspect-square h-6 w-6 items-center justify-center rounded-md font-medium transition-all duration-150 relative text-[10px] select-none",
        "focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500",

        // Hover
        "hover:bg-orange-50 hover:text-orange-950",

        // Single selection
        "data-[selected-single=true]:bg-orange-500 data-[selected-single=true]:text-white data-[selected-single=true]:font-semibold data-[selected-single=true]:shadow-3xs data-[selected-single=true]:shadow-orange-500/10 data-[selected-single=true]:hover:bg-orange-600",

        // Ranges
        "data-[range-start=true]:bg-orange-500 data-[range-start=true]:text-white data-[range-start=true]:font-semibold data-[range-start=true]:rounded-l-md data-[range-start=true]:hover:bg-orange-600",
        "data-[range-end=true]:bg-orange-500 data-[range-end=true]:text-white data-[range-end=true]:font-semibold data-[range-end=true]:rounded-r-md data-[range-end=true]:hover:bg-orange-600",
        "data-[range-middle=true]:bg-orange-50 data-[range-middle=true]:text-orange-900 data-[range-middle=true]:rounded-none data-[range-middle=true]:hover:bg-orange-100",

        // Today & states
        modifiers.today &&
          !modifiers.selected &&
          "bg-slate-100 font-bold border border-slate-200 text-slate-800",
        modifiers.outside &&
          "text-slate-300 opacity-40 pointer-events-none hover:bg-transparent",
        modifiers.disabled &&
          "text-slate-300 opacity-40 pointer-events-none hover:bg-transparent",

        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
