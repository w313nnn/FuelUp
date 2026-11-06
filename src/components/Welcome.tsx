import { useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  CalendarDays,
  ChefHat,
  Flame,
  Wallet,
} from "lucide-react";
import ScrollVelocity from "./ScrollVelocity/ScrollVelocity";
import { Bowl } from "./Bowl";
import { Pause, Play } from "lucide";
import { UiMorphIcon } from "./UiMorphIcon";
export default function Welcome() {
  const [paused, setPaused] = useState(false);
  return (
    <div className="welcome">
      <header className="welcome-header">
        <a href="#" className="brand" aria-label="FuelUp home">
          <span className="brand-icon">
            <Flame size={26} />
          </span>
          fuelup.
        </a>
        <a className="welcome-open" href="#app">
          Open app <ArrowUpRight size={19} />
        </a>
      </header>
      <main className="welcome-main">
        <section className="welcome-hero">
          <div className="welcome-copy">
            <h1>
              Your next meal.
              <br />
              <span>Figured out.</span>
            </h1>
            <p>
              Simple recipes from your fridge. Affordable food that fits your
              day.
            </p>
            <div className="welcome-cta">
              <a href="#app" className="primary">
                Get started <ArrowUpRight size={22} />
              </a>
              <a href="#how-it-works" className="welcome-secondary">
                See how it works <ArrowDown size={18} />
              </a>
            </div>
          </div>
          <div className="welcome-art">
            <div className="plate-circle" />
            <Bowl />
            <div className="recipe-ticket">
              <ChefHat size={24} />
              <div>
                <strong>Egg & greens rice bowl</strong>
                <span>5 min · Microwave</span>
              </div>
            </div>
          </div>
        </section>
        <section className="welcome-motion" aria-label="FuelUp animated banner">
          <div aria-hidden="true">
            <ScrollVelocity
              texts={["FUEL YOUR DAY.", "MAKE TIME TO EAT."]}
              velocity={100}
              skewWithVelocity={0}
              scaleWithVelocity={0}
              draggable={!paused}
              fontSize={80}
              fontWeight={700}
              className="custom-scroll-text"
              numCopies={6}
              damping={50}
              stiffness={400}
              separator=""
              fadeEdges={false}
              outlineAlternate={false}
              gap={0}
              pauseOnHover={false}
              paused={paused}
            />
          </div>
          <button
            className="motion-control"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "Play animation" : "Pause animation"}
          >
            <UiMorphIcon icon={paused ? Play : Pause} size={20} />
            <span>{paused ? "Play animation" : "Pause animation"}</span>
          </button>
        </section>
        <section id="how-it-works" className="welcome-steps">
          <div className="welcome-section-heading">
            <h2>
              Less deciding.
              <br />
              More eating.
            </h2>
            <a href="#app" className="welcome-open">
              Start your day <ArrowUpRight size={20} />
            </a>
          </div>
          <div className="welcome-step-grid">
            <article>
              <ChefHat size={27} />
              <h3>Use what you have</h3>
              <p>
                Add your ingredients and kitchen setup. Get a recipe you can
                actually make.
              </p>
            </article>
            <article>
              <CalendarDays size={27} />
              <h3>Eat between classes</h3>
              <p>
                Add your timetable. Find meal breaks and get reminders before
                they start.
              </p>
            </article>
            <article>
              <Wallet size={27} />
              <h3>Stay within budget</h3>
              <p>
                Set a daily food budget. Compare a campus meal with cooking at
                home.
              </p>
            </article>
          </div>
        </section>
      </main>
      <footer className="welcome-footer">
        <span>FuelUp</span>
        <a href="#app">
          Enter app <ArrowUpRight size={18} />
        </a>
      </footer>
    </div>
  );
}
