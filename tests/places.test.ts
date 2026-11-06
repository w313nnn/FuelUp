import { describe, expect, it } from "vitest";
import { directionsUrl, mapsSearchUrl, parsePlaces, parsePhoton, selectPlaces, defaultDiningPreferences } from "../src/services/places";
const origin = { lat: 3.12, lon: 101.65 };
describe("real places and Maps links", () => {
  it("maps Photon coordinates in longitude-latitude order and validates place IDs", () => {
    const result = parsePhoton({ features: [{ type: "Feature", properties: { osm_type: "W", osm_id: 358006589, osm_key: "amenity", osm_value: "fast_food", name: "Kafe Sains" }, geometry: { type: "Point", coordinates: [101.6544093, 3.1247175] } }, { bad: true }] }, origin);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("way/358006589");
    expect(result[0].lat).toBe(3.1247175);
    expect(result[0].lon).toBe(101.6544093);
  });
  it("accepts named mapped venues and rejects malformed or abandoned data", () => {
    const results = parsePlaces({ elements: [
      { type: "node", id: 1, lat: 3.1201, lon: 101.65, tags: { name: "Cafe & Kitchen", amenity: "cafe" } },
      { type: "way", id: 2, center: { lat: 3.121, lon: 101.65 }, tags: { name: "Food court", amenity: "food_court" } },
      { type: "node", id: 3, lat: 200, lon: 0, tags: { name: "Invalid", amenity: "restaurant" } },
      { type: "node", id: 4, lat: 3.12, lon: 101.65, tags: { name: "Closed", amenity: "restaurant", disused: "yes" } },
      { type: "node", id: 5, lat: 3.12, lon: 101.65, tags: { amenity: "cafe" } },
    ] }, origin);
    expect(results.map(p => p.name)).toEqual(["Cafe & Kitchen", "Food court"]);
    expect(results[0].distance).toBeLessThan(results[1].distance);
  });
  it("never guesses dietary suitability from a venue name", () => {
    const places = parsePlaces({ elements: [
      { type: "node", id: 1, ...origin, tags: { name: "Halal sounding name", amenity: "restaurant" } },
      { type: "node", id: 2, ...origin, tags: { name: "Tagged place", amenity: "fast_food", "diet:halal": "yes" } },
    ] }, origin);
    expect(selectPlaces(places, { ...defaultDiningPreferences, diet: "halal" }).map(p => p.id)).toEqual(["node/2"]);
    expect(selectPlaces(places, { ...defaultDiningPreferences, quick: true }).map(p => p.id)).toEqual(["node/2"]);
    expect(selectPlaces(places, { ...defaultDiningPreferences, diet: "vegan" })).toEqual([]);
  });
  it("links walking directions to exact coordinates from the current location", () => {
    const url = new URL(directionsUrl({ lat: 3.13, lon: 101.66 }, origin));
    expect(url.hostname).toBe("www.google.com");
    expect(url.searchParams.get("origin")).toBe("3.12,101.65");
    expect(url.searchParams.get("destination")).toBe("3.13,101.66");
    expect(url.searchParams.get("travelmode")).toBe("walking");
    expect(new URL(directionsUrl(origin)).searchParams.has("origin")).toBe(false);
    expect(() => directionsUrl({ lat: NaN, lon: 0 })).toThrow();
  });
  it("encodes preference and location for a real Google Maps search", () => {
    const url = new URL(mapsSearchUrl({ diet: "vegetarian", radius: 1000, quick: true }, "Campus & City"));
    expect(url.searchParams.get("api")).toBe("1");
    expect(url.searchParams.get("query")).toBe("cheap vegetarian healthy meals restaurants near Campus & City");
    const drinks = new URL(mapsSearchUrl({ ...defaultDiningPreferences, category: "drinks" }, "Campus"));
    expect(drinks.searchParams.get("query")).toBe("cafes tea coffee near Campus");
  });
});
