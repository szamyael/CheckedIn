"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLoader } from "@/components/LoaderProvider";
import { createClient } from "@/lib/supabase/client";

export default function EditStudentProfilePage() {
  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [program, setProgram] = useState("");
  const [section, setSection] = useState("");
  const [yearLevel, setYearLevel] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("students")
        .select("first_name, last_name, program, section, year_level")
        .eq("id", user.id)
        .single();
      if (data) {
        setFirstName(data.first_name ?? "");
        setLastName(data.last_name ?? "");
        setProgram(data.program ?? "");
        setSection(data.section ?? "");
        setYearLevel(data.year_level ?? 1);
      }
    }
    void load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    showLoader("Saving…");
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { error: updErr } = await supabase
        .from("students")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          program: program.trim(),
          section: section.trim() || null,
          year_level: yearLevel,
        })
        .eq("id", user.id);
      if (updErr) throw updErr;
      router.push("/student/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      hideLoader();
    }
  }

  return (
    <div className="space-y-4">
      <Link href="/student/profile" className="text-sm text-teal-600">
        ← Profile
      </Link>
      <h1 className="text-xl font-bold">Edit profile</h1>
      <form onSubmit={save} className="space-y-3">
        {(
          [
            ["First name", firstName, setFirstName],
            ["Last name", lastName, setLastName],
            ["Program", program, setProgram],
            ["Section", section, setSection],
          ] as const
        ).map(([label, value, setter]) => (
          <div key={label}>
            <label className="mb-1 block text-sm font-medium">{label}</label>
            <input
              required={label !== "Section"}
              value={value}
              onChange={(e) => setter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
            />
          </div>
        ))}
        <div>
          <label className="mb-1 block text-sm font-medium">Year level</label>
          <select
            value={yearLevel}
            onChange={(e) => setYearLevel(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
          >
            {[1, 2, 3, 4, 5].map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white"
        >
          Save changes
        </button>
      </form>
    </div>
  );
}
