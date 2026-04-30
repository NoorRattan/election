/**
 * Accessible modal dialog.
 * - role="dialog", aria-modal="true", aria-labelledby pointing to title
 * - Focus trapped inside while open; restored to trigger on close
 * - Closes on Escape key or backdrop click
 * - Rendered via React portal into document.body
 */

import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom'
import { trapFocus } from '../../utils/accessibility'

export default function Modal({ isOpen, onClose, title, children, id = 'modal' }) {
  const dialogRef = useRef(null)
  const titleId = `${id}-title`

  useEffect(() => {
    if (!isOpen) return

    // Trap focus and handle Escape
    const cleanup = trapFocus(dialogRef.current)

    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)

    // Prevent body scroll while modal is open
    document.body.style.overflow = 'hidden'

    return () => {
      cleanup()
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      aria-hidden="false"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-slide-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 id={titleId} className="text-lg font-semibold text-neutral-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-neutral-400 hover:text-neutral-700 focus:outline-2 focus:outline-offset-2 focus:outline-primary-600 rounded-md p-1"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body
  )
}

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  id: PropTypes.string,
}
