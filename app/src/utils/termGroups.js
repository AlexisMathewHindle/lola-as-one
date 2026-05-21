import { formatTermLabel, getTermData } from './termFormatters'

const SEASON_ORDER = {
  spring: 0,
  summer: 1,
  autumn: 2,
  winter: 3
}

const HALF_ORDER = {
  first: 0,
  second: 1,
  full: 2
}

export function toTermKeyPart(value) {
  return (
    String(value ?? 'unknown')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'unknown'
  )
}

export function extractLegacyEventSuffix(eventId) {
  if (typeof eventId !== 'string') {
    return null
  }

  const normalizedEventId = eventId.trim()
  if (!normalizedEventId) {
    return null
  }

  return normalizedEventId.replace(/^[a-z]{2}\d{2}[-_]/, '') || normalizedEventId
}

export function getTermCourseKey(event) {
  const metadata = event?.offering?.metadata || {}
  const categoryKey = toTermKeyPart(event?.category?.id || event?.category_id || 'term')
  const legacyEventSuffix = extractLegacyEventSuffix(metadata.event_id)
  const explicitSeriesKey =
    metadata.term_course_key ||
    metadata.course_key ||
    metadata.series_key ||
    metadata.event_series_id

  return [
    categoryKey,
    toTermKeyPart(legacyEventSuffix || explicitSeriesKey || 'term-series')
  ].join('__')
}

export function getTermGroupKey(event) {
  const termData = getTermData(event?.offering || {})

  if (!termData.season || !termData.half) {
    return null
  }

  return [
    getTermCourseKey(event),
    toTermKeyPart(termData.season),
    toTermKeyPart(termData.half),
    toTermKeyPart(termData.year || 'unknown')
  ].join('__')
}

export function getTermLabel(event) {
  const termData = getTermData(event?.offering || {})

  return formatTermLabel({
    term_season: termData.season,
    term_half: termData.half,
    term_year: termData.year
  })
}

export function getTermGroupTitle(event) {
  return event?.category?.name || event?.offering?.title || 'Term workshops'
}

export function compareTermSessions(firstSession, secondSession) {
  const firstTerm = getTermData(firstSession?.offering || {})
  const secondTerm = getTermData(secondSession?.offering || {})

  const firstYear = Number(firstTerm.year || 0)
  const secondYear = Number(secondTerm.year || 0)
  if (firstYear !== secondYear) {
    return firstYear - secondYear
  }

  const firstSeason = SEASON_ORDER[firstTerm.season] ?? Number.POSITIVE_INFINITY
  const secondSeason = SEASON_ORDER[secondTerm.season] ?? Number.POSITIVE_INFINITY
  if (firstSeason !== secondSeason) {
    return firstSeason - secondSeason
  }

  const firstHalf = HALF_ORDER[firstTerm.half] ?? Number.POSITIVE_INFINITY
  const secondHalf = HALF_ORDER[secondTerm.half] ?? Number.POSITIVE_INFINITY
  if (firstHalf !== secondHalf) {
    return firstHalf - secondHalf
  }

  const firstDateTime = `${firstSession?.event_date || ''}T${firstSession?.event_start_time || ''}`
  const secondDateTime = `${secondSession?.event_date || ''}T${secondSession?.event_start_time || ''}`
  return firstDateTime.localeCompare(secondDateTime)
}

export function groupTermSessions(sessions = []) {
  const groupsByKey = new Map()

  sessions.forEach((session) => {
    const key = getTermGroupKey(session) || `session__${session.id}`

    if (!groupsByKey.has(key)) {
      groupsByKey.set(key, {
        key,
        label: getTermLabel(session),
        title: getTermGroupTitle(session),
        sessions: []
      })
    }

    groupsByKey.get(key).sessions.push(session)
  })

  return Array.from(groupsByKey.values())
    .map((group) => {
      const sortedSessions = [...group.sessions].sort(compareTermSessions)
      const unitPrice = sortedSessions.reduce((total, session) => {
        const price = Number(session.price_gbp || 0)
        return Number.isFinite(price) ? total + price : total
      }, 0)

      return {
        ...group,
        sessions: sortedSessions,
        unitPrice
      }
    })
    .sort((firstGroup, secondGroup) =>
      compareTermSessions(firstGroup.sessions[0], secondGroup.sessions[0])
    )
}
