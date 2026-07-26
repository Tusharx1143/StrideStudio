/** e.g. "FRI JUL24" — bold all-caps heading used on story cards and detail. */
export function formatDayHeading(iso: string): string {
  const d = new Date(iso);
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const month = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  return `${weekday} ${month}${d.getDate()}`;
}

/** e.g. "Friday, July 24 · 6:41 PM" — used for the "Started" row on detail. */
export function formatFullDateTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${date} · ${time}`;
}
