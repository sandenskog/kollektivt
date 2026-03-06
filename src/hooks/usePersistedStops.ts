import { useState, useCallback } from 'react';
import type { SelectedStop, PersistedData } from '../types';

const STORAGE_KEY = 'kollektivt_data';
const SCHEMA_VERSION = 1;

function migrate(data: unknown): PersistedData {
  if (
    data &&
    typeof data === 'object' &&
    'version' in data &&
    'selectedStops' in data
  ) {
    // Future: add migration logic per version
    return data as PersistedData;
  }
  return { version: SCHEMA_VERSION, selectedStops: [] };
}

function loadFromStorage(): PersistedData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: SCHEMA_VERSION, selectedStops: [] };
    return migrate(JSON.parse(raw));
  } catch {
    return { version: SCHEMA_VERSION, selectedStops: [] };
  }
}

function saveToStorage(data: PersistedData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function usePersistedStops() {
  const [data, setData] = useState<PersistedData>(loadFromStorage);

  const toggleStop = useCallback((stop: SelectedStop) => {
    setData((prev) => {
      const exists = prev.selectedStops.some((s) => s.id === stop.id);
      const selectedStops = exists
        ? prev.selectedStops.filter((s) => s.id !== stop.id)
        : [...prev.selectedStops, stop];
      const next: PersistedData = { ...prev, selectedStops };
      saveToStorage(next);
      return next;
    });
  }, []);

  const isSelected = useCallback(
    (id: number) => data.selectedStops.some((s) => s.id === id),
    [data.selectedStops]
  );

  return {
    selectedStops: data.selectedStops,
    toggleStop,
    isSelected,
  };
}
