/**
 * Unit tests for the Modal component.
 *
 * Modal uses trapFocus from ../../utils/accessibility - mocked here.
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom'

import Modal from '../components/ui/Modal'

// -- Mock accessibility utilities -------------------------------------------
vi.mock('../utils/accessibility', () => ({
  trapFocus: vi.fn(() => vi.fn()), // returns a cleanup function
  manageFocusOnModalOpen: vi.fn(() => vi.fn()),
}))

// -- Helper -----------------------------------------------------------------
const DEFAULT_PROPS = {
  id: 'test-modal',
  title: 'Test Title',
  onClose: vi.fn(),
}

function renderModal(props = {}) {
  const merged = { ...DEFAULT_PROPS, onClose: vi.fn(), ...props }
  return {
    onClose: merged.onClose,
    ...render(
      <MemoryRouter>
        <Modal {...merged}>
          <p>Modal content</p>
          <button type="button">Action</button>
        </Modal>
      </MemoryRouter>
    ),
  }
}

// -- Tests ------------------------------------------------------------------

describe('Modal - render behaviour', () => {
  it('when isOpen=false: role="dialog" is NOT in the document', () => {
    renderModal({ isOpen: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('when isOpen=true: role="dialog" is in the document', () => {
    renderModal({ isOpen: true })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('when isOpen=true: aria-modal="true" is set on the dialog', () => {
    renderModal({ isOpen: true })
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('when isOpen=true: title text "Test Title" is visible', () => {
    renderModal({ isOpen: true })
    expect(screen.getByText('Test Title')).toBeVisible()
  })

  it('when isOpen=true: aria-labelledby on dialog matches id of the title element', () => {
    renderModal({ isOpen: true })
    const dialog = screen.getByRole('dialog')
    const labelledById = dialog.getAttribute('aria-labelledby')
    // Should be "test-modal-title"
    expect(labelledById).toBe('test-modal-title')
    // The element with that ID should contain the title text
    const titleEl = document.getElementById('test-modal-title')
    expect(titleEl).toBeInTheDocument()
    expect(titleEl).toHaveTextContent('Test Title')
  })

  it('children are rendered inside the dialog when isOpen=true', () => {
    renderModal({ isOpen: true })
    expect(screen.getByText('Modal content')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument()
  })

  it('close button has an accessible label', () => {
    renderModal({ isOpen: true })
    // The close button should have aria-label describing its purpose
    const closeBtn = screen.getByRole('button', { name: /close/i })
    expect(closeBtn).toBeInTheDocument()
  })
})

describe('Modal - interaction', () => {
  it('clicking the backdrop calls onClose', () => {
    const { onClose } = renderModal({ isOpen: true })
    // The backdrop is the aria-hidden div behind the dialog
    // We simulate a click on the outer container (not the dialog itself)
    const backdrop = document.querySelector('[aria-hidden="true"]')
    expect(backdrop).not.toBeNull()
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('clicking inside the dialog content does NOT call onClose', () => {
    const { onClose } = renderModal({ isOpen: true })
    fireEvent.click(screen.getByText('Modal content'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('pressing Escape key calls onClose', () => {
    const { onClose } = renderModal({ isOpen: true })
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('clicking the close button calls onClose', () => {
    const { onClose } = renderModal({ isOpen: true })
    const closeBtn = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('Modal - accessibility', () => {
  it('trapFocus utility is called when modal opens', async () => {
    const { trapFocus } = await import('../utils/accessibility')
    renderModal({ isOpen: true })
    expect(trapFocus).toHaveBeenCalled()
  })

  it('when isOpen=false then isOpen=true, trapFocus is called on the dialog element', async () => {
    const { trapFocus } = await import('../utils/accessibility')
    vi.clearAllMocks()

    const { rerender } = render(
      <MemoryRouter>
        <Modal id="test-modal" title="Test Title" onClose={vi.fn()} isOpen={false}>
          <p>Content</p>
        </Modal>
      </MemoryRouter>
    )

    expect(trapFocus).not.toHaveBeenCalled()

    rerender(
      <MemoryRouter>
        <Modal id="test-modal" title="Test Title" onClose={vi.fn()} isOpen={true}>
          <p>Content</p>
        </Modal>
      </MemoryRouter>
    )

    expect(trapFocus).toHaveBeenCalledTimes(1)
  })
})
