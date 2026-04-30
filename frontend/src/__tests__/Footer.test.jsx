/**
 * Tests for components/layout/Footer.jsx
 *
 * Verifies that:
 * - All three columns render correctly (Official Sources, Legal, Project)
 * - The Feedback modal opens when "Send Feedback" is clicked
 * - The country prop is passed correctly to FeedbackForm from CountryContext
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom'

import Footer from '../components/layout/Footer'

// Mock dependencies
const mockCountry = { country: 'UK' }
vi.mock('../contexts/CountryContext', () => ({
  useCountry: () => mockCountry,
}))

// Mock FeedbackForm to verify it receives the correct props
vi.mock('../components/feedback/FeedbackForm', () => ({
  default: ({ country }) => <div data-testid="feedback-form">Feedback for {country}</div>,
}))

// Mock Modal so we don't have to deal with portals and focus trapping in unit tests
// Just render its children if isOpen is true
vi.mock('../components/ui/Modal', () => ({
  default: ({ isOpen, children, title }) =>
    isOpen ? (
      <div data-testid="mock-modal">
        <h2>{title}</h2>
        {children}
      </div>
    ) : null,
}))

function renderFooter() {
  return render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>
  )
}

describe('Footer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCountry.country = 'UK'
  })

  it('renders all three columns', () => {
    renderFooter()
    expect(screen.getByText('Official Sources')).toBeInTheDocument()
    expect(screen.getByText('Legal')).toBeInTheDocument()
    expect(screen.getByText('Project')).toBeInTheDocument()
  })

  it('renders official source links', () => {
    renderFooter()
    const ukLink = screen.getByRole('link', { name: /Electoral Commission/i })
    expect(ukLink).toHaveAttribute('href', 'https://www.electoralcommission.org.uk')
  })

  it('renders legal navigation links', () => {
    renderFooter()
    expect(screen.getByRole('link', { name: /Privacy Policy/i })).toHaveAttribute(
      'href',
      '/privacy'
    )
    expect(screen.getByRole('link', { name: /Accessibility Statement/i })).toHaveAttribute(
      'href',
      '/accessibility'
    )
  })

  it('renders project links', () => {
    renderFooter()
    expect(screen.getByRole('link', { name: /GitHub Repository/i })).toHaveAttribute(
      'href',
      'https://github.com/NoorRattan/election'
    )
  })

  it('opens feedback modal with correct country when Send Feedback is clicked', async () => {
    const user = userEvent.setup()
    renderFooter()

    // Initially modal is closed
    expect(screen.queryByTestId('mock-modal')).not.toBeInTheDocument()

    // Click to open
    const feedbackBtn = screen.getByRole('button', { name: /Send Feedback/i })
    await user.click(feedbackBtn)

    // Modal should now be open
    expect(screen.getByTestId('mock-modal')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Send Feedback' })).toBeInTheDocument() // Modal title

    // Form should receive the country from context
    expect(screen.getByTestId('feedback-form')).toHaveTextContent('Feedback for UK')
  })
})
