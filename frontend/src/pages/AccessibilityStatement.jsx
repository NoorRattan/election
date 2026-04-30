/**
 * Accessibility Statement page - route /accessibility
 * No authentication required. Documents WCAG 2.1 AA compliance commitment.
 */

import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function AccessibilityStatement() {
  useEffect(() => {
    document.title = 'Accessibility Statement | Electra'
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <Link
        to="/"
        className="inline-flex items-center text-sm text-primary-600 underline hover:text-primary-800 focus:outline-2 focus:outline-primary-600 rounded mb-6"
      >
        Back to Home
      </Link>

      <h1 className="text-3xl font-bold text-neutral-900 mb-2">Accessibility Statement</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Published: April 2026. Review date: April 2027.
      </p>

      <p className="text-neutral-600 mb-10">
        Electra is committed to making this application accessible to all users, including those
        with disabilities.
      </p>

      <div className="space-y-10">
        <section aria-labelledby="a11y-commitment">
          <h2 id="a11y-commitment" className="text-xl font-semibold text-neutral-800 mb-3">
            Our Commitment
          </h2>
          <p className="text-neutral-600">
            Electra aims to meet <strong>WCAG 2.1 Level AA compliance</strong> throughout. We design
            and test with keyboard navigation, screen readers, and sufficient colour contrast in
            mind.
          </p>
        </section>

        <section aria-labelledby="a11y-technical">
          <h2 id="a11y-technical" className="text-xl font-semibold text-neutral-800 mb-3">
            Technical Specification
          </h2>
          <ul className="list-disc pl-6 space-y-2 text-neutral-600">
            <li>Semantic HTML5 elements throughout</li>
            <li>ARIA roles and labels on all interactive regions</li>
            <li>Skip navigation link on every page (visible on focus)</li>
            <li>
              All form inputs have associated{' '}
              <code className="bg-neutral-100 px-1 rounded text-sm">&lt;label&gt;</code> elements
            </li>
            <li>
              Colour contrast ratio at least 4.5:1 for normal text and at least 3:1 for large text
              (WCAG 1.4.3)
            </li>
            <li>Focus indicators visible on all keyboard-focusable elements</li>
            <li>
              Animated content respects{' '}
              <code className="bg-neutral-100 px-1 rounded text-sm">prefers-reduced-motion</code>{' '}
              media query (where applicable)
            </li>
            <li>
              All SVG icons are either{' '}
              <code className="bg-neutral-100 px-1 rounded text-sm">aria-hidden</code> (decorative)
              or have <code className="bg-neutral-100 px-1 rounded text-sm">aria-label</code>{' '}
              (functional)
            </li>
            <li>
              Modal dialogs trap focus and restore it on close (WCAG 2.1 Success Criterion 2.1.2)
            </li>
            <li>
              Quiz questions use{' '}
              <code className="bg-neutral-100 px-1 rounded text-sm">&lt;fieldset&gt;</code>/
              <code className="bg-neutral-100 px-1 rounded text-sm">&lt;legend&gt;</code> pattern
              (WCAG 1.3.1)
            </li>
            <li>
              Dynamic content announced via{' '}
              <code className="bg-neutral-100 px-1 rounded text-sm">aria-live</code> regions (
              <code className="bg-neutral-100 px-1 rounded text-sm">role=&quot;status&quot;</code>{' '}
              or <code className="bg-neutral-100 px-1 rounded text-sm">role=&quot;alert&quot;</code>
              )
            </li>
          </ul>
        </section>

        <section aria-labelledby="a11y-limitations">
          <h2 id="a11y-limitations" className="text-xl font-semibold text-neutral-800 mb-3">
            Known Limitations
          </h2>
          <ul className="list-disc pl-6 space-y-2 text-neutral-600">
            <li>
              The Google Maps polling station locator depends on a third-party API and may have
              accessibility limitations outside our control. We always provide the official
              government finder link as the primary call-to-action.
            </li>
            <li>
              The chat widget is tested with NVDA + Chrome and VoiceOver + Safari. Other screen
              reader / browser combinations may behave differently.
            </li>
          </ul>
        </section>

        <section aria-labelledby="a11y-testing">
          <h2 id="a11y-testing" className="text-xl font-semibold text-neutral-800 mb-3">
            Testing Approach
          </h2>
          <ul className="list-disc pl-6 space-y-2 text-neutral-600">
            <li>
              Manual testing with keyboard navigation (Tab, Shift+Tab, Arrow keys, Enter, Space,
              Escape)
            </li>
            <li>Screen reader testing: NVDA (Windows), VoiceOver (macOS/iOS)</li>
            <li>
              Colour contrast verified with the{' '}
              <a
                href="https://webaim.org/resources/contrastchecker/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 underline hover:text-primary-800 focus:outline-2 focus:outline-primary-600 rounded"
              >
                WebAIM Contrast Checker
              </a>
            </li>
            <li>Automated checks using axe-core in end-to-end tests</li>
          </ul>
        </section>

        <section aria-labelledby="a11y-feedback">
          <h2 id="a11y-feedback" className="text-xl font-semibold text-neutral-800 mb-3">
            Feedback and Contact
          </h2>
          <p className="text-neutral-600">
            If you encounter an accessibility barrier, please use the <strong>Feedback form</strong>{' '}
            on this site (available in the footer) or raise a{' '}
            <a
              href="https://github.com/NoorRattan/election/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 underline hover:text-primary-800 focus:outline-2 focus:outline-primary-600 rounded"
            >
              GitHub issue
            </a>{' '}
            with the label{' '}
            <code className="bg-neutral-100 px-1 rounded text-sm">accessibility</code>. We aim to
            respond to accessibility reports within <strong>5 working days</strong>.
          </p>
        </section>

        <section aria-labelledby="a11y-regulatory">
          <h2 id="a11y-regulatory" className="text-xl font-semibold text-neutral-800 mb-3">
            Regulatory Framework
          </h2>
          <p className="text-neutral-600">
            This statement is in accordance with the{' '}
            <a
              href="https://www.w3.org/WAI/standards-guidelines/wcag/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 underline hover:text-primary-800 focus:outline-2 focus:outline-primary-600 rounded"
            >
              Web Content Accessibility Guidelines (WCAG) 2.1
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
