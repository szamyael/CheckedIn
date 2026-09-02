"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAsyncAction } from "@/lib/useAsyncAction";

interface Organization {
  id: string;
  name: string;
}

interface ExistingMapping {
  id: string;
  organization_id: string;
  program: string;
  organizations?: { name: string } | { name: string }[] | null;
}

export function OrganizationProgramAlignmentPanel({
  organizations,
  existingMappings,
  allPrograms,
}: {
  organizations: Organization[];
  existingMappings: ExistingMapping[];
  allPrograms: string[];
}) {
  const router = useRouter();
  const run = useAsyncAction();
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id ?? "");
  const [program, setProgram] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const normalizeProgramName = (value: string) => value.trim().toLowerCase();

  const grouped = existingMappings.reduce<Record<string, ExistingMapping[]>>((acc, row) => {
    const orgId = row.organization_id;
    acc[orgId] = [...(acc[orgId] ?? []), row];
    return acc;
  }, {});

  const programToOrganizations = existingMappings.reduce<Record<string, string[]>>((acc, row) => {
    const normalizedProgram = normalizeProgramName(row.program);
    if (!normalizedProgram) return acc;

    const orgName = Array.isArray(row.organizations)
      ? row.organizations[0]?.name
      : row.organizations?.name;

    if (orgName) {
      acc[normalizedProgram] = [...(acc[normalizedProgram] ?? []), orgName];
    }
    return acc;
  }, {});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedProgram = program.trim();
    if (!organizationId || !trimmedProgram) {
      setError("Choose an organization and enter a program or course name.");
      return;
    }

    try {
      const res = await run("Saving program alignment…", () =>
        fetch("/api/admin/organization-programs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organization_id: organizationId, program: trimmedProgram }),
        }),
      );

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save program alignment");
        return;
      }

      setProgram("");
      setSuccess(`Added ${trimmedProgram} to ${organizations.find((o) => o.id === organizationId)?.name ?? "organization"}.`);
      router.refresh();
    } catch {
      setError("Failed to save program alignment.");
    }
  }

  async function saveEdit(id: string) {
    const updated = editingValue.trim();
    if (!updated) {
      setError("Program name cannot be empty.");
      return;
    }

    try {
      const res = await run("Saving program update…", () =>
        fetch("/api/admin/organization-programs", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, program: updated }),
        }),
      );

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update mapping");
        return;
      }

      setEditingId(null);
      setEditingValue("");
      setSuccess(`Updated mapping to ${updated}.`);
      router.refresh();
    } catch {
      setError("Failed to update mapping.");
    }
  }

  async function deleteMapping(id: string, programName: string) {
    const confirmed = window.confirm(`Remove the ${programName} mapping?`);
    if (!confirmed) return;

    try {
      const res = await run("Removing program mapping…", () =>
        fetch("/api/admin/organization-programs", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        }),
      );

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to remove mapping");
        return;
      }

      setSuccess(`Removed ${programName}.`);
      router.refresh();
    } catch {
      setError("Failed to remove mapping.");
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Organization Program Alignment</h2>
          <p className="text-sm text-slate-600">
            Assign which programs or courses belong to each organization so students only see the right events and bingo cards.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-6 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-800">Organization</label>
          <select
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-800">Program / Course</label>
          <input
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            placeholder="e.g. BSIT, BSBA, Tourism"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add mapping
          </button>
        </div>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {success && <p className="mb-4 text-sm text-green-600">{success}</p>}

      <div className="space-y-4">
        {allPrograms.length === 0 ? (
          <p className="text-sm text-slate-700">No student programs have been registered yet.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {allPrograms.map((program) => {
              const normalizedProgram = normalizeProgramName(program);
              const assignedTo = programToOrganizations[normalizedProgram] ?? [];
              return (
                <div key={program} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="font-medium text-slate-900">{program}</p>
                    {assignedTo.length === 0 && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                        Unassigned
                      </span>
                    )}
                  </div>

                  {assignedTo.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {assignedTo.map((orgName) => (
                        <span key={`${program}-${orgName}`} className="rounded-full bg-blue-100 px-2 py-1 text-[11px] font-medium text-blue-800">
                          {orgName}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No organization linked yet.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {organizations.length > 0 && (
          <div className="space-y-4 border-t border-slate-200 pt-4">
            <h3 className="text-sm font-semibold text-slate-900">Organization mappings</h3>
            {organizations.map((org) => (
              <div key={org.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-900">{org.name}</h3>
                {grouped[org.id]?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {grouped[org.id].map((mappedProgram) => (
                      <div
                        key={`${org.id}-${mappedProgram.id}`}
                        className="flex items-center gap-2 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800"
                      >
                        {editingId === mappedProgram.id ? (
                          <>
                            <input
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="w-28 rounded border border-blue-300 bg-white px-2 py-1 text-xs text-slate-900"
                            />
                            <button
                              type="button"
                              onClick={() => void saveEdit(mappedProgram.id)}
                              className="text-[10px] font-semibold text-teal-700"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setEditingValue("");
                              }}
                              className="text-[10px] font-semibold text-slate-700"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <span>{mappedProgram.program}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(mappedProgram.id);
                                setEditingValue(mappedProgram.program);
                              }}
                              className="text-[10px] font-semibold text-blue-700 underline"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void deleteMapping(mappedProgram.id, mappedProgram.program)}
                              className="text-[10px] font-semibold text-red-700 underline"
                            >
                              Remove
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No programs mapped yet.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
