import { addWeeks, format, startOfWeek, subWeeks } from "date-fns";

/**
 * @param {Date} now
 * @returns {{ start: Date, end: Date, label: string }[]}
 */
export function buildAttendanceTrendPeriods(now) {
  const firstWeek = startOfWeek(subWeeks(now, 11), { weekStartsOn: 1 });

  return Array.from({ length: 12 }, (_, index) => {
    const start = addWeeks(firstWeek, index);
    const currentWeek = index === 11;
    return {
      start,
      end: currentWeek ? now : addWeeks(start, 1),
      label: format(currentWeek ? now : start, "MMM d"),
    };
  });
}
