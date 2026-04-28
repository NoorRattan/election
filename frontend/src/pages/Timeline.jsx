import { useEffect, useState } from 'react';
import { useCountry } from '../contexts/CountryContext';
import { useTimeline } from '../hooks/useTimeline';
import ElectionTimeline from '../components/timeline/ElectionTimeline';
import CountrySelector from '../components/CountrySelector';
import { COUNTRY_CONFIG } from '../utils/countryConfig';

const LEVELS = ['all', 'local', 'state', 'national'];

export default function Timeline() {
  const { country }          = useCountry();
  const [level, setLevel]    = useState('all');
  const [stateProvince, setStateProv] = useState('');
  const { events, loading, error } = useTimeline({
    country,
    level: level === 'all' ? null : level,
    stateProvince: stateProvince || null,
  });

  useEffect(() => { document.title = 'Election Timeline | Electra'; }, []);

  const countryName = country ? COUNTRY_CONFIG[country]?.name : '';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-neutral-900 mb-2">
        Election Timeline{countryName ? ` — ${countryName}` : ''}
      </h1>
      <p className="text-neutral-500 mb-8">Key dates and deadlines for upcoming elections.</p>

      {!country ? (
        <section aria-label="Select country to view timeline">
          <p className="text-neutral-600 mb-6">Select your country to view the election timeline.</p>
          <CountrySelector />
        </section>
      ) : (
        <>
          {/* Level filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {LEVELS.filter((l) => {
              if (l === 'state' && country === 'UK') return false;
              return true;
            }).map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={[
                  'px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors focus:outline-2 focus:outline-primary-600',
                  level === l ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200',
                ].join(' ')}
              >
                {l === 'all' ? 'All Levels' : l}
              </button>
            ))}
          </div>

          {/* State/Province input for US and IN */}
          {(country === 'US' || country === 'IN') && level === 'state' && (
            <div className="mb-6">
              <label htmlFor="state-input" className="block text-sm font-medium text-neutral-700 mb-1">
                {country === 'US' ? 'State (e.g. CA, TX)' : 'State (e.g. Punjab, Maharashtra)'}
              </label>
              <input
                id="state-input"
                type="text"
                value={stateProvince}
                onChange={(e) => setStateProv(e.target.value)}
                placeholder={country === 'US' ? 'Enter state abbreviation…' : 'Enter state name…'}
                className="w-64 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-2 focus:outline-primary-600"
              />
            </div>
          )}

          {error && <p className="text-error-600 mb-4" role="alert">{error}</p>}
          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map((i) => <div key={i} className="h-28 rounded-lg bg-neutral-200 animate-pulse"/>)}
            </div>
          ) : (
            <ElectionTimeline events={events} country={country} />
          )}
        </>
      )}
    </div>
  );
}
