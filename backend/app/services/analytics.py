import math
from datetime import datetime, timedelta
from typing import List, Dict, Any, cast
import pandas as pd
import numpy as np
from app.config import DB_PATH, DEFAULT_CUTOFF_TIME
from app.db import get_db

class AnalyticsEngine:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path

    def get_aligned_data(
        self,
        start_date: str = "2026-01-01",
        end_date: str = "2026-01-31",
        cutoff_time: str = DEFAULT_CUTOFF_TIME,
        resolution: str = "settlement_period"
    ) -> pd.DataFrame:
        """
        Pulls FUELHH actuals for fuelType=WIND and reconstructs the strict day-ahead
        forecast available at (D-1) cutoff_time for each delivery day D.
        Aligns to either 30-min settlement periods (1488 in Jan) or hourly (744 in Jan).
        """
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(end_date, "%Y-%m-%d")
        start_str = start_dt.strftime("%Y-%m-%d")
        end_str = end_dt.strftime("%Y-%m-%d")

        with get_db(self.db_path) as conn:
            query_fuel = """
                SELECT startTime, settlementDate, settlementPeriod, generation as actual_mw
                FROM fuelhh
                WHERE fuelType = 'WIND'
                  AND settlementDate >= ?
                  AND settlementDate <= ?
                ORDER BY startTime ASC, settlementPeriod ASC;
            """
            fuel_df = pd.read_sql_query(query_fuel, conn, params=[start_str, end_str])

        if fuel_df.empty:
            return pd.DataFrame()

        fuel_df['start_dt'] = pd.to_datetime(fuel_df['startTime'], utc=True)
        fuel_df['delivery_date'] = fuel_df['settlementDate']
        
        cutoff_parts = cutoff_time.split(":")
        cutoff_h = int(cutoff_parts[0])
        cutoff_m = int(cutoff_parts[1]) if len(cutoff_parts) > 1 else 0
        cutoff_s = int(cutoff_parts[2]) if len(cutoff_parts) > 2 else 0
        
        unique_dates = fuel_df['delivery_date'].unique()
        cutoffs: Dict[str, str] = {}
        for d in unique_dates:
            d_str = str(d)
            d_obj = datetime.strptime(d_str, "%Y-%m-%d")
            prev_d = d_obj - timedelta(days=1)
            cutoff_dt = prev_d.replace(hour=cutoff_h, minute=cutoff_m, second=cutoff_s)
            cutoffs[d_str] = cutoff_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

        fuel_df['cutoff_iso'] = [cutoffs.get(str(d), "") for d in fuel_df['delivery_date']]
        fuel_df['target_hour_str'] = fuel_df['start_dt'].dt.strftime("%Y-%m-%dT%H:00:00Z")

        max_target = str(fuel_df['target_hour_str'].max())
        min_target = str(fuel_df['target_hour_str'].min())

        with get_db(self.db_path) as conn:
            query_wind = """
                SELECT publishTime, startTime as target_hour_str, generation as forecast_mw
                FROM windfor
                WHERE startTime >= ?
                  AND startTime <= ?
                ORDER BY publishTime ASC;
            """
            wind_df = pd.read_sql_query(query_wind, conn, params=[min_target, max_target])

        if wind_df.empty:
            fuel_df['forecast_mw'] = np.nan
            fuel_df['publishTime'] = None
            return fuel_df

        wind_groups = {str(k): v.sort_values('publishTime') for k, v in wind_df.groupby('target_hour_str')}

        matched_forecasts: List[float] = []
        matched_publishes: List[Any] = []

        for _, row in fuel_df.iterrows():
            target_h = str(row['target_hour_str'])
            cutoff = str(row['cutoff_iso'])
            candidates = wind_groups.get(target_h)
            if candidates is not None and not candidates.empty:
                eligible = candidates[candidates['publishTime'] <= cutoff]
                if not eligible.empty:
                    latest = eligible.iloc[-1]
                    matched_forecasts.append(float(latest['forecast_mw']))
                    matched_publishes.append(latest['publishTime'])
                    continue
            matched_forecasts.append(float('nan'))
            matched_publishes.append(None)

        fuel_df['forecast_mw'] = matched_forecasts
        fuel_df['forecast_publish_time'] = matched_publishes

        aligned = fuel_df.dropna(subset=['actual_mw', 'forecast_mw']).copy()

        aligned['error_mw'] = aligned['forecast_mw'] - aligned['actual_mw']
        aligned['abs_error_mw'] = aligned['error_mw'].abs()
        aligned['sq_error_mw'] = aligned['error_mw'] ** 2

        if resolution == "hourly":
            grouped = aligned.groupby(['delivery_date', 'target_hour_str']).agg({
                'actual_mw': 'mean',
                'forecast_mw': 'first',
                'forecast_publish_time': 'first',
                'settlementPeriod': 'first'
            }).reset_index()
            grouped['startTime'] = grouped['target_hour_str']
            grouped['error_mw'] = grouped['forecast_mw'] - grouped['actual_mw']
            grouped['abs_error_mw'] = grouped['error_mw'].abs()
            grouped['sq_error_mw'] = grouped['error_mw'] ** 2
            return grouped

        return aligned

    def calculate_metrics(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Calculates full statistical suite on aligned data."""
        if df.empty or 'error_mw' not in df:
            return {
                "count": 0,
                "mae": 0.0,
                "rmse": 0.0,
                "bias": 0.0,
                "wape": 0.0,
                "median_ae": 0.0,
                "max_miss": 0.0,
                "min_error": 0.0,
                "max_error": 0.0,
                "actual_mean": 0.0,
                "forecast_mean": 0.0,
                "correlation": 0.0,
                "r_squared": 0.0,
                "p10_error": 0.0,
                "p20_error": 0.0,
                "p50_error": 0.0,
                "p80_error": 0.0,
                "p90_error": 0.0
            }

        count = len(df)
        actual_mean = float(df['actual_mw'].mean())
        forecast_mean = float(df['forecast_mw'].mean())
        mae = float(df['abs_error_mw'].mean())
        rmse = float(math.sqrt(float(df['sq_error_mw'].mean())))
        bias = float(df['error_mw'].mean())
        median_ae = float(df['abs_error_mw'].median())
        max_miss = float(df['abs_error_mw'].max())
        min_error = float(df['error_mw'].min())
        max_error = float(df['error_mw'].max())

        total_actual = float(df['actual_mw'].sum())
        total_abs_error = float(df['abs_error_mw'].sum())
        wape = float((total_abs_error / total_actual * 100.0) if total_actual > 0 else 0.0)

        # Pearson correlation
        if float(df['actual_mw'].std()) > 0 and float(df['forecast_mw'].std()) > 0:
            act_series = cast(pd.Series, df['actual_mw'])
            for_series = cast(pd.Series, df['forecast_mw'])
            corr = float(act_series.corr(for_series))
            r2 = float(corr ** 2)
        else:
            corr = 0.0
            r2 = 0.0

        errors = df['error_mw'].to_numpy(dtype=float)
        p10 = float(np.percentile(errors, 10))
        p20 = float(np.percentile(errors, 20))
        p50 = float(np.percentile(errors, 50))
        p80 = float(np.percentile(errors, 80))
        p90 = float(np.percentile(errors, 90))

        return {
            "count": count,
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "bias": round(bias, 2),
            "wape": round(wape, 2),
            "median_ae": round(median_ae, 2),
            "max_miss": round(max_miss, 2),
            "min_error": round(min_error, 2),
            "max_error": round(max_error, 2),
            "actual_mean": round(actual_mean, 2),
            "forecast_mean": round(forecast_mean, 2),
            "correlation": round(corr, 4),
            "r_squared": round(r2, 4),
            "p10_error": round(p10, 2),
            "p20_error": round(p20, 2),
            "p50_error": round(p50, 2),
            "p80_error": round(p80, 2),
            "p90_error": round(p90, 2)
        }

    def get_daily_breakdown(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Groups aligned data by day to produce calendar view and daily table."""
        if df.empty:
            return []
        breakdown = []
        for d, group in df.groupby('delivery_date'):
            m = self.calculate_metrics(group)
            breakdown.append({
                "date": str(d),
                "actual_mean": m["actual_mean"],
                "forecast_mean": m["forecast_mean"],
                "actual_peak": round(float(group['actual_mw'].max()), 2),
                "forecast_peak": round(float(group['forecast_mw'].max()), 2),
                "mae": m["mae"],
                "rmse": m["rmse"],
                "bias": m["bias"],
                "wape": m["wape"],
                "count": m["count"]
            })
        return sorted(breakdown, key=lambda x: x["date"])

    def get_diurnal_profile(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Averages metrics across Settlement Periods 1 to 48."""
        if df.empty:
            return []
        profile = []
        for sp, group in df.groupby('settlementPeriod'):
            m = self.calculate_metrics(group)
            sp_num = int(str(sp))
            mins = (sp_num - 1) * 30
            h = mins // 60
            mn = mins % 60
            time_label = f"{h:02d}:{mn:02d}"
            profile.append({
                "settlement_period": sp_num,
                "time_label": time_label,
                "actual_mean": m["actual_mean"],
                "forecast_mean": m["forecast_mean"],
                "mae": m["mae"],
                "rmse": m["rmse"],
                "bias": m["bias"]
            })
        return sorted(profile, key=lambda x: x["settlement_period"])

    def get_error_distribution(self, df: pd.DataFrame, bins_count: int = 24) -> Dict[str, Any]:
        """Calculates histogram bins and fitted normal distribution density."""
        if df.empty:
            return {"bins": [], "mean": 0, "std": 0}
        
        errors = df['error_mw'].to_numpy(dtype=float)
        mean = float(np.mean(errors))
        std = float(np.std(errors))

        counts, bin_edges = np.histogram(errors, bins=bins_count)
        bins = []
        for i in range(len(counts)):
            bin_start = float(bin_edges[i])
            bin_end = float(bin_edges[i+1])
            mid = (bin_start + bin_end) / 2.0
            if std > 0:
                pdf_val = (1.0 / (std * math.sqrt(2 * math.pi))) * math.exp(-0.5 * ((mid - mean) / std) ** 2)
            else:
                pdf_val = 0.0

            bins.append({
                "bin_start": round(bin_start, 1),
                "bin_end": round(bin_end, 1),
                "mid": round(mid, 1),
                "count": int(counts[i]),
                "normal_density": round(pdf_val * 1000.0, 4)
            })

        return {
            "bins": bins,
            "mean": round(mean, 2),
            "std": round(std, 2)
        }

    def get_scatter_sample(self, df: pd.DataFrame, max_points: int = 500) -> List[Dict[str, Any]]:
        """Returns subsampled actual vs forecast points for scatter plotting."""
        if df.empty:
            return []
        sample_df = df
        if len(df) > max_points:
            sample_df = df.sample(n=max_points, random_state=42)
        
        records = []
        for _, r in sample_df.iterrows():
            sp_val = r.get("settlementPeriod", 0)
            records.append({
                "startTime": str(r["startTime"]),
                "settlementPeriod": int(str(sp_val)) if sp_val is not None else 0,
                "actual_mw": round(float(r["actual_mw"]), 1),
                "forecast_mw": round(float(r["forecast_mw"]), 1),
                "error_mw": round(float(r["error_mw"]), 1)
            })
        return sorted(records, key=lambda x: x["startTime"])

    def get_lead_time_decay(
        self,
        start_date: str = "2026-01-01",
        end_date: str = "2026-01-31"
    ) -> List[Dict[str, Any]]:
        """
        Evaluates forecast error degradation across lead times:
        0-6h, 6-12h, 12-24h, 24-36h, 36-48h, 48h+.
        """
        with get_db(self.db_path) as conn:
            query = """
                SELECT 
                    w.publishTime,
                    w.startTime as forecast_start,
                    w.generation as forecast_mw,
                    f.generation as actual_mw
                FROM windfor w
                JOIN fuelhh f ON f.startTime = w.startTime AND f.fuelType = 'WIND'
                WHERE f.settlementDate >= ? AND f.settlementDate <= ?;
            """
            joined = pd.read_sql_query(query, conn, params=[start_date, end_date])

        if joined.empty:
            return []

        joined['pub_dt'] = pd.to_datetime(joined['publishTime'], utc=True)
        joined['start_dt'] = pd.to_datetime(joined['forecast_start'], utc=True)
        joined['lead_hours'] = (joined['start_dt'] - joined['pub_dt']).dt.total_seconds() / 3600.0

        joined = joined[joined['lead_hours'] >= 0].copy()
        joined['error_mw'] = joined['forecast_mw'] - joined['actual_mw']
        joined['abs_error_mw'] = np.abs(joined['error_mw'])
        joined['sq_error_mw'] = joined['error_mw'] ** 2

        buckets = [
            ("0-6h", 0, 6),
            ("6-12h", 6, 12),
            ("12-24h", 12, 24),
            ("24-36h", 24, 36),
            ("36-48h", 36, 48),
            (">48h", 48, 120)
        ]

        results = []
        for label, low, high in buckets:
            subset = joined[(joined['lead_hours'] >= low) & (joined['lead_hours'] < high)]
            if len(subset) > 0:
                mae = float(subset['abs_error_mw'].mean())
                rmse = float(math.sqrt(float(subset['sq_error_mw'].mean())))
                bias = float(subset['error_mw'].mean())
                tot_act = float(subset['actual_mw'].sum())
                wape = float((subset['abs_error_mw'].sum() / tot_act * 100.0) if tot_act > 0 else 0)
                results.append({
                    "bucket": label,
                    "count": len(subset),
                    "mae": round(mae, 2),
                    "rmse": round(rmse, 2),
                    "bias": round(bias, 2),
                    "wape": round(wape, 2)
                })
        return results

    def simulate_procurement(
        self,
        target_date: str = "2026-01-15",
        cutoff_time: str = DEFAULT_CUTOFF_TIME,
        strategy: str = "p50",
        demand_peak_mw: float = 38000.0
    ) -> Dict[str, Any]:
        """
        Simulates Day-Ahead Market purchase decision for a single day:
        Computes half-hourly demand, wind procured under risk strategy (p50, p80, p90, p10),
        thermal generation procured, physical imbalance outturn, and financial exposure.
        """
        df = self.get_aligned_data(start_date=target_date, end_date=target_date, cutoff_time=cutoff_time)
        if df.empty:
            return {"error": f"No data found for delivery date {target_date}"}

        month_df = self.get_aligned_data(start_date="2026-01-01", end_date="2026-01-31", cutoff_time=cutoff_time)
        month_metrics = self.calculate_metrics(month_df)

        offset = 0.0
        if strategy == "p80":
            offset = month_metrics["p20_error"]
        elif strategy == "p90":
            offset = month_metrics["p10_error"]
        elif strategy == "p10":
            offset = month_metrics["p90_error"]
        
        base_curve = [
            0.58, 0.56, 0.55, 0.54, 0.54, 0.55, 0.57, 0.61,
            0.66, 0.73, 0.81, 0.88, 0.92, 0.94, 0.95, 0.95,
            0.94, 0.93, 0.92, 0.91, 0.91, 0.90, 0.90, 0.89,
            0.89, 0.88, 0.88, 0.89, 0.90, 0.92, 0.95, 0.98,
            1.00, 1.00, 0.98, 0.95, 0.91, 0.86, 0.80, 0.75,
            0.70, 0.67, 0.64, 0.62, 0.60, 0.59, 0.58, 0.57
        ]

        schedule = []
        total_thermal_mwh = 0.0
        total_wind_procured_mwh = 0.0
        total_actual_wind_mwh = 0.0
        short_imbalance_mwh = 0.0
        long_imbalance_mwh = 0.0

        for _, row in df.iterrows():
            sp = int(row['settlementPeriod'])
            curve_factor = base_curve[(sp - 1) % len(base_curve)]
            demand_mw = round(demand_peak_mw * curve_factor, 1)

            forecast_wind = float(row['forecast_mw'])
            actual_wind = float(row['actual_mw'])

            procured_wind = max(0.0, forecast_wind + offset)
            procured_wind = min(demand_mw, procured_wind)

            thermal_mw = max(0.0, demand_mw - procured_wind)
            imbalance_mw = actual_wind - procured_wind
            
            period_hours = 0.5
            total_thermal_mwh += thermal_mw * period_hours
            total_wind_procured_mwh += procured_wind * period_hours
            total_actual_wind_mwh += actual_wind * period_hours

            if imbalance_mw < 0:
                short_imbalance_mwh += abs(imbalance_mw) * period_hours
                status = "SHORT"
            else:
                long_imbalance_mwh += imbalance_mw * period_hours
                status = "LONG"

            mins = (sp - 1) * 30
            h = mins // 60
            mn = mins % 60

            schedule.append({
                "settlement_period": sp,
                "time_label": f"{h:02d}:{mn:02d}",
                "startTime": row["startTime"],
                "demand_mw": demand_mw,
                "forecast_wind_mw": round(forecast_wind, 1),
                "procured_wind_mw": round(procured_wind, 1),
                "thermal_procured_mw": round(thermal_mw, 1),
                "actual_wind_mw": round(actual_wind, 1),
                "imbalance_mw": round(imbalance_mw, 1),
                "status": status
            })

        thermal_cost = total_thermal_mwh * 85.0
        short_penalties = short_imbalance_mwh * 145.0
        long_credits = long_imbalance_mwh * 45.0
        net_financial_cost = thermal_cost + short_penalties - long_credits

        return {
            "target_date": target_date,
            "cutoff_time": cutoff_time,
            "strategy": strategy,
            "strategy_offset_mw": round(offset, 1),
            "demand_peak_mw": demand_peak_mw,
            "summary": {
                "total_demand_mwh": round((total_thermal_mwh + total_wind_procured_mwh), 1),
                "total_thermal_procured_mwh": round(total_thermal_mwh, 1),
                "total_wind_procured_mwh": round(total_wind_procured_mwh, 1),
                "total_actual_wind_mwh": round(total_actual_wind_mwh, 1),
                "short_imbalance_mwh": round(short_imbalance_mwh, 1),
                "long_imbalance_mwh": round(long_imbalance_mwh, 1),
                "estimated_thermal_cost_gbp": round(thermal_cost, 2),
                "estimated_imbalance_penalty_gbp": round(short_penalties, 2),
                "estimated_net_cost_gbp": round(net_financial_cost, 2)
            },
            "schedule": schedule
        }

    def get_vintage_evolution(
        self,
        delivery_date: str = "2026-01-15",
        target_hour: str = "12:00:00"
    ) -> Dict[str, Any]:
        """
        Retrieves all historical forecast revisions published for a specific delivery hour,
        demonstrating the 'Fan Chart' evolution from 48+ hours out to gate closure.
        """
        target_iso = f"{delivery_date}T{target_hour}Z"

        with get_db(self.db_path) as conn:
            actual_row = conn.execute("""
                SELECT generation FROM fuelhh 
                WHERE startTime = ? AND fuelType = 'WIND';
            """, (target_iso,)).fetchone()
            actual_mw = float(actual_row[0]) if actual_row else None

            vintages_rows = conn.execute("""
                SELECT publishTime, generation 
                FROM windfor
                WHERE startTime = ?
                ORDER BY publishTime ASC;
            """, (target_iso,)).fetchall()

        if not vintages_rows:
            return {
                "delivery_target": target_iso,
                "actual_mw": actual_mw,
                "revisions": []
            }

        target_dt = datetime.strptime(target_iso, "%Y-%m-%dT%H:%M:%SZ")
        revisions = []
        for r in vintages_rows:
            pub_time = r[0]
            gen_mw = float(r[1])
            pub_dt = datetime.strptime(pub_time, "%Y-%m-%dT%H:%M:%SZ")
            lead_hours = (target_dt - pub_dt).total_seconds() / 3600.0
            delta = (gen_mw - actual_mw) if actual_mw is not None else None

            revisions.append({
                "publishTime": pub_time,
                "lead_hours": round(lead_hours, 1),
                "forecast_mw": round(gen_mw, 1),
                "actual_mw": round(actual_mw, 1) if actual_mw is not None else None,
                "delta_mw": round(delta, 1) if delta is not None else None
            })

        return {
            "delivery_target": target_iso,
            "actual_mw": round(actual_mw, 1) if actual_mw is not None else None,
            "vintages_count": len(revisions),
            "revisions": revisions
        }
