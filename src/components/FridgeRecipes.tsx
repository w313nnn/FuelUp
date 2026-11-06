import { ChefHat } from "lucide-react";
import { useFuelUp } from "../state/FuelUpProvider";
import { EQUIPMENT } from "../domain/models";
import { findFridgeRecipes, supportedIngredients } from "../domain/recipes";
import { Disclosure } from "./Disclosure";
export function KitchenSetup() {
  const { state, update } = useFuelUp();
  if (!state) return null;
  return (
    <Disclosure label="Kitchen setup" hint={state.user.equipment.length ? `${state.user.equipment.length} appliances selected` : "No appliances selected"}>
    <fieldset className="kitchen-setup">
      <legend>
        <ChefHat size={18} />
        Kitchen setup
      </legend>
      <p className="muted">
        Select what you can use. Changes save automatically.
      </p>
      <div className="equipment-options">
        {EQUIPMENT.map((e) => (
          <label key={e}>
            <input
              type="checkbox"
              checked={state.user.equipment.includes(e)}
              onChange={(event) => {
                const checked = event.target.checked;
                update((s) => ({
                  ...s,
                  user: {
                    ...s.user,
                    equipment: checked
                      ? [...s.user.equipment, e]
                      : s.user.equipment.filter((x) => x !== e),
                  },
                }));
              }}
            />
            {e === "Microwave-only" ? "Microwave" : e}
          </label>
        ))}
      </div>
      <button
        className="text-button"
        onClick={() =>
          update((s) => ({ ...s, user: { ...s.user, equipment: [] } }))
        }
      >
        No appliances — show no-cook recipes
      </button>
    </fieldset>
    </Disclosure>
  );
}
export function FridgeRecipes({ now }: { now: Date }) {
  const { state } = useFuelUp();
  if (!state) return null;
  const recipes = findFridgeRecipes(state, now);
  return (
    <section className="fridge-recipes">
      <div className="section-heading">
        <h2>Cook with my ingredients</h2>
        <span className="muted">{recipes.length} matches</span>
      </div>
      <Disclosure label="Find simple recipes" primary>
        <div aria-live="polite">
          {recipes.length ? (
            recipes.map((r) => (
              <Disclosure className="recipe-option" key={r.id} label={r.title}
                hint={`${r.prepMinutes} min · ${r.equipment.length ? r.equipment.join(" + ") : "No cooking needed"}`}>
                <p className="muted">
                  Use:{" "}
                  {r.ingredients
                    .map((i) => `${i.quantity} ${i.unit} ${i.name}`)
                    .join(", ")}
                  .
                </p>
                <ol>
                  {r.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              </Disclosure>
            ))
          ) : (
            <div className="recipe-empty">
              <h3>No matching recipe yet</h3>
              <p>
                Add an unexpired ingredient below, or change your kitchen setup.
                For example: eggs + microwave; banana + yogurt with no
                appliances.
              </p>
              <Disclosure label="Supported ingredients">
              <p>
                Supported ingredients: {supportedIngredients.join(", ")}. Enter
                rice as “cooked rice” only when already cooked. Each listed
                recipe needs at least one piece or serving of each ingredient.
              </p>
              </Disclosure>
            </div>
          )}
        </div>
      </Disclosure>
    </section>
  );
}
