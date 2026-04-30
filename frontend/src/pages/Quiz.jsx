import { useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuiz } from '../hooks/useQuiz'
import QuizProgress from '../components/quiz/QuizProgress'
import QuizCard from '../components/quiz/QuizCard'
import QuizResult from '../components/quiz/QuizResult'
import Button from '../components/ui/Button'

/**
 * Quiz page component.
 * Authenticates users, fetches questions, processes answers, and submits results.
 *
 * @returns {JSX.Element} The rendered Quiz page.
 */
export default function Quiz() {
  const { topicId } = useParams()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    status,
    questions,
    currentIndex,
    selectedAnswers,
    results,
    errorMessage,
    loadQuiz,
    selectAnswer,
    nextQuestion,
    submitQuiz,
  } = useQuiz()

  useEffect(() => {
    document.title = `Quiz | Electra`
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { state: { from: location }, replace: true })
    }
  }, [user, authLoading, navigate, location])

  useEffect(() => {
    if (user && status === 'idle') loadQuiz(topicId)
  }, [user, topicId, status, loadQuiz])

  const currentQ = questions[currentIndex]
  const isLastQ = currentIndex === questions.length - 1
  const currentAnswer = currentQ ? selectedAnswers.get(currentQ.id) : undefined

  if (authLoading || status === 'idle') {
    return (
      <div className="flex justify-center py-20" role="status" aria-label="Loading">
        <div
          className="animate-spin h-10 w-10 rounded-full border-b-2 border-primary-600"
          aria-hidden="true"
        />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {status === 'loading' && (
        <div role="status" aria-label="Loading questions" className="text-center py-16">
          <div
            className="animate-spin h-10 w-10 rounded-full border-b-2 border-primary-600 mx-auto mb-4"
            aria-hidden="true"
          />
          <p className="text-neutral-500">Loading questions...</p>
        </div>
      )}

      {status === 'active' && currentQ && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-neutral-900">Quiz</h1>
          <QuizProgress currentIndex={currentIndex} total={questions.length} />
          <QuizCard
            question={currentQ}
            selectedIndex={currentAnswer ?? null}
            onSelect={(i) => selectAnswer(currentQ.id, i)}
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
          />
          <div className="flex justify-end">
            {isLastQ ? (
              <Button
                variant="primary"
                disabled={currentAnswer === undefined}
                onClick={() => submitQuiz(topicId)}
              >
                Submit Quiz
              </Button>
            ) : (
              <Button
                variant="primary"
                disabled={currentAnswer === undefined}
                onClick={nextQuestion}
              >
                Next Question
              </Button>
            )}
          </div>
        </div>
      )}

      {status === 'submitting' && (
        <div aria-live="polite" className="text-center py-16">
          <div className="animate-spin h-10 w-10 rounded-full border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-neutral-500">Submitting your answers...</p>
        </div>
      )}

      {status === 'results' && results && (
        <QuizResult
          score={results.score}
          total={results.total}
          correct={results.correct}
          results={results.results}
          onRetry={() => loadQuiz(topicId)}
          onNextTopic={() => navigate('/topics')}
        />
      )}

      {status === 'error' && (
        <div className="text-center py-16">
          <p className="text-error-600 mb-4" role="alert">
            {errorMessage}
          </p>
          <Button variant="secondary" onClick={() => loadQuiz(topicId)}>
            Try Again
          </Button>
        </div>
      )}
    </div>
  )
}
