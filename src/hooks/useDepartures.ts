import { useState, useCallback, useEffect, useRef } from 'react';
import type { SelectedStop, DepartureResponse } from '../types';
import { fetchDepartures } from '../services/sl-departures';

const POLL_INTERVAL = 30_000; // 30 seconds
const TICK_INTERVAL = 60_000; // 60 seconds

export function useDepartures(stops: SelectedStop[]) {
  const [departuresByStop, setDeparturesByStop] = useState<Map<number, DepartureResponse>>(
    () => new Map()
  );
  const [errors, setErrors] = useState<Map<number, boolean>>(() => new Map());
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const initialFetchDone = useRef(false);

  const fetchAll = useCallback(async () => {
    if (stops.length === 0) {
      setDeparturesByStop(new Map());
      setErrors(new Map());
      setLoading(false);
      return;
    }

    const results = await Promise.allSettled(
      stops.map((s) => fetchDepartures(s.id))
    );

    setDeparturesByStop((prev) => {
      const next = new Map(prev);
      results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          next.set(stops[i].id, result.value);
        }
        // On rejection: keep previous data (stale-while-revalidate)
      });
      // Clean up stops no longer in selection
      for (const key of next.keys()) {
        if (!stops.some((s) => s.id === key)) {
          next.delete(key);
        }
      }
      return next;
    });

    setErrors(() => {
      const next = new Map<number, boolean>();
      results.forEach((result, i) => {
        next.set(stops[i].id, result.status === 'rejected');
      });
      return next;
    });

    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      setLoading(false);
    }
  }, [stops]);

  // Polling effect
  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // Tick counter for countdown re-renders
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, TICK_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return { departuresByStop, errors, loading, refresh: fetchAll, tick };
}
