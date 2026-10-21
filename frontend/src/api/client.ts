import {
  AlgorithmInfo,
  ScenarioPreset,
  ExperimentCreateParams,
  ExperimentDetail,
  ExperimentSummaryItem,
  TimeSeriesPoint,
  SystemHealth
} from '../types/api';

const API_BASE = '/api/v1';

export async function fetchHealth(): Promise<SystemHealth> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to fetch system health status');
  return res.json();
}

export async function fetchAlgorithms(): Promise<AlgorithmInfo[]> {
  const res = await fetch(`${API_BASE}/algorithms`);
  if (!res.ok) throw new Error('Failed to fetch algorithms');
  const data = await res.json();
  return data.algorithms;
}

export async function fetchScenarios(): Promise<ScenarioPreset[]> {
  const res = await fetch(`${API_BASE}/scenarios`);
  if (!res.ok) throw new Error('Failed to fetch scenario presets');
  const data = await res.json();
  return data.scenarios;
}

export async function createExperiment(params: ExperimentCreateParams): Promise<ExperimentDetail> {
  const res = await fetch(`${API_BASE}/experiments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown validation error' }));
    throw new Error(err.detail || 'Failed to start experiment');
  }
  return res.json();
}

export async function fetchExperiments(scenarioId?: string): Promise<ExperimentSummaryItem[]> {
  const url = scenarioId ? `${API_BASE}/experiments?scenario_id=${encodeURIComponent(scenarioId)}` : `${API_BASE}/experiments`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch experiments list');
  return res.json();
}

export async function fetchExperimentDetail(id: string): Promise<ExperimentDetail> {
  const res = await fetch(`${API_BASE}/experiments/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch experiment ${id}`);
  return res.json();
}

export async function fetchExperimentTimeSeries(id: string): Promise<TimeSeriesPoint[]> {
  const res = await fetch(`${API_BASE}/experiments/${id}/timeseries`);
  if (!res.ok) throw new Error(`Failed to fetch time series for experiment ${id}`);
  const data = await res.json();
  return data.points;
}

export async function rerunExperiment(id: string): Promise<ExperimentDetail> {
  const res = await fetch(`${API_BASE}/experiments/${id}/rerun`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to rerun experiment ${id}`);
  return res.json();
}

export async function deleteExperiment(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/experiments/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete experiment ${id}`);
}

export async function compareExperiments(experimentIds: string[], metric: string = 'goodput_mbps') {
  const res = await fetch(`${API_BASE}/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ experiment_ids: experimentIds, metric }),
  });
  if (!res.ok) throw new Error('Failed to compare experiments');
  return res.json();
}

export function getExportUrl(id: string, format: 'json' | 'csv_metrics' | 'csv_timeseries' | 'markdown'): string {
  return `${API_BASE}/experiments/${id}/export?format=${format}`;
}
