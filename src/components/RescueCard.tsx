import {
  ArrowUpRight,
  Clock3,
  Footprints,
  Leaf,
  Sparkles,
  Utensils,
} from "lucide-react";
import type { Recommendation } from "../domain/models";
import { Bowl } from "./Bowl";
export function RescueCard({
  recommendation,
  gap,
  onOpen,
  onRescue,
  hasEaten,
}: {
  recommendation: Recommendation | null;
  gap: number;
  onOpen: () => void;
  onRescue: () => void;
  hasEaten: boolean;
}) {
  const r = recommendation;
  if (!r)
    return (
      <section className="rescue empty-rescue">
        <div>
          <h2>
            {hasEaten
              ? "You’re fueled.\nGo do your thing."
              : "Your next meal,\nat the right time."}
          </h2>
          <p>
            {hasEaten
              ? "Your meal is logged. We’ll look for another window in a couple of hours."
              : "No suitable meal window or matching option right now. Update your day, budget, or fridge to find a fit."}
          </p>
          <button className="primary" onClick={onRescue}>
            I need food now <ArrowUpRight size={18} />
          </button>
        </div>
        <Bowl />
      </section>
    );
  return (
    <section className="rescue">
      <div className="rescue-copy">
        <span className="eyebrow">
          <Sparkles size={15} /> RECOMMENDED MEAL
        </span>
        <h2>
          Your next
          <br />
          meal.
        </h2>
        <p>{r.reason}</p>
        <div className="hero-meal">
          <span>
            {r.kind === "buy" ? <Utensils size={17} /> : <Leaf size={17} />}
          </span>
          <div>
            <h3>{r.kind === "buy" ? r.item.dish : r.item.title}</h3>
            <small>
              {r.kind === "buy"
                ? r.item.name
                : "From your fridge · dorm-friendly"}
            </small>
          </div>
        </div>
        <div className="rescue-facts">
          <span>
            {r.kind === "buy" ? `RM ${r.item.price.toFixed(2)}` : "RM 0 extra"}
          </span>
          <span>
            <Clock3 size={14} />
            {r.kind === "buy"
              ? `${r.totalMinutes} min total`
              : `${r.item.prepMinutes} min prep`}
          </span>
          {r.kind === "buy" && (
            <span>
              <Footprints size={15} />
              {r.item.walkMinutes} min walk*
            </span>
          )}
        </div>
        <button className="primary" onClick={onOpen}>
          {r.kind === "buy" ? "Let’s get lunch" : "Let’s make this"}
          <ArrowUpRight size={19} />
        </button>
        <small className="hero-footnote">{gap} min available</small>
      </div>
      <div className="bowl-wrap">
        <Bowl />
      </div>
    </section>
  );
}
