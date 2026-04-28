/**
 * Quiz result summary with per-question breakdown and explanations.
 * Announces score to screen readers on mount.
 */

import { useEffect } from 'react';
import Button from '../ui/Button';
import { announceToScreenReader } from '../../utils/accessibility';

export default function QuizResult({ score, total, correct, results, onRetry, onNextTopic }) {
  useEffect(() => {
    announceToScreenReader(`Quiz complete. You scored ${score}% — ${correct} out of ${total} correct.`);
  }, [score, total, correct]);

  const scoreColor =
    score >= 80 ? 'text-success-600' :
    score >= 50 ? 'text-yellow-600' :
                  'text-error-600';

  const scoreLabel =
    score >= 80 ? 'Excellent!' :
    score >= 50 ? 'Good effort' :
                  'Keep practising';

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-8 shadow-sm max-w-2xl mx-auto">
      {/* Score display */}
      <div className="text-center mb-8">
        <div className={`text-6xl font-bold ${scoreColor}`} aria-label={`${score} percent`}>
          {score}%
        </div>
        <div className={`text-lg font-semibold mt-1 ${scoreColor}`}>{scoreLabel}</div>
        <p className="text-neutral-500 mt-2">{correct} out of {total} correct</p>
      </div>

      {/* Per-question breakdown */}
      <ul className="space-y-4 mb-8">
        {results.map((r, i) => (
          <li
            key={r.question_id}
            className={[
              'p-4 rounded-lg border',
              r.correct ? 'border-success-200 bg-success-50' : 'border-error-200 bg-error-50',
            ].join(' ')}
          >
            <div className="flex items-start gap-3">
              <span className={`text-lg mt-0.5 ${r.correct ? 'text-success-600' : 'text-error-600'}`} aria-hidden="true">
                {r.correct ? '✓' : '✗'}
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1 text-neutral-500">
                  Question {i + 1} — {r.correct ? 'Correct' : 'Incorrect'}
                </p>
                <p className="text-sm text-neutral-700">{r.explanation}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="secondary" onClick={onRetry} className="flex-1">Try Again</Button>
        <Button variant="primary"   onClick={onNextTopic} className="flex-1">Continue Learning</Button>
      </div>
    </div>
  );
}
