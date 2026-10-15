"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Bell, Check, LoaderCircle, Search, UserRound, UsersRound } from "@/lib/icons";
import { createClient } from "@/lib/supabase/client";
import { formPlaceholders } from "@/lib/form-placeholders";
import { useAsyncAction } from "@/lib/useAsyncAction";

type Target = "all_students" | "all_staff" | "one_student" | "mapped_students";
type Audience = "admin" | "organization";
type StudentRecipient = {
  id: string;
  student_id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  section: string | null;
  program: string;
  profile_photo_url: string | null;
  avatar_url?: string | null;
};

function normalizeStudentSearch(value: string) {
  return value.replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim();
}

export function BroadcastNotificationForm({ audience = "admin" }: { audience?: Audience }) {
  const run = useAsyncAction();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState<Target>(
    audience === "organization" ? "mapped_students" : "all_students",
  );
  const [studentSearch, setStudentSearch] = useState("");
  const [studentResults, setStudentResults] = useState<StudentRecipient[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentRecipient | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (target !== "one_student" || studentSearch.trim().length < 2) {
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      setSearchLoading(true);
      setSearchError(null);
      try {
        const query = normalizeStudentSearch(studentSearch);
        if (!query) return;
        const supabase = createClient();
        const { data, error } = await supabase
          .from("students")
          .select("id, student_id, first_name, middle_name, last_name, section, program, profile_photo_url, users!inner(status, role)")
          .eq("users.status", "active")
          .eq("users.role", "student")
          .or(
            `first_name.ilike.%${query}%,last_name.ilike.%${query}%,student_id.ilike.%${query}%,section.ilike.%${query}%,program.ilike.%${query}%`,
          )
          .order("last_name")
          .limit(8);
        if (error) throw new Error(error.message);

        const results = await Promise.all(
          ((data ?? []) as StudentRecipient[]).map(async (student) => {
            if (!student.profile_photo_url) return student;
            const { data: signed, error: signedError } = await supabase.storage
              .from("student-ids")
              .createSignedUrl(student.profile_photo_url, 3600);
            if (signedError) throw new Error(signedError.message);
            return { ...student, avatar_url: signed.signedUrl };
          }),
        );
        if (!cancelled) setStudentResults(results);
      } catch (error) {
        if (!cancelled) {
          setStudentResults([]);
          setSearchError(error instanceof Error ? error.message : "Unable to search students.");
        }
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [studentSearch, target]);

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (target === "one_student" && !selectedStudent) {
      setMessage("Search for and select an active student first.");
      return;
    }

    setIsSending(true);
    try {
      await run("Sending announcement…", async () => {
        const supabase = createClient();
        if (audience === "organization") {
          const { data: recipientCount, error } = await supabase.rpc("send_organization_broadcast", {
            p_title: title.trim(),
            p_body: body.trim(),
          });
          if (error) throw new Error(error.message);
          const count = Number(recipientCount ?? 0);
          setMessage(count === 0
            ? "No active students are currently mapped to your organization."
            : `Sent to ${count} mapped student${count === 1 ? "" : "s"}.`);
          setTitle("");
          setBody("");
          return;
        }

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError) throw new Error(authError.message);
        if (!user) throw new Error("Sign in again to send a notification.");
        const { data: sender, error: senderError } = await supabase
          .from("staff_profiles")
          .select("first_name, middle_name, last_name, profile_photo_url, organizations(name)")
          .eq("id", user.id)
          .maybeSingle();
        if (senderError) throw new Error(senderError.message);
        const senderName = [sender?.first_name, sender?.middle_name, sender?.last_name]
          .filter((part): part is string => Boolean(part?.trim()))
          .join(" ") || String(user.user_metadata?.full_name ?? "CheckedIn Administrator");
        const senderOrganization = Array.isArray(sender?.organizations)
          ? sender.organizations[0]
          : sender?.organizations;

        let recipientIds: string[];

        if (target === "one_student" && selectedStudent) {
          const { data: activeStudent, error: statusError } = await supabase
            .from("users")
            .select("id")
            .eq("id", selectedStudent.id)
            .eq("role", "student")
            .eq("status", "active")
            .maybeSingle();
          if (statusError) throw new Error(statusError.message);
          if (!activeStudent) throw new Error("That student is no longer active. Search and choose another recipient.");
          recipientIds = [activeStudent.id];
        } else {
          const roles = target === "all_students" ? ["student"] : ["faculty", "org_member", "admin"];
          const { data: users, error: userError } = await supabase
            .from("users")
            .select("id")
            .in("role", roles)
            .eq("status", "active");
          if (userError) throw new Error(userError.message);
          recipientIds = (users ?? []).map((user) => user.id);
        }

        if (recipientIds.length === 0) {
          setMessage("No recipients found.");
          return;
        }

        const rows = recipientIds.map((userId) => ({
          user_id: userId,
          title: title.trim(),
          body: body.trim(),
          notification_type: "general" as const,
          sender_id: user.id,
          sender_name: senderName,
          sender_role: "admin",
          sender_organization_name: senderOrganization?.name ?? null,
          sender_avatar_path: sender?.profile_photo_url ?? null,
        }));
        const { error: notificationError } = await supabase.from("notifications").insert(rows);
        if (notificationError) throw new Error(notificationError.message);

        const { error: auditError } = await supabase.rpc("log_audit", {
          p_action: "broadcast_notification",
          p_details: {
            target,
            count: rows.length,
            title: title.trim(),
            recipient_student_id: target === "one_student" ? selectedStudent?.student_id : null,
          },
        });

        setMessage(
          auditError
            ? `Sent to ${rows.length} recipient${rows.length === 1 ? "" : "s"}, but the audit log could not be saved: ${auditError.message}`
            : `Sent to ${rows.length} recipient${rows.length === 1 ? "" : "s"}.`,
        );
        setTitle("");
        setBody("");
        setSelectedStudent(null);
        setStudentSearch("");
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to send announcement.");
    } finally {
      setIsSending(false);
    }
  }

  function studentCard(student: StudentRecipient, selected = false) {
    const initials = `${student.first_name[0] ?? ""}${student.last_name[0] ?? ""}`.toUpperCase();
    return (
      <span className="flex min-w-0 items-center gap-3 text-left">
        {student.avatar_url
          ? <Image src={student.avatar_url} alt="" width={44} height={44} unoptimized className="h-11 w-11 shrink-0 rounded-full object-cover" />
          : <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--surface-muted)] text-xs font-bold text-[var(--muted)]">{initials || <UserRound className="h-5 w-5" />}</span>}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-[var(--foreground)]">{student.first_name} {student.middle_name ? `${student.middle_name} ` : ""}{student.last_name}</span>
          <span className="block truncate text-xs text-[var(--muted)]">{student.student_id} · {student.section || "No section"}</span>
          <span className="block truncate text-xs text-[var(--muted)]">{student.program || "No program listed"}</span>
        </span>
        {selected && <Check className="h-5 w-5 shrink-0 text-emerald-600" aria-label="Selected" />}
      </span>
    );
  }

  return (
    <form onSubmit={send} className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
      <header>
        <p className="flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-[var(--primary)]">
          <Bell className="h-4 w-4" aria-hidden="true" />
          {audience === "organization" ? "ORGANIZATION MESSAGES" : "ADMIN MESSAGES"}
        </p>
        <h2 className="mt-2 text-lg font-semibold text-[var(--primary-strong)]">Broadcast notification</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {audience === "organization"
            ? "Send an announcement to active students in programs mapped to your organization."
            : "Send an announcement to a group or directly to one active student."}
        </p>
      </header>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">1. Choose recipients</h3>
        {audience === "organization"
          ? <p className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2.5 text-sm">Active students in programs mapped to your organization</p>
          : <>
            <label className="block text-xs font-medium text-[var(--muted)]" htmlFor="broadcast-target">Send to</label>
            <select
              id="broadcast-target"
              value={target}
              onChange={(event) => {
                setTarget(event.target.value as Target);
                setStudentSearch("");
                setSelectedStudent(null);
                setMessage(null);
              }}
              className="min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
            >
              <option value="all_students">All active students</option>
              <option value="all_staff">All staff</option>
              <option value="one_student">One student</option>
            </select>
          </>}

        {audience === "admin" && target === "one_student" && (
          <div className="space-y-3">
            {selectedStudent && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="mb-2 text-xs font-semibold text-emerald-800">Selected recipient</p>
                {studentCard(selectedStudent, true)}
                <button type="button" onClick={() => setSelectedStudent(null)} className="mt-2 text-xs font-semibold text-emerald-800 underline">Choose another student</button>
              </div>
            )}
            {!selectedStudent && (
              <>
                <label className="relative block">
                  <span className="sr-only">Search students</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" aria-hidden="true" />
                  <input
                    value={studentSearch}
                    onChange={(event) => {
                      const value = event.target.value;
                      const normalized = normalizeStudentSearch(value);
                      setStudentSearch(value);
                      if (value.trim().length < 2 || !normalized) {
                        setStudentResults([]);
                        setSearchLoading(false);
                        setSearchError(null);
                      }
                    }}
                    placeholder="Search name, student ID, section, or program"
                    className="min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-9 pr-3 text-sm"
                  />
                </label>
                {searchLoading && <p role="status" className="flex items-center gap-2 text-xs text-[var(--muted)]"><LoaderCircle className="h-4 w-4 animate-spin" /> Searching active students…</p>}
                {searchError && <p role="alert" className="text-sm text-red-700">{searchError}</p>}
                {!searchLoading && !searchError && studentSearch.trim().length > 0 && studentSearch.trim().length < 2 && (
                  <p className="text-xs text-[var(--muted)]">Enter at least two characters to search.</p>
                )}
                {studentResults.length > 0 && (
                  <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-[var(--border)] p-2">
                    {studentResults.map((student) => (
                      <button key={student.id} type="button" onClick={() => setSelectedStudent(student)} className="w-full rounded-lg p-2 hover:bg-[var(--surface-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--primary)]">
                        {studentCard(student)}
                      </button>
                    ))}
                  </div>
                )}
                {!searchLoading && !searchError && studentSearch.trim().length >= 2 && studentResults.length === 0 && (
                  <p className="rounded-xl bg-[var(--surface-muted)] p-3 text-sm text-[var(--muted)]">No active students found.</p>
                )}
              </>
            )}
          </div>
        )}
      </section>

      <section className="space-y-3 border-t border-[var(--border)] pt-5">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">2. Write your message</h3>
        <label className="block text-sm font-medium">
          Title
          <input
            required
            maxLength={120}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={formPlaceholders.notificationTitle}
            className="mt-1.5 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
          />
        </label>
        <label className="block text-sm font-medium">
          Message
          <textarea
            required
            maxLength={2000}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={formPlaceholders.notificationBody}
            rows={4}
            className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
          />
        </label>
      </section>

      {message && (
        <p role={message.startsWith("Sent to") ? "status" : "alert"} className={`rounded-xl p-3 text-sm ${message.startsWith("Sent to") ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
          {message}
        </p>
      )}

      <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <UsersRound className="h-4 w-4" aria-hidden="true" />
          {audience === "organization"
            ? "Delivery is restricted to active students in your organization’s mapped programs."
            : "Only active accounts can receive notifications."}
        </p>
        <button
          type="submit"
          disabled={isSending || (audience === "admin" && target === "one_student" && !selectedStudent)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Bell className="h-4 w-4" aria-hidden="true" />}
          {isSending ? "Sending…" : "Send notification"}
        </button>
      </div>
    </form>
  );
}
