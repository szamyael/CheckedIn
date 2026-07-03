"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Settings {
  otp_expiry_seconds: number;
  qr_rotation_minutes: number;
  session_timeout_minutes: number;
  late_grace_minutes: number;
  default_requires_otp: boolean;
}

export function SystemSettingsForm() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("system_settings").select("*").eq("id", 1).single();
      if (data) setSettings(data as Settings);
      setLoading(false);
    }
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMessage(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("system_settings")
      .update({ ...settings, updated_by: user?.id, updated_at: new Date().toISOString() })
      .eq("id", 1);

    if (!error) {
      await supabase.rpc("log_audit", {
        p_action: "update_system_settings",
        p_entity_type: "system_settings",
        p_entity_id: null,
      });
      setMessage("Settings saved.");
    } else {
      setMessage(error.message);
    }
    setSaving(false);
  }

  if (loading) return <p className="text-sm text-slate-600">Loading settings…</p>;
  if (!settings) return <p className="text-sm text-red-600">Could not load settings.</p>;

  return (
    <form onSubmit={save} className="max-w-xl space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">System configuration</h2>
      <p className="text-sm text-slate-600">
        Attendance policies, OTP duration, and QR rotation defaults.
      </p>

      <label className="block text-sm">
        <span className="font-medium">OTP expiry (seconds)</span>
        <input
          type="number"
          min={30}
          max={600}
          value={settings.otp_expiry_seconds}
          onChange={(e) => setSettings({ ...settings, otp_expiry_seconds: Number(e.target.value) })}
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium">QR rotation window (minutes, 0 = until attendance ends)</span>
        <input
          type="number"
          min={0}
          max={1440}
          value={settings.qr_rotation_minutes}
          onChange={(e) => setSettings({ ...settings, qr_rotation_minutes: Number(e.target.value) })}
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium">Late grace (minutes after attendance opens)</span>
        <input
          type="number"
          min={0}
          max={120}
          value={settings.late_grace_minutes}
          onChange={(e) => setSettings({ ...settings, late_grace_minutes: Number(e.target.value) })}
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium">Session timeout (minutes)</span>
        <input
          type="number"
          min={15}
          max={1440}
          value={settings.session_timeout_minutes}
          onChange={(e) => setSettings({ ...settings, session_timeout_minutes: Number(e.target.value) })}
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={settings.default_requires_otp}
          onChange={(e) => setSettings({ ...settings, default_requires_otp: e.target.checked })}
        />
        Require OTP for new events by default
      </label>

      {message && <p className="text-sm text-slate-700">{message}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
