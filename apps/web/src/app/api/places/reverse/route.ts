import { NextResponse } from "next/server";

type NominatimReverseHit = {
  display_name?: string;
  name?: string;
};

/** Resolves a map pin to a readable address before an event is saved. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return NextResponse.json({ error: "Valid latitude and longitude are required." }, { status: 400 });
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "json");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
    url.searchParams.set("zoom", "18");
    url.searchParams.set("addressdetails", "1");

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "CheckedIn-EventLocator/1.0 (campus attendance)",
      },
      next: { revalidate: 0 },
    });
    if (!response.ok) {
      return NextResponse.json({ error: "Address lookup is temporarily unavailable." }, { status: 502 });
    }

    const place = (await response.json()) as NominatimReverseHit;
    const displayName = place.display_name?.trim();
    return NextResponse.json({
      label: place.name?.trim() || displayName?.split(",")[0]?.trim() || "",
      displayName: displayName ?? "",
    });
  } catch {
    return NextResponse.json({ error: "Could not fetch an address. Check your connection." }, { status: 500 });
  }
}
