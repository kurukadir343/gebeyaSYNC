const TZ = "Africa/Addis_Ababa"; // UTC+3, no daylight saving

export function money(value: number | string): string {
  const n = Number(value) || 0;
  return `${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ETB`;
}

export function dateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

/** ISO timestamp for 00:00 today in Ethiopia (EAT, UTC+3). */
export function startOfTodayEAT(): string {
  const offset = 3 * 60 * 60 * 1000;
  const dayMs = 24 * 60 * 60 * 1000;
  const startLocal = Math.floor((Date.now() + offset) / dayMs) * dayMs;
  return new Date(startLocal - offset).toISOString();
}
