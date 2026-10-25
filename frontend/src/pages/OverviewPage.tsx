import React from "react";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
} from "recharts";
import { ArrowUpRight } from "lucide-react";
import { MetricCard } from "../components/MetricCard";
import type { OverviewResponse } from "../types";

interface OverviewPageProps {
  data: OverviewResponse | null;
  isLoading: boolean;
  onSelectDate: (date: string) => void;
  onNavigateToSimulator: (date: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  data,
  isLoading,
  onNavigateToSimulator,
}) => {
  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-7 h-7 border-2 border-[#00E575] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-mono text-neutral-400">LOADING ANALYTICS...</p>
        </div>
      </div>
    );
  }

  const { metrics, daily_breakdown, timeseries } = data;

  const chartData = timeseries.map((pt) => ({
    time: pt.time.slice(5, 16).replace("T", " "),
    actual: pt.actual_mw,
    forecast: pt.forecast_mw,
    error: pt.error_mw,
    settlementPeriod: pt.settlementPeriod,
  }));

  return (
    <div className="space-y-6">
      {/* Top Stat Cards Grid (OlympTrade matte card style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Actual Generation (Mean)"
          value={metrics.actual_mean.toLocaleString()}
          unit="MW"
          subtitle="Delivered to GB Grid"
          badge="Outturn"
          badgeColor="green"
        />
        <MetricCard
          title="Day-Ahead Forecast (Mean)"
          value={metrics.forecast_mean.toLocaleString()}
          unit="MW"
          subtitle="National SO Model"
          badge="D-1 Cutoff"
          badgeColor="neutral"
        />
        <MetricCard
          title="Forecast Bias (Mean)"
          value={`${metrics.bias > 0 ? "+" : ""}${metrics.bias.toLocaleString()}`}
          unit="MW"
          subtitle="Short Imbalance Exposure"
          badge={metrics.bias > 0 ? "Overforecast" : "Underforecast"}
          badgeColor={metrics.bias > 0 ? "red" : "green"}
        />
        <MetricCard
          title="Mean Absolute Error (MAE)"
          value={metrics.mae.toLocaleString()}
          unit="MW"
          subtitle={`WAPE ${metrics.wape}% • RMSE ${metrics.rmse.toLocaleString()} MW`}
          badge="Error Volatility"
          badgeColor="neutral"
        />
      </div>

      {/* Commercial Pitch Banner (Matte luxury finish) */}
      <div className="matte-card p-6 border-white/[0.08] relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="max-w-3xl">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#00E575]" />
              <span className="text-[11px] font-bold tracking-widest text-[#00E575] uppercase">
                Executive Trading Brief
              </span>
              <span className="text-neutral-500 text-xs">•</span>
              <span className="text-neutral-400 text-xs">January 2026 Outturn Analysis</span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight mt-2 font-sans">
              Systematic Overforecasting of{" "}
              <span className="text-[#00E575]">+{metrics.bias.toLocaleString()} MW</span> Exposed
              the Desk to Under-Procurement
            </h3>
            <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
              Relying strictly on unadjusted day-ahead wind forecasts led to unhedged thermal shortfalls
              during high winter demand peaks. Transitioning to quantile downside hedging (P80/P90)
              stabilizes physical dispatch commitments and curbs cashout penalties.
            </p>
          </div>

          <button
            onClick={() => onNavigateToSimulator("2026-01-15")}
            className="flex items-center space-x-2 px-5 py-3 rounded-full bg-[#00E575] hover:bg-[#00c966] text-black text-xs font-bold tracking-wide transition shadow-lg shadow-[#00E575]/20 shrink-0"
          >
            <span>Launch Thermal Simulator</span>
            <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Main Trading Chart: Actual Outturn vs Day-Ahead Forecast */}
      <div className="matte-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              National Wind Power: Actual Outturn vs. Day-Ahead Forecast
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Target Scope: {data.parameters.start_date} to {data.parameters.end_date} (Gate Closure: {data.parameters.cutoff_time} UTC)
            </p>
          </div>

          <div className="flex items-center space-x-5 text-xs font-medium">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00E575] shadow-[0_0_6px_#00E575]" />
              <span className="text-neutral-200">Actual Outturn (FUELHH)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-0.5 bg-neutral-400 rounded-full" />
              <span className="text-neutral-400">Day-Ahead Forecast (WINDFOR)</span>
            </div>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="actualGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00E575" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#00E575" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
              <XAxis dataKey="time" stroke="#52525B" tick={{ fontSize: 10 }} minTickGap={50} />
              <YAxis
                stroke="#52525B"
                tick={{ fontSize: 10 }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                unit=" MW"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#141414",
                  borderColor: "rgba(255, 255, 255, 0.12)",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                  boxShadow: "0 8px 30px rgba(0, 0, 0, 0.8)",
                }}
                formatter={(val: any) => [`${Number(val).toLocaleString()} MW`]}
                labelFormatter={(label) => `Timestamp: ${label} UTC`}
              />
              <Area
                type="monotone"
                dataKey="actual"
                name="Actual Outturn"
                stroke="#00E575"
                strokeWidth={2}
                fill="url(#actualGlow)"
              />
              <Line
                type="monotone"
                dataKey="forecast"
                name="Day-Ahead Forecast"
                stroke="#8E8E93"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
              <Brush dataKey="time" height={24} stroke="#222222" fill="#0A0A0A" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Performance Heatmap (Matte Minimal Grid) */}
      <div className="matte-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight uppercase">
              January 2026 Daily Error Distribution
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Select any delivery date to inspect in the Day-Ahead Procurement Simulator
            </p>
          </div>
          <div className="flex items-center space-x-4 text-xs text-neutral-400">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FF3B30]" />
              <span>Overforecast (&gt; +2,000 MW)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00E575]" />
              <span>Underforecast / Accurate</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {daily_breakdown.map((day) => {
            const isHighOverforecast = day.bias > 2000;
            const isUnderforecast = day.bias < -500;
            const borderAccent = isHighOverforecast
              ? "border-[#FF3B30]/30 hover:border-[#FF3B30] text-[#FF6961]"
              : isUnderforecast
              ? "border-[#00E575]/30 hover:border-[#00E575] text-[#00E575]"
              : "border-white/[0.06] hover:border-white/20 text-neutral-300";

            return (
              <button
                key={day.date}
                onClick={() => onNavigateToSimulator(day.date)}
                className={`p-3 rounded-xl bg-[#141414] border text-left transition-all group flex flex-col justify-between ${borderAccent}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-[#00E575] transition-colors">
                    {day.date.slice(5)}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {day.count} SPs
                  </span>
                </div>
                <div className="mt-2.5 space-y-0.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-neutral-500 font-sans text-[10px]">Bias:</span>
                    <span className="font-semibold">
                      {day.bias > 0 ? `+${Math.round(day.bias)}` : Math.round(day.bias)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 font-sans text-[10px]">MAE:</span>
                    <span className="text-neutral-400">{Math.round(day.mae)}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
