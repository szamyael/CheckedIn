"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { CAMPUS_LOCATIONS, DEFAULT_MAP_CENTER } from "@/lib/campus-locations";

const GoogleMapPicker = dynamic(
  () =>
    import("@/components/GoogleMapPicker").then((m) => m.GoogleMapPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700">
        Loading map…
      </div>
    ),
  },
);

function findPresetMatch(latitude: number, longitude: number) {
  for (const campus of CAMPUS_LOCATIONS) {
    for (const building of campus.buildings) {
      if (
        Math.abs(building.latitude - latitude) < 0.00001 &&
        Math.abs(building.longitude - longitude) < 0.00001
      ) {
        return { campusId: campus.id, buildingId: building.id };
      }
    }
  }
  return null;
}

export type LocationMode = "preset" | "map" | "manual";

export interface EventLocation {
  venueName: string;
  latitude: number;
  longitude: number;
}

interface EventLocationPickerProps {
  value: EventLocation;
  onChange: (value: EventLocation) => void;
  compact?: boolean;
}

export function EventLocationPicker({
  value,
  onChange,
  compact = false,
}: EventLocationPickerProps) {
  const initialMatch = findPresetMatch(value.latitude, value.longitude);
  const [mode, setMode] = useState<LocationMode>("preset");
  const [campusId, setCampusId] = useState(
    initialMatch?.campusId ?? CAMPUS_LOCATIONS[0]?.id ?? "",
  );
  const [buildingId, setBuildingId] = useState(initialMatch?.buildingId ?? "");

  const selectedCampus =
    CAMPUS_LOCATIONS.find((c) => c.id === campusId) ?? CAMPUS_LOCATIONS[0];
  const buildings = selectedCampus?.buildings ?? [];

  function switchToPreset() {
    setMode("preset");
    const match = findPresetMatch(value.latitude, value.longitude);
    if (match) {
      setCampusId(match.campusId);
      setBuildingId(match.buildingId);
      return;
    }
    const campus = CAMPUS_LOCATIONS.find((c) => c.id === campusId) ?? CAMPUS_LOCATIONS[0];
    const first = campus?.buildings[0];
    if (first) selectBuilding(campus!.id, first.id);
  }

  function selectBuilding(campus: string, building: string) {
    setCampusId(campus);
    setBuildingId(building);
    const campusData = CAMPUS_LOCATIONS.find((c) => c.id === campus);
    const b = campusData?.buildings.find((x) => x.id === building);
    if (!b) return;
    onChange({
      venueName: value.venueName || b.venueName,
      latitude: b.latitude,
      longitude: b.longitude,
    });
  }

  const tabClass = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm ${
      active
        ? "bg-blue-600 text-white"
        : "border border-slate-300 text-slate-700 hover:bg-slate-50"
    }`;

  const inputClass = compact
    ? "w-full rounded border border-slate-300 px-2 py-1 text-sm"
    : "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-900">Event location</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={tabClass(mode === "preset")}
            onClick={switchToPreset}
          >
            Campus preset
          </button>
          <button
            type="button"
            className={tabClass(mode === "map")}
            onClick={() => setMode("map")}
          >
            Map pin
          </button>
          <button
            type="button"
            className={tabClass(mode === "manual")}
            onClick={() => setMode("manual")}
          >
            Manual
          </button>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-800">Venue name</label>
        <input
          type="text"
          required
          value={value.venueName}
          onChange={(e) =>
            onChange({ ...value, venueName: e.target.value })
          }
          placeholder="e.g. University Gymnasium"
          className={inputClass}
        />
      </div>

      {mode === "preset" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Campus</label>
            <select
              value={campusId}
              onChange={(e) => {
                const nextCampus = e.target.value;
                setCampusId(nextCampus);
                setBuildingId("");
                const first = CAMPUS_LOCATIONS.find(
                  (c) => c.id === nextCampus,
                )?.buildings[0];
                if (first) selectBuilding(nextCampus, first.id);
              }}
              className={inputClass}
            >
              {CAMPUS_LOCATIONS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Building / area</label>
            <select
              value={buildingId}
              onChange={(e) => selectBuilding(campusId, e.target.value)}
              className={inputClass}
            >
              <option value="">Select a location…</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {mode === "map" && (
        <GoogleMapPicker
          latitude={value.latitude || DEFAULT_MAP_CENTER.lat}
          longitude={value.longitude || DEFAULT_MAP_CENTER.lng}
          onLocationChange={({ latitude, longitude, venueName }) => {
            onChange({
              venueName: venueName ?? value.venueName,
              latitude,
              longitude,
            });
          }}
        />
      )}

      {mode === "manual" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Latitude</label>
            <input
              type="number"
              step="any"
              required
              value={value.latitude}
              onChange={(e) =>
                onChange({
                  ...value,
                  latitude: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="14.5995"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Longitude</label>
            <input
              type="number"
              step="any"
              required
              value={value.longitude}
              onChange={(e) =>
                onChange({
                  ...value,
                  longitude: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="120.9842"
              className={inputClass}
            />
          </div>
        </div>
      )}

      <p className="text-xs text-slate-700">
        Coordinates: {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
      </p>
    </div>
  );
}
