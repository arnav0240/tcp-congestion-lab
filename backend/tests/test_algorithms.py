"""
Tests for TCP Reno, NewReno, CUBIC, and BBR congestion control implementations.
"""
import pytest
from app.simulation import create_algorithm
from app.simulation.base import CongestionState
from app.simulation.reno import TCPReno
from app.simulation.newreno import TCPNewReno
from app.simulation.cubic import TCPCubic
from app.simulation.bbr import TCPBbr

def test_reno_slow_start_and_avoidance():
    reno = TCPReno(mss_bytes=1460, initial_cwnd=10.0)
    assert reno.cwnd == 10.0
    assert reno.state == CongestionState.SLOW_START

    # Receive ACKs in slow start
    for i in range(5):
        reno.on_ack(ack_num=i*1460, bytes_acked=1460, rtt_sample=0.04, now=i*0.04)
    assert reno.cwnd == 15.0

    # Trigger Fast Retransmit via 3 duplicate ACKs
    for _ in range(3):
        reno.on_ack(ack_num=5*1460, bytes_acked=0, rtt_sample=0.04, now=0.25, is_duplicate=True)
    assert reno.state == CongestionState.FAST_RECOVERY
    assert reno.ssthresh == max(2.0, 15.0 / 2.0)

    # Next full ACK exits fast recovery
    reno.on_ack(ack_num=6*1460, bytes_acked=1460, rtt_sample=0.04, now=0.30, is_duplicate=False)
    assert reno.state == CongestionState.CONGESTION_AVOIDANCE
    assert reno.cwnd == reno.ssthresh

def test_reno_timeout_resets_to_one():
    reno = TCPReno(initial_cwnd=32.0)
    reno.on_loss("timeout", now=1.0)
    assert reno.cwnd == 1.0
    assert reno.ssthresh == 16.0
    assert reno.state == CongestionState.SLOW_START

def test_newreno_partial_ack_recovery():
    newreno = TCPNewReno(mss_bytes=1460, initial_cwnd=20.0)
    newreno.update_highest_sent(100 * 1460)

    # Trigger loss on dupacks
    for _ in range(3):
        newreno.on_ack(ack_num=50*1460, bytes_acked=0, rtt_sample=0.04, now=0.1, is_duplicate=True)
    assert newreno.state == CongestionState.FAST_RECOVERY
    assert newreno.recover_seq == 100 * 1460

    # Receive Partial ACK (acknowledges packet 60, which is < recover_seq 100)
    # NewReno must NOT exit Fast Recovery on partial ACK
    newreno.on_ack(ack_num=60*1460, bytes_acked=10*1460, rtt_sample=0.04, now=0.15, is_duplicate=False)
    assert newreno.state == CongestionState.FAST_RECOVERY

    # Receive Full ACK (acknowledges >= recover_seq 100)
    newreno.on_ack(ack_num=101*1460, bytes_acked=41*1460, rtt_sample=0.04, now=0.20, is_duplicate=False)
    assert newreno.state == CongestionState.CONGESTION_AVOIDANCE

def test_cubic_window_growth_and_decrease():
    cubic = TCPCubic(initial_cwnd=30.0)
    # Trigger congestion event
    cubic.on_loss("dup_ack", now=1.0)
    assert cubic.state == CongestionState.CONGESTION_AVOIDANCE
    assert round(cubic.cwnd, 2) == round(30.0 * 0.7, 2)
    assert cubic.w_max == 30.0

    # Advance time and send ACKs
    for t in [1.5, 2.0, 3.0]:
        cubic.on_ack(ack_num=1000, bytes_acked=1460, rtt_sample=0.05, now=t)
    assert cubic.cwnd > 0

def test_bbr_model_and_pacing():
    bbr = TCPBbr(initial_cwnd=10.0)
    assert bbr.state == CongestionState.STARTUP

    # Deliver high-rate ACKs
    for i in range(20):
        bbr.on_ack(ack_num=i*1460, bytes_acked=1460, rtt_sample=0.04, now=i*0.04)
        
    assert bbr.btl_bw > 0
    assert bbr.min_rtt > 0
    assert bbr.pacing_rate_bps > 0
    # On random mild loss, BBR does not drop cwnd to 1
    bbr.on_loss("dup_ack", now=1.0)
    assert bbr.cwnd >= 4.0
