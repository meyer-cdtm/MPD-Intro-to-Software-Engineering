'use client';

import { useState, useEffect } from 'react';
import FrontLoader from './FrontLoader';

const GRID_SIZE = 100;
const CELL_SIZE = 6; // pixels per cell for display

export default function FarmGrid() {
  const [loaderPosition, setLoaderPosition] = useState({ x: 10, y: 10 });
  const [loaderDirection, setLoaderDirection] = useState<'up' | 'down' | 'left' | 'right'>('right');
  const [forkLifted, setForkLifted] = useState(false);
  const [isTurning, setIsTurning] = useState(false);

  // Animate the front loader moving around the farm
  useEffect(() => {
    const interval = setInterval(() => {
      // If we're turning, don't move yet - just wait for the turn animation
      if (isTurning) {
        setIsTurning(false);
        return;
      }

      setLoaderPosition((prev) => {
        let newX = prev.x;
        let newY = prev.y;
        let needsTurn = false;
        let newDirection = loaderDirection;

        // Move forward in the current direction
        if (loaderDirection === 'right') {
          if (prev.x < 80) {
            newX = prev.x + 1; // Move forward
          } else {
            // Need to turn to face down
            newDirection = 'down';
            needsTurn = true;
          }
        } else if (loaderDirection === 'down') {
          if (prev.y < 80) {
            newY = prev.y + 1; // Move forward
          } else {
            // Need to turn to face left
            newDirection = 'left';
            needsTurn = true;
          }
        } else if (loaderDirection === 'left') {
          if (prev.x > 10) {
            newX = prev.x - 1; // Move forward
          } else {
            // Need to turn to face up
            newDirection = 'up';
            needsTurn = true;
          }
        } else if (loaderDirection === 'up') {
          if (prev.y > 10) {
            newY = prev.y - 1; // Move forward
          } else {
            // Need to turn to face right
            newDirection = 'right';
            needsTurn = true;
          }
        }

        // If we need to turn, update direction and set turning flag
        if (needsTurn) {
          setLoaderDirection(newDirection);
          setIsTurning(true);
          // Don't move position while turning
          return prev;
        }

        return { x: newX, y: newY };
      });

      // Toggle fork lift randomly
      if (Math.random() < 0.1) {
        setForkLifted((prev) => !prev);
      }
    }, 150); // Slightly slower for more realistic movement

    return () => clearInterval(interval);
  }, [loaderDirection, isTurning]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Position</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {loaderPosition.x},{loaderPosition.y}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Heading</p>
              <p className="text-2xl font-bold text-gray-900 mt-1 uppercase">{loaderDirection}</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bucket Status</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{forkLifted ? 'Raised' : 'Lowered'}</p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${forkLifted ? 'bg-green-50' : 'bg-gray-50'}`}>
              <svg className={`w-6 h-6 ${forkLifted ? 'text-green-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <p className="text-2xl font-bold text-gray-900">Active</p>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Panel */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Live Operations Grid</h2>
              <p className="text-sm text-gray-500 mt-1">100×100 cell tracking system</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* Grid Container */}
        <div className="p-6 flex justify-center">
          <div
            className="relative bg-gradient-to-br from-amber-50 via-green-50 to-emerald-100 rounded-lg overflow-hidden border-2 border-gray-200"
            style={{
              width: `${GRID_SIZE * CELL_SIZE}px`,
              height: `${GRID_SIZE * CELL_SIZE}px`,
            }}
          >
          {/* Soil/field texture overlay */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(139, 69, 19, 0.1) 10px,
                rgba(139, 69, 19, 0.1) 20px
              )`,
            }}
          />

          {/* Grid lines */}
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(to right, rgba(34, 139, 34, 0.15) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(34, 139, 34, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
          }} />

          {/* Major grid lines every 10 cells */}
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(to right, rgba(34, 139, 34, 0.3) 2px, transparent 2px),
              linear-gradient(to bottom, rgba(34, 139, 34, 0.3) 2px, transparent 2px)
            `,
            backgroundSize: `${CELL_SIZE * 10}px ${CELL_SIZE * 10}px`,
          }} />

          {/* Grid coordinates every 10 cells */}
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={`coord-${i}`}>
              <div
                className="absolute text-[9px] text-gray-700 font-mono font-bold bg-white/70 px-1 rounded"
                style={{
                  left: `${i * 10 * CELL_SIZE + 2}px`,
                  top: '4px',
                }}
              >
                {i * 10}
              </div>
              <div
                className="absolute text-[9px] text-gray-700 font-mono font-bold bg-white/70 px-1 rounded"
                style={{
                  left: '4px',
                  top: `${i * 10 * CELL_SIZE + 2}px`,
                }}
              >
                {i * 10}
              </div>
            </div>
          ))}

          {/* Field markers / decorations */}
          <div className="absolute top-2 right-2 bg-red-500 text-white text-[8px] px-2 py-1 rounded shadow font-bold">
            ZONE A
          </div>
          <div className="absolute bottom-2 right-2 bg-blue-500 text-white text-[8px] px-2 py-1 rounded shadow font-bold">
            ZONE B
          </div>

          {/* Front Loader */}
          <FrontLoader
            x={loaderPosition.x}
            y={loaderPosition.y}
            direction={loaderDirection}
            forkLifted={forkLifted}
            cellSize={CELL_SIZE}
          />
          </div>
        </div>
      </div>

      {/* Quick Actions & Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left">
              <svg className="w-4 h-4 inline mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start Autonomous Mode
            </button>
            <button className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left">
              <svg className="w-4 h-4 inline mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pause Operations
            </button>
            <button className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left">
              <svg className="w-4 h-4 inline mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View Full Logs
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">System Health</h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Performance</span>
                <span className="text-sm font-semibold text-gray-900">98%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{width: '98%'}}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Battery</span>
                <span className="text-sm font-semibold text-gray-900">85%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{width: '85%'}}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Efficiency</span>
                <span className="text-sm font-semibold text-gray-900">92%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{width: '92%'}}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">API Integration</h3>
          <p className="text-sm text-gray-600 mb-4">
            Control your loader fleet programmatically via our REST API or SDK.
          </p>
          <div className="bg-gray-50 rounded-lg p-3 mb-4 border border-gray-200">
            <code className="text-xs text-gray-800 font-mono">
              POST /api/loader<br />
              {'{'} "action": "move" {'}'}
            </code>
          </div>
          <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View API Docs →
          </a>
        </div>
      </div>
    </div>
  );
}
