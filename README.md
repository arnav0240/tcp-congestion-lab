# TCP Congestion Control Research Lab
## Performance Analysis of TCP Congestion Control Algorithms under Varying Network Conditions

An academic full-stack research platform and simulation testbed engineered to evaluate, benchmark, and compare four generations of TCP Congestion Control algorithms: **TCP Reno (RFC 5681)**, **TCP NewReno (RFC 6582)**, **TCP CUBIC (RFC 9438)**, and **TCP BBR (Cardwell et al.)**.

Designed for Computer Networks mini-projects, research labs, and academic defense/viva examinations.

---

## 1. Project Overview & Research Objectives

Congestion control is the fundamental mechanism that prevents collapse in packet-switched computer networks. This project analyzes how distinct control paradigms behave under varying physical network constraints:

- **Loss-Based AIMD (TCP Reno / NewReno)**: Scalability limits on high Bandwidth-Delay Product (BDP) links and sensitivity to non-congestive channel loss.
- **Time-Based Convex/Concave Growth (TCP CUBIC)**: High-speed scalability on Long Fat Networks (LFNs) and Reno-friendly coexistence.
- **Model-Based Rate Pacing (TCP BBR)**: Decoupling packet loss from rate control, operating at Kleinrock's optimal operating point (Max Throughput, Min RTT) to prevent Bufferbloat.

### Questions Answered by Real Simulation:
1. *Which algorithms achieve higher goodput on lossy wireless channels?* (BBR vs Reno)
2. *How severely do oversized router buffers inflate queueing delay (Bufferbloat)?* (Reno/CUBIC vs BBR)
3. *How does high propagation RTT impair Reno's window growth?* (CUBIC vs Reno on LFNs)
4. *How fairly do multiple competing flows share a narrow bottleneck?* (Jain's Fairness Index $J$)
5. *How quickly do algorithms adapt when bottleneck bandwidth changes mid-transfer?*

---

## 2. Key Features

- **Dual-Engine Execution**:
  - **Native ns-3 Integration**: Supports C++ point-to-point simulations using native ns-3 TCP socket factories.
  - **Educational Discrete-Event Engine**: Bundled deterministic, microsecond-resolution Python event queue with DropTail queuing, delay jitter, channel error models, and matched-seed reproducibility.
- **7 Pre-Configured Benchmark Scenarios**:
  1. Low-Latency LAN (100 Mbps, 5 ms RTT, 0% loss)
  2. High-Bandwidth, Long-Distance / LFN (100 Mbps, 120 ms RTT, High BDP)
  3. Lossy Wireless Network (25 Mbps, 45 ms RTT, 2.5% random loss)
  4. Congested Bottleneck (12 Mbps, 4 flows, small 25-pkt queue)
  5. Bufferbloat Study (20 Mbps, 30 ms RTT, deep 500-pkt queue)
  6. Dynamic Bandwidth Fluctuation (50 Mbps &rarr; 15 Mbps &rarr; 60 Mbps)
  7. Custom Exploratory Scenario
- **Rigorous Telemetry & Metrics**:
  - Application Goodput vs Network Throughput (Mbps)
  - Mean RTT and 95th-Percentile Tail RTT (ms)
  - Queue Drops vs Random Channel Losses
  - Retransmission counters
  - Congestion Window ($cwnd$) and BBR Pacing Rate time-series
  - Router FIFO Queue Occupancy ($Q(t)$)
  - Jain's Fairness Index: $J = (\sum x_i)^2 / (N \sum x_i^2)$
- **Automated Scientific Interpretation Engine**: Generates evidence-based deductions directly from observed metrics without hand-waving or claiming universal superiority.
- **Persistent Local Database**: SQLite database preserving all experiments, trial runs, and 100ms telemetry streams.
- **Complete Data Exports**: Download actual simulation traces in JSON, CSV (Aggregate Metrics), CSV (Time-Series), and Markdown Research Reports.

---

## 3. Technology Stack

- **Frontend**:
  - React 19 + TypeScript
  - Vite build tool & development server
  - Tailwind CSS (NOC Telemetry Dark Theme)
  - Recharts (responsive multi-series and area charts)
  - Lucide React icons
- **Backend**:
  - Python 3.10+
  - FastAPI (REST API with auto-generated OpenAPI/Swagger documentation)
  - Pydantic v2 (strict parameter bounds validation)
  - SQLAlchemy ORM with SQLite persistent storage (`lab.db`)
  - Pytest (20 automated unit and integration tests)

---

## 4. Quickstart: Installation and Running

### Prerequisites
- Python 3.10+ installed
- Node.js 18+ and npm installed

### Option A: One-Click Startup (Recommended)

#### On Windows (PowerShell):
```powershell
.\scripts\start.ps1
```

#### On Linux / macOS:
```bash
chmod +x ./scripts/start.sh
./scripts/start.sh
```

---

### Option B: Manual Step-by-Step Launch

#### 1. Backend Service:
```bash
# From workspace root
cd backend

# Install Python requirements (if not already installed)
pip install -r requirements.txt

# Start FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Health Status: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)
- Interactive Swagger UI: [http://127.0.0.1:8000/api/docs](http://127.0.0.1:8000/api/docs)

#### 2. Frontend Web Interface:
```bash
# In a new terminal window
cd frontend

# Install node modules (if not already installed)
npm install

# Start Vite dev server
npm run dev
```
- Web Application URL: [http://localhost:5173](http://localhost:5173)

---

## 5. Running Automated Tests

Run the test verification suite to validate mathematical correctness, RFC algorithms, and API endpoints:

```bash
# Run backend pytest suite (20 tests)
python -m pytest backend/tests -v

# Run frontend TypeScript type-check and production build
cd frontend
npm run build
```

Or run the automated test script:
```powershell
.\scripts\run_tests.ps1
```

---

## 6. Project Structure

```
CN MINIPROJECT/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app entry point & lifespan
│   │   ├── api/                     # REST API routers (health, algorithms, scenarios, experiments, compare, export)
│   │   ├── database/                # SQLAlchemy SQLite session setup
│   │   ├── models/                  # Experiment, AlgorithmRun, TimeSeries ORM models
│   │   ├── schemas/                 # Pydantic v2 validation schemas
│   │   ├── services/                # Experiment orchestrator, automated interpretation, exporter
│   │   └── simulation/              # TCP Reno, NewReno, CUBIC, BBR, Discrete-Event Engine, Presets, ns-3 runner
│   ├── tests/                       # 20 Unit & integration tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/              # TopNav, Sidebar, TopologyVisualizer, MetricCard, ExportDropdown, VivaModal
│   │   ├── pages/                   # Dashboard, Simulator, Compare, TimeSeries, History, Scenarios, Methodology, Docs
│   │   ├── api/                     # Typed REST API client
│   │   ├── types/                   # TypeScript interfaces matching backend schemas
│   │   └── index.css                # Tailwind dark NOC styling
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── ns3/
│   ├── README.md                    # Compilation instructions for native ns-3
│   └── simulations/
│       └── tcp_congestion_lab.cc    # C++ Point-to-Point ns-3 simulation script
├── docs/
│   ├── ARCHITECTURE.md              # System design & layer separation
│   ├── ALGORITHMS.md                # Theoretical models & RFC equations
│   ├── VIVA_CHEATSHEET.md           # Examiner questions & high-scoring answers
│   └── METHODOLOGY.md               # Research experimental methodology
├── scripts/
│   ├── start.ps1                    # One-click Windows launcher
│   ├── start.sh                     # One-click Linux/macOS launcher
│   └── run_tests.ps1                # Automated verification script
└── README.md
```

---

## 7. Authoritative References

- **RFC 5681**: *TCP Congestion Control* (Allman, Paxson, Blanton, 2009)
- **RFC 6582**: *The NewReno Modification to TCP's Fast Recovery Algorithm* (Henderson et al., 2012)
- **RFC 9438**: *CUBIC for Fast and Long-Distance Networks* (Xu, Ha, Rhee, Goel, Eggert, 2023)
- **ACM Queue 2016**: *BBR: Congestion-Based Congestion Control* (Cardwell, Cheng, Gunn, Yuchung, Jacobson, 2016)
- **ns-3 Network Simulator**: *TCP Models Documentation* (nsnam.org)
