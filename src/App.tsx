import { useState, useEffect } from 'react';
import { usePersistedStops } from './hooks/usePersistedStops';
import { useNearbyStops } from './hooks/useNearbyStops';
import { useGeolocation } from './hooks/useGeolocation';
import { useDepartures } from './hooks/useDepartures';
import { SearchBar } from './components/SearchBar';
import { StopList } from './components/StopList';
import { MyStops } from './components/MyStops';
import { DepartureList } from './components/DepartureList';
import './App.css';

interface Coordinates {
  lat: number;
  lon: number;
}

function App() {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const { selectedStops, toggleStop, isSelected, filters, setFilters } = usePersistedStops();
  const { stops, loading: stopsLoading } = useNearbyStops(
    coordinates?.lat ?? null,
    coordinates?.lon ?? null
  );
  const { lat: geoLat, lon: geoLon, loading: geoLoading, requestLocation } = useGeolocation();
  const { departuresByStop, errors, loading: deptLoading, refresh, tick } = useDepartures(selectedStops);

  // When geolocation returns, update coordinates
  useEffect(() => {
    if (geoLat !== null && geoLon !== null) {
      setCoordinates({ lat: geoLat, lon: geoLon });
    }
  }, [geoLat, geoLon]);

  const hasSearchResults = coordinates !== null;
  const showInstruction = selectedStops.length === 0 && !hasSearchResults && !stopsLoading;

  return (
    <div className="app">
      <h1 className="app-title">Kollektivt</h1>

      <MyStops stops={selectedStops} onRemoveStop={toggleStop} />

      {deptLoading && selectedStops.length > 0 && (
        <p className="departure-loading">Loading departures...</p>
      )}

      <DepartureList
        stops={selectedStops}
        departuresByStop={departuresByStop}
        errors={errors}
        filters={filters}
        onFiltersChange={(stopId, f) => setFilters(stopId, f)}
        refresh={refresh}
        tick={tick}
      />

      <SearchBar
        onSelectAddress={(lat, lon) => setCoordinates({ lat, lon })}
        onRequestLocation={requestLocation}
        locationLoading={geoLoading}
      />

      {showInstruction && (
        <p className="instruction-text">
          Search for an address or use your location to find nearby stops
        </p>
      )}

      {hasSearchResults && (
        <StopList
          stops={stops}
          isSelected={isSelected}
          onToggleStop={toggleStop}
          loading={stopsLoading}
        />
      )}
    </div>
  );
}

export default App;
