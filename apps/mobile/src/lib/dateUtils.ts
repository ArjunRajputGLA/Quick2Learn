/**
 * Date and time formatting helpers for Quick2Learn Mobile App.
 * Strict adherence to project rule: Asia/Kolkata timezone,
 * date as "Mon, 22 Apr", time as "8:00 PM".
 */

const TIMEZONE = 'Asia/Kolkata';

export function formatDateKolkata(dateInput: string | number | Date): string {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: TIMEZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export function formatTimeKolkata(dateInput: string | number | Date): string {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function formatDateTimeKolkata(dateInput: string | number | Date): string {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  return `${formatDateKolkata(date)} at ${formatTimeKolkata(date)}`;
}
