"use client";

import { useEffect, useMemo, useState } from "react";
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
    map.setView([lat, lng], map.getZoom(), { animate: true });
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

  const center = useMemo(
    () => [latitude, longitude] as [number, number],
    [latitude, longitude],
  );

  async function searchPlace(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    setSearching(true);
    setSearchError(null);
    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("format", "json");
      url.searchParams.set("q", q);
      url.searchParams.set("limit", "1");
      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Search failed");
      const results = (await res.json()) as Array<{
        lat: string;
        lon: string;
        display_name: string;
      }>;
      if (!results.length) {
        setSearchError("No places found. Try a different search.");
        return;
      }
      const hit = results[0];
      onLocationChange({
        latitude: parseFloat(hit.lat),
        longitude: parseFloat(hit.lon),
        venueName: hit.display_name.split(",")[0]?.trim() || undefined,
      });
    } catch {
      setSearchError("Could not search places. Check your connection.");
    } finally {
      setSearching(false);
    }
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
      <form onSubmit={searchPlace} className="flex flex-wrap gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search place or address…"
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

      {searchError && (
        <p className="text-sm text-red-600">{searchError}</p>
      )}

      <p className="text-xs text-slate-700">
        Click the map or drag the pin to set the check-in center. Powered by
        OpenStreetMap (no Google API key required).
      </p>

      <div className="h-64 w-full overflow-hidden rounded-lg border border-slate-200">
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
