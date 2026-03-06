import { useState, useCallback } from 'react';

const STORAGE_KEY = 'kollektivt:dashboard';

export function useDashboardMode() {
  const [dashboard, setDashboard] = useState<boolean>(
    () => localStorage.getItem(STORAGE_KEY) === 'true'
  );

  const toggle = useCallback(() => {
    setDashboard((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return { dashboard, toggle };
}
