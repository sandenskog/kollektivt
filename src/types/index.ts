// SL Transport API site shape
export interface SLSite {
  id: number;
  name: string;
  lat: number;
  lon: number;
  stop_areas?: { id: number; name: string }[];
}

// Nominatim search result
export interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

// A stop with computed distance (from findNearbyStops)
export interface NearbyStop extends SLSite {
  distance: number; // meters
}

// What gets persisted to localStorage
export interface SelectedStop {
  id: number;
  name: string;
  lat: number;
  lon: number;
}

// SL Transport API departure shape
export interface Departure {
  destination: string;
  direction_code: number;
  direction: string;
  state: 'EXPECTED' | 'ATSTOP' | 'CANCELLED';
  display: string;
  scheduled: string;
  expected: string;
  journey: { id: number; state: string; prediction_state: string };
  stop_area: { id: number; name: string; type: string };
  stop_point: { id: number; name: string; designation: string };
  line: {
    id: number;
    designation: string;
    transport_mode: 'BUS' | 'METRO' | 'TRAIN' | 'TRAM';
    group_of_lines: string;
  };
  deviations: Array<{
    importance_level: number;
    consequence: string;
    message: string;
  }>;
}

// Stop-level disruption/deviation
export interface StopDeviation {
  id: number;
  importance_level: number;
  message: string;
  scope: {
    stop_areas: Array<{ id: number; name: string }>;
    lines: Array<{ id: number; designation: string; transport_mode: string }>;
  };
}

// Response from /v1/sites/{siteId}/departures
export interface DepartureResponse {
  departures: Departure[];
  stop_deviations: StopDeviation[];
}

// Per-stop filter preferences
export interface StopFilters {
  directions?: number[];
  lines?: number[];
}

// Versioned localStorage schema
export interface PersistedData {
  version: number;
  selectedStops: SelectedStop[];
  filters?: Record<number, StopFilters>;
}
