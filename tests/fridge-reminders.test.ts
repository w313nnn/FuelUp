import { describe, it, expect } from "vitest";
import { createSeed } from "../src/data/seed";
import { findFridgeRecipes } from "../src/domain/recipes";
import { timetableReminders, dueReminder } from "../src/domain/reminders";
const now = new Date("2026-11-06T11:45:00");
describe("on-demand fridge recipes", () => {
  it("works outside meal windows and away from dorm", () => {
    const s = createSeed(now);
    expect(
      findFridgeRecipes(s, new Date("2026-11-06T03:00:00")).length,
    ).toBeGreaterThan(0);
  });
  it("recognizes singular and plural ingredients", () => {
    const s = createSeed(now);
    s.fridge = s.fridge.filter((i) => i.name === "eggs");
    s.fridge[0].name = "Egg";
    expect(
      findFridgeRecipes(s, now).some(
        (r) => r.title === "Microwave scrambled egg",
      ),
    ).toBe(true);
  });
  it("makes a simple recipe without all three original ingredients", () => {
    const s = createSeed(now);
    s.fridge = s.fridge.filter((i) => i.name === "eggs");
    expect(findFridgeRecipes(s, now)).toHaveLength(1);
  });
  it("obeys the actual kitchen setup", () => {
    const s = createSeed(now);
    s.fridge = s.fridge.filter((i) => i.name === "eggs");
    s.user.equipment = ["Kettle"];
    expect(findFridgeRecipes(s, now)).toHaveLength(0);
    s.user.equipment = ["Hot Plate"];
    expect(findFridgeRecipes(s, now)[0].title).toBe("Soft scrambled egg");
  });
  it("supports no-cook meals without appliances", () => {
    const s = createSeed(now);
    s.user.equipment = [];
    s.fridge = [
      {
        id: "a",
        name: "Bananas",
        quantity: 1,
        unit: "piece",
        expiresOn: "2026-11-07",
      },
      {
        id: "b",
        name: "yoghurt",
        quantity: 1,
        unit: "serving",
        expiresOn: "2026-11-07",
      },
    ];
    expect(findFridgeRecipes(s, now)[0].title).toBe("Banana yogurt bowl");
  });
  it("excludes expired or insufficient stock", () => {
    const s = createSeed(now);
    s.fridge.forEach((i) => (i.expiresOn = "2026-11-05"));
    expect(findFridgeRecipes(s, now)).toHaveLength(0);
  });
  it("does not confuse raw rice with cooked rice", () => {
    const s = createSeed(now);
    s.fridge = [
      {
        id: "a",
        name: "rice",
        quantity: 1,
        unit: "serving",
        expiresOn: "2026-11-07",
      },
    ];
    expect(findFridgeRecipes(s, now)).toHaveLength(0);
  });
});
describe("timetable reminders", () => {
  it("creates the lunch reminder from the class end", () => {
    expect(
      timetableReminders(createSeed(now), now).some((r) => r.time === "11:45"),
    ).toBe(true);
  });
  it("appears five minutes before the gap", () => {
    const s = createSeed(now);
    expect(dueReminder(s, new Date("2026-11-06T11:40:00"))?.time).toBe("11:45");
  });
  it("does not appear early or after a recent meal", () => {
    const s = createSeed(now);
    expect(dueReminder(s, new Date("2026-11-06T10:00:00"))).toBeUndefined();
    s.meals.push({
      id: "m",
      recommendationKey: "a",
      source: "cook",
      title: "Lunch",
      cost: 0,
      calories: 200,
      protein: 10,
      eatenAt: now.toISOString(),
    });
    expect(dueReminder(s, now)).toBeUndefined();
  });
  it("recomputes after editing the timetable", () => {
    const s = createSeed(now);
    s.timetable[1].end = "12:00";
    expect(timetableReminders(s, now).some((r) => r.time === "12:00")).toBe(
      true,
    );
  });
});
