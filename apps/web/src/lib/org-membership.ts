export type MembershipReportStudent = {
  program: string;
  section: string | null;
  year_level: number | null;
  paid_at: string | null;
};

export function normalizeProgram(program: string): string {
  return program.trim().toLowerCase();
}

export function canManageMembership(program: string, mappedPrograms: string[]): boolean {
  const normalized = normalizeProgram(program);
  return Boolean(normalized) && mappedPrograms.some((mapped) => normalizeProgram(mapped) === normalized);
}

export function canActivateMembership(
  student: MembershipReportStudent,
  mappedPrograms: string[],
): boolean {
  return Boolean(student.paid_at) && canManageMembership(student.program, mappedPrograms);
}

export function filterMembershipReport<T extends MembershipReportStudent>(
  students: T[],
  filters: { section?: string; yearLevel?: string },
): T[] {
  return students.filter((student) =>
    (!filters.section || student.section === filters.section)
    && (!filters.yearLevel || String(student.year_level ?? "") === filters.yearLevel),
  );
}
