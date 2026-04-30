/**
 * Polling station locator using Google Maps JS API.
 * The API script is loaded dynamically on mount (NOT in index.html).
 * window.google is checked first to avoid double-loading.
 * Primary CTA is always the official polling station finder link.
 */

import { useEffect, useRef, useState } from 'react'
import { useCountry } from '../../contexts/CountryContext'
import { COUNTRY_CONFIG } from '../../utils/countryConfig'

export default function PollingMap() {
  const { country } = useCountry()
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const [searchInput, setSearchInput] = useState('')
  const [mapReady, setMapReady] = useState(false)
  const [apiError, setApiError] = useState(false)
  const [searchMsg, setSearchMsg] = useState('')
  const liveRef = useRef(null)

  const cfg = country ? COUNTRY_CONFIG[country] : null
  const finderUrl = cfg?.pollingStationFinderUrl

  // Load Maps JS API dynamically
  useEffect(() => {
    if (window.google?.maps) {
      setMapReady(true)
      return
    }
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      setApiError(true)
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => setMapReady(true)
    script.onerror = () => setApiError(true)
    document.head.appendChild(script)
  }, [])

  // Initialise map once API is ready
  useEffect(() => {
    if (!mapReady || !mapRef.current || mapInstance.current) return
    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: 51.5074, lng: -0.1278 },
      zoom: 10,
    })
  }, [mapReady])

  function handleSearch() {
    if (!mapReady || !searchInput.trim()) return
    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({ address: searchInput }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const loc = results[0].geometry.location
        mapInstance.current.setCenter(loc)
        mapInstance.current.setZoom(14)
        new window.google.maps.Marker({ position: loc, map: mapInstance.current })
        setSearchMsg('')
      } else {
        setSearchMsg('Address not found. Please use the official finder link below.')
      }
    })
  }

  return (
    <div className="space-y-5">
      {/* Primary CTA - official polling station finder */}
      {finderUrl && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 flex items-start gap-3">
          <span className="text-2xl" aria-hidden="true">
            🗳️
          </span>
          <div>
            <p className="font-semibold text-primary-900 text-sm mb-1">Find your polling station</p>
            <a
              href={finderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-700 hover:text-primary-900 hover:underline text-sm font-medium focus:outline-2 focus:outline-primary-600 rounded"
            >
              {finderUrl}
            </a>
            <p className="text-xs text-primary-600 mt-1">
              Official government polling station finder
            </p>
          </div>
        </div>
      )}

      {apiError ? (
        <p className="text-sm text-neutral-500 text-center py-4">
          Map unavailable. Please use the official finder link above.
        </p>
      ) : (
        <>
          {/* Address search */}
          <div className="flex gap-2">
            <label htmlFor="polling-map-address" className="sr-only">
              Enter your address to find nearby polling stations
            </label>
            <input
              id="polling-map-address"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter your address..."
              className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-2 focus:outline-primary-600"
            />
            <button
              onClick={handleSearch}
              disabled={!mapReady}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-2 focus:outline-primary-600 disabled:opacity-50"
            >
              Search
            </button>
          </div>

          {/* Search result message */}
          <div ref={liveRef} aria-live="polite" className="text-sm text-neutral-600">
            {searchMsg}
          </div>

          {/* Map container */}
          <div
            ref={mapRef}
            aria-label="Polling station map"
            className="h-64 rounded-lg border border-neutral-200 bg-neutral-100"
            style={{ minHeight: '256px' }}
          />
        </>
      )}
    </div>
  )
}
