export interface AlgorithmInfo {
  id: string;
  name: string;
  standard: string;
  family: string;
  window_growth: string;
  congestion_signal: string;
  loss_reduction: string;
  best_for: string;
  weakness: string;
  color: string;
}

export interface ScenarioPreset {
  id: string;
  name: string;
  description: string;
  bandwidth_mbps: float;
  base_rtt_ms: float;
  jitter_ms: float;
  packet_loss_rate: float;
  queue_limit_packets: number;
  duration_seconds: float;
  flow_count: number;
  background_traffic_ratio: float;
  bandwidth_schedule: Array<{ time: number; bandwidth_mbps: number }>;
  research_question: string;
}

export type float = number;

export interface BandwidthChangePoint {
  time: number;
  bandwidth_mbps: number;
}

export interface ExperimentCreateParams {
  title?: string;
  scenario_id?: string;
  algorithms: string[];
  bandwidth_mbps: number;
  base_rtt_ms: number;
  jitter_ms: number;
  packet_loss_rate: number;
  queue_limit_packets: number;
  duration_seconds: number;
  flow_count: number;
  background_traffic_ratio: number;
  seed: number;
  repetitions: number;
  bandwidth_schedule?: BandwidthChangePoint[];
}

export interface AlgorithmMetricSummary {
  algorithm_id: string;
  trials_count: number;
  mean_throughput_mbps: number;
  std_throughput_mbps: number;
  min_throughput_mbps: number;
  max_throughput_mbps: number;
  mean_goodput_mbps: number;
  std_goodput_mbps: number;
  min_goodput_mbps: number;
  max_goodput_mbps: number;
  mean_avg_rtt_ms: number;
  std_avg_rtt_ms: number;
  mean_p95_rtt_ms: number;
  mean_total_drops: number;
  mean_retransmissions: number;
  mean_utilization_pct: number;
  mean_jain_fairness: number | null;
}

export interface AlgorithmRunDetail {
  id: string;
  algorithm_id: string;
  flow_id: number;
  trial_index: number;
  throughput_mbps: number;
  goodput_mbps: number;
  avg_rtt_ms: number;
  p95_rtt_ms: number;
  queue_drops: number;
  random_drops: number;
  total_drops: number;
  retransmissions: number;
  loss_rate_pct: number;
  utilization_pct: number;
}

export interface ExperimentDetail {
  id: string;
  created_at: string;
  title: string;
  scenario_id: string;
  scenario_name: string;
  execution_mode: 'educational_sim' | 'ns3';
  simulator_name: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  error_message?: string | null;
  bandwidth_mbps: number;
  base_rtt_ms: number;
  jitter_ms: number;
  packet_loss_rate: number;
  queue_limit_packets: number;
  duration_seconds: number;
  flow_count: number;
  background_traffic_ratio: number;
  seed: number;
  repetitions: number;
  algorithms: string[];
  metrics_summary: Record<string, AlgorithmMetricSummary>;
  automated_interpretation?: string;
  runs: AlgorithmRunDetail[];
}

export interface ExperimentSummaryItem {
  id: string;
  created_at: string;
  title: string;
  scenario_id: string;
  scenario_name: string;
  execution_mode: string;
  status: string;
  bandwidth_mbps: number;
  base_rtt_ms: number;
  packet_loss_rate: number;
  queue_limit_packets: number;
  duration_seconds: number;
  repetitions: number;
  algorithms: string[];
  total_throughput_mbps?: number;
  jain_fairness_index?: number | null;
}

export interface FlowTelemetry {
  algorithm: string;
  throughput_mbps: number;
  goodput_mbps: number;
  cwnd: number;
  pacing_rate_mbps: number;
  rtt_ms: number;
  queueing_delay_ms: number;
  in_flight: number;
  drops_queue: number;
  drops_random: number;
  retransmissions: number;
}

export interface TimeSeriesPoint {
  timestamp: number;
  router_queue_packets: number;
  router_queue_pct: number;
  bottleneck_bandwidth_mbps: number;
  total_throughput_mbps: number;
  utilization_pct: number;
  flows: Record<string, FlowTelemetry>;
}

export interface SystemHealth {
  status: string;
  database_connected: boolean;
  engine: {
    ns3_available: boolean;
    executable_path: string | null;
    version: string | null;
    fallback_active: boolean;
    active_mode: string;
    active_mode_title: string;
    message: string;
  };
  supported_algorithms: string[];
  api_version: string;
}
