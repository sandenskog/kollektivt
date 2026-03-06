import { describe, it, expect } from 'vitest';
import { haversineDistance, findNearbyStops } from './distance';
import type { SLSite } from '../types';

describe('haversineDistance', () => {
  it('returns ~420m between Centralen and T-Centralen', () => {
    const distance = haversineDistance(59.3293, 18.0686, 59.3326, 18.0649);
    expect(distance).toBeGreaterThan(350);
    expect(distance).toBeLessThan(500);
  });

  it('returns 0 for same point', () => {
    const distance = haversineDistance(59.3293, 18.0686, 59.3293, 18.0686);
    expect(distance).toBe(0);
  });
});

describe('findNearbyStops', () => {
  const sites: SLSite[] = [
    { id: 1, name: 'Close Stop', lat: 59.3300, lon: 18.0690 },
    { id: 2, name: 'Medium Stop', lat: 59.3350, lon: 18.0700 },
    { id: 3, name: 'Far Stop', lat: 59.4000, lon: 18.1000 },
  ];

  it('filters to maxDistance=1000 and returns sorted by distance', () => {
    const result = findNearbyStops(59.3293, 18.0686, sites, 1000, 10);
    expect(result.length).toBe(2);
    expect(result[0].name).toBe('Close Stop');
    expect(result[1].name).toBe('Medium Stop');
    expect(result[0].distance).toBeLessThan(result[1].distance);
  });

  it('returns max 10 results', () => {
    const manySites: SLSite[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      name: `Stop ${i}`,
      lat: 59.3293 + i * 0.0001,
      lon: 18.0686,
    }));
    const result = findNearbyStops(59.3293, 18.0686, manySites, 5000, 10);
    expect(result.length).toBeLessThanOrEqual(10);
  });

  it('returns empty array when no stops in range', () => {
    const farSites: SLSite[] = [
      { id: 1, name: 'Very Far', lat: 60.0, lon: 19.0 },
    ];
    const result = findNearbyStops(59.3293, 18.0686, farSites, 1000, 10);
    expect(result).toEqual([]);
  });
});
