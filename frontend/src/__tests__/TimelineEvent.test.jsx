/**
 * Tests for TimelineEvent component.
 * Covers rendering, official link safety, calendar integration, and isPast behaviour.
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import TimelineEvent from '../components/timeline/TimelineEvent'

// -- Mocks ------------------------------------------------------------------

vi.mock('../services/calendarService', () => ({
  addEventToCalendar: vi.fn(),
}))

vi.mock('../utils/dateFormatter', () => ({
  formatDate: vi.fn((date) => date), // return date string as-is for simplicity
  getRelativeDays: vi.fn(() => 'in 30 days'),
  isPastDate: vi.fn(() => false),
}))

// Badge and Button are real components - no need to mock them

import { addEventToCalendar } from '../services/calendarService'

// -- Fixtures ---------------------------------------------------------------

const upcomingEvent = {
  id: 'e1',
  name: 'Local Election Day',
  description: 'Polls open 7am-10pm.',
  date: '2099-05-07',
  type: 'poll_day',
  level: 'local',
  official_url: 'https://www.electoralcommission.org.uk',
  state_province: null,
}

const pastEvent = { ...upcomingEvent, id: 'e2', date: '2020-05-07' }

// -- Helper -----------------------------------------------------------------

const renderEvent = (event, isPast = false) =>
  render(
    <MemoryRouter>
      <ul>
        <TimelineEvent event={event} isPast={isPast} />
      </ul>
    </MemoryRouter>
  )

// -- Tests ------------------------------------------------------------------

describe('TimelineEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders as li with role="listitem"', () => {
    renderEvent(upcomingEvent)
    expect(screen.getByRole('listitem')).toBeInTheDocument()
  })

  it('displays the event name', () => {
    renderEvent(upcomingEvent)
    expect(screen.getByText('Local Election Day')).toBeInTheDocument()
  })

  it('displays the event description', () => {
    renderEvent(upcomingEvent)
    expect(screen.getByText('Polls open 7am-10pm.')).toBeInTheDocument()
  })

  it('official source link has correct href', () => {
    renderEvent(upcomingEvent)
    const link = screen.getByRole('link', { name: /official source/i })
    expect(link).toHaveAttribute('href', 'https://www.electoralcommission.org.uk')
  })

  it('official link has rel="noopener noreferrer"', () => {
    renderEvent(upcomingEvent)
    const link = screen.getByRole('link', { name: /official source/i })
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('official link opens in new tab (target="_blank")', () => {
    renderEvent(upcomingEvent)
    const link = screen.getByRole('link', { name: /official source/i })
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('official link text is descriptive (not just a raw URL)', () => {
    renderEvent(upcomingEvent)
    // Should show "Official source" rather than the raw URL string
    const link = screen.getByRole('link', { name: /official source/i })
    expect(link.textContent).not.toBe(upcomingEvent.official_url)
    expect(link.textContent.length).toBeGreaterThan(0)
  })

  it('"Add to Calendar" button is present when isPast=false', () => {
    renderEvent(upcomingEvent, false)
    expect(screen.getByRole('button', { name: /add.*calendar/i })).toBeInTheDocument()
  })

  it('"Add to Calendar" button is absent when isPast=true', () => {
    renderEvent(pastEvent, true)
    expect(screen.queryByRole('button', { name: /add.*calendar/i })).not.toBeInTheDocument()
  })

  it('clicking "Add to Calendar" calls addEventToCalendar with the event', () => {
    renderEvent(upcomingEvent, false)
    fireEvent.click(screen.getByRole('button', { name: /add.*calendar/i }))
    expect(addEventToCalendar).toHaveBeenCalledOnce()
    expect(addEventToCalendar).toHaveBeenCalledWith(upcomingEvent)
  })

  it('renders without crashing when isPast=true (no calendar button)', () => {
    expect(() => renderEvent(pastEvent, true)).not.toThrow()
    expect(screen.getByRole('listitem')).toBeInTheDocument()
  })

  it('displays the formatted date', () => {
    renderEvent(upcomingEvent)
    // formatDate mock returns the date as-is
    expect(screen.getByText(upcomingEvent.date)).toBeInTheDocument()
  })

  it('shows relative days text when isPast=false', () => {
    renderEvent(upcomingEvent, false)
    // getRelativeDays mock returns 'in 30 days'
    expect(screen.getByText('in 30 days')).toBeInTheDocument()
  })
})
