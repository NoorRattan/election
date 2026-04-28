/**
 * Country selection grid. Implements roving tabindex pattern for accessibility.
 * Container: role="radiogroup". Each card: role="radio", aria-checked.
 * Arrow keys navigate between cards; Enter/Space selects.
 */

import { useRef } from 'react';
import { COUNTRY_CONFIG, COUNTRY_CODES } from '../utils/countryConfig';
import { useCountry } from '../contexts/CountryContext';

export default function CountrySelector({ onSelect }) {
  const { country, setCountry } = useCountry();
  const cardRefs = useRef([]);

  function handleSelect(code) {
    setCountry(code);
    if (onSelect) onSelect(code);
  }

  function handleKeyDown(e, index) {
    let next = index;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault(); next = (index + 1) % COUNTRY_CODES.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault(); next = (index - 1 + COUNTRY_CODES.length) % COUNTRY_CODES.length;
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); handleSelect(COUNTRY_CODES[index]);
    }
    if (next !== index) cardRefs.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label="Select your country"
      className="grid grid-cols-1 sm:grid-cols-3 gap-4"
    >
      {COUNTRY_CODES.map((code, i) => {
        const cfg       = COUNTRY_CONFIG[code];
        const isSelected = country === code;
        return (
          <div
            key={code}
            ref={(el) => (cardRefs.current[i] = el)}
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected || (!country && i === 0) ? 0 : -1}
            onClick={() => handleSelect(code)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={[
              'rounded-xl border-2 p-6 cursor-pointer transition-all duration-150',
              'focus:outline-2 focus:outline-offset-2 focus:outline-primary-600',
              isSelected
                ? 'border-primary-600 bg-primary-50 shadow-md'
                : 'border-neutral-200 bg-white hover:border-primary-300 hover:shadow-sm',
            ].join(' ')}
          >
            <div className="text-4xl mb-3" aria-hidden="true">{cfg.flag}</div>
            <h3 className="font-semibold text-neutral-900 text-lg mb-1">{cfg.name}</h3>
            <p className="text-sm text-neutral-500">Voting age {cfg.officialVotingAge}+</p>
            {isSelected && (
              <div className="mt-3 text-xs font-medium text-primary-700 flex items-center gap-1">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                Selected
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
