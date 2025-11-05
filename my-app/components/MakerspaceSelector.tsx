'use client';

import { Makerspace } from '@/types/makerspace';

interface MakerspaceSelectorProps {
  makerspaces: Makerspace[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function MakerspaceSelector({
  makerspaces,
  selectedId,
  onSelect,
}: MakerspaceSelectorProps) {
  return (
    <div className="w-full">
      <label
        htmlFor="makerspace-select"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
      >
        Select Makerspace
      </label>
      <select
        id="makerspace-select"
        value={selectedId || ''}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      >
        <option value="">Choose a makerspace...</option>
        {makerspaces.map((makerspace) => (
          <option key={makerspace.id} value={makerspace.id}>
            {makerspace.name} - {makerspace.location}
          </option>
        ))}
      </select>
    </div>
  );
}
