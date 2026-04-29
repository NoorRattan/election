/**
 * Privacy Policy page — route /privacy
 * No authentication required. Fully readable without JavaScript.
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = 'Privacy Policy | Electra';
  }, []);

  return (
    <main id="main-content" className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <Link
        to="/"
        className="inline-flex items-center text-sm text-primary-600 underline hover:text-primary-800 focus:outline-2 focus:outline-primary-600 rounded mb-6"
      >
        ← Back to Home
      </Link>

      <h1 className="text-3xl font-bold text-neutral-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-neutral-500 mb-10">Last updated: April 2026</p>

      <div className="prose prose-neutral max-w-none space-y-10">

        <section aria-labelledby="privacy-what-we-collect">
          <h2 id="privacy-what-we-collect" className="text-xl font-semibold text-neutral-800 mb-3">
            What We Collect
          </h2>
          <p className="text-neutral-600 mb-2">We collect only what is necessary to provide the service:</p>
          <ul className="list-disc pl-6 space-y-1 text-neutral-600">
            <li>Email address and display name (from Firebase Auth on sign-in)</li>
            <li>Country preference and age group (if you choose to provide them in your profile)</li>
            <li>Quiz scores and topic completion progress (stored against your account)</li>
            <li>
              Optional: anonymised usage analytics — <strong>only with your explicit consent</strong> (see
              the Analytics section below)
            </li>
          </ul>
        </section>

        <section aria-labelledby="privacy-how-we-use">
          <h2 id="privacy-how-we-use" className="text-xl font-semibold text-neutral-800 mb-3">
            How We Use Your Data
          </h2>
          <ul className="list-disc pl-6 space-y-1 text-neutral-600">
            <li>To personalise election content to your country</li>
            <li>To save your learning progress across sessions and devices</li>
            <li>To improve the application using aggregated, anonymised analytics only</li>
            <li className="font-medium text-neutral-800">
              We do not sell, share, or use your data for advertising — ever.
            </li>
          </ul>
        </section>

        <section aria-labelledby="privacy-analytics">
          <h2 id="privacy-analytics" className="text-xl font-semibold text-neutral-800 mb-3">
            Analytics
          </h2>
          <ul className="list-disc pl-6 space-y-1 text-neutral-600">
            <li>Firebase Analytics is only initialised <strong>after you give explicit consent</strong></li>
            <li>
              You can withdraw consent at any time in{' '}
              <Link
                to="/profile"
                className="text-primary-600 underline hover:text-primary-800 focus:outline-2 focus:outline-primary-600 rounded"
              >
                Profile → Settings
              </Link>
            </li>
            <li>
              Consent is stored locally (localStorage key:{' '}
              <code className="bg-neutral-100 px-1 rounded text-sm">electra_analytics_consent</code>)
            </li>
            <li>Analytics events are anonymised before transmission to Google</li>
          </ul>
        </section>

        <section aria-labelledby="privacy-retention">
          <h2 id="privacy-retention" className="text-xl font-semibold text-neutral-800 mb-3">
            Data Retention
          </h2>
          <ul className="list-disc pl-6 space-y-1 text-neutral-600">
            <li>Your data is kept for as long as your account exists</li>
            <li>
              You can permanently delete your account and all associated data from{' '}
              <Link
                to="/profile"
                className="text-primary-600 underline hover:text-primary-800 focus:outline-2 focus:outline-primary-600 rounded"
              >
                Profile → Account → Delete My Account
              </Link>
            </li>
            <li>Deletion is immediate and irreversible</li>
          </ul>
        </section>

        <section aria-labelledby="privacy-your-rights">
          <h2 id="privacy-your-rights" className="text-xl font-semibold text-neutral-800 mb-3">
            Your Rights
          </h2>
          <ul className="list-disc pl-6 space-y-1 text-neutral-600">
            <li>
              <strong>Right to access:</strong> request a copy of your data via the Feedback form on this
              site
            </li>
            <li>
              <strong>Right to erasure:</strong> use Delete My Account (GDPR Article 17)
            </li>
            <li>
              <strong>Right to rectification:</strong> update your profile at any time
            </li>
            <li>This application is operated for educational purposes only</li>
          </ul>
        </section>

        <section aria-labelledby="privacy-third-party">
          <h2 id="privacy-third-party" className="text-xl font-semibold text-neutral-800 mb-3">
            Third-Party Services
          </h2>
          <ul className="list-disc pl-6 space-y-1 text-neutral-600">
            <li>
              <strong>Firebase Auth (Google)</strong> — authentication
            </li>
            <li>
              <strong>Google Cloud Firestore</strong> — data storage
            </li>
            <li>
              <strong>Google Maps</strong> — polling station locator (no sign-in required)
            </li>
            <li>
              <strong>Dialogflow CX</strong> — chat assistant (messages may be processed by Google)
            </li>
          </ul>
          <p className="mt-3 text-neutral-600">
            All services are subject to Google&apos;s Privacy Policy:{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 underline hover:text-primary-800 focus:outline-2 focus:outline-primary-600 rounded"
            >
              policies.google.com/privacy ↗
            </a>
          </p>
        </section>

        <section aria-labelledby="privacy-contact">
          <h2 id="privacy-contact" className="text-xl font-semibold text-neutral-800 mb-3">
            Contact
          </h2>
          <ul className="list-disc pl-6 space-y-1 text-neutral-600">
            <li>For privacy questions, use the Feedback form on this site</li>
            <li>
              For urgent requests: raise a{' '}
              <a
                href="https://github.com/NoorRattan/election/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 underline hover:text-primary-800 focus:outline-2 focus:outline-primary-600 rounded"
              >
                GitHub issue ↗
              </a>{' '}
              with the label <code className="bg-neutral-100 px-1 rounded text-sm">privacy</code>
            </li>
          </ul>
        </section>

        <section aria-labelledby="privacy-changes">
          <h2 id="privacy-changes" className="text-xl font-semibold text-neutral-800 mb-3">
            Changes to This Policy
          </h2>
          <p className="text-neutral-600">
            We will notify users of material changes via the application. Continued use after notification
            constitutes acceptance of the updated policy.
          </p>
        </section>

      </div>
    </main>
  );
}
