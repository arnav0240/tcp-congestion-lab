# Computer Networks Mini-Project: Viva & Defense Cheatsheet
## "Performance Analysis of TCP Congestion Control Algorithms under Varying Network Conditions"

---

## 1. Quick Project Elevator Pitch
> *"Our project is an interactive, full-stack research testbed that models, simulates, and statistically analyzes four generations of TCP congestion control—Reno (RFC 5681), NewReno (RFC 6582), CUBIC (RFC 9438), and BBR (Cardwell et al.)—across configurable bottleneck bandwidths, propagation delays, random loss rates, and buffer limits. It computes metrics such as goodput, 95th-percentile RTT, queue drops vs channel losses, and Jain's Fairness Index, accompanied by automated evidence-based scientific interpretation."*

---

## 2. Top 10 Viva Questions & Expert Answers

### Q1: What is the difference between Throughput and Goodput?
**Answer:**
- **Throughput** is the total number of delivered data bits (including transport/network protocol headers and retransmitted duplicate packets) per second.
- **Goodput** is the useful application-layer payload delivered per second, strictly excluding retransmitted duplicate bytes and protocol overhead:
  $$\text{Goodput (Mbps)} = \frac{\text{Unique Application Payload Bits Delivered}}{\text{Duration (seconds)} \times 10^6}$$
Under packet loss or frequent retransmissions, throughput can look falsely healthy while goodput collapses!

### Q2: Why does TCP Reno perform poorly on high-bandwidth, long-delay networks (LFNs)?
**Answer:**
TCP Reno's additive increase increases $cwnd$ by only $1\text{ MSS}$ per RTT.
If a 1 Gbps link has a 100 ms RTT, the Bandwidth-Delay Product is:
$$BDP = \frac{10^9 \times 0.1}{8 \times 1460} \approx 8560 \text{ packets}$$
If a packet drops, Reno cuts $cwnd$ to $4280\text{ packets}$. To recover the missing 4280 packets at $+1\text{ packet/RTT}$ takes:
$$4280 \text{ RTTs} \times 0.1\text{ s} = 428 \text{ seconds (over 7 minutes!)}$$
This is why TCP CUBIC was introduced—its cubic equation scales with *real time* independent of RTT.

### Q3: What is Bufferbloat and which algorithm causes or solves it?
**Answer:**
Bufferbloat occurs when network routers have excessively large drop-tail queue buffers.
- **Loss-based algorithms (Reno, CUBIC)** only slow down when packets are dropped. Therefore, they keep filling the buffer until it overflows. While throughput remains high, round-trip latency explodes from 20 ms to 500+ ms because packets sit in huge queues.
- **BBR solves bufferbloat** because it is model-based: it estimates bottleneck bandwidth and minimum RTT, deliberately pacing traffic to maintain only $1 \times BDP$ in flight, keeping queues empty and latency minimal.

### Q4: How does NewReno improve over classic Reno during multiple packet losses?
**Answer:**
In classic Reno, if multiple packets are lost in one flight, receiving a "Partial ACK" causes Reno to exit Fast Recovery, deflate $cwnd$, and trigger a timeout (RTO).
NewReno records the highest sent sequence number ($recover$). When a Partial ACK arrives ($ack\_seq < recover$), NewReno immediately retransmits the missing segment and **remains in Fast Recovery** without resetting to $cwnd = 1$.

### Q5: How does BBR handle random wireless packet loss?
**Answer:**
Loss-based algorithms assume *any* packet drop is caused by buffer overflow, so they slash $cwnd$ by 50% or 30%. On a wireless link with 2% random channel error, Reno's throughput collapses to near zero.
BBR does not treat packet drops as congestion signals. Instead, it measures maximum delivery rate and minimum RTT; if packet loss occurs without an increase in RTT, BBR continues pacing at the bottleneck rate, sustaining high goodput.

### Q6: What is Jain's Fairness Index and what do its values mean?
**Answer:**
$$J = \frac{\left(\sum_{i=1}^n x_i\right)^2}{n \cdot \sum_{i=1}^n x_i^2}$$
For $n$ competing flows, $J$ ranges from $\frac{1}{n}$ (worst case: one flow monopolizes everything) to $1.0$ (perfect equality where all flows get equal shares).

### Q7: What are the states in TCP BBR's state machine?
**Answer:**
1. **STARTUP**: Exponential search for bottleneck bandwidth ($pacing\_gain = 2.89$).
2. **DRAIN**: Drains the queue created during startup ($pacing\_gain = 0.35$).
3. **PROBE_BW**: 8-phase cycling gain $[1.25, 0.75, 1.0, \dots]$ to probe bandwidth while keeping queues clear.
4. **PROBE_RTT**: Periodic drop to 4 packets inflight to measure true physical propagation time uncontaminated by queuing.

### Q8: What is the Reno-Friendly region in CUBIC?
**Answer:**
On low-BDP networks (e.g. short-RTT LANs), CUBIC calculates a synthetic Reno window trajectory $W_{est}(t)$. If $W_{cubic}(t) < W_{est}(t)$, CUBIC defaults to $W_{est}(t)$ so it doesn't get starved by competing Reno flows.

### Q9: What is the simulation execution mode in your project?
**Answer:**
The application supports a dual-engine architecture:
1. Native ns-3 discrete-event network simulator (when installed on Linux/WSL).
2. A high-fidelity, deterministic Discrete-Event Network Simulator built in Python with microsecond-level packet scheduling, DropTail queuing, RFC-compliant Reno, NewReno, CUBIC, and BBR algorithms, and matched pseudo-random seeds.
Every experiment records its execution mode for scientific integrity.

### Q10: How are confidence intervals and multi-trial statistics handled?
**Answer:**
Users can configure 1 to 10 repetitions per experiment. The backend seeds each run deterministically (e.g. seed, seed+1000, etc.), computes the sample mean and standard deviation ($\bar{x} \pm \sigma$), and shows variability across runs rather than relying on a single lucky trial.
