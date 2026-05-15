'use client';

import { Activity, CheckCircle2, AlertCircle, Zap } from 'lucide-react';

export default function ServiceHealth() {
  const services = [
    { name: 'API Gateway', status: 'healthy', uptime: 99.9, responseTime: 45 },
    { name: 'User Service', status: 'healthy', uptime: 99.8, responseTime: 52 },
    { name: 'Waste Bank Service', status: 'healthy', uptime: 99.9, responseTime: 48 },
    { name: 'Marketplace Service', status: 'healthy', uptime: 99.7, responseTime: 61 },
    { name: 'SOS Service', status: 'healthy', uptime: 99.9, responseTime: 38 },
    { name: 'Patrol Service', status: 'healthy', uptime: 99.8, responseTime: 55 },
  ];

  const getStatusIcon = (status: string) => {
    if (status === 'healthy') {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    } else if (status === 'degraded') {
      return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    } else {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-primary-500" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Service Health</h2>
      </div>

      <div className="space-y-3">
        {services.map((service) => (
          <div key={service.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center gap-3 flex-1">
              {getStatusIcon(service.status)}
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  {service.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Uptime: {service.uptime}% • Response: {service.responseTime}ms
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                Online
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
