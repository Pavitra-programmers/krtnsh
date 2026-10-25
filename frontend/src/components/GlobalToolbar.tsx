import React from "react";

interface GlobalToolbarProps {
  startDate: string;
  setStartDate: (d: string) => void;
  endDate: string;
  setEndDate: (d: string) => void;
  cutoffTime: string;
  setCutoffTime: (t: string) => void;
  resolution: string;
  setResolution: (r: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const GlobalToolbar: React.FC<GlobalToolbarProps> = ({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  cutoffTime,
  setCutoffTime,
  resolution,
  setResolution,
  onRefresh,
  isLoading,
}) => {
  const handlePresetChange = (preset: string) => {
    if (preset === "all") {
      setStartDate("2026-01-01");
      setEndDate("2026-01-31");
    } else if (preset === "w1") {
      setStartDate("2026-01-01");
      setEndDate("2026-01-07");
    } else if (preset === "w2") {
      setStartDate("2026-01-08");
      setEndDate("2026-01-14");
    } else if (preset === "w3") {
      setStartDate("2026-01-15");
      setEndDate("2026-01-21");
    } else if (preset === "w4") {
      setStartDate("2026-01-22");
      setEndDate("2026-01-28");
    }
  };

  return (
    <div className="border-b border-white/[0.06] bg-[#0A0A0A]/90 backdrop-blur-md px-4 py-2.5 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Date Presets Segmented Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-neutral-400 font-medium text-[11px] uppercase tracking-wider mr-1">
            Scope
          </span>
          <div className="flex items-center bg-[#141414] border border-white/[0.08] p-0.5 rounded-full">
            <button
              onClick={() => handlePresetChange("all")}
              className={`px-3 py-1 rounded-full font-medium transition ${
                startDate === "2026-01-01" && endDate === "2026-01-31"
                  ? "bg-[#252525] text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Jan 1–31
            </button>
            <button
              onClick={() => handlePresetChange("w1")}
              className={`px-2.5 py-1 rounded-full font-medium transition ${
                startDate === "2026-01-01" && endDate === "2026-01-07"
                  ? "bg-[#252525] text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              W1
            </button>
            <button
              onClick={() => handlePresetChange("w2")}
              className={`px-2.5 py-1 rounded-full font-medium transition ${
                startDate === "2026-01-08" && endDate === "2026-01-14"
                  ? "bg-[#252525] text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              W2
            </button>
            <button
              onClick={() => handlePresetChange("w3")}
              className={`px-2.5 py-1 rounded-full font-medium transition ${
                startDate === "2026-01-15" && endDate === "2026-01-21"
                  ? "bg-[#252525] text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              W3
            </button>
            <button
              onClick={() => handlePresetChange("w4")}
              className={`px-2.5 py-1 rounded-full font-medium transition ${
                startDate === "2026-01-22" && endDate === "2026-01-28"
                  ? "bg-[#252525] text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              W4
            </button>
          </div>

          <div className="flex items-center space-x-1.5 bg-[#141414] border border-white/[0.08] px-2.5 py-1 rounded-full text-neutral-400 font-mono text-[11px]">
            <input
              type="date"
              value={startDate}
              min="2026-01-01"
              max="2026-01-31"
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-neutral-200 focus:outline-none cursor-pointer"
            />
            <span className="text-neutral-500">→</span>
            <input
              type="date"
              value={endDate}
              min="2026-01-01"
              max="2026-01-31"
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-neutral-200 focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Right Parameters: Gate Closure Cutoff & Cadence */}
        <div className="flex flex-wrap items-center gap-2">
          {/* D-1 Cutoff */}
          <div className="flex items-center bg-[#141414] border border-white/[0.08] px-3 py-1 rounded-full text-neutral-300">
            <span className="text-neutral-500 mr-2 text-[11px] uppercase tracking-wider">
              Cutoff
            </span>
            <select
              value={cutoffTime}
              onChange={(e) => setCutoffTime(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer font-medium"
            >
              <option value="11:00:00" className="bg-[#141414] text-white">
                11:00 UTC (EPEX Auction)
              </option>
              <option value="09:30:00" className="bg-[#141414] text-white">
                09:30 UTC (Early Bid)
              </option>
              <option value="15:30:00" className="bg-[#141414] text-white">
                15:30 UTC (EPEX Half-Hourly)
              </option>
              <option value="23:00:00" className="bg-[#141414] text-white">
                23:00 UTC (BSC Gate)
              </option>
            </select>
          </div>

          {/* Cadence */}
          <div className="flex items-center bg-[#141414] border border-white/[0.08] px-3 py-1 rounded-full text-neutral-300">
            <span className="text-neutral-500 mr-2 text-[11px] uppercase tracking-wider">
              Cadence
            </span>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer font-medium"
            >
              <option value="settlement_period" className="bg-[#141414] text-white">
                30-min Block (1,488 SPs)
              </option>
              <option value="hourly" className="bg-[#141414] text-white">
                Hourly (744 Hours)
              </option>
            </select>
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3.5 py-1 bg-white/5 hover:bg-white/10 text-neutral-200 border border-white/10 rounded-full font-medium transition disabled:opacity-50"
          >
            {isLoading ? "Updating..." : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
};
