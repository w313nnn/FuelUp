import { describe, expect, it } from "vitest";
import { findGap, recommend, completeMeal } from "../src/domain/engine";
import { createSeed } from "./fixtures";
import { parseTimetable } from "../src/domain/validation";
const now = new Date("2026-11-06T11:45:00");
describe("daily rescue loop", () => {
  it("finds a 45 minute lunch gap", () => {
    expect(findGap(createSeed(now).timetable, now)?.minutes).toBe(45);
  });
  it("does not trigger during class", () => {
    expect(
      findGap(createSeed(now).timetable, new Date("2026-11-06T10:00:00")),
    ).toBeNull();
  });
  it("finds a meal window with no classes", () => {
    expect(findGap([], now)?.minutes).toBe(60);
  });
  it("does not trigger outside meal windows", () => {
    expect(findGap([], new Date("2026-11-06T03:00:00"))).toBeNull();
  });
  it("selects affordable campus dining on campus", () => {
    expect(recommend(createSeed(now), now)?.kind).toBe("buy");
  });
  it("uses expiring inventory in the dorm", () => {
    const s = createSeed(now);
    s.user.location = "dorm";
    expect(recommend(s, now)?.kind).toBe("cook");
  });
  it("strictly excludes incompatible equipment", () => {
    const s = createSeed(now);
    s.user.location = "dorm";
    s.user.equipment = ["Toaster Oven"];
    s.user.dailyBudget = 0;
    expect(recommend(s, now)).toBeNull();
  });
  it("excludes expired ingredients", () => {
    const s = createSeed(now);
    s.user.location = "dorm";
    s.user.dailyBudget = 0;
    s.fridge.forEach((i) => (i.expiresOn = "2026-11-05"));
    expect(recommend(s, now)).toBeNull();
  });
  it("excludes insufficient ingredients", () => {
    const s = createSeed(now);
    s.user.location = "dorm";
    s.user.dailyBudget = 0;
    s.fridge.forEach((i) => (i.quantity = 0));
    expect(recommend(s, now)).toBeNull();
  });
  it("never exceeds remaining daily budget", () => {
    const s = createSeed(now);
    s.user.dailyBudget = 1;
    s.fridge = [];
    expect(recommend(s, now)).toBeNull();
  });
  it("rejects a route that cannot fit the gap", () => {
    const s = createSeed(now);
    s.fridge = [];
    s.dining.forEach((d) => (d.queueMinutes = 60));
    expect(recommend(s, now)).toBeNull();
  });
  it("supports emergency rescue outside meal windows", () => {
    const s = createSeed(now);
    expect(recommend(s, new Date("2026-11-06T16:00:00"), true)).not.toBeNull();
  });
  it("allows completion as an unbounded meal window advances", () => {
    const s = createSeed(now);
    s.timetable = [];
    const r = recommend(s, now)!;
    expect(
      completeMeal(s, r, new Date("2026-11-06T11:50:00")).meals,
    ).toHaveLength(1);
  });
  it("suppresses proactive reminders after eating", () => {
    const s = createSeed(now);
    const r = recommend(s, now)!;
    const next = completeMeal(s, r, now);
    expect(recommend(next, now)).toBeNull();
  });
  it("consumes recipe quantities only on completion", () => {
    const s = createSeed(now);
    s.user.location = "dorm";
    const r = recommend(s, now)!;
    const next = completeMeal(s, r, now);
    expect(next.fridge.find((i) => i.name === "eggs")?.quantity).toBe(1);
    expect(s.fridge.find((i) => i.name === "eggs")?.quantity).toBe(3);
  });
  it("does not log the same completion twice", () => {
    const s = createSeed(now);
    const r = recommend(s, now)!;
    const next = completeMeal(s, r, now);
    expect(completeMeal(next, r, now).meals).toHaveLength(next.meals.length);
  });
  it("supports a kettle-only pantry recipe", () => {
    const s = createSeed(now);
    s.user.location = "dorm";
    s.user.equipment = ["Kettle"];
    expect(recommend(s, now)?.item.id).toBe("r2");
  });
  it("allows full kitchens to use microwave recipes", () => {
    const s = createSeed(now);
    s.user.location = "dorm";
    s.user.equipment = ["Full Kitchen"];
    expect(recommend(s, now)?.item.id).toBe("r1");
  });
  it("excludes meals before opening and after last orders", () => {
    const s = createSeed(now);
    s.fridge = [];
    s.dining.forEach((d) => {
      d.open = "12:00";
    });
    expect(recommend(s, now)).toBeNull();
    s.dining.forEach((d) => {
      d.open = "08:00";
      d.close = "11:48";
    });
    expect(recommend(s, now)).toBeNull();
  });
  it("rejects gaps too short to eat", () => {
    const s = createSeed(now);
    s.timetable[2].start = "11:55";
    expect(findGap(s.timetable, now)).toBeNull();
  });
  it("counts dorm travel and refuses a stale meal completion", () => {
    const s = createSeed(now);
    const r = recommend(s, now)!;
    s.user.dailyBudget = 0;
    expect(() => completeMeal(s, r, now)).toThrow("context changed");
    s.user.location = "campus";
    s.user.dormWalkMinutes = 40;
    expect(recommend(s, now)).toBeNull();
  });
  it("uses multiple inventory lots in expiry order", () => {
    const s = createSeed(now);
    s.user.location = "dorm";
    s.fridge[0].quantity = 1;
    s.fridge.push({
      ...s.fridge[0],
      id: "other",
      quantity: 2,
      expiresOn: "2026-11-08",
    });
    const next = completeMeal(s, recommend(s, now)!, now);
    expect(next.fridge.find((i) => i.id === "other")?.quantity).toBe(1);
  });
});
describe("schedule import validation", () => {
  it("imports a valid weekly schedule", () => {
    expect(
      parseTimetable(JSON.stringify(createSeed(now).timetable)),
    ).toHaveLength(3);
  });
  it.each(["{}", "[]", '[{"day":9}]', "bad json"])(
    "rejects invalid input %s",
    (input) => {
      expect(() => parseTimetable(input)).toThrow();
    },
  );
  it("rejects backwards class times", () => {
    const entries = createSeed(now).timetable;
    entries[0].end = "07:00";
    expect(() => parseTimetable(JSON.stringify(entries))).toThrow();
  });
  it("rejects overlapping classes", () => {
    const entries = createSeed(now).timetable;
    entries[1].start = "09:45";
    expect(() => parseTimetable(JSON.stringify(entries))).toThrow();
  });
  it("rejects oversized uploads", () => {
    expect(() => parseTimetable(" ".repeat(100001))).toThrow("100 KB");
  });
  it("rejects duplicate IDs", () => {
    const entries = createSeed(now).timetable;
    entries[1].id = entries[0].id;
    expect(() => parseTimetable(JSON.stringify(entries))).toThrow("Duplicate");
  });
});
