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

## Try the demo

1. Start at 11:45 with a 45-minute gap before class, or select **Use live time**.
2. Choose **On campus** to find nearby food with Google Maps directions, or **At my dorm** for a recipe using what’s in your fridge.
3. Select **I've eaten** to log the meal and update your spending or fridge stock.

Use **Timetable** to edit or import classes, **My fridge** to add ingredients, and **Preferences** to set your budget and equipment.

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

FuelUp finds breaks between classes, then checks which meals fit the time, budget, ingredients, and equipment available. It favours options near you and ingredients that expire soon. Before logging a meal, it checks that the recommendation is still valid and hasn’t already been logged.

## Backend integration

The app stores data locally through `FuelUpRepository`. A future Express or Firestore adapter could support sign-in and sync. Keep validation and meal rules, and save meal logs, stock, and spending together on the server to prevent duplicate updates.

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
