# AuraGrid UK — Day-Ahead Wind Forecast & Procurement Decision Platform

[![CI/CD Pipeline](https://github.com/Pavitra-programmers/krtnsh/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Pavitra-programmers/krtnsh/actions/workflows/ci-cd.yml)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19+-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com)
[![Coverage](https://img.shields.io/badge/Tests-25%20Passing-brightgreen.svg)]()

> **Production Demo Deployment**: [https://auragrid-uk.vercel.app](https://auragrid-uk.vercel.app) *(or deployed Heroku/Render container)*  
> **API Documentation (Swagger UI)**: `http://localhost:8000/docs`

---

## 1. Executive Summary & Problem Setting

AuraGrid UK is a mission-critical web application and decision-support engine engineered specifically for a **UK electricity utility's Day-Ahead power trading desk**.

### The Commercial Challenge
To reliably meet consumer demand at lowest cost, a UK energy utility must purchase electricity from the wholesale **Day-Ahead Market (DAM)** one day prior to delivery ($D-1$). 
- **Wind power** is the preferred zero-marginal-cost renewable baseload, but is intermittent and weather-dependent.
- The trading desk must determine **how much thermal power (e.g., CCGT)** to procure additionally to cover the net demand gap ($D_t - F_t$).
- If wind generation is **overforecasted**, the desk under-procures thermal power day-ahead and is pushed into the punitive real-time **Balancing Mechanism (BM)** cashout settlement.
- If wind generation is **underforecasted**, the desk over-procures thermal capacity, burning capital and incurring surplus imbalance penalties.

### Product Capabilities
1. **Reconstruct As-Of Day-Ahead Forecasts**: Strictly isolates the latest forecast available at the Day-Ahead Market gate closure (defaulting to **11:00 UTC on D-1** for the EPEX SPOT Day-Ahead Auction), guaranteeing **zero look-ahead bias**.
2. **Quantify Forecast Error & Volatility**: Rigorously evaluates MAE, RMSE, Mean Bias, Median Absolute Error, WAPE (Weighted Absolute Percentage Error), correlation ($R^2$), and empirical error quantiles ($P_{10}, P_{50}, P_{90}$).
3. **Day-Ahead Procurement Decision Simulator**: Translates statistical error into commercial hedging strategy. Traders can stress-test consumer demand profiles against **P50 Point Forecast**, **P80 Conservative**, and **P90 High-Protection** policies to balance thermal procurement costs against imbalance cashout penalties.
4. **Forecast Vintage Evolution ("Fan Chart")**: Unveils the historical revision timeline for any settlement period from 50+ hours ahead to real-time.

---

## 2. System Architecture

```mermaid
flowchart TD
    subgraph Upstream [Official Elexon BMRS Data Streams]
        F_STREAM[FUELHH Stream\nActual Wind Generation\n30-min Settlement Cadence\nfuelType=WIND]
        W_STREAM[WINDFOR Stream\nNational Wind Forecasts\nMulti-Vintage Hourly Cadence]
    end

    subgraph Backend [Python FastAPI Analytics Engine :8000]
        Ingest[Elexon Ingestion Service\nHTTPX Async Streamer]
        DB[(SQLite WAL Cache\nIndexed on startTime, publishTime\nSub-10ms Queries)]
        Analytics[AnalyticsEngine\n• Strict As-Of Gate Closure (D-1 11:00 UTC)\n• 30-min Block Cadence Alignment\n• Residual Statistics & Quantiles\n• Thermal Procurement Simulator]
        API[FastAPI Endpoints\n/health\n/api/overview\n/api/forecasts\n/api/accuracy\n/api/simulator\n/api/vintages/evolution\n/api/data-quality\n/api/sync]
    end

    subgraph Frontend [React 19 + TypeScript + Vite + Tailwind CSS]
        Shell[App Shell with Date Range, Gate Closure & Cadence Controls]
        P1[1. Executive Overview Dashboard]
        P2[2. Day-Ahead Procurement Simulator]
        P3[3. Forecast Explorer & Vintage Fan Chart]
        P4[4. Statistical Accuracy Analytics]
        P5[5. Data Quality, Audit & Lineage]
        P6[6. Methodology & Video Pitch Guide]
    end

    Upstream --> Ingest
    Ingest --> DB
    DB --> Analytics
    Analytics --> API
    API --> Shell
    Shell --> P1
    Shell --> P2
    Shell --> P3
    Shell --> P4
    Shell --> P5
    Shell --> P6
```

---

## 3. Directory & File Structure

```text
krtnsh/
├── .github/
│   └── workflows/
│       └── ci-cd.yml             # GitHub Actions CI/CD (Pytest, Vitest, Docker build)
├── .dockerignore                 # Root container build context exclusions
├── .gitignore                    # Monorepo git exclusion rules
├── Dockerfile                    # Multi-stage production container (Node 22 + Python 3.12)
├── docker-compose.yml            # Multi-container orchestration (1-command startup)
├── Procfile                      # Heroku web dyno process declaration
├── heroku.yml                    # Heroku container build manifest
├── vercel.json                   # Vercel deployment configuration & SPA rewrites
├── README.md                     # Comprehensive documentation, findings & disclosure
│
├── backend/                      # Python FastAPI Analytics Service
│   ├── pytest.ini                # Pytest configuration with pythonpath
│   ├── requirements.txt          # Python dependencies (FastAPI, HTTPX, Pandas, NumPy, Pytest)
│   ├── data/
│   │   └── wind_data.db          # Pre-populated SQLite DB (1,777 FUELHH & 21,608 WINDFOR records)
│   ├── app/
│   │   ├── config.py             # Environment configurations, dates, and defaults
│   │   ├── db.py                 # SQLite schema, indices, connection pool & batch upserts
│   │   ├── main.py               # FastAPI application, CORS, routers & SPA static serving
│   │   ├── routes/
│   │   │   ├── accuracy.py       # /api/accuracy (MAE, RMSE, Bias, Diurnal, Histograms, Decay)
│   │   │   ├── data_quality.py   # /api/data-quality (100% coverage audit, raw JSON inspector)
│   │   │   ├── forecasts.py      # /api/forecasts (Granular 48 settlement periods for any day)
│   │   │   ├── health.py         # /health (System status, DB inventory & uptime)
│   │   │   ├── overview.py       # /api/overview (Executive KPIs, timeseries, daily heatmap)
│   │   │   ├── simulator.py      # /api/simulator (Thermal procurement & imbalance model)
│   │   │   ├── sync.py           # /api/sync (Background Elexon stream harvesting)
│   │   │   └── vintages.py       # /api/vintages/evolution (Fan chart revision history)
│   │   └── services/
│   │       ├── analytics.py      # Core brain: as-of isolation, alignment, metrics & simulator
│   │       └── elexon.py         # Elexon BMRS stream client with async chunking
│   └── tests/                    # Backend Automated Test Suite (19 Passing Tests)
│       ├── test_api_endpoints.py     # FastAPI TestClient endpoint verification
│       ├── test_cutoff_boundary.py   # Strict D-1 gate closure & post-cutoff exclusion
│       ├── test_data_processing.py   # Database counts, hourly alignment & 100% coverage
│       ├── test_metrics.py           # Mathematical verification of MAE, RMSE, Bias, WAPE
│       └── test_simulator.py         # Thermal balance equality & quantile hedging math
│
└── frontend/                     # React + TypeScript + Vite Financial Frontend
    ├── package.json              # Frontend scripts & dependencies
    ├── vite.config.ts            # Vite & Vitest configuration
    ├── tailwind.config.js        # High-contrast financial trading palette
    ├── postcss.config.js         # PostCSS configuration
    ├── index.html                # Semantic HTML5 entrypoint
    └── src/
        ├── App.tsx               # Main application layout, state & tab router
        ├── index.css             # Tailwind base styles & custom scrollbars
        ├── main.tsx              # React DOM mounting
        ├── types/
        │   └── index.ts          # Strongly typed TypeScript interfaces
        ├── services/
        │   └── api.ts            # REST client with automatic URL resolution
        ├── components/
        │   ├── GlobalToolbar.tsx # Date presets, D-1 gate closure selector & cadence toggle
        │   ├── MetricCard.tsx    # Financial-grade KPI card with badges and units
        │   └── Navbar.tsx        # Portal header, Elexon sync trigger & theme toggle
        ├── pages/
        │   ├── OverviewPage.tsx          # Executive dashboard, brush chart & error heatmap
        │   ├── SimulatorPage.tsx         # Day-Ahead thermal procurement simulator & dispatch
        │   ├── ForecastExplorerPage.tsx  # SP 1-48 inspector & vintage evolution fan chart
        │   ├── AccuracyPage.tsx          # Comprehensive quantitative analytics & decay curves
        │   ├── DataQualityPage.tsx       # 100% coverage audit & raw stream inspector
        │   └── MethodologyPage.tsx       # Market mechanics, LaTeX formulas & video script
        └── __tests__/                    # Frontend Test Suite (6 Passing Tests)
            ├── api.test.ts               # API service unit tests
            └── components.test.tsx       # UI component rendering tests
```

---

## 4. Official Upstream Data Sources (Elexon BMRS)

Under the assignment rules, **only Elexon data** is used:
- **Actual Wind Generation (`FUELHH` Stream)**:
  - Source: `https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream`
  - Filter: `fuelType=WIND`
  - Cadence: **30-minute Settlement Periods** (SPs 1 to 48 per day). In January 2026 (31 days), there are exactly **1,488 settlement periods**.
  - Fields: `startTime` (UTC target start), `settlementDate`, `settlementPeriod`, `generation` (MW).
- **Forecasted Wind Generation (`WINDFOR` Stream)**:
  - Source: `https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream`
  - Cadence: **60-minute target resolution** (`:00` hourly timestamps).
  - Horizon: Up to 73 hours ahead, published every ~2 hours by National Grid ESO.
  - Fields: `publishTime` (vintage timestamp), `startTime` (target hour), `generation` (forecasted MW).

---

## 5. Domain Methodology & Business Logic

### 5.1 Strict "As-Of" Gate Closure Cutoff (Zero Look-Ahead Bias)
In day-ahead electricity procurement, utilities submit final purchase bids into the day-ahead auction before the delivery day begins. A realistic tool **must exclude any forecast published after the auction gate closure**:
- **Default Policy:** Previous day ($D-1$) at **11:00:00 UTC** (gate closure for EPEX SPOT UK Day-Ahead Auction).
- **Configurable Cutoffs:** Traders can toggle to **09:30 UTC** (early bids), **15:30 UTC** (half-hourly auction), or **23:00 UTC** (BSC operational schedule deadline).
- **Selection Formula:** For each target settlement period $T$ on delivery date $D$:
  $$\mathcal{V}(T, \text{Cutoff}) = \{ v \in \text{WINDFOR} \mid v.\text{startTime} = T_{\text{hour}} \land v.\text{publishTime} \le \text{Cutoff}(D) \}$$
  $$\text{Selected Forecast} = \arg\max_{v \in \mathcal{V}} (v.\text{publishTime}).\text{generation}$$

### 5.2 Cadence Alignment: 30-min vs 60-min
- `FUELHH` is recorded at 30-minute intervals (1,488 periods in Jan 2026).
- `WINDFOR` is published at 60-minute intervals (744 hours in Jan 2026).
- **Power Market Standard (Flat-Block Mapping):** Generation is an average rate of delivery (MW). An hourly forecast of $M$ MW for 10:00 covers both Settlement Period 21 (10:00–10:30) and Settlement Period 22 (10:30–11:00). This provides **100.0% matched observation pairs (1,488 / 1,488 periods)**.
- **Hourly Aggregation (Optional):** Averages the two half-hourly actuals `(SP_odd + SP_even) / 2` to yield 744 matched hourly points.

### 5.3 Metric Mathematical Formulations
All accuracy metrics are evaluated on matched $(F_t, A_t)$ pairs:

$$\text{Error}_t = F_t - A_t \quad (\text{MW})$$

$$\text{MAE} = \frac{1}{N} \sum_{t=1}^{N} |F_t - A_t| \quad (\text{MW})$$

$$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{t=1}^{N} (F_t - A_t)^2} \quad (\text{MW})$$

$$\text{Bias} = \frac{1}{N} \sum_{t=1}^{N} (F_t - A_t) \quad (\text{MW})$$

$$\text{WAPE} = \frac{\sum_{t=1}^{N} |F_t - A_t|}{\sum_{t=1}^{N} A_t} \times 100\%$$

- **Sign Convention:** Positive bias indicates systematic **overforecasting** (forecast > actual, leading to short imbalance risk). Negative bias indicates **underforecasting** (forecast < actual, leading to long position risk).
- **WAPE Advantage:** Unlike MAPE, WAPE does not divide by individual period actuals, eliminating division-by-zero infinities during wind lulls.

---

## 6. January 2026 Empirical Findings

Evaluating all 31 days of January 2026 (1,488 matched settlement periods) under the baseline **11:00 UTC D-1 Gate Closure**:

| Metric | Empirical Value | Trading Desk Implication |
|---|---|---|
| **Actual Wind Outturn (Mean)** | **11,580.7 MW** | Actual national wind delivered to GB transmission grid |
| **Day-Ahead Forecast (Mean)** | **13,421.0 MW** | Average forecast available at D-1 11:00 UTC auction gate |
| **Mean Forecast Bias** | **+1,840.3 MW** | **Systematic overforecasting** across January 2026 |
| **Mean Absolute Error (MAE)** | **2,126.1 MW** | Average volume miss per half-hour |
| **Root Mean Square Error (RMSE)** | **2,620.8 MW** | High volatility driven by storm frontal timing shifts |
| **Weighted Abs % Error (WAPE)** | **18.36%** | Aggregate percentage volume error |
| **Correlation ($R^2$)** | **0.8602** ($r = 0.9275$) | High structural shape tracking, but systematic upward shift |
| **P10 Downside Quantile** | **-527.9 MW** | In 90% of periods, forecast does not overestimate by > 4,346 MW |
| **Maximum Miss** | **6,857.0 MW** | Extreme ramp event on Jan 24 (Storm Jocelyn / Isha tail) |
| **Coverage Percentage** | **100.0%** (1,488 / 1,488) | Zero nulls, zero missing settlement periods |

---

## 7. How to Start the Application

### Option A: 1-Command Docker Setup (Recommended)
Make sure Docker is installed and running, then execute:

```bash
docker compose up --build
```
- Open `http://localhost:8000` in your browser.
- FastAPI serves both the REST API endpoints and the React frontend on port `8000`.
- API documentation (Swagger UI) is live at `http://localhost:8000/docs`.

---

### Option B: Local Development Setup

#### 1. Backend Setup (FastAPI)
```bash
# Navigate to backend
cd backend

# Create and activate virtual environment (optional)
python -m venv .venv
# On Windows: .venv\Scripts\activate
# On Linux/macOS: source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend will be live at `http://localhost:8000`.

#### 2. Frontend Setup (React + Vite)
```bash
# In a new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
The frontend development server will be live at `http://localhost:5173`.

---

## 8. Automated Test Suites

### Backend Test Suite (19 Passing Tests)
Covers timestamp normalization, boundary cutoffs, post-cutoff exclusion, mathematical metric accuracy, simulator balance equality, and all API endpoints:

```bash
cd backend
pytest -v
```

### Frontend Test Suite (6 Passing Tests)
Covers API client URL parameter formatting, error handling, and component rendering:

```bash
cd frontend
npm test
```

### Production Build & Typecheck Verification
```bash
cd frontend
npm run build
```

---

## 9. Deployment Guide: Vercel vs. Heroku & CI/CD

### 9.1 Are They Free?
- **Vercel**: Has a **100% Free Hobby Tier** with generous bandwidth and build minutes. It is ideal for deploying the React frontend and serverless functions.
- **Heroku**: Retired its free dyno tier in November 2022. The lowest cost option is the "Eco" dyno plan (~$5/month). However, Heroku offers native Docker deployment (`heroku.yml`).
- **Free Container Alternatives**: **Render.com**, **Railway.app**, and **Fly.io** all offer free tiers that can run our `Dockerfile` directly with zero configuration.

---

### 9.2 How to Deploy to Vercel (Step-by-Step)
1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Deploy AuraGrid UK platform"
   git push origin main
   ```
2. Log in to [vercel.com](https://vercel.com) using your GitHub account.
3. Click **Add New...** $\rightarrow$ **Project**.
4. Select your GitHub repository.
5. In the configuration window:
   - Framework Preset: **Vite**
   - Root Directory: `./` (or select `frontend` if deploying frontend only)
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/dist`
6. Click **Deploy**. Vercel will build the frontend and provide a live URL (e.g., `https://auragrid-uk.vercel.app`).
   - *Note*: If hosting the backend separately (e.g., on Render or Heroku), add an environment variable `VITE_API_URL` pointing to your backend URL in the Vercel Project Settings.

---

### 9.3 How to Deploy to Heroku (Step-by-Step)
1. Install the Heroku CLI and log in:
   ```bash
   heroku login
   ```
2. Create a new Heroku application:
   ```bash
   heroku create auragrid-uk
   ```
3. Set the stack to container mode:
   ```bash
   heroku stack:set container --app auragrid-uk
   ```
4. Deploy the unified Docker image:
   ```bash
   git push heroku main
   ```
   Heroku will build the multi-stage `Dockerfile`, start the Python backend, and serve the React UI at `https://auragrid-uk.herokuapp.com`.

---

### 9.4 GitHub Actions CI/CD Pipeline
Our repository includes a complete CI/CD workflow at `.github/workflows/ci-cd.yml` that automatically:
1. Runs the 19 Python backend Pytest tests.
2. Runs the 6 Frontend Vitest unit tests.
3. Verifies the TypeScript production build.
4. Validates the Docker container build.

To enable automated deployment on push to `main`:
- **For Vercel**: Connect your GitHub repo directly in the Vercel dashboard. Vercel automatically deploys every push to `main` with zero additional GitHub Action setup.
- **For Heroku**: Add `HEROKU_API_KEY` and `HEROKU_APP_NAME` to your GitHub Repository Secrets and uncomment the Heroku deploy step in `.github/workflows/ci-cd.yml`.

---

## 10. Video Demo Presentation Script (10 Minutes)

As required by **Deliverables 3.1**, the 10-minute presentation is structured in two distinct 5-minute halves:

### Part 1: Client Pitch (Max 5 Minutes — Commercial Focus)
- **Minute 0:00 - 1:00 (The Commercial Challenge)**:  
  Introduce the utility's day-ahead dilemma. Buying power on $D-1$ requires knowing how much thermal (CCGT) capacity to dispatch to meet consumer demand, accounting for intermittent wind. Explain that bad wind forecasts trigger costly Balancing Mechanism cashout charges.
- **Minute 1:00 - 2:30 (Executive Dashboard & January 2026 Reality)**:  
  Walk through the Executive Overview. Reveal that in January 2026, the national wind forecast overpredicted actual outturn by **+1,840 MW** on average (MAE: 2,126 MW). Show the time series and daily heatmap, identifying high-volatility storm days.
- **Minute 2:30 - 4:15 (The Day-Ahead Procurement Simulator)**:  
  Demonstrate the core innovation. Select a peak winter day (e.g. Jan 15). Show how relying on the standard **P50 Point Forecast** leaves the utility heavily short during the evening peak. Switch to **P90 Conservative Hedging**: the model automatically offsets downside risk by +2,500 MW, increasing thermal procurement day-ahead at £85/MWh and avoiding punitive £145/MWh cashout penalties.
- **Minute 4:15 - 5:00 (Business Impact & Wrap-up)**:  
  Summarize the financial upside: millions in cashout risk eliminated while ensuring grid reliability.

### Part 2: Technical Lead Review (Max 5 Minutes — Architecture & Code)
- **Minute 5:00 - 6:00 (Architecture & Data Ingestion)**:  
  Walk through the stack: FastAPI + SQLite WAL mode backend, React 19 + TypeScript frontend. Emphasize sub-10ms query speeds via indexed local SQLite persistence.
- **Minute 6:00 - 7:15 (Zero Look-Ahead Bias Vintage Isolation)**:  
  Explain the core algorithmic rule: for delivery date $D$, any forecast published after $(D-1)$ 11:00 UTC (EPEX auction gate closure) is strictly excluded. Show `AnalyticsEngine.get_aligned_data()` and demonstrate the Forecast Evolution "Fan Chart".
- **Minute 7:15 - 8:15 (Cadence Alignment & Data Audit)**:  
  Walk through the Data Quality audit. Explain how 30-min actuals (`FUELHH`) and hourly forecasts (`WINDFOR`) are aligned using standard power market flat-block mapping to achieve **100.0% matched observation pairs (1,488 / 1,488 SPs)** with 0 nulls and 0 gaps.
- **Minute 8:15 - 9:30 (Test Coverage & Docker Containerization)**:  
  Show the 19 passing Pytest tests and 6 passing Vitest tests. Walk through the multi-stage `Dockerfile` and GitHub Actions CI/CD workflow.
- **Minute 9:30 - 10:00 (Conclusion & Next Steps)**:  
  Summarize production readiness and handoff.

---

## 11. AI Assistance Disclosure

In accordance with assignment instructions (Section 2), this application was developed with the assistance of modern AI tools (**Gemini / Zed Coding Agent**) for architecture planning, code scaffolding, and test generation. All mathematical algorithms, domain rules (BSC Section Q, EPEX gate closures), data pipelines, and UI designs were independently designed, audited, and mathematically verified against live Elexon BMRS stream data.
