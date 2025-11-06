'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import FrontLoader from './FrontLoader';

type TrajectoryRow = {
  Timestamp: string;
  Tractor_ID: string;
  X_Pos_m: number;
  Y_Pos_m: number;
  Speed_kmh?: number;
  Rotation_deg?: number;
  Fork_Position?: number;
} & Record<string, unknown>;

const GRID_SIZE = 100;
const CELL_SIZE = 6;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function TrajectoryDashboard() {
  const [rows, setRows] = useState<TrajectoryRow[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timerRef = useRef<number | null>(null);

  // Fetch trajectory rows once
  useEffect(() => {
    let aborted = false;
    (async () => {
      const res = await fetch('/api/trajectory');
      if (!res.ok) return;
      const json = await res.json();
      if (aborted) return;
      const r: TrajectoryRow[] = json.rows ?? [];
      setRows(r);
      setIndex(0);
    })();
    return () => {
      aborted = true;
    };
  }, []);

  // Compute mapping from meters to grid coordinates with margins
  const mapper = useMemo(() => {
    if (!rows.length) {
      return {
        mapX: (x: number) => 10,
        mapY: (y: number) => 10,
      };
    }
    const xs = rows.map(r => r.X_Pos_m);
    const ys = rows.map(r => r.Y_Pos_m);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const margin = 10; // keep path inside grid nicely
    const width = Math.max(1e-6, maxX - minX);
    const height = Math.max(1e-6, maxY - minY);
    const mapX = (x: number) => clamp(Math.round(margin + ((x - minX) / width) * (GRID_SIZE - 2 * margin)), 0, GRID_SIZE - 1);
    const mapY = (y: number) => clamp(Math.round(margin + ((y - minY) / height) * (GRID_SIZE - 2 * margin)), 0, GRID_SIZE - 1);
    return { mapX, mapY };
  }, [rows]);

  // Advance playback
  useEffect(() => {
    if (!rows.length || !playing) return;
    const id = window.setInterval(() => {
      setIndex(prev => (prev + 1) % rows.length);
    }, 1000);
    timerRef.current = id;
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [rows, playing]);

  const current = rows[index];
  const gridX = current ? mapper.mapX(current.X_Pos_m) : 10;
  const gridY = current ? mapper.mapY(current.Y_Pos_m) : 10;
  const forkLifted = (current?.Fork_Position ?? 0) > 0;

  return (
    <div className="flex gap-6 h-full">
      {/* Left: Grid */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Trajectory Playback</h2>
            <p className="text-sm text-gray-500 mt-1">Mapped to a 100×100 grid</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">Frame {rows.length ? index + 1 : 0} / {rows.length}</div>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-lg ${playing ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'} transition-colors`}
              onClick={() => setPlaying(p => !p)}
            >
              {playing ? (
                <>
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pause
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Play
                </>
              )}
            </button>
          </div>
        </div>
        <div className="p-6 flex justify-center items-center">
          <div
            className="relative bg-gradient-to-br from-amber-50 via-green-50 to-emerald-100 rounded-lg overflow-hidden border-2 border-gray-200"
            style={{ width: `${GRID_SIZE * CELL_SIZE}px`, height: `${GRID_SIZE * CELL_SIZE}px` }}
          >
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(to right, rgba(34, 139, 34, 0.15) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(34, 139, 34, 0.15) 1px, transparent 1px)
              `,
              backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
            }} />

            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(to right, rgba(34, 139, 34, 0.3) 2px, transparent 2px),
                linear-gradient(to bottom, rgba(34, 139, 34, 0.3) 2px, transparent 2px)
              `,
              backgroundSize: `${CELL_SIZE * 10}px ${CELL_SIZE * 10}px`,
            }} />

            <FrontLoader
              x={gridX}
              y={gridY}
              direction={'right'}
              forkLifted={forkLifted}
              cellSize={CELL_SIZE}
            />
          </div>
        </div>
      </div>

      {/* Right: Dashboard */}
      <div className="w-96 space-y-4">
        {/* Tractor Info */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Tractor Info</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-medium text-green-600">LIVE</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tractor ID</span>
              <span className="text-sm font-semibold text-gray-900">{current?.Tractor_ID ?? '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Timestamp</span>
              <span className="text-xs font-mono text-gray-900">{current?.Timestamp ?? '-'}</span>
            </div>
          </div>
        </div>

        {/* Position & Movement */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Position & Movement
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">X Position</span>
                <span className="text-lg font-bold text-gray-900">{current ? `${current.X_Pos_m.toFixed(2)} m` : '-'}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Y Position</span>
                <span className="text-lg font-bold text-gray-900">{current ? `${current.Y_Pos_m.toFixed(2)} m` : '-'}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Speed</span>
                <span className="text-lg font-bold text-blue-600">{current?.Speed_kmh?.toFixed?.(2) ?? '-'} km/h</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Rotation</span>
                <span className="text-lg font-bold text-gray-900">{current?.Rotation_deg?.toFixed?.(1) ?? '-'}°</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fork Status */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            Fork System
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Fork Position</span>
              <span className="text-lg font-bold text-gray-900">{current?.Fork_Position ?? '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <span className={`text-lg font-bold ${forkLifted ? 'text-green-600' : 'text-gray-500'}`}>
                {forkLifted ? 'Raised' : 'Lowered'}
              </span>
            </div>
          </div>
        </div>

        {/* Engine & Systems */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Engine & Systems
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Fuel Level</span>
                <span className="text-lg font-bold text-gray-900">{current?.['Fuel_Level_%']?.toFixed?.(1) ?? '-'}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    (current?.['Fuel_Level_%'] ?? 0) > 50 
                      ? 'bg-green-500' 
                      : (current?.['Fuel_Level_%'] ?? 0) > 25 
                      ? 'bg-yellow-500' 
                      : 'bg-red-500'
                  }`}
                  style={{width: `${Math.min(100, Math.max(0, current?.['Fuel_Level_%'] ?? 0))}%`}}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Engine Temperature</span>
                <span className="text-lg font-bold text-orange-600">{current?.['Engine_Temp_C']?.toFixed?.(1) ?? '-'}°C</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Hydraulic Pressure</span>
                <span className="text-lg font-bold text-blue-600">{current?.['Hydraulic_Pressure_bar']?.toFixed?.(1) ?? '-'} bar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


