"use client";

import { useMemo, useState } from "react";
import { useLoader } from "@/components/LoaderProvider";
import {
  badgeStatusClass,
  badgeStatusLabel,
  kindLabel,
  slugifyBadgeName,
  type OrgBadgeRow,
  type OrgBadgeStatus,
} from "@/lib/org-badges";
import { createClient } from "@/lib/supabase/client";

type BadgeFilter = "all" | OrgBadgeStatus;

interface OrgBadgesPanelProps {
  organizationId: string;
  badges: OrgBadgeRow[];
  onChanged: () => Promise<void>;
}

const EMPTY_EDIT = {
  name: "",
  description: "",
  points: 0,
};

export function OrgBadgesPanel({
  organizationId,
  badges,
  onChanged,
}: OrgBadgesPanelProps) {
  const { showLoader, hideLoader } = useLoader();
  const [filter, setFilter] = useState<BadgeFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState({
    name: "",
    description: "",
    points: 25,
  });

  const filtered = useMemo(() => {
    if (filter === "all") return badges;
    return badges.filter((b) => b.status === filter);
  }, [badges, filter]);

  function startEdit(badge: OrgBadgeRow) {
    setCreating(false);
    setEditingId(badge.id);
    setEditForm({
      name: badge.name,
      description: badge.description ?? "",
      points: badge.points,
    });
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(EMPTY_EDIT);
  }

  async function saveEdit(badge: OrgBadgeRow) {
    if (!editForm.name.trim()) {
      setError("Badge name is required.");
      return;
    }
    setError(null);
    showLoader("Saving badge…");
    try {
      const supabase = createClient();
      const { error: updErr } = await supabase
        .from("org_badges")
        .update({
          name: editForm.name.trim(),
          description: editForm.description.trim() || null,
          points: Math.max(0, editForm.points),
        })
        .eq("id", badge.id);
      if (updErr) throw updErr;
      cancelEdit();
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save badge");
    } finally {
      hideLoader();
    }
  }

  async function createBadge() {
    if (!newForm.name.trim()) {
      setError("Badge name is required.");
      return;
    }
    setError(null);
    showLoader("Creating badge…");
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const slug = `${slugifyBadgeName(newForm.name)}-${Date.now().toString(36)}`;
      const { error: insErr } = await supabase.from("org_badges").insert({
        organization_id: organizationId,
        slug,
        name: newForm.name.trim(),
        description: newForm.description.trim() || null,
        points: Math.max(0, newForm.points),
        kind: "custom",
        status: "active",
        created_by: user.id,
      });
      if (insErr) throw insErr;

      setCreating(false);
      setNewForm({ name: "", description: "", points: 25 });
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create badge");
    } finally {
      hideLoader();
    }
  }

  async function setStatus(badge: OrgBadgeRow, status: OrgBadgeStatus) {
    setError(null);
    showLoader(status === "archived" ? "Archiving badge…" : "Restoring badge…");
    try {
      const supabase = createClient();
      const { error: updErr } = await supabase
        .from("org_badges")
        .update({ status })
        .eq("id", badge.id);
      if (updErr) throw updErr;
      if (editingId === badge.id) cancelEdit();
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update badge");
    } finally {
      hideLoader();
    }
  }

  async function deleteBadge(badge: OrgBadgeRow) {
    if (
      !confirm(
        `Delete "${badge.name}"? Students who earned this badge will lose that award record.`,
      )
    ) {
      return;
    }
    setError(null);
    showLoader("Deleting badge…");
    try {
      const supabase = createClient();
      const { error: delErr } = await supabase
        .from("org_badges")
        .delete()
        .eq("id", badge.id);
      if (delErr) throw delErr;
      if (editingId === badge.id) cancelEdit();
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete badge");
    } finally {
      hideLoader();
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Org badges</h2>
          <p className="text-sm text-slate-600">
            Manage badges used for bingo rewards and custom awards.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setEditingId(null);
            setError(null);
          }}
          className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          + New badge
        </button>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        {(["all", "active", "archived"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-lg px-3 py-1.5 capitalize ${
              filter === key
                ? "bg-slate-800 text-white"
                : "border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {key}
            {key !== "all" && (
              <span className="ml-1 opacity-70">
                ({badges.filter((b) => b.status === key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {creating && (
        <div className="space-y-3 rounded-lg border border-teal-200 bg-teal-50/40 p-4">
          <p className="text-sm font-medium text-slate-800">New custom badge</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm sm:col-span-2">
              Name
              <input
                value={newForm.name}
                onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2"
                placeholder="e.g. Campus Explorer"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              Description
              <input
                value={newForm.description}
                onChange={(e) =>
                  setNewForm({ ...newForm, description: e.target.value })
                }
                className="mt-1 w-full rounded-lg border px-3 py-2"
                placeholder="Optional"
              />
            </label>
            <label className="text-sm">
              Points
              <input
                type="number"
                min={0}
                value={newForm.points}
                onChange={(e) =>
                  setNewForm({ ...newForm, points: Number(e.target.value) })
                }
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void createBadge()}
              className="rounded-lg bg-teal-600 px-3 py-2 text-sm text-white"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500">No badges in this view.</p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((badge) => {
            const isEditing = editingId === badge.id;
            return (
              <li
                key={badge.id}
                className="rounded-lg border border-slate-200 px-4 py-3"
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-sm sm:col-span-2">
                        Name
                        <input
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name: e.target.value })
                          }
                          className="mt-1 w-full rounded-lg border px-3 py-2"
                        />
                      </label>
                      <label className="text-sm sm:col-span-2">
                        Description
                        <input
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              description: e.target.value,
                            })
                          }
                          className="mt-1 w-full rounded-lg border px-3 py-2"
                        />
                      </label>
                      <label className="text-sm">
                        Points
                        <input
                          type="number"
                          min={0}
                          value={editForm.points}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              points: Number(e.target.value),
                            })
                          }
                          className="mt-1 w-full rounded-lg border px-3 py-2"
                        />
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void saveEdit(badge)}
                        className="rounded-lg bg-teal-600 px-3 py-2 text-sm text-white"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-lg border px-3 py-2 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{badge.name}</p>
                      {badge.description && (
                        <p className="mt-0.5 text-sm text-slate-600">
                          {badge.description}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                          {kindLabel(badge.kind)}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 font-medium ${badgeStatusClass(badge.status)}`}
                        >
                          {badgeStatusLabel(badge.status)}
                        </span>
                        <span className="font-medium text-teal-700">
                          +{badge.points} pts
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(badge)}
                        className="rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      {badge.status === "active" ? (
                        <button
                          type="button"
                          onClick={() => void setStatus(badge, "archived")}
                          className="rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50"
                        >
                          Archive
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void setStatus(badge, "active")}
                          className="rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50"
                        >
                          Restore
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void deleteBadge(badge)}
                        className="rounded-lg border border-red-300 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
