'use client';

import { Event } from '@/types/makerspace';
import { useRef } from 'react';

interface EventFeedProps {
  events: Event[];
}

export default function EventFeed({ events }: EventFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);

  const getEventIcon = (type: Event['type']) => {
    switch (type) {
      case 'space_status_change':
        return '🔄';
      case 'automation_triggered':
        return '⚡';
      case 'alert':
        return '🚨';
      case 'access_granted':
        return '✅';
      case 'access_denied':
        return '🚫';
      case 'material_ordered':
        return '📦';
      case 'material_approved':
        return '✔️';
      case 'material_delivered':
        return '🚚';
      case 'user_request':
        return '📋';
      default:
        return '📝';
    }
  };

  const getStatusBadge = (status?: Event['status']) => {
    if (!status) return null;

    const colors = {
      available: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      occupied: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      maintenance: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    };

    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
      <div className="bg-gray-50 dark:bg-zinc-800 px-4 py-3 border-b border-gray-200 dark:border-zinc-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="text-xl">📡</span> Live Event Feed
        </h2>
      </div>
      <div ref={feedRef} className="h-[600px] overflow-y-auto p-4 space-y-3">
        {events.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Waiting for events...
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-3 border border-gray-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors animate-fadeIn"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getEventIcon(event.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">
                      {event.makerspaceName}
                    </span>
                    {event.status && getStatusBadge(event.status)}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                    {event.message}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    {event.spaceName && (
                      <>
                        <span>{event.spaceName}</span>
                        <span>•</span>
                      </>
                    )}
                    {event.userName && (
                      <>
                        <span>{event.userName}</span>
                        <span>•</span>
                      </>
                    )}
                    {event.material && (
                      <>
                        <span>{event.material}</span>
                        <span>•</span>
                      </>
                    )}
                    <span>{event.timestamp.toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
