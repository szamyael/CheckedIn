export const BREAK_LIMIT_EXPIRED_MESSAGE =
  "Your break time limit has ended. You can no longer break in or check out.";

export function breakDeadlineAt(
  breakOutAt: string | null | undefined,
  limitMinutes: number | null | undefined,
): Date | null {
  if (!breakOutAt || limitMinutes == null || !Number.isFinite(limitMinutes) || limitMinutes < 1) {
    return null;
  }
  return new Date(new Date(breakOutAt).getTime() + limitMinutes * 60_000);
}

export function isBreakTimeExpired(params: {
  status: string | null | undefined;
  breakOutAt: string | null | undefined;
  limitMinutes: number | null | undefined;
  now?: Date;
}): boolean {
  if (params.status !== "on_break") return false;
  const deadline = breakDeadlineAt(params.breakOutAt, params.limitMinutes);
  if (!deadline) return false;
  return (params.now ?? new Date()).getTime() > deadline.getTime();
}
