import type { NearbyStop, SelectedStop } from '../types';

interface StopItemProps {
  stop: NearbyStop | SelectedStop;
  isSelected: boolean;
  onToggle: () => void;
  showDistance?: boolean;
}

export function StopItem({ stop, isSelected, onToggle, showDistance = false }: StopItemProps) {
  const distance = showDistance && 'distance' in stop
    ? `${Math.round(stop.distance)}m`
    : null;

  return (
    <div
      className={`stop-item ${isSelected ? 'stop-item--selected' : ''}`}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggle(); }}
    >
      <span className="stop-item-name">{stop.name}</span>
      {distance && <span className="stop-item-distance">{distance}</span>}
    </div>
  );
}
