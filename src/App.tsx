import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
  CupSoda,
  Clock3,
  Flame,
  Leaf,
  MapPin,
  Plus,
  Refrigerator,
  Settings2,
  Utensils,
  Wallet,
  Zap,
} from "lucide-react";
import { useFuelUp } from "./state/FuelUpProvider";
import { completeMeal, findGap, recommend, spentToday } from "./domain/engine";
import { dayKey, dateOffset } from "./domain/time";
import type { Recommendation } from "./domain/models";
import { Modal } from "./components/Modal";
import {
  FridgeEditor,
  ScheduleEditor,
  SettingsEditor,
} from "./components/Editors";
import { RescueCard } from "./components/RescueCard";
import { Timetable } from "./components/Timetable";
import { Reminders } from "./components/Reminders";
import { Disclosure } from "./components/Disclosure";
import { NearbyDining } from "./components/NearbyDining";
import { House, LayoutDashboard, CalendarDays, CalendarCheck, Refrigerator as FridgeIcon, ChefHat, Utensils as DiningIcon, BookOpen, MapPin as MapPinIcon, Clock3 as ClockIcon, Timer } from "lucide";
import { UiMorphIcon } from "./components/UiMorphIcon";
type View = "Today" | "Timetable" | "My fridge" | "Meal journal";
export default function App() {
  const { state, update, error, clearError } = useFuelUp();
  const [view, setView] = useState<View>("Today"),
    [modal, setModal] = useState<
      "schedule" | "fridge" | "settings" | "help" | "dining" | null
    >(null),
    [detail, setDetail] = useState<Recommendation | null>(null),
    [message, setMessage] = useState(""),
    [emergency, setEmergency] = useState(false);
  const [live, setLive] = useState(false),
    [clock, setClock] = useState("11:45"),
    [tick, setTick] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTick(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  const now = new Date(tick);
  if (!live) {
    const [h, m] = clock.split(":").map(Number);
    now.setHours(h, m, 0, 0);
  }
  if (!state)
    return (
      <main className="loading">
        <Flame />
        <h1>Making room for a better day.</h1>
        <p role={error ? "alert" : "status"}>
          {error || "Loading your FuelUp…"}
        </p>
        {error && (
          <button
            className="secondary"
            onClick={() => {
              localStorage.removeItem("fuelup:v1");
              location.reload();
            }}
          >
            Reset local demo
          </button>
        )}
      </main>
    );
  const todayMeals = state.meals.filter(
      (m) => dayKey(new Date(m.eatenAt)) === dayKey(now),
    ),
    spent = spentToday(state, now),
    gap = findGap(state.timetable, now, emergency),
    rescue = recommend(state, now, emergency);
  const expiring = state.fridge.filter(
    (i) => i.expiresOn >= dayKey(now) && i.expiresOn <= dateOffset(now, 1),
  );
  const nav = [
    { label: "Today" as const, icon: House, activeIcon: LayoutDashboard },
    { label: "Timetable" as const, icon: CalendarDays, activeIcon: CalendarCheck },
    { label: "My fridge" as const, icon: FridgeIcon, activeIcon: ChefHat },
    { label: "Meal journal" as const, icon: DiningIcon, activeIcon: BookOpen },
  ];
  const urgent = () => {
    setEmergency(true);
    if (state.user.location === "campus") { setModal("dining"); return; }
    const r = recommend(state, now, true);
    if (r) setDetail(r);
    else setModal("dining");
  };
  const finish = () => {
    if (!detail) return;
    try {
      const next = completeMeal(state, detail, now);
      update(() => next);
      setDetail(null);
      setEmergency(false);
      setMessage("Meal logged. One less thing on your plate.");
    } catch (e) {
      setDetail(null);
      setMessage(e instanceof Error ? e.message : "Could not log your meal.");
    }
  };
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="FuelUp welcome page">
          <span className="brand-icon">
            <Flame size={25} />
          </span>
          fuelup<span className="brand-dot">.</span>
        </a>
        <nav aria-label="Main navigation">
          {nav.map(({ label, icon, activeIcon }) => (
            <button
              key={label}
              className={view === label ? "active" : ""}
              aria-current={view === label ? "page" : undefined}
              onClick={() => setView(label)}
            >
              <UiMorphIcon icon={view === label ? activeIcon : icon} size={21} />
              <span>{label}</span>
              {label === "My fridge" && (
                <span className="nav-count">{state.fridge.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button onClick={() => setModal("settings")}>
            <Settings2 size={18} /> Preferences
          </button>
          <button onClick={() => setModal("help")}>
            <CircleHelp size={18} /> Help
          </button>
          <div className="profile">
            <span className="avatar">
              {state.user.name.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <strong>{state.user.name}</strong>
            </div>
            <button
              className="icon-button"
              aria-label="Edit profile"
              onClick={() => setModal("settings")}
            >
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span className="breadcrumb">
            FuelUp <span>/</span> <strong>{view}</strong>
          </span>
          <a className="mobile-brand" href="#" aria-label="FuelUp welcome page">
            <Flame size={21} />
            fuelup.
          </a>
          <div className="header-actions">
            <span className="local-status">
              <span /> On your device
            </span>
            <button
              className="avatar"
              aria-label="Open preferences"
              onClick={() => setModal("settings")}
            >
              {state.user.name.slice(0, 1).toUpperCase()}
            </button>
          </div>
        </header>
        <main id="main-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow date-label">
                {now
                  .toLocaleDateString("en", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })
                  .toUpperCase()}
              </p>
              <h1>
                {view === "Today"
                  ? `Hey ${state.user.name}, let’s fuel your day.`
                  : view === "Timetable"
                    ? "Make room for a little fuel."
                    : view === "My fridge"
                      ? "Good things you already have."
                      : "Small meals. Better days."}
              </h1>
            </div>
            <button className="emergency-button" onClick={urgent}>
              <Zap size={17} />I need food now
            </button>
          </div>
          <div className="context-strip">
            <div className="location-control">
              <UiMorphIcon icon={state.user.location === "campus" ? MapPinIcon : House} size={20} />
              <label className="sr-only" htmlFor="location">
                Current location
              </label>
              <select
                id="location"
                value={state.user.location}
                onChange={(e) => {
                  const location = e.target.value as "campus" | "dorm";
                  update((s) => ({ ...s, user: { ...s.user, location } }));
                  setEmergency(false);
                }}
              >
                <option value="campus">On campus</option>
                <option value="dorm">At my dorm</option>
              </select>
            </div>
            <span className="strip-divider" />
            <div className="demo-clock">
              <UiMorphIcon icon={live ? ClockIcon : Timer} size={20} />
              <label htmlFor="demo-clock">
                {live ? "Live clock" : "Demo day"}
              </label>
              {!live && (
                <input
                  aria-label="Demo time"
                  id="demo-clock"
                  type="time"
                  value={clock}
                  onChange={(e) => {
                    if (e.target.value) {
                      setClock(e.target.value);
                      setEmergency(false);
                    }
                  }}
                />
              )}
              <button
                onClick={() => {
                  setLive(!live);
                  setEmergency(false);
                }}
              >
                {live ? "Try demo" : "Use live time"}
              </button>
            </div>
            <span className="context-note">
              {gap
                ? `${gap.minutes} min available`
                : "We’re following your day"}{" "}
              <span className="status-dot" />
            </span>
          </div>
          {(view === "Today" || view === "Timetable") && (
            <Reminders
              now={now}
              live={live}
              onDemo={(time) => {
                setClock(time);
                setLive(false);
                setEmergency(false);
              }}
              onOpen={() => setView("My fridge")}
            />
          )}
          {(error || message) && (
            <div className="notice" role={error ? "alert" : "status"}>
              <span>{error || message}</span>
              <button
                onClick={() => {
                  clearError();
                  setMessage("");
                }}
                aria-label="Dismiss message"
              >
                ×
              </button>
            </div>
          )}
          {view === "Today" ? (
            <>
              <div className="dashboard-grid">
                <div className="main-column">
                  {state.user.location === "campus" ? <NearbyDining now={now} gap={gap?.minutes ?? 0} /> : <RescueCard
                    recommendation={rescue}
                    gap={gap?.minutes ?? 0}
                    hasEaten={todayMeals.some((m) => {
                      const elapsed =
                        now.getTime() - new Date(m.eatenAt).getTime();
                      return m.kind !== "drink" && elapsed >= 0 && elapsed < 7200000;
                    })}
                    onOpen={() => setDetail(rescue)}
                    onRescue={urgent}
                  />}
                  {state.user.location === "dorm" && <Disclosure label="Find restaurants nearby"><NearbyDining now={now} gap={gap?.minutes ?? 0} /></Disclosure>}
                  <Timetable
                    entries={state.timetable}
                    now={now}
                    onEdit={() => setView("Timetable")}
                  />
                </div>
                <div className="side-column">
                  <section className="panel budget-panel">
                    <div className="section-heading">
                      <h2>Daily budget</h2>
                      <Wallet size={18} />
                    </div>
                    <p className="budget-amount">
                      <span>RM</span>{" "}
                      {Math.max(0, state.user.dailyBudget - spent).toFixed(2)}
                    </p>
                    <p className="muted">left for good food today</p>
                    <div className="budget-track">
                      <span
                        style={{
                          width: `${Math.min(100, state.user.dailyBudget ? (spent / state.user.dailyBudget) * 100 : 0)}%`,
                        }}
                      />
                    </div>
                    <div className="budget-labels">
                      <span>RM {spent.toFixed(2)} spent</span>
                      <span>of RM {state.user.dailyBudget.toFixed(2)}</span>
                    </div>
                  </section>
                  <section className="panel fridge-panel">
                    <div className="section-heading">
                      <h2>Expiring ingredients</h2>
                      <Refrigerator size={18} />
                    </div>
                    <p className="muted">
                      {expiring.length
                        ? `${expiring.length} ingredients to enjoy soon.`
                        : "Your fridge is looking good."}
                    </p>
                    <Disclosure label="View expiring ingredients" count={expiring.length}>
                    {expiring.length === 0 && <p className="muted">Nothing expires today or tomorrow.</p>}
                    <div className="fridge-preview">
                      {expiring.map((i) => (
                        <div key={i.id}>
                          <span
                            className={`ingredient-icon ${i.name.includes("spinach") ? "green" : ""}`}
                          >
                            {i.name.includes("egg")
                              ? "◒"
                              : i.name.includes("rice")
                                ? "▧"
                                : "❧"}
                          </span>
                          <span>
                            <strong>{i.name}</strong>
                            <small>
                              {i.quantity} {i.unit}
                              {i.quantity !== 1 ? "s" : ""}
                            </small>
                          </span>
                          <span className="expiry-tag">
                            {i.expiresOn === dayKey(now) ? "Today" : "Tomorrow"}
                          </span>
                        </div>
                      ))}
                    </div>
                    </Disclosure>
                    <button
                      className="secondary w-full"
                      onClick={() => setModal("fridge")}
                    >
                      <Plus size={16} />
                      Recipes & kitchen setup
                    </button>
                  </section>
                </div>
              </div>
            </>
          ) : view === "Timetable" ? (
            <section className="panel full-panel">
              <ScheduleEditor />
            </section>
          ) : view === "My fridge" ? (
            <section className="panel full-panel">
              <FridgeEditor now={now} />
            </section>
          ) : (
            <section className="panel journal">
              <div className="section-heading">
                <h2>Your meal journal</h2>
                <span className="muted">{state.meals.filter(m => m.kind !== "drink").length} meals · {state.meals.filter(m => m.kind === "drink").length} drinks</span>
              </div>
              {state.meals.length === 0 ? (
                <div className="journal-empty">
                  <Utensils size={34} />
                  <h2>A fresh start.</h2>
                  <p className="muted">
                    Finish a suggested meal to log it here. No calorie counting
                    homework.
                  </p>
                  <button className="primary" onClick={() => setView("Today")}>
                    Back to today <ArrowRight size={17} />
                  </button>
                </div>
              ) : (
                <Disclosure label="View meal history" count={state.meals.length}>
                {[...state.meals].reverse().map((m) => (
                  <div className="list-row" key={m.id}>
                    <span className="meal-icon">
                      {m.kind === "drink" ? <CupSoda /> : m.source === "cook" ? <Leaf /> : <Utensils />}
                    </span>
                    <div>
                      <strong>{m.title}</strong>
                      <small>
                        {new Date(m.eatenAt).toLocaleString("en", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}{" "}
                        ·{" "}
                        {m.source === "cook"
                          ? "Made at home"
                          : `${m.kind === "drink" ? "Drink · " : ""}RM ${m.cost.toFixed(2)}`}
                      </small>
                    </div>
                    <span className="nutrition">
                      {m.nutritionKnown === false ? (
                        "Nutrition not estimated"
                      ) : (
                        <>
                          ~{m.calories} kcal
                          <br />
                          {m.protein}g protein
                        </>
                      )}
                    </span>
                  </div>
                ))}
                </Disclosure>
              )}
              <p className="fine-print">
                Nutrition values are illustrative estimates from the demo
                catalog, not AI analysis.
              </p>
            </section>
          )}
          <footer className="page-footer">
            <span>Demo timetable · live restaurant lookup · saved on your device</span>
          </footer>
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {nav.map(({ label, icon, activeIcon }) => (
          <button
            key={label}
            className={view === label ? "active" : ""}
            aria-current={view === label ? "page" : undefined}
            onClick={() => setView(label)}
          >
            <UiMorphIcon icon={view === label ? activeIcon : icon} size={23} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      {modal && (
        <Modal
          title={
            modal === "dining" ? "Find food nearby" : modal === "schedule"
              ? "Your timetable"
              : modal === "fridge"
                ? "A quick fridge check"
                : modal === "settings"
                  ? "Make FuelUp yours"
                  : "A little help"
          }
          onClose={() => setModal(null)}
        >
          {modal === "dining" ? <NearbyDining now={now} gap={gap?.minutes ?? 0} /> : modal === "schedule" ? (
            <ScheduleEditor />
          ) : modal === "fridge" ? (
            <FridgeEditor now={now} />
          ) : modal === "settings" ? (
            <SettingsEditor />
          ) : (
            <div className="help-copy">
              <h3>One day. One good next move.</h3>
              <p>
                Start with your timetable and fridge. FuelUp finds an available
                meal window, then checks your budget, equipment, and ingredients
                for a practical meal.
              </p>
              <p>
                Try “At my dorm” to see a recipe. Change the demo time to see
                how your class gaps affect suggestions. Select “Use live time”
                to follow the clock while the app is open.
              </p>
              <p>
                Restaurant lookup uses named OpenStreetMap places and Google Maps walking directions. Choose your location and food preferences. Current hours, prices and queues need checking with the restaurant. Your timetable and fridge stay in this browser.
              </p>
              <p>
                Calendar services, voice entry, background notifications,
                and AI nutrition are integration points for a future
                backend.
              </p>
            </div>
          )}
        </Modal>
      )}
      {detail && (
        <Modal
          title={
            detail.kind === "buy"
              ? "Your lunch, sorted."
              : "Let’s make something good."
          }
          onClose={() => setDetail(null)}
        >
          <div className="meal-detail">
            <span className="pill">
              {detail.kind === "buy" ? "CAMPUS RESCUE" : "FRIDGE RESCUE"}
            </span>
            <h3>
              {detail.kind === "buy" ? detail.item.dish : detail.item.title}
            </h3>
            <p className="muted">{detail.item.description}</p>
            <div className="detail-stats">
              <span>
                <Clock3 size={17} />
                {detail.totalMinutes} min total
              </span>
              <span>
                {detail.kind === "buy"
                  ? `RM ${detail.item.price.toFixed(2)}`
                  : "No extra spend"}
              </span>
              <span>
                {detail.kind === "cook" && detail.item.nutritionKnown === false
                  ? "Nutrition not estimated"
                  : `~${detail.item.calories} kcal`}
              </span>
            </div>
            {detail.kind === "buy" ? (
              <>
                <h4>
                  <MapPin size={17} />
                  {detail.item.name}
                </h4>
                <p className="muted">
                  Estimated queue: {detail.item.queueMinutes} min ·{" "}
                  {detail.item.walkMinutes} min walk from campus centre
                </p>
                <Disclosure label="View directions">
                <ol>
                  {detail.item.route.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
                <p className="fine-print">
                  Sample campus directions. If you’re at your dorm, allow the
                  additional walk set in Preferences. Total time includes the
                  return trip, eating, and a 5-minute buffer.
                </p>
                </Disclosure>
              </>
            ) : (
              <>
                <h4>
                  <Leaf size={17} />
                  {detail.item.equipment.join(" + ")} ·{" "}
                  {detail.item.prepMinutes} min prep
                </h4>
                <Disclosure label="View recipe ingredients" count={detail.item.ingredients.length}>
                <div className="ingredient-chips">
                  {detail.item.ingredients.map((i) => (
                    <span key={i.name}>
                      {i.quantity} {i.unit}
                      {i.quantity > 1 ? "s" : ""} {i.name}
                    </span>
                  ))}
                </div>
                </Disclosure>
                <Disclosure label="View cooking steps">
                <ol>
                  {detail.item.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
                </Disclosure>
              </>
            )}
            <button className="primary w-full" onClick={finish}>
              <Check size={18} />
              I’ve eaten · log this meal
            </button>
            <p className="fine-print">
              {detail.kind === "buy"
                ? "Adds the meal price to today’s spending."
                : "Uses these ingredients from your fridge."}{" "}
              Nutrition is a sample estimate.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
