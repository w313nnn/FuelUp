import type { AppState } from "./models";
import { findGap } from "./engine";
import { clockMinutes, dayKey } from "./time";
export interface MealReminder {
  id: string;
  time: string;
  at: number;
  gapMinutes: number;
  title: string;
}
export function timetableReminders(state: AppState, now: Date): MealReminder[] {
  const times = [
    ...new Set(
      state.timetable.filter((e) => e.day === now.getDay()).map((e) => e.end),
    ),
  ].sort();
  return times.flatMap((time) => {
    const date = new Date(now);
    const [h, m] = time.split(":").map(Number);
    date.setHours(h, m, 0, 0);
    const gap = findGap(state.timetable, date);
    return gap
      ? [
          {
            id: `${dayKey(now)}:${time}`,
            time,
            at: h * 60 + m,
            gapMinutes: gap.minutes,
            title: `Meal break at ${time}`,
          },
        ]
      : [];
  });
}
export function dueReminder(state: AppState, now: Date) {
  if (
    state.meals.some((m) => {
      const delta = now.getTime() - new Date(m.eatenAt).getTime();
      return m.kind !== "drink" && delta >= 0 && delta < 7200000;
    })
  )
    return undefined;
  const t = clockMinutes(now);
  return timetableReminders(state, now).find(
    (r) => t >= r.at - 5 && t < r.at + 10,
  );
}
