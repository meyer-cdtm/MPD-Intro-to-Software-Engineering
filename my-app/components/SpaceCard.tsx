'use client';

import { Space } from '@/types/makerspace';

interface SpaceCardProps {
  space: Space;
}

export default function SpaceCard({ space }: SpaceCardProps) {
  const getStatusColor = () => {
    switch (space.status) {
      case 'available':
        return 'bg-emerald-500';
      case 'occupied':
        return 'bg-blue-500';
      case 'maintenance':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBg = () => {
    switch (space.status) {
      case 'available':
        return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
      case 'occupied':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'maintenance':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const getStatusText = () => {
    switch (space.status) {
      case 'available':
        return 'Available';
      case 'occupied':
        return 'In Use';
      case 'maintenance':
        return 'Maintenance';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={`rounded-xl border-2 p-4 transition-all hover:shadow-md cursor-pointer ${getStatusBg()}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
            {space.name}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {space.type}
          </p>
        </div>
        <div className={`w-3 h-3 rounded-full ${getStatusColor()} ring-2 ring-white dark:ring-black`}></div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {getStatusText()}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <span>👥</span>
          <span>{space.capacity}</span>
        </div>
      </div>
    </div>
  );
}
