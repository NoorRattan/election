import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { formatDate, getRelativeDays } from '../../utils/dateFormatter';
import { addEventToCalendar } from '../../services/calendarService';

export default function TimelineEvent({ event, isPast, borderColor = 'border-neutral-300', country = 'UK' }) {
  const relativeDays = getRelativeDays(event.date);

  return (
    <li
      className={[
        'bg-white rounded-lg border-l-4 shadow-sm p-5 transition-opacity',
        borderColor,
        isPast ? 'opacity-60' : '',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Date and relative label */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
              {formatDate(event.date, country)}
            </span>
            {isPast ? (
              <Badge variant="neutral">Past</Badge>
            ) : (
              <span className="text-xs text-primary-600 font-medium">{relativeDays}</span>
            )}
            <Badge variant="info">{event.type.replace('_', ' ')}</Badge>
            <Badge variant="neutral">{event.level}</Badge>
          </div>

          {/* Event name and description */}
          <h3 className="font-semibold text-neutral-900 text-base mb-1">{event.name}</h3>
          <p className="text-sm text-neutral-600 mb-3">{event.description}</p>

          {/* Official source link */}
          <a
            href={event.official_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary-600 hover:text-primary-800 hover:underline focus:outline-2 focus:outline-primary-600 rounded"
          >
            Official source ↗
          </a>
        </div>

        {/* Add to Calendar — upcoming events only */}
        {!isPast && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => addEventToCalendar(event)}
            ariaLabel={`Add ${event.name} to Google Calendar`}
          >
            📅 Add to Calendar
          </Button>
        )}
      </div>
    </li>
  );
}
