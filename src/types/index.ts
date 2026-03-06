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

// Versioned localStorage schema
export interface PersistedData {
  version: number;
  selectedStops: SelectedStop[];
}
