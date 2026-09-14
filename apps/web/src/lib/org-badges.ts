export type OrgBadgeStatus = "active" | "archived";

export type OrgBadgeKind = "bingo_line" | "streak" | "custom";
export type OrgBadgeAwardRule = "manual" | "point_threshold" | "mapped_program" | "new_registration";

export type OrgBadgeRow = {
  id: string;
  organization_id: string;
  slug: string;
  name: string;
  description: string | null;
  earning_criteria?: string | null;
  minimum_points?: number | null;
  award_rule?: OrgBadgeAwardRule;
  points: number;
  kind: OrgBadgeKind;
  status: OrgBadgeStatus;
  image_url?: string | null;
  created_at: string;
};

export function slugifyBadgeName(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "badge";
}

export function awardRuleLabel(rule: OrgBadgeAwardRule | undefined) {
  switch (rule) {
    case "point_threshold": return "Point threshold";
    case "mapped_program": return "Mapped program / course";
    case "new_registration": return "New registrations";
    default: return "Manual reward";
  }
}

export function badgeStatusLabel(status: OrgBadgeStatus): string {
  return status === "archived" ? "Archived" : "Active";
}

export function badgeStatusClass(status: OrgBadgeStatus): string {
  return status === "archived"
    ? "bg-slate-100 text-slate-600"
    : "bg-teal-50 text-teal-700";
}

export function kindLabel(kind: OrgBadgeKind): string {
  switch (kind) {
    case "bingo_line":
      return "Bingo line";
    case "streak":
      return "Streak";
    default:
      return "Custom";
  }
}
