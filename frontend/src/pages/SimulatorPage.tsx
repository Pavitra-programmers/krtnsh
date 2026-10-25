import React, { useState, useEffect } from "react";
import {
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";
import { Download } from "lucide-react";
import { MetricCard } from "../components/MetricCard";
import type { SimulatorResponse } from "../types";
import { getSimulator } from "../services/api";

interface SimulatorPageProps {
  initialDate?: string;
  cutoffTime: string;
}

export const SimulatorPage: React.FC<SimulatorPageProps> = ({
  initialDate = "2026-01-15",
  cutoffTime,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [strategy, setStrategy] = useState<"p50" | "p80" | "p90" | "p10">("p50");
  const [demandPeak, setDemandPeak] = useState<number>(38000);
  const [simData, setSimData] = useState<SimulatorResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    getSimulator(selectedDate, cutoffTime, strategy, demandPeak)
      .then((res) => {
        if (isMounted) {
          setSimData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDate, cutoffTime, strategy, demandPeak]);

  const handleExportCsv = () => {
    if (!simData) return;
    const headers = [
      "SettlementPeriod",
      "TimeLabel",
      "StartTime",
      "DemandMW",
      "ForecastWindMW",
      "ProcuredWindMW",
      "ThermalProcuredMW",
      "ActualWindMW",
      "ImbalanceMW",
      "Status",
    ];
    const rows = simData.schedule.map((s) => [
      s.settlement_period,
      s.time_label,
      s.startTime,
      s.demand_mw,
      s.forecast_wind_mw,
      s.procured_wind_mw,
      s.thermal_procured_mw,
      s.actual_wind_mw,
      s.imbalance_mw,
      s.status,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dispatch_schedule_${selectedDate}_${strategy}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Control Console */}
      <div className="matte-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#00E575]" />
              <h2 className="text-base font-bold text-white tracking-tight">
                Day-Ahead Procurement Decision Simulator
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Simulate required thermal procurement and physical imbalance cashout exposure under quantified wind risk policies.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-2 bg-[#161616] border border-white/[0.08] px-3 py-1.5 rounded-full font-mono">
              <span className="text-neutral-500 text-[11px] uppercase tracking-wider font-sans">
                Target Date:
              </span>
              <input
                type="date"
                value={selectedDate}
                min="2026-01-01"
                max="2026-01-31"
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={handleExportCsv}
              disabled={!simData}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-neutral-200 rounded-full border border-white/10 transition text-xs font-medium"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Strategy Buttons & Peak Demand Slider */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
          {/* Risk Hedging Strategy Pills */}
          <div>
            <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-2.5">
              Wind Hedging Policy (Empirical Quantile Offset)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => setStrategy("p50")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  strategy === "p50"
                    ? "bg-[#181818] border-[#00E575] text-white shadow-[0_0_15px_rgba(0,229,117,0.15)]"
                    : "bg-[#141414] border-white/[0.07] hover:border-white/20 text-neutral-400"
                }`}
              >
                <div className="text-xs font-bold text-white">P50 Base</div>
                <div className="text-[10px] text-neutral-500 mt-0.5">Point Forecast</div>
              </button>

              <button
                onClick={() => setStrategy("p80")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  strategy === "p80"
                    ? "bg-[#181818] border-[#00E575] text-white shadow-[0_0_15px_rgba(0,229,117,0.15)]"
                    : "bg-[#141414] border-white/[0.07] hover:border-white/20 text-neutral-400"
                }`}
              >
                <div className="text-xs font-bold text-white">P80 Hedge</div>
                <div className="text-[10px] text-neutral-500 mt-0.5">80% Protected</div>
              </button>

              <button
                onClick={() => setStrategy("p90")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  strategy === "p90"
                    ? "bg-[#181818] border-[#00E575] text-white shadow-[0_0_15px_rgba(0,229,117,0.15)]"
                    : "bg-[#141414] border-white/[0.07] hover:border-white/20 text-neutral-400"
                }`}
              >
                <div className="text-xs font-bold text-white">P90 Max</div>
                <div className="text-[10px] text-neutral-500 mt-0.5">90% Protected</div>
              </button>

              <button
                onClick={() => setStrategy("p10")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  strategy === "p10"
                    ? "bg-[#181818] border-[#00E575] text-white shadow-[0_0_15px_rgba(0,229,117,0.15)]"
                    : "bg-[#141414] border-white/[0.07] hover:border-white/20 text-neutral-400"
                }`}
              >
                <div className="text-xs font-bold text-white">P10 Low</div>
                <div className="text-[10px] text-neutral-500 mt-0.5">Aggressive</div>
              </button>
            </div>
          </div>

          {/* Customer Demand Peak Slider */}
          <div>
            <div className="flex justify-between items-center mb-2.5">
              <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Peak Customer Demand
              </label>
              <span className="text-xs font-mono font-bold text-[#00E575]">
                {demandPeak.toLocaleString()} MW
              </span>
            </div>
            <input
              type="range"
              min={20000}
              max={50000}
              step={1000}
              value={demandPeak}
              onChange={(e) => setDemandPeak(Number(e.target.value))}
              className="w-full cursor-pointer mt-1.5"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 mt-2 font-mono">
              <span>20 GW (Off-Peak)</span>
              <span>38 GW (UK Winter)</span>
              <span>50 GW (Extreme Cold)</span>
            </div>
          </div>
        </div>
      </div>

      {loading || !simData ? (
        <div className="flex items-center justify-center h-64 matte-card">
          <div className="text-center">
            <div className="w-7 h-7 border-2 border-[#00E575] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-mono text-neutral-400">COMPUTING DISPATCH COMMITMENTS...</p>
          </div>
        </div>
      ) : error ? (
        <div className="p-4 bg-[#FF3B30]/10 border border-[#FF3B30]/30 rounded-xl text-xs text-[#FF6961]">
          {error}
        </div>
      ) : (
        <>
          {/* Outcome Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <MetricCard
              title="Thermal Procured"
              value={Math.round(simData.summary.total_thermal_procured_mwh).toLocaleString()}
              unit="MWh"
              subtitle={`£${(simData.summary.estimated_thermal_cost_gbp / 1e6).toFixed(2)}M at £85`}
              badge="Day-Ahead"
              badgeColor="neutral"
            />
            <MetricCard
              title="Wind Procured"
              value={Math.round(simData.summary.total_wind_procured_mwh).toLocaleString()}
              unit="MWh"
              subtitle={`Offset: ${simData.strategy_offset_mw > 0 ? "+" : ""}${simData.strategy_offset_mw} MW`}
              badge={strategy.toUpperCase()}
              badgeColor="green"
            />
            <MetricCard
              title="Actual Wind"
              value={Math.round(simData.summary.total_actual_wind_mwh).toLocaleString()}
              unit="MWh"
              subtitle="Physical Outturn"
              badge="Delivered"
              badgeColor="green"
            />
            <MetricCard
              title="Short Imbalance"
              value={Math.round(simData.summary.short_imbalance_mwh).toLocaleString()}
              unit="MWh"
              subtitle={`Penalty: £${(simData.summary.estimated_imbalance_penalty_gbp / 1e6).toFixed(2)}M`}
              badge={simData.summary.short_imbalance_mwh > 0 ? "Cashout Risk" : "Balanced"}
              badgeColor={simData.summary.short_imbalance_mwh > 0 ? "red" : "green"}
            />
            <MetricCard
              title="Net Total Cost"
              value={`£${(simData.summary.estimated_net_cost_gbp / 1e6).toFixed(2)}M`}
              subtitle="Procurement + Cashout"
              badge="Net Commercial"
              badgeColor="neutral"
            />
          </div>

          {/* Half-Hourly Dispatch Chart */}
          <div className="matte-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Half-Hourly Dispatch Commitment (Settlement Periods 1 to 48)
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Thermal commitments stacked with wind forecast expectation to meet consumer demand
                </p>
              </div>
              <div className="flex items-center space-x-5 text-xs font-medium">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#D97706]" />
                  <span className="text-neutral-300">Procured Thermal</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#00E575]" />
                  <span className="text-neutral-300">Procured Wind</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-0.5 bg-white rounded-full" />
                  <span className="text-neutral-300">Actual Wind</span>
                </div>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={simData.schedule}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
                  <XAxis dataKey="time_label" stroke="#52525B" tick={{ fontSize: 10 }} />
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
                  />
                  <Area
                    type="monotone"
                    dataKey="thermal_procured_mw"
                    name="Thermal Procured"
                    stackId="1"
                    stroke="#D97706"
                    fill="#D97706"
                    fillOpacity={0.65}
                  />
                  <Area
                    type="monotone"
                    dataKey="procured_wind_mw"
                    name="Wind Procured"
                    stackId="1"
                    stroke="#00E575"
                    fill="#00E575"
                    fillOpacity={0.4}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual_wind_mw"
                    name="Actual Delivered Wind"
                    stroke="#FFFFFF"
                    strokeWidth={1.8}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Physical Imbalance Outturn */}
          <div className="matte-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Physical Imbalance Volume (Actual Wind - Procured Wind)
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Red = Short volume cashout penalties; Green = Long spill credits
                </p>
              </div>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={simData.schedule} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
                  <XAxis dataKey="time_label" stroke="#52525B" tick={{ fontSize: 9 }} />
                  <YAxis stroke="#52525B" tick={{ fontSize: 9 }} unit=" MW" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#141414",
                      borderColor: "rgba(255, 255, 255, 0.12)",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                      boxShadow: "0 8px 30px rgba(0, 0, 0, 0.8)",
                    }}
                    formatter={(val: any) => [`${Number(val).toLocaleString()} MW`]}
                  />
                  <Bar
                    dataKey="imbalance_mw"
                    name="Net Imbalance"
                    fill="#00E575"
                    shape={(props: any) => {
                      const { x, y, width, height, value } = props;
                      const fill = value < 0 ? "#FF3B30" : "#00E575";
                      return <rect x={x} y={y} width={width} height={height} fill={fill} rx={2} />;
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Granular Table */}
          <div className="matte-card overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex justify-between items-center">
              <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Half-Hourly Dispatch Log (SPs 1 to 48)
              </h3>
              <span className="text-xs text-neutral-500 font-mono">{selectedDate}</span>
            </div>
            <div className="overflow-x-auto max-h-72">
              <table className="min-w-full divide-y divide-white/[0.05] text-xs">
                <thead className="bg-[#161616] sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-neutral-400">SP</th>
                    <th className="px-4 py-2 text-left font-semibold text-neutral-400">Time (UTC)</th>
                    <th className="px-4 py-2 text-right font-semibold text-neutral-400">Demand</th>
                    <th className="px-4 py-2 text-right font-semibold text-neutral-400">Wind Procured</th>
                    <th className="px-4 py-2 text-right font-semibold text-neutral-400">Thermal Procured</th>
                    <th className="px-4 py-2 text-right font-semibold text-neutral-400">Actual Wind</th>
                    <th className="px-4 py-2 text-right font-semibold text-neutral-400">Imbalance</th>
                    <th className="px-4 py-2 text-center font-semibold text-neutral-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03] bg-[#121212]">
                  {simData.schedule.map((row) => (
                    <tr key={row.settlement_period} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-2 font-mono text-neutral-300">SP {row.settlement_period}</td>
                      <td className="px-4 py-2 text-neutral-400">{row.time_label}</td>
                      <td className="px-4 py-2 text-right text-white font-mono">
                        {row.demand_mw.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right text-[#00E575] font-mono">
                        {row.procured_wind_mw.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right text-[#D97706] font-mono">
                        {row.thermal_procured_mw.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right text-neutral-300 font-mono">
                        {row.actual_wind_mw.toLocaleString()}
                      </td>
                      <td
                        className={`px-4 py-2 text-right font-mono font-semibold ${
                          row.imbalance_mw < 0 ? "text-[#FF3B30]" : "text-[#00E575]"
                        }`}
                      >
                        {row.imbalance_mw > 0 ? `+${row.imbalance_mw}` : row.imbalance_mw}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            row.status === "SHORT"
                              ? "bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/25"
                              : "bg-[#00E575]/10 text-[#00E575] border-[#00E575]/25"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
