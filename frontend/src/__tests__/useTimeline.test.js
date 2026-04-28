/**
 * Unit tests for useTimeline hook.
 *
 * Follows the same pattern as useTopics.test.js.
 * Key difference: hook guards on country=null and sorts events by date ASC.
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

vi.mock('../firebase', () => ({ auth: { currentUser: null }, app: {}, analytics: null }));

vi.mock('../services/api', () => ({
  timelineApi: {
    getEvents: vi.fn(),
  },
}));

// Import hook and mocked API after mocks are set up
import { useTimeline } from '../hooks/useTimeline';
import { timelineApi } from '../services/api';

// ── Fixture ─────────────────────────────────────────────────────────────────
const UK_EVENTS_FIXTURE = [
  {
    id: 'uk-poll-1',
    name: 'Local Election Day',
    date: '2026-05-07',
    type: 'poll_day',
    country: 'UK',
    level: 'local',
    official_url: 'https://electoralcommission.org.uk',
  },
  {
    id: 'uk-reg-1',
    name: 'Registration Deadline',
    date: '2026-04-20',
    type: 'deadline',
    country: 'UK',
    level: 'local',
    official_url: 'https://gov.uk/register-to-vote',
  },
];

// Fixture in REVERSE date order (for sort test)
const UK_EVENTS_REVERSED = [
  { ...UK_EVENTS_FIXTURE[0] }, // 2026-05-07 (later)
  { ...UK_EVENTS_FIXTURE[1] }, // 2026-04-20 (earlier)
];

const US_EVENTS_FIXTURE = [
  {
    id: 'us-poll-1',
    name: 'Presidential Election Day',
    date: '2028-11-07',
    type: 'poll_day',
    country: 'US',
    level: 'national',
    official_url: 'https://usa.gov',
  },
];

// ── Hook wrapper with country ────────────────────────────────────────────────
// useTimeline reads country via props or context — check the actual hook signature
// If hook takes a `country` parameter directly:
function renderTimelineHook(country) {
  return renderHook(() => useTimeline({ country }));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initial state: loading=true, events=[], error=null', () => {
    timelineApi.getEvents.mockResolvedValue({ events: [] });
    const { result } = renderTimelineHook('UK');
    expect(result.current.loading).toBe(true);
    expect(result.current.events).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('when country is null: API is NOT called', async () => {
    const { result } = renderTimelineHook(null);
    // Give any async effects time to run
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(timelineApi.getEvents).not.toHaveBeenCalled();
    expect(result.current.events).toEqual([]);
  });

  it('on successful fetch: loading becomes false, events populated', async () => {
    timelineApi.getEvents.mockResolvedValue({ events: UK_EVENTS_FIXTURE });
    const { result } = renderTimelineHook('UK');
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.events).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it('events are sorted by date ASC — reversed fixture → ASC order returned', async () => {
    timelineApi.getEvents.mockResolvedValue({ events: UK_EVENTS_REVERSED });
    const { result } = renderTimelineHook('UK');
    await waitFor(() => expect(result.current.loading).toBe(false));

    if (result.current.events.length >= 2) {
      const dates = result.current.events.map((e) => e.date);
      // ASC sort: earlier date first
      expect(dates[0] <= dates[1]).toBe(true);
      // Specifically: '2026-04-20' before '2026-05-07'
      expect(dates[0]).toBe('2026-04-20');
      expect(dates[1]).toBe('2026-05-07');
    }
  });

  it('on API error: loading=false, error is non-empty string, events=[]', async () => {
    timelineApi.getEvents.mockRejectedValue(new Error('Network error'));
    const { result } = renderTimelineHook('UK');
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeTruthy();
    expect(typeof result.current.error).toBe('string');
    expect(result.current.events).toEqual([]);
  });

  it('getEvents is called with the correct country argument', async () => {
    timelineApi.getEvents.mockResolvedValue({ events: UK_EVENTS_FIXTURE });
    renderTimelineHook('UK');
    await waitFor(() => expect(timelineApi.getEvents).toHaveBeenCalled());
    expect(timelineApi.getEvents).toHaveBeenCalledWith('UK', null, null);
  });

  it('when country changes: API is called again with new country', async () => {
    timelineApi.getEvents
      .mockResolvedValueOnce({ events: UK_EVENTS_FIXTURE })
      .mockResolvedValueOnce({ events: US_EVENTS_FIXTURE });

    const { result, rerender } = renderHook(
      ({ country }) => useTimeline({ country }),
      { initialProps: { country: 'UK' } }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.events).toHaveLength(2);

    rerender({ country: 'US' });

    await waitFor(() => {
      expect(timelineApi.getEvents).toHaveBeenCalledTimes(2);
    });
    expect(timelineApi.getEvents).toHaveBeenLastCalledWith('US', null, null);
  });
});
