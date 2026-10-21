"""
TCP Reno implementation based on RFC 5681.
Features:
- Slow Start: cwnd doubles every RTT (increases by 1 MSS per ACK)
- Congestion Avoidance: Additive Increase (increases by 1 MSS per RTT)
- Fast Retransmit & Fast Recovery: Multiplicative Decrease on 3 duplicate ACKs
- Timeout handling: resets cwnd to 1 MSS and enters Slow Start
"""
from app.simulation.base import CongestionControlAlgorithm, CongestionState

class TCPReno(CongestionControlAlgorithm):
    def __init__(self, mss_bytes: int = 1460, initial_cwnd: float = 10.0):
        super().__init__(mss_bytes, initial_cwnd)
        self.dup_ack_count = 0

    def on_ack(self, ack_num: int, bytes_acked: int, rtt_sample: float, now: float, is_duplicate: bool = False, is_partial: bool = False) -> None:
        # Update smoothed RTT and min_rtt
        if rtt_sample > 0:
            self.rtt = 0.875 * self.rtt + 0.125 * rtt_sample
            if self.min_rtt == 0 or rtt_sample < self.min_rtt:
                self.min_rtt = rtt_sample

        if is_duplicate:
            self.dup_ack_count += 1
            if self.state == CongestionState.FAST_RECOVERY:
                # Inflate cwnd for packets that have left the pipe
                self.cwnd += 1.0
            elif self.dup_ack_count >= 3:
                # Trigger Fast Retransmit & Fast Recovery
                self.on_loss("dup_ack", now)
            return

        # New ACK received: reset duplicate ACK counter
        self.dup_ack_count = 0

        if self.state == CongestionState.FAST_RECOVERY:
            # Full ACK in Reno exits Fast Recovery immediately (deflates window back to ssthresh)
            self.cwnd = self.ssthresh
            self.state = CongestionState.CONGESTION_AVOIDANCE
            return

        if self.state == CongestionState.SLOW_START:
            # Slow start: increment by 1 MSS per ACK
            self.cwnd += 1.0
            if self.cwnd >= self.ssthresh:
                self.state = CongestionState.CONGESTION_AVOIDANCE
        elif self.state == CongestionState.CONGESTION_AVOIDANCE:
            # Congestion avoidance: Additive Increase (+1 MSS per RTT)
            # Approximated per ACK by 1.0 / cwnd
            self.cwnd += 1.0 / max(1.0, self.cwnd)

    def on_loss(self, loss_type: str, now: float) -> None:
        if loss_type == "dup_ack":
            # Multiplicative Decrease
            self.ssthresh = max(2.0, self.cwnd / 2.0)
            self.cwnd = self.ssthresh + 3.0  # Reno Fast Recovery window inflation
            self.state = CongestionState.FAST_RECOVERY
        elif loss_type == "timeout":
            # RTO: fall back to 1 MSS and Slow Start
            self.ssthresh = max(2.0, self.cwnd / 2.0)
            self.cwnd = 1.0
            self.dup_ack_count = 0
            self.state = CongestionState.SLOW_START
