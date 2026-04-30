/**
 * FeedbackForm - submits user feedback via POST /api/v1/feedback.
 *
 * Can be used:
 *   (a) as a standalone section on any page
 *   (b) embedded in a Modal (when triggered from Footer or Profile)
 *
 * Props:
 *   onSuccess  (function|undefined) - called after successful submission
 *   onClose    (function|undefined) - if provided, renders a Cancel button
 *   country    (string|null)        - pre-fills country from context
 */

import { useState, useRef } from 'react'
import PropTypes from 'prop-types'
import { feedbackApi } from '../../services/api'

const CATEGORIES = [
  { value: 'suggestion', label: 'Suggestion' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'content', label: 'Content Error' },
  { value: 'other', label: 'Other' },
]

const MAX_LENGTH = 2000

export default function FeedbackForm({ onSuccess, onClose, country = null }) {
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState('suggestion')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const [fieldError, setFieldError] = useState(null)

  const successHeadingRef = useRef(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setFieldError(null)
    setError(null)

    const trimmed = message.trim()
    if (!trimmed) {
      setFieldError('Please enter a message before submitting.')
      return
    }
    if (trimmed.length > MAX_LENGTH) {
      setFieldError(`Message must be ${MAX_LENGTH} characters or fewer.`)
      return
    }

    setSubmitting(true)
    try {
      await feedbackApi.submit(trimmed, category, country)
      setSubmitted(true)
      onSuccess?.()
      // Move focus to success heading for screen reader announcement
      setTimeout(() => successHeadingRef.current?.focus(), 50)
    } catch (err) {
      if (err?.response?.status === 429) {
        setError('Too many requests. Please try again in an hour.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // -- Success state ----------------------------------------------------------
  if (submitted) {
    return (
      <div className="text-center py-6 space-y-3">
        <svg
          aria-hidden="true"
          className="mx-auto w-12 h-12 text-success-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <h2
          ref={successHeadingRef}
          tabIndex={-1}
          className="text-xl font-semibold text-neutral-900 outline-none"
        >
          Thank you for your feedback!
        </h2>
        <p className="text-neutral-600">Your message has been received.</p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="mt-4 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 focus:outline-2 focus:outline-primary-600"
          >
            Close
          </button>
        )}
      </div>
    )
  }

  // -- Form state -------------------------------------------------------------
  return (
    <form onSubmit={handleSubmit} aria-label="Feedback form" noValidate className="space-y-5">
      {/* Category */}
      <div>
        <label
          htmlFor="feedback-category"
          className="block text-sm font-medium text-neutral-700 mb-1"
        >
          Category
        </label>
        <select
          id="feedback-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-800 focus:outline-2 focus:outline-primary-600 bg-white"
        >
          {CATEGORIES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="feedback-message"
          className="block text-sm font-medium text-neutral-700 mb-1"
        >
          Message
        </label>
        <textarea
          id="feedback-message"
          rows={5}
          maxLength={MAX_LENGTH}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value)
            setFieldError(null)
          }}
          aria-describedby="feedback-char-count feedback-field-error"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-800 focus:outline-2 focus:outline-primary-600 resize-vertical"
          placeholder="Tell us what you think..."
        />
        <p
          id="feedback-char-count"
          aria-live="polite"
          aria-atomic="true"
          className="text-xs text-neutral-400 mt-1 text-right"
        >
          {message.length} / {MAX_LENGTH} characters
        </p>

        {/* Field-level validation error */}
        {fieldError && (
          <p id="feedback-field-error" role="alert" className="text-sm text-error-600 mt-1">
            {fieldError}
          </p>
        )}
      </div>

      {/* API-level error */}
      {error && (
        <p
          role="alert"
          className="text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg px-3 py-2"
        >
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-60 focus:outline-2 focus:outline-primary-600 transition-colors"
        >
          {submitting ? 'Sending...' : 'Send Feedback'}
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 text-sm font-medium hover:bg-neutral-50 focus:outline-2 focus:outline-neutral-400 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

FeedbackForm.propTypes = {
  onSuccess: PropTypes.func,
  onClose: PropTypes.func,
  country: PropTypes.string,
}
