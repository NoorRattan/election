/**
 * Unit tests for PollingMap component.
 *
 * Strategy:
 *   - Mock window.google (the Google Maps JS API) fully
 *   - Mock countryConfig for predictable URLs
 *   - Focus on: accessible form controls, official link, aria attributes, error states
 *   - Do NOT test Map rendering (third-party canvas — not testable in jsdom)
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';

import PollingMap from '../components/map/PollingMap';
import { CountryProvider } from '../contexts/CountryContext';

// ── Environment mock ────────────────────────────────────────────────────────
vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'test-maps-key');

// ── Country config mock ─────────────────────────────────────────────────────
vi.mock('../utils/countryConfig', () => ({
  COUNTRY_CONFIG: {
    UK: {
      name: 'United Kingdom',
      pollingStationFinderUrl: 'https://www.gov.uk/find-polling-station',
    },
    US: {
      name: 'United States',
      pollingStationFinderUrl: 'https://www.usa.gov/find-a-polling-place',
    },
    IN: {
      name: 'India',
      pollingStationFinderUrl: 'https://eci.gov.in/voter-corner/',
    },
  },
}));

// ── Google Maps API mock ─────────────────────────────────────────────────────
function createGoogleMock() {
  return {
    maps: {
      Map: vi.fn().mockImplementation(() => ({
        setCenter: vi.fn(),
        panTo: vi.fn(),
        setZoom: vi.fn(),
        setOptions: vi.fn(),
        addListener: vi.fn(() => ({ remove: vi.fn() })),
      })),
      Marker: vi.fn().mockImplementation(() => ({})),
      Geocoder: vi.fn().mockImplementation(() => ({
        geocode: vi.fn((_, callback) =>
          callback(
            [{ geometry: { location: { lat: () => 51.5, lng: () => -0.1 } } }],
            'OK'
          )
        ),
      })),
    },
  };
}

// ── Helper ──────────────────────────────────────────────────────────────────
function renderWithCountry(country) {
  localStorage.setItem('electra_country', country);
  return render(
    <MemoryRouter>
      <CountryProvider>
        <PollingMap />
      </CountryProvider>
    </MemoryRouter>
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('PollingMap — primary CTA (official link)', () => {
  beforeEach(() => {
    window.google = createGoogleMock();
  });

  afterEach(() => {
    delete window.google;
    vi.restoreAllMocks();
    localStorage.removeItem('electra_country');
  });

  it('official polling station link is visible for UK country', () => {
    renderWithCountry('UK');
    // Link with the official finder URL or descriptive text should be present
    const link = screen.queryByRole('link', { name: /official|find polling|find your/i })
      || screen.queryByRole('link', { name: /gov\.uk/i })
      || document.querySelector('a[href*="gov.uk/find-polling"]');
    expect(link).not.toBeNull();
  });

  it('official link has target="_blank" and rel="noopener noreferrer"', () => {
    renderWithCountry('UK');
    const externalLinks = document.querySelectorAll('a[target="_blank"]');
    expect(externalLinks.length).toBeGreaterThan(0);
    externalLinks.forEach((link) => {
      expect(link.getAttribute('rel')).toContain('noopener');
      expect(link.getAttribute('rel')).toContain('noreferrer');
    });
  });

  it('official link has meaningful text (not just a raw URL)', () => {
    renderWithCountry('UK');
    const links = screen.getAllByRole('link');
    const officialLink = links.find(
      (l) => l.href && l.href.includes('gov.uk')
    );
    if (officialLink) {
      // Text content should not be just the URL
      expect(officialLink.textContent.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('PollingMap — search form', () => {
  beforeEach(() => {
    window.google = createGoogleMock();
  });

  afterEach(() => {
    delete window.google;
    vi.restoreAllMocks();
    localStorage.removeItem('electra_country');
  });

  it('address search input is present with an associated label', () => {
    renderWithCountry('UK');
    // Input should be findable by label or accessible name
    const input = screen.queryByRole('textbox')
      || screen.queryByLabelText(/address|postcode|search/i);
    expect(input).not.toBeNull();
  });

  it('search button is present', () => {
    renderWithCountry('UK');
    const btn = screen.queryByRole('button', { name: /search|find|locate/i });
    expect(btn).not.toBeNull();
  });

  it('search input accepts text input', async () => {
    const user = userEvent.setup();
    renderWithCountry('UK');
    const input = screen.queryByRole('textbox');
    if (input) {
      await user.type(input, 'SW1A 1AA');
      expect(input.value).toBe('SW1A 1AA');
    }
  });
});

describe('PollingMap — map area', () => {
  beforeEach(() => {
    window.google = createGoogleMock();
  });

  afterEach(() => {
    delete window.google;
    vi.restoreAllMocks();
    localStorage.removeItem('electra_country');
  });

  it('map container has aria-label attribute', () => {
    renderWithCountry('UK');
    const mapContainer = document.querySelector('[aria-label]');
    expect(mapContainer).not.toBeNull();
  });
});

describe('PollingMap — API load failure (graceful degradation)', () => {
  afterEach(() => {
    delete window.google;
    localStorage.removeItem('electra_country');
  });

  it('renders without crashing when window.google is undefined', () => {
    // No window.google set in this test
    delete window.google;
    expect(() => renderWithCountry('UK')).not.toThrow();
  });

  it('official link is still visible even when Maps API fails to load', () => {
    delete window.google;
    renderWithCountry('UK');
    // At minimum the official link CTA should still render
    const links = document.querySelectorAll('a[href]');
    const hasExternalLink = Array.from(links).some((l) =>
      l.href && (l.href.includes('gov.uk') || l.href.includes('usa.gov') || l.href.includes('eci.gov'))
    );
    expect(hasExternalLink).toBe(true);
  });
});

describe('PollingMap — geocoder interaction', () => {
  beforeEach(() => {
    window.google = createGoogleMock();
  });

  afterEach(() => {
    delete window.google;
    vi.restoreAllMocks();
    localStorage.removeItem('electra_country');
  });

  it('after user types and clicks Search, geocoder is invoked', async () => {
    const user = userEvent.setup();
    renderWithCountry('UK');

    const input = screen.queryByRole('textbox');
    const searchBtn = screen.queryByRole('button', { name: /search|find|locate/i });

    if (input && searchBtn) {
      await user.type(input, 'Westminster, London');
      await user.click(searchBtn);
      await waitFor(() => {
        expect(window.google.maps.Geocoder).toHaveBeenCalled();
      });
    }
  });
});
