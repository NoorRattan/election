import { useState, useEffect, useCallback } from 'react';
import { topicsApi } from '../services/api';

/**
 * Fetches and returns topics, optionally filtered by country and category.
 * Re-fetches automatically when country or category changes.
 */
export function useTopics({ country = null, category = null } = {}) {
  const [topics,  setTopics]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (country) params.country = country;
      if (category) params.category = category;
      const data = await topicsApi.getAll(params);
      setTopics(data.topics || []);
    } catch (err) {
      setError(err.message || 'Failed to load topics.');
      setTopics([]);
    } finally {
      setLoading(false);
    }
  }, [country, category]);

  useEffect(() => { fetchTopics(); }, [fetchTopics]);

  return { topics, loading, error, refetch: fetchTopics };
}
