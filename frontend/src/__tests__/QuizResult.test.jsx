import { render, screen, fireEvent } from '@testing-library/react'
import QuizResult from '../components/quiz/QuizResult'

const results = [
  {
    question_id: 'q1',
    correct: true,
    correct_index: 2,
    explanation: 'The minimum voting age in the UK is 18.',
  },
  {
    question_id: 'q2',
    correct: false,
    correct_index: 1,
    explanation: 'The registration URL is gov.uk/register-to-vote.',
  },
]

describe('QuizResult', () => {
  it('renders the score', () => {
    render(
      <QuizResult
        score={50}
        total={2}
        correct={1}
        results={results}
        onRetry={() => {}}
        onNextTopic={() => {}}
      />
    )
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('renders correct count', () => {
    render(
      <QuizResult
        score={50}
        total={2}
        correct={1}
        results={results}
        onRetry={() => {}}
        onNextTopic={() => {}}
      />
    )
    expect(screen.getAllByText(/1 out of 2 correct/i)[0]).toBeInTheDocument()
  })

  it('renders explanation text for each result', () => {
    render(
      <QuizResult
        score={50}
        total={2}
        correct={1}
        results={results}
        onRetry={() => {}}
        onNextTopic={() => {}}
      />
    )
    expect(screen.getByText(/minimum voting age in the UK is 18/i)).toBeInTheDocument()
    expect(screen.getByText(/gov.uk\/register-to-vote/i)).toBeInTheDocument()
  })

  it('calls onRetry when Try Again is clicked', () => {
    const onRetry = vi.fn()
    render(
      <QuizResult
        score={50}
        total={2}
        correct={1}
        results={results}
        onRetry={onRetry}
        onNextTopic={() => {}}
      />
    )
    fireEvent.click(screen.getByText(/try again/i))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('calls onNextTopic when Continue Learning is clicked', () => {
    const onNext = vi.fn()
    render(
      <QuizResult
        score={50}
        total={2}
        correct={1}
        results={results}
        onRetry={() => {}}
        onNextTopic={onNext}
      />
    )
    fireEvent.click(screen.getByText(/continue learning/i))
    expect(onNext).toHaveBeenCalledTimes(1)
  })
})
