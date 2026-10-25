import type {
  OverviewResponse,
  AccuracyResponse,
  DailyForecastResponse,
  SimulatorResponse,
  VintageEvolutionResponse,
  DataQualityResponse,
} from "../types";

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8000" : "");

export async function fetchJson<T>(url: string): Promise<T> {
  const resp = await fetch(url);
  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`API error ${resp.status}: ${errorText || resp.statusText}`);
  }
  return resp.json();
}

export async function getHealth(): Promise<any> {
  return fetchJson(`${API_BASE}/health`);
}

export async function getOverview(
  startDate: string = "2026-01-01",
  endDate: string = "2026-01-31",
  cutoffTime: string = "11:00:00",
  resolution: string = "settlement_period"
): Promise<OverviewResponse> {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    cutoff_time: cutoffTime,
    resolution,
  });
  return fetchJson(`${API_BASE}/api/overview?${params.toString()}`);
}

export async function getAccuracy(
  startDate: string = "2026-01-01",
  endDate: string = "2026-01-31",
  cutoffTime: string = "11:00:00",
  resolution: string = "settlement_period"
): Promise<AccuracyResponse> {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    cutoff_time: cutoffTime,
    resolution,
  });
  return fetchJson(`${API_BASE}/api/accuracy?${params.toString()}`);
}

export async function getDailyForecast(
  date: string = "2026-01-15",
  cutoffTime: string = "11:00:00",
  resolution: string = "settlement_period"
): Promise<DailyForecastResponse> {
  const params = new URLSearchParams({
    date,
    cutoff_time: cutoffTime,
    resolution,
  });
  return fetchJson(`${API_BASE}/api/forecasts?${params.toString()}`);
}

export async function getSimulator(
  date: string = "2026-01-15",
  cutoffTime: string = "11:00:00",
  strategy: string = "p50",
  demandPeakMw: number = 38000
): Promise<SimulatorResponse> {
  const params = new URLSearchParams({
    date,
    cutoff_time: cutoffTime,
    strategy,
    demand_peak_mw: demandPeakMw.toString(),
  });
  return fetchJson(`${API_BASE}/api/simulator?${params.toString()}`);
}

export async function getVintageEvolution(
  date: string = "2026-01-15",
  hour: string = "12:00:00"
): Promise<VintageEvolutionResponse> {
  const params = new URLSearchParams({
    date,
    hour,
  });
  return fetchJson(`${API_BASE}/api/vintages/evolution?${params.toString()}`);
}

export async function getDataQuality(
  startDate: string = "2026-01-01",
  endDate: string = "2026-01-31"
): Promise<DataQualityResponse> {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });
  return fetchJson(`${API_BASE}/api/data-quality?${params.toString()}`);
}

export async function triggerSync(): Promise<any> {
  const resp = await fetch(`${API_BASE}/api/sync`, { method: "POST" });
  if (!resp.ok) {
    throw new Error(`Sync trigger failed: ${resp.statusText}`);
  }
  return resp.json();
}
