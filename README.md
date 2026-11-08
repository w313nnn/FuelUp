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

## Implemented versus future integrations

Implemented: responsive dashboard, real manual schedule editing and JSON import, runtime validation, meal-gap detection, one ranked buy/cook choice, all five equipment options, quantity-aware inventory, preferences, local persistence, meal journal, budget totals, emergency action, live foreground clock, and loading/error/empty states.

Not connected: university calendar feeds, timetable OCR/PDF parsing, voice transcription, live restaurant prices/queues, AI nutrition estimation, accounts, cross-device sync, background push notifications. The app does not run proactive notifications when closed. Recipe nutrition is illustrative. Demo dates follow the browser's local timezone; production scheduling needs a stored IANA timezone.

## Validation

Run `npm test` for the current unit/integration suite, and `npm run build` for TypeScript and production bundling. Coverage thresholds apply to domain/service layers; visual behavior is checked in the browser.

Browser QA exercised the 1440px desktop and 390px mobile layouts, opening a recipe, completing it, reloading, and verifying the persisted journal entry and deducted fridge quantities. Native dialog focus and Escape behavior come from `<dialog>`. Controls have labels and visible focus indicators, and reduced motion is respected.

Persistence uses a versioned `fuelup:v1` key. Invalid saved data is surfaced instead of silently overwritten; storage write failures preserve the in-memory session and show an error. JSON imports are limited to 100 KB/100 entries and reject invalid dates, duplicate IDs, backwards times, and overlapping classes. Local data is not encrypted; no credentials are stored.

## Extending the visual system

The design follows a restrained Japandi/Muji direction. Tokens live in `styles.css`. For new screens, use warm neutral surfaces, the existing terracotta only for the primary action, readable charcoal text, thin separators, and generous spacing. Keep one clear next step per screen. For illustration briefs: “quiet editorial food illustration, warm ivory and muted earth tones, simple organic shapes, no gradients or decorative clutter.”

## Recipe and reminder update

My fridge now includes editable kitchen setup and an on-demand finder with 15 simple recipes, common singular/plural aliases, expired-stock filtering and quantity checks. Recipes are available regardless of timetable, location or recent meal logs. No-appliance setups support no-cook recipes. New recipes do not invent nutrition estimates.

Timetable reminders appear five minutes before an eligible class-end meal break and for ten minutes afterward. Today and Timetable include a Try demo reminder button. Reminders can be switched off; this preference persists. Optional device notifications require browser permission and live mode. Both in-app and device reminders require the page to remain open; closed-app push is not implemented. Demo previews intentionally bypass recent-meal suppression.

Decorative sidebar, hero, summary and footer captions have been removed. Existing browser data is preserved.

## Welcome page and design update

The root URL now opens a welcome page. Get started opens the existing app at #app; direct app links and refresh preserve that destination. The FuelUp logo returns to the welcome page. ScrollVelocity is adapted from React Bits with the requested velocity 100, six copies, draggable rows, damping 50, stiffness 400, and no skew/scale. A pause control and prefers-reduced-motion support are included. Source attribution and license are in public/react-bits-LICENSE.md.

The UI uses four core colours: paper #f7f6f2, ink #2e332b, terracotta #a7472e, and sage #dde3d3. Typography uses 16px body/control text and 13–14px supporting text, with larger main actions and mobile input text.

## Four-font typography system

Space Grotesk handles brand, navigation, buttons, section headings and the animated marquee. DM Serif Display supplies editorial hero emphasis, screen titles and recipe headlines. DM Sans keeps paragraphs, labels and form entry readable. IBM Plex Mono provides tabular times, prices and quantities. Roles are centralized in src/typography.css and applied across the welcome page and all application screens; the four-colour palette remains unchanged. Google Fonts uses display=swap with local fallbacks.

## Morphing interaction icons

Interactive icons use `morphicons/react` with Lucide icon data from `lucide`, through `UiMorphIcon.tsx`. The shared component uses a snappy spring and respects the operating system's reduced-motion preference. Disclosure buttons morph Menu ↔ X, navigation changes to the active view's icon, reminders reflect enabled/demo states, location and clock controls reflect their mode, restaurant lookup shows searching/result/error states, preferences show save feedback, and the welcome animation morphs Play ↔ Pause. Labels, focus behavior and expanded states remain accessible. Static illustrations and decorative icons keep their existing appearance.

## On-demand details and real Maps links

Disclosure.tsx provides accessible buttons with aria-expanded and aria-controls. Ingredient lists, kitchen equipment, classes, meal history, recipe instructions and restaurant details start collapsed. Hidden content preserves form drafts and cannot receive focus. Primary actions and active reminders remain visible.

NearbyDining.tsx requests location only after a click. Users can alternatively submit a campus/area name. services/places.ts queries Nominatim for an area and Photon for named restaurants, cafes, food courts and fast-food venues within 2 km. Results and area lookups are cached in memory; precise location is not persisted. Venue metadata comes from a batched Nominatim lookup, throttled to one request per second. Food preferences persist with the user. Diet filters require explicit OpenStreetMap tags; unknown suitability never counts as a match. Food results prioritise supported balanced-meal options before distance; drinks use distance. Route times, menu prices and queues are not guessed. Google Maps supplies actual walking routes; manual-area searches leave the origin to Maps so it can use the user's current location.

Only one venue is shown initially; alternatives and details expand on demand. Location denial, missing data, network failures and timeouts expose a preference-aware Google Maps search. Users can log the amount actually paid; nutrition is left unknown. Public map providers have availability and usage limits; a larger deployment should replace the provider adapter with a production service. Google Maps URL format: https://developers.google.com/maps/documentation/urls/get-started. Photon API: https://github.com/komoot/photon/blob/master/docs/api-v1.md.

## Food, drinks and balanced-meal suggestions

Nearby search includes a persistent Food / Drinks selector, defaulting older profiles to Food. Switching reuses the selected location, reloads the relevant venues, cancels obsolete requests and updates Maps search terms. Drinks include cafes and coffee/tea/beverage shops; drink-only cuisine tags are excluded from meal suggestions. Quick-food preferences remain saved but do not exclude cafes in Drinks mode.

Food ranking first enforces the chosen radius, diet and quick-food filters, then prioritises menu-backed build-your-own bowls (Agrain and Salad Atelier), followed by mapped salad/poke options, then unknown menus. Distance breaks ties. Official menus were checked on 6 November 2026: https://agrain.my/menu and https://saladatelier.com/salad-atelier-menu/. This is an ordering heuristic, not a nutrition score, health certification or guarantee about every dish. The top card offers a vegetable/protein/grain order; its details explain the evidence and link the source. Unknown menus never receive a healthier-pick label. Timing, queue and current price claims are not inferred.

Drink suggestions encourage water or unsweetened tea/coffee, with WHO guidance linked. Food suggestions link Malaysia's Healthy Plate guidance. During an uneaten meal break, Drinks offers a direct return to Food. Logs distinguish `kind: food | drink`; both count towards spending, while drinks do not silence meal reminders or suppress recipe rescue. Older logs default to food without losing saved data.
