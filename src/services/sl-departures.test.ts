import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchDepartures, getCountdown, getAbsoluteTime, getDelayMinutes } from './sl-departures';
import type { Departure } from '../types';

function makeDeparture(overrides: Partial<Departure> = {}): Departure {
  return {
    destination: 'Skarpnack',
    direction_code: 2,
    direction: 'Skarpnack',
    state: 'EXPECTED',
    display: '3 min',
    scheduled: '2026-03-06T14:20:00',
    expected: '2026-03-06T14:23:00',
    journey: { id: 1, state: 'NORMALPROGRESS', prediction_state: 'NORMAL' },
    stop_area: { id: 1051, name: 'T-Centralen', type: 'METROSTN' },
    stop_point: { id: 1052, name: 'T-Centralen', designation: '4' },
    line: { id: 17, designation: '17', transport_mode: 'METRO', group_of_lines: 'Tunnelbanans grona linje' },
    deviations: [],
    ...overrides,
  };
}

describe('fetchDepartures', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls correct URL and returns typed response', async () => {
    const mockResponse = {
      departures: [makeDeparture()],
      stop_deviations: [],
    };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await fetchDepartures(1002);

    expect(fetch).toHaveBeenCalledWith(
      'https://transport.integration.sl.se/v1/sites/1002/departures?forecast=60'
    );
    expect(result.departures).toHaveLength(1);
    expect(result.departures[0].destination).toBe('Skarpnack');
  });

  it('throws on non-OK HTTP response', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(fetchDepartures(1002)).rejects.toThrow('SL API error: 500');
  });
});

describe('getCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Now" when expected time is in the past', () => {
    vi.setSystemTime(new Date(2026, 2, 6, 14, 25, 0)); // 14:25
    const dep = makeDeparture({ expected: '2026-03-06T14:20:00' });
    expect(getCountdown(dep)).toBe('Now');
  });

  it('returns "Now" when expected time is exactly now', () => {
    vi.setSystemTime(new Date(2026, 2, 6, 14, 20, 0)); // 14:20
    const dep = makeDeparture({ expected: '2026-03-06T14:20:00' });
    expect(getCountdown(dep)).toBe('Now');
  });

  it('returns "3 min" for a departure 3 minutes from now', () => {
    vi.setSystemTime(new Date(2026, 2, 6, 14, 20, 0)); // 14:20
    const dep = makeDeparture({ expected: '2026-03-06T14:23:00' });
    expect(getCountdown(dep)).toBe('3 min');
  });

  it('returns "HH:MM" format for departures 60+ minutes away', () => {
    vi.setSystemTime(new Date(2026, 2, 6, 13, 0, 0)); // 13:00
    const dep = makeDeparture({ expected: '2026-03-06T14:23:00' });
    expect(getCountdown(dep)).toBe('14:23');
  });
});

describe('getAbsoluteTime', () => {
  it('returns correct HH:MM from expected timestamp', () => {
    const dep = makeDeparture({ expected: '2026-03-06T14:23:00' });
    expect(getAbsoluteTime(dep)).toBe('14:23');
  });

  it('handles single-digit hours with padding', () => {
    const dep = makeDeparture({ expected: '2026-03-06T09:05:00' });
    expect(getAbsoluteTime(dep)).toBe('09:05');
  });
});

describe('getDelayMinutes', () => {
  it('returns 0 for on-time departure', () => {
    const dep = makeDeparture({
      scheduled: '2026-03-06T14:20:00',
      expected: '2026-03-06T14:20:00',
    });
    expect(getDelayMinutes(dep)).toBe(0);
  });

  it('returns positive minutes for delayed departure', () => {
    const dep = makeDeparture({
      scheduled: '2026-03-06T14:20:00',
      expected: '2026-03-06T14:23:00',
    });
    expect(getDelayMinutes(dep)).toBe(3);
  });

  it('returns negative minutes for early departure', () => {
    const dep = makeDeparture({
      scheduled: '2026-03-06T14:20:00',
      expected: '2026-03-06T14:18:00',
    });
    expect(getDelayMinutes(dep)).toBe(-2);
  });
});
