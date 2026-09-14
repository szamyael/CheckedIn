"use client";

import { Circle, CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export function AttendanceLocationMap({ venueLatitude, venueLongitude, scanLatitude, scanLongitude, radiusMeters }: { venueLatitude: number; venueLongitude: number; scanLatitude: number; scanLongitude: number; radiusMeters: number }) {
  const center: [number, number] = [venueLatitude, venueLongitude];
  return <MapContainer center={center} zoom={18} scrollWheelZoom className="h-80 w-full"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><Circle center={center} radius={radiusMeters} pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.12 }} /><CircleMarker center={center} radius={8} pathOptions={{ color: "#1d4ed8", fillColor: "#2563eb", fillOpacity: 1 }}><Tooltip permanent direction="top">Venue center</Tooltip></CircleMarker><CircleMarker center={[scanLatitude, scanLongitude]} radius={8} pathOptions={{ color: "#be123c", fillColor: "#f43f5e", fillOpacity: 1 }}><Tooltip permanent direction="bottom">Student scan</Tooltip></CircleMarker></MapContainer>;
}
