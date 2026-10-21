"""
TCP NewReno implementation based on RFC 6582.
Implements the Partial ACK handling in Fast Recovery to prevent retransmission timeouts
when multiple packets are lost in a single window of data.
"""
from app.simulation.base import CongestionControlAlgorithm, CongestionState

class TCPNewReno(CongestionControlAlgorithm):
    def __init__(self, mss_bytes: int = 1460, initial_cwnd: float = 10.0):
        super().__init__(mss_bytes, initial_cwnd)
        self.dup_ack_count = 0
        self.recover_seq = 0
        self.highest_seq_sent = 0

    def update_highest_sent(self, seq: int) -> None:
        if seq > self.highest_seq_sent:
            self.highest_seq_sent = seq

    def on_ack(self, ack_num: int, bytes_acked: int, rtt_sample: float, now: float, is_duplicate: bool = False, is_partial: bool = False) -> None:
        if rtt_sample > 0:
            self.rtt = 0.875 * self.rtt + 0.125 * rtt_sample
            if self.min_rtt == 0 or rtt_sample < self.min_rtt:
                self.min_rtt = rtt_sample

        if is_duplicate:
            self.dup_ack_count += 1
            if self.state == CongestionState.FAST_RECOVERY:
                self.cwnd += 1.0
            elif self.dup_ack_count >= 3:
                self.on_loss("dup_ack", now)
            return

        self.dup_ack_count = 0

        if self.state == CongestionState.FAST_RECOVERY:
            # Check if this is a Full ACK (acknowledges all data up to recover_seq)
            if ack_num >= self.recover_seq:
                # Full ACK received: exit fast recovery
                self.cwnd = self.ssthresh
                self.state = CongestionState.CONGESTION_AVOIDANCE
            else:
                # Partial ACK (RFC 6582): acknowledges some data, but not all up to recover_seq
                # Retransmit first unacknowledged segment immediately and stay in Fast Recovery!
                # Deflate cwnd by amount of data acked (in packets) and add 1 MSS
                packets_acked = max(1.0, bytes_acked / self.mss)
                self.cwnd = max(self.ssthresh, self.cwnd - packets_acked + 1.0)
                # Note: We stay in FAST_RECOVERY state without resetting cwnd to 1!
                return

        if self.state == CongestionState.SLOW_START:
            self.cwnd += 1.0
            if self.cwnd >= self.ssthresh:
                self.state = CongestionState.CONGESTION_AVOIDANCE
        elif self.state == CongestionState.CONGESTION_AVOIDANCE:
            self.cwnd += 1.0 / max(1.0, self.cwnd)

    def on_loss(self, loss_type: str, now: float) -> None:
        if loss_type == "dup_ack":
            self.ssthresh = max(2.0, self.cwnd / 2.0)
            self.cwnd = self.ssthresh + 3.0
            self.state = CongestionState.FAST_RECOVERY
            self.recover_seq = self.highest_seq_sent
        elif loss_type == "timeout":
            self.ssthresh = max(2.0, self.cwnd / 2.0)
            self.cwnd = 1.0
            self.dup_ack_count = 0
            self.state = CongestionState.SLOW_START
            self.recover_seq = self.highest_seq_sent
