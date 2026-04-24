/**
 * Centralized Date Engine for Salon AI CRM
 * Standardizes all date/time operations across frontend and backend.
 * Timezone: Asia/Kolkata
 */

export const SALON_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns current date in Asia/Kolkata as YYYY-MM-DD
 */
export function getToday(): string {
  const now = new Date();
  const kolkataDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: SALON_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);
  return kolkataDate; // YYYY-MM-DD
}

/**
 * Returns tomorrow's date in Asia/Kolkata as YYYY-MM-DD
 */
export function getTomorrow(): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SALON_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(tomorrow);
}

/**
 * Formats a date object or string to YYYY-MM-DD
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SALON_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d);
}

/**
 * Combines date (YYYY-MM-DD) and time (HH:mm) into a full ISO-like timestamp
 * for Supabase (YYYY-MM-DDTHH:mm:00)
 */
export function combineDateAndTime(date: string, time: string): string {
  // Ensure time is HH:mm:ss format for the string
  const timePart = time.length === 5 ? `${time}:00` : time;
  return `${date}T${timePart}`;
}

/**
 * Normalizes a date string to ensure it's in YYYY-MM-DD format
 * Handles T00:00:00 suffixes
 */
export function normalizeDate(dateStr: string): string {
  if (!dateStr) return getToday();
  return dateStr.split('T')[0];
}

/**
 * Returns the month and year for a given date
 */
export function getMonthYear(date: Date): { month: number, year: number } {
  return {
    month: date.getMonth(),
    year: date.getFullYear()
  };
}
