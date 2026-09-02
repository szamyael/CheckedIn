import { createClient } from "@/lib/supabase/server";
import { EventsPageClient } from "@/components/EventsPageClient";
import type { Event } from "@/lib/types";

export default async function EventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user!.id)
    .single();

  const canCreate =
    profile?.role === "org_member" || profile?.role === "admin";

  let organizationId: string | null = null;
  if (canCreate) {
    const { data: staff } = await supabase
      .from("staff_profiles")
      .select("organization_id")
      .eq("id", user!.id)
      .maybeSingle();
    organizationId = staff?.organization_id ?? null;
  }

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("starts_at", { ascending: false });

  return (
    <EventsPageClient
      events={(events ?? []) as Event[]}
      canCreate={canCreate}
      organizationId={organizationId}
    />
  );
}
