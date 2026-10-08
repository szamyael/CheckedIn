"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Award, CalendarDays, Camera, ChevronRight, Pencil } from "lucide-react";
import { format, parseISO } from "date-fns";
import { formatStudentDisplayName } from "@/lib/student/display-name";
import { createClient } from "@/lib/supabase/client";
import {
  StudentEmptyState,
} from "@/components/student/StudentUi";

type Achievement = {
  id: string;
  badge_name: string;
  earned_at: string;
  image_url?: string | null;
};
type ProfileBorderId = "classic" | "aurora" | "ember" | "royal" | "celestial";
type OrgBadgeAward = {
  id: string;
  earned_at: string;
  org_badges:
    | { name: string; image_url: string | null }
    | { name: string; image_url: string | null }[]
    | null;
};
const PROFILE_BORDERS: {
  id: Exclude<ProfileBorderId, "classic">;
  name: string;
  description: string;
  cost: number;
  color: string;
}[] = [
  { id: "aurora", name: "Aurora", description: "Cool teal and violet shimmer", cost: 100, color: "#6ee7d2" },
  { id: "ember", name: "Ember", description: "Warm copper glow", cost: 150, color: "#fb923c" },
  { id: "royal", name: "Royal", description: "Deep violet and gold", cost: 250, color: "#a78bfa" },
  { id: "celestial", name: "Celestial", description: "A bright golden halo", cost: 500, color: "#facc15" },
];
type HistoryRow = {
  id: string;
  status: string;
  checked_in_at: string;
  events: { title: string } | null;
};

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<{
    student_id: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    name_extension: string | null;
    program: string;
    year_level: number;
    section: string | null;
    reward_points: number;
    profile_photo_url: string | null;
    equipped_profile_border: ProfileBorderId;
  } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [badges, setBadges] = useState<Achievement[]>([]);
  const [ownedBorders, setOwnedBorders] = useState<ProfileBorderId[]>([]);
  const [borderAction, setBorderAction] = useState<string | null>(null);
  const [borderError, setBorderError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);

  async function uploadAvatar(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const extension = file.type === "image/png" ? "png" : "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("student-ids").upload(path, file, { contentType: file.type });
    if (uploadError) return;
    const { error: updateError } = await supabase.from("students").update({ profile_photo_url: path }).eq("id", user.id);
    if (updateError) return;
    const { data: signed } = await supabase.storage.from("student-ids").createSignedUrl(path, 3600);
    setAvatarUrl(signed?.signedUrl ?? null);
    setProfile((current) => current ? { ...current, profile_photo_url: path } : current);
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: student } = await supabase
        .from("students")
        .select(
          "student_id, first_name, middle_name, last_name, name_extension, program, year_level, section, reward_points, profile_photo_url, equipped_profile_border",
        )
        .eq("id", user.id)
        .single();
      setProfile(student);

      const { data: borderRows, error: borderError } = await supabase
        .from("student_profile_borders")
        .select("border_id")
        .eq("student_id", user.id);
      if (borderError) throw borderError;
      setOwnedBorders((borderRows ?? []).map((row) => row.border_id as ProfileBorderId));

      if (student?.profile_photo_url) {
        const { data: signed } = await supabase.storage
          .from("student-ids")
          .createSignedUrl(student.profile_photo_url, 3600);
        setAvatarUrl(signed?.signedUrl ?? null);
      }

      const [achievementResult, orgBadgeResult] = await Promise.all([
        supabase
          .from("student_achievements")
          .select("id, badge_name, earned_at")
          .eq("student_id", user.id),
        supabase
          .from("student_org_badges")
          .select("id, earned_at, org_badges(name, image_url)")
          .eq("student_id", user.id),
      ]);
      if (achievementResult.error) throw achievementResult.error;
      if (orgBadgeResult.error) throw orgBadgeResult.error;

      const orgBadgeRows = (orgBadgeResult.data ?? []) as unknown as OrgBadgeAward[];
      const orgBadges = orgBadgeRows.map((award) => {
        const badge = award.org_badges;
        const badgeName = Array.isArray(badge) ? badge[0]?.name : badge?.name;
        const badgeImage = Array.isArray(badge) ? badge[0]?.image_url : badge?.image_url;
        return {
          id: award.id,
          badge_name: badgeName ?? "Badge",
          earned_at: award.earned_at,
          image_url: badgeImage,
        };
      });
      setBadges(
        [...((achievementResult.data as Achievement[] | null) ?? []), ...orgBadges]
          .sort((a, b) => Date.parse(b.earned_at) - Date.parse(a.earned_at)),
      );

      const { data: hist } = await supabase
        .from("attendance_records")
        .select("id, status, checked_in_at, events(title)")
        .eq("student_id", user.id)
        .order("checked_in_at", { ascending: false })
        .limit(20);
      setHistory((hist as unknown as HistoryRow[]) ?? []);
    }
    void load().catch((error: unknown) => {
      setLoadError(error instanceof Error ? error.message : "Could not load profile.");
    });
  }, []);

  async function redeemBorder(borderId: Exclude<ProfileBorderId, "classic">) {
    setBorderAction(borderId);
    setBorderError(null);
    try {
      const { data, error } = await createClient().rpc("redeem_student_profile_border", {
        p_border_id: borderId,
      });
      if (error) throw error;
      const result = data as { points_remaining: number };
      setOwnedBorders((current) => [...current, borderId]);
      setProfile((current) => current
        ? { ...current, reward_points: result.points_remaining }
        : current);
    } catch (error) {
      setBorderError(error instanceof Error ? error.message : "Could not redeem this border.");
    } finally {
      setBorderAction(null);
    }
  }

  async function equipBorder(borderId: ProfileBorderId) {
    setBorderAction(borderId);
    setBorderError(null);
    try {
      const { error } = await createClient().rpc("equip_student_profile_border", {
        p_border_id: borderId,
      });
      if (error) throw error;
      setProfile((current) => current
        ? { ...current, equipped_profile_border: borderId }
        : current);
    } catch (error) {
      setBorderError(error instanceof Error ? error.message : "Could not equip this border.");
    } finally {
      setBorderAction(null);
    }
  }

  if (loadError) {
    return <p role="alert" className="text-sm text-red-600">Could not load profile: {loadError}</p>;
  }

  if (!profile) {
    return <p className="text-sm text-slate-500">Loading profile…</p>;
  }

  const initials =
    `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase() ||
    "?";

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <header><p className="text-xs font-semibold tracking-[0.14em] text-[#697178]">STUDENT RECORD</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#0c2238]">Profile &amp; rewards</h1></header>
      <section className="border border-[#0c2238] p-6 shadow-sm" style={{ backgroundColor: "#17324D", color: "#FFFFFF" }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="relative shrink-0 rounded-full p-1" style={{ boxShadow: `0 0 0 3px ${PROFILE_BORDERS.find((border) => border.id === profile.equipped_profile_border)?.color ?? "#d99b32"}` }}>{avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="h-16 w-16 rounded-full object-cover ring-2 ring-[#c18a2e]"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e7eef4] text-lg font-bold text-[#17324d]">
                {initials}
              </div>
            )}<button type="button" onClick={() => avatarInput.current?.click()} className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-[#17324d] bg-[#c18a2e] text-white" aria-label="Upload profile photo"><Camera size={14} /></button><input ref={avatarInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => void uploadAvatar(event.target.files?.[0] ?? null)} /></div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: "#FFFFFF" }}>
                {formatStudentDisplayName(profile)}
              </h2>
              <p className="text-sm" style={{ color: "#D7E2EC" }}>{profile.student_id}</p>
              <p className="mt-1 text-sm" style={{ color: "#D7E2EC" }}>
                {profile.program} · Year {profile.year_level}
                {profile.section ? ` · ${profile.section}` : ""}
              </p>
              <p className="mt-2 text-sm font-medium" style={{ color: "#F0C46D" }}>
                {profile.reward_points} reward points
              </p>
            </div>
          </div>
          <Link
            href="/student/profile/edit"
            className="inline-flex items-center gap-1.5 border px-3 py-2 text-xs font-semibold hover:bg-white/10" style={{ borderColor: "rgba(255,255,255,.45)", color: "#FFFFFF" }}
          >
            <Pencil size={13} /> Edit
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--primary-strong)]">Customize your profile</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Unlock a permanent avatar border with reward points.</p>
          </div>
          <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-sm font-semibold text-[var(--primary-strong)]">
            {profile.reward_points} points
          </span>
        </div>
        {borderError && <p role="alert" className="mt-3 text-sm text-red-700">{borderError}</p>}
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {PROFILE_BORDERS.map((border) => {
            const owned = ownedBorders.includes(border.id);
            const equipped = profile.equipped_profile_border === border.id;
            return (
              <li key={border.id} className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--surface-muted)] p-1">
                  <span className="grid h-full w-full place-items-center rounded-full border-[3px] text-xs font-bold text-[var(--primary-strong)]" style={{ borderColor: border.color }}>
                    CI
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[var(--foreground)]">{border.name}</span>
                  <span className="block text-xs text-[var(--muted)]">{border.description}</span>
                  <span className="mt-1 block text-xs font-semibold text-[var(--primary)]">{owned ? "Unlocked" : `${border.cost} points`}</span>
                </span>
                {equipped ? (
                  <span className="text-xs font-semibold text-[var(--primary)]">Equipped</span>
                ) : owned ? (
                  <button type="button" disabled={borderAction !== null} onClick={() => void equipBorder(border.id)} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--primary-strong)] disabled:opacity-50">
                    {borderAction === border.id ? "Saving…" : "Equip"}
                  </button>
                ) : (
                  <button type="button" disabled={borderAction !== null || profile.reward_points < border.cost} onClick={() => void redeemBorder(border.id)} className="rounded-lg bg-[var(--primary)] px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                    {borderAction === border.id ? "Unlocking…" : "Unlock"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        {profile.equipped_profile_border !== "classic" && (
          <button type="button" disabled={borderAction !== null} onClick={() => void equipBorder("classic")} className="mt-3 text-sm font-semibold text-[var(--muted)] underline disabled:opacity-50">
            Use classic border
          </button>
        )}
      </section>

      <section id="rewards" className="border-t border-[#e2e5e7] pt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-[#0c2238]"><Award size={18} className="text-[#a46618]" />Rewards &amp; recognition</h2>
          <span className="border border-[#d9c38d] bg-[#fffaf0] px-2.5 py-1 text-xs font-semibold text-[#a46618]">{profile.reward_points} points</span>
        </div>
        {badges.length === 0 ? (
          <StudentEmptyState message="No badges yet. Check in to events to earn them!" />
        ) : (
          <ul className="space-y-2">
            {(showAllBadges ? badges : badges.slice(0, 1)).map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between border border-[#e2e5e7] bg-white px-4 py-3 text-sm"
              >
                <span className="flex min-w-0 items-center gap-3">
                  {b.image_url ? (
                    <img
                      src={b.image_url}
                      alt={`${b.badge_name} icon`}
                      className="h-10 w-10 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-amber-50 text-lg"
                    >
                      🏅
                    </span>
                  )}
                  <span className="truncate font-medium text-[#0c2238]">{b.badge_name}</span>
                </span>
                <span className="shrink-0 text-xs text-[#697178]">{format(parseISO(b.earned_at), "MMM d, yyyy")}</span>
              </li>
            ))}
          </ul>
        )}
        {badges.length > 1 && <button type="button" onClick={() => setShowAllBadges((current) => !current)} className="mt-3 text-sm font-semibold text-[#17324d] hover:underline">{showAllBadges ? "Show recent only" : `View all ${badges.length} awards`}</button>}
      </section>

      <section className="border-t border-[#e2e5e7] pt-6">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-[#0c2238]"><CalendarDays size={18} className="text-[#17324d]" />Attendance history</h2>
        {history.length === 0 ? (
          <StudentEmptyState message="No attendance records yet." />
        ) : (
          <ul className="space-y-2">
            {(showAllHistory ? history : history.slice(0, 1)).map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between border border-[#e2e5e7] bg-white px-4 py-3 text-sm"
              >
                <div><p className="font-medium text-[#0c2238]">{h.events?.title ?? "Event"}</p>
                <p className="text-xs text-slate-500">
                  {format(parseISO(h.checked_in_at), "MMM d, yyyy • h:mm a")} ·{" "}
                  {h.status.replace("_", " ")}
                </p></div><ChevronRight size={17} className="text-[#697178]" />
              </li>
            ))}
          </ul>
        )}
        {history.length > 1 && <button type="button" onClick={() => setShowAllHistory((current) => !current)} className="mt-3 text-sm font-semibold text-[#17324d] hover:underline">{showAllHistory ? "Show recent only" : `View all ${history.length} attendance records`}</button>}
      </section>
    </div>
  );
}
