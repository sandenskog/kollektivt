import { useState, useCallback } from 'react';
import type { SelectedStop, PersistedData, StopFilters } from '../types';

const STORAGE_KEY = 'kollektivt_data';
const SCHEMA_VERSION = 2;

function migrate(data: unknown): PersistedData {
  if (
    data &&
    typeof data === 'object' &&
    'version' in data &&
    'selectedStops' in data
  ) {
    const d = data as PersistedData;

    // v1 -> v2: add filters field
    if (!d.filters) {
      d.filters = {};
    }
    d.version = SCHEMA_VERSION;

    return d;
  }
  return { version: SCHEMA_VERSION, selectedStops: [], filters: {} };
}

function loadFromStorage(): PersistedData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: SCHEMA_VERSION, selectedStops: [], filters: {} };
    return migrate(JSON.parse(raw));
  } catch {
    return { version: SCHEMA_VERSION, selectedStops: [], filters: {} };
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

      // Clean up filters for removed stops
      let filters = { ...prev.filters };
      if (exists) {
        delete filters[stop.id];
      }

      const next: PersistedData = { ...prev, selectedStops, filters };
      saveToStorage(next);
      return next;
    });
  }, []);

  const isSelected = useCallback(
    (id: number) => data.selectedStops.some((s) => s.id === id),
    [data.selectedStops]
  );

  const setFilters = useCallback((stopId: number, filters: StopFilters) => {
    setData((prev) => {
      const next: PersistedData = {
        ...prev,
        filters: { ...prev.filters, [stopId]: filters },
      };
      saveToStorage(next);
      return next;
    });
  }, []);

  const getFilters = useCallback(
    (stopId: number): StopFilters => {
      return data.filters?.[stopId] ?? {};
    },
    [data.filters]
  );

  return {
    selectedStops: data.selectedStops,
    toggleStop,
    isSelected,
    filters: data.filters ?? {},
    setFilters,
    getFilters,
  };
}
