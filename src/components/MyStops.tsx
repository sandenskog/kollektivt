import type { SelectedStop } from '../types';
import { StopItem } from './StopItem';

interface MyStopsProps {
  stops: SelectedStop[];
  onRemoveStop: (stop: SelectedStop) => void;
}

export function MyStops({ stops, onRemoveStop }: MyStopsProps) {
  if (stops.length === 0) {
    return null;
  }

  return (
    <section className="my-stops">
      <h2>My stops</h2>
      {stops.map((stop) => (
        <StopItem
          key={stop.id}
          stop={stop}
          isSelected={true}
          onToggle={() => onRemoveStop(stop)}
        />
      ))}
    </section>
  );
}
