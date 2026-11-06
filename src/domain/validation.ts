import { z } from "zod";
import { EQUIPMENT } from "./models";
import { minutes } from "./time";
const name = z.string().trim().min(1).max(100);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().startsWith(v),
  );
export const entrySchema = z
  .object({
    id: name,
    day: z.number().int().min(0).max(6),
    title: name,
    start: time,
    end: time,
    location: name,
  })
  .refine(
    (e) => minutes(e.end) > minutes(e.start),
    "Class must end after it starts.",
  );
export const timetableSchema = z
  .array(entrySchema)
  .max(100)
  .superRefine((items, ctx) => {
    const ids = new Set<string>();
    items.forEach((a, i) => {
      if (ids.has(a.id))
        ctx.addIssue({ code: "custom", message: "Duplicate class ID." });
      ids.add(a.id);
      if (
        items
          .slice(i + 1)
          .some(
            (b) =>
              a.day === b.day &&
              minutes(a.start) < minutes(b.end) &&
              minutes(b.start) < minutes(a.end),
          )
      )
        ctx.addIssue({ code: "custom", message: "Classes cannot overlap." });
    });
  });
export const fridgeSchema = z.object({
  id: name,
  name: name.transform((v) => v.toLowerCase()),
  quantity: z.number().min(0.1).max(1000),
  unit: z.enum(["piece", "serving"]),
  expiresOn: date,
});
export const userSchema = z.object({
  diningPreferences: z.object({ diet: z.enum(["any", "halal", "vegetarian", "vegan"]), radius: z.union([z.literal(500), z.literal(1000), z.literal(2000)]), quick: z.boolean(), category: z.enum(["food", "drinks"]).default("food") }).optional(),
  id: name,
  name: name,
  dailyBudget: z.number().min(0).max(500),
  currency: z.literal("MYR"),
  equipment: z.array(z.enum(EQUIPMENT)),
  remindersEnabled: z.boolean().default(true),
  location: z.enum(["campus", "dorm"]),
  dormWalkMinutes: z.number().int().min(0).max(60),
});
const amount = z.number().finite().min(0);
export const mealSchema = z.object({
  kind: z.enum(["food", "drink"]).default("food"),
  nutritionKnown: z.boolean().optional(),
  id: name,
  recommendationKey: z.string().max(200),
  title: name,
  source: z.enum(["buy", "cook"]),
  cost: amount,
  calories: amount,
  protein: amount,
  eatenAt: z.string().datetime(),
});
export const savedSchema = z.object({
  version: z.literal(1),
  user: userSchema,
  timetable: timetableSchema,
  fridge: z.array(fridgeSchema).max(300),
  meals: z.array(mealSchema).max(10000),
});
export function parseTimetable(text: string) {
  if (text.length > 100000)
    throw new Error("Use a JSON file smaller than 100 KB.");
  const parsed = timetableSchema.safeParse(JSON.parse(text));
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  if (!parsed.data.length) throw new Error("Add at least one class.");
  return parsed.data;
}
