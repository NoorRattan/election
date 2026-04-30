import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ElectionTimeline from '../components/timeline/ElectionTimeline'

vi.mock('../services/calendarService', () => ({
  addEventToCalendar: vi.fn(),
  getCalendarUrl: vi.fn(() => 'https://calendar.google.com/test'),
}))

const events = [
  {
    id: 'e1',
    name: 'Local Election Day',
    description: 'Polling day.',
    date: '2099-05-07',
    type: 'poll_day',
    level: 'local',
    state_province: null,
    official_url: 'https://www.electoralcommission.org.uk',
  },
  {
    id: 'e2',
    name: 'Past Deadline',
    description: 'Old deadline.',
    date: '2020-01-01',
    type: 'deadline',
    level: 'local',
    state_province: null,
    official_url: 'https://www.gov.uk',
  },
]

describe('ElectionTimeline', () => {
  function renderTimeline(evts = events) {
    return render(
      <MemoryRouter>
        <ElectionTimeline events={evts} country="UK" />
      </MemoryRouter>
    )
  }

  it('renders a list with correct number of events', () => {
    renderTimeline()
    expect(screen.getByRole('list')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('shows "Past" badge on past events', () => {
    renderTimeline()
    expect(screen.getByText('Past')).toBeInTheDocument()
  })

  it('shows "Add to Calendar" only on upcoming events', () => {
    renderTimeline()
    const calButtons = screen.getAllByText(/add to calendar/i)
    expect(calButtons).toHaveLength(1)
  })

  it('official source links open in new tab with noopener', () => {
    renderTimeline()
    const links = screen.getAllByText(/official source/i)
    links.forEach((link) => {
      expect(link.closest('a')).toHaveAttribute('rel', 'noopener noreferrer')
      expect(link.closest('a')).toHaveAttribute('target', '_blank')
    })
  })

  it('shows empty state when no events', () => {
    renderTimeline([])
    expect(screen.getByText(/no upcoming events/i)).toBeInTheDocument()
  })
})
