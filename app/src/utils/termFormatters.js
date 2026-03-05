/**
 * Term Formatting Utilities
 * 
 * Utilities for formatting, parsing, and validating term-related data
 * for the half-term distinction system.
 */

/**
 * Parse legacy term string to extract season and half
 * @param {string} termString - e.g., "autumn_first_half_term"
 * @returns {Object} { season, half, year }
 */
export function parseLegacyTerm(termString) {
  if (!termString) return { season: null, half: null, year: null };
  
  // Pattern: {season}_{half}_half_term
  const halfTermMatch = termString.match(/^(\w+)_(first|second)_half_term$/);
  if (halfTermMatch) {
    return {
      season: halfTermMatch[1],
      half: halfTermMatch[2],
      year: null
    };
  }
  
  // Pattern: {season}_term (full term)
  const fullTermMatch = termString.match(/^(\w+)_term$/);
  if (fullTermMatch) {
    return {
      season: fullTermMatch[1],
      half: 'full',
      year: null
    };
  }
  
  return { season: null, half: null, year: null };
}

/**
 * Generate legacy term string from season and half
 * @param {string} season - e.g., "autumn"
 * @param {string} half - "first", "second", or "full"
 * @returns {string|null} Legacy term string
 */
export function generateLegacyTerm(season, half) {
  if (!season || !half) return null;
  if (half === 'full') return `${season}_term`;
  return `${season}_${half}_half_term`;
}

/**
 * Format term label for display
 * @param {Object} offering - Offering object with term data
 * @returns {string} Formatted label (e.g., "Autumn - First Half 2025")
 */
export function formatTermLabel(offering) {
  const season = offering.term_season;
  const half = offering.term_half;
  const year = offering.term_year;
  
  // If no season, it's a single event
  if (!season) return 'Single Event';
  
  // Capitalize season
  const seasonLabel = season.charAt(0).toUpperCase() + season.slice(1);
  
  // Format half
  const halfLabels = {
    first: 'First Half',
    second: 'Second Half',
    full: 'Full Term'
  };
  const halfLabel = half ? halfLabels[half] : '';
  
  // Add year if available
  const yearLabel = year ? ` ${year}` : '';
  
  return `${seasonLabel} - ${halfLabel}${yearLabel}`.trim();
}

/**
 * Format short term label (e.g., "Autumn 1st")
 * @param {Object} offering - Offering object with term data
 * @returns {string} Short label
 */
export function formatShortTermLabel(offering) {
  const season = offering.term_season;
  const half = offering.term_half;
  
  if (!season) return 'Single';
  
  const seasonLabel = season.charAt(0).toUpperCase() + season.slice(1);
  const halfLabels = {
    first: '1st',
    second: '2nd',
    full: 'Full'
  };
  const halfLabel = half ? halfLabels[half] : '';
  
  return `${seasonLabel} ${halfLabel}`.trim();
}

/**
 * Get expected event_id prefix for season and half
 * @param {string} season - e.g., "autumn"
 * @param {string} half - "first" or "second"
 * @returns {string|null} Event ID prefix (e.g., "aw01_")
 */
export function getEventIdPrefix(season, half) {
  if (!season || !half) return null;
  
  const seasonCodes = {
    autumn: 'aw',
    spring: 'sp',
    summer: 'su'
  };
  
  const halfCodes = {
    first: '01',
    second: '02',
    full: '01'
  };
  
  const seasonCode = seasonCodes[season];
  const halfCode = halfCodes[half];
  
  if (!seasonCode || !halfCode) return null;
  
  return `${seasonCode}${halfCode}_`;
}

/**
 * Validate event_id matches expected pattern for season/half
 * @param {string} eventId - e.g., "aw01_lo_tues"
 * @param {string} season - e.g., "autumn"
 * @param {string} half - "first" or "second"
 * @returns {boolean} true if valid or unable to validate
 */
export function validateEventId(eventId, season, half) {
  if (!eventId || !season || !half) return true; // Skip validation if missing data
  
  const expectedPrefix = getEventIdPrefix(season, half);
  if (!expectedPrefix) return true; // Unknown pattern, skip validation
  
  return eventId.startsWith(expectedPrefix);
}

/**
 * Get term data from offering (prioritizes new columns, falls back to metadata)
 * @param {Object} offering - Offering object
 * @returns {Object} TermData object
 */
export function getTermData(offering) {
  // Try new columns first
  if (offering.term_season && offering.term_half) {
    return {
      season: offering.term_season,
      half: offering.term_half,
      year: offering.term_year || null
    };
  }
  
  // Fall back to parsing metadata.term
  const parsed = parseLegacyTerm(offering.metadata?.term);
  return {
    ...parsed,
    year: offering.term_year || parsed.year
  };
}

