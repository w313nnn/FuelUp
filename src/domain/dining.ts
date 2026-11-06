import type { NearbyPlace, FoodPreference } from "../services/places";

export type DiningCategory = "food" | "drinks";
const drinkCuisines = new Set(["coffee_shop", "coffee", "tea", "bubble_tea", "juice", "smoothie"]);
const cuisines = (place: NearbyPlace) => (place.tags.cuisine ?? "").toLowerCase().split(";").map(s => s.trim()).filter(Boolean);

export function matchesCategory(place: NearbyPlace, category: DiningCategory) {
  const types = cuisines(place);
  const drinkOnly = types.length > 0 && types.every(t => drinkCuisines.has(t));
  if (category === "drinks") return place.tags.amenity === "cafe"
    || ["coffee", "tea", "beverages"].includes(place.tags.shop)
    || (["restaurant", "fast_food"].includes(place.tags.amenity) && drinkOnly);
  return ["restaurant", "fast_food", "food_court"].includes(place.tags.amenity) && !drinkOnly
    || place.tags.amenity === "cafe" && types.length > 0 && !drinkOnly;
}

export interface MealChoice {
  priority: number;
  reason: string;
  order: string;
  source?: { label: string; url: string };
}

/** Ordering hints, not nutrition scores or a claim that every dish is healthy. */
export function mealChoice(place: NearbyPlace, diet: FoodPreference = "any"): MealChoice {
  const plantBased = diet === "vegan" || diet === "vegetarian";
  const protein = plantBased ? "tofu or beans" : "tofu, beans, fish or chicken";
  const brand = (place.tags.brand || "").toLowerCase().trim();
  const name = place.name.toLowerCase().trim();
  if (brand === "agrain" || /^agrain(?:$|\s*[@(–—-])/.test(name)) return {
    priority: 3,
    reason: "The published menu offers vegetables, brown rice and protein choices.",
    order: `Build a bowl with brown rice, vegetables and ${plantBased ? "chickpeas or tofu" : "chickpeas, tofu or chicken"}. Ask for dressing on the side.`,
    source: { label: "Agrain menu", url: "https://agrain.my/menu" },
  };
  if (brand === "salad atelier" || /^salad atelier(?:$|\s*[@(–—-]|\s+(?:express|select|signature)\b)/.test(name)) return {
    priority: 3,
    reason: "The published menu offers custom bowls with a base, protein and toppings.",
    order: `Choose vegetables, a grain base and ${protein}. Ask for dressing on the side.`,
    source: { label: "Salad Atelier menu", url: "https://saladatelier.com/salad-atelier-menu/" },
  };
  if (cuisines(place).some(c => ["salad", "poke"].includes(c))) return {
    priority: 2,
    reason: "Salad or bowl options are listed on the map; confirm the current menu.",
    order: `Ask for a bowl with vegetables, ${protein} and rice or grains. Go easy on sauces.`,
  };
  return {
    priority: 0,
    reason: "No menu evidence for a healthier pick yet. This is a nearby meal option.",
    order: `If available, choose vegetables, ${protein} and rice or grains. Prefer steamed or grilled dishes.`,
  };
}

export function compareFoodChoices(a: NearbyPlace, b: NearbyPlace) {
  return mealChoice(b).priority - mealChoice(a).priority || a.distance - b.distance;
}

export const healthyPlateSource = "https://sites.google.com/moh.gov.my/kospen-kkm/skop/amalan-pemakanan-sihat";
export const healthyDrinkSource = "https://www.who.int/initiatives/behealthy/healthy-diet";
