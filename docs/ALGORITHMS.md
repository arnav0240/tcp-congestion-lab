# TCP Congestion Control Algorithms Reference

This document details the theoretical foundations, RFC standards, control state machines, and mathematical equations governing the four evaluated algorithms in the **TCP Congestion Control Research Lab**.

---

## 1. TCP Reno (RFC 5681)

TCP Reno represents the classic Loss-Based AIMD (Additive Increase, Multiplicative Decrease) congestion control paradigm developed by Van Jacobson.

### Key Equations & Mechanisms:
1. **Slow Start**:
   When $cwnd < ssthresh$:
   $$\text{For every ACK received:} \quad cwnd \leftarrow cwnd + 1 \text{ MSS}$$
   Window doubles approximately every round-trip time ($RTT$).

2. **Congestion Avoidance**:
   When $cwnd \ge ssthresh$:
   $$\text{For every ACK received:} \quad cwnd \leftarrow cwnd + \frac{1}{\lfloor cwnd \rfloor} \text{ MSS}$$
   Additive linear increase of approximately $+1\text{ MSS}$ per RTT.

3. **Fast Retransmit & Fast Recovery**:
   Triggered on receiving **3 duplicate ACKs**:
   $$ssthresh \leftarrow \max\left(2\text{ MSS}, \left\lfloor \frac{cwnd}{2} \right\rfloor\right)$$
   $$cwnd \leftarrow ssthresh + 3\text{ MSS}$$
   Upon receiving a new ACK: $cwnd \leftarrow ssthresh$, exit to Congestion Avoidance.

4. **Retransmission Timeout (RTO)**:
   $$ssthresh \leftarrow \max\left(2\text{ MSS}, \left\lfloor \frac{cwnd}{2} \right\rfloor\right)$$
   $$cwnd \leftarrow 1\text{ MSS}, \quad \text{State} \leftarrow \text{SLOW\_START}$$

---

## 2. TCP NewReno (RFC 6582)

TCP NewReno extends Reno's Fast Recovery to resolve severe throughput degradation when multiple packets are dropped within a single window of data.

### The Problem in Classic Reno:
In Reno, receiving an ACK that acknowledges *some* but not *all* outstanding packets during Fast Recovery (a "Partial ACK") causes the sender to mistakenly exit Fast Recovery, deflate $cwnd$ back to $ssthresh$, and experience a catastrophic Retransmission Timeout (RTO).

### NewReno Solution:
- Records the highest sequence number transmitted prior to entering Fast Recovery as $recover$.
- **Partial ACK handling**:
  If an arriving ACK has $ack\_seq < recover$:
  1. Immediately retransmits the first unacknowledged segment.
  2. Deflates $cwnd$ by the amount of data acknowledged, plus $1\text{ MSS}$.
  3. **Remains in Fast Recovery** without resetting to 1 MSS!
- **Full ACK**: Only when $ack\_seq \ge recover$ does NewReno exit to Congestion Avoidance.

---

## 3. TCP CUBIC (RFC 9438 / RFC 8312)

TCP CUBIC is the default congestion control algorithm in Linux, engineered specifically to overcome Reno's poor scalability on **Long Fat Networks (LFNs)** where Bandwidth-Delay Product (BDP) is high.

### Mathematical Model:
CUBIC replaces Reno's RTT-dependent linear growth with a cubic function of elapsed real time $t$ since the last congestion event:

$$W_{cubic}(t) = C (t - K)^3 + W_{max}$$

Where:
- $C = 0.4$ (scaling factor)
- $\beta_{cubic} = 0.7$ (multiplicative decrease factor)
- $W_{max}$ is the window size immediately before the loss event.
- $K$ is the time required to scale window from $W_{max} \cdot \beta$ back to $W_{max}$:
  $$K = \sqrt[3]{\frac{W_{max}(1 - \beta_{cubic})}{C}}$$

### Growth Phases:
1. **Concave Region ($t < K$)**: Fast initial acceleration, flattening out as it approaches the previous saturation point $W_{max}$.
2. **Plateau ($t \approx K$)**: High stability probing near bottleneck capacity with minimal queue churn.
3. **Convex Region ($t > K$)**: Aggressive upward acceleration to discover newly freed path bandwidth.
4. **Reno-Friendly Mode**: Calculates synthetic Reno trajectory $W_{est}(t)$; uses $\max(W_{cubic}, W_{est})$ to guarantee fairness when competing with legacy Reno flows on small-BDP pipes.

---

## 4. TCP BBR (Cardwell et al. / ACM Queue)

TCP BBR (**B**ottleneck **B**andwidth and **R**ound-trip propagation time) represents a paradigm shift: **Model-Based, Rate-Paced Congestion Control**.

### Philosophy:
Loss-based algorithms (Reno, CUBIC) treat packet drops as the indicator of congestion. However, in modern networks:
- Shallow buffers drop packets due to burstiness, causing false window cuts.
- Deep buffers delay packet drops until the buffer is completely full, causing **Bufferbloat** (inflated RTTs of hundreds of milliseconds).

BBR operates at **Kleinrock's optimal operating point**:
$$\text{Max Throughput} \quad \text{AND} \quad \text{Min Latency}$$
$$\text{In-Flight Data} = BDP = BtlBw \times RTprop$$

### State Machine:
1. **STARTUP**: Doubles sending rate exponentially ($pacing\_gain = 2.89$) until bottleneck bandwidth estimate plateaus across 3 consecutive rounds.
2. **DRAIN**: Pacing drops to $0.35$ ($1 / 2.89$) to purge any standing queue accumulated during startup down to $1 \times BDP$.
3. **PROBE_BW**: 8-round periodic gain cycle:
   $$[1.25, 0.75, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]$$
   - $1.25$: probes for higher capacity.
   - $0.75$: drains the transient queue created.
   - $1.0$: cruises smoothly at measured bottleneck rate with zero standing queue.
4. **PROBE_RTT**: Every 10 seconds, cuts in-flight packets to 4 for 200 ms to drain all queues and refresh true physical propagation time $RTprop$.

### Reaction to Random Loss:
Because BBR decouples packet loss from rate pacing, random wireless drops (e.g., 2% channel noise) do NOT cut delivery speed in half!
