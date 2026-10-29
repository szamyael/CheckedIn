"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardPageHeader, DashboardSection } from "@/components/DashboardUi";
import { createClient } from "@/lib/supabase/client";

type Student = {
  id: string;
  student_id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  name_extension: string | null;
  program: string;
  year_level: number | null;
};

type StudentDraft = Omit<Student, "id">;

export function AdminStudentProfileEditor({
  students,
  hasPersonalCode,
  title,
  description,
}: {
  students: Student[];
  hasPersonalCode: boolean;
  title: string;
  description: string;
}) {
  const router = useRouter();
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [unlockedPin, setUnlockedPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [draft, setDraft] = useState<StudentDraft | null>(null);
  const [search, setSearch] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;
    return students.filter((student) =>
      [student.student_id, student.first_name, student.middle_name, student.last_name, student.name_extension, student.program]
        .some((value) => value?.toLowerCase().includes(query)),
    );
  }, [search, students]);

  async function unlockEditor(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPinError(null);
    const { data, error } = await createClient().rpc("verify_admin_personal_code", { p_code: pin });
    if (error || data !== true) {
      setPinError(error ? "Unable to verify your PIN. Try again later." : "Incorrect PIN or verification is temporarily locked.");
      return;
    }
    setUnlockedPin(pin);
    setPin("");
    setPinDialogOpen(false);
  }

  function startEditing(student: Student) {
    setEditingStudent(student);
    setDraft({
      student_id: student.student_id,
      first_name: student.first_name,
      middle_name: student.middle_name ?? "",
      last_name: student.last_name,
      name_extension: student.name_extension ?? "",
      program: student.program,
      year_level: student.year_level,
    });
    setSaveError(null);
  }

  async function saveStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingStudent || !draft) return;
    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch(`/api/admin/students/${editingStudent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, pin: unlockedPin }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update student profile.");
      setEditingStudent(null);
      setDraft(null);
      router.refresh();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not update student profile.");
    } finally {
      setSaving(false);
    }
  }

  const trigger = (
    <button
      type="button"
      onClick={() => {
        setPin("");
        setPinError(null);
        setPinDialogOpen(true);
      }}
      aria-haspopup="dialog"
      className="cursor-default border-0 bg-transparent p-0 text-inherit no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
    >
      SYSTEM CONTROL
    </button>
  );

  return (
    <>
      <DashboardPageHeader eyebrow={trigger} title={title} description={description} />

      {unlockedPin && (
        <DashboardSection title="Manual student profile edits" description="Update a student's identifier and academic profile details.">
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <label className="block max-w-md text-sm font-medium text-slate-800">
              Find a student
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, student ID, or program"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
              />
            </label>
            <div className="table-scroll rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Student ID</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Program</th>
                    <th className="px-4 py-3 font-medium">Year</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="border-b border-slate-100">
                      <td className="px-4 py-3 font-mono text-xs">{student.student_id}</td>
                      <td className="px-4 py-3">{[student.first_name, student.middle_name, student.last_name, student.name_extension].filter(Boolean).join(" ")}</td>
                      <td className="px-4 py-3 text-slate-700">{student.program}</td>
                      <td className="px-4 py-3">{student.year_level ?? "—"}</td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => startEditing(student)} className="text-xs font-semibold text-teal-800 hover:underline">
                          Edit profile
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-600">No matching students.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={() => {
                setUnlockedPin("");
                setEditingStudent(null);
                setDraft(null);
              }}
              className="text-xs font-medium text-slate-600 underline underline-offset-2"
            >
              Lock student profile edits
            </button>
          </div>
        </DashboardSection>
      )}

      {pinDialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-student-pin-title"
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPinDialogOpen(false);
          }}
        >
          <form onSubmit={(event) => void unlockEditor(event)} className="w-full max-w-sm space-y-4 rounded-xl bg-white p-5 shadow-xl">
            <div>
              <h2 id="admin-student-pin-title" className="text-lg font-semibold text-slate-900">Admin PIN required</h2>
              <p className="mt-1 text-sm text-slate-600">Enter your six-digit personal code to unlock manual student profile edits.</p>
            </div>
            {hasPersonalCode ? (
              <label className="block text-sm font-medium text-slate-800">
                Personal PIN
                <input
                  autoFocus
                  required
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  autoComplete="off"
                  value={pin}
                  onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-lg tracking-[0.3em] outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                />
              </label>
            ) : (
              <p className="text-sm text-amber-800">
                Set your personal code in <a href="/dashboard/profile" className="font-semibold underline">Account profile</a> before unlocking this section.
              </p>
            )}
            {pinError && <p role="alert" className="text-sm text-red-700">{pinError}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setPinDialogOpen(false)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              {hasPersonalCode && <button type="submit" disabled={pin.length !== 6} className="rounded-lg bg-teal-800 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-50">Unlock</button>}
            </div>
          </form>
        </div>
      )}

      {editingStudent && draft && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-student-profile-title"
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEditingStudent(null);
          }}
        >
          <form onSubmit={(event) => void saveStudent(event)} className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
            <div>
              <h2 id="edit-student-profile-title" className="text-lg font-semibold text-slate-900">Edit student profile</h2>
              <p className="mt-1 text-sm text-slate-600">Changes apply immediately to this student account.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-800">Student ID<input required value={draft.student_id} onChange={(event) => setDraft({ ...draft, student_id: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20" /></label>
              <label className="text-sm font-medium text-slate-800">Program<input required maxLength={150} value={draft.program} onChange={(event) => setDraft({ ...draft, program: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20" /></label>
              <label className="text-sm font-medium text-slate-800">First name<input required maxLength={100} value={draft.first_name} onChange={(event) => setDraft({ ...draft, first_name: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20" /></label>
              <label className="text-sm font-medium text-slate-800">Middle name<input maxLength={100} value={draft.middle_name ?? ""} onChange={(event) => setDraft({ ...draft, middle_name: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20" /></label>
              <label className="text-sm font-medium text-slate-800">Last name<input required maxLength={100} value={draft.last_name} onChange={(event) => setDraft({ ...draft, last_name: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20" /></label>
              <label className="text-sm font-medium text-slate-800">Name extension<input maxLength={20} value={draft.name_extension ?? ""} onChange={(event) => setDraft({ ...draft, name_extension: event.target.value })} placeholder="Jr., III" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20" /></label>
              <label className="text-sm font-medium text-slate-800 sm:col-span-2">Year level
                <select value={draft.year_level ?? ""} onChange={(event) => setDraft({ ...draft, year_level: event.target.value ? Number(event.target.value) : null })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20">
                  <option value="">Not set</option>
                  {[1, 2, 3, 4].map((year) => <option key={year} value={year}>Year {year}</option>)}
                </select>
              </label>
            </div>
            {saveError && <p role="alert" className="text-sm text-red-700">{saveError}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditingStudent(null)} disabled={saving} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-teal-800 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-50">{saving ? "Saving…" : "Save profile"}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}