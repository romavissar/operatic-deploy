/**
 * All blog date/time display and schedule input use EET (Europe/Helsinki: EET/EEST).
 */

export const EET_TIMEZONE = "Europe/Helsinki";

const eetDateOptions: Intl.DateTimeFormatOptions = {
  timeZone: EET_TIMEZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: false,
};

/**
 * Format an ISO date string for display in EET (e.g. "9 Feb 2026, 14:00").
 * Pass options to control style; timeZone is always EET.
 */
export function formatInEET(iso: string, options?: Intl.DateTimeFormatOptions): string {
  const d = new Date(iso);
  const opts = options ? { ...options, timeZone: EET_TIMEZONE } : { ...eetDateOptions, timeZone: EET_TIMEZONE };
  return d.toLocaleString("en-GB", opts);
}

/**
 * Format for datetime-local input value: "YYYY-MM-DDTHH:mm" in EET.
 */
export function toEETLocalInput(iso: string): string {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: EET_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hour = get("hour");
  const minute = get("minute");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Parse a datetime-local value "YYYY-MM-DDTHH:mm" as EET and return ISO string.
 */
export function fromEETLocalInput(value: string): string {
  if (!value) return new Date().toISOString();
  const [datePart, timePart] = value.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [h, min] = (timePart || "00:00").split(":").map(Number);
  // At noon UTC on this day, get the hour in Helsinki to derive offset (EET=+2, EEST=+3).
  const noonUtc = new Date(Date.UTC(y, m - 1, d, 12, 0));
  const helsinkiParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: EET_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(noonUtc);
  const helsinkiHour = parseInt(helsinkiParts.find((p) => p.type === "hour")?.value ?? "12", 10);
  const offsetHours = helsinkiHour - 12;
  const utc = new Date(Date.UTC(y, m - 1, d, h - offsetHours, min));
  return utc.toISOString();
}

/**
 * Current date/time in EET for default "Publish at" (datetime-local value).
 */
export function nowEETLocalInput(): string {
  return toEETLocalInput(new Date().toISOString());
}
