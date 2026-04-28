/**
 * Step indicator showing quiz progress.
 * role="status" announces progress changes to screen readers.
 */

export default function QuizProgress({ currentIndex, total }) {
  return (
    <div
      role="status"
      aria-label={`Quiz progress: question ${currentIndex + 1} of ${total}`}
      className="flex items-center justify-center gap-2 flex-wrap"
    >
      {Array.from({ length: total }, (_, i) => {
        const isDone    = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div
            key={i}
            aria-hidden="true"
            className={[
              'flex items-center justify-center rounded-full text-xs font-semibold transition-colors duration-200',
              isCurrent ? 'h-8 w-8 bg-primary-600 text-white' :
              isDone    ? 'h-7 w-7 bg-success-500 text-white' :
                          'h-7 w-7 bg-neutral-200 text-neutral-500',
            ].join(' ')}
          >
            {isDone ? '✓' : i + 1}
          </div>
        );
      })}
    </div>
  );
}
