import { useState, useEffect } from 'react';
import type { NearbyStop } from '../types';
import { loadSites } from '../services/sl-sites';
import { findNearbyStops } from '../services/distance';

export function useNearbyStops(lat: number | null, lon: number | null) {
  const [stops, setStops] = useState<NearbyStop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lat === null || lon === null) {
      setStops([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const sites = await loadSites();
        if (cancelled) return;
        const nearby = findNearbyStops(lat, lon, sites, 1000, 10);
        setStops(nearby);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load stops');
        setStops([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [lat, lon]);

  return { stops, loading, error };
}
