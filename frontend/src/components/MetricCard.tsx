import React from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: "green" | "red" | "neutral";
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  badge,
  badgeColor = "neutral",
}) => {
  const badgeClasses = {
    green: "bg-[#00E575]/10 text-[#00E575] border-[#00E575]/25",
    red: "bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/25",
    neutral: "bg-white/5 text-neutral-300 border-white/10",
  }[badgeColor];

  return (
    <div className="matte-card p-5 group hover:border-white/20 transition-all duration-200">
      <div className="text-[11px] font-medium tracking-wider uppercase text-neutral-400">
        {title}
      </div>

      <div className="mt-2.5 flex items-baseline space-x-1.5">
        <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-medium text-neutral-400 font-sans">
            {unit}
          </span>
        )}
      </div>

      {(subtitle || badge) && (
        <div className="mt-3 pt-2.5 border-t border-white/[0.05] flex items-center justify-between text-xs">
          {subtitle && (
            <span className="text-neutral-400 text-[11px]">{subtitle}</span>
          )}
          {badge && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeClasses}`}
            >
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
