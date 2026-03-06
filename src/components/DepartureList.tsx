import type { SelectedStop, DepartureResponse, StopFilters } from '../types';
import { StopDepartures } from './StopDepartures';

interface DepartureListProps {
  stops: SelectedStop[];
  departuresByStop: Map<number, DepartureResponse>;
  errors: Map<number, boolean>;
  filters: Record<number, StopFilters>;
  onFiltersChange: (stopId: number, filters: StopFilters) => void;
  refresh: () => void;
  tick: number;
}

export function DepartureList({
  stops,
  departuresByStop,
  errors,
  filters,
  onFiltersChange,
  refresh,
  tick,
}: DepartureListProps) {
  if (stops.length === 0) {
    return null;
  }

  return (
    <section className="departure-list">
      <div className="departure-list-header">
        <h2>Departures</h2>
        <button className="refresh-btn" onClick={refresh} title="Refresh departures">
          &#x21bb;
        </button>
      </div>
      {stops.map((stop) => (
        <StopDepartures
          key={stop.id}
          stop={stop}
          response={departuresByStop.get(stop.id)}
          error={errors.get(stop.id) ?? false}
          filters={filters[stop.id] ?? {}}
          onFiltersChange={(f) => onFiltersChange(stop.id, f)}
          refresh={refresh}
          tick={tick}
        />
      ))}
    </section>
  );
}
