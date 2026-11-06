export const minutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};
export const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export const clockMinutes = (date: Date) =>
  date.getHours() * 60 + date.getMinutes();
export const timeLabel = (time: string) =>
  new Date(`2000-01-01T${time}`).toLocaleTimeString("en", {
    hour: "numeric",
    minute: "2-digit",
  });
export const dateOffset = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return dayKey(d);
};
