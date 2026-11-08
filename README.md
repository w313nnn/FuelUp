# FuelUp

FuelUp helps university students find or cook a meal between classes.

| Feature | What it does |
| --- | --- |
| Timetable reminders | Spot gaps between classes and get a reminder to eat. |
| Nearby food and drinks | Find places near campus and open walking directions in Google Maps. |
| Fridge recipes | Find recipes that fit your ingredients and kitchen equipment. |
| Budget and meal journal | Log meals and drinks and track your daily spending. |

Built with React, TypeScript, and Tailwind CSS.

[Try the live demo](https://fuelup-student.fancyjade4.chatgpt.site/) · [Buildathon credits and team permissions](TEAM_PERMISSIONS.md)

## Run

Requires Node.js 22.12+ (tested on Node 24) and npm.

```sh
npm ci
npm run dev
npm run test:coverage
npm run build
npm run preview
```

The development server uses http://127.0.0.1:5173. Production output is `dist/`. Tailwind 4 uses the official `@tailwindcss/vite` plugin and CSS-first theme tokens. See the [Tailwind Vite setup](https://tailwindcss.com/docs/installation/using-vite) and [Vite guide](https://vite.dev/guide/).

## Try the loop

1. The demo starts at 11:45 on your device's current date, with a 45-minute gap before the next class. “Demo day” is explicit; select **Use live time** for a clock that refreshes every 30 seconds while the app is open.
2. **On campus** opens real restaurant lookup. Use current location or enter a university and city, then choose food preference and search radius. The closest mapped match links to Google Maps walking directions.
3. Switch to **At my dorm** to get the microwave egg-and-greens rice bowl using expiring ingredients.
4. Open the meal, follow the route or recipe, and select **I've eaten**. Buying adds to spending; cooking consumes inventory in expiry order. Both create a journal entry and pause proactive suggestions for two hours.
5. Use **Timetable** to add/delete weekly classes or replace the timetable by importing JSON. Download the sample for the exact format. Day 0 is Sunday and day 6 is Saturday; times use local 24-hour HH:mm.
6. Use **My fridge** for quick ingredient entry and **Preferences** to change equipment, budget, name, or dorm travel time. Try Kettle or Toaster Oven to exercise the strict appliance filter.

The starter timetable is a demo; restaurant results come from OpenStreetMap. Currency uses MYR. Restaurant prices, hours, queue times and dietary tags must be confirmed with the venue. No fictional restaurants are included in the production catalog.

## Directory and responsibilities

```text
src/
  main.tsx                   React entry and provider composition
  App.tsx                    Unified dashboard, navigation and loop orchestration
  styles.css                 Tailwind import, tokens, components and breakpoints
  components/
    RescueCard.tsx            One suggested next action, including empty/recently-fed states
    Timetable.tsx             Today’s classes and meal gaps
    Editors.tsx               Timetable import, fridge entry and preferences
    Modal.tsx                 Native dialog with focus restoration and Escape support
    Bowl.tsx                  Original lightweight SVG illustration
  domain/
    models.ts                User, TimetableEntry, FridgeItem, Recipe, DiningSpot, MealLog
    engine.ts                Pure gap detection, ranking, budget, meal completion
    validation.ts            Runtime schemas for imports and persisted data
    time.ts                  Local-day and time utilities
  data/seed.ts               Sample catalog and date-relative starter data
  services/repository.ts     Async repository contract and localStorage adapter
  state/FuelUpProvider.tsx   Shared state, hydration, serialized saves and error state
tests/
  engine.test.ts             Gap, travel, budget, stock, equipment and import edge cases
  repository.test.ts         Persistence, corruption, quota errors and schema versioning
  app.test.tsx               Buy/cook completion through the UI and error feedback
public/sample-timetable.json
```

## Domain contracts

| Model          | Key data                                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| User           | ID, display name, daily budget, currency, exact equipment list, campus/dorm context, dorm travel time     |
| TimetableEntry | ID, weekday 0–6, title, start/end local time, room/location                                               |
| FridgeItem     | ID, normalized ingredient name, quantity, unit, local use-by date                                         |
| Recipe         | ID, required appliances, exact ingredient quantities/units, preparation estimate, steps, sample nutrition |
| DiningSpot     | ID, dish, price, walk and queue estimates, opening hours, sample route and nutrition                      |
| MealLog        | ID, idempotency key, source, cost, nutrition estimate, ISO timestamp                                      |

All six interfaces are exported from `src/domain/models.ts`. `Recommendation` is a discriminated union, so buy and cook components cannot accidentally access the other branch's fields.

## Decision engine

`findGap` checks recurring classes for the current local weekday, refuses to interrupt a class, and identifies the time to the next class. No next class means a conservative 60-minute window. Interventions are considered in breakfast (07:00–10:00), lunch (11:00–14:00), and evening (17:00–21:00) windows. The emergency action bypasses meal-window and recently-fed suppression, but retains class, time, stock, equipment and budget constraints.

Candidate filtering happens **before** ranking:

- Buy must fit remaining budget, opening hours, queue, round-trip walking, 15 minutes to eat, and a 5-minute buffer. Dorm travel is added when relevant.
- Cook must have all required appliances, enough unexpired quantities in matching units, prep/eating/buffer time, and dorm round-trip travel when on campus.
- Full Kitchen explicitly represents all supported appliances. Otherwise every appliance in a recipe must be selected; Hot Plate does not silently imply microwave access.
- Ranking favors the current location and soon-to-expire inventory, then lower time and spending. This is a transparent heuristic, not trained AI or a claim of globally optimal nutrition.

`completeMeal` revalidates against current context, rejects stale actions, prevents duplicate completion of the same recommendation, consumes earliest-expiring lots first, and returns a new immutable state.

## Backend integration seam

Inject a `FuelUpRepository` into `FuelUpProvider`:

```ts
interface FuelUpRepository {
  load(): Promise<AppState>;
  save(state: AppState): Promise<void>;
}
```

Replace `LocalRepository` with an Express HTTP or Firestore adapter. Retain validation and pure decision logic, but move meal completion and stock/budget changes into an authenticated server transaction with a unique idempotency key. For multi-device use, replace whole-state saves with versioned commands; the current adapter is intentionally single-device and does not resolve concurrent tabs.

Suggested backend boundaries: authenticated `/me`, `/timetable`, `/inventory`, `/catalog`, and `/meal-completions`. Add calendar provider adapters to normalize imported events into recurring entries, including explicit timezone and term/holiday boundaries. For real campus routing, replace the coarse campus/dorm context and example times with a location service and route estimates to the actual next classroom. Keep server secrets out of the client bundle.

## Features and limits

| Area | What FuelUp supports |
| --- | --- |
| Timetable | Edit classes or import JSON. Meal reminders run while the app is open. |
| Recipes | Get 15 simple recipes that match your ingredients and kitchen equipment, including no-cook options. |
| Nearby food and drinks | Find real places through OpenStreetMap and open walking directions in Google Maps. Food suggestions prioritise balanced options where menus support them. |
| Budget and journal | Track meals, drinks, and spending on your device. Logging a drink keeps meal reminders active. |

The prototype uses local storage. Calendar sync, accounts, cross-device sync, background notifications, and live restaurant prices or queues are outside its current scope. Recipe nutrition is illustrative.

## Validation

- `npm test` runs the automated tests.
- `npm run build` checks TypeScript and builds the app.
- Browser checks covered desktop and mobile layouts, recipe completion, and saved journal and fridge updates.

The welcome animation adapts React Bits’ ScrollVelocity. See the [source attribution and licence](public/react-bits-LICENSE.md).
