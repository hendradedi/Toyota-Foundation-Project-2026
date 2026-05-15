'use client';

import { Issue } from '@/data/projectData';
import { AlertCircle, AlertTriangle, AlertOctagon, Info } from 'lucide-react';

interface IssueTrackerProps {
  issues: Issue[];
}

export default function IssueTracker({ issues }: IssueTrackerProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertOctagon className="w-5 h-5 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'medium':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'high':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'medium':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      case 'in-progress':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200';
      default:
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Issue Tracker</h2>
      
      {issues.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No issues reported</p>
        </div>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className={`p-4 rounded-lg border ${getSeverityColor(issue.severity)}`}
            >
              <div className="flex items-start gap-3">
                {getSeverityIcon(issue.severity)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {issue.title}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBadge(issue.status)}`}>
                      {issue.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {issue.description}
                  </p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>Created: {new Date(issue.createdAt).toLocaleDateString('id-ID')}</span>
                    {issue.resolvedAt && (
                      <span>Resolved: {new Date(issue.resolvedAt).toLocaleDateString('id-ID')}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
