import React, { useState, useEffect } from 'react';
import { TopNav } from './components/TopNav';
import { Sidebar, NavTab } from './components/Sidebar';
import { GlossaryModal } from './components/GlossaryModal';
import { DashboardPage } from './pages/DashboardPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { ComparePage } from './pages/ComparePage';
import { TimeSeriesPage } from './pages/TimeSeriesPage';
import { HistoryPage } from './pages/HistoryPage';
import { ScenariosPage } from './pages/ScenariosPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { DocumentationPage } from './pages/DocumentationPage';

import {
  SystemHealth,
  ScenarioPreset,
  ExperimentSummaryItem,
  ExperimentDetail
} from './types/api';
import {
  fetchHealth,
  fetchScenarios,
  fetchExperiments,
  fetchExperimentDetail,
  rerunExperiment,
  deleteExperiment
} from './api/client';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioPreset[]>([]);
  const [experiments, setExperiments] = useState<ExperimentSummaryItem[]>([]);
  const [currentExperiment, setCurrentExperiment] = useState<ExperimentDetail | null>(null);

  // Inter-tab passing state
  const [selectedScenarioForSimulator, setSelectedScenarioForSimulator] = useState<string | undefined>(undefined);
  const [isVivaOpen, setIsVivaOpen] = useState<boolean>(false);

  // Initial load
  const loadInitialData = async () => {
    try {
      const [h, sc, exps] = await Promise.all([
        fetchHealth().catch(() => null),
        fetchScenarios().catch(() => []),
        fetchExperiments().catch(() => []),
      ]);

      if (h) setHealth(h);
      if (sc.length > 0) setScenarios(sc);
      if (exps.length > 0) {
        setExperiments(exps);
        // Load detail of the latest experiment
        fetchExperimentDetail(exps[0].id)
          .then((d) => setCurrentExperiment(d))
          .catch(() => {});
      }
    } catch (err) {
      console.error('Initial data loading error:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleSelectExperimentById = async (id: string) => {
    try {
      const d = await fetchExperimentDetail(id);
      setCurrentExperiment(d);
    } catch (err) {
      console.error('Failed to load experiment detail:', err);
    }
  };

  const handleExperimentComplete = async (newExp: ExperimentDetail) => {
    setCurrentExperiment(newExp);
    // Refresh experiment summary list
    const updated = await fetchExperiments().catch(() => []);
    setExperiments(updated);
  };

  const handleRerun = async (id: string) => {
    try {
      const newExp = await rerunExperiment(id);
      setCurrentExperiment(newExp);
      const updated = await fetchExperiments().catch(() => []);
      setExperiments(updated);
      setCurrentTab('compare');
    } catch (err) {
      alert(`Failed to rerun: ${err}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteExperiment(id);
      const updated = await fetchExperiments().catch(() => []);
      setExperiments(updated);
      if (currentExperiment?.id === id) {
        if (updated.length > 0) {
          handleSelectExperimentById(updated[0].id);
        } else {
          setCurrentExperiment(null);
        }
      }
    } catch (err) {
      alert(`Failed to delete: ${err}`);
    }
  };

  const handleNavigate = (tab: NavTab, expId?: string) => {
    if (expId) {
      handleSelectExperimentById(expId);
    }
    setCurrentTab(tab);
  };

  const handleLoadScenarioIntoSimulator = (scenarioId: string) => {
    setSelectedScenarioForSimulator(scenarioId);
    setCurrentTab('simulator');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#080d1a] text-slate-100 selection:bg-cyan-500 selection:text-white">
      {/* Persistent Top Navigation Bar */}
      <TopNav
        health={health}
        onRefreshHealth={loadInitialData}
        onOpenViva={() => setIsVivaOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Persistent Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          experimentCount={experiments.length}
        />

        {/* Dynamic Main Workspace Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950/40">
          {currentTab === 'dashboard' && (
            <DashboardPage
              health={health}
              experiments={experiments}
              latestExperiment={currentExperiment}
              onNavigate={handleNavigate}
            />
          )}

          {currentTab === 'simulator' && (
            <SimulatorPage
              scenarios={scenarios}
              initialScenarioId={selectedScenarioForSimulator}
              onExperimentComplete={handleExperimentComplete}
              onNavigate={handleNavigate}
            />
          )}

          {currentTab === 'compare' && (
            <ComparePage
              currentExperiment={currentExperiment}
              allExperiments={experiments}
              onSelectExperiment={handleSelectExperimentById}
              onNavigate={handleNavigate}
            />
          )}

          {currentTab === 'timeseries' && (
            <TimeSeriesPage
              currentExperiment={currentExperiment}
              allExperiments={experiments}
              onSelectExperiment={handleSelectExperimentById}
              onNavigate={handleNavigate}
            />
          )}

          {currentTab === 'history' && (
            <HistoryPage
              experiments={experiments}
              onSelectExperiment={handleSelectExperimentById}
              onRerunExperiment={handleRerun}
              onDeleteExperiment={handleDelete}
              onNavigate={handleNavigate}
            />
          )}

          {currentTab === 'scenarios' && (
            <ScenariosPage
              scenarios={scenarios}
              onLoadScenario={handleLoadScenarioIntoSimulator}
            />
          )}

          {currentTab === 'methodology' && <MethodologyPage />}

          {currentTab === 'docs' && <DocumentationPage />}
        </main>
      </div>

      {/* Viva Q&A Modal */}
      <GlossaryModal isOpen={isVivaOpen} onClose={() => setIsVivaOpen(false)} />
    </div>
  );
}

export default App;
