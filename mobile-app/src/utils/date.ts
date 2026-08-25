/**
 * Formats a Date object to a local YYYY-MM-DD string.
 * This avoids UTC timezone offset bugs (e.g. UTC+7 Vietnam time showing yesterday's date between 00:00 and 07:00).
 */
export function getLocalDateString(date: Date = new Date()): string {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
}
