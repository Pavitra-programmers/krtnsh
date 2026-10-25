import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { GlobalToolbar } from "./components/GlobalToolbar";
import { OverviewPage } from "./pages/OverviewPage";
import { SimulatorPage } from "./pages/SimulatorPage";
import { ForecastExplorerPage } from "./pages/ForecastExplorerPage";
import { AccuracyPage } from "./pages/AccuracyPage";
import { DataQualityPage } from "./pages/DataQualityPage";
import { MethodologyPage } from "./pages/MethodologyPage";
import type { OverviewResponse, AccuracyResponse } from "./types";
import { getHealth, getOverview, getAccuracy, triggerSync } from "./services/api";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Global filters
  const [startDate, setStartDate] = useState<string>("2026-01-01");
  const [endDate, setEndDate] = useState<string>("2026-01-31");
  const [cutoffTime, setCutoffTime] = useState<string>("11:00:00");
  const [resolution, setResolution] = useState<string>("settlement_period");

  // Data states
  const [overviewData, setOverviewData] = useState<OverviewResponse | null>(null);
  const [accuracyData, setAccuracyData] = useState<AccuracyResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isDbReady, setIsDbReady] = useState<boolean>(true);

  // Specific day routed into Simulator from Overview heatmap
  const [simulatorDate, setSimulatorDate] = useState<string>("2026-01-15");

  const loadData = async () => {
    setIsLoading(true);
    try {
      getHealth()
        .then((h) => setIsDbReady(h.database_ready))
        .catch(() => setIsDbReady(false));

      const [overviewRes, accuracyRes] = await Promise.all([
        getOverview(startDate, endDate, cutoffTime, resolution),
        getAccuracy(startDate, endDate, cutoffTime, resolution),
      ]);

      setOverviewData(overviewRes);
      setAccuracyData(accuracyRes);
    } catch (err) {
      console.error("Failed to load analytics data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate, cutoffTime, resolution]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await triggerSync();
      setTimeout(() => {
        loadData();
        setIsSyncing(false);
      }, 3000);
    } catch (err) {
      console.error("Sync error:", err);
      setIsSyncing(false);
    }
  };

  const handleNavigateToSimulator = (date: string) => {
    setSimulatorDate(date);
    setActiveTab("simulator");
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#F5F5F7] antialiased selection:bg-[#00E575] selection:text-black">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSyncing={isSyncing}
        onSync={handleSync}
        isDbReady={isDbReady}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Command Bar Toolbar */}
      <GlobalToolbar
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        cutoffTime={cutoffTime}
        setCutoffTime={setCutoffTime}
        resolution={resolution}
        setResolution={setResolution}
        onRefresh={loadData}
        isLoading={isLoading}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "overview" && (
          <OverviewPage
            data={overviewData}
            isLoading={isLoading}
            onSelectDate={setSimulatorDate}
            onNavigateToSimulator={handleNavigateToSimulator}
          />
        )}

        {activeTab === "simulator" && (
          <SimulatorPage
            initialDate={simulatorDate}
            cutoffTime={cutoffTime}
          />
        )}

        {activeTab === "forecasts" && (
          <ForecastExplorerPage cutoffTime={cutoffTime} />
        )}

        {activeTab === "accuracy" && (
          <AccuracyPage data={accuracyData} isLoading={isLoading} />
        )}

        {activeTab === "data-quality" && <DataQualityPage />}

        {activeTab === "methodology" && <MethodologyPage />}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-[#0A0A0A] py-8 text-xs text-neutral-500 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px]">
          <div>
            <span className="font-semibold text-neutral-300 font-sans">AuraGrid UK</span> — Day-Ahead Wind Forecast & Decision Support Platform
          </div>
          <div className="flex items-center space-x-3 text-neutral-500">
            <span>Elexon BMRS API v1</span>
            <span>•</span>
            <span>January 2026 Scope</span>
            <span>•</span>
            <span className="text-[#00E575]">Zero Look-Ahead Bias Verified</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
