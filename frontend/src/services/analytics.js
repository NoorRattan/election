/**
 * Firebase Analytics wrapper with GDPR consent gate.
 * Analytics events are only sent after the user has explicitly consented.
 * Consent is stored in localStorage under "electra_analytics_consent".
 */

import { logEvent } from 'firebase/analytics';
import { getAnalyticsInstance } from '../firebase';

const CONSENT_KEY = 'electra_analytics_consent';

function hasConsent() {
  return localStorage.getItem(CONSENT_KEY) === 'true';
}

export function grantAnalyticsConsent() {
  localStorage.setItem(CONSENT_KEY, 'true');
}

export function revokeAnalyticsConsent() {
  localStorage.removeItem(CONSENT_KEY);
}

export function trackEvent(eventName, params = {}) {
  if (!hasConsent()) return;
  getAnalyticsInstance().then((analytics) => {
    if (!analytics) return;
    try {
      logEvent(analytics, eventName, params);
    } catch { /* non-fatal */ }
  });
}

export function trackPageView(pageName) {
  trackEvent('page_view', { page_title: pageName });
}

export function trackQuizComplete(topicId, score) {
  trackEvent('quiz_complete', { topic_id: topicId, score });
}
