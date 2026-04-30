/**
 * Tests for Navbar component.
 * Covers structure, auth states, country badge, and mobile menu accessibility.
 *
 * Regression test included: Quiz link must NOT be present (no standalone /quiz route).
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import Navbar from '../components/layout/Navbar'
import { useAuth } from '../hooks/useAuth'
import { useCountry } from '../contexts/CountryContext'

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../contexts/CountryContext', () => ({
  useCountry: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

// COUNTRY_CONFIG is used in Navbar to look up flag + name — provide minimal stub
vi.mock('../utils/countryConfig', () => ({
  COUNTRY_CONFIG: {
    UK: { name: 'United Kingdom', flag: '🇬🇧' },
    US: { name: 'United States',  flag: '🇺🇸' },
  },
}))

// ── Helper ─────────────────────────────────────────────────────────────────

const renderNavbar = ({ user = null, country = null } = {}) => {
  useAuth.mockReturnValue({ user, loading: false, signOut: vi.fn() })
  useCountry.mockReturnValue({ country, setCountry: vi.fn() })
  return render(<MemoryRouter><Navbar /></MemoryRouter>)
}

// ── Structure ──────────────────────────────────────────────────────────────

describe('Navbar — structure', () => {
  it('skip link has href="#main-content"', () => {
    renderNavbar()
    const skip = screen.getByText(/skip/i)
    expect(skip).toHaveAttribute('href', '#main-content')
  })

  it('skip navigation link is present in the DOM', () => {
    renderNavbar()
    // Skip link is sr-only by default; it exists but is visually hidden
    expect(screen.getByText(/skip to main content/i)).toBeInTheDocument()
  })

  it('nav element has aria-label="Main navigation"', () => {
    renderNavbar()
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument()
  })

  it('"Topics" link is present linking to /topics', () => {
    renderNavbar()
    const links = screen.getAllByRole('link', { name: /topics/i })
    expect(links.length).toBeGreaterThan(0)
    expect(links[0]).toHaveAttribute('href', '/topics')
  })

  it('"Timeline" link is present linking to /timeline', () => {
    renderNavbar()
    const links = screen.getAllByRole('link', { name: /timeline/i })
    expect(links.length).toBeGreaterThan(0)
    expect(links[0]).toHaveAttribute('href', '/timeline')
  })

  it('"Quiz" link is NOT present (regression test for no standalone /quiz route)', () => {
    renderNavbar()
    expect(screen.queryByRole('link', { name: /quiz/i })).not.toBeInTheDocument()
    // Also check by text to be thorough
    expect(screen.queryByText(/^quiz$/i)).not.toBeInTheDocument()
  })
})

// ── Auth states ────────────────────────────────────────────────────────────

describe('Navbar — auth states', () => {
  it('shows "Sign In" when user is null', () => {
    renderNavbar({ user: null })
    expect(screen.getAllByText(/sign in/i).length).toBeGreaterThan(0)
  })

  it('does not show "Sign Out" when user is null', () => {
    renderNavbar({ user: null })
    expect(screen.queryByText(/sign out/i)).not.toBeInTheDocument()
  })

  it('shows user initial avatar when authenticated', () => {
    renderNavbar({ user: { email: 'a@b.com', displayName: 'Alex' } })
    // Avatar shows first letter of displayName
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('renders account menu button when authenticated', () => {
    renderNavbar({ user: { email: 'a@b.com', displayName: 'Alex' } })
    expect(screen.getByRole('button', { name: /account menu/i })).toBeInTheDocument()
  })

  it('clicking avatar opens dropdown with Sign Out option', () => {
    renderNavbar({ user: { email: 'a@b.com', displayName: 'Alex' } })
    fireEvent.click(screen.getByRole('button', { name: /account menu/i }))
    expect(screen.getByText(/sign out/i)).toBeInTheDocument()
  })

  it('clicking Sign Out calls auth.signOut()', async () => {
    const signOut = vi.fn().mockResolvedValue(undefined)
    useAuth.mockReturnValue({
      user: { email: 'a@b.com', displayName: 'Alex' },
      loading: false,
      signOut,
    })
    useCountry.mockReturnValue({ country: null, setCountry: vi.fn() })
    render(<MemoryRouter><Navbar /></MemoryRouter>)
    // Open the dropdown first
    fireEvent.click(screen.getByRole('button', { name: /account menu/i }))
    fireEvent.click(screen.getByText(/sign out/i))
    expect(signOut).toHaveBeenCalled()
  })
})

// ── Country badge ──────────────────────────────────────────────────────────

describe('Navbar — country badge', () => {
  it('shows "Select country" when country is null', () => {
    renderNavbar({ country: null })
    expect(screen.getByText(/select country/i)).toBeInTheDocument()
  })

  it('shows UK flag emoji when country is "UK"', () => {
    renderNavbar({ country: 'UK' })
    expect(screen.getByText('🇬🇧')).toBeInTheDocument()
  })

  it('shows "United Kingdom" text when country is "UK"', () => {
    renderNavbar({ country: 'UK' })
    expect(screen.getByText('United Kingdom')).toBeInTheDocument()
  })
})

// ── Mobile menu ────────────────────────────────────────────────────────────

describe('Navbar — mobile', () => {
  it('hamburger button has aria-expanded attribute', () => {
    renderNavbar()
    const hamburger = screen.getByRole('button', { name: /open menu|close menu/i })
    expect(hamburger).toHaveAttribute('aria-expanded')
  })

  it('hamburger has aria-controls pointing to the nav menu id', () => {
    renderNavbar()
    const hamburger = screen.getByRole('button', { name: /open menu|close menu/i })
    expect(hamburger).toHaveAttribute('aria-controls', 'mobile-menu')
  })

  it('clicking hamburger toggles aria-expanded from false to true', () => {
    renderNavbar()
    const hamburger = screen.getByRole('button', { name: /open menu/i })
    expect(hamburger).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(hamburger)
    expect(screen.getByRole('button', { name: /close menu/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
  })

  it('clicking hamburger again collapses the menu (aria-expanded back to false)', () => {
    renderNavbar()
    const hamburger = screen.getByRole('button', { name: /open menu/i })
    fireEvent.click(hamburger)
    const closeBtn = screen.getByRole('button', { name: /close menu/i })
    fireEvent.click(closeBtn)
    expect(screen.getByRole('button', { name: /open menu/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
  })
})
