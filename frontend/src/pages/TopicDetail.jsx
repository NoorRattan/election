import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { topicsApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'

export default function TopicDetail() {
  const { slug } = useParams()
  const { user } = useAuth()
  const [topic, setTopic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    topicsApi
      .getBySlug(slug)
      .then((data) => {
        setTopic(data)
        document.title = `${data.title} | Electra`
      })
      .catch((err) =>
        setError(err.response?.status === 404 ? 'Topic not found.' : 'Failed to load topic.')
      )
      .finally(() => setLoading(false))
  }, [slug])

  if (loading)
    return (
      <div className="flex justify-center py-20" role="status" aria-label="Loading topic">
        <div
          className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"
          aria-hidden="true"
        />
      </div>
    )
  if (error)
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-error-600 text-lg" role="alert">
          {error}
        </p>
        <Link to="/topics" className="mt-4 inline-block text-primary-600 hover:underline">
          Back to Topics
        </Link>
      </div>
    )

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link
        to="/topics"
        className="text-sm text-primary-600 hover:text-primary-800 hover:underline focus:outline-2 focus:outline-primary-600 rounded mb-6 inline-block"
      >
        Back to Topics
      </Link>

      <article>
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-3">{topic.title}</h1>
          <div className="flex flex-wrap gap-2">
            {topic.country.map((c) => (
              <span
                key={c}
                className="bg-neutral-100 text-neutral-600 text-xs px-2 py-0.5 rounded-full"
              >
                {c}
              </span>
            ))}
          </div>
        </header>

        {/* Prerequisites */}
        {topic.prerequisites?.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-semibold text-yellow-800 mb-2">Read these first:</p>
            <ul className="list-disc list-inside space-y-1">
              {topic.prerequisites.map((slug) => (
                <li key={slug}>
                  <Link
                    to={`/topics/${slug}`}
                    className="text-primary-600 hover:underline text-sm focus:outline-2 focus:outline-primary-600 rounded capitalize"
                  >
                    {slug.replace(/-/g, ' ')}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Markdown content */}
        <div className="prose prose-neutral prose-sm sm:prose max-w-none mb-10">
          <ReactMarkdown>{topic.content}</ReactMarkdown>
        </div>

        {/* Take Quiz CTA */}
        <div className="border-t border-neutral-200 pt-8">
          {user ? (
            <Link
              to={`/quiz/${slug}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 focus:outline-2 focus:outline-primary-600 transition-colors"
            >
              Take the Quiz
            </Link>
          ) : (
            <div>
              <p className="text-sm text-neutral-500 mb-3">
                Sign in to take the quiz and track your progress.
              </p>
              <Link
                to="/login"
                state={{ from: { pathname: `/quiz/${slug}` } }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 focus:outline-2 focus:outline-primary-600 transition-colors"
              >
                Sign In to Take Quiz
              </Link>
            </div>
          )}
        </div>
      </article>
    </div>
  )
}
