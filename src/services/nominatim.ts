import type { NominatimResult } from '../types';

export async function searchAddress(
  query: string,
  signal?: AbortSignal
): Promise<NominatimResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    countrycodes: 'se',
    limit: '5',
    'accept-language': 'sv',
  });

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    {
      signal,
      headers: {
        'User-Agent': 'Kollektivt/1.0 (kollektivt.sandenskog.se)',
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Nominatim error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
