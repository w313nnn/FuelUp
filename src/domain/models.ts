export const EQUIPMENT = [
  "Microwave-only",
  "Hot Plate",
  "Kettle",
  "Toaster Oven",
  "Full Kitchen",
] as const;
export type Equipment = (typeof EQUIPMENT)[number];
export interface User {
  diningPreferences?: { diet: "any" | "halal" | "vegetarian" | "vegan"; radius: number; quick: boolean; category?: "food" | "drinks" };
  id: string;
  name: string;
  dailyBudget: number;
  currency: "MYR";
  equipment: Equipment[];
  location: "campus" | "dorm";
  dormWalkMinutes: number;
  remindersEnabled?: boolean;
}
export interface TimetableEntry {
  id: string;
  day: number;
  title: string;
  start: string;
  end: string;
  location: string;
}
export interface FridgeItem {
  id: string;
  name: string;
  quantity: number;
  unit: "piece" | "serving";
  expiresOn: string;
}
export interface Recipe {
  nutritionKnown?: boolean;
  id: string;
  title: string;
  description: string;
  equipment: Equipment[];
  ingredients: { name: string; quantity: number; unit: FridgeItem["unit"] }[];
  prepMinutes: number;
  calories: number;
  protein: number;
  steps: string[];
}
export interface DiningSpot {
  id: string;
  name: string;
  dish: string;
  description: string;
  price: number;
  walkMinutes: number;
  queueMinutes: number;
  open: string;
  close: string;
  calories: number;
  protein: number;
  route: string[];
}
export interface MealLog {
  kind?: "food" | "drink";
  nutritionKnown?: boolean;
  id: string;
  recommendationKey: string;
  title: string;
  source: "buy" | "cook";
  cost: number;
  calories: number;
  protein: number;
  eatenAt: string;
}
export interface AppState {
  version: 1;
  user: User;
  timetable: TimetableEntry[];
  fridge: FridgeItem[];
  recipes: Recipe[];
  dining: DiningSpot[];
  meals: MealLog[];
}
export interface Gap {
  start: number;
  end: number;
  minutes: number;
  nextClass?: TimetableEntry;
}
export type Recommendation =
  | {
      kind: "buy";
      item: DiningSpot;
      key: string;
      totalMinutes: number;
      reason: string;
    }
  | {
      kind: "cook";
      item: Recipe;
      key: string;
      totalMinutes: number;
      reason: string;
    };
