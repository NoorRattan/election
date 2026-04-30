/**
 * Google Calendar URL builder for election date "Add to Calendar" links.
 * Uses the Google Calendar URL scheme - no OAuth or gapi required.
 * Works for any user with a Google account by opening calendar.google.com in a new tab.
 *
 * Event param shape:
 *   { name: string, description: string, date: string ("YYYY-MM-DD"), official_url: string }
 */

/**
 * Returns a Google Calendar pre-fill URL for the given event.
 * date is an ISO string "YYYY-MM-DD" - formatted as "YYYYMMDD" for the Calendar URL.
 */
export function getCalendarUrl(event) {
  const dateCompact = event.date.replace(/-/g, '') // "2026-05-07" -> "20260507"
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.name,
    details: `${event.description}\n\nOfficial source: ${event.official_url}`,
    dates: `${dateCompact}/${dateCompact}`, // All-day event: same start and end date
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/**
 * Opens Google Calendar in a new tab pre-filled with the event details.
 */
export function addEventToCalendar(event) {
  window.open(getCalendarUrl(event), '_blank', 'noopener,noreferrer')
}
