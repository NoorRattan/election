import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useCountry } from '../contexts/CountryContext'
import { useTopics } from '../hooks/useTopics'
import Badge from '../components/ui/Badge'

const CATEGORIES = [
  'all',
  'registration',
  'eligibility',
  'ballot',
  'campaign',
  'counting',
  'dispute',
]

function SkeletonCard() {
  return <div className="bg-white rounded-xl border border-neutral-200 p-6 h-36 animate-pulse" />
}

export default function Topics() {
  const { country } = useCountry()
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebounced] = useState('')

  useEffect(() => {
    document.title = 'Topics | Electra'
  }, [])

  // Debounce search input 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchTerm), 300)
    return () => clearTimeout(t)
  }, [searchTerm])

  const { topics, loading, error } = useTopics({
    country: country || undefined,
    category: activeTab === 'all' ? undefined : activeTab,
  })

  const filtered = useMemo(
    () =>
      debouncedSearch
        ? topics.filter((t) => t.title.toLowerCase().includes(debouncedSearch.toLowerCase()))
        : topics,
    [topics, debouncedSearch]
  )

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-neutral-900 mb-8">Explore Topics</h1>

      {/* Category tabs */}
      <div
        role="tablist"
        aria-label="Filter topics by category"
        className="flex flex-wrap gap-2 mb-6"
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            role="tab"
            aria-selected={activeTab === cat}
            onClick={() => setActiveTab(cat)}
            className={[
              'px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors focus:outline-2 focus:outline-primary-600',
              activeTab === cat
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200',
            ].join(' ')}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6">
        <label htmlFor="topic-search" className="sr-only">
          Search topics
        </label>
        <input
          id="topic-search"
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search topics..."
          className="w-full sm:w-72 px-4 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-2 focus:outline-primary-600"
        />
      </div>

      {/* Results */}
      {error && (
        <p className="text-error-600 mb-4" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-neutral-500">
          <p className="text-lg font-medium mb-2">No topics found</p>
          <p className="text-sm">Try a different category or search term.</p>
        </div>
      ) : (
        <div role="tabpanel" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((topic) => (
            <Link
              key={topic.slug}
              to={`/topics/${topic.slug}`}
              className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm hover:shadow-md hover:border-primary-300 transition-all focus:outline-2 focus:outline-primary-600 block"
            >
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="info">{topic.category}</Badge>
                {topic.country.map((c) => (
                  <Badge key={c} variant="neutral">
                    {c}
                  </Badge>
                ))}
              </div>
              <h2 className="font-semibold text-neutral-900 text-base">{topic.title}</h2>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
