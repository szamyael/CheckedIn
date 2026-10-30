"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, LoaderCircle } from "@/lib/icons";
import { PasswordRequirements, passwordRules } from "@/components/PasswordRequirements";
import { createClient } from "@/lib/supabase/client";
import { UserErrorDialog } from "@/components/UserErrorDialog";

type ProfileFields = {
  first_name: string;
  middle_name: string | null;
  last_name: string;
  profile_photo_url: string | null;
};
type CredentialAction = "email" | "password";

export function StaffProfileForm({
  email,
  userId,
  profile,
  isAdmin = false,
  hasAdminPersonalCode = false,
}: {
  email: string;
  userId: string;
  profile: ProfileFields | null;
  isAdmin?: boolean;
  hasAdminPersonalCode?: boolean;
}) {
  const [firstName, setFirstName] = useState(profile?.first_name ?? "");
  const [middleName, setMiddleName] = useState(profile?.middle_name ?? "");
  const [lastName, setLastName] = useState(profile?.last_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [currentEmail] = useState(email);
  const [newEmail, setNewEmail] = useState(email);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [credentialAction, setCredentialAction] = useState<CredentialAction | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [credentialMessage, setCredentialMessage] = useState<string | null>(null);
  const [credentialError, setCredentialError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingCredential, setSavingCredential] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [adminPersonalCode, setAdminPersonalCode] = useState("");
  const [confirmAdminPersonalCode, setConfirmAdminPersonalCode] = useState("");
  const [adminCodeMessage, setAdminCodeMessage] = useState<string | null>(null);
  const [adminCodeError, setAdminCodeError] = useState<string | null>(null);
  const [savingAdminCode, setSavingAdminCode] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile?.profile_photo_url) return;
    let cancelled = false;
    const supabase = createClient();

    void supabase.storage
      .from("profile-avatars")
      .createSignedUrl(profile.profile_photo_url, 3600)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setAvatarError(error.message);
        else setAvatarUrl(data.signedUrl);
      });

    return () => {
      cancelled = true;
    };
  }, [profile?.profile_photo_url]);

  async function updateProfile(values: Partial<ProfileFields>) {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw new Error(userError.message);
    if (!user) throw new Error("Your session has expired. Sign in again to update your profile.");

    const result = await supabase
      .from("staff_profiles")
      .update(values)
      .eq("id", user.id)
      .select("id")
      .maybeSingle();
    if (result.error) throw new Error(result.error.message);
    if (!result.data) throw new Error("Your profile could not be updated. Refresh and try again.");
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError(null);
    setProfileMessage(null);
    if (!firstName.trim() || !lastName.trim()) {
      setProfileError("First name and last name are required.");
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile({
        first_name: firstName.trim(),
        middle_name: middleName.trim() || null,
        last_name: lastName.trim(),
      });
      setProfileMessage("Profile details saved.");
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Unable to save profile details.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveAdminPersonalCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAdminCodeError(null);
    setAdminCodeMessage(null);
    if (!/^\d{6}$/.test(adminPersonalCode)) {
      setAdminCodeError("Enter exactly six digits.");
      return;
    }
    if (adminPersonalCode !== confirmAdminPersonalCode) {
      setAdminCodeError("The codes do not match.");
      return;
    }

    setSavingAdminCode(true);
    try {
      const { data, error } = await createClient().rpc("set_admin_personal_code", {
        p_code: adminPersonalCode,
      });
      if (error) throw new Error(error.message);
      if (data !== true) throw new Error("Your personal code could not be saved.");
      setAdminPersonalCode("");
      setConfirmAdminPersonalCode("");
      setAdminCodeMessage("Admin account creation code saved.");
    } catch (error) {
      setAdminCodeError(error instanceof Error ? error.message : "Unable to save your personal code.");
    } finally {
      setSavingAdminCode(false);
    }
  }

  async function uploadAvatar(file: File | null) {
    if (!file) return;
    setAvatarError(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setAvatarError("Choose a JPG, PNG, or WebP image up to 5 MB.");
      return;
    }

    setSavingAvatar(true);
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error(userError.message);
      if (!user) throw new Error("Your session has expired. Sign in again to change your avatar.");

      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-avatars")
        .upload(path, file, { contentType: file.type });
      if (uploadError) throw new Error(uploadError.message);

      await updateProfile({ profile_photo_url: path });

      const { data, error: signedUrlError } = await supabase.storage
        .from("profile-avatars")
        .createSignedUrl(path, 3600);
      if (signedUrlError) throw new Error(signedUrlError.message);
      setAvatarUrl(data.signedUrl);
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : "Unable to update your avatar.");
    } finally {
      setSavingAvatar(false);
    }
  }

  async function requestOtp(action: CredentialAction) {
    setCredentialError(null);
    setCredentialMessage(null);
    setOtpCode("");
    setSavingCredential(true);
    try {
      const { error } = await createClient().auth.signInWithOtp({
        email: currentEmail,
        options: { shouldCreateUser: false },
      });
      if (error) throw new Error(error.message);
      setCredentialAction(action);
      setCredentialMessage(`A verification code was sent to ${currentEmail}.`);
    } catch (error) {
      setCredentialError(error instanceof Error ? error.message : "Unable to send a verification code.");
    } finally {
      setSavingCredential(false);
    }
  }

  async function updateCredential(action: CredentialAction, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCredentialError(null);
    setCredentialMessage(null);
    if (credentialAction !== action || !otpCode.trim()) {
      setCredentialError("Request and enter the verification code before continuing.");
      return;
    }
    if (action === "email" && newEmail.trim().toLowerCase() === currentEmail.toLowerCase()) {
      setCredentialError("Enter a different email address.");
      return;
    }
    if (action === "password") {
      if (passwordRules(newPassword).some((rule) => !rule.met)) {
        setCredentialError("Password must meet all the requirements shown below.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setCredentialError("Passwords do not match.");
        return;
      }
    }

    setSavingCredential(true);
    try {
      const supabase = createClient();
      const { data, error: otpError } = await supabase.auth.verifyOtp({
        email: currentEmail,
        token: otpCode.trim(),
        type: "email",
      });
      if (otpError) throw new Error(otpError.message);
      if (data.user?.id !== userId) throw new Error("The verification code did not match this account.");

      if (action === "email") {
        const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (error) throw new Error(error.message);
      }

      if (action === "email") {
        setCredentialMessage("Email change requested. Confirm the message sent by Supabase before the new address takes effect.");
      } else {
        setNewPassword("");
        setConfirmPassword("");
        setCredentialMessage("Password updated.");
      }
      setOtpCode("");
      setCredentialAction(null);
    } catch (error) {
      setCredentialError(error instanceof Error ? error.message : "Unable to update your credentials.");
    } finally {
      setSavingCredential(false);
    }
  }

  if (!profile) {
    return <UserErrorDialog message="We couldn't find your staff profile. Contact your administrator for help." />;
  }

  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] sm:p-7">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-[var(--primary-strong)]">Profile details</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Update how your name and avatar appear in CheckedIn.</p>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-muted)] text-lg font-semibold text-[var(--muted)]">
            {avatarUrl ? <Image src={avatarUrl} alt={`${firstName} ${lastName}`} width={80} height={80} unoptimized className="h-full w-full object-cover" /> : initials || <Camera aria-hidden="true" />}
          </div>
          <div>
            <input
              ref={avatarInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              aria-label="Choose profile avatar"
              onChange={(event) => {
                void uploadAvatar(event.currentTarget.files?.[0] ?? null);
                event.currentTarget.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => avatarInput.current?.click()}
              disabled={savingAvatar}
              className="min-h-10 rounded-xl border border-[var(--border)] px-4 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-muted)] disabled:opacity-60"
            >
              {savingAvatar ? "Uploading…" : "Change avatar"}
            </button>
            <p className="mt-1 text-xs text-[var(--muted)]">JPG, PNG, or WebP, up to 5 MB.</p>
          </div>
        </div>

        <form onSubmit={saveProfile} className="space-y-4">
          <label className="block text-sm font-medium">
            First name
            <input value={firstName} onChange={(event) => setFirstName(event.target.value)} required maxLength={100} className="mt-1.5 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm" />
          </label>
          <label className="block text-sm font-medium">
            Middle name <span className="font-normal text-[var(--muted)]">(optional)</span>
            <input value={middleName} onChange={(event) => setMiddleName(event.target.value)} maxLength={100} className="mt-1.5 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm" />
          </label>
          <label className="block text-sm font-medium">
            Last name
            <input value={lastName} onChange={(event) => setLastName(event.target.value)} required maxLength={100} className="mt-1.5 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm" />
          </label>
          {profileMessage && <p role="status" className="text-sm text-emerald-700">{profileMessage}</p>}
          <button type="submit" disabled={savingProfile} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
            {savingProfile && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Save profile
          </button>
        </form>
      </section>

      <section className="space-y-5">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] sm:p-7">
          <h2 className="text-lg font-semibold text-[var(--primary-strong)]">Email address</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">A verification code is sent to your current address before you can request a change.</p>
          <form onSubmit={(event) => void updateCredential("email", event)} className="mt-4 space-y-4">
            <label className="block text-sm font-medium">
              Current email
              <input value={currentEmail} readOnly className="mt-1.5 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 text-sm" />
            </label>
            <label className="block text-sm font-medium">
              New email
              <input type="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} required className="mt-1.5 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm" />
            </label>
            {credentialAction === "email" && (
              <label className="block text-sm font-medium">
                Verification code
                <input inputMode="numeric" autoComplete="one-time-code" value={otpCode} onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 10))} required className="mt-1.5 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm" />
              </label>
            )}
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void requestOtp("email")} disabled={savingCredential || !currentEmail} className="min-h-11 rounded-xl border border-[var(--border)] px-4 text-sm font-medium hover:bg-[var(--surface-muted)] disabled:opacity-60">
                Send code to current email
              </button>
              {credentialAction === "email" && <button type="submit" disabled={savingCredential} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-white disabled:opacity-60">{savingCredential && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}Request email change</button>}
            </div>
          </form>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] sm:p-7">
          <h2 className="text-lg font-semibold text-[var(--primary-strong)]">Password</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Verify your current email before setting a new password.</p>
          <form onSubmit={(event) => void updateCredential("password", event)} className="mt-4 space-y-4">
            <label className="block text-sm font-medium">
              New password
              <input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required className="mt-1.5 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm" />
            </label>
            <PasswordRequirements value={newPassword} />
            <label className="block text-sm font-medium">
              Confirm new password
              <input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required className="mt-1.5 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm" />
            </label>
            {credentialAction === "password" && (
              <label className="block text-sm font-medium">
                Verification code
                <input inputMode="numeric" autoComplete="one-time-code" value={otpCode} onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 10))} required className="mt-1.5 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm" />
              </label>
            )}
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void requestOtp("password")} disabled={savingCredential || !currentEmail} className="min-h-11 rounded-xl border border-[var(--border)] px-4 text-sm font-medium hover:bg-[var(--surface-muted)] disabled:opacity-60">
                Send code to current email
              </button>
              {credentialAction === "password" && <button type="submit" disabled={savingCredential} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-white disabled:opacity-60">{savingCredential && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}Update password</button>}
            </div>
          </form>
        </div>
        {credentialMessage && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{credentialMessage}</p>}
      </section>

      {isAdmin && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] sm:p-7">
          <h2 className="text-lg font-semibold text-[var(--primary-strong)]">Admin account creation code</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {hasAdminPersonalCode
              ? "Your code is set. You’ll need to enter it whenever you create another admin account."
              : "Create a six-digit personal code. You’ll need it to create another admin account."}
          </p>
          <form onSubmit={(event) => void saveAdminPersonalCode(event)} className="mt-4 max-w-lg space-y-4">
            <label className="block text-sm font-medium">
              {hasAdminPersonalCode ? "New six-digit code" : "Six-digit code"}
              <input
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                pattern="[0-9]{6}"
                maxLength={6}
                minLength={6}
                value={adminPersonalCode}
                onChange={(event) => setAdminPersonalCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                className="mt-1.5 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
              />
            </label>
            <label className="block text-sm font-medium">
              Confirm six-digit code
              <input
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                pattern="[0-9]{6}"
                maxLength={6}
                minLength={6}
                value={confirmAdminPersonalCode}
                onChange={(event) => setConfirmAdminPersonalCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                className="mt-1.5 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
              />
            </label>
            {adminCodeMessage && <p role="status" className="text-sm text-emerald-700">{adminCodeMessage}</p>}
            <button type="submit" disabled={savingAdminCode} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
              {savingAdminCode && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {hasAdminPersonalCode ? "Update personal code" : "Save personal code"}
            </button>
          </form>
        </section>
      )}
      <UserErrorDialog message={avatarError ?? profileError ?? credentialError ?? adminCodeError} />
    </div>
  );
}
