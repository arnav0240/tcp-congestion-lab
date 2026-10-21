# TCP Congestion Control Research Lab: System Architecture

```
                                  +------------------------------------------------------+
                                  |            Modern NOC Web Interface (React)          |
                                  |  - Dashboard Overview       - Network Simulator      |
                                  |  - Algorithm Comparison     - Telemetry Time-Series  |
                                  |  - Experiment History       - Scenario Presets       |
                                  +---------------------------+--------------------------+
                                                              |  REST JSON API
                                                              v
+------------------------------------------------------------------------------------------------------------------+
|                                              FastAPI Application Layer                                           |
|  /api/v1/health   |   /api/v1/algorithms   |   /api/v1/scenarios   |   /api/v1/experiments   |   /api/v1/compare |
+---------------------------------------------+------------------------------------+-------------------------------+
                                              |                                    |
                                              v                                    v
+--------------------------------------------------------------------+   +-----------------------------------------+
|                Simulation & Congestion Control Core                |   |       SQLite Persistent Database        |
|                                                                    |   |  - experiments (parameters, status)     |
|   +-------------------+  +-------------------+  +---------------+  |   |  - algorithm_runs (per-trial metrics)   |
|   |   TCP Reno        |  |   TCP NewReno     |  |   TCP CUBIC   |  |   |  - time_series_records (100ms epochs)   |
|   |   (RFC 5681)      |  |   (RFC 6582)      |  |   (RFC 9438)  |  |   +-----------------------------------------+
|   +-------------------+  +-------------------+  +---------------+  |
|   |   TCP BBR (Cardwell et al., Model-Based Rate Pacing)           |  |
|   +----------------------------------------------------------------+  |
|                                                                       |
|   +----------------------------------------------------------------+  |
|   |         High-Fidelity Discrete-Event Network Simulator          |  |
|   |  - Microsecond priority event queue                            |  |
|   |  - Finite FIFO bottleneck buffer with DropTail queuing         |  |
|   |  - Base propagation RTT + delay jitter                         |  |
|   |  - Independent random wireless channel error model             |  |
|   |  - Dynamic time-varying bandwidth schedules                    |  |
|   |  - Competing background cross-traffic generator                |  |
|   +----------------------------------------------------------------+  |
|                                                                       |
|   +----------------------------------------------------------------+  |
|   |      Native ns-3 Integration Runner (C++ point-to-point)       |  |
|   +----------------------------------------------------------------+  |
+-----------------------------------------------------------------------+
```

## Layer Separation:
1. **Frontend**: Vite + React 19 + TypeScript + Tailwind CSS + Recharts + Lucide Icons. Pure client that connects via standard HTTP fetch calls to the `/api/v1` REST interface.
2. **API & Services Layer**: FastAPI with Pydantic v2 schemas for strict parameter range validation. Orchestrates multiple trials under identical pseudo-random seeds.
3. **Simulation Abstraction Layer**: Pluggable `CongestionControlAlgorithm` base class enabling any algorithm to be registered.
4. **Execution Mode Detection**: `ns3_runner.py` detects ns-3 presence in PATH or `NS3_HOME`. Transparently runs native ns-3 when available, or executes the deterministic Discrete-Event Simulator fallback.
5. **Persistence Layer**: SQLAlchemy with SQLite (`lab.db`), ensuring runs, metrics, and time-series persist across server reboots.
