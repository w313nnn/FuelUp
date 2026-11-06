import type { AppState, Gap, Recommendation, TimetableEntry } from "./models";
import { clockMinutes, dayKey, minutes, dateOffset } from "./time";
import { findFridgeRecipes } from "./recipes";
const EAT_MINUTES = 15;
const BUFFER = 5;
export function findGap(
  entries: TimetableEntry[],
  now: Date,
  emergency = false,
): Gap | null {
  const t = clockMinutes(now);
  if (
    !emergency &&
    ![
      [420, 600],
      [660, 840],
      [1020, 1260],
    ].some(([a, b]) => t >= a && t < b)
  )
    return null;
  const today = entries
    .filter((e) => e.day === now.getDay())
    .sort((a, b) => minutes(a.start) - minutes(b.start));
  if (today.some((e) => minutes(e.start) <= t && minutes(e.end) > t))
    return null;
  const next = today.find((e) => minutes(e.start) > t);
  const end = Math.min(next ? minutes(next.start) : t + 60, t + 120);
  return end - t >= 20
    ? { start: t, end, minutes: end - t, nextClass: next }
    : null;
}
export function spentToday(state: AppState, now: Date) {
  return state.meals
    .filter((m) => dayKey(new Date(m.eatenAt)) === dayKey(now))
    .reduce((a, m) => a + m.cost, 0);
}
export function recommend(
  state: AppState,
  now: Date,
  emergency = false,
  includeDerivedRecipes = true,
): Recommendation | null {
  const gap = findGap(state.timetable, now, emergency);
  if (
    !gap ||
    (!emergency &&
      state.meals.some((m) => {
        const delta = now.getTime() - new Date(m.eatenAt).getTime();
        return m.kind !== "drink" && delta >= 0 && delta < 120 * 60 * 1000;
      }))
  )
    return null;
  const today = dayKey(now),
    t = clockMinutes(now),
    budget = state.user.dailyBudget - spentToday(state, now);
  const key = (id: string) => `${today}:${gap.end}:${id}`;
  const candidates: { recommendation: Recommendation; score: number }[] = [];
  for (const item of state.dining) {
    const walk =
      item.walkMinutes +
      (state.user.location === "dorm" ? state.user.dormWalkMinutes : 0);
    const total = walk * 2 + item.queueMinutes + EAT_MINUTES + BUFFER;
    if (
      item.price > budget ||
      total > gap.minutes ||
      t < minutes(item.open) ||
      t + walk + item.queueMinutes >= minutes(item.close)
    )
      continue;
    candidates.push({
      recommendation: {
        kind: "buy",
        item,
        key: key(item.id),
        totalMinutes: total,
        reason: `Fits your ${gap.minutes}-minute break, with time to get back. No cooking, no extra decisions.`,
      },
      score:
        60 - total - item.price + (state.user.location === "campus" ? 30 : 0),
    });
  }
  for (const item of [
    ...state.recipes,
    ...(includeDerivedRecipes ? findFridgeRecipes(state, now) : []),
  ]) {
    // Full Kitchen is explicit access to all supported appliances.
    if (
      !state.user.equipment.includes("Full Kitchen") &&
      !item.equipment.every((e) => state.user.equipment.includes(e))
    )
      continue;
    const usable = state.fridge.filter((i) => i.expiresOn >= today);
    if (
      !item.ingredients.every(
        (need) =>
          usable
            .filter((i) => i.name === need.name && i.unit === need.unit)
            .reduce((s, i) => s + i.quantity, 0) >= need.quantity,
      )
    )
      continue;
    const total =
      item.prepMinutes +
      EAT_MINUTES +
      BUFFER +
      (state.user.location === "campus" ? state.user.dormWalkMinutes * 2 : 0);
    if (total > gap.minutes) continue;
    const expiring = usable.filter(
      (i) =>
        i.expiresOn <= dateOffset(now, 1) &&
        item.ingredients.some((n) => n.name === i.name),
    ).length;
    candidates.push({
      recommendation: {
        kind: "cook",
        item,
        key: key(item.id),
        totalMinutes: total,
        reason: expiring
          ? "Use your soon-to-expire ingredients. A warm meal, with no extra spend."
          : "You have everything you need. A simple meal that fits your equipment.",
      },
      score:
        55 - total + expiring * 8 + (state.user.location === "dorm" ? 35 : 0),
    });
  }
  return (
    candidates.sort((a, b) => b.score - a.score)[0]?.recommendation ?? null
  );
}
export function completeMeal(
  state: AppState,
  r: Recommendation,
  now: Date,
): AppState {
  if (state.meals.some((m) => m.recommendationKey === r.key)) return state;
  // Revalidate immediately before consuming stock or spending the budget.
  const eligible = recommend(
    {
      ...state,
      recipes: r.kind === "cook" ? [r.item] : [],
      dining: r.kind === "buy" ? [r.item] : [],
    },
    now,
    true,
    false,
  );
  if (!eligible)
    throw new Error(
      "Your context changed. Please choose your updated recommendation.",
    );
  const fridge = state.fridge.map((i) => ({ ...i }));
  if (r.kind === "cook")
    for (const need of r.item.ingredients) {
      let remaining = need.quantity;
      for (const i of [...fridge].sort((a, b) =>
        a.expiresOn.localeCompare(b.expiresOn),
      )) {
        if (
          i.name !== need.name ||
          i.unit !== need.unit ||
          i.expiresOn < dayKey(now)
        )
          continue;
        const use = Math.min(remaining, i.quantity);
        i.quantity -= use;
        remaining -= use;
      }
    }
  return {
    ...state,
    fridge: fridge.filter((i) => i.quantity > 0),
    meals: [
      ...state.meals,
      {
        id: crypto.randomUUID(),
        recommendationKey: r.key,
        title: r.kind === "buy" ? r.item.dish : r.item.title,
        source: r.kind,
        kind: "food",
        cost: r.kind === "buy" ? r.item.price : 0,
        calories: r.item.calories,
        protein: r.item.protein,
        nutritionKnown: r.kind === "buy" || r.item.nutritionKnown !== false,
        eatenAt: now.toISOString(),
      },
    ],
  };
}
