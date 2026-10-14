"use client";

import { Circle, CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";

function FitLocationBounds({ venueLatitude, venueLongitude, scanLatitude, scanLongitude, radiusMeters, accuracyMeters }: { venueLatitude: number; venueLongitude: number; scanLatitude: number; scanLongitude: number; radiusMeters: number; accuracyMeters: number | null }) {
  const map = useMap();
  useEffect(() => {
    const latPadding = (radiusMeters + (accuracyMeters ?? 0)) / 111_000;
    const lngPadding = latPadding / Math.max(Math.cos((venueLatitude * Math.PI) / 180), 0.1);
    const bounds: [[number, number], [number, number]] = [
      [
        Math.min(venueLatitude, scanLatitude) - latPadding,
        Math.min(venueLongitude, scanLongitude) - lngPadding,
      ],
      [
        Math.max(venueLatitude, scanLatitude) + latPadding,
        Math.max(venueLongitude, scanLongitude) + lngPadding,
      ],
    ];
    let frameId: number | undefined;
    map.whenReady(() => {
      frameId = window.requestAnimationFrame(() => {
        const container = map.getContainer();
        if (!container.isConnected) return;
        map.invalidateSize({ animate: false });
        map.fitBounds(bounds, { padding: [24, 24], animate: false });
      });
    });
    return () => {
      if (frameId !== undefined) window.cancelAnimationFrame(frameId);
    };
  }, [map, venueLatitude, venueLongitude, scanLatitude, scanLongitude, radiusMeters, accuracyMeters]);
  return null;
}

export function AttendanceLocationMap({ venueLatitude, venueLongitude, scanLatitude, scanLongitude, radiusMeters, accuracyMeters }: { venueLatitude: number; venueLongitude: number; scanLatitude: number; scanLongitude: number; radiusMeters: number; accuracyMeters: number | null }) {
  const center: [number, number] = [venueLatitude, venueLongitude];
  return <MapContainer center={center} zoom={13} scrollWheelZoom className="h-80 w-full"><FitLocationBounds venueLatitude={venueLatitude} venueLongitude={venueLongitude} scanLatitude={scanLatitude} scanLongitude={scanLongitude} radiusMeters={radiusMeters} accuracyMeters={accuracyMeters} /><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><Circle center={center} radius={radiusMeters} pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.12 }} /><CircleMarker center={center} radius={8} pathOptions={{ color: "#1d4ed8", fillColor: "#2563eb", fillOpacity: 1 }}><Tooltip permanent direction="top">Venue center</Tooltip></CircleMarker>{accuracyMeters != null && <Circle center={[scanLatitude, scanLongitude]} radius={accuracyMeters} pathOptions={{ color: "#fb7185", fillColor: "#fda4af", fillOpacity: 0.2, dashArray: "4 4" }} />}<CircleMarker center={[scanLatitude, scanLongitude]} radius={8} pathOptions={{ color: "#be123c", fillColor: "#f43f5e", fillOpacity: 1 }}><Tooltip permanent direction="bottom">Student scan</Tooltip></CircleMarker></MapContainer>;
}
