export type StudentAccountAction =
  | "approve"
  | "request_reregistration"
  | "ban"
  | "lift_ban";

export function studentAccountActions(status: string): StudentAccountAction[] {
  switch (status) {
    case "pending":
      return ["approve", "request_reregistration", "ban"];
    case "active":
      return ["ban"];
    case "suspended":
      return ["lift_ban"];
    case "needs_reregistration":
      return ["ban"];
    default:
      return [];
  }
}
