import { NextResponse } from "next/server";

type NominatimHit = {
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
  importance?: number;
};

/**
 * Server-side place search proxy.
 * Nominatim often blocks browser requests (CORS / missing User-Agent);
 * this route searches from the Next.js server with a proper identity.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(Number(searchParams.get("limit") ?? "8") || 8, 12);

  if (q.length < 2) {
    return NextResponse.json(
      { error: "Enter at least 2 characters to search." },
      { status: 400 },
    );
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("q", q);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("addressdetails", "1");
    // Bias toward the Philippines when queries are short / local
    url.searchParams.set("countrycodes", "ph");

    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "CheckedIn-EventLocator/1.0 (campus attendance)",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Place search is temporarily unavailable." },
        { status: 502 },
      );
    }

    const results = (await res.json()) as NominatimHit[];
    const places = results.map((hit) => ({
      latitude: parseFloat(hit.lat),
      longitude: parseFloat(hit.lon),
      label: hit.display_name.split(",")[0]?.trim() || hit.display_name,
      displayName: hit.display_name,
      type: hit.type ?? null,
    }));

    // If PH filter returned nothing, retry worldwide once
    if (places.length === 0) {
      const globalUrl = new URL("https://nominatim.openstreetmap.org/search");
      globalUrl.searchParams.set("format", "json");
      globalUrl.searchParams.set("q", q);
      globalUrl.searchParams.set("limit", String(limit));
      const globalRes = await fetch(globalUrl.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "CheckedIn-EventLocator/1.0 (campus attendance)",
        },
      });
      if (globalRes.ok) {
        const globalHits = (await globalRes.json()) as NominatimHit[];
        return NextResponse.json({
          places: globalHits.map((hit) => ({
            latitude: parseFloat(hit.lat),
            longitude: parseFloat(hit.lon),
            label: hit.display_name.split(",")[0]?.trim() || hit.display_name,
            displayName: hit.display_name,
            type: hit.type ?? null,
          })),
        });
      }
    }

    return NextResponse.json({ places });
  } catch {
    return NextResponse.json(
      { error: "Could not search places. Check your connection." },
      { status: 500 },
    );
  }
}
