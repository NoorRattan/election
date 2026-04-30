/**
 * Tests for components/layout/Layout.jsx
 *
 * Layout is the shell wrapper. Tests verify:
 * - Navbar and Footer are rendered
 * - main element has correct id and aria-label for skip-link and a11y
 * - children prop is rendered inside main when provided
 * - ChatWidget is present
 */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom'

import Layout from '../components/layout/Layout'

// Mock sub-components to isolate Layout responsibility
vi.mock('../components/layout/Navbar', () => ({
  default: () => <nav data-testid="navbar">Navbar</nav>,
}))

vi.mock('../components/layout/Footer', () => ({
  default: () => <footer data-testid="footer">Footer</footer>,
}))

vi.mock('../components/chat/ChatWidget', () => ({
  default: () => <div data-testid="chat-widget">ChatWidget</div>,
}))

vi.mock('../contexts/CountryContext', () => ({
  useCountry: () => ({ country: null }),
  COUNTRY_SYNC_EVENT: 'electra:country-changed',
}))

function renderLayout(children) {
  return render(
    <MemoryRouter>
      <Layout>{children}</Layout>
    </MemoryRouter>
  )
}

describe('Layout', () => {
  it('renders the Navbar', () => {
    renderLayout()
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
  })

  it('renders the Footer', () => {
    renderLayout()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  it('renders the ChatWidget', () => {
    renderLayout()
    expect(screen.getByTestId('chat-widget')).toBeInTheDocument()
  })

  it('renders a main element with id="main-content"', () => {
    renderLayout()
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
  })

  it('main element has aria-label="Main content" for screen readers', () => {
    renderLayout()
    expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Main content')
  })

  it('renders children inside main', () => {
    renderLayout(<p>Hello world</p>)
    expect(screen.getByRole('main')).toContainElement(screen.getByText('Hello world'))
  })
})
