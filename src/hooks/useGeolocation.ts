import { useState, useCallback } from 'react';

interface GeoState {
  lat: number | null;
  lon: number | null;
  loading: boolean;
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({
    lat: null,
    lon: null,
    loading: false,
    error: null,
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocation is not supported' }));
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          loading: false,
          error: null,
        });
      },
      (err) => {
        const messages: Record<number, string> = {
          1: 'Location access was denied',
          2: 'Position unavailable',
          3: 'Request timed out',
        };
        setState((s) => ({
          ...s,
          loading: false,
          error: messages[err.code] || 'Unknown error',
        }));
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  return { ...state, requestLocation };
}
