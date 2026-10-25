import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MetricCard } from "../components/MetricCard";
import { Navbar } from "../components/Navbar";

describe("Frontend UI Components", () => {
  it("renders MetricCard with title, value, unit, and badge", () => {
    render(
      <MetricCard
        title="Mean Absolute Error"
        value="2,126"
        unit="MW"
        subtitle="Across 1,488 SPs"
        badge="Dispersion"
        badgeColor="green"
      />
    );

    expect(screen.getByText("Mean Absolute Error")).toBeDefined();
    expect(screen.getByText("2,126")).toBeDefined();
    expect(screen.getByText("MW")).toBeDefined();
    expect(screen.getByText("Across 1,488 SPs")).toBeDefined();
    expect(screen.getByText("Dispersion")).toBeDefined();
  });

  it("renders Navbar branding and navigation tabs", () => {
    render(
      <Navbar
        activeTab="overview"
        setActiveTab={() => {}}
        isSyncing={false}
        onSync={() => {}}
        isDbReady={true}
        darkMode={true}
        setDarkMode={() => {}}
      />
    );

    expect(screen.getByText(/AuraGrid/)).toBeDefined();
    expect(screen.getAllByText("Overview").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Procurement Simulator").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Accuracy Analytics").length).toBeGreaterThan(0);
  });
});
