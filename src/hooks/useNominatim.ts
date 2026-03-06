import { useState, useEffect, useRef } from 'react';
import type { NominatimResult } from '../types';
import { searchAddress } from '../services/nominatim';

export function useNominatim(query: string, debounceMs = 300) {
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);

      try {
        const data = await searchAddress(query, controller.signal);
        if (!controller.signal.aborted) {
          setResults(data);
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        if (!controller.signal.aborted) {
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [query, debounceMs]);

  return { results, loading };
}
