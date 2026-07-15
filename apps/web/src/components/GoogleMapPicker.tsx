"use client";

import { useCallback, useRef, useState } from "react";
import {
  Autocomplete,
  GoogleMap,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";

const MAP_LIBRARIES: ("places")[] = ["places"];

interface GoogleMapPickerProps {
  latitude: number;
  longitude: number;
  onLocationChange: (coords: {
    latitude: number;
    longitude: number;
    venueName?: string;
  }) => void;
}

export function GoogleMapPicker({
  latitude,
  longitude,
  onLocationChange,
}: GoogleMapPickerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  const { isLoaded, loadError } = useJsApiLoader({
    id: "checkedin-google-maps",
    googleMapsApiKey: apiKey || "missing",
    libraries: MAP_LIBRARIES,
  });

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [locating, setLocating] = useState(false);

  const position = { lat: latitude, lng: longitude };

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      const lat = e.latLng?.lat();
      const lng = e.latLng?.lng();
      if (lat == null || lng == null) return;
      onLocationChange({ latitude: lat, longitude: lng });
    },
    [onLocationChange],
  );

  const handleMarkerDrag = useCallback(
    (e: google.maps.MapMouseEvent) => {
      const lat = e.latLng?.lat();
      const lng = e.latLng?.lng();
      if (lat == null || lng == null) return;
      onLocationChange({ latitude: lat, longitude: lng });
    },
    [onLocationChange],
  );

  function handlePlaceChanged() {
    const place = autocompleteRef.current?.getPlace();
    const loc = place?.geometry?.location;
    if (!loc) return;
    onLocationChange({
      latitude: loc.lat(),
      longitude: loc.lng(),
      venueName: place.name ?? place.formatted_address ?? undefined,
    });
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocationChange({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  if (!apiKey) {
    return (
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Add <code className="text-xs">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to{" "}
        <code className="text-xs">.env.local</code> (and Vercel) to enable the
        map picker. Enable <strong>Maps JavaScript API</strong> and{" "}
        <strong>Places API</strong> for the key. Campus presets and manual
        coordinates still work.
      </p>
    );
  }

  if (loadError) {
    return (
      <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
        Could not load Google Maps. Check that the API key is valid and that
        Maps JavaScript API and Places API are enabled (with billing if
        required). You can still use campus presets or manual coordinates.
      </p>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700">
        Loading Google Maps…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Autocomplete
          onLoad={(ac) => {
            autocompleteRef.current = ac;
          }}
          onPlaceChanged={handlePlaceChanged}
        >
          <input
            type="text"
            placeholder="Search for a place or address…"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </Autocomplete>
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
        >
          {locating ? "Locating…" : "Use my location"}
        </button>
      </div>

      <p className="text-xs text-slate-700">
        Click the map or drag the pin to set the check-in center.
      </p>

      <GoogleMap
        mapContainerClassName="h-64 w-full rounded-lg border border-slate-200"
        center={position}
        zoom={17}
        onClick={handleMapClick}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        <Marker position={position} draggable onDragEnd={handleMarkerDrag} />
      </GoogleMap>
    </div>
  );
}
