const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function formatAgeRange(ageRange) {
  if (!ageRange) return null

  const min = toNumber(ageRange.min)
  const max = toNumber(ageRange.max)

  if (min !== null && max !== null) {
    return `${min}-${max}`
  }

  if (min !== null) {
    return `${min}+`
  }

  if (max !== null) {
    return `Up to ${max}`
  }

  return null
}

export function getWorkshopAgeLabel(workshop) {
  const categoryAge = formatAgeRange(workshop?.category?.age_range)
  if (categoryAge) return categoryAge

  const metadataAgeGroup = workshop?.offering?.metadata?.age_group
  if (typeof metadataAgeGroup === 'string' && metadataAgeGroup.trim()) {
    return metadataAgeGroup.trim()
  }

  const title = workshop?.offering?.title || ''

  if (title.toLowerCase().includes('all ages')) {
    return 'All ages'
  }

  const match = title.match(/\(ages? ([\d-+]+)\)/i)
  return match ? match[1] : null
}

export function getWorkshopLayoutKey(workshop) {
  const categoryLayout = workshop?.category?.layout_key
  if (typeof categoryLayout === 'string' && categoryLayout.trim()) {
    return categoryLayout
  }

  if (workshop?.offering?.term_season && workshop?.offering?.term_half) {
    return 'term_series'
  }

  return 'standard'
}

export function getWorkshopLayoutLabel(workshop) {
  const labels = {
    standard: 'Single Event',
    term_series: 'Term Workshop',
    adult_workshop: 'Adult Workshop'
  }

  return labels[getWorkshopLayoutKey(workshop)] || 'Workshop'
}

export function isAdultWorkshopLayout(workshop) {
  return getWorkshopLayoutKey(workshop) === 'adult_workshop'
}
