/**
 * White rounded card container.
 * If onClick is provided, the card is interactive (role="button", keyboard accessible).
 */

import PropTypes from 'prop-types'

export default function Card({ children, className = '', onClick }) {
  const isClickable = typeof onClick === 'function'

  const handleKeyDown = isClickable
    ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(e)
        }
      }
    : undefined

  return (
    <div
      className={[
        'bg-white rounded-lg shadow-sm border border-neutral-200 p-6',
        isClickable
          ? 'cursor-pointer hover:shadow-md hover:border-primary-300 transition-shadow duration-150 focus:outline-2 focus:outline-offset-2 focus:outline-primary-600'
          : '',
        className,
      ].join(' ')}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={handleKeyDown}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {children}
    </div>
  )
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  onClick: PropTypes.func,
}
