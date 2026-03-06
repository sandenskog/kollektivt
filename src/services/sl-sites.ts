import type { SLSite } from '../types';

let sitesCache: SLSite[] | null = null;

export async function loadSites(): Promise<SLSite[]> {
  if (sitesCache) return sitesCache;

  const res = await fetch(
    'https://transport.integration.sl.se/v1/sites?expand=true'
  );

  if (!res.ok) {
    throw new Error(`SL API error: ${res.status} ${res.statusText}`);
  }

  sitesCache = await res.json();
  return sitesCache!;
}
