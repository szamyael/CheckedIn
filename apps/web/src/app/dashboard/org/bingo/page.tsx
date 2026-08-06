import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrgBingoManager } from "@/components/bingo/OrgBingoManager";

export default async function OrgBingoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (profile?.role !== "org_member" && profile?.role !== "admin") {
    redirect("/dashboard");
  }

  let organizationId: string | null = null;

  if (profile?.role === "admin") {
    const { data: orgs } = await supabase
      .from("organizations")
      .select("id")
      .limit(1);
    organizationId = orgs?.[0]?.id ?? null;
  } else {
    const { data: staff } = await supabase
      .from("staff_profiles")
      .select("organization_id")
      .eq("id", user!.id)
      .single();
    organizationId = staff?.organization_id ?? null;
  }

  if (!organizationId) {
    return (
      <p className="text-sm text-slate-600">
        No organization is linked to this account. Ask an admin to assign you to
        an organization.
      </p>
    );
  }

  return <OrgBingoManager organizationId={organizationId} />;
}
