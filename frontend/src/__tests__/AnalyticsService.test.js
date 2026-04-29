import { beforeEach, describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { logEvent } from 'firebase/analytics';

const firebaseMock = vi.hoisted(() => ({
  analytics: {},
  getAnalyticsInstance: vi.fn(() => Promise.resolve({ app: 'analytics' })),
}));

vi.mock('../firebase', () => ({
  getAnalyticsInstance: firebaseMock.getAnalyticsInstance,
}));

import {
  grantAnalyticsConsent,
  revokeAnalyticsConsent,
  trackEvent,
  trackPageView,
  trackQuizComplete,
} from '../services/analytics';

describe('analytics consent gate', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('does not initialize analytics or log events without consent', () => {
    trackEvent('page_view', { page_title: 'Home' });

    expect(firebaseMock.getAnalyticsInstance).not.toHaveBeenCalled();
    expect(logEvent).not.toHaveBeenCalled();
  });

  it('logs page and quiz events after consent is granted', async () => {
    grantAnalyticsConsent();

    trackPageView('Home');
    trackQuizComplete('voter-registration', 90);

    await waitFor(() => {
      expect(logEvent).toHaveBeenCalledWith(
        { app: 'analytics' },
        'page_view',
        { page_title: 'Home' }
      );
      expect(logEvent).toHaveBeenCalledWith(
        { app: 'analytics' },
        'quiz_complete',
        { topic_id: 'voter-registration', score: 90 }
      );
    });
  });

  it('stops logging after consent is revoked', () => {
    grantAnalyticsConsent();
    revokeAnalyticsConsent();

    trackEvent('page_view');

    expect(firebaseMock.getAnalyticsInstance).not.toHaveBeenCalled();
  });
});
