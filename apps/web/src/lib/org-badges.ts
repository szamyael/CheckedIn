export type OrgBadgeStatus = "active" | "archived";

export type OrgBadgeKind = "bingo_line" | "streak" | "custom";

export type OrgBadgeRow = {
  id: string;
  organization_id: string;
  slug: string;
  name: string;
  description: string | null;
  points: number;
  kind: OrgBadgeKind;
  status: OrgBadgeStatus;
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
