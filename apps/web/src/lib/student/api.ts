"use client";

import { useLoader } from "@/components/LoaderProvider";
import { createClient } from "@/lib/supabase/client";

export async function resolveStudentEmail(studentId: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke(
    "student-resolve-email",
    { body: { student_id: studentId } },
  );
  if (error) throw new Error(error.message || "Could not resolve student email");
  const email = (data as { email?: string; error?: string })?.email;
  if (!email) {
    throw new Error(
      (data as { error?: string })?.error || "Student account not found",
    );
  }
  return email;
}

export function useStudentLoader() {
  return useLoader();
}

export type StudentProfile = {
  id: string;
  student_id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  program: string;
  year_level: number;
  section: string | null;
  reward_points: number;
  status?: string;
};

export type StudentEvent = {
  id: string;
  title: string;
  description: string | null;
  venue_name: string | null;
  starts_at: string;
  ends_at: string;
  attendance_starts_at: string | null;
  attendance_ends_at: string | null;
  latitude: number | null;
  longitude: number | null;
  location_radius_m: number | null;
  requires_otp: boolean | null;
  status: string;
};

export type CheckInMeta = {
  id?: string;
  title?: string;
  requires_otp?: boolean;
  can_check_out?: boolean;
  already_checked_out?: boolean;
  my_attendance_status?: string | null;
  location_ok?: boolean;
  distance_m?: number;
  allowed_radius_m?: number;
  error?: string;
  venue_name?: string;
  latitude?: number;
  longitude?: number;
  location_radius_m?: number;
};
