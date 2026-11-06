import type { AppState } from "../domain/models";
import { dateOffset } from "../domain/time";
export function createSeed(now = new Date()): AppState {
  return {
    version: 1,
    user: {
      id: "student-local",
      name: "Alex",
      dailyBudget: 20,
      currency: "MYR",
      equipment: ["Microwave-only"],
      location: "campus",
      dormWalkMinutes: 12,
    },
    timetable: [
      {
        id: "c1",
        day: now.getDay(),
        title: "Design thinking",
        start: "09:00",
        end: "10:30",
        location: "Block A · Room 204",
      },
      {
        id: "c2",
        day: now.getDay(),
        title: "Business statistics",
        start: "10:45",
        end: "11:45",
        location: "Block B · Lecture Hall 2",
      },
      {
        id: "c3",
        day: now.getDay(),
        title: "Group project",
        start: "12:30",
        end: "14:00",
        location: "Library · Level 2",
      },
    ],
    fridge: [
      {
        id: "f1",
        name: "eggs",
        quantity: 3,
        unit: "piece",
        expiresOn: dateOffset(now, 1),
      },
      {
        id: "f2",
        name: "cooked rice",
        quantity: 2,
        unit: "serving",
        expiresOn: dateOffset(now, 0),
      },
      {
        id: "f3",
        name: "spinach",
        quantity: 1,
        unit: "serving",
        expiresOn: dateOffset(now, 1),
      },
      {
        id: "f4",
        name: "oats",
        quantity: 4,
        unit: "serving",
        expiresOn: dateOffset(now, 14),
      },
    ],
    recipes: [
      {
        id: "r1",
        title: "Egg & greens rice bowl",
        description: "A warm, comforting bowl from what you already have.",
        equipment: ["Microwave-only"],
        ingredients: [
          { name: "eggs", quantity: 2, unit: "piece" },
          { name: "cooked rice", quantity: 1, unit: "serving" },
          { name: "spinach", quantity: 1, unit: "serving" },
        ],
        prepMinutes: 5,
        calories: 420,
        protein: 19,
        steps: [
          "Use refrigerated cooked rice only if it was cooled promptly and stored safely. When in doubt, discard it.",
          "Beat 2 eggs in a microwave-safe bowl. Add spinach, cover loosely and microwave in 30-second bursts, stirring until the eggs are fully set. Never microwave eggs in their shells.",
          "Add 1 serving of cooked rice and a splash of water. Cover loosely and heat, stirring, until steaming hot throughout. Time varies with your microwave.",
          "Let stand for 1 minute. Season to taste and enjoy.",
        ],
      },
      {
        id: "r2",
        title: "Simple warm oats",
        description: "An easy pantry breakfast in one bowl.",
        equipment: ["Kettle"],
        ingredients: [{ name: "oats", quantity: 1, unit: "serving" }],
        prepMinutes: 5,
        calories: 180,
        protein: 6,
        steps: [
          "Use instant oats suitable for soaking. Put one serving into a heatproof bowl.",
          "Pour boiling water over the oats as directed on the package. Cover and let soften for 5 minutes.",
          "Stir well and let cool before eating.",
        ],
      },
    ],
    dining: [],
    meals: [],
  };
}
