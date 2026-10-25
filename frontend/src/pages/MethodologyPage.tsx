import React from "react";

export const MethodologyPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="matte-card p-6">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[#00E575]" />
          <h2 className="text-base font-bold text-white tracking-tight uppercase">
            Domain Methodology & Video Presentation Script
          </h2>
        </div>
        <p className="text-xs text-neutral-400 mt-1">
          Complete commercial background, regulatory references (BSC Section Q), metric mathematical definitions, and script outline for the required 10-minute video submission.
        </p>
      </div>

      {/* Video Presentation Script Outline (Deliverables 3.1) */}
      <div className="matte-card p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-bold text-white tracking-tight uppercase">
            Submission Video Presentation Guide (Max 10 Minutes Total)
          </h3>
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white/5 text-neutral-300 border border-white/10">
            Mandatory Deliverable 3.1
          </span>
        </div>

        {/* Part 1: Client Pitch (5 Minutes) */}
        <div className="p-5 bg-[#161616] rounded-xl border border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#00E575] uppercase tracking-wider">
              Part 1: Client Pitch (Commercial Focus — Max 5 Minutes)
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#00E575]/10 text-[#00E575] border border-[#00E575]/25">
              For Utility Trading Desk
            </span>
          </div>
          <p className="text-xs text-neutral-300">
            <strong>Goal:</strong> Impress the client trading desk with an intuitive, high-value decision support tool that protects capital and optimizes thermal procurement.
          </p>
          <div className="space-y-2 text-xs text-neutral-400">
            <div>
              <strong className="text-white">1. Problem Setting (1 min):</strong> Explain the utility's commercial dilemma. Buying power day-ahead requires knowing how much thermal (CCGT) power to buy to meet demand, considering unpredictable wind generation.
            </div>
            <div>
              <strong className="text-white">2. Executive Overview (1.5 min):</strong> Showcase the Executive Dashboard. Walk through January 2026 findings: National Grid ESO overpredicted wind by an average of <strong>+1,840 MW</strong> (MAE: 2,126 MW). Highlight the commercial danger: unadjusted forecasts lead to severe under-procurement and costly Balancing Mechanism cashouts.
            </div>
            <div>
              <strong className="text-white">3. Decision Simulator Demonstration (2 mins):</strong> Demonstrate the Day-Ahead Procurement Simulator. Switch between <em>P50 Point Forecast</em> (which leaves large short exposures) and <em>P90 Conservative Hedging</em> (which offsets downside wind risk, ensuring physical stability).
            </div>
            <div>
              <strong className="text-white">4. Commercial Impact & Close (0.5 min):</strong> Conclude on financial savings: reducing imbalance volatility saves millions in winter cashout penalties.
            </div>
          </div>
        </div>

        {/* Part 2: Tech Lead Review (5 Minutes) */}
        <div className="p-5 bg-[#161616] rounded-xl border border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Part 2: Technical Lead Review (Engineering & Architecture — Max 5 Minutes)
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-neutral-300 border border-white/10">
              For Lead Architect / Reviewer
            </span>
          </div>
          <p className="text-xs text-neutral-300">
            <strong>Goal:</strong> Demonstrate architectural rigor, mathematical correctness, data integrity, test coverage, and deployment readiness.
          </p>
          <div className="space-y-2 text-xs text-neutral-400">
            <div>
              <strong className="text-white">1. Architecture & Stack (1 min):</strong> Walk through the FastAPI + SQLite WAL backend and React + TypeScript + Tailwind frontend. Emphasize sub-10ms query speeds via indexed SQLite persistence.
            </div>
            <div>
              <strong className="text-white">2. As-Of Gate Closure Isolation (1.5 min):</strong> Explain how zero look-ahead bias is enforced. For delivery day $D$, any forecast published after $(D-1)$ 11:00 UTC (EPEX auction gate closure) is strictly excluded.
            </div>
            <div>
              <strong className="text-white">3. Cadence Alignment & Data Audit (1 min):</strong> Explain the 30-min settlement block alignment (1,488 SPs in Jan 2026, 100% matched coverage, 0 missing intervals).
            </div>
            <div>
              <strong className="text-white">4. Testing & Docker Verification (1.5 min):</strong> Showcase the 19 automated Pytest tests, Vitest test suite, Docker container build, and CI/CD workflow.
            </div>
          </div>
        </div>
      </div>

      {/* Mathematical Formulas */}
      <div className="matte-card p-6 space-y-4">
        <h3 className="text-sm font-bold text-white tracking-tight uppercase">
          Mathematical Formulation of Quantitative Metrics
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 bg-[#161616] rounded-xl border border-white/[0.06] space-y-1">
            <span className="text-[#00E575] font-bold font-sans">Mean Absolute Error (MAE)</span>
            <div className="text-neutral-200">MAE = (1/N) * Σ |Forecast_t - Actual_t|</div>
            <div className="text-neutral-500 text-[10px]">Linear penalty on dispersion</div>
          </div>

          <div className="p-4 bg-[#161616] rounded-xl border border-white/[0.06] space-y-1">
            <span className="text-white font-bold font-sans">Root Mean Square Error (RMSE)</span>
            <div className="text-neutral-200">RMSE = sqrt((1/N) * Σ (Forecast_t - Actual_t)²)</div>
            <div className="text-neutral-500 text-[10px]">Heavily penalizes extreme forecast misses</div>
          </div>

          <div className="p-4 bg-[#161616] rounded-xl border border-white/[0.06] space-y-1">
            <span className="text-[#FF3B30] font-bold font-sans">Mean Forecast Bias</span>
            <div className="text-neutral-200">Bias = (1/N) * Σ (Forecast_t - Actual_t)</div>
            <div className="text-neutral-500 text-[10px]">&gt;0 = Overforecast (Short Risk); &lt;0 = Underforecast</div>
          </div>

          <div className="p-4 bg-[#161616] rounded-xl border border-white/[0.06] space-y-1">
            <span className="text-neutral-300 font-bold font-sans">Weighted Abs % Error (WAPE)</span>
            <div className="text-neutral-200">WAPE = (Σ |Forecast_t - Actual_t| / Σ Actual_t) * 100%</div>
            <div className="text-neutral-500 text-[10px]">Avoids division-by-zero explosions during wind lulls</div>
          </div>
        </div>
      </div>
    </div>
  );
};
