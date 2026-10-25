import { describe, it, expect, vi, beforeEach } from "vitest";
import { getHealth, getOverview, getSimulator } from "../services/api";

describe("Frontend API Service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches health status successfully", async () => {
    const mockHealth = { status: "healthy", database_ready: true };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockHealth,
    } as any);

    const result = await getHealth();
    expect(result.status).toBe("healthy");
    expect(result.database_ready).toBe(true);
  });

  it("formats overview query parameters correctly", async () => {
    let capturedUrl = "";
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      capturedUrl = url;
      return Promise.resolve({
        ok: true,
        json: async () => ({ metrics: {}, daily_breakdown: [], timeseries: [] }),
      });
    });

    await getOverview("2026-01-01", "2026-01-07", "11:00:00", "settlement_period");
    expect(capturedUrl).toContain("start_date=2026-01-01");
    expect(capturedUrl).toContain("end_date=2026-01-07");
    expect(capturedUrl).toContain("cutoff_time=11%3A00%3A00");
  });

  it("formats simulator parameters correctly", async () => {
    let capturedUrl = "";
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      capturedUrl = url;
      return Promise.resolve({
        ok: true,
        json: async () => ({ summary: {}, schedule: [] }),
      });
    });

    await getSimulator("2026-01-15", "11:00:00", "p90", 42000);
    expect(capturedUrl).toContain("strategy=p90");
    expect(capturedUrl).toContain("demand_peak_mw=42000");
  });

  it("throws descriptive error on API failure", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: async () => "Database unavailable",
    } as any);

    await expect(getHealth()).rejects.toThrow("API error 500: Database unavailable");
  });
});
