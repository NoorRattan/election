import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom'

import Card from '../components/ui/Card'
import ProgressBar from '../components/ui/ProgressBar'
import { addEventToCalendar, getCalendarUrl } from '../services/calendarService'
import { announceToScreenReader, manageFocusOnModalOpen, trapFocus } from '../utils/accessibility'

describe('calendar service', () => {
  it('builds a Google Calendar URL and opens it safely', () => {
    const event = {
      name: 'Election Day',
      description: 'Vote locally.',
      date: '2026-05-07',
      official_url: 'https://gov.uk',
    }
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

    const url = getCalendarUrl(event)
    expect(url).toContain('https://calendar.google.com/calendar/render?')
    expect(url).toContain('Election+Day')
    expect(url).toContain('20260507%2F20260507')

    addEventToCalendar(event)
    expect(openSpy).toHaveBeenCalledWith(url, '_blank', 'noopener,noreferrer')
  })
})

describe('small UI components', () => {
  it('Card supports keyboard activation when clickable', () => {
    const onClick = vi.fn()
    render(<Card onClick={onClick}>Open card</Card>)

    const card = screen.getByRole('button', { name: /open card/i })
    fireEvent.keyDown(card, { key: 'Enter' })
    fireEvent.keyDown(card, { key: ' ' })

    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it('ProgressBar clamps values and exposes ARIA metadata', () => {
    render(<ProgressBar value={142} label="Completion" />)

    const progress = screen.getByRole('progressbar', { name: /completion/i })
    expect(progress).toHaveAttribute('aria-valuenow', '100')
    expect(screen.getByText('100%')).toBeVisible()
  })
})

describe('accessibility utilities', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('trapFocus cycles Tab focus within a container', () => {
    document.body.innerHTML = `
      <div id="modal">
        <button id="first">First</button>
        <button id="last">Last</button>
      </div>
    `
    const modal = document.getElementById('modal')
    const first = document.getElementById('first')
    const last = document.getElementById('last')
    const cleanup = trapFocus(modal)

    last.focus()
    fireEvent.keyDown(modal, { key: 'Tab' })
    expect(first).toHaveFocus()

    first.focus()
    fireEvent.keyDown(modal, { key: 'Tab', shiftKey: true })
    expect(last).toHaveFocus()

    cleanup()
  })

  it('announceToScreenReader creates and removes an aria-live region', () => {
    vi.useFakeTimers()

    announceToScreenReader('Saved', 'assertive')
    const live = screen.getByText('Saved')
    expect(live).toHaveAttribute('aria-live', 'assertive')

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.queryByText('Saved')).not.toBeInTheDocument()

    vi.useRealTimers()
  })

  it('manageFocusOnModalOpen focuses the first modal control and restores trigger focus', () => {
    const trigger = document.createElement('button')
    trigger.textContent = 'Open'
    document.body.appendChild(trigger)

    const modal = document.createElement('div')
    modal.innerHTML = '<button>Close</button>'
    document.body.appendChild(modal)

    trigger.focus()
    const cleanup = manageFocusOnModalOpen({ current: modal }, { current: trigger })

    expect(screen.getByRole('button', { name: /close/i })).toHaveFocus()
    cleanup()
    expect(trigger).toHaveFocus()
  })
})
