'use client';

import { ProjectStats } from '@/data/projectData';
import { BarChart3, Code2, Database, Zap } from 'lucide-react';

interface StatsOverviewProps {
  stats: ProjectStats;
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  const statCards = [
    {
      label: 'Overall Progress',
      value: `${Math.round(stats.overallProgress)}%`,
      icon: BarChart3,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'API Endpoints',
      value: stats.totalEndpoints,
      icon: Zap,
      color: 'bg-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Files Created',
      value: stats.totalFiles,
      icon: Code2,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      label: 'Database Tables',
      value: stats.totalTables,
      icon: Database,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {card.value}
                </p>
              </div>
              <div className={`${card.bgColor} p-3 rounded-lg`}>
                <Icon className={`w-6 h-6 ${card.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
