'use client';

import { useEffect, useState } from 'react';
import { projectData, calculateProjectStats, knownIssues } from '@/data/projectData';
import StatsOverview from '@/components/StatsOverview';
import PhaseTimeline from '@/components/PhaseTimeline';
import ProgressChart from '@/components/ProgressChart';
import IssueTracker from '@/components/IssueTracker';
import ServiceHealth from '@/components/ServiceHealth';
import RecentActivity from '@/components/RecentActivity';
import { RefreshCw } from 'lucide-react';

export default function Home() {
  const [stats, setStats] = useState(calculateProjectStats());
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setStats(calculateProjectStats());
      setLastUpdate(new Date());
      setIsRefreshing(false);
    }, 500);
  };

  useEffect(() => {
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      refreshData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                RT Apps Toyota
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Digital RT-Muban Platform - Project Dashboard
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Last Updated</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {lastUpdate.toLocaleTimeString('id-ID')}
                </p>
              </div>
              <button
                onClick={refreshData}
                disabled={isRefreshing}
                className="p-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <StatsOverview stats={stats} />

        {/* Progress Chart */}
        <div className="mt-8">
          <ProgressChart phases={projectData} />
        </div>

        {/* Phase Timeline */}
        <div className="mt-8">
          <PhaseTimeline phases={projectData} />
        </div>

        {/* Two Column Layout */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Service Health */}
          <ServiceHealth />

          {/* Issue Tracker */}
          <IssueTracker issues={knownIssues} />
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <RecentActivity />
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>© 2026 RT Apps Toyota - Digital RT-Muban Platform</p>
            <p className="mt-1">
              Built with Next.js 14, TypeScript, and Tailwind CSS
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
