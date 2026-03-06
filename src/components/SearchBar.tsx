import { useState, useRef, useEffect } from 'react';
import { useNominatim } from '../hooks/useNominatim';

interface SearchBarProps {
  onSelectAddress: (lat: number, lon: number) => void;
  onRequestLocation: () => void;
  locationLoading?: boolean;
}

export function SearchBar({ onSelectAddress, onRequestLocation, locationLoading }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const { results, loading } = useNominatim(query);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Open dropdown when results arrive
  useEffect(() => {
    if (results.length > 0) {
      setOpen(true);
    }
  }, [results]);

  return (
    <div className="search-bar" ref={wrapperRef}>
      <div className="search-bar-row">
        <input
          type="text"
          className="search-input"
          placeholder="Search for an address..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          className="location-button"
          onClick={onRequestLocation}
          disabled={locationLoading}
          type="button"
        >
          {locationLoading ? 'Locating...' : 'Use my location'}
        </button>
      </div>

      {loading && <div className="search-loading">Searching...</div>}

      {open && results.length > 0 && (
        <ul className="search-dropdown">
          {results.map((r, i) => (
            <li
              key={`${r.lat}-${r.lon}-${i}`}
              className="search-dropdown-item"
              onClick={() => {
                onSelectAddress(parseFloat(r.lat), parseFloat(r.lon));
                setQuery(r.display_name);
                setOpen(false);
              }}
            >
              {r.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
