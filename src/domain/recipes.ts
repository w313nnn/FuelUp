import type { AppState, Equipment, Recipe } from "./models";
import { dayKey } from "./time";
const aliases: Record<string, string> = {
  egg: "eggs",
  eggs: "eggs",
  banana: "banana",
  bananas: "banana",
  tomatoes: "tomato",
  tomato: "tomato",
  cucumbers: "cucumber",
  cucumber: "cucumber",
  potatoes: "potato",
  potato: "potato",
  yoghurt: "yogurt",
  yogurt: "yogurt",
  "greek yogurt": "yogurt",
  "instant oats": "oats",
  oat: "oats",
  oats: "oats",
  "instant noodles": "instant noodles",
  "bread slices": "bread",
  bread: "bread",
  "canned tuna": "canned tuna",
  "tinned tuna": "canned tuna",
  "cheddar cheese": "cheese",
  cheddar: "cheese",
  cheese: "cheese",
  "cooked rice": "cooked rice",
  "leftover rice": "cooked rice",
  spinach: "spinach",
  hummus: "hummus",
};
export const ingredientName = (name: string) => {
  const clean = name.trim().toLowerCase().replace(/\s+/g, " ");
  return aliases[clean] ?? clean;
};
export const supportedIngredients = [
  "eggs",
  "cooked rice",
  "spinach",
  "oats",
  "bread",
  "cheese",
  "tomato",
  "cucumber",
  "banana",
  "yogurt",
  "canned tuna",
  "instant noodles",
  "potato",
  "hummus",
];
type Template = {
  id: string;
  title: string;
  needs: string[];
  gear: Equipment[];
  minutes: number;
  steps: string[];
};
const templates: Template[] = [
  {
    id: "mug-egg",
    title: "Microwave scrambled egg",
    needs: ["eggs"],
    gear: ["Microwave-only"],
    minutes: 3,
    steps: [
      "Crack the egg into a microwave-safe bowl and beat well. Never microwave an egg in its shell.",
      "Cover loosely. Microwave in 20–30 second bursts, stirring each time, until fully set with no liquid egg.",
      "Let stand for one minute before eating. Salt or pepper is optional.",
    ],
  },
  {
    id: "pan-egg",
    title: "Soft scrambled egg",
    needs: ["eggs"],
    gear: ["Hot Plate"],
    minutes: 5,
    steps: [
      "Beat the egg in a bowl. Warm a non-stick pan over low heat; add a little water to help prevent sticking.",
      "Pour in the egg and gently stir until fully set.",
      "Serve warm. Seasoning is optional.",
    ],
  },
  {
    id: "rice-egg",
    title: "Easy egg rice bowl",
    needs: ["eggs", "cooked rice"],
    gear: ["Microwave-only"],
    minutes: 5,
    steps: [
      "Beat the egg in a microwave-safe bowl. Cover loosely and heat in 30-second bursts, stirring until fully set.",
      "Stir in safely refrigerated cooked rice and a splash of water. Cover loosely, then microwave and stir until steaming hot throughout.",
      "Let stand for one minute. Do not use raw rice for this recipe.",
    ],
  },
  {
    id: "greens-rice",
    title: "Spinach rice bowl",
    needs: ["spinach", "cooked rice"],
    gear: ["Microwave-only"],
    minutes: 5,
    steps: [
      "Wash the spinach. Place it in a microwave-safe bowl with safely refrigerated cooked rice and a splash of water.",
      "Cover loosely. Microwave in short bursts, stirring, until the spinach wilts and the rice is steaming hot throughout.",
      "Let stand for one minute. Seasoning is optional.",
    ],
  },
  {
    id: "microwave-oats",
    title: "Microwave porridge",
    needs: ["oats"],
    gear: ["Microwave-only"],
    minutes: 4,
    steps: [
      "Put oats in a large microwave-safe bowl. Add water in the ratio on the packet.",
      "Microwave according to the packet, stirring and watching for overflow.",
      "Let stand until thickened and cool enough to eat.",
    ],
  },
  {
    id: "kettle-oats",
    title: "Kettle oats",
    needs: ["oats"],
    gear: ["Kettle"],
    minutes: 5,
    steps: [
      "Use instant oats suitable for soaking. Put the oats into a heatproof bowl.",
      "Boil water in the kettle, then pour the packet’s recommended amount over the oats. Do not put food in the kettle.",
      "Cover for five minutes or as directed on the packet. Stir and let cool.",
    ],
  },
  {
    id: "pan-oats",
    title: "Stovetop porridge",
    needs: ["oats"],
    gear: ["Hot Plate"],
    minutes: 7,
    steps: [
      "Add oats and the packet’s recommended amount of water to a small saucepan.",
      "Simmer gently, stirring until soft and thickened.",
      "Let cool before eating.",
    ],
  },
  {
    id: "noodles",
    title: "Quick noodle bowl",
    needs: ["instant noodles"],
    gear: ["Kettle"],
    minutes: 5,
    steps: [
      "Use instant noodles labelled suitable for soaking. Place them in a heatproof bowl.",
      "Pour over boiling water as directed on the packet. Cover for the stated time; never cook food inside the kettle.",
      "Stir, check the noodles are softened, and let cool before eating.",
    ],
  },
  {
    id: "cheese-toast",
    title: "Cheese toast",
    needs: ["bread", "cheese"],
    gear: ["Toaster Oven"],
    minutes: 5,
    steps: [
      "Place bread on an oven-safe tray and top with cheese.",
      "Toast at about 180°C, checking frequently, until the cheese melts and the bread is golden.",
      "Remove with oven mitts and let cool briefly.",
    ],
  },
  {
    id: "tomato-toast",
    title: "Tomato cheese toast",
    needs: ["bread", "cheese", "tomato"],
    gear: ["Toaster Oven"],
    minutes: 7,
    steps: [
      "Wash and slice the tomato. Layer it with cheese on the bread.",
      "Place on an oven-safe tray and toast at about 180°C until the cheese melts and the edges turn golden.",
      "Use oven mitts to remove the tray and let cool briefly.",
    ],
  },
  {
    id: "salad",
    title: "Tomato cucumber salad",
    needs: ["tomato", "cucumber"],
    gear: [],
    minutes: 3,
    steps: [
      "Wash the tomato and cucumber.",
      "Cut into bite-size pieces and toss together in a bowl.",
      "Eat as is. Salt, pepper, or a little dressing is optional.",
    ],
  },
  {
    id: "yogurt-bowl",
    title: "Banana yogurt bowl",
    needs: ["banana", "yogurt"],
    gear: [],
    minutes: 2,
    steps: [
      "Peel and slice the banana.",
      "Spoon yogurt into a bowl and add the banana.",
      "Stir gently and enjoy. Keep unused yogurt refrigerated.",
    ],
  },
  {
    id: "tuna-bread",
    title: "Tuna sandwich",
    needs: ["canned tuna", "bread"],
    gear: [],
    minutes: 3,
    steps: [
      "Open and drain ready-to-eat canned tuna.",
      "Spread over the bread, then fold or sandwich together.",
      "Eat promptly and refrigerate any leftover tuna in a covered container.",
    ],
  },
  {
    id: "hummus-bread",
    title: "Hummus sandwich",
    needs: ["hummus", "bread"],
    gear: [],
    minutes: 2,
    steps: [
      "Spread hummus over the bread.",
      "Fold or sandwich together and serve.",
      "Keep unused hummus refrigerated.",
    ],
  },
  {
    id: "potato",
    title: "Microwave baked potato",
    needs: ["potato"],
    gear: ["Microwave-only"],
    minutes: 10,
    steps: [
      "Scrub a medium potato and pierce it several times with a fork.",
      "Place on a microwave-safe plate. Microwave for five minutes, turn, then continue in one-minute bursts until soft all the way through. Do not use foil.",
      "Let stand for two minutes; split carefully because steam will escape.",
    ],
  },
];
export function findFridgeRecipes(state: AppState, now: Date): Recipe[] {
  const valid = state.fridge.filter(
    (i) => i.expiresOn >= dayKey(now) && i.quantity > 0,
  );
  const groups = new Map<
    string,
    {
      name: string;
      unit: "piece" | "serving";
      quantity: number;
      expiresOn: string;
    }
  >();
  for (const i of valid) {
    const key = i.name + "|" + i.unit;
    const existing = groups.get(key);
    groups.set(key, {
      ...i,
      quantity: i.quantity + (existing?.quantity ?? 0),
      expiresOn:
        existing && existing.expiresOn < i.expiresOn
          ? existing.expiresOn
          : i.expiresOn,
    });
  }
  const results: { recipe: Recipe; expiry: string }[] = [];
  for (const template of templates) {
    if (
      !state.user.equipment.includes("Full Kitchen") &&
      !template.gear.every((e) => state.user.equipment.includes(e))
    )
      continue;
    const ingredients: Recipe["ingredients"] = [];
    let expiry = "9999-12-31";
    for (const need of template.needs) {
      const stock = [...groups.values()]
        .filter((i) => ingredientName(i.name) === need && i.quantity >= 1)
        .sort((a, b) => a.expiresOn.localeCompare(b.expiresOn))[0];
      if (!stock) break;
      ingredients.push({ name: stock.name, unit: stock.unit, quantity: 1 });
      expiry = stock.expiresOn < expiry ? stock.expiresOn : expiry;
    }
    if (ingredients.length !== template.needs.length) continue;
    results.push({
      recipe: {
        id: "simple-" + template.id,
        title: template.title,
        description:
          "Made with the ingredients you have. Water is the only required pantry extra.",
        equipment: template.gear,
        ingredients,
        prepMinutes: template.minutes,
        steps: template.steps,
        nutritionKnown: false,
        calories: 0,
        protein: 0,
      },
      expiry,
    });
  }
  return results
    .sort(
      (a, b) =>
        a.expiry.localeCompare(b.expiry) ||
        b.recipe.ingredients.length - a.recipe.ingredients.length ||
        a.recipe.prepMinutes - b.recipe.prepMinutes,
    )
    .map((r) => r.recipe);
}
