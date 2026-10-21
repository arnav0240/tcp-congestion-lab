# ns-3 Integration Guide for TCP Congestion Control Research Lab

This directory contains the native **ns-3 Network Simulator** simulation script and configuration templates for the research lab.

---

## 1. Overview and Execution Architecture

The TCP Congestion Control Research Lab implements a dual-mode execution strategy:

1. **Native NS-3 Mode (`ns3`)**:
   - Executes packet-level C++ simulations via ns-3 (supports `ns-3.35` through `ns-3.41+`).
   - Uses native Linux kernel / ns-3 TCP socket implementations (`ns3::TcpLinuxReno`, `ns3::TcpNewReno`, `ns3::TcpCubic`, `ns3::TcpBbr`).
   - Sinks trace sources directly to JSON telemetry.

2. **Educational Discrete-Event Engine Mode (`educational_sim`)**:
   - Fully bundled, deterministic, zero-dependency Python discrete-event engine modeling bottleneck queuing, DropTail drops, RTT feedback, AIMD, RFC 6582 partial ACKs, RFC 9438 CUBIC time-epochs, and BBR bandwidth/delay state filters.
   - Automatically activates when native ns-3 is not installed or detected in the host OS.

> **Scientific Integrity Notice:** The application transparently displays the active execution mode in the top navigation bar, experiment metadata, and downloadable reports. Fallback results are never presented as packet-level ns-3 measurements.

---

## 2. Prerequisites for Native ns-3 Mode

To run experiments using the native ns-3 engine, you must have an ns-3 installation (recommended: Ubuntu/Debian or WSL2).

```bash
# Ubuntu / Debian dependencies
sudo apt-get update
sudo apt-get install -y build-essential cmake ninja-build git python3 g++
```

### Downloading and Building ns-3

```bash
# Download ns-3.41
wget https://www.nsnam.org/release/ns-allinone-3.41.tar.bz2
tar xjf ns-allinone-3.41.tar.bz2
cd ns-allinone-3.41/ns-3.41

# Configure and compile with CUBIC and BBR enabled
./ns3 configure --enable-examples --build-profile=optimized
./ns3 build
```

---

## 3. Running the Included Simulation Script

Copy the simulation script to the ns-3 `scratch/` directory:

```bash
cp simulations/tcp_congestion_lab.cc /path/to/ns-3.41/scratch/tcp_congestion_lab.cc

# Run with custom parameters
cd /path/to/ns-3.41
./ns3 run "scratch/tcp_congestion_lab --tcpTypeId=TcpCubic --bandwidth=100Mbps --delay=40ms --lossRate=0.01 --duration=20.0 --outputJson=cubic_results.json"
```

### Supported TCP Socket Types:
- `--tcpTypeId=TcpNewReno` (RFC 6582)
- `--tcpTypeId=TcpCubic` (RFC 9438)
- `--tcpTypeId=TcpBbr` (BBR Model)
- `--tcpTypeId=TcpLinuxReno` (Standard AIMD Reno)

---

## 4. Enabling Native ns-3 in the Web Application

Set the `NS3_HOME` environment variable before launching the backend:

```bash
# Windows (PowerShell)
$env:NS3_HOME="C:\path\to\ns-3"
python -m uvicorn app.main:app --reload

# Linux / macOS / WSL
export NS3_HOME="/home/user/ns-allinone-3.41/ns-3.41"
python -m uvicorn app.main:app --reload
```

The backend health endpoint (`/api/v1/health`) will immediately detect the executable, update `active_mode: "ns3"`, and direct simulation jobs to ns-3!
