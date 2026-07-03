import { format } from "date-fns";

interface AchievementRow {
  id: string;
  badge_name: string;
  badge_type: string;
  earned_at: string;
  students:
    | {
        student_id: string;
        first_name: string;
        last_name: string;
        program: string;
      }
    | {
        student_id: string;
        first_name: string;
        last_name: string;
        program: string;
      }[]
    | null;
  events: { title: string } | { title: string }[] | null;
}

export function StudentAchievementsPanel({
  achievements,
}: {
  achievements: AchievementRow[];
}) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Student Achievements</h2>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Program</th>
              <th className="px-4 py-3 font-medium">Badge</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Event</th>
              <th className="px-4 py-3 font-medium">Earned</th>
            </tr>
          </thead>
          <tbody>
            {achievements.map((a) => {
              const student = Array.isArray(a.students)
                ? a.students[0]
                : a.students;
              const event = Array.isArray(a.events) ? a.events[0] : a.events;
              return (
                <tr key={a.id} className="border-b border-slate-100">
                  <td className="px-4 py-3">
                    {student
                      ? `${student.first_name} ${student.last_name}`
                      : "—"}
                    {student && (
                      <span className="ml-1 font-mono text-xs text-slate-600">
                        {student.student_id}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {student?.program ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-medium">{a.badge_name}</td>
                  <td className="px-4 py-3 capitalize">{a.badge_type}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {event?.title ?? (a.badge_type === "milestone" ? "—" : "—")}
                  </td>
                  <td className="px-4 py-3">
                    {format(new Date(a.earned_at), "MMM d, yyyy h:mm a")}
                  </td>
                </tr>
              );
            })}
            {achievements.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-700">
                  No achievements earned yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
