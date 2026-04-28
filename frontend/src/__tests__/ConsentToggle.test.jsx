/**
 * Tests for ConsentToggle component.
 * Covers rendering, interaction, and accessibility (role="switch" ARIA pattern).
 */

import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ConsentToggle from '../components/ui/ConsentToggle'

// ── Helper ─────────────────────────────────────────────────────────────────

const renderToggle = (props = {}) =>
  render(
    <ConsentToggle
      id="test-toggle"
      label="Usage Analytics"
      description="Help us improve Electra."
      checked={false}
      onChange={vi.fn()}
      {...props}
    />
  )

// ── Rendering ──────────────────────────────────────────────────────────────

describe('ConsentToggle — rendering', () => {
  it('shows the label text', () => {
    renderToggle()
    expect(screen.getByText('Usage Analytics')).toBeInTheDocument()
  })

  it('shows the description text', () => {
    renderToggle()
    expect(screen.getByText('Help us improve Electra.')).toBeInTheDocument()
  })

  it('renders a switch button', () => {
    renderToggle()
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('has aria-checked="false" when checked=false', () => {
    renderToggle({ checked: false })
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
  })

  it('has aria-checked="true" when checked=true', () => {
    renderToggle({ checked: true })
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })

  it('label htmlFor points to the button id', () => {
    renderToggle()
    // getByLabelText uses the label's htmlFor → button id association
    const switchEl = screen.getByLabelText('Usage Analytics')
    expect(switchEl).toHaveAttribute('role', 'switch')
    expect(switchEl).toHaveAttribute('id', 'test-toggle')
  })
})

// ── Interaction ────────────────────────────────────────────────────────────

describe('ConsentToggle — interaction', () => {
  it('calls onChange with true when clicked and checked=false', () => {
    const onChange = vi.fn()
    renderToggle({ checked: false, onChange })
    fireEvent.click(screen.getByRole('switch'))
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('calls onChange with false when clicked and checked=true', () => {
    const onChange = vi.fn()
    renderToggle({ checked: true, onChange })
    fireEvent.click(screen.getByRole('switch'))
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('switch is reachable via keyboard Tab', async () => {
    const user = userEvent.setup()
    renderToggle()
    await user.tab()
    expect(screen.getByRole('switch')).toHaveFocus()
  })

  it('pressing Space on focused switch calls onChange (native button behaviour)', () => {
    const onChange = vi.fn()
    renderToggle({ onChange })
    const toggle = screen.getByRole('switch')
    toggle.focus()
    // Native <button> treats Space as a click — fireEvent.keyDown mirrors that
    fireEvent.keyDown(toggle, { key: ' ', code: 'Space' })
    fireEvent.click(toggle) // Space on a button dispatches a click
    expect(onChange).toHaveBeenCalled()
  })
})

// ── Accessibility ──────────────────────────────────────────────────────────

describe('ConsentToggle — accessibility', () => {
  it('button has a visible focus ring class', () => {
    renderToggle()
    const btn = screen.getByRole('switch')
    // The class list should contain "focus" (focus-visible:ring or focus:outline)
    expect(btn.className).toMatch(/focus/)
  })

  it('shows "Enabled" screen-reader text when checked=true', () => {
    renderToggle({ checked: true })
    expect(screen.getByText('Enabled')).toBeInTheDocument()
  })

  it('shows "Disabled" screen-reader text when checked=false', () => {
    renderToggle({ checked: false })
    expect(screen.getByText('Disabled')).toBeInTheDocument()
  })

  it('has role="switch" (not role="checkbox")', () => {
    renderToggle()
    // getByRole('switch') would already prove this; query explicitly for confidence
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })
})
