import type { SelectedStop, DepartureResponse, StopFilters, Departure } from '../types';
import { DepartureRow } from './DepartureRow';
import { DepartureFilters } from './DepartureFilters';

interface StopDeparturesProps {
  stop: SelectedStop;
  response: DepartureResponse | undefined;
  error: boolean;
  filters: StopFilters;
  onFiltersChange: (filters: StopFilters) => void;
  tick: number;
}

function collectDeviationMessages(response: DepartureResponse): string[] {
  const messages = new Set<string>();

  // Stop-level deviations
  for (const dev of response.stop_deviations) {
    if (dev.message) messages.add(dev.message);
  }

  // Departure-level deviations
  for (const dep of response.departures) {
    for (const dev of dep.deviations) {
      if (dev.message) messages.add(dev.message);
    }
  }

  return Array.from(messages);
}

function applyFilters(departures: Departure[], filters: StopFilters): Departure[] {
  let filtered = departures;

  if (filters.directions && filters.directions.length > 0) {
    filtered = filtered.filter((d) => filters.directions!.includes(d.direction_code));
  }

  if (filters.lines && filters.lines.length > 0) {
    filtered = filtered.filter((d) => filters.lines!.includes(d.line.id));
  }

  return filtered;
}

function sortByExpectedTime(departures: Departure[]): Departure[] {
  return [...departures].sort((a, b) => a.expected.localeCompare(b.expected));
}

export function StopDepartures({
  stop,
  response,
  error,
  filters,
  onFiltersChange,
  tick,
}: StopDeparturesProps) {
  return (
    <div className="stop-departures">
      <h3>{stop.name}</h3>

      {/* Loading state */}
      {!response && !error && <p className="stop-loading">Loading departures...</p>}

      {/* Error with no data */}
      {error && !response && <p className="stop-error">Could not load departures</p>}

      {/* Error with stale data */}
      {error && response && <p className="update-error">Could not update</p>}

      {/* Disruption banner */}
      {response && (() => {
        const messages = collectDeviationMessages(response);
        if (messages.length === 0) return null;
        return (
          <div className="disruption-banner">
            {messages.map((msg, i) => (
              <p key={i}>{msg}</p>
            ))}
          </div>
        );
      })()}

      {/* Filters and departure rows */}
      {response && (
        <>
          <DepartureFilters
            departures={response.departures}
            filters={filters}
            onFiltersChange={onFiltersChange}
          />
          {sortByExpectedTime(applyFilters(response.departures, filters))
            .slice(0, 5)
            .map((dep) => (
              <DepartureRow
                key={`${dep.journey.id}-${dep.expected}`}
                departure={dep}
                tick={tick}
              />
            ))}
        </>
      )}
    </div>
  );
}
