/**
 * Single quiz question card. Uses native <fieldset>/<input type="radio"> for
 * full keyboard accessibility - arrow keys between options work natively.
 */

import PropTypes from 'prop-types'

export default function QuizCard({
  question,
  selectedIndex,
  onSelect,
  questionNumber,
  totalQuestions,
}) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
      <fieldset>
        <legend className="font-semibold text-neutral-900 text-base mb-1 w-full">
          <span className="sr-only">
            Question {questionNumber} of {totalQuestions}:{' '}
          </span>
          {question.question}
        </legend>
        <p className="text-xs text-neutral-400 mb-5">
          Question {questionNumber} of {totalQuestions}
        </p>

        <div className="space-y-3">
          {question.options.map((option, i) => {
            const isSelected = selectedIndex === i
            return (
              <label
                key={i}
                className={[
                  'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer',
                  'transition-colors duration-100',
                  'hover:border-primary-300 hover:bg-primary-50',
                  'focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary-600',
                  isSelected ? 'border-primary-600 bg-primary-50' : 'border-neutral-200 bg-white',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name={`quiz-question-${question.id}`}
                  value={i}
                  checked={isSelected}
                  onChange={() => onSelect(i)}
                  className="h-4 w-4 text-primary-600 border-neutral-300 focus:ring-primary-500"
                />
                <span
                  className={`text-sm ${isSelected ? 'text-primary-800 font-medium' : 'text-neutral-700'}`}
                >
                  {option}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>
    </div>
  )
}

QuizCard.propTypes = {
  question: PropTypes.shape({
    id: PropTypes.string.isRequired,
    question: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  selectedIndex: PropTypes.number,
  onSelect: PropTypes.func.isRequired,
  questionNumber: PropTypes.number.isRequired,
  totalQuestions: PropTypes.number.isRequired,
}
