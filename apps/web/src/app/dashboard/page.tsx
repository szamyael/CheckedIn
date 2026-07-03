import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

const ROLE_HOME: Record<UserRole, string> = {
  admin: "/dashboard/admin",
  faculty: "/dashboard/faculty",
  org_member: "/dashboard/org",
  student: "/login",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile?.role) redirect("/login");

  const role = profile.role as UserRole;
  redirect(ROLE_HOME[role] ?? "/dashboard/faculty");
}
