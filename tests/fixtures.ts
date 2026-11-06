import { createSeed as createAppSeed } from "../src/data/seed";
// Synthetic catalog exists only in tests for future priced-menu integrations.
export function createSeed(now = new Date()) {
  const state = createAppSeed(now);
  state.dining = [
    { id: "d1", name: "Test canteen", dish: "Test rice bowl", description: "Test fixture", price: 6.5, walkMinutes: 4, queueMinutes: 3, open: "08:00", close: "18:00", calories: 520, protein: 28, route: ["Test route"] },
    { id: "d2", name: "Test cafe", dish: "Test toast", description: "Test fixture", price: 4.5, walkMinutes: 7, queueMinutes: 5, open: "07:00", close: "16:00", calories: 340, protein: 15, route: ["Test route"] },
  ];
  return state;
}
