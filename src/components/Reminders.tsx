import { useEffect, useRef, useState } from "react";
import { Bell, BellRing, BellOff, Play, Check, X } from "lucide";
import { UiMorphIcon } from "./UiMorphIcon";
import { useFuelUp } from "../state/FuelUpProvider";
import { dueReminder, timetableReminders } from "../domain/reminders";
import { clockMinutes } from "../domain/time";
export function Reminders({
  now,
  live,
  onDemo,
  onOpen,
}: {
  now: Date;
  live: boolean;
  onDemo: (time: string) => void;
  onOpen: () => void;
}) {
  const { state, update } = useFuelUp();
  const [dismissed, setDismissed] = useState<string[]>([]),
    [preview, setPreview] = useState(false),
    [notificationMessage, setNotificationMessage] = useState("");
  const sent = useRef(new Set<string>());
  const reminders = state ? timetableReminders(state, now) : [],
    due = state ? dueReminder(state, now) : undefined;
  const enabled = state?.user.remindersEnabled !== false;
  const next = reminders.find((r) => r.at >= clockMinutes(now)) ?? reminders[0];
  const active = enabled
    ? preview
      ? reminders.find(
          (r) =>
            r.time ===
            `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
        )
      : due
    : undefined;
  useEffect(() => {
    if (
      !active ||
      !live ||
      dismissed.includes(active.id) ||
      sent.current.has(active.id) ||
      typeof Notification === "undefined" ||
      Notification.permission !== "granted"
    )
      return;
    sent.current.add(active.id);
    try {
      const notification = new Notification("FuelUp: time to eat", {
        body: `Your timetable has a ${active.gapMinutes}-minute break at ${active.time}. Check your meal options.`,
        tag: active.id,
      });
      return () => notification.close();
    } catch {
      setNotificationMessage(
        "Device notifications are unavailable here. In-app reminders still work.",
      );
    }
  }, [active?.id, live, dismissed]);
  if (!state) return null;
  return (
    <section className="reminders-panel">
      <div className="section-heading">
        <h2>
          <UiMorphIcon icon={enabled ? BellRing : BellOff} size={20} />
          Timetable reminders
        </h2>
        <label className="reminder-toggle">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => {
              const checked = e.target.checked;
              update((s) => ({
                ...s,
                user: { ...s.user, remindersEnabled: checked },
              }));
              setPreview(false);
            }}
          />
          {enabled ? "On" : "Off"}
        </label>
      </div>
      <p className="muted">
        {next
          ? `Next meal break: ${next.time} · ${next.gapMinutes} min. Reminder starts 5 min before.`
          : "No meal breaks found today. Add your classes in Timetable."}
      </p>
      <div className="reminder-actions">
        <button
          className="secondary"
          disabled={!next}
          onClick={() => {
            if (!next) return;
            update((s) => ({
              ...s,
              user: { ...s.user, remindersEnabled: true },
            }));
            setDismissed((ids) => ids.filter((id) => id !== next.id));
            setPreview(true);
            onDemo(next.time);
          }}
        >
          <UiMorphIcon icon={preview ? Check : Play} size={18} />
          Try demo reminder
        </button>
        <button
          className="text-button"
          onClick={async () => {
            if (typeof Notification === "undefined") {
              setNotificationMessage(
                "This browser supports in-app reminders only.",
              );
              return;
            }
            try {
              const permission = await Notification.requestPermission();
              setNotificationMessage(
                permission === "granted"
                  ? "Device notifications enabled while FuelUp is open."
                  : "Device notifications are off. In-app reminders still work.",
              );
            } catch {
              setNotificationMessage(
                "Notifications are unavailable. In-app reminders still work.",
              );
            }
          }}
        >
          Enable device notifications
        </button>
      </div>
      {notificationMessage && (
        <p role="status" className="muted">
          {notificationMessage}
        </p>
      )}
      {active && !dismissed.includes(active.id) && (
        <div className="reminder-alert" role="status">
          <UiMorphIcon icon={Bell} size={22} />
          <div>
            <strong>{preview ? "Demo reminder: " : ""}Time to refuel</strong>
            <p>
              Your {active.gapMinutes}-minute break starts at {active.time}.
              Find a meal before your next class.
            </p>
            <button className="text-button" onClick={onOpen}>
              Find food / recipes →
            </button>
          </div>
          <button
            className="icon-button"
            aria-label="Dismiss reminder"
            onClick={() => {
              setDismissed((ids) => [...ids, active.id]);
              setPreview(false);
            }}
          >
            <UiMorphIcon icon={X} size={20} />
          </button>
        </div>
      )}
      <p className="reminder-scope">
        Reminders run while this page is open. Demo uses the demo clock; live
        mode follows your local time.
      </p>
    </section>
  );
}
