import { redirect } from "next/navigation";
import { DashboardPageHeader } from "@/components/DashboardUi";
import { StaffProfileForm } from "@/components/StaffProfileForm";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userProfile, error: userError } = await supabase
    .from("users")
    .select("role, email")
    .eq("id", user.id)
    .single();
  if (userError) throw new Error(userError.message);

  const role = userProfile.role as UserRole;
  if (role !== "admin" && role !== "faculty" && role !== "org_member") {
    redirect("/dashboard");
  }

  const { data: hasAdminPersonalCode, error: codeError } = role === "admin"
    ? await supabase.rpc("has_admin_personal_code")
    : { data: false, error: null };
  if (codeError) throw new Error(codeError.message);

  const { data: profile, error: profileError } = await supabase
    .from("staff_profiles")
    .select("first_name, middle_name, last_name, profile_photo_url")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) throw new Error(profileError.message);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="ACCOUNT"
        title="Edit profile"
        description="Update your profile details, avatar, email, or password."
      />
      <StaffProfileForm
        email={user.email ?? userProfile.email ?? ""}
        userId={user.id}
        profile={profile}
        isAdmin={role === "admin"}
        hasAdminPersonalCode={hasAdminPersonalCode === true}
      />
    </div>
  );
}
