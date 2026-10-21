"""
TCP CUBIC implementation based on RFC 9438 / RFC 8312.
Key characteristics:
- Window growth is a cubic function of elapsed time since last congestion event
- Independent of RTT in the core cubic phase, achieving high scalability on Long Fat Networks (LFNs)
- Concave probe below W_max, plateau around W_max, convex probe above W_max
- Reno-friendly emulation mode for fair coexistence with Reno flows
- Fast convergence heuristic to release capacity when competing with new flows
"""
import math
from app.simulation.base import CongestionControlAlgorithm, CongestionState

class TCPCubic(CongestionControlAlgorithm):
    def __init__(self, mss_bytes: int = 1460, initial_cwnd: float = 10.0):
        super().__init__(mss_bytes, initial_cwnd)
        self.c: float = 0.4                 # CUBIC scaling constant
        self.beta_cubic: float = 0.7        # Multiplicative decrease factor (0.7 in RFC 9438)
        self.w_max: float = initial_cwnd    # Window size before last congestion event
        self.w_last_max: float = initial_cwnd
        self.k: float = 0.0                 # Time period required to reach w_max
        self.epoch_start: float = 0.0       # Timestamp of the start of the current congestion avoidance epoch
        self.origin_point: float = initial_cwnd
        self.dup_ack_count: int = 0
        self.fast_convergence: bool = True

    def _update_k(self):
        # K = ((W_max * (1 - beta_cubic)) / C)^(1/3)
        delta = self.w_max * (1.0 - self.beta_cubic) / self.c
        self.k = math.pow(max(0.001, delta), 1.0 / 3.0)

    def on_ack(self, ack_num: int, bytes_acked: int, rtt_sample: float, now: float, is_duplicate: bool = False, is_partial: bool = False) -> None:
        if rtt_sample > 0:
            self.rtt = 0.875 * self.rtt + 0.125 * rtt_sample
            if self.min_rtt == 0 or rtt_sample < self.min_rtt:
                self.min_rtt = rtt_sample

        if is_duplicate:
            self.dup_ack_count += 1
            if self.dup_ack_count >= 3:
                self.on_loss("dup_ack", now)
            return

        self.dup_ack_count = 0

        if self.state == CongestionState.SLOW_START:
            self.cwnd += 1.0
            if self.cwnd >= self.ssthresh:
                self.state = CongestionState.CONGESTION_AVOIDANCE
                self.epoch_start = now
                self.origin_point = self.cwnd
                self._update_k()
        elif self.state == CongestionState.CONGESTION_AVOIDANCE or self.state == CongestionState.FAST_RECOVERY:
            self.state = CongestionState.CONGESTION_AVOIDANCE
            if self.epoch_start == 0.0:
                self.epoch_start = now
                self._update_k()

            # Elapsed time since epoch start
            t = max(0.0, now - self.epoch_start)

            # Target CUBIC window: W_cubic(t) = C * (t - K)^3 + W_max
            target_w_cubic = self.c * math.pow(t - self.k, 3) + self.w_max

            # Reno-friendly region (RFC 9438 Section 4.3):
            # W_est(t) = W_max * beta + 3 * (1 - beta)/(1 + beta) * (t / RTT)
            rtt_sec = max(0.001, self.rtt)
            reno_factor = 3.0 * (1.0 - self.beta_cubic) / (1.0 + self.beta_cubic)
            w_est = (self.w_max * self.beta_cubic) + (reno_factor * (t / rtt_sec))

            target_w = max(target_w_cubic, w_est)

            # Gradual convergence per ACK: increment proportionally
            if target_w > self.cwnd:
                # Additive increment per ACK towards target_w within this RTT
                cnt = max(1.0, self.cwnd / max(1.0, (target_w - self.cwnd)))
                self.cwnd += 1.0 / cnt
            else:
                self.cwnd += 1.0 / (100.0 * max(1.0, self.cwnd))

    def on_loss(self, loss_type: str, now: float) -> None:
        self.epoch_start = now
        self.dup_ack_count = 0

        # Fast convergence check
        if self.fast_convergence and self.cwnd < self.w_last_max:
            self.w_last_max = self.cwnd
            self.w_max = self.cwnd * (1.0 + self.beta_cubic) / 2.0
        else:
            self.w_last_max = self.cwnd
            self.w_max = self.cwnd

        self.ssthresh = max(2.0, self.cwnd * self.beta_cubic)
        if loss_type == "dup_ack":
            self.cwnd = self.ssthresh
            self.state = CongestionState.CONGESTION_AVOIDANCE
        elif loss_type == "timeout":
            self.cwnd = 1.0
            self.state = CongestionState.SLOW_START

        self.origin_point = self.cwnd
        self._update_k()
