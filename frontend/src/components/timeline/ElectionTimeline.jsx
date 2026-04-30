import PropTypes from 'prop-types'
import TimelineEvent from './TimelineEvent'
import { isPastDate } from '../../utils/dateFormatter'

const BORDER_COLOR = {
  deadline: 'border-yellow-400',
  poll_day: 'border-primary-500',
  result: 'border-success-500',
  nomination: 'border-accent-500',
  campaign_start: 'border-neutral-400',
}

export default function ElectionTimeline({ events = [], country }) {
  if (!events.length) {
    return (
      <p className="text-neutral-500 text-center py-12">
        No upcoming events found for this country.
      </p>
    )
  }

  return (
    <ul className="space-y-4">
      {events.map((event) => (
        <TimelineEvent
          key={event.id}
          event={event}
          isPast={isPastDate(event.date)}
          borderColor={BORDER_COLOR[event.type] || 'border-neutral-300'}
          country={country}
        />
      ))}
    </ul>
  )
}

ElectionTimeline.propTypes = {
  events: PropTypes.arrayOf(PropTypes.object),
  country: PropTypes.string,
}
