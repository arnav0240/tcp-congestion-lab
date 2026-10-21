"""
TCP BBR (Bottleneck Bandwidth and RTT) implementation.
Based on Cardwell et al. (ACM Queue / IETF BBR draft).
Key principles:
- Model-based congestion control: continuously estimates BtlBw and RTprop
- Decouples pacing rate from cwnd (operates a rate pacer)
- Operates at the Kleinrock optimal operating point (inflight = 1 BDP, zero queue, max throughput)
- Resilient to random non-congestive packet loss
- State Machine: STARTUP -> DRAIN -> PROBE_BW (8-phase cycle) <-> PROBE_RTT
"""
import collections
from app.simulation.base import CongestionControlAlgorithm, CongestionState

class TCPBbr(CongestionControlAlgorithm):
    # Pacing gain cycle for ProbeBW (8 phases)
    PACING_GAIN_CYCLE = [1.25, 0.75, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]

    def __init__(self, mss_bytes: int = 1460, initial_cwnd: float = 10.0):
        super().__init__(mss_bytes, initial_cwnd)
        self.state = CongestionState.STARTUP
        self.btl_bw: float = 1e6               # bits per second estimate
        self.rt_prop: float = 0.05             # minimum RTT in seconds
        self.rt_prop_stamp: float = 0.0        # when min RTT was last refreshed

        # Delivery rate filter over recent rounds
        self.bandwidth_samples = collections.deque(maxlen=10)
        self.min_rtt_samples = collections.deque(maxlen=20)

        # State machine variables
        self.pacing_gain: float = 2.885        # 2 / ln(2)
        self.cwnd_gain: float = 2.885
        self.cycle_index: int = 0
        self.cycle_stamp: float = 0.0
        self.probe_rtt_done_stamp: float = 0.0
        self.probe_rtt_round_done: bool = False

        # Startup plateau detection
        self.startup_max_bw: float = 0.0
        self.startup_stagnant_rounds: int = 0
        self.round_start: bool = False
        self.round_count: int = 0

        # Loss handling
        self.loss_recovery_mode: bool = False

    def on_ack(self, ack_num: int, bytes_acked: int, rtt_sample: float, now: float, is_duplicate: bool = False, is_partial: bool = False) -> None:
        if is_duplicate:
            return

        # Measure instantaneous delivery rate: bytes_acked / rtt_sample
        if rtt_sample > 0 and bytes_acked > 0:
            delivery_rate_bps = (bytes_acked * 8.0) / rtt_sample
            self.bandwidth_samples.append(delivery_rate_bps)
            self.btl_bw = max(self.bandwidth_samples)

            # Update RTprop (min RTT)
            if self.rt_prop == 0 or rtt_sample < self.rt_prop or (now - self.rt_prop_stamp > 10.0):
                self.rt_prop = rtt_sample
                self.rt_prop_stamp = now

            self.rtt = 0.875 * self.rtt + 0.125 * rtt_sample
            self.min_rtt = self.rt_prop

        # Execute BBR State Machine transitions
        self._update_state_machine(now)

        # Calculate BDP (Bandwidth-Delay Product in bytes)
        bdp_bytes = (self.btl_bw * self.rt_prop) / 8.0
        bdp_packets = max(4.0, bdp_bytes / self.mss)

        # Calculate cwnd and pacing rate based on state gains
        if self.state == CongestionState.PROBE_RTT:
            self.cwnd = 4.0  # Drain queue completely to measure true propagation delay
            self.pacing_gain = 1.0
        else:
            self.cwnd = max(4.0, bdp_packets * self.cwnd_gain)

        self.pacing_rate_bps = max(1e5, self.btl_bw * self.pacing_gain)

    def _update_state_machine(self, now: float) -> None:
        if self.state == CongestionState.STARTUP:
            self.pacing_gain = 2.885
            self.cwnd_gain = 2.885
            # Check for startup bandwidth plateau (growth < 25%)
            if self.btl_bw > self.startup_max_bw * 1.25:
                self.startup_max_bw = self.btl_bw
                self.startup_stagnant_rounds = 0
            else:
                self.startup_stagnant_rounds += 1
                if self.startup_stagnant_rounds >= 3:
                    # Plateau detected: transition to DRAIN
                    self.state = CongestionState.DRAIN

        elif self.state == CongestionState.DRAIN:
            self.pacing_gain = 1.0 / 2.885  # ~0.35 to drain queue
            self.cwnd_gain = 2.885
            # Drain until cwnd approximates 1 BDP
            bdp_bytes = (self.btl_bw * self.rt_prop) / 8.0
            bdp_packets = max(4.0, bdp_bytes / self.mss)
            if self.cwnd <= bdp_packets * 1.2:
                self.state = CongestionState.PROBE_BW
                self.cycle_index = 0
                self.cycle_stamp = now

        elif self.state == CongestionState.PROBE_BW:
            self.cwnd_gain = 2.0
            # Check if 1 round has elapsed for current cycle phase
            if now - self.cycle_stamp >= self.rt_prop:
                self.cycle_index = (self.cycle_index + 1) % len(self.PACING_GAIN_CYCLE)
                self.cycle_stamp = now
            self.pacing_gain = self.PACING_GAIN_CYCLE[self.cycle_index]

            # Check if RTprop needs refreshing (every 10 seconds)
            if now - self.rt_prop_stamp > 10.0 and self.state != CongestionState.PROBE_RTT:
                self.state = CongestionState.PROBE_RTT
                self.probe_rtt_done_stamp = now + 0.2  # probe for 200ms

        elif self.state == CongestionState.PROBE_RTT:
            self.cwnd_gain = 1.0
            self.pacing_gain = 1.0
            if now >= self.probe_rtt_done_stamp:
                self.rt_prop_stamp = now
                self.state = CongestionState.PROBE_BW
                self.cycle_index = 0
                self.cycle_stamp = now

    def on_loss(self, loss_type: str, now: float) -> None:
        # BBR does not interpret random or mild loss as a collapse of bandwidth!
        # It handles loss by entering a transient recovery pacing mode without slashing cwnd by 50%
        if loss_type == "timeout":
            self.pacing_gain = 0.5
            self.cwnd = max(4.0, self.cwnd * 0.7)
        else:
            # On 3 dupACKs, modestly limit inflight packets to 1 BDP
            bdp_bytes = (self.btl_bw * self.rt_prop) / 8.0
            bdp_packets = max(4.0, bdp_bytes / self.mss)
            self.cwnd = max(4.0, bdp_packets)
