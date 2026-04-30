/**
 * Accessible progress bar. Uses role="progressbar" with full ARIA attributes.
 */

import PropTypes from 'prop-types'

export default function ProgressBar({ value = 0, label, ariaLabel }) {
  const clampedValue = Math.max(0, Math.min(100, Math.round(value)))

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-neutral-700">{label}</span>
          <span className="text-sm text-neutral-500">{clampedValue}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel || label || 'Progress'}
        className="w-full bg-neutral-200 rounded-full h-2.5 overflow-hidden"
      >
        <div
          className="bg-primary-600 h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  )
}

ProgressBar.propTypes = {
  value: PropTypes.number,
  label: PropTypes.string,
  ariaLabel: PropTypes.string,
}
