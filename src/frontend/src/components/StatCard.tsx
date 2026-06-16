import { TrendingDown, TrendingUp } from "lucide-react";
import type { ComponentType } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  trend?: { value: string; up: boolean };
  accentColor?: string;
  "data-ocid"?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  accentColor = "text-primary",
  ...props
}: StatCardProps) {
  return (
    <div
      data-ocid={props["data-ocid"]}
      className="glass-elevated rounded-xl p-5 shadow-glass-sm hover:shadow-glass transition-smooth"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <p className={`text-2xl font-bold mt-1 font-display ${accentColor}`}>
            {value}
          </p>
          {trend && (
            <div
              className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${trend.up ? "text-emerald-400" : "text-destructive"}`}
            >
              {trend.up ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {trend.value}
            </div>
          )}
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className={`w-5 h-5 ${accentColor}`} />
        </div>
      </div>
    </div>
  );
}
