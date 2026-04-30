/**
 * Accessible, multi-variant Button component.
 * Variants: primary | secondary | ghost | danger
 * Sizes: sm | md | lg
 * Shows a spinner when loading=true and disables interaction.
 */

import PropTypes from 'prop-types'

const VARIANT_CLASSES = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 focus:outline-primary-600 border border-transparent',
  secondary:
    'bg-white text-primary-700 border border-primary-600 hover:bg-primary-50 focus:outline-primary-600',
  ghost:
    'bg-transparent text-neutral-700 hover:bg-neutral-100 border border-transparent focus:outline-neutral-400',
  danger:
    'bg-error-600 text-white hover:bg-error-700 focus:outline-error-600 border border-transparent',
}

const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 mr-2"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'danger']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  ariaLabel: PropTypes.string,
  className: PropTypes.string,
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  children,
  type = 'button',
  ariaLabel,
  className = '',
}) {
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      onClick={!isDisabled ? onClick : undefined}
      disabled={isDisabled}
      aria-busy={loading ? 'true' : undefined}
      aria-disabled={isDisabled ? 'true' : undefined}
      aria-label={ariaLabel}
      className={[
        'inline-flex items-center justify-center font-medium rounded-lg',
        'transition-colors duration-150',
        'focus:outline-2 focus:outline-offset-2',
        VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary,
        SIZE_CLASSES[size] || SIZE_CLASSES.md,
        isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
        className,
      ].join(' ')}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}
