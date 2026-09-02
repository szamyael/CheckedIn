"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type PlaceResult = {
  latitude: number;
  longitude: number;
  label: string;
  displayName: string;
  type: string | null;
};

interface LeafletMapPickerProps {
  latitude: number;
  longitude: number;
  onLocationChange: (coords: {
    latitude: number;
    longitude: number;
    venueName?: string;
  }) => void;
}

function MapClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], Math.max(map.getZoom(), 16), { animate: true });
  }, [lat, lng, map]);
  return null;
}

export function LeafletMapPicker({
  latitude,
  longitude,
  onLocationChange,
}: LeafletMapPickerProps) {
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const center = useMemo(
    () => [latitude, longitude] as [number, number],
    [latitude, longitude],
  );

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function runSearch(query: string) {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `/api/places/search?q=${encodeURIComponent(q)}&limit=8`,
      );
      const data = (await res.json()) as {
        places?: PlaceResult[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "Search failed");
      const places = data.places ?? [];
      setResults(places);
      setShowResults(true);
      if (places.length === 0) {
        setSearchError("No places found. Try a different search.");
      }
    } catch (err) {
      setResults([]);
      setSearchError(
        err instanceof Error
          ? err.message
          : "Could not search places. Check your connection.",
      );
    } finally {
      setSearching(false);
    }
  }

  function onSearchChange(value: string) {
    setSearch(value);
    setSearchError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void runSearch(value), 350);
  }

  function selectPlace(place: PlaceResult) {
    setSearch(place.label);
    setShowResults(false);
    setResults([]);
    onLocationChange({
      latitude: place.latitude,
      longitude: place.longitude,
      venueName: place.label,
    });
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    void (async () => {
      const q = search.trim();
      if (q.length < 2) return;
      setSearching(true);
      setSearchError(null);
      try {
        const res = await fetch(
          `/api/places/search?q=${encodeURIComponent(q)}&limit=8`,
        );
        const data = (await res.json()) as {
          places?: PlaceResult[];
          error?: string;
        };
        if (!res.ok) throw new Error(data.error || "Search failed");
        const places = data.places ?? [];
        setResults(places);
        if (places.length === 0) {
          setShowResults(false);
          setSearchError("No places found. Try a different search.");
          return;
        }
        if (places.length === 1) {
          selectPlace(places[0]);
          return;
        }
        setShowResults(true);
      } catch (err) {
        setResults([]);
        setSearchError(
          err instanceof Error
            ? err.message
            : "Could not search places. Check your connection.",
        );
      } finally {
        setSearching(false);
      }
    })();
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setSearchError("Geolocation is not available in this browser.");
      return;
    }
    setLocating(true);
    setSearchError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocationChange({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLocating(false);
      },
      () => {
        setSearchError("Could not get your current location.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  return (
    <div className="space-y-3">
      <div ref={wrapRef} className="relative">
        <form onSubmit={submitSearch} className="flex flex-wrap gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => {
              if (results.length) setShowResults(true);
            }}
            placeholder="Search place, campus, or address…"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={searching}
            className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            {searching ? "Searching…" : "Search"}
          </button>
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={locating}
            className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            {locating ? "Locating…" : "Use my location"}
          </button>
        </form>

        {showResults && results.length > 0 && (
          <ul className="mt-2 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-md">
            {results.map((place) => (
              <li key={`${place.latitude},${place.longitude},${place.displayName}`}>
                <button
                  type="button"
                  onClick={() => selectPlace(place)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-teal-50"
                >
                  <span className="font-medium text-slate-900">{place.label}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {place.displayName}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {searchError && <p className="text-sm text-red-600">{searchError}</p>}

      <p className="text-xs text-slate-700">
        Search for a place, then pick a result below. You can also click the map
        or drag the pin to fine-tune the check-in center.
      </p>

      <div className="relative z-0 h-64 w-full overflow-hidden rounded-lg border border-slate-200">
        <MapContainer
          center={center}
          zoom={17}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler
            onPick={(lat, lng) =>
              onLocationChange({ latitude: lat, longitude: lng })
            }
          />
          <Recenter lat={latitude} lng={longitude} />
          <Marker
            position={center}
            draggable
            icon={markerIcon}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target as L.Marker;
                const { lat, lng } = marker.getLatLng();
                onLocationChange({ latitude: lat, longitude: lng });
              },
            }}
          />
        </MapContainer>
      </div>
    </div>
  );
}
