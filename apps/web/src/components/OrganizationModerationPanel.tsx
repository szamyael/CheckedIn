"use client";

import { useMemo, useState } from "react";
import { Search, ShieldCheck, ShieldOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLoader } from "@/components/LoaderProvider";

type Organization = {
  id: string;
  name: string;
  description: string | null;
  moderation_status: "active" | "suspended";
  moderation_note: string | null;
  moderated_at: string | null;
};

export function OrganizationModerationPanel({ organizations }: { organizations: Organization[] }) {
  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | Organization["moderation_status"]>("all");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(() => organizations.filter((organization) => {
    const matchesQuery = `${organization.name} ${organization.description ?? ""}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesQuery && (filter === "all" || organization.moderation_status === filter);
  }), [organizations, filter, query]);

  async function moderate(organization: Organization, moderationStatus: Organization["moderation_status"]) {
    setError(null); showLoader(moderationStatus === "suspended" ? "Suspending organization…" : "Restoring organization…");
    try {
      const response = await fetch("/api/admin/organizations/moderation", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organization_id: organization.id, moderation_status: moderationStatus, moderation_note: notes[organization.id] ?? organization.moderation_note }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not update organization");
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not update organization"); }
    finally { hideLoader(); }
  }

  return <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-900">Organization moderation</h2><p className="text-sm text-slate-600">Review organization access and suspend it when it should not operate in the workspace.</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{organizations.filter((organization) => organization.moderation_status === "suspended").length} suspended</span></div>
    <div className="flex flex-wrap gap-2"><label className="relative min-w-60 flex-1"><Search size={15} className="absolute left-3 top-3 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search organizations" className="w-full rounded-lg border px-3 py-2 pl-9 text-sm" /></label>{(["all", "active", "suspended"] as const).map((status) => <button key={status} type="button" onClick={() => setFilter(status)} className={`rounded-lg px-3 py-2 text-sm capitalize ${filter === status ? "bg-slate-800 text-white" : "border text-slate-700"}`}>{status}</button>)}</div>
    {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
    <div className="grid gap-3 lg:grid-cols-2">{visible.map((organization) => <article key={organization.id} className="rounded-lg border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-900">{organization.name}</h3><p className="mt-1 text-sm text-slate-600">{organization.description || "No organization description."}</p></div><span className={`rounded-full px-2 py-1 text-xs font-semibold ${organization.moderation_status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{organization.moderation_status}</span></div><label className="mt-3 block text-xs font-medium text-slate-600">Moderation note<textarea value={notes[organization.id] ?? organization.moderation_note ?? ""} onChange={(event) => setNotes({ ...notes, [organization.id]: event.target.value })} placeholder="Optional reason or review note" rows={2} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-normal" /></label><div className="mt-3 flex justify-end">{organization.moderation_status === "active" ? <button type="button" onClick={() => void moderate(organization, "suspended")} className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"><ShieldOff size={15} /> Suspend</button> : <button type="button" onClick={() => void moderate(organization, "active")} className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"><ShieldCheck size={15} /> Restore</button>}</div></article>)}{visible.length === 0 && <p className="text-sm text-slate-500">No organizations match this filter.</p>}</div>
  </section>;
}
