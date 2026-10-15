import { programNameKey } from "./program-name.ts";

export type MembershipReportStudent = {
  program: string;
  section: string | null;
  year_level: number | null;
  paid_at: string | null;
  student_id?: string;
  first_name?: string;
  last_name?: string;
};

export type MembershipAction = "mark_paid" | "mark_unpaid" | "activate" | "disable";

type MembershipUserUpdate = {
  status: "active" | "disabled";
  disabled_at: string | null;
  account_status_reason: string | null;
};

export function normalizeProgram(program: string): string {
  return programNameKey(program);
}

export function membershipActionChanges(
  action: MembershipAction,
  now: string,
): { paidAt: string | null | undefined; userUpdate: MembershipUserUpdate | null } {
  if (action === "mark_paid") {
    return {
      paidAt: now,
      userUpdate: { status: "active", disabled_at: null, account_status_reason: null },
    };
  }
  if (action === "mark_unpaid") {
    return {
      paidAt: null,
      userUpdate: {
        status: "disabled",
        disabled_at: now,
        account_status_reason: "Membership disabled by organization",
      },
    };
  }
  if (action === "activate") {
    return {
      paidAt: undefined,
      userUpdate: { status: "active", disabled_at: null, account_status_reason: null },
    };
  }
  return {
    paidAt: undefined,
    userUpdate: {
      status: "disabled",
      disabled_at: now,
      account_status_reason: "Membership disabled by organization",
    },
  };
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
  filters: { section?: string; yearLevel?: string; search?: string; paidStatus?: "all" | "paid" | "unpaid" },
): T[] {
  const search = filters.search?.trim().toLocaleLowerCase();
  return students.filter((student) => {
    const matchesSearch = !search || [
      student.student_id,
      student.first_name,
      student.last_name,
      student.program,
    ].some((value) => value?.toLocaleLowerCase().includes(search));
    return (!filters.section || student.section === filters.section)
      && (!filters.yearLevel || String(student.year_level ?? "") === filters.yearLevel)
      && (!filters.paidStatus || filters.paidStatus === "all"
        || (filters.paidStatus === "paid" ? Boolean(student.paid_at) : !student.paid_at))
      && matchesSearch;
  });
}
