/**
 * Tests for QuizProgress component.
 * Covers step indicator rendering, ARIA attributes, and active/completed state marking.
 */

import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import QuizProgress from '../components/quiz/QuizProgress'

// ── Helper ─────────────────────────────────────────────────────────────────

const renderProgress = (currentIndex, total) =>
  render(<QuizProgress currentIndex={currentIndex} total={total} />)

// ── Tests ──────────────────────────────────────────────────────────────────

describe('QuizProgress', () => {
  it('renders the correct number of step indicators (total=5 → 5 steps)', () => {
    renderProgress(0, 5)
    // Each step has aria-hidden="true" but the container div has role="status".
    // Steps are rendered as divs — count them by querying inside the status element.
    const container = screen.getByRole('status')
    const steps = container.querySelectorAll('[aria-hidden="true"]')
    expect(steps).toHaveLength(5)
  })

  it('aria-label contains "question 1 of 5" when currentIndex=0, total=5', () => {
    renderProgress(0, 5)
    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      'Quiz progress: question 1 of 5'
    )
  })

  it('aria-label updates correctly for currentIndex=2 → "question 3 of 5"', () => {
    renderProgress(2, 5)
    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      'Quiz progress: question 3 of 5'
    )
  })

  it('has role="status" for screen reader live region', () => {
    renderProgress(0, 5)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('current step is visually distinct from others (has a different class)', () => {
    renderProgress(2, 5)
    const container = screen.getByRole('status')
    const steps = Array.from(container.querySelectorAll('[aria-hidden="true"]'))
    const currentStep = steps[2]
    const otherStep   = steps[0]
    // Current step has "bg-primary-600" class; others have "bg-success-500" or "bg-neutral-200"
    expect(currentStep.className).toContain('bg-primary-600')
    expect(otherStep.className).not.toContain('bg-primary-600')
  })

  it('completed steps (index < currentIndex) have a distinct class from upcoming steps', () => {
    renderProgress(2, 5)
    const container    = screen.getByRole('status')
    const steps        = Array.from(container.querySelectorAll('[aria-hidden="true"]'))
    const completedStep = steps[0]  // index 0, currentIndex=2 → completed
    const upcomingStep  = steps[4]  // index 4, currentIndex=2 → upcoming
    expect(completedStep.className).toContain('bg-success-500')
    expect(upcomingStep.className).toContain('bg-neutral-200')
  })

  it('renders for edge case: currentIndex=0, total=1 (single-question quiz)', () => {
    expect(() => renderProgress(0, 1)).not.toThrow()
    const container = screen.getByRole('status')
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1)
  })

  it('renders for edge case: currentIndex=total-1 (last question)', () => {
    expect(() => renderProgress(4, 5)).not.toThrow()
    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      'Quiz progress: question 5 of 5'
    )
  })

  it('renders without errors with currentIndex=0, total=10', () => {
    expect(() => renderProgress(0, 10)).not.toThrow()
    const container = screen.getByRole('status')
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(10)
  })
})
