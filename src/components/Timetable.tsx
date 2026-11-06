import { ArrowRight, BookOpen, Coffee, MapPin } from "lucide-react";
import type { TimetableEntry } from "../domain/models";
import { clockMinutes, minutes, timeLabel } from "../domain/time";
import { Disclosure } from "./Disclosure";
export function Timetable({
  entries,
  now,
  onEdit,
}: {
  entries: TimetableEntry[];
  now: Date;
  onEdit: () => void;
}) {
  const today = entries
    .filter((e) => e.day === now.getDay())
    .sort((a, b) => minutes(a.start) - minutes(b.start));
  const t = clockMinutes(now);
  return (
    <section className="panel day-panel">
      <div className="section-heading">
        <h2>Your day, at a glance</h2>
        <button className="text-button" onClick={onEdit}>
          Timetable <ArrowRight size={15} />
        </button>
      </div>
      <Disclosure label="View today’s classes" count={today.length}>
      <div className="timeline">
        {today.length === 0 ? (
          <p className="muted">
            No classes today.
          </p>
        ) : (
          today.map((e, i) => (
            <div key={e.id}>
              <div
                className={`timeline-row ${minutes(e.end) <= t ? "past" : ""}`}
              >
                <span className="timeline-time">{timeLabel(e.start)}</span>
                <span className="timeline-icon">
                  <BookOpen size={15} />
                </span>
                <div>
                  <h3>{e.title}</h3>
                  <p>
                    <MapPin size={12} />
                    {e.location}
                  </p>
                </div>
                <span className="class-end">
                  {minutes(e.end) <= t ? "Done" : timeLabel(e.end)}
                </span>
              </div>
              {i < today.length - 1 &&
                minutes(today[i + 1].start) - minutes(e.end) >= 30 && (
                  <div
                    className={`gap-row ${t >= minutes(e.end) && t < minutes(today[i + 1].start) ? "current" : ""}`}
                  >
                    <span className="timeline-time">{timeLabel(e.end)}</span>
                    <span className="timeline-icon">
                      <Coffee size={16} />
                    </span>
                    <div>
                      <h3>
                        {minutes(today[i + 1].start) - minutes(e.end)} minutes
                        for you
                      </h3>
                    </div>
                    {t >= minutes(e.end) && t < minutes(today[i + 1].start) && (
                      <span className="now-tag">NOW</span>
                    )}
                  </div>
                )}
            </div>
          ))
        )}
      </div>
      </Disclosure>
    </section>
  );
}
