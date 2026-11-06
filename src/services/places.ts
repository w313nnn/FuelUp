import { z } from "zod";
import { compareFoodChoices, matchesCategory, type DiningCategory } from "../domain/dining";

export type Point = { lat: number; lon: number };
export type FoodPreference = "any" | "halal" | "vegetarian" | "vegan";
export type DiningPreferences = { diet: FoodPreference; radius: number; quick: boolean; category?: DiningCategory };
export type NearbyPlace = Point & { id: string; name: string; cuisine: string; distance: number; address: string; tags: Record<string, string> };
const pointSchema = z.object({ lat: z.number().finite().min(-90).max(90), lon: z.number().finite().min(-180).max(180) });
const elementSchema = z.object({
  type: z.enum(["node", "way", "relation"]), id: z.number().int().positive(),
  lat: z.number().optional(), lon: z.number().optional(), center: pointSchema.optional(),
  tags: z.record(z.string(), z.string()),
});
const placeCache = new Map<string, { expires: number; places: NearbyPlace[] }>();
const areaCache = new Map<string, Point & { label: string }>();
let lastAreaRequest = 0;
async function nominatim(url: string, signal: AbortSignal) {
  const delay = Math.max(0, lastAreaRequest + 1000 - Date.now());
  lastAreaRequest = Date.now() + delay;
  if (delay) await new Promise<void>((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(new DOMException("Aborted", "AbortError")); };
    const timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve(); }, delay);
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
  });
  return fetch(url, { signal });
}
export const defaultDiningPreferences: DiningPreferences = { diet: "any", radius: 1000, quick: false, category: "food" };

export function distanceMetres(a: Point, b: Point) {
  const rad = Math.PI / 180;
  const x = Math.sin((b.lat - a.lat) * rad / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin((b.lon - a.lon) * rad / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(Math.max(0, 1 - x)));
}
export function parsePlaces(data: unknown, origin: Point): NearbyPlace[] {
  pointSchema.parse(origin);
  const envelope = z.object({ elements: z.array(z.unknown()).max(5000) }).parse(data);
  const places: NearbyPlace[] = [];
  for (const raw of envelope.elements) {
    const result = elementSchema.safeParse(raw);
    if (!result.success) continue;
    const e = result.data, tags = e.tags;
    const p = pointSchema.safeParse(e.center ?? { lat: e.lat, lon: e.lon });
    if (!p.success || !tags.name?.trim() || !(["restaurant", "fast_food", "cafe", "food_court"].includes(tags.amenity) || ["coffee", "tea", "beverages"].includes(tags.shop)) || tags.disused === "yes" || tags.abandoned === "yes") continue;
    const name = tags.name.trim().slice(0, 100);
    if (places.some(v => v.name === name && distanceMetres(v, p.data) < 40)) continue;
    places.push({ ...p.data, id: `${e.type}/${e.id}`, name, tags,
      cuisine: (tags.cuisine || tags.amenity || tags.shop).replaceAll("_", " ").replaceAll(";", " · ").slice(0, 100),
      address: [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"]].filter(Boolean).join(" ").slice(0, 200),
      distance: Math.round(distanceMetres(origin, p.data)) });
  }
  return places.sort((a, b) => a.distance - b.distance);
}
export function selectPlaces(places: NearbyPlace[], prefs: DiningPreferences) {
  const category = prefs.category ?? "food";
  return places.filter(p => p.distance <= prefs.radius
    && matchesCategory(p, category)
    && (category === "drinks" || !prefs.quick || ["fast_food", "food_court"].includes(p.tags.amenity))
    && (prefs.diet === "any" || ["yes", "only"].includes(p.tags[`diet:${prefs.diet}`])
      || (prefs.diet === "vegetarian" && ["yes", "only"].includes(p.tags["diet:vegan"]))))
    .sort(category === "food" ? compareFoodChoices : (a, b) => a.distance - b.distance).slice(0, 10);
}
export function parsePhoton(data: unknown, origin: Point) {
  const envelope = z.object({ features: z.array(z.unknown()).max(100) }).parse(data);
  const featureSchema = z.object({
    geometry: z.object({ type: z.literal("Point"), coordinates: z.tuple([z.number(), z.number()]) }),
    properties: z.object({ osm_type: z.enum(["N", "W", "R"]), osm_id: z.number(), name: z.string(), osm_key: z.enum(["amenity", "shop"]), osm_value: z.string(), street: z.string().optional(), city: z.string().optional(), extra: z.record(z.string(), z.string()).optional() }),
  });
  const elements = envelope.features.flatMap(raw => {
    const result = featureSchema.safeParse(raw);
    if (!result.success) return [];
    const { properties: p, geometry: g } = result.data;
    return [{ type: ({ N: "node", W: "way", R: "relation" })[p.osm_type], id: p.osm_id, lon: g.coordinates[0], lat: g.coordinates[1],
      tags: { ...p.extra, name: p.name, [p.osm_key]: p.osm_value, "addr:street": p.street ?? "", "addr:city": p.city ?? "" } }];
  });
  return parsePlaces({ elements }, origin);
}
export function directionsUrl(place: Point, origin?: Point) {
  pointSchema.parse(place);
  const params = new URLSearchParams({ api: "1", destination: `${place.lat},${place.lon}`, travelmode: "walking", dir_action: "navigate" });
  if (origin) { pointSchema.parse(origin); params.set("origin", `${origin.lat},${origin.lon}`); }
  return `https://www.google.com/maps/dir/?${params}`;
}
export function mapsSearchUrl(prefs: DiningPreferences, area = "", origin?: Point) {
  const food = `${prefs.category !== "drinks" && prefs.quick ? "cheap " : ""}${prefs.diet === "any" ? "" : `${prefs.diet} `}${prefs.category === "drinks" ? "cafes tea coffee" : "healthy meals restaurants"}`;
  const near = origin ? `${origin.lat},${origin.lon}` : area.trim().slice(0, 150) || "me";
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: "1", query: `${food} near ${near}` })}`;
}
export function locate(): Promise<Point> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Location is unavailable. Search your campus or area instead."));
    navigator.geolocation.getCurrentPosition(pos => resolve(pointSchema.parse({ lat: pos.coords.latitude, lon: pos.coords.longitude })),
      () => reject(new Error("Couldn’t access your location. Allow location access, or search your campus or area.")),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
  });
}
export async function findArea(area: string, signal: AbortSignal): Promise<Point & { label: string }> {
  const query = area.trim();
  if (query.length < 3 || query.length > 150) throw new Error("Enter a campus or area name (3–150 characters).");
  const cached = areaCache.get(query.toLowerCase());
  if (cached) return cached;
  const response = await nominatim(`https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q: query, format: "json", limit: "1" })}`, signal);
  if (!response.ok) throw new Error("Area search is busy. Use your location or open Google Maps.");
  const results = z.array(z.object({ lat: z.string(), lon: z.string(), display_name: z.string() })).parse(await response.json());
  if (!results.length) throw new Error("Area not found. Include your university and city, or use your location.");
  const areaPoint = { ...pointSchema.parse({ lat: Number(results[0].lat), lon: Number(results[0].lon) }), label: results[0].display_name };
  if (areaCache.size >= 20) areaCache.clear();
  areaCache.set(query.toLowerCase(), areaPoint);
  return areaPoint;
}
export async function fetchPlaces(origin: Point, signal: AbortSignal, category: DiningCategory = "food"): Promise<NearbyPlace[]> {
  pointSchema.parse(origin);
  const cacheKey = `${category}:${origin.lat.toFixed(4)},${origin.lon.toFixed(4)}`;
  const cached = placeCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.places.map(p => ({ ...p, distance: Math.round(distanceMetres(origin, p)) }));
  const params = new URLSearchParams({ lat: origin.lat.toFixed(3), lon: origin.lon.toFixed(3), radius: "2.1", limit: "20" });
  const categories = category === "food" ? ["amenity:restaurant", "amenity:fast_food", "amenity:food_court"] : ["amenity:cafe", "shop:coffee", "shop:tea", "shop:beverages"];
  for (const type of categories) params.append("osm_tag", type);
  const response = await fetch(`https://photon.komoot.io/reverse?${params}`, { signal });
  if (!response.ok) throw new Error("Nearby search is busy. Try again or open Google Maps below.");
  let places = parsePhoton(await response.json(), origin);
  if (places.length) {
    try {
      const ids = places.map(p => p.id.replace("node/", "N").replace("way/", "W").replace("relation/", "R")).join(",");
      const details = await nominatim(`https://nominatim.openstreetmap.org/lookup?${new URLSearchParams({ osm_ids: ids, format: "json", extratags: "1" })}`, signal);
      if (details.ok) {
        const tags = z.array(z.object({ osm_type: z.string(), osm_id: z.number(), extratags: z.record(z.string(), z.string()).nullish() })).parse(await details.json());
        places = places.map(p => {
          const extra = tags.find(t => `${t.osm_type}/${t.osm_id}` === p.id)?.extratags ?? {};
          return { ...p, tags: { ...p.tags, ...extra }, cuisine: (extra.cuisine ?? p.cuisine).replaceAll("_", " ").replaceAll(";", " · ").slice(0, 100) };
        });
      }
    } catch (e) { if (signal.aborted) throw e; /* Missing metadata never implies dietary suitability. */ }
  }
  if (placeCache.size >= 20) placeCache.clear();
  placeCache.set(cacheKey, { places, expires: Date.now() + 600000 });
  return places;
}
