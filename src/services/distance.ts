import type { SLSite, NearbyStop } from '../types';

export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearbyStops(
  lat: number,
  lon: number,
  sites: SLSite[],
  maxDistance = 1000,
  maxResults = 10
): NearbyStop[] {
  return sites
    .map((site) => ({
      ...site,
      distance: haversineDistance(lat, lon, site.lat, site.lon),
    }))
    .filter((s) => s.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxResults);
}
