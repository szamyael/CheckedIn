export type UserRole = "admin" | "faculty" | "org_member" | "student";

export type AccountStatus = "pending" | "active" | "disabled";

export type EventStatus = "draft" | "pending_approval" | "published" | "cancelled" | "completed";

export type BadgeType = "event" | "milestone";

export interface User {
  id: string;
  role: UserRole;
  status: AccountStatus;
  email: string | null;
  created_at: string;
}

export interface Student {
  id: string;
  student_id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  program: string;
  year_level: number | null;
}

export interface StaffProfile {
  id: string;
  first_name: string;
  last_name: string;
  department: string | null;
  organization_id: string | null;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  venue_name: string;
  latitude: number;
  longitude: number;
  location_radius_m: number;
  starts_at: string;
  ends_at: string;
  attendance_starts_at: string;
  attendance_ends_at: string;
  qr_expires_at: string | null;
  status: EventStatus;
  qr_token: string;
  requires_otp?: boolean;
  qr_rotated_at?: string | null;
  created_by: string;
  organization_id: string | null;
}

export interface AttendanceRecord {
  id: string;
  event_id: string;
  student_id: string;
  checked_in_at: string;
  latitude: number;
  longitude: number;
  selfie_url: string;
  status: string;
  distance_from_venue_m: number | null;
  students?: Student;
}

export interface StudentAchievement {
  id: string;
  student_id: string;
  event_id: string | null;
  badge_name: string;
  badge_type: BadgeType;
  earned_at: string;
}

export interface BadgeDefinition {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  badge_type: BadgeType;
  milestone_threshold: number | null;
}
