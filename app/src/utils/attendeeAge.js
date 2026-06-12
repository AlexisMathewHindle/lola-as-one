const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const padDatePart = (value) => String(value).padStart(2, '0')

const getDateParts = (value) => {
  if (typeof value !== 'string' || !DATE_ONLY_PATTERN.test(value)) {
    return null
  }

  const [year, month, day] = value.split('-').map(Number)

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null
  }

  const parsed = new Date(Date.UTC(year, month - 1, day))

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null
  }

  return { year, month, day }
}

export const getTodayDateString = () => {
  const today = new Date()
  return [
    today.getFullYear(),
    padDatePart(today.getMonth() + 1),
    padDatePart(today.getDate())
  ].join('-')
}

export const isValidDateOnly = (value) => Boolean(getDateParts(value))

export const compareDateOnly = (left, right) => {
  const leftParts = getDateParts(left)
  const rightParts = getDateParts(right)

  if (!leftParts || !rightParts) {
    return null
  }

  if (leftParts.year !== rightParts.year) {
    return leftParts.year - rightParts.year
  }

  if (leftParts.month !== rightParts.month) {
    return leftParts.month - rightParts.month
  }

  return leftParts.day - rightParts.day
}

export const calculateAgeOnDate = (dateOfBirth, referenceDate = getTodayDateString()) => {
  const birth = getDateParts(dateOfBirth)
  const reference = getDateParts(referenceDate)

  if (!birth || !reference) {
    return null
  }

  let age = reference.year - birth.year

  if (
    reference.month < birth.month ||
    (reference.month === birth.month && reference.day < birth.day)
  ) {
    age -= 1
  }

  return age >= 0 ? age : null
}

export const formatAttendeeAge = (dateOfBirth, referenceDate) => {
  const age = calculateAgeOnDate(dateOfBirth, referenceDate)

  if (age === null) {
    return 'N/A'
  }

  return `${age} ${age === 1 ? 'year old' : 'years old'}`
}

export const formatDateOnlyForDisplay = (value) => {
  const parts = getDateParts(value)

  if (!parts) {
    return 'N/A'
  }

  return `${padDatePart(parts.day)}/${padDatePart(parts.month)}/${parts.year}`
}
