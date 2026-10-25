import React from "react";
import { RefreshCw } from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSyncing: boolean;
  onSync: () => void;
  isDbReady: boolean;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isSyncing,
  onSync,
  isDbReady,
}) => {
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "simulator", label: "Procurement Simulator" },
    { id: "forecasts", label: "Vintage Explorer" },
    { id: "accuracy", label: "Accuracy Analytics" },
    { id: "data-quality", label: "Data Quality" },
    { id: "methodology", label: "Methodology" },
  ];

  return (
    <header className="glass-nav sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Trading Desk Badge */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#141414] border border-white/10 flex items-center justify-center shadow-inner">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#00E575] shadow-[0_0_8px_#00E575]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-extrabold tracking-wider text-white uppercase font-sans">
                  AuraGrid<span className="text-[#00E575]">.uk</span>
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-neutral-300 border border-white/10 tracking-wide uppercase">
                  Day-Ahead
                </span>
              </div>
            </div>
          </div>

          {/* Center Navigation Pills (OlympTrade style) */}
          <nav className="hidden md:flex items-center bg-[#141414] border border-white/[0.08] p-1 rounded-full shadow-inner">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                    isActive
                      ? "bg-[#242424] text-white shadow-md border border-white/10 font-semibold"
                      : "text-neutral-400 hover:text-white hover:bg-white/[0.03]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Right Status Pill & Sync Button */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-[11px] px-3 py-1.5 rounded-full bg-[#141414] border border-white/[0.07]">
              <span
                className={`w-2 h-2 rounded-full ${
                  isDbReady
                    ? "bg-[#00E575] shadow-[0_0_8px_#00E575] animate-pulse"
                    : "bg-[#FFB020]"
                }`}
              />
              <span className="text-neutral-300 font-medium">
                {isDbReady ? "Elexon Feed" : "Sync Required"}
              </span>
            </div>

            <button
              onClick={onSync}
              disabled={isSyncing}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                isSyncing
                  ? "bg-white/5 text-neutral-400 border-white/5 cursor-not-allowed"
                  : "bg-white/5 text-neutral-300 border-white/10 hover:border-white/20 hover:text-white hover:bg-white/10"
              }`}
              title="Force resync from Elexon BMRS API streams"
            >
              <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "Sync"}</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Scrollbar */}
        <div className="flex md:hidden overflow-x-auto py-2 border-t border-white/[0.05] space-x-1 no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition ${
                  isActive
                    ? "bg-[#222] text-white border border-white/10"
                    : "text-neutral-400"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
