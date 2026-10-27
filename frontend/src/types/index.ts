export interface Metrics {
  count: number;
  mae: number;
  rmse: number;
  bias: number;
  wape: number;
  median_ae: number;
  max_miss: number;
  min_error: number;
  max_error: number;
  actual_mean: number;
  forecast_mean: number;
  correlation: number;
  r_squared: number;
  p10_error: number;
  p20_error: number;
  p50_error: number;
  p80_error: number;
  p90_error: number;
}

export interface TimeseriesPoint {
  time: string;
  settlementPeriod: number;
  actual_mw: number;
  forecast_mw: number;
  error_mw: number;
}

export interface DailyMetric {
  date: string;
  actual_mean: number;
  forecast_mean: number;
  actual_peak: number;
  forecast_peak: number;
  mae: number;
  rmse: number;
  bias: number;
  wape: number;
  count: number;
}

export interface DiurnalPeriod {
  settlement_period: number;
  time_label: string;
  actual_mean: number;
  forecast_mean: number;
  mae: number;
  rmse: number;
  bias: number;
}

export interface HistogramBin {
  bin_start: number;
  bin_end: number;
  mid: number;
  count: number;
  normal_density: number;
}

export interface ScatterPoint {
  startTime: string;
  settlementPeriod: number;
  actual_mw: number;
  forecast_mw: number;
  error_mw: number;
}

export interface LeadTimeDecay {
  bucket: string;
  count: number;
  mae: number;
  rmse: number;
  bias: number;
  wape: number;
}

export interface OverviewResponse {
  parameters: {
    start_date: string;
    end_date: string;
    cutoff_time: string;
    resolution: string;
  };
  metrics: Metrics;
  daily_breakdown: DailyMetric[];
  timeseries: TimeseriesPoint[];
}

export interface AccuracyResponse {
  parameters: {
    start_date: string;
    end_date: string;
    cutoff_time: string;
    resolution: string;
  };
  metrics: Metrics;
  daily_breakdown: DailyMetric[];
  diurnal_profile: DiurnalPeriod[];
  error_distribution: {
    bins: HistogramBin[];
    mean: number;
    std: number;
  };
  scatter_sample: ScatterPoint[];
  lead_time_decay: LeadTimeDecay[];
}

export interface DailyForecastPeriod {
  startTime: string;
  settlementPeriod: number;
  time_label: string;
  actual_mw: number;
  forecast_mw: number;
  error_mw: number;
  forecast_publish_time: string | null;
}

export interface DailyForecastResponse {
  date: string;
  cutoff_time: string;
  resolution: string;
  metrics: Metrics;
  periods: DailyForecastPeriod[];
}

export interface SimulatorScheduleItem {
  settlement_period: number;
  time_label: string;
  startTime: string;
  demand_mw: number;
  forecast_wind_mw: number;
  procured_wind_mw: number;
  thermal_procured_mw: number;
  actual_wind_mw: number;
  imbalance_mw: number;
  status: "SHORT" | "LONG";
}

export interface SimulatorResponse {
  target_date: string;
  cutoff_time: string;
  strategy: "p50" | "p50_debiased" | "p80" | "p90" | "p10" | string;
  strategy_offset_mw: number;
  demand_peak_mw: number;
  summary: {
    total_demand_mwh: number;
    total_thermal_procured_mwh: number;
    total_wind_procured_mwh: number;
    total_actual_wind_mwh: number;
    short_imbalance_mwh: number;
    long_imbalance_mwh: number;
    estimated_thermal_cost_gbp: number;
    estimated_imbalance_penalty_gbp: number;
    estimated_net_cost_gbp: number;
  };
  schedule: SimulatorScheduleItem[];
}

export interface VintageRevision {
  publishTime: string;
  lead_hours: number;
  forecast_mw: number;
  actual_mw: number | null;
  delta_mw: number | null;
}

export interface VintageEvolutionResponse {
  delivery_target: string;
  actual_mw: number | null;
  vintages_count: number;
  revisions: VintageRevision[];
}

export interface DataQualityResponse {
  dataset_scope: {
    start_date: string;
    end_date: string;
    expected_settlement_periods: number;
    actual_fuelhh_periods: number;
    coverage_percentage: number;
  };
  inventory: {
    fuelhh_wind_records: number;
    windfor_forecast_records: number;
    fuelhh_range: { min: string; max: string } | null;
    windfor_pub_range: { min: string; max: string } | null;
    last_sync: { value: string; updatedAt: string } | null;
  };
  fuelhh_audit: {
    total_rows: number;
    distinct_dates: number;
    min_mw: number;
    max_mw: number;
    null_count: number;
    negative_count: number;
    sample_records: any[];
  };
  windfor_audit: {
    total_rows: number;
    distinct_target_hours: number;
    distinct_vintages: number;
    min_mw: number;
    max_mw: number;
    null_count: number;
    sample_records: any[];
  };
}
