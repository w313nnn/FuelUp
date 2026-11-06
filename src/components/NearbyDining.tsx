import { useEffect, useRef, useState, type FormEvent } from "react";
import { MapPin, Navigation, ArrowUpRight, Search } from "lucide-react";
import { Navigation as NavigationData, Search as SearchData, MapPin as MapPinData, CircleAlert, Utensils, CupSoda, Check, Leaf } from "lucide";
import { UiMorphIcon } from "./UiMorphIcon";
import { Disclosure } from "./Disclosure";
import { useFuelUp } from "../state/FuelUpProvider";
import { spentToday } from "../domain/engine";
import { healthyDrinkSource, healthyPlateSource, mealChoice, type DiningCategory } from "../domain/dining";
import { defaultDiningPreferences, directionsUrl, fetchPlaces, findArea, locate, mapsSearchUrl, selectPlaces, type NearbyPlace, type Point } from "../services/places";

export function NearbyDining({ now, gap }: { now: Date; gap: number }) {
  const { state, update } = useFuelUp();
  const [area, setArea] = useState("");
  const [origin, setOrigin] = useState<Point>();
  const [fromGps, setFromGps] = useState(false);
  const [areaLabel, setAreaLabel] = useState("");
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState("");
  const [logged, setLogged] = useState<string[]>([]);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => { request.current?.abort(); request.current = null; }, []);
  if (!state) return null;
  const prefs = state.user.diningPreferences ?? defaultDiningPreferences;
  const category = prefs.category ?? "food";
  const drinks = category === "drinks";
  const matches = selectPlaces(places, prefs);
  const remaining = Math.max(0, state.user.dailyBudget - spentToday(state, now));
  const hasEaten = state.meals.some(m => m.kind !== "drink" && now.getTime() - new Date(m.eatenAt).getTime() >= 0 && now.getTime() - new Date(m.eatenAt).getTime() < 7200000);
  const search = async (gps: boolean, selectedCategory = category, reusePoint?: Point) => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 22000);
    setStatus("loading"); setError(""); setPlaces([]); setOrigin(undefined); setFromGps(false);
    try {
      const point = reusePoint ?? (gps ? await locate() : await findArea(area, controller.signal));
      if (controller.signal.aborted) throw new Error("Search timed out.");
      setOrigin(point); setFromGps(gps);
      if (!reusePoint) setAreaLabel(gps ? "Near your current location" : `Near ${"label" in point ? point.label : area}`);
      const result = await fetchPlaces(point, controller.signal, selectedCategory);
      if (request.current !== controller) return;
      setPlaces(result); setStatus("ready");
    } catch (e) {
      if (request.current !== controller) return;
      setError(controller.signal.aborted ? "Search timed out. Try again or open Google Maps." : e instanceof Error ? e.message : "Nearby search is unavailable. Open Google Maps below.");
      setStatus("error");
    } finally { clearTimeout(timeout); }
  };
  const changeCategory = (next: DiningCategory) => {
    if (next === category) return;
    update(s => ({ ...s, user: { ...s.user, diningPreferences: { ...prefs, category: next } } }));
    request.current?.abort(); request.current = null;
    setPlaces([]); setError("");
    if (origin) void search(fromGps, next, origin);
    else setStatus("idle");
  };
  const logMeal = (event: FormEvent<HTMLFormElement>, place: NearbyPlace) => {
    event.preventDefault();
    const amount = Number(new FormData(event.currentTarget).get("amount"));
    const logKey = `${category}:${place.id}`;
    if (!Number.isFinite(amount) || amount < 0 || amount > 10000 || logged.includes(logKey)) return;
    const id = crypto.randomUUID();
    update(s => ({ ...s, meals: [...s.meals, { id, recommendationKey: `place:${id}`, title: place.name, source: "buy", kind: drinks ? "drink" : "food", cost: amount, calories: 0, protein: 0, nutritionKnown: false, eatenAt: now.toISOString() }] }));
    setLogged(v => [...v, logKey]);
  };
  const placeCard = (place: NearbyPlace, top = false) => {
    const choice = mealChoice(place, prefs.diet);
    return <article className="nearby-place" key={place.id}>
    {top && <p className="place-pick"><UiMorphIcon icon={drinks ? CupSoda : Leaf} size={18} />{drinks ? "Your drink stop" : choice.priority ? "Top pick for a balanced meal" : "Nearby meal option"}</p>}
    <h3>{place.name}</h3>
    <p className="muted">{place.cuisine} · {place.distance < 1000 ? `${place.distance} m` : `${(place.distance / 1000).toFixed(1)} km`} away in a straight line</p>
    {top && <div className="healthy-order">
      <strong>{drinks ? "Keep it simple" : "Try this order"}</strong>
      <p>{drinks ? "Choose water or unsweetened tea or coffee. Ask for no added syrup or sugar." : choice.order}</p>
    </div>}
    <a className="primary w-full" href={directionsUrl(place, fromGps ? origin : undefined)} target="_blank" rel="noopener noreferrer">
      <Navigation size={18} /> Walk there with Google Maps <ArrowUpRight size={18} />
    </a>
    <Disclosure label={drinks ? "Drink stop details" : "Restaurant details"}>
      {!drinks && <>
        <p>{choice.reason}</p>
        <p className="muted">Balanced-meal options are prioritised, then distance. Nutrition, portions and availability vary; this is an ordering suggestion.</p>
        {choice.source && <a className="text-button" href={choice.source.url} target="_blank" rel="noopener noreferrer">{choice.source.label} <ArrowUpRight size={16} /></a>}
      </>}
      {place.address && <p>{place.address}</p>}
      {prefs.diet !== "any" && <p>Tagged {prefs.diet} in OpenStreetMap. Confirm with the restaurant.</p>}
      <p className="muted">Check opening hours, menu prices and the walking route in Maps. Queue times are unavailable.</p>
      <a className="text-button" href={`https://www.openstreetmap.org/${place.id}`} target="_blank" rel="noopener noreferrer">View map listing <ArrowUpRight size={16} /></a>
      <a className="text-button" href={drinks ? healthyDrinkSource : healthyPlateSource} target="_blank" rel="noopener noreferrer">{drinks ? "WHO healthy drink guidance" : "Malaysian Healthy Plate guide"} <ArrowUpRight size={16} /></a>
    </Disclosure>
    <Disclosure label={drinks ? "Log a drink here" : "Log a meal here"}>
      {logged.includes(`${category}:${place.id}`) ? <p role="status">{drinks ? "Drink logged. It won’t count as a meal." : "Meal logged."}</p> : <form className="nearby-log" onSubmit={e => logMeal(e, place)}>
        <label>Amount paid (RM)<input name="amount" type="number" min="0" max="10000" step="0.01" required /></label>
        <button className="secondary" type="submit">{drinks ? "Log drink" : "Log meal"}</button>
      </form>}
    </Disclosure>
  </article>;
  };
  return <section className="panel nearby-panel" aria-label="Nearby food and drinks">
    <div className="section-heading"><h2><MapPin size={21} /> {drinks ? "Drinks near you" : "Food near you"}</h2></div>
    <div className="dining-categories" role="group" aria-label="Find food or drinks">
      <button type="button" aria-pressed={!drinks} onClick={() => changeCategory("food")}><UiMorphIcon icon={drinks ? Utensils : Check} /> Food</button>
      <button type="button" aria-pressed={drinks} onClick={() => changeCategory("drinks")}><UiMorphIcon icon={drinks ? Check : CupSoda} /> Drinks</button>
    </div>
    <p className="nearby-context">{gap ? `${gap} min free` : "No meal gap right now"} · RM {remaining.toFixed(2)} left today</p>
    <button className="primary w-full" disabled={status === "loading"} onClick={() => void search(true)}>
      <UiMorphIcon icon={status === "loading" ? SearchData : status === "ready" ? MapPinData : status === "error" ? CircleAlert : NavigationData} size={22} /> {status === "loading" ? drinks ? "Finding drink stops…" : "Finding restaurants…" : "Use my current location"}
    </button>
    <Disclosure label="Area & food preferences">
      <div className="form-grid nearby-preferences">
        <label>Food preference<select value={prefs.diet} onChange={e => update(s => ({ ...s, user: { ...s.user, diningPreferences: { ...prefs, diet: e.target.value as typeof prefs.diet } } }))}>
          <option value="any">Any food</option><option value="halal">Halal</option><option value="vegetarian">Vegetarian</option><option value="vegan">Vegan</option>
        </select></label>
        <label>Search radius<select value={prefs.radius} onChange={e => update(s => ({ ...s, user: { ...s.user, diningPreferences: { ...prefs, radius: Number(e.target.value) } } }))}>
          <option value="500">500 metres</option><option value="1000">1 kilometre</option><option value="2000">2 kilometres</option>
        </select></label>
        {!drinks && <label className="full nearby-check"><input type="checkbox" checked={prefs.quick} onChange={e => update(s => ({ ...s, user: { ...s.user, diningPreferences: { ...prefs, quick: e.target.checked } } }))} /> Quick & casual only</label>}
      </div>
      <form className="nearby-area" onSubmit={e => { e.preventDefault(); void search(false); }}>
        <label>Campus or area<input value={area} onChange={e => setArea(e.target.value)} placeholder="University and city" minLength={3} maxLength={150} required /></label>
        <button className="secondary" disabled={status === "loading"} type="submit"><Search size={17} /> Search this area</button>
      </form>
      <p className="fine-print">Your location goes to OpenStreetMap’s search provider to find nearby places. It isn’t saved. Google Maps handles directions.</p>
    </Disclosure>
    {drinks && gap > 0 && !hasEaten && <div className="drink-meal-cue"><p>You have a meal break now. Pair your drink with food.</p><button className="text-button" onClick={() => changeCategory("food")}>Find a meal <ArrowUpRight size={16} /></button></div>}
    <div aria-live="polite" aria-busy={status === "loading"}>
      {error && <p role="alert" className="error-text">{error}</p>}
      {status === "ready" && <>
        <p className="nearby-area-label">{areaLabel}</p>
        {matches.length ? <>
          {placeCard(matches[0], true)}
          {matches.length > 1 && <Disclosure label={drinks ? "More drink stops" : "More nearby restaurants"} count={matches.length - 1}>{matches.slice(1).map(place => placeCard(place))}</Disclosure>}
        </> : <p>No mapped places match these filters. Try a wider radius, change preferences, or search Google Maps.</p>}
      </>}
    </div>
    <a className="text-button nearby-maps" href={mapsSearchUrl(prefs, area, origin)} target="_blank" rel="noopener noreferrer">Search Google Maps <ArrowUpRight size={17} /></a>
    <p className="fine-print">Places: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>. Confirm current hours and prices in Maps.</p>
  </section>;
}
