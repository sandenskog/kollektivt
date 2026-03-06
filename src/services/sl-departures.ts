import type { Departure, DepartureResponse } from '../types';

export async function fetchDepartures(siteId: number): Promise<DepartureResponse> {
  const res = await fetch(
    `https://transport.integration.sl.se/v1/sites/${siteId}/departures?forecast=60`
  );

  if (!res.ok) {
    throw new Error(`SL API error: ${res.status}`);
  }

  return res.json();
}

/**
 * Parse hours and minutes from a timezone-less ISO timestamp string.
 * API returns timestamps like "2026-03-06T14:23:12" without timezone suffix.
 * We parse as strings to avoid timezone ambiguity across browsers.
 */
function parseHHMM(timestamp: string): { hours: number; minutes: number } {
  const timePart = timestamp.split('T')[1]; // "14:23:12" or "14:23:00"
  const [hh, mm] = timePart.split(':');
  return { hours: parseInt(hh, 10), minutes: parseInt(mm, 10) };
}

/**
 * Compute countdown text from a departure's expected time vs current local time.
 * Returns "Now" for <= 0 min, "{N} min" for 1-59 min, "HH:MM" for 60+ min.
 */
export function getCountdown(departure: Departure): string {
  const { hours, minutes } = parseHHMM(departure.expected);
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const depMinutes = hours * 60 + minutes;
  const diff = depMinutes - nowMinutes;

  if (diff <= 0) return 'Now';
  if (diff < 60) return `${diff} min`;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Extract HH:MM from the expected timestamp (string parsing, no Date).
 */
export function getAbsoluteTime(departure: Departure): string {
  const { hours, minutes } = parseHHMM(departure.expected);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Compute delay in minutes between expected and scheduled times.
 * Positive = delayed, negative = early, 0 = on time.
 */
export function getDelayMinutes(departure: Departure): number {
  const scheduled = parseHHMM(departure.scheduled);
  const expected = parseHHMM(departure.expected);
  const schedMin = scheduled.hours * 60 + scheduled.minutes;
  const expMin = expected.hours * 60 + expected.minutes;
  return expMin - schedMin;
}
