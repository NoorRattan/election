import { useState, useCallback } from 'react'
import { quizApi } from '../services/api'

/**
 * Quiz state machine hook.
 * Status flow: idle -> loading -> active -> submitting -> results.
 * Any asynchronous step can transition to error.
 *
 * @returns {{
 *   status: string,
 *   questions: Array<object>,
 *   currentIndex: number,
 *   selectedAnswers: Map<string, number>,
 *   results: object | null,
 *   errorMessage: string | null,
 *   loadQuiz: (topicId: string) => Promise<void>,
 *   selectAnswer: (questionId: string, selectedIndex: number) => void,
 *   nextQuestion: () => void,
 *   submitQuiz: (topicId: string) => Promise<void>
 * }} Quiz state and actions.
 */
export function useQuiz() {
  const [status, setStatus] = useState('idle')
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState(new Map())
  const [results, setResults] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)

  const loadQuiz = useCallback(async (topicId) => {
    setStatus('loading')
    setCurrentIndex(0)
    setSelectedAnswers(new Map())
    setResults(null)
    setErrorMessage(null)
    try {
      const data = await quizApi.getQuestions(topicId)
      setQuestions(data.questions || [])
      setStatus('active')
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load quiz questions.')
      setStatus('error')
    }
  }, [])

  const selectAnswer = useCallback((questionId, selectedIndex) => {
    setSelectedAnswers((prev) => new Map(prev).set(questionId, selectedIndex))
  }, [])

  const nextQuestion = useCallback(() => {
    setCurrentIndex((i) => i + 1)
  }, [])

  const submitQuiz = useCallback(
    async (topicId) => {
      setStatus('submitting')
      const answers = Array.from(selectedAnswers.entries()).map(
        ([question_id, selected_index]) => ({ question_id, selected_index })
      )
      try {
        const data = await quizApi.submitAnswers(topicId, answers)
        setResults(data)
        setStatus('results')
      } catch (err) {
        setErrorMessage(err.message || 'Failed to submit quiz.')
        setStatus('error')
      }
    },
    [selectedAnswers]
  )

  return {
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
  }
}
