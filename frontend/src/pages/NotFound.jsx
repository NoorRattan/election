import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  useEffect(() => {
    document.title = '404 Not Found | Electra'
  }, [])
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="text-8xl mb-6" aria-hidden="true">
        🗳️
      </div>
      <h1 className="text-3xl font-bold text-neutral-900 mb-3">Page Not Found</h1>
      <p className="text-neutral-500 mb-8 max-w-md">
        The page you were looking for doesn&apos;t exist. It may have been moved or the link might
        be wrong.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          to="/"
          className="px-5 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 focus:outline-2 focus:outline-primary-600 transition-colors"
        >
          Go to Home
        </Link>
        <Link
          to="/topics"
          className="px-5 py-2.5 border border-primary-600 text-primary-700 font-medium rounded-xl hover:bg-primary-50 focus:outline-2 focus:outline-primary-600 transition-colors"
        >
          Browse Topics
        </Link>
      </div>
    </div>
  )
}
