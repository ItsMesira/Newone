import { format, formatInTimeZone } from 'date-fns-tz'

/**
 * Format a Date object to a readable string based on user timezone
 */
export function formatTimeInTimezone(date: Date, timeZone: string, pattern: string = 'h:mm a'): string {
  try {
    return formatInTimeZone(date, timeZone, pattern)
  } catch (error) {
    // Fallback if timezone is invalid
    return format(date, pattern)
  }
}

/**
 * Parses a time string 'HH:mm' into a Date object for today
 */
export function parseTimeString(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date
}
