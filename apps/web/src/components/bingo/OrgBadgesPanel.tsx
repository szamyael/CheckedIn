"use client";

import { useEffect, useMemo, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { useLoader } from "@/components/LoaderProvider";
import {
  badgeStatusClass,
  badgeStatusLabel,
  awardRuleLabel,
  kindLabel,
  slugifyBadgeName,
  type OrgBadgeRow,
  type OrgBadgeStatus,
  type OrgBadgeAwardRule,
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
  earningCriteria: "",
  minimumPoints: "",
  awardRule: "manual" as OrgBadgeAwardRule,
  points: 0,
};

type EligibleStudent = { id: string; student_id: string; first_name: string; last_name: string; program: string; reward_points: number };

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
    earningCriteria: "",
    minimumPoints: "",
    awardRule: "manual" as OrgBadgeAwardRule,
  });
  const [badgeImage, setBadgeImage] = useState<File | null>(null);
  const [badgeImagePreview, setBadgeImagePreview] = useState<string | null>(null);
  const [eligibleStudents, setEligibleStudents] = useState<EligibleStudent[]>([]);
  const [rewardStudentId, setRewardStudentId] = useState("");

  useEffect(() => {
    const supabase = createClient();
    void supabase.rpc("organization_badge_students", { p_organization_id: organizationId })
      .then(({ data }) => setEligibleStudents((data as EligibleStudent[]) ?? []));
  }, [organizationId]);

  function selectBadgeImage(file: File | null) {
    if (!file) return;
    if (file.type !== "image/png") { setError("Badge artwork must be a PNG file."); return; }
    if (file.size > 2 * 1024 * 1024) { setError("Badge artwork must be 2 MB or smaller."); return; }
    setError(null); setBadgeImage(file); setBadgeImagePreview(URL.createObjectURL(file));
  }

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
      earningCriteria: badge.earning_criteria ?? "",
      minimumPoints: badge.minimum_points?.toString() ?? "",
      awardRule: badge.award_rule ?? (badge.minimum_points != null ? "point_threshold" : "manual"),
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
          earning_criteria: editForm.earningCriteria.trim() || null,
          minimum_points: editForm.minimumPoints ? Math.max(0, Number(editForm.minimumPoints)) : null,
          award_rule: editForm.awardRule,
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
      const { data: badge, error: insErr } = await supabase.from("org_badges").insert({
        organization_id: organizationId,
        slug,
        name: newForm.name.trim(),
        description: newForm.description.trim() || null,
        earning_criteria: newForm.earningCriteria.trim() || null,
        minimum_points: newForm.minimumPoints ? Math.max(0, Number(newForm.minimumPoints)) : null,
        award_rule: newForm.awardRule,
        points: Math.max(0, newForm.points),
        kind: "custom",
        status: "active",
        created_by: user.id,
      }).select("id").single();
      if (insErr) throw insErr;
      if (badgeImage && badge) {
        if (badgeImage.type !== "image/png") throw new Error("Badge artwork must be a PNG file.");
        if (badgeImage.size > 2 * 1024 * 1024) throw new Error("Badge artwork must be 2 MB or smaller.");
        const path = `${organizationId}/${badge.id}.png`;
        // A new badge ID produces a new object path, so an upsert is neither
        // needed nor desirable: Storage upserts require extra read/update RLS
        // permissions and can mask an authorization problem as an insert error.
        const { error: uploadError } = await supabase.storage.from("badge-images").upload(path, badgeImage, { contentType: "image/png" });
        if (uploadError) {
          throw new Error(`Badge was created, but its icon could not be uploaded: ${uploadError.message}`);
        }
        const { data: publicUrl } = supabase.storage.from("badge-images").getPublicUrl(path);
        const { error: imageError } = await supabase.from("org_badges").update({ image_url: publicUrl.publicUrl }).eq("id", badge.id);
        if (imageError) {
          throw new Error(`Badge icon was uploaded, but its URL could not be saved: ${imageError.message}`);
        }
      }

      setCreating(false);
      setNewForm({ name: "", description: "", earningCriteria: "", minimumPoints: "", awardRule: "manual", points: 25 });
      setBadgeImage(null);
      setBadgeImagePreview(null);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create badge");
    } finally {
      hideLoader();
    }
  }

  async function rewardBadge(badge: OrgBadgeRow) {
    if (!rewardStudentId) { setError("Choose a student to reward."); return; }
    setError(null); showLoader("Rewarding badge…");
    try {
      const { data, error: rewardError } = await createClient().rpc("reward_org_badge_to_student", {
        p_badge_id: badge.id, p_student_id: rewardStudentId,
      });
      if (rewardError) throw rewardError;
      if (!data) throw new Error("This student already has the badge.");
      await onChanged();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not reward badge"); }
    finally { hideLoader(); }
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
            <label className="text-sm">
              Award condition
              <select value={newForm.awardRule} onChange={(e) => setNewForm({ ...newForm, awardRule: e.target.value as OrgBadgeAwardRule, minimumPoints: e.target.value === "point_threshold" ? newForm.minimumPoints : "" })} className="mt-1 w-full rounded-lg border px-3 py-2">
                <option value="manual">Manual reward only</option>
                <option value="point_threshold">Student reaches a point total</option>
                <option value="mapped_program">Student is in a mapped program / course</option>
                <option value="new_registration">All newly registered eligible students</option>
              </select>
              <span className="mt-1 block text-xs text-slate-500">Mapped and newly registered presets respect this organization&apos;s program/course mappings.</span>
            </label>
            {newForm.awardRule === "point_threshold" && (
            <label className="text-sm">
              Minimum student points
              <input type="number" min={0} value={newForm.minimumPoints} onChange={(e) => setNewForm({ ...newForm, minimumPoints: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="e.g. 20" />
              <span className="mt-1 block text-xs text-slate-500">Leave blank if this badge is earned another way.</span>
            </label>
            )}
            <label className="text-sm sm:col-span-2">
              How students earn this badge
              <textarea value={newForm.earningCriteria} onChange={(e) => setNewForm({ ...newForm, earningCriteria: e.target.value })} rows={2} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="e.g. Complete a full bingo line during the Welcome Week card." />
            </label>
            <div className="text-sm sm:col-span-2">
              <p className="font-medium text-slate-800">Badge artwork</p>
              <label className="mt-2 flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-teal-200 bg-white p-3 transition hover:border-teal-500 hover:bg-teal-50/40">
                {badgeImagePreview ? <img src={badgeImagePreview} alt="Badge preview" className="h-14 w-14 rounded-lg object-cover" /> : <span className="grid h-14 w-14 place-items-center rounded-lg bg-teal-50 text-teal-700"><ImagePlus size={23} /></span>}
                <span className="min-w-0 flex-1"><span className="block font-semibold text-slate-800">{badgeImage ? badgeImage.name : "Upload a PNG badge icon"}</span><span className="mt-1 block text-xs text-slate-500">PNG only · up to 2 MB · square artwork works best</span></span>
                <span className="rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white">Choose file</span>
                <input type="file" accept="image/png" className="sr-only" onChange={(e) => selectBadgeImage(e.target.files?.[0] ?? null)} />
              </label>
              {badgeImage && <button type="button" onClick={() => { setBadgeImage(null); setBadgeImagePreview(null); }} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-600"><X size={13} /> Remove image</button>}
            </div>
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
                      <label className="text-sm sm:col-span-2">
                        How students earn this badge
                        <textarea value={editForm.earningCriteria} onChange={(e) => setEditForm({ ...editForm, earningCriteria: e.target.value })} rows={2} className="mt-1 w-full rounded-lg border px-3 py-2" />
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
                      <label className="text-sm">
                        Award condition
                        <select value={editForm.awardRule} onChange={(e) => setEditForm({ ...editForm, awardRule: e.target.value as OrgBadgeAwardRule, minimumPoints: e.target.value === "point_threshold" ? editForm.minimumPoints : "" })} className="mt-1 w-full rounded-lg border px-3 py-2">
                          <option value="manual">Manual reward only</option><option value="point_threshold">Student reaches a point total</option><option value="mapped_program">Mapped program / course</option><option value="new_registration">New registrations</option>
                        </select>
                      </label>
                      {editForm.awardRule === "point_threshold" && (
                      <label className="text-sm">
                        Minimum student points
                        <input type="number" min={0} value={editForm.minimumPoints} onChange={(e) => setEditForm({ ...editForm, minimumPoints: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="No point condition" />
                      </label>
                      )}
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
                    <div className="flex min-w-0 gap-3">
                      {badge.image_url ? <img src={badge.image_url} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" /> : <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-teal-50 text-lg">🏅</div>}
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{badge.name}</p>
                      {badge.description && (
                        <p className="mt-0.5 text-sm text-slate-600">
                          {badge.description}
                        </p>
                      )}
                      {badge.earning_criteria && <p className="mt-2 text-xs leading-5 text-slate-500"><span className="font-semibold text-slate-700">How to earn:</span> {badge.earning_criteria}</p>}
                      {badge.minimum_points != null && <p className="mt-1 text-xs font-medium text-teal-700">Earns automatically at {badge.minimum_points} reward points.</p>}
                      <p className="mt-1 text-xs font-medium text-slate-500">Condition: {awardRuleLabel(badge.award_rule)}</p>
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
                    </div></div>
                    <div className="flex flex-wrap gap-2">
                      <select value={rewardStudentId} onChange={(e) => setRewardStudentId(e.target.value)} className="max-w-52 rounded-lg border px-2 py-1.5 text-xs">
                        <option value="">Reward badge to…</option>
                        {eligibleStudents.map((student) => <option key={student.id} value={student.id}>{student.last_name}, {student.first_name} · {student.student_id}</option>)}
                      </select>
                      <button type="button" onClick={() => void rewardBadge(badge)} className="rounded-lg border border-teal-300 px-3 py-1.5 text-xs text-teal-700 hover:bg-teal-50">Reward</button>
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
