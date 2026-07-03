import { createClient } from "@/lib/supabase/server";
import { EventsPageClient } from "@/components/EventsPageClient";
import type { Event } from "@/lib/types";

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("starts_at", { ascending: false });

  return <EventsPageClient events={(events ?? []) as Event[]} />;
}
