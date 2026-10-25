import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { DailyForecastResponse, VintageEvolutionResponse } from "../types";
import { getDailyForecast, getVintageEvolution } from "../services/api";

interface ForecastExplorerPageProps {
  cutoffTime: string;
}

export const ForecastExplorerPage: React.FC<ForecastExplorerPageProps> = ({ cutoffTime }) => {
  const [selectedDate, setSelectedDate] = useState<string>("2026-01-15");
  const [selectedSp, setSelectedSp] = useState<number>(25); // 12:00 UTC
  const [forecastData, setForecastData] = useState<DailyForecastResponse | null>(null);
  const [vintageData, setVintageData] = useState<VintageEvolutionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getDailyForecast(selectedDate, cutoffTime, "settlement_period")
      .then((res) => {
        if (isMounted) {
          setForecastData(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedDate, cutoffTime]);

  useEffect(() => {
    if (!forecastData || forecastData.periods.length === 0) return;
    const period = forecastData.periods.find((p) => p.settlementPeriod === selectedSp);
    if (!period) return;

    const targetHour = period.startTime.slice(11, 19);
    const alignedHour = targetHour.slice(0, 3) + "00:00";

    getVintageEvolution(selectedDate, alignedHour).then((res) => {
      setVintageData(res);
    });
  }, [selectedDate, selectedSp, forecastData]);

  const activePeriod = forecastData?.periods.find((p) => p.settlementPeriod === selectedSp);

  const fanChartData = vintageData?.revisions
    ? [...vintageData.revisions]
        .sort((a, b) => b.lead_hours - a.lead_hours)
        .map((r) => ({
          leadHours: `${r.lead_hours}h`,
          lead_num: r.lead_hours,
          forecast: r.forecast_mw,
          publishTime: r.publishTime.slice(5, 16).replace("T", " "),
        }))
    : [];

  return (
    <div className="space-y-6">
      <div className="matte-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#00E575]" />
              <h2 className="text-base font-bold text-white tracking-tight">
                Settlement Period Inspector & Vintage Fan Chart
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Inspect any of the 48 Settlement Periods and observe how National Grid ESO updated its prediction over time.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <div className="flex items-center space-x-2 bg-[#161616] border border-white/[0.08] px-3 py-1.5 rounded-full font-mono">
              <span className="text-neutral-500 font-sans text-[11px] uppercase tracking-wider">
                Date:
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
          </div>
        </div>

        {/* Timeline Slider */}
        <div className="mt-6 pt-5 border-t border-white/[0.06]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-300">
              Target: <span className="text-[#00E575] font-mono font-bold">SP {selectedSp}</span> ({activePeriod?.time_label || "00:00"} UTC)
            </span>
            <span className="text-[11px] text-neutral-500 font-mono">30-min Block</span>
          </div>
          <input
            type="range"
            min={1}
            max={48}
            value={selectedSp}
            onChange={(e) => setSelectedSp(Number(e.target.value))}
            className="w-full cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-neutral-500 mt-2 font-mono">
            <span>SP 1 (00:00)</span>
            <span>SP 12 (06:00)</span>
            <span>SP 24 (12:00)</span>
            <span>SP 36 (18:00)</span>
            <span>SP 48 (23:30)</span>
          </div>
        </div>
      </div>

      {loading || !forecastData ? (
        <div className="flex items-center justify-center h-64 matte-card">
          <div className="text-center">
            <div className="w-7 h-7 border-2 border-[#00E575] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-mono text-neutral-400">LOADING PERIOD DATA...</p>
          </div>
        </div>
      ) : (
        <>
          {activePeriod && (
            <div className="matte-card p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="p-4 bg-[#161616] rounded-xl border border-white/[0.06]">
                  <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Target Period</div>
                  <div className="text-lg font-bold text-white mt-1 font-mono">
                    SP {activePeriod.settlementPeriod} ({activePeriod.time_label})
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-1 font-mono truncate">{activePeriod.startTime}</div>
                </div>

                <div className="p-4 bg-[#161616] rounded-xl border border-white/[0.06]">
                  <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Actual Outturn</div>
                  <div className="text-lg font-bold text-[#00E575] mt-1 font-mono">
                    {activePeriod.actual_mw.toLocaleString()} MW
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-1">Elexon FUELHH (WIND)</div>
                </div>

                <div className="p-4 bg-[#161616] rounded-xl border border-white/[0.06]">
                  <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Day-Ahead Forecast</div>
                  <div className="text-lg font-bold text-white mt-1 font-mono">
                    {activePeriod.forecast_mw.toLocaleString()} MW
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-1">D-1 {cutoffTime} Cutoff</div>
                </div>

                <div className="p-4 bg-[#161616] rounded-xl border border-white/[0.06]">
                  <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Forecast Error</div>
                  <div
                    className={`text-lg font-bold mt-1 font-mono ${
                      activePeriod.error_mw > 0 ? "text-[#FF3B30]" : "text-[#00E575]"
                    }`}
                  >
                    {activePeriod.error_mw > 0 ? `+${activePeriod.error_mw}` : activePeriod.error_mw} MW
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-1">
                    {activePeriod.error_mw > 0 ? "Overforecast" : "Underforecast"}
                  </div>
                </div>

                <div className="p-4 bg-[#161616] rounded-xl border border-white/[0.06]">
                  <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Audit Vintage</div>
                  <div className="text-xs font-semibold text-neutral-300 mt-1 truncate font-mono">
                    {activePeriod.forecast_publish_time || "N/A"}
                  </div>
                  <div className="text-[10px] text-[#00E575] font-medium mt-1">
                    Zero Look-Ahead Bias
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fan Chart */}
          <div className="matte-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Forecast Evolution Timeline ("Fan Chart")
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Shows how National Grid ESO forecast revisions evolved from 50+ hours out down to real-time.
                </p>
              </div>
              <div className="flex items-center space-x-5 text-xs font-medium">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00E575]" />
                  <span className="text-neutral-300">Actual Outturn Baseline</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-0.5 bg-neutral-400 rounded-full" />
                  <span className="text-neutral-400">Published Forecasts (WINDFOR)</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              {fanChartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-neutral-500 text-xs font-mono">
                  No historical revisions found for this target hour.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fanChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
                    <XAxis
                      dataKey="leadHours"
                      stroke="#52525B"
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      stroke="#52525B"
                      tick={{ fontSize: 10 }}
                      unit=" MW"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#141414",
                        borderColor: "rgba(255, 255, 255, 0.12)",
                        borderRadius: "0.75rem",
                        fontSize: "12px",
                      }}
                      formatter={(val: any) => [`${Number(val).toLocaleString()} MW`]}
                      labelFormatter={(label) => `Lead Horizon: ${label}`}
                    />
                    {vintageData && vintageData.actual_mw !== null && (
                      <ReferenceLine
                        y={vintageData.actual_mw}
                        stroke="#00E575"
                        strokeDasharray="4 4"
                        label={{
                          value: `Actual: ${vintageData.actual_mw?.toLocaleString()} MW`,
                          position: "top",
                          fill: "#00E575",
                          fontSize: 11,
                        }}
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="forecast"
                      name="Forecast Revision"
                      stroke="#FFFFFF"
                      strokeWidth={1.8}
                      dot={{ r: 3, fill: "#FFFFFF" }}
                      activeDot={{ r: 5, fill: "#00E575" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Historical Revisions Table */}
          {vintageData && vintageData.revisions.length > 0 && (
            <div className="matte-card overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.06] flex justify-between items-center">
                <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Published Forecast Revisions Archive ({vintageData.revisions.length} Vintages)
                </h3>
                <span className="text-xs text-neutral-500 font-mono">
                  {vintageData.delivery_target}
                </span>
              </div>
              <div className="overflow-x-auto max-h-56">
                <table className="min-w-full divide-y divide-white/[0.05] text-xs">
                  <thead className="bg-[#161616] sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-neutral-400">Publication Timestamp (UTC)</th>
                      <th className="px-4 py-2 text-right font-semibold text-neutral-400">Lead Horizon</th>
                      <th className="px-4 py-2 text-right font-semibold text-neutral-400">Forecast</th>
                      <th className="px-4 py-2 text-right font-semibold text-neutral-400">Actual Outturn</th>
                      <th className="px-4 py-2 text-right font-semibold text-neutral-400">Delta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03] bg-[#121212]">
                    {vintageData.revisions.map((rev, i) => (
                      <tr key={i} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-2 font-mono text-neutral-300">{rev.publishTime}</td>
                        <td className="px-4 py-2 text-right font-mono text-neutral-200">{rev.lead_hours} hrs</td>
                        <td className="px-4 py-2 text-right font-mono text-white">
                          {rev.forecast_mw.toLocaleString()} MW
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-[#00E575]">
                          {rev.actual_mw?.toLocaleString() || "N/A"} MW
                        </td>
                        <td
                          className={`px-4 py-2 text-right font-mono font-semibold ${
                            (rev.delta_mw || 0) > 0 ? "text-[#FF3B30]" : "text-[#00E575]"
                          }`}
                        >
                          {(rev.delta_mw || 0) > 0 ? `+${rev.delta_mw}` : rev.delta_mw} MW
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
