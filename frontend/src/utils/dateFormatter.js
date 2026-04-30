/**
 * Date formatting utilities. Uses Intl.DateTimeFormat with no external library.
 *
 * UK and India: DD/MM/YYYY  (e.g. 07/05/2026)
 * USA:          MM/DD/YYYY  (e.g. 05/07/2026)
 */

const LOCALE_MAP = { UK: 'en-GB', US: 'en-US', IN: 'en-IN' }

/**
 * Format an ISO date string "YYYY-MM-DD" according to the country's locale convention.
 * Falls back to en-GB if country is unknown.
 *
 * @param {string} dateStr - ISO date string in YYYY-MM-DD format.
 * @param {'UK'|'US'|'IN'|string} country - Country code that controls date locale.
 * @returns {string} Localized date, or the input if parsing fails.
 */
export function formatDate(dateStr, country = 'UK') {
  if (!dateStr) return ''
  try {
    // Append T12:00:00 to avoid timezone off-by-one errors (midnight UTC can shift to prev day)
    const date = new Date(`${dateStr}T12:00:00`)
    const locale = LOCALE_MAP[country] || 'en-GB'
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date)
  } catch {
    return dateStr
  }
}

/**
 * Return a human-readable relative day label for an ISO date string.
 * Examples: "today", "in 3 days", "12 days ago"
 *
 * @param {string} dateStr - ISO date string in YYYY-MM-DD format.
 * @returns {string} Relative day label, or an empty string for invalid input.
 */
export function getRelativeDays(dateStr) {
  if (!dateStr) return ''
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(`${dateStr}T12:00:00`)
    target.setHours(0, 0, 0, 0)
    const diffMs = target - today
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'today'
    if (diffDays > 0) return `in ${diffDays} day${diffDays === 1 ? '' : 's'}`
    return `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} ago`
  } catch {
    return ''
  }
}

/**
 * Returns true if the given ISO date string is in the past (before today).
 *
 * @param {string} dateStr - ISO date string in YYYY-MM-DD format.
 * @returns {boolean} True when the date is before today.
 */
export function isPastDate(dateStr) {
  if (!dateStr) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${dateStr}T12:00:00`)
  target.setHours(0, 0, 0, 0)
  return target < today
}
