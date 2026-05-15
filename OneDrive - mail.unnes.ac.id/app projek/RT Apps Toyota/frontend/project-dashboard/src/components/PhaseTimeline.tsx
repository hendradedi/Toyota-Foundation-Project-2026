'use client';

import { ProjectPhase } from '@/data/projectData';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface PhaseTimelineProps {
  phases: ProjectPhase[];
}

export default function PhaseTimeline({ phases }: PhaseTimelineProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case 'in-progress':
        return <Clock className="w-6 h-6 text-blue-500 animate-pulse" />;
      case 'blocked':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Clock className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'in-progress':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'blocked':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Project Timeline</h2>
      
      <div className="space-y-4">
        {phases.map((phase, index) => (
          <div key={phase.id} className="flex gap-4">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              {getStatusIcon(phase.status)}
              {index < phases.length - 1 && (
                <div className="w-1 h-16 bg-gray-300 dark:bg-gray-600 mt-2" />
              )}
            </div>

            {/* Phase card */}
            <div className={`flex-1 p-4 rounded-lg border ${getStatusColor(phase.status)}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{phase.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {phase.description}
                  </p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>Start: {new Date(phase.startDate).toLocaleDateString('id-ID')}</span>
                    {phase.endDate && (
                      <span>End: {new Date(phase.endDate).toLocaleDateString('id-ID')}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {phase.progress}%
                  </div>
                  <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-500"
                      style={{ width: `${phase.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
