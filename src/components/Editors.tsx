import { useState, type FormEvent } from "react";
import { Download, Plus, Trash2, Upload } from "lucide-react";
import { useFuelUp } from "../state/FuelUpProvider";
import { EQUIPMENT } from "../domain/models";
import {
  entrySchema,
  fridgeSchema,
  parseTimetable,
  timetableSchema,
  userSchema,
} from "../domain/validation";
import { dayKey, timeLabel } from "../domain/time";
import { KitchenSetup, FridgeRecipes } from "./FridgeRecipes";
import { supportedIngredients } from "../domain/recipes";
import { Disclosure } from "./Disclosure";
import { Save, Check } from "lucide";
import { UiMorphIcon } from "./UiMorphIcon";
const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
function ErrorText({ error }: { error: string }) {
  return error ? (
    <p role="alert" className="error-text">
      {error}
    </p>
  ) : null;
}
export function ScheduleEditor() {
  const { state, update } = useFuelUp();
  const [error, setError] = useState("");
  if (!state) return null;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    try {
      const entry = entrySchema.parse({
        ...data,
        id: crypto.randomUUID(),
        day: Number(data.day),
      });
      const timetable = timetableSchema.parse([...state.timetable, entry]);
      update((s) => ({ ...s, timetable }));
      setError("");
      form.reset();
    } catch {
      setError(
        "Check your class times. Classes on the same day cannot overlap.",
      );
    }
  };
  const upload = async (file?: File) => {
    if (!file) return;
    try {
      if (file.size > 100000 || !file.name.endsWith(".json"))
        throw new Error("Choose a JSON timetable under 100 KB.");
      const timetable = parseTimetable(await file.text());
      update((s) => ({ ...s, timetable }));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not import timetable.");
    }
  };
  return (
    <div className="editor">
      <Disclosure label="Import timetable">
      <div className="import-row">
        <label className="secondary file-button">
          <Upload size={16} /> Import JSON
          <input
            type="file"
            accept=".json,application/json"
            onChange={(e) => {
              void upload(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        <a className="text-button" href="/sample-timetable.json" download>
          <Download size={15} /> Sample file
        </a>
      </div>
      <p className="fine-print">Import a JSON timetable from your device.</p>
      </Disclosure>
      <ErrorText error={error} />
      <Disclosure label="View weekly classes" count={state.timetable.length}>
      <div className="schedule-list">
        {state.timetable.length === 0 && <p className="muted">No classes added yet.</p>}
        {[...state.timetable]
          .sort((a, b) => a.day - b.day || a.start.localeCompare(b.start))
          .map((e) => (
            <div className="list-row" key={e.id}>
              <div>
                <strong>{e.title}</strong>
                <small>
                  {days[e.day]} · {timeLabel(e.start)}–{timeLabel(e.end)} ·{" "}
                  {e.location}
                </small>
              </div>
              <button
                className="icon-button"
                aria-label={`Delete ${e.title}`}
                onClick={() =>
                  update((s) => ({
                    ...s,
                    timetable: s.timetable.filter((c) => c.id !== e.id),
                  }))
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
      </div>
      </Disclosure>
      <Disclosure label="Add a class">
      <form onSubmit={submit} className="form-grid">
        <label className="full">
          Class name
          <input
            name="title"
            maxLength={100}
            placeholder="e.g. Introduction to psychology"
            required
          />
        </label>
        <label>
          Day
          <select name="day" defaultValue={new Date().getDay()}>
            {days.map((d, i) => (
              <option value={i} key={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label>
          Location
          <input
            name="location"
            placeholder="Block A, room 204"
            maxLength={100}
            required
          />
        </label>
        <label>
          Starts
          <input name="start" type="time" required />
        </label>
        <label>
          Ends
          <input name="end" type="time" required />
        </label>
        <button className="primary full" type="submit">
          <Plus size={17} /> Add class
        </button>
      </form>
      </Disclosure>
    </div>
  );
}
export function FridgeEditor({ now }: { now: Date }) {
  const { state, update } = useFuelUp();
  const [error, setError] = useState("");
  if (!state) return null;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    try {
      const item = fridgeSchema.parse({
        ...data,
        id: crypto.randomUUID(),
        quantity: Number(data.quantity),
      });
      if (state.fridge.length >= 300) throw new Error();
      update((s) => ({ ...s, fridge: [...s.fridge, item] }));
      setError("");
      form.reset();
    } catch {
      setError(
        "Add a name, valid expiry date, and a quantity between 0.1 and 1,000.",
      );
    }
  };
  return (
    <div className="editor">
      <FridgeRecipes now={now} />
      <KitchenSetup />
      <Disclosure label="View ingredients" count={state.fridge.length}>
      <div>
        {state.fridge.length === 0 && <p className="muted">Your fridge is empty. Add an ingredient to get started.</p>}
        {state.fridge.map((i) => (
          <div className="list-row" key={i.id}>
            <div>
              <strong>{i.name}</strong>
              <small>
                {i.quantity} {i.unit}
                {i.quantity !== 1 ? "s" : ""} ·{" "}
                {i.expiresOn < dayKey(now) ? "Expired" : "Use by"} {i.expiresOn}
              </small>
            </div>
            <button
              className="icon-button"
              aria-label={`Remove ${i.name}`}
              onClick={() =>
                update((s) => ({
                  ...s,
                  fridge: s.fridge.filter((f) => f.id !== i.id),
                }))
              }
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      </Disclosure>
      <Disclosure label="Add ingredients">
      <form className="form-grid" onSubmit={submit}>
        <label className="full">
          Ingredient
          <input
            name="name"
            list="ingredient-names"
            placeholder="e.g. eggs, cooked rice, spinach"
            maxLength={100}
            required
          />
          <datalist id="ingredient-names">
            {supportedIngredients.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </datalist>
        </label>
        <label>
          Quantity
          <input
            name="quantity"
            type="number"
            step="0.1"
            min="0.1"
            max="1000"
            defaultValue="1"
            required
          />
        </label>
        <label>
          Unit
          <select name="unit">
            <option value="piece">Pieces</option>
            <option value="serving">Servings</option>
          </select>
        </label>
        <label className="full">
          Use-by date
          <input
            name="expiresOn"
            type="date"
            defaultValue={dayKey(now)}
            required
          />
        </label>
        <ErrorText error={error} />
        <button className="primary full" type="submit">
          <Plus size={17} /> Add ingredient
        </button>
      </form>
      <p className="fine-print">
        Recipes update as you add ingredients. Common names such as egg/eggs and
        yogurt/yoghurt are supported. Expired items are excluded.
      </p>
      </Disclosure>
    </div>
  );
}
export function SettingsEditor() {
  const { state, update } = useFuelUp();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  if (!state) return null;
  return (
    <form
      className="editor form-grid"
      onChange={() => setSaved(false)}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const parsed = userSchema.safeParse({
          ...state.user,
          name: data.get("name"),
          dailyBudget: Number(data.get("dailyBudget")),
          dormWalkMinutes: Number(data.get("dormWalkMinutes")),
          equipment: data.getAll("equipment"),
        });
        if (!parsed.success) {
          setError("Check your name, budget, and travel time.");
          return;
        }
        update((s) => ({ ...s, user: parsed.data }));
        setError("");
        setSaved(true);
      }}
    >
      <p className="muted full">
        Your day, your setup. Recommendations will adjust to match.
      </p>
      <label className="full">
        What should we call you?
        <input
          name="name"
          defaultValue={state.user.name}
          maxLength={100}
          required
        />
      </label>
      <label>
        Daily food budget (RM)
        <input
          name="dailyBudget"
          type="number"
          min="0"
          max="500"
          step="0.5"
          defaultValue={state.user.dailyBudget}
          required
        />
      </label>
      <label>
        Dorm ↔ campus walk (min)
        <input
          name="dormWalkMinutes"
          type="number"
          min="0"
          max="60"
          defaultValue={state.user.dormWalkMinutes}
          required
        />
      </label>
      <fieldset className="full">
        <legend>Your dorm equipment</legend>
        <div className="equipment-options">
          {EQUIPMENT.map((e) => (
            <label key={e}>
              <input
                type="checkbox"
                name="equipment"
                value={e}
                defaultChecked={state.user.equipment.includes(e)}
              />
              {e}
            </label>
          ))}
        </div>
      </fieldset>
      <ErrorText error={error} />
      <button className="primary full"><UiMorphIcon icon={saved ? Check : Save} /> Save preferences</button>
      {saved && (
        <p className="success full" role="status">
          Preferences saved.
        </p>
      )}
      <p className="fine-print full">
        “Full Kitchen” means access to every listed appliance, including a
        microwave. Select individual appliances for a more exact match.
      </p>
    </form>
  );
}
