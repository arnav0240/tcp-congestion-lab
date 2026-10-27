"""
High-Fidelity Deterministic Discrete-Event Network Simulation Engine.
Models:
- Multi-flow TCP senders with algorithm-controlled cwnd & pacing
- Bottleneck router with finite FIFO buffer, DropTail queuing, and configurable service rate
- Base propagation delay + jitter on forward and reverse paths
- Independent random packet loss (simulating wireless channel errors)
- Time-varying dynamic bandwidth
- Background competing cross-traffic
- High-resolution telemetry time-series logging
"""
import heapq
import random
import math
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from app.simulation import create_algorithm
from app.simulation.base import CongestionControlAlgorithm

MSS_BYTES = 1460
HEADER_BYTES = 40
PACKET_TOTAL_BYTES = MSS_BYTES + HEADER_BYTES  # 1500 bytes Ethernet MTU

@dataclass(order=True)
class Event:
    time: float
    seq: int
    event_type: str = field(compare=False)
    flow_id: int = field(compare=False)
    data: Dict[str, Any] = field(compare=False, default_factory=dict)

@dataclass
class Packet:
    packet_id: int
    flow_id: int
    seq_num: int
    size_bytes: int
    sent_time: float
    is_retransmission: bool = False

@dataclass
class FlowState:
    flow_id: int
    algorithm_name: str
    algo: CongestionControlAlgorithm
    next_seq_num: int = 1
    unacked_packets: Dict[int, Packet] = field(default_factory=dict)
    highest_ack_received: int = 0
    duplicate_ack_count: int = 0
    in_flight_packets: int = 0
    
    # Cumulative counters
    total_bytes_sent: int = 0
    total_bytes_delivered: int = 0
    total_goodput_bytes: int = 0
    total_retransmissions: int = 0
    queue_drops: int = 0
    random_drops: int = 0
    
    # Telemetry sampling
    bytes_delivered_epoch: int = 0
    goodput_bytes_epoch: int = 0
    rtt_samples_all: List[float] = field(default_factory=list)
    rtt_samples_epoch: List[float] = field(default_factory=list)
    queueing_delay_epoch: List[float] = field(default_factory=list)
    drops_queue_epoch: int = 0
    drops_random_epoch: int = 0
    retrans_epoch: int = 0
    
    # Pacing timer
    next_allowed_send_time: float = 0.0
    rto_sec: float = 1.0
    rto_timer_time: Optional[float] = None

class NetworkSimulator:
    def __init__(
        self,
        bandwidth_mbps: float = 50.0,
        base_rtt_ms: float = 40.0,
        jitter_ms: float = 0.0,
        packet_loss_rate: float = 0.0,
        queue_limit_packets: int = 50,
        duration_seconds: float = 20.0,
        flow_algorithms: Optional[List[str]] = None,
        background_traffic_ratio: float = 0.0,
        bandwidth_schedule: Optional[List[Dict[str, float]]] = None,
        random_seed: int = 42,
        sample_interval: float = 0.1,  # 100ms telemetry sampling
    ):
        self.bandwidth_bps = bandwidth_mbps * 1e6
        self.initial_bandwidth_mbps = bandwidth_mbps
        self.current_bandwidth_mbps = bandwidth_mbps
        self.base_rtt_sec = base_rtt_ms / 1000.0
        self.half_rtt_sec = self.base_rtt_sec / 2.0
        self.jitter_sec = jitter_ms / 1000.0
        self.loss_rate = packet_loss_rate
        self.queue_limit = queue_limit_packets
        self.duration = duration_seconds
        self.bg_ratio = min(0.85, max(0.0, background_traffic_ratio))
        self.bandwidth_schedule = bandwidth_schedule or []
        self.seed = random_seed
        self.sample_interval = sample_interval
        
        flow_algos = flow_algorithms if flow_algorithms else ["reno"]
        self.flow_algorithms = flow_algos
        self.rng = random.Random(random_seed)
        
        # State variables
        self.current_time = 0.0
        self.event_seq = 0
        self.event_queue: List[Event] = []
        
        # Router state
        self.router_queue: List[Packet] = []
        self.router_busy_until: float = 0.0
        self.total_queue_drops = 0
        self.total_random_drops = 0
        
        # Initialize flows
        self.flows: Dict[int, FlowState] = {}
        for fid, algo_name in enumerate(self.flow_algorithms):
            algo_instance = create_algorithm(algo_name, mss=MSS_BYTES, initial_cwnd=10.0)
            self.flows[fid] = FlowState(
                flow_id=fid,
                algorithm_name=algo_name,
                algo=algo_instance
            )
            
        # Telemetry results
        self.time_series: List[Dict[str, Any]] = []

    def _schedule_event(self, time: float, event_type: str, flow_id: int, data: Dict[str, Any] = None):
        self.event_seq += 1
        heapq.heappush(self.event_queue, Event(time=time, seq=self.event_seq, event_type=event_type, flow_id=flow_id, data=data or {}))

    def _get_link_service_time(self, packet_bytes: int) -> float:
        # Service rate accounts for background traffic stealing fraction of link capacity
        effective_bps = max(1e5, self.bandwidth_bps * (1.0 - self.bg_ratio))
        return (packet_bytes * 8.0) / effective_bps

    def _get_one_way_prop_delay(self) -> float:
        delay = self.half_rtt_sec
        if self.jitter_sec > 0:
            delay += self.rng.uniform(-self.jitter_sec, self.jitter_sec)
        return max(0.0005, delay)

    def run(self) -> Dict[str, Any]:
        """Runs the simulation to completion and returns structured results."""
        # Schedule initial packet transmissions for each flow
        for fid in self.flows:
            self._try_send_packets(fid, self.current_time)
            
        # Schedule periodic sampling ticks
        next_sample_time = self.sample_interval
        self._schedule_event(next_sample_time, "SAMPLE_TICK", -1)
        
        # Schedule bandwidth change events if any
        for change in self.bandwidth_schedule:
            t_change = change.get("time", 0.0)
            if 0 < t_change < self.duration:
                self._schedule_event(t_change, "BANDWIDTH_CHANGE", -1, data={"new_mbps": change.get("bandwidth_mbps", self.initial_bandwidth_mbps)})

        # Main Event Loop
        while self.event_queue:
            event = heapq.heappop(self.event_queue)
            self.current_time = event.time
            
            if self.current_time > self.duration:
                break
                
            if event.event_type == "SAMPLE_TICK":
                self._record_telemetry_tick()
                next_sample_time += self.sample_interval
                if next_sample_time <= self.duration:
                    self._schedule_event(next_sample_time, "SAMPLE_TICK", -1)
                    
            elif event.event_type == "BANDWIDTH_CHANGE":
                new_mbps = event.data["new_mbps"]
                self.current_bandwidth_mbps = new_mbps
                self.bandwidth_bps = new_mbps * 1e6
                
            elif event.event_type == "ROUTER_ARRIVAL":
                self._handle_router_arrival(event)
                
            elif event.event_type == "ROUTER_TRANSMIT_FINISH":
                self._handle_router_transmit_finish(event)
                
            elif event.event_type == "RECEIVER_ARRIVAL":
                self._handle_receiver_arrival(event)
                
            elif event.event_type == "SENDER_ACK":
                self._handle_sender_ack(event)
                
            elif event.event_type == "RTO_EXPIRED":
                self._handle_rto_timeout(event)

        # Finalize and compile summary statistics
        return self._compile_results()

    def _try_send_packets(self, flow_id: int, now: float):
        flow = self.flows[flow_id]
        cwnd_pkts = flow.algo.get_cwnd()
        pacing_rate_bps = flow.algo.get_pacing_rate()
        
        # Determine pacing delay between packets if algorithm paces
        pacing_interval = 0.0
        if pacing_rate_bps > 0:
            pacing_interval = (PACKET_TOTAL_BYTES * 8.0) / pacing_rate_bps

        while flow.in_flight_packets < math.floor(cwnd_pkts):
            send_time = max(now, flow.next_allowed_send_time)
            if send_time > self.duration:
                break

            pkt = Packet(
                packet_id=self.event_seq + 1,
                flow_id=flow_id,
                seq_num=flow.next_seq_num,
                size_bytes=PACKET_TOTAL_BYTES,
                sent_time=send_time,
                is_retransmission=False
            )
            flow.unacked_packets[pkt.seq_num] = pkt
            flow.next_seq_num += 1
            flow.in_flight_packets += 1
            flow.total_bytes_sent += pkt.size_bytes
            
            # Update NewReno highest sent if applicable
            if hasattr(flow.algo, "update_highest_sent"):
                flow.algo.update_highest_sent(pkt.seq_num)

            # Schedule arrival at router after forward propagation delay
            forward_delay = self._get_one_way_prop_delay()
            self._schedule_event(send_time + forward_delay, "ROUTER_ARRIVAL", flow_id, data={"packet": pkt})
            
            # Start/update RTO timer
            if flow.rto_timer_time is None:
                flow.rto_timer_time = send_time + flow.rto_sec
                self._schedule_event(flow.rto_timer_time, "RTO_EXPIRED", flow_id, data={"seq_num": pkt.seq_num})

            # Update next allowed send time for pacing
            flow.next_allowed_send_time = send_time + pacing_interval

    def _handle_router_arrival(self, event: Event):
        pkt: Packet = event.data["packet"]
        flow = self.flows[pkt.flow_id]
        
        # 1. Independent Random Channel Loss (e.g. Wireless bit error)
        if self.loss_rate > 0 and self.rng.random() < self.loss_rate:
            flow.random_drops += 1
            flow.drops_random_epoch += 1
            self.total_random_drops += 1
            return  # Packet dropped on link

        # 2. Check Router Queue Capacity (DropTail)
        if len(self.router_queue) >= self.queue_limit:
            # Buffer overflow: Queue drop
            flow.queue_drops += 1
            flow.drops_queue_epoch += 1
            self.total_queue_drops += 1
            return  # Dropped due to bufferbloat/congestion

        # 3. Enqueue Packet
        arrival_time_at_queue = self.current_time
        pkt_data = {"packet": pkt, "queue_arrival_time": arrival_time_at_queue}
        self.router_queue.append(pkt_data)
        
        # 4. If router transmitter is idle, begin servicing immediately
        if self.current_time >= self.router_busy_until and len(self.router_queue) == 1:
            self._service_next_in_queue()

    def _service_next_in_queue(self):
        if not self.router_queue:
            return
            
        next_item = self.router_queue[0]
        pkt: Packet = next_item["packet"]
        queue_arrival = next_item["queue_arrival_time"]
        queueing_delay = max(0.0, self.current_time - queue_arrival)
        
        service_time = self._get_link_service_time(pkt.size_bytes)
        finish_time = self.current_time + service_time
        self.router_busy_until = finish_time
        
        self._schedule_event(finish_time, "ROUTER_TRANSMIT_FINISH", pkt.flow_id, data={
            "packet": pkt,
            "queueing_delay": queueing_delay
        })

    def _handle_router_transmit_finish(self, event: Event):
        # Remove head of queue
        if self.router_queue:
            self.router_queue.pop(0)
            
        pkt: Packet = event.data["packet"]
        queueing_delay = event.data["queueing_delay"]
        
        # Packet departs bottleneck and travels reverse link to receiver
        reverse_prop_delay = self._get_one_way_prop_delay()
        arrival_at_receiver = self.current_time + reverse_prop_delay
        
        self._schedule_event(arrival_at_receiver, "RECEIVER_ARRIVAL", pkt.flow_id, data={
            "packet": pkt,
            "queueing_delay": queueing_delay
        })
        
        # Router can now service next queued packet
        if self.router_queue:
            self._service_next_in_queue()

    def _handle_receiver_arrival(self, event: Event):
        pkt: Packet = event.data["packet"]
        queueing_delay = event.data["queueing_delay"]
        flow = self.flows[pkt.flow_id]
        
        flow.total_bytes_delivered += pkt.size_bytes
        flow.bytes_delivered_epoch += pkt.size_bytes
        if not pkt.is_retransmission:
            flow.total_goodput_bytes += MSS_BYTES
            flow.goodput_bytes_epoch += MSS_BYTES

        # Generate ACK back to sender
        ack_prop_delay = self._get_one_way_prop_delay()
        ack_arrival_at_sender = self.current_time + ack_prop_delay
        
        self._schedule_event(ack_arrival_at_sender, "SENDER_ACK", pkt.flow_id, data={
            "seq_num": pkt.seq_num,
            "sent_time": pkt.sent_time,
            "queueing_delay": queueing_delay,
            "is_retransmission": pkt.is_retransmission
        })

    def _handle_sender_ack(self, event: Event):
        flow = self.flows[event.flow_id]
        ack_seq = event.data["seq_num"]
        sent_time = event.data["sent_time"]
        queueing_delay = event.data["queueing_delay"]
        is_retx = event.data.get("is_retransmission", False)
        
        # Karn's Algorithm (RFC 6298): Ignore RTT samples for retransmitted packets
        if not is_retx:
            rtt_sample = max(0.001, self.current_time - sent_time)
            flow.rtt_samples_all.append(rtt_sample)
            flow.rtt_samples_epoch.append(rtt_sample)
            flow.queueing_delay_epoch.append(queueing_delay)
        else:
            rtt_sample = flow.algo.rtt
        
        # Check if this ACK is in-order or duplicate
        if ack_seq > flow.highest_ack_received:
            # New ACK
            bytes_acked = (ack_seq - flow.highest_ack_received) * MSS_BYTES
            flow.highest_ack_received = ack_seq
            flow.duplicate_ack_count = 0
            
            # Remove acknowledged packets from unacked buffer
            to_remove = [s for s in flow.unacked_packets if s <= ack_seq]
            for s in to_remove:
                del flow.unacked_packets[s]
            flow.in_flight_packets = len(flow.unacked_packets)
            
            # Notify Congestion Control Algorithm
            flow.algo.on_ack(
                ack_num=ack_seq,
                bytes_acked=bytes_acked,
                rtt_sample=rtt_sample,
                now=self.current_time,
                is_duplicate=False
            )
            
            # Reset RTO timer
            flow.rto_timer_time = None
            if flow.unacked_packets:
                oldest_pkt = min(flow.unacked_packets.values(), key=lambda p: p.sent_time)
                flow.rto_timer_time = self.current_time + flow.rto_sec
                self._schedule_event(flow.rto_timer_time, "RTO_EXPIRED", flow.flow_id, data={"seq_num": oldest_pkt.seq_num})
                
        else:
            # Duplicate ACK
            flow.duplicate_ack_count += 1
            flow.algo.on_ack(
                ack_num=ack_seq,
                bytes_acked=0,
                rtt_sample=rtt_sample,
                now=self.current_time,
                is_duplicate=True
            )
            if flow.duplicate_ack_count == 3:
                # 3 Duplicate ACKs -> Fast Retransmit earliest missing packet
                self._trigger_fast_retransmit(flow)

        # Send new packets if cwnd permits
        self._try_send_packets(flow.flow_id, self.current_time)

    def _trigger_fast_retransmit(self, flow: FlowState):
        if not flow.unacked_packets:
            return
        earliest_seq = min(flow.unacked_packets.keys())
        old_pkt = flow.unacked_packets[earliest_seq]
        
        flow.total_retransmissions += 1
        flow.retrans_epoch += 1
        
        retx_pkt = Packet(
            packet_id=self.event_seq + 1,
            flow_id=flow.flow_id,
            seq_num=earliest_seq,
            size_bytes=old_pkt.size_bytes,
            sent_time=self.current_time,
            is_retransmission=True
        )
        flow.unacked_packets[earliest_seq] = retx_pkt
        
        forward_delay = self._get_one_way_prop_delay()
        self._schedule_event(self.current_time + forward_delay, "ROUTER_ARRIVAL", flow.flow_id, data={"packet": retx_pkt})

    def _handle_rto_timeout(self, event: Event):
        flow = self.flows[event.flow_id]
        target_seq = event.data["seq_num"]
        
        if target_seq in flow.unacked_packets:
            # Retransmission Timeout confirmed!
            flow.algo.on_loss("timeout", self.current_time)
            flow.total_retransmissions += 1
            flow.retrans_epoch += 1
            flow.rto_sec = min(60.0, flow.rto_sec * 2.0)  # Exponential backoff
            
            # Retransmit earliest packet
            earliest_seq = min(flow.unacked_packets.keys())
            old_pkt = flow.unacked_packets[earliest_seq]
            retx_pkt = Packet(
                packet_id=self.event_seq + 1,
                flow_id=flow.flow_id,
                seq_num=earliest_seq,
                size_bytes=old_pkt.size_bytes,
                sent_time=self.current_time,
                is_retransmission=True
            )
            flow.unacked_packets[earliest_seq] = retx_pkt
            forward_delay = self._get_one_way_prop_delay()
            self._schedule_event(self.current_time + forward_delay, "ROUTER_ARRIVAL", flow.flow_id, data={"packet": retx_pkt})
            
            # Reschedule RTO
            flow.rto_timer_time = self.current_time + flow.rto_sec
            self._schedule_event(flow.rto_timer_time, "RTO_EXPIRED", flow.flow_id, data={"seq_num": earliest_seq})

    def _record_telemetry_tick(self):
        point: Dict[str, Any] = {
            "timestamp": round(self.current_time, 2),
            "router_queue_packets": len(self.router_queue),
            "router_queue_pct": round((len(self.router_queue) / max(1, self.queue_limit)) * 100, 1),
            "bottleneck_bandwidth_mbps": self.current_bandwidth_mbps,
            "flows": {}
        }
        
        total_delivered_epoch = 0
        for fid, flow in self.flows.items():
            t_mbps = (flow.bytes_delivered_epoch * 8.0) / (self.sample_interval * 1e6)
            g_mbps = (flow.goodput_bytes_epoch * 8.0) / (self.sample_interval * 1e6)
            avg_rtt = (sum(flow.rtt_samples_epoch) / len(flow.rtt_samples_epoch) * 1000.0) if flow.rtt_samples_epoch else (self.base_rtt_sec * 1000.0)
            avg_qd = (sum(flow.queueing_delay_epoch) / len(flow.queueing_delay_epoch) * 1000.0) if flow.queueing_delay_epoch else 0.0
            pacing_mbps = flow.algo.get_pacing_rate() / 1e6
            
            point["flows"][fid] = {
                "algorithm": flow.algorithm_name,
                "throughput_mbps": round(t_mbps, 3),
                "goodput_mbps": round(g_mbps, 3),
                "cwnd": round(flow.algo.get_cwnd(), 2),
                "pacing_rate_mbps": round(pacing_mbps, 3),
                "rtt_ms": round(avg_rtt, 2),
                "queueing_delay_ms": round(avg_qd, 2),
                "in_flight": flow.in_flight_packets,
                "drops_queue": flow.drops_queue_epoch,
                "drops_random": flow.drops_random_epoch,
                "retransmissions": flow.retrans_epoch,
            }
            total_delivered_epoch += flow.bytes_delivered_epoch
            
            # Reset epoch counters
            flow.bytes_delivered_epoch = 0
            flow.goodput_bytes_epoch = 0
            flow.rtt_samples_epoch = []
            flow.queueing_delay_epoch = []
            flow.drops_queue_epoch = 0
            flow.drops_random_epoch = 0
            flow.retrans_epoch = 0
            
        total_thru_mbps = (total_delivered_epoch * 8.0) / (self.sample_interval * 1e6)
        point["total_throughput_mbps"] = round(total_thru_mbps, 3)
        utilization = (total_thru_mbps / max(0.1, self.current_bandwidth_mbps)) * 100.0
        point["utilization_pct"] = round(min(100.0, utilization), 1)
        
        self.time_series.append(point)

    def _compile_results(self) -> Dict[str, Any]:
        """Calculates final aggregate metrics, Jain's fairness index, tail latency, and loss statistics."""
        flow_summaries = {}
        throughputs = []
        goodputs = []
        
        for fid, flow in self.flows.items():
            duration = max(0.1, self.duration)
            avg_throughput_mbps = (flow.total_bytes_delivered * 8.0) / (duration * 1e6)
            avg_goodput_mbps = (flow.total_goodput_bytes * 8.0) / (duration * 1e6)
            
            # RTT calculations
            all_rtts_ms = [r * 1000.0 for r in flow.rtt_samples_all] if flow.rtt_samples_all else [self.base_rtt_sec * 1000.0]
            all_rtts_ms.sort()
            avg_rtt_ms = sum(all_rtts_ms) / len(all_rtts_ms)
            p95_idx = int(0.95 * len(all_rtts_ms))
            p95_rtt_ms = all_rtts_ms[min(p95_idx, len(all_rtts_ms) - 1)]
            
            total_packets_sent = max(1, flow.total_bytes_sent // PACKET_TOTAL_BYTES)
            total_drops = flow.queue_drops + flow.random_drops
            loss_rate_pct = (total_drops / total_packets_sent) * 100.0
            
            throughputs.append(avg_throughput_mbps)
            goodputs.append(avg_goodput_mbps)
            
            flow_summaries[fid] = {
                "flow_id": fid,
                "algorithm": flow.algorithm_name,
                "throughput_mbps": round(avg_throughput_mbps, 3),
                "goodput_mbps": round(avg_goodput_mbps, 3),
                "avg_rtt_ms": round(avg_rtt_ms, 2),
                "p95_rtt_ms": round(p95_rtt_ms, 2),
                "queue_drops": flow.queue_drops,
                "random_drops": flow.random_drops,
                "total_drops": total_drops,
                "loss_rate_pct": round(loss_rate_pct, 3),
                "retransmissions": flow.total_retransmissions,
                "final_cwnd": round(flow.algo.get_cwnd(), 2),
                "utilization_pct": round(min(100.0, (avg_throughput_mbps / max(0.1, self.initial_bandwidth_mbps)) * 100.0), 2)
            }
            
        # Calculate Jain's Fairness Index: J = (sum x_i)^2 / (N * sum (x_i^2))
        n = len(throughputs)
        if n > 1:
            sum_x = sum(throughputs)
            sum_sq_x = sum(x * x for x in throughputs)
            if sum_sq_x > 0:
                jain_fairness = (sum_x * sum_x) / (n * sum_sq_x)
            else:
                jain_fairness = 1.0
        else:
            jain_fairness = None  # Not applicable for single flow

        total_system_throughput = sum(throughputs)
        total_system_goodput = sum(goodputs)
        bottleneck_utilization = (total_system_throughput / max(0.1, self.initial_bandwidth_mbps)) * 100.0
        
        return {
            "execution_mode": "educational_sim",
            "simulator_name": "Antigravity Discrete-Event Network Simulator",
            "seed": self.seed,
            "duration_sec": self.duration,
            "flow_count": len(self.flows),
            "jain_fairness_index": round(jain_fairness, 4) if jain_fairness is not None else None,
            "total_throughput_mbps": round(total_system_throughput, 3),
            "total_goodput_mbps": round(total_system_goodput, 3),
            "bottleneck_utilization_pct": round(min(100.0, bottleneck_utilization), 2),
            "flows": flow_summaries,
            "time_series": self.time_series
        }
