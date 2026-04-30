/**
 * Unit tests for useTopics hook.
 *
 * NOTE: uses ESM import (not require()) so that vi.mock hoisting works correctly
 * and the real api.js (which imports firebase.js) is never evaluated.
 */

// Mock firebase first - must be before any import that transitively loads firebase.js
vi.mock('../firebase', () => ({ auth: { currentUser: null }, app: {}, analytics: null }))

// Mock the entire API layer so api.js is never actually evaluated
vi.mock('../services/api', () => ({
  topicsApi: {
    getAll: vi.fn(),
  },
}))

import { renderHook, waitFor } from '@testing-library/react'
import { useTopics } from '../hooks/useTopics'
import { topicsApi } from '../services/api'

describe('useTopics', () => {
  beforeEach(() => vi.clearAllMocks())

  it('starts with loading=true', () => {
    topicsApi.getAll.mockResolvedValue({ topics: [] })
    const { result } = renderHook(() => useTopics())
    expect(result.current.loading).toBe(true)
  })

  it('populates topics on successful fetch', async () => {
    topicsApi.getAll.mockResolvedValue({
      topics: [
        {
          slug: 'voter-registration',
          title: 'Voter Registration',
          category: 'registration',
          country: ['ALL'],
          order: 1,
        },
      ],
    })
    const { result } = renderHook(() => useTopics())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.topics).toHaveLength(1)
    expect(result.current.topics[0].slug).toBe('voter-registration')
  })

  it('sets error string on API failure', async () => {
    topicsApi.getAll.mockRejectedValue(new Error('Network error'))
    const { result } = renderHook(() => useTopics())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeTruthy()
    expect(result.current.topics).toHaveLength(0)
  })
})
