'use client';

import { Machine } from '@/types/makerspace';

interface MachineCardProps {
  machine: Machine;
}

export default function MachineCard({ machine }: MachineCardProps) {
  const getStatusColor = () => {
    switch (machine.status) {
      case 'operational':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (machine.status) {
      case 'operational':
        return 'Operational';
      case 'warning':
        return 'Warning';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
            {machine.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {machine.type}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`}></div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
          {getStatusText()}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {machine.lastUpdate.toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
