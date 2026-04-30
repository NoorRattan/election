import { render, screen, fireEvent } from '@testing-library/react'
import QuizCard from '../components/quiz/QuizCard'

const question = {
  id: 'q1',
  question: 'What is the minimum voting age in the UK?',
  options: ['16', '17', '18', '21'],
  country: ['UK'],
}

describe('QuizCard', () => {
  it('renders the question text', () => {
    render(
      <QuizCard
        question={question}
        selectedIndex={null}
        onSelect={() => {}}
        questionNumber={1}
        totalQuestions={5}
      />
    )
    expect(screen.getByText(/minimum voting age/i)).toBeInTheDocument()
  })

  it('renders all 4 options as radio inputs', () => {
    render(
      <QuizCard
        question={question}
        selectedIndex={null}
        onSelect={() => {}}
        questionNumber={1}
        totalQuestions={5}
      />
    )
    expect(screen.getAllByRole('radio')).toHaveLength(4)
  })

  it('calls onSelect with correct index when option clicked', () => {
    const onSelect = vi.fn()
    render(
      <QuizCard
        question={question}
        selectedIndex={null}
        onSelect={onSelect}
        questionNumber={1}
        totalQuestions={5}
      />
    )
    fireEvent.click(screen.getByDisplayValue('2'))
    expect(onSelect).toHaveBeenCalledWith(2)
  })

  it('marks the selected option as checked', () => {
    render(
      <QuizCard
        question={question}
        selectedIndex={2}
        onSelect={() => {}}
        questionNumber={1}
        totalQuestions={5}
      />
    )
    expect(screen.getByDisplayValue('2')).toBeChecked()
  })

  it('renders a fieldset with a legend', () => {
    const { container } = render(
      <QuizCard
        question={question}
        selectedIndex={null}
        onSelect={() => {}}
        questionNumber={1}
        totalQuestions={5}
      />
    )
    expect(container.querySelector('fieldset')).toBeInTheDocument()
    expect(container.querySelector('legend')).toBeInTheDocument()
  })

  it('each radio input has an accessible label', () => {
    render(
      <QuizCard
        question={question}
        selectedIndex={null}
        onSelect={() => {}}
        questionNumber={1}
        totalQuestions={5}
      />
    )
    screen.getAllByRole('radio').forEach((input) => {
      expect(input).toHaveAccessibleName()
    })
  })
})
