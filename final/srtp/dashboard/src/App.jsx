import React, { useState } from 'react';
import AppLayout from './components/AppLayout';
import DataOverview from './pages/DataOverview';
import FeatureExploration from './pages/FeatureExploration';
import ModelAnalysis from './pages/ModelAnalysis';

const TABS = [
  { key: 'overview', label: 'Data Overview', icon: 'dashboard', component: DataOverview },
  { key: 'exploration', label: 'Feature Exploration', icon: 'analytics', component: FeatureExploration },
  { key: 'analysis', label: 'Model Analysis', icon: 'query_stats', component: ModelAnalysis },
];

const TAB_LABELS = {
  overview: '数据概览',
  exploration: '特征探索',
  analysis: '模型分析',
};

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');

  const ActiveComponent = TABS.find((t) => t.key === activeTab)?.component;

  return (
    <AppLayout
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      pageTitle={TAB_LABELS[activeTab]}
    >
      {ActiveComponent && <ActiveComponent />}
    </AppLayout>
  );
}
