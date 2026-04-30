/**
 * Static configuration for supported countries.
 * Used by CountrySelector, PollingMap, and other components.
 *
 * @typedef {object} CountryConfig
 * @property {string} name - Display name.
 * @property {string} flag - Decorative flag emoji for visual scanning.
 * @property {number} officialVotingAge - Minimum voting age for the default election type.
 * @property {string} idRequired - Short voter ID summary.
 * @property {string} registrationUrl - Official registration URL.
 * @property {string} officialSource - Canonical electoral authority URL.
 * @property {string} pollingStationFinderUrl - Official polling station lookup URL.
 */

/** @type {Record<'UK' | 'US' | 'IN', CountryConfig>} */
export const COUNTRY_CONFIG = {
  UK: {
    name: 'United Kingdom',
    flag: '🇬🇧',
    officialVotingAge: 18,
    idRequired: 'Photo ID required in England (Voter Authority Certificate available free)',
    registrationUrl: 'https://www.gov.uk/register-to-vote',
    officialSource: 'https://www.electoralcommission.org.uk',
    pollingStationFinderUrl: 'https://www.gov.uk/find-polling-station',
  },
  US: {
    name: 'United States',
    flag: '🇺🇸',
    officialVotingAge: 18,
    idRequired: 'Voter ID rules vary by state - check your state requirements',
    registrationUrl: 'https://www.usa.gov/voter-registration',
    officialSource: 'https://www.usa.gov',
    pollingStationFinderUrl: 'https://www.usa.gov/find-a-polling-place',
  },
  IN: {
    name: 'India',
    flag: '🇮🇳',
    officialVotingAge: 18,
    idRequired: 'EPIC card (or 1 of 12 accepted alternatives)',
    registrationUrl: 'https://voterportal.eci.gov.in',
    officialSource: 'https://eci.gov.in',
    pollingStationFinderUrl: 'https://eci.gov.in/voter-corner/',
  },
}

export const COUNTRY_CODES = Object.keys(COUNTRY_CONFIG)
