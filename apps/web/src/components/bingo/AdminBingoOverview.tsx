import { createClient } from "@/lib/supabase/server";

export async function AdminBingoOverview() {
  const supabase = await createClient();

  const { data: cards } = await supabase
    .from("bingo_cards")
    .select(
      "id, title, season_label, is_active, streak_threshold, organizations(name)",
    )
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: awards } = await supabase
    .from("student_org_badges")
    .select(
      "id, earned_at, points_awarded, org_badges(name), students(student_id, first_name, last_name)",
    )
    .order("earned_at", { ascending: false })
    .limit(15);

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Bingo oversight
        </h2>
        <p className="text-sm text-slate-600">
          Active organization bingo cards and recent badge awards (read-only).
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-700">Cards</h3>
          {(cards ?? []).length === 0 ? (
            <p className="text-sm text-slate-400">No bingo cards yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {(cards ?? []).map((c) => {
                const org = Array.isArray(c.organizations)
                  ? c.organizations[0]
                  : c.organizations;
                return (
                  <li
                    key={c.id}
                    className="rounded-lg border border-slate-100 px-3 py-2"
                  >
                    <span className="font-medium">{c.title}</span>
                    <span className="text-slate-500">
                      {" "}
                      · {org?.name ?? "Org"} · {c.season_label}
                    </span>
                    {c.is_active && (
                      <span className="ml-2 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                        ACTIVE
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-700">
            Recent awards
          </h3>
          {(awards ?? []).length === 0 ? (
            <p className="text-sm text-slate-400">No org badge awards yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {(awards ?? []).map((a) => {
                const student = Array.isArray(a.students)
                  ? a.students[0]
                  : a.students;
                const badge = Array.isArray(a.org_badges)
                  ? a.org_badges[0]
                  : a.org_badges;
                return (
                  <li
                    key={a.id}
                    className="rounded-lg border border-slate-100 px-3 py-2"
                  >
                    {student
                      ? `${student.first_name} ${student.last_name}`
                      : "Student"}{" "}
                    → {badge?.name ?? "Badge"} (+{a.points_awarded})
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
