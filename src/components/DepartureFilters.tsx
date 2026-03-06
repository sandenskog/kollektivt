import type { Departure, StopFilters } from '../types';

interface DepartureFiltersProps {
  departures: Departure[];
  filters: StopFilters;
  onFiltersChange: (filters: StopFilters) => void;
}

export function DepartureFilters({ departures, filters, onFiltersChange }: DepartureFiltersProps) {
  // Extract unique directions
  const directions = Array.from(
    new Map(departures.map((d) => [d.direction_code, d.direction])).entries()
  );

  // Extract unique lines
  const lines = Array.from(
    new Map(departures.map((d) => [d.line.id, d.line.designation])).entries()
  );

  const hasMultipleDirections = directions.length >= 2;
  const hasMultipleLines = lines.length >= 2;

  if (!hasMultipleDirections && !hasMultipleLines) {
    return null;
  }

  const toggleDirection = (dirCode: number) => {
    const current = filters.directions;
    if (!current || current.length === 0) {
      // All are shown, toggle one off = show all except this one
      const allExcept = directions.filter(([code]) => code !== dirCode).map(([code]) => code);
      onFiltersChange({ ...filters, directions: allExcept });
    } else if (current.includes(dirCode)) {
      const next = current.filter((c) => c !== dirCode);
      // If removing would leave empty, reset to show all
      onFiltersChange({ ...filters, directions: next.length === 0 ? undefined : next });
    } else {
      const next = [...current, dirCode];
      // If all are now selected, reset to undefined (show all)
      onFiltersChange({
        ...filters,
        directions: next.length === directions.length ? undefined : next,
      });
    }
  };

  const toggleLine = (lineId: number) => {
    const current = filters.lines;
    if (!current || current.length === 0) {
      const allExcept = lines.filter(([id]) => id !== lineId).map(([id]) => id);
      onFiltersChange({ ...filters, lines: allExcept });
    } else if (current.includes(lineId)) {
      const next = current.filter((id) => id !== lineId);
      onFiltersChange({ ...filters, lines: next.length === 0 ? undefined : next });
    } else {
      const next = [...current, lineId];
      onFiltersChange({
        ...filters,
        lines: next.length === lines.length ? undefined : next,
      });
    }
  };

  const isDirActive = (dirCode: number) => {
    return !filters.directions || filters.directions.length === 0 || filters.directions.includes(dirCode);
  };

  const isLineActive = (lineId: number) => {
    return !filters.lines || filters.lines.length === 0 || filters.lines.includes(lineId);
  };

  return (
    <div className="filters-container">
      {hasMultipleDirections && (
        <div className="filter-section">
          {directions.map(([code, label]) => (
            <button
              key={`dir-${code}`}
              className={`filter-chip${isDirActive(code) ? ' active' : ''}`}
              onClick={() => toggleDirection(code)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {hasMultipleLines && (
        <div className="filter-section">
          {lines.map(([id, designation]) => (
            <button
              key={`line-${id}`}
              className={`filter-chip${isLineActive(id) ? ' active' : ''}`}
              onClick={() => toggleLine(id)}
            >
              {designation}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
