/**
 * Footer — global site footer with three columns:
 *   1. Official Sources (external links)
 *   2. Legal (Privacy Policy, Accessibility Statement, Send Feedback)
 *   3. Project (GitHub, tagline)
 *
 * Privacy Policy and Accessibility Statement use React Router <Link> for
 * client-side navigation. "Send Feedback" opens a Modal with FeedbackForm.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../ui/Modal';
import FeedbackForm from '../feedback/FeedbackForm';
import { useCountry } from '../../contexts/CountryContext';

export default function Footer() {
  const { country } = useCountry();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <footer aria-label="Footer" className="bg-neutral-50 border-t border-neutral-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Column 1 — Official Sources */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">Official Sources</h3>
            <ul className="space-y-2">
              {[
                { href: 'https://www.electoralcommission.org.uk', label: 'Electoral Commission (UK)' },
                { href: 'https://www.usa.gov',                     label: 'USA.gov (US)' },
                { href: 'https://eci.gov.in',                      label: 'Election Commission of India' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 hover:text-primary-800 hover:underline underline focus:outline-2 focus:outline-primary-600 rounded"
                  >
                    {label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2 — Legal */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/privacy"
                  className="text-sm text-neutral-600 hover:text-neutral-900 hover:underline focus:outline-2 focus:outline-neutral-400 rounded"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/accessibility"
                  className="text-sm text-neutral-600 hover:text-neutral-900 hover:underline focus:outline-2 focus:outline-neutral-400 rounded"
                >
                  Accessibility Statement
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setFeedbackOpen(true)}
                  className="text-sm text-neutral-600 hover:text-neutral-900 hover:underline focus:outline-2 focus:outline-neutral-400 rounded bg-transparent border-0 p-0 cursor-pointer"
                >
                  Send Feedback
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3 — Project */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">Project</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/NoorRattan/election"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-neutral-600 underline hover:text-neutral-900 focus:outline-2 focus:outline-neutral-400 rounded"
                >
                  GitHub Repository ↗
                </a>
              </li>
              <li>
                <p className="text-sm text-neutral-500">Built for civic education.</p>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-neutral-200">
          <p className="text-xs text-neutral-500 text-center">
            © {new Date().getFullYear()} Electra. Content sourced from official government websites. Not
            affiliated with any government body.
          </p>
        </div>
      </div>

      {/* Feedback modal */}
      <Modal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        title="Send Feedback"
        id="feedback-modal"
      >
        <FeedbackForm
          country={country}
          onClose={() => setFeedbackOpen(false)}
        />
      </Modal>
    </footer>
  );
}
