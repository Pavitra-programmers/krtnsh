import React, { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Download } from "lucide-react";
import { MetricCard } from "../components/MetricCard";
import type { AccuracyResponse } from "../types";

interface AccuracyPageProps {
  data: AccuracyResponse | null;
  isLoading: boolean;
}

export const AccuracyPage: React.FC<AccuracyPageProps> = ({ data, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState<string>("");

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-7 h-7 border-2 border-[#00E575] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-mono text-neutral-400">COMPUTING STATISTICAL ACCURACY...</p>
        </div>
      </div>
    );
  }

  const { metrics, daily_breakdown, diurnal_profile, error_distribution, scatter_sample, lead_time_decay } = data;

  const filteredDays = daily_breakdown.filter((d) => d.date.includes(searchTerm));

  const handleExportCsv = () => {
    const headers = ["Date", "ActualMeanMW", "ForecastMeanMW", "ActualPeakMW", "ForecastPeakMW", "MAEMW", "RMSEMW", "BiasMW", "WAPEPct", "Periods"];
    const rows = daily_breakdown.map((d) => [
      d.date,
      d.actual_mean,
      d.forecast_mean,
      d.actual_peak,
      d.forecast_peak,
      d.mae,
      d.rmse,
      d.bias,
      d.wape,
      d.count,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `wind_accuracy_january_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* High-Level Statistical Suite Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          title="MAE"
          value={metrics.mae.toLocaleString()}
          unit="MW"
          subtitle="Mean Absolute Error"
          badge="Dispersion"
          badgeColor="neutral"
        />
        <MetricCard
          title="RMSE"
          value={metrics.rmse.toLocaleString()}
          unit="MW"
          subtitle="Quadratic Loss"
          badge="Volatility"
          badgeColor="neutral"
        />
        <MetricCard
          title="Mean Bias"
          value={`${metrics.bias > 0 ? "+" : ""}${metrics.bias.toLocaleString()}`}
          unit="MW"
          subtitle="Systematic Shift"
          badge={metrics.bias > 0 ? "Overforecast" : "Underforecast"}
          badgeColor={metrics.bias > 0 ? "red" : "green"}
        />
        <MetricCard
          title="WAPE"
          value={metrics.wape}
          unit="%"
          subtitle="Weighted Abs %"
          badge="Zero-Safe"
          badgeColor="green"
        />
        <MetricCard
          title="Fit (R²)"
          value={metrics.r_squared}
          subtitle={`r = ${metrics.correlation}`}
          badge="Correlation"
          badgeColor="green"
        />
        <MetricCard
          title="P10 Downside"
          value={metrics.p10_error.toLocaleString()}
          unit="MW"
          subtitle={`P90: +${metrics.p90_error} MW`}
          badge="Empirical"
          badgeColor="neutral"
        />
      </div>

      {/* Row 1: Error Distribution & Diurnal Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="matte-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Error Distribution (Residual Histogram)
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Mean: +{error_distribution.mean} MW • Std Dev: {error_distribution.std} MW
              </p>
            </div>
            <div className="text-xs font-mono text-neutral-400">
              P10: <span className="text-[#FF3B30] font-semibold">{metrics.p10_error} MW</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={error_distribution.bins} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
                <XAxis dataKey="mid" stroke="#52525B" tick={{ fontSize: 9 }} unit=" MW" />
                <YAxis stroke="#52525B" tick={{ fontSize: 9 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#141414",
                    borderColor: "rgba(255, 255, 255, 0.12)",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                  }}
                  formatter={(val: any) => [`${val} periods`]}
                  labelFormatter={(l) => `Midpoint: ${l} MW`}
                />
                <ReferenceLine x={0} stroke="#52525B" strokeWidth={1} />
                <Bar dataKey="count" name="Periods" fill="#00E575" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="matte-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Diurnal Profile (Settlement Periods 1 to 48)
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Average Actuals vs Forecasts across half-hours of the delivery day
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={diurnal_profile} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
                <XAxis dataKey="time_label" stroke="#52525B" tick={{ fontSize: 9 }} interval={5} />
                <YAxis stroke="#52525B" tick={{ fontSize: 9 }} unit=" MW" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#141414",
                    borderColor: "rgba(255, 255, 255, 0.12)",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                  }}
                  formatter={(val: any) => [`${Number(val).toLocaleString()} MW`]}
                />
                <Line type="monotone" dataKey="actual_mean" name="Mean Actual" stroke="#00E575" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="forecast_mean" name="Mean Forecast" stroke="#FFFFFF" dot={false} strokeWidth={1.5} />
                <Line type="monotone" dataKey="mae" name="MAE" stroke="#D97706" strokeDasharray="3 3" dot={false} strokeWidth={1.2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Scatter Plot & Lead-Time Decay */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="matte-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Forecast vs. Actual Correlation Scatter
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                45° line represents perfect parity (R² = {metrics.r_squared})
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
                <XAxis
                  type="number"
                  dataKey="actual_mw"
                  name="Actual"
                  unit=" MW"
                  stroke="#52525B"
                  tick={{ fontSize: 9 }}
                />
                <YAxis
                  type="number"
                  dataKey="forecast_mw"
                  name="Forecast"
                  unit=" MW"
                  stroke="#52525B"
                  tick={{ fontSize: 9 }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  contentStyle={{
                    backgroundColor: "#141414",
                    borderColor: "rgba(255, 255, 255, 0.12)",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                  }}
                  formatter={(val: any) => [`${Number(val).toLocaleString()} MW`]}
                />
                <Scatter data={scatter_sample} fill="#00E575" fillOpacity={0.5} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="matte-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Forecast Lead-Time Error Decay
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Error degradation as lead horizon extends from 0h to 48h+
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lead_time_decay} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
                <XAxis dataKey="bucket" stroke="#52525B" tick={{ fontSize: 9 }} />
                <YAxis stroke="#52525B" tick={{ fontSize: 9 }} unit=" MW" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#141414",
                    borderColor: "rgba(255, 255, 255, 0.12)",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                  }}
                  formatter={(val: any) => [`${Number(val).toLocaleString()} MW`]}
                />
                <Bar dataKey="mae" name="MAE (MW)" fill="#00E575" radius={[3, 3, 0, 0]} />
                <Bar dataKey="rmse" name="RMSE (MW)" fill="#333333" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Daily Breakdown Table */}
      <div className="matte-card overflow-hidden">
        <div className="p-5 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Daily Performance Log</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Summary across all 31 delivery days in January 2026</p>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <input
              type="text"
              placeholder="Filter date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#161616] border border-white/[0.08] rounded-full px-3 py-1.5 text-white placeholder-neutral-500 focus:outline-none focus:border-white/20 font-mono text-xs"
            />
            <button
              onClick={handleExportCsv}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-neutral-200 rounded-full border border-white/10 transition font-medium"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-80">
          <table className="min-w-full divide-y divide-white/[0.05] text-xs">
            <thead className="bg-[#161616] sticky top-0">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold text-neutral-400">Date</th>
                <th className="px-4 py-2.5 text-right font-semibold text-neutral-400">Actual Mean</th>
                <th className="px-4 py-2.5 text-right font-semibold text-neutral-400">Forecast Mean</th>
                <th className="px-4 py-2.5 text-right font-semibold text-neutral-400">Actual Peak</th>
                <th className="px-4 py-2.5 text-right font-semibold text-neutral-400">Forecast Peak</th>
                <th className="px-4 py-2.5 text-right font-semibold text-neutral-400">MAE (MW)</th>
                <th className="px-4 py-2.5 text-right font-semibold text-neutral-400">RMSE (MW)</th>
                <th className="px-4 py-2.5 text-right font-semibold text-neutral-400">Bias (MW)</th>
                <th className="px-4 py-2.5 text-right font-semibold text-neutral-400">WAPE</th>
                <th className="px-4 py-2.5 text-center font-semibold text-neutral-400">SPs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03] bg-[#121212]">
              {filteredDays.map((d) => (
                <tr key={d.date} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-2 font-mono text-neutral-200">{d.date}</td>
                  <td className="px-4 py-2 text-right font-mono text-[#00E575]">
                    {d.actual_mean.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-white">
                    {d.forecast_mean.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-neutral-400">
                    {d.actual_peak.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-neutral-400">
                    {d.forecast_peak.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right font-mono font-semibold text-white">
                    {d.mae.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-neutral-400">
                    {d.rmse.toLocaleString()}
                  </td>
                  <td
                    className={`px-4 py-2 text-right font-mono font-semibold ${
                      d.bias > 0 ? "text-[#FF3B30]" : "text-[#00E575]"
                    }`}
                  >
                    {d.bias > 0 ? `+${d.bias}` : d.bias}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-neutral-300">{d.wape}%</td>
                  <td className="px-4 py-2 text-center text-neutral-500 font-mono">{d.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
