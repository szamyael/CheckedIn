"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { UserRound } from "@/lib/icons";
import { createClient } from "@/lib/supabase/client";

export function NotificationSender({
  name,
  role,
  organizationName,
  avatarPath,
}: {
  name?: string | null;
  role?: string | null;
  organizationName?: string | null;
  avatarPath?: string | null;
}) {
  const [avatar, setAvatar] = useState<{ path: string; url: string } | null>(null);

  useEffect(() => {
    if (!avatarPath) return;

    let cancelled = false;
    void createClient().storage
      .from("profile-avatars")
      .createSignedUrl(avatarPath, 3600)
      .then(({ data, error }) => {
        if (error) throw new Error(error.message);
        if (!cancelled) setAvatar({ path: avatarPath, url: data.signedUrl });
      })
      .catch((error: unknown) => {
        console.error("Unable to load notification sender avatar.", error);
      });

    return () => {
      cancelled = true;
    };
  }, [avatarPath]);

  if (!name) return null;

  const avatarUrl = avatar && avatar.path === avatarPath ? avatar.url : null;
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const roleLabel = role === "org_member"
    ? "Organization member"
    : role === "admin"
      ? "Administrator"
      : role === "faculty"
        ? "Faculty"
        : role;
  const subtitle = [organizationName, roleLabel].filter(Boolean).join(" · ");

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {avatarUrl
        ? <Image src={avatarUrl} alt="" width={36} height={36} unoptimized className="h-9 w-9 shrink-0 rounded-full object-cover" />
        : <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-teal-50 text-xs font-semibold text-teal-800">{initials || <UserRound className="h-4 w-4" />}</span>}
      <span className="min-w-0">
        <span className="block truncate text-xs font-semibold text-slate-800">{name}</span>
        {subtitle && <span className="block truncate text-[10px] text-slate-500">{subtitle}</span>}
      </span>
    </div>
  );
}
