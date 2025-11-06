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
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-600">Timestamp</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{current?.Timestamp ?? '-'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-600">Position (X,Y)</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{current ? `${current.X_Pos_m.toFixed(2)}, ${current.Y_Pos_m.toFixed(2)}` : '-'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-600">Speed (km/h)</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{current?.Speed_kmh?.toFixed?.(2) ?? '-'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-600">Fuel (%)</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{current?.['Fuel_Level_%']?.toFixed?.(1) ?? '-'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Fork</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{forkLifted ? 'Raised' : 'Lowered'}</p>
            </div>
            <button
              className={`px-3 py-1.5 text-xs font-medium rounded-lg ${playing ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}
              onClick={() => setPlaying(p => !p)}
            >
              {playing ? 'Pause' : 'Play'}
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Trajectory Playback</h2>
            <p className="text-sm text-gray-500 mt-1">Mapped to a 100×100 grid</p>
          </div>
          <div className="text-sm text-gray-500">Frame {rows.length ? index + 1 : 0} / {rows.length}</div>
        </div>
        <div className="p-6 flex justify-center">
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
    </div>
  );
}


