'use client';

import { ProjectPhase } from '@/data/projectData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ProgressChartProps {
  phases: ProjectPhase[];
}

export default function ProgressChart({ phases }: ProgressChartProps) {
  const chartData = phases.map((phase) => ({
    name: phase.name.replace('Phase ', 'P'),
    progress: phase.progress,
    subPhases: phase.subPhases.length,
  }));

  const statusData = [
    { name: 'Completed', value: phases.filter(p => p.status === 'completed').length, color: '#22c55e' },
    { name: 'In Progress', value: phases.filter(p => p.status === 'in-progress').length, color: '#3b82f6' },
    { name: 'Pending', value: phases.filter(p => p.status === 'pending').length, color: '#ef4444' },
    { name: 'Blocked', value: phases.filter(p => p.status === 'blocked').length, color: '#f97316' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Progress Overview</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bar Chart */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Phase Progress</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
              />
              <Bar dataKey="progress" fill="#22c55e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {statusData.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {item.name}: {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
