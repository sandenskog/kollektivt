import type { NominatimResult } from '../types';

export async function searchAddress(
  query: string,
  signal?: AbortSignal
): Promise<NominatimResult[]> {
  // Kartor Plattform geocode (self-hosted Nominatim backend, SE-scope) — replaces
  // public nominatim.openstreetmap.org (1 req/s policy). Returns { results: [...] }.
  const res = await fetch(
    `https://karta.muskot.se/api/geocode?q=${encodeURIComponent(query)}`,
    { signal }
  );

  if (!res.ok) {
    throw new Error(`Geocode error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as {
    results?: Array<{ lat: number | string; lon: number | string; display_name: string }>;
  };
  return (data.results ?? []).map((r) => ({
    lat: String(r.lat),
    lon: String(r.lon),
    display_name: r.display_name,
  }));
}
