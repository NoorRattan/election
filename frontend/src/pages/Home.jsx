import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import CountrySelector from '../components/CountrySelector';
import TimelineEvent from '../components/timeline/TimelineEvent';
import { useCountry } from '../contexts/CountryContext';
import { useTimeline } from '../hooks/useTimeline';
import { isPastDate } from '../utils/dateFormatter';
import { COUNTRY_CONFIG } from '../utils/countryConfig';

function SkeletonCard() {
  return <div className="bg-white rounded-lg border border-neutral-200 p-5 h-28 animate-pulse bg-neutral-100" />;
}

export default function Home() {
  const { country } = useCountry();
  const { events, loading } = useTimeline({ country });

  useEffect(() => { document.title = 'Electra — Election Education Assistant'; }, []);

  const upcoming = events.filter((e) => !isPastDate(e.date)).slice(0, 3);
  const countryName = country ? COUNTRY_CONFIG[country]?.name : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

      {/* Hero */}
      <section className="text-center space-y-5">
        <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900">
          Learn How Elections Work
        </h1>
        <p className="text-xl text-neutral-500 max-w-2xl mx-auto">
          Understand voter registration, eligibility, ballots, and timelines for
          the UK, USA, and India — all in one place.
        </p>
        {country ? (
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/topics" className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 focus:outline-2 focus:outline-primary-600 transition-colors">
              Explore Topics
            </Link>
            <Link to="/timeline" className="px-6 py-3 border border-primary-600 text-primary-700 font-semibold rounded-xl hover:bg-primary-50 focus:outline-2 focus:outline-primary-600 transition-colors">
              View Timeline
            </Link>
          </div>
        ) : (
          <p className="text-primary-700 font-medium">Select your country below to get started.</p>
        )}
      </section>

      {/* Country Selector */}
      {!country && (
        <section aria-labelledby="country-heading">
          <h2 id="country-heading" className="text-2xl font-bold text-neutral-900 mb-6 text-center">Choose Your Country</h2>
          <CountrySelector />
        </section>
      )}

      {/* How It Works */}
      <section aria-labelledby="how-heading">
        <h2 id="how-heading" className="text-2xl font-bold text-neutral-900 mb-8 text-center">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { step: '1', icon: '🌍', title: 'Choose Country', desc: 'Select the UK, USA, or India to see content relevant to your elections.' },
            { step: '2', icon: '📚', title: 'Explore Topics', desc: 'Read clear explanations of registration, eligibility, ballots, and more.' },
            { step: '3', icon: '🧠', title: 'Take Quizzes', desc: 'Test your knowledge and track your progress as you learn.' },
          ].map(({ step, icon, title, desc }) => (
            <div key={step} className="bg-white rounded-xl border border-neutral-200 p-6 text-center shadow-sm">
              <div className="text-4xl mb-3" aria-hidden="true">{icon}</div>
              <h3 className="font-semibold text-neutral-900 mb-2">{title}</h3>
              <p className="text-sm text-neutral-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming Deadlines */}
      {country && (
        <section aria-labelledby="deadlines-heading">
          <h2 id="deadlines-heading" className="text-2xl font-bold text-neutral-900 mb-6">
            Upcoming Election Dates {countryName ? `— ${countryName}` : ''}
          </h2>
          {loading ? (
            <div className="space-y-4">{[1,2,3].map((i) => <SkeletonCard key={i} />)}</div>
          ) : upcoming.length > 0 ? (
            <ul className="space-y-4">
              {upcoming.map((event) => (
                <TimelineEvent key={event.id} event={event} isPast={false} country={country} />
              ))}
            </ul>
          ) : (
            <p className="text-neutral-500 text-center py-8">No upcoming events found. <Link to="/timeline" className="text-primary-600 hover:underline">View full timeline</Link></p>
          )}
          <div className="mt-6 text-center">
            <Link to="/timeline" className="text-primary-600 hover:text-primary-800 hover:underline text-sm font-medium focus:outline-2 focus:outline-primary-600 rounded">
              View full election timeline →
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
