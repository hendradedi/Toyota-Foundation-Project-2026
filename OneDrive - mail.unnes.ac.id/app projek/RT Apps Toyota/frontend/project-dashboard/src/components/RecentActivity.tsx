'use client';

import { GitBranch, Code2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function RecentActivity() {
  const activities = [
    {
      id: 1,
      type: 'commit',
      title: 'Phase 2.6 Complete: Patrol Shift Scheduling System',
      description: 'Implemented shift scheduling with conflict detection and real-time check-ins',
      timestamp: '2 hours ago',
      icon: GitBranch,
    },
    {
      id: 2,
      type: 'feature',
      title: 'Phase 2.5 Complete: SOS Alert Broadcasting',
      description: 'Real-time emergency alerts with geolocation and status tracking',
      timestamp: '4 hours ago',
      icon: CheckCircle2,
    },
    {
      id: 3,
      type: 'feature',
      title: 'Phase 2.4 Complete: Marketplace Order Processing',
      description: 'Order workflow with stock management and payment options',
      timestamp: '6 hours ago',
      icon: CheckCircle2,
    },
    {
      id: 4,
      type: 'feature',
      title: 'Phase 2.3 Complete: Marketplace Business Management',
      description: 'Business registration and product catalog system',
      timestamp: '8 hours ago',
      icon: CheckCircle2,
    },
    {
      id: 5,
      type: 'issue',
      title: 'TypeScript Module Resolution',
      description: '@rt-muban/shared module resolution - will resolve after build',
      timestamp: '10 hours ago',
      icon: AlertCircle,
    },
  ];

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'commit':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'feature':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'issue':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h2>

      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <div
              key={activity.id}
              className={`p-4 rounded-lg border ${getActivityColor(activity.type)}`}
            >
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {activity.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {activity.timestamp}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
