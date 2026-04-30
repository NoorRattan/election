/**
 * Tests for App.jsx — route rendering.
 *
 * All page components are mocked so this file tests routing logic only,
 * not the implementation of each page. Auth state is controlled via the
 * useAuth mock to verify protected-route redirect behaviour.
 */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom'

// ── Hoist mocks before any imports ───────────────────────────────────────────
const authMock = vi.hoisted(() => ({ user: null, loading: false }))

vi.mock('../hooks/useAuth', () => ({ useAuth: () => authMock }))
vi.mock('../contexts/CountryContext', () => ({
  CountryProvider: ({ children }) => children,
  useCountry: () => ({ country: null, setCountry: vi.fn() }),
  COUNTRY_SYNC_EVENT: 'electra:country-changed',
}))

// Lazy-page mocks — simple text sentinels are enough for routing tests
vi.mock('../pages/Home',                   () => ({ default: () => <div>Home Page</div> }))
vi.mock('../pages/Topics',                 () => ({ default: () => <div>Topics Page</div> }))
vi.mock('../pages/TopicDetail',            () => ({ default: () => <div>Topic Detail Page</div> }))
vi.mock('../pages/Timeline',               () => ({ default: () => <div>Timeline Page</div> }))
vi.mock('../pages/Quiz',                   () => ({ default: () => <div>Quiz Page</div> }))
vi.mock('../pages/Profile',               () => ({ default: () => <div>Profile Page</div> }))
vi.mock('../pages/Login',                  () => ({ default: () => <div>Login Page</div> }))
vi.mock('../pages/PrivacyPolicy',          () => ({ default: () => <div>Privacy Policy</div> }))
vi.mock('../pages/AccessibilityStatement', () => ({ default: () => <div>Accessibility Statement</div> }))
vi.mock('../pages/NotFound',               () => ({ default: () => <div>Not Found</div> }))
vi.mock('../components/layout/Navbar',     () => ({ default: () => <nav data-testid="navbar" /> }))
vi.mock('../components/layout/Footer',     () => ({ default: () => <footer data-testid="footer" /> }))

// ── Helper ────────────────────────────────────────────────────────────────────
async function renderAt(route) {
  const App = (await import('../App')).default
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('App routing', () => {
  it('renders Home at /', async () => {
    await renderAt('/')
    expect(await screen.findByText('Home Page')).toBeInTheDocument()
  })

  it('renders Topics at /topics', async () => {
    await renderAt('/topics')
    expect(await screen.findByText('Topics Page')).toBeInTheDocument()
  })

  it('renders TopicDetail at /topics/:slug', async () => {
    await renderAt('/topics/voter-registration')
    expect(await screen.findByText('Topic Detail Page')).toBeInTheDocument()
  })

  it('renders Timeline at /timeline', async () => {
    await renderAt('/timeline')
    expect(await screen.findByText('Timeline Page')).toBeInTheDocument()
  })

  it('renders Login at /login', async () => {
    await renderAt('/login')
    expect(await screen.findByText('Login Page')).toBeInTheDocument()
  })

  it('renders PrivacyPolicy at /privacy', async () => {
    await renderAt('/privacy')
    expect(await screen.findByText('Privacy Policy')).toBeInTheDocument()
  })

  it('renders AccessibilityStatement at /accessibility', async () => {
    await renderAt('/accessibility')
    expect(await screen.findByText('Accessibility Statement')).toBeInTheDocument()
  })

  it('renders NotFound for an unknown route', async () => {
    await renderAt('/this-does-not-exist')
    expect(await screen.findByText('Not Found')).toBeInTheDocument()
  })

  it('redirects /profile to /login when user is not authenticated', async () => {
    authMock.user = null
    authMock.loading = false
    await renderAt('/profile')
    expect(await screen.findByText('Login Page')).toBeInTheDocument()
  })

  it('renders Profile at /profile when authenticated', async () => {
    authMock.user = { uid: 'user-1' }
    authMock.loading = false
    await renderAt('/profile')
    expect(await screen.findByText('Profile Page')).toBeInTheDocument()
    authMock.user = null // reset
  })

  it('redirects /quiz/:topicId to /login when user is not authenticated', async () => {
    authMock.user = null
    authMock.loading = false
    await renderAt('/quiz/voter-registration')
    expect(await screen.findByText('Login Page')).toBeInTheDocument()
  })

  it('renders navbar and footer via Layout', async () => {
    await renderAt('/')
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })
})
