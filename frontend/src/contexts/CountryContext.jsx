/**
 * Country context. Persists the user's selected country to localStorage.
 * Default is null — triggers the CountrySelector when no country is chosen.
 *
 * UPDATED (Prompt 09 — GAP-01): Fixed silent country sync bug.
 *
 * THE BUG (before this fix):
 *   AuthContext dispatched window.dispatchEvent(new Event('storage')) after writing
 *   the country to localStorage. The native 'storage' event only fires across DIFFERENT
 *   tabs/windows — not the same browsing context. CountryContext also only reads
 *   localStorage once (in the useState initializer), so even a correct StorageEvent
 *   would have no effect.
 *
 * THE FIX:
 *   CountryContext listens for the custom event 'electra:country-changed' which
 *   AuthContext dispatches via new CustomEvent(COUNTRY_SYNC_EVENT, { detail: { country } }).
 *   The event carries the country value in detail.country, so no localStorage read is needed.
 *
 * COUNTRY_SYNC_EVENT is exported as a named constant so AuthContext can import it
 * instead of hardcoding the string. This is the single source of truth for the event name.
 */

import { createContext, useContext, useState, useEffect } from 'react'

const CountryContext = createContext(null)

const STORAGE_KEY = 'electra_country'
const SYNC_EVENT  = 'electra:country-changed' // custom event name — do not hardcode elsewhere

export function CountryProvider({ children }) {
  const [country, setCountryState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || null
  )

  // Listen for cross-component country sync.
  // Dispatched by AuthContext after login when server-side country is restored.
  useEffect(() => {
    const handleSync = (e) => {
      const incoming = e.detail?.country
      if (incoming && incoming !== country) {
        setCountryState(incoming)
        // localStorage is already set by the dispatcher — no need to write here
      }
    }
    window.addEventListener(SYNC_EVENT, handleSync)
    return () => window.removeEventListener(SYNC_EVENT, handleSync)
  }, [country])

  const setCountry = (newCountry) => {
    setCountryState(newCountry)
    if (newCountry) {
      localStorage.setItem(STORAGE_KEY, newCountry)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  return (
    <CountryContext.Provider value={{ country, setCountry }}>
      {children}
    </CountryContext.Provider>
  )
}

export function useCountry() {
  const ctx = useContext(CountryContext)
  if (!ctx) throw new Error('useCountry must be used within CountryProvider')
  return ctx
}

export { CountryContext }

// Single source of truth for the custom event name.
// AuthContext imports this constant rather than hardcoding the string.
export { SYNC_EVENT as COUNTRY_SYNC_EVENT }
