"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formPlaceholders } from "@/lib/form-placeholders";
import { useAsyncAction } from "@/lib/useAsyncAction";

interface Organization {
  id: string;
  name: string;
}

export function CreateStaffForm({ organizations }: { organizations: Organization[] }) {
  const router = useRouter();
  const run = useAsyncAction();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [role, setRole] = useState("faculty");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const form = new FormData(e.currentTarget);
    const body = {
      email: form.get("email"),
      password: form.get("password"),
      role: form.get("role"),
      first_name: form.get("first_name"),
      last_name: form.get("last_name"),
      department: form.get("department") || null,
      organization_id: form.get("organization_id") || null,
    };

    try {
      const res = await run("Creating staff account…", () =>
        fetch("/api/admin/create-staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
      );

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create account");
        return;
      }

      setSuccess(true);
      router.refresh();
      (e.target as HTMLFormElement).reset();
      setRole("faculty");
    } catch {
      setError("Failed to create account");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-lg space-y-4 rounded-xl border border-slate-200 bg-white p-6"
    >
      <h2 className="text-lg font-semibold">Create Staff Account</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">First Name</label>
          <input
            name="first_name"
            required
            placeholder={formPlaceholders.firstName}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Last Name</label>
          <input
            name="last_name"
            required
            placeholder={formPlaceholders.lastName}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Email</label>
        <input
          name="email"
          type="email"
          required
          placeholder={formPlaceholders.staffEmail}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Password</label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          placeholder={formPlaceholders.password}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Role</label>
        <select
          name="role"
          required
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="faculty">Faculty</option>
          <option value="org_member">Organization Member</option>
        </select>
      </div>

      {role === "org_member" && (
        <div>
          <label className="mb-1 block text-sm font-medium">Organization</label>
          <select
            name="organization_id"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            defaultValue=""
          >
            <option value="" disabled>
              Select organization…
            </option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
          {organizations.length === 0 && (
            <p className="mt-1 text-xs text-amber-600">
              Create an organization first before adding org members.
            </p>
          )}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">Department</label>
        <input
          name="department"
          placeholder={formPlaceholders.department}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && (
        <p className="text-sm text-green-600">Account created successfully.</p>
      )}

      <button
        type="submit"
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Create Account
      </button>
    </form>
  );
}
