import type { NearbyStop, SelectedStop } from '../types';
import { StopItem } from './StopItem';

interface StopListProps {
  stops: NearbyStop[];
  isSelected: (id: number) => boolean;
  onToggleStop: (stop: SelectedStop) => void;
  loading: boolean;
}

export function StopList({ stops, isSelected, onToggleStop, loading }: StopListProps) {
  if (loading) {
    return (
      <section className="stop-list">
        <h2>Nearby stops</h2>
        <p className="stop-list-loading">Loading nearby stops...</p>
      </section>
    );
  }

  if (stops.length === 0) {
    return null;
  }

  return (
    <section className="stop-list">
      <h2>Nearby stops</h2>
      {stops.map((stop) => (
        <StopItem
          key={stop.id}
          stop={stop}
          isSelected={isSelected(stop.id)}
          onToggle={() => onToggleStop({
            id: stop.id,
            name: stop.name,
            lat: stop.lat,
            lon: stop.lon,
          })}
          showDistance
        />
      ))}
    </section>
  );
}
