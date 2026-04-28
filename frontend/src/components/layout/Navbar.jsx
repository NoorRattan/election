/**
 * Main site navigation bar.
 *
 * FIX #2: "Quiz" is NOT a nav link. /quiz/:topicId requires a topic ID parameter.
 * There is no standalone /quiz route. Nav links are Topics and Timeline only.
 *
 * Accessibility:
 * - Skip link as very first child (sr-only, visible on focus)
 * - nav aria-label="Main navigation"
 * - Mobile menu: aria-expanded, aria-controls
 */

import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCountry } from '../../contexts/CountryContext';
import { COUNTRY_CONFIG } from '../../utils/countryConfig';

const NAV_LINKS = [
  { to: '/topics',   label: 'Topics' },
  { to: '/timeline', label: 'Timeline' },
];

export default function Navbar() {
  const { user, signOut }       = useAuth();
  const { country }            = useCountry();
  const navigate                = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const menuId                  = 'mobile-menu';

  const countryConfig = country ? COUNTRY_CONFIG[country] : null;

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
      {/* Skip link — first focusable element on every page */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-md focus:text-primary-700 focus:font-medium focus:outline-2 focus:outline-primary-600"
      >
        Skip to main content
      </a>

      <nav aria-label="Main navigation" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary-700 focus:outline-2 focus:outline-offset-2 focus:outline-primary-600 rounded">
            <svg className="h-7 w-7" viewBox="0 0 32 32" aria-hidden="true" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="14" width="24" height="14" rx="2" fill="#2563eb"/>
              <rect x="12" y="11" width="8" height="3" rx="1" fill="#1d4ed8"/>
              <rect x="14" y="4" width="4" height="9" rx="1" fill="#fff" stroke="#2563eb" strokeWidth="0.5"/>
              <polyline points="15,7 16,9 18,6" stroke="#2563eb" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Electra
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `text-sm font-medium focus:outline-2 focus:outline-offset-2 focus:outline-primary-600 rounded px-1 ${
                    isActive ? 'text-primary-700 border-b-2 border-primary-600 pb-0.5' : 'text-neutral-600 hover:text-primary-700'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>

          {/* Right side: country badge + auth */}
          <div className="hidden md:flex items-center gap-3">
            {/* Country selector badge */}
            <button
              onClick={() => navigate('/topics')}
              aria-label={countryConfig ? `Selected country: ${countryConfig.name}. Click to change.` : 'Select your country'}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-neutral-200 text-sm hover:bg-neutral-50 focus:outline-2 focus:outline-offset-2 focus:outline-primary-600"
            >
              {countryConfig ? (
                <><span>{countryConfig.flag}</span><span className="text-neutral-700">{countryConfig.name}</span></>
              ) : (
                <span className="text-neutral-500">Select country</span>
              )}
            </button>

            {/* Auth state */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropOpen((o) => !o)}
                  aria-expanded={dropOpen}
                  aria-haspopup="true"
                  aria-label={`Account menu for ${user.displayName || user.email}`}
                  className="flex items-center justify-center h-9 w-9 rounded-full bg-primary-600 text-white font-semibold text-sm focus:outline-2 focus:outline-offset-2 focus:outline-primary-600"
                >
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </button>
                {dropOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 animate-fade-in" role="menu">
                    <Link to="/profile" role="menuitem" onClick={() => setDropOpen(false)} className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:bg-neutral-50">
                      My Profile
                    </Link>
                    <button role="menuitem" onClick={() => { setDropOpen(false); handleSignOut(); }} className="w-full text-left px-4 py-2 text-sm text-error-600 hover:bg-error-50 focus:outline-none focus:bg-error-50">
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 focus:outline-2 focus:outline-offset-2 focus:outline-primary-600">
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 focus:outline-2 focus:outline-primary-600"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div id={menuId} className="md:hidden border-t border-neutral-200 py-3 space-y-1 animate-slide-up">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-2 text-sm font-medium rounded-lg ${isActive ? 'bg-primary-50 text-primary-700' : 'text-neutral-700 hover:bg-neutral-50'}`
                }
              >
                {label}
              </NavLink>
            ))}
            {user ? (
              <>
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg">My Profile</Link>
                <button onClick={() => { setMenuOpen(false); handleSignOut(); }} className="w-full text-left px-4 py-2 text-sm text-error-600 hover:bg-error-50 rounded-lg">Sign Out</button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 rounded-lg">Sign In</Link>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
