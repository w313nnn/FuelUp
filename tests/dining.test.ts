import { describe, expect, it } from "vitest";
import { mealChoice } from "../src/domain/dining";
import { defaultDiningPreferences, selectPlaces, type NearbyPlace } from "../src/services/places";
import { createSeed } from "../src/data/seed";
import { dueReminder } from "../src/domain/reminders";
import { recommend, spentToday } from "../src/domain/engine";
import { savedSchema } from "../src/domain/validation";
const now = new Date("2026-11-06T11:45:00");
const place = (id: string, distance: number, tags: Record<string, string>, name = id): NearbyPlace => ({ id, name, distance, tags, lat: 3.12, lon: 101.65, cuisine: tags.cuisine ?? tags.amenity ?? tags.shop, address: "" });

describe("food, drinks and balanced meal ranking", () => {
  it("puts menu-backed balanced choices above closer unknown menus", () => {
    const near = place("near", 100, { amenity: "fast_food", cuisine: "burger" });
    const bowl = place("bowl", 400, { amenity: "restaurant", cuisine: "salad" });
    const menu = place("menu", 700, { amenity: "restaurant", brand: "Agrain" });
    expect(selectPlaces([near, bowl, menu], defaultDiningPreferences).map(p => p.id)).toEqual(["menu", "bowl", "near"]);
    expect(mealChoice(menu, "vegan").order).toContain("chickpeas or tofu");
    expect(mealChoice(menu).source?.url).toBe("https://agrain.my/menu");
  });
  it("does not infer health from a name, vegetarian tag, or general cuisine", () => {
    const unknown = place("unknown", 100, { amenity: "restaurant", cuisine: "indian", "diet:vegan": "yes" }, "Healthy fried snacks");
    expect(mealChoice(unknown).priority).toBe(0);
    expect(mealChoice(unknown).reason).toContain("No menu evidence");
  });
  it("keeps distance and dietary filters ahead of health ranking", () => {
    const far = place("far", 1700, { amenity: "restaurant", brand: "Agrain", "diet:halal": "yes" });
    const unknownDiet = place("salad", 100, { amenity: "restaurant", cuisine: "salad" });
    const allowed = place("allowed", 500, { amenity: "food_court", "diet:halal": "yes" });
    expect(selectPlaces([far, unknownDiet, allowed], { ...defaultDiningPreferences, diet: "halal" }).map(p => p.id)).toEqual(["allowed"]);
  });
  it("separates drink-only venues from meals and keeps cafes usable with quick-food preference", () => {
    const cafe = place("cafe", 100, { amenity: "cafe" });
    const tea = place("tea", 200, { shop: "tea" });
    const bubbleTea = place("bubble", 300, { amenity: "fast_food", cuisine: "bubble_tea" });
    const food = place("food", 50, { amenity: "restaurant", cuisine: "malaysian" });
    const all = [food, cafe, tea, bubbleTea];
    expect(selectPlaces(all, defaultDiningPreferences).map(p => p.id)).toEqual(["food"]);
    expect(selectPlaces(all, { ...defaultDiningPreferences, category: "drinks", quick: true }).map(p => p.id)).toEqual(["cafe", "tea", "bubble"]);
  });
  it("counts drink spending without suppressing meal rescue or reminders", () => {
    const state = createSeed(now);
    state.user.location = "dorm";
    state.meals.push({ id: "drink", recommendationKey: "drink", title: "Tea", source: "buy", kind: "drink", cost: 3, calories: 0, protein: 0, nutritionKnown: false, eatenAt: now.toISOString() });
    expect(spentToday(state, now)).toBe(3);
    expect(recommend(state, now)?.kind).toBe("cook");
    expect(dueReminder(state, now)?.time).toBe("11:45");
    expect(savedSchema.parse(state).meals[0].kind).toBe("drink");
    state.meals[0].kind = "food";
    expect(recommend(state, now)).toBeNull();
    expect(dueReminder(state, now)).toBeUndefined();
  });
  it("loads older preferences and meal logs without resetting student data", () => {
    const state = createSeed(now);
    state.user.diningPreferences = { diet: "halal", radius: 500, quick: true };
    state.meals.push({ id: "old", recommendationKey: "old", title: "Lunch", source: "buy", cost: 6, calories: 0, protein: 0, eatenAt: now.toISOString() });
    const saved = savedSchema.parse(state);
    expect(saved.user.diningPreferences?.category).toBe("food");
    expect(saved.meals[0].kind).toBe("food");
    expect(saved.fridge).toHaveLength(state.fridge.length);
  });
});
