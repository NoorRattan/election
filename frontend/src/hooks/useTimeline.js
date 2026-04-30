import { useState, useEffect } from 'react'
import { timelineApi } from '../services/api'

/**
 * Fetches election timeline events for a country.
 * Only fetches if country is non-null.
 * Sorts events by date ASC as a client-side guard; the backend also sorts.
 *
 * @param {{ country?: string | null, level?: string | null, stateProvince?: string | null }} options
 * @returns {{ events: Array<object>, loading: boolean, error: string | null }}
 */
export function useTimeline({ country, level = null, stateProvince = null } = {}) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!country) {
      setEvents([])
      return
    }

    let cancelled = false

    async function fetch() {
      setLoading(true)
      setError(null)
      try {
        const data = await timelineApi.getEvents(country, level, stateProvince)
        if (!cancelled) {
          const sorted = (data.events || []).sort((a, b) => new Date(a.date) - new Date(b.date))
          setEvents(sorted)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load timeline.')
          setEvents([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetch()
    return () => {
      cancelled = true
    }
  }, [country, level, stateProvince])

  return { events, loading, error }
}
