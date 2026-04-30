/**
 * Accessibility utility functions.
 * Provides focus management and screen reader announcement helpers.
 * Used by Modal, CountrySelector, QuizResult, and other interactive components.
 */

/**
 * Trap keyboard focus inside a container element (for modals and dialogs).
 * Returns a cleanup function to remove the event listener.
 *
 * @param {HTMLElement} element - The container to trap focus within.
 * @returns {() => void} Call this to remove the trap.
 */
export function trapFocus(element) {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ')

  function getFocusable() {
    return Array.from(element.querySelectorAll(focusableSelectors))
  }

  function handleKeyDown(e) {
    if (e.key !== 'Tab') return
    const focusable = getFocusable()
    if (!focusable.length) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  element.addEventListener('keydown', handleKeyDown)
  return () => element.removeEventListener('keydown', handleKeyDown)
}

/**
 * Announce a message to screen readers via an aria-live region.
 * The region is created, populated, and removed after 1 second.
 *
 * @param {string} message - Text to announce.
 * @param {'polite'|'assertive'} priority - aria-live value. Default "polite".
 * @returns {void}
 */
export function announceToScreenReader(message, priority = 'polite') {
  const el = document.createElement('div')
  el.setAttribute('role', 'status')
  el.setAttribute('aria-live', priority)
  el.setAttribute('aria-atomic', 'true')
  el.className = 'sr-only'
  el.textContent = message
  document.body.appendChild(el)
  setTimeout(() => document.body.removeChild(el), 1000)
}

/**
 * Move focus to the first focusable element inside a modal.
 * Returns a cleanup function that restores focus to the trigger element on call.
 *
 * @param {{ current: HTMLElement | null }} modalRef - React ref to the modal container.
 * @param {{ current: HTMLElement | null }} triggerRef - React ref to the element that opened the modal.
 * @returns {() => void} Cleanup callback that restores focus to the trigger.
 */
export function manageFocusOnModalOpen(modalRef, triggerRef) {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ')

  if (modalRef.current) {
    const first = modalRef.current.querySelector(focusableSelectors)
    if (first) first.focus()
  }

  return () => {
    if (triggerRef?.current) {
      triggerRef.current.focus()
    }
  }
}
