/**
 * Cycle Helper Functions
 * 
 * These functions calculate subscription cycle keys (YYYY-MM format) based on
 * billing dates and cutoff days. Used to determine which month a subscription
 * box should be shipped.
 * 
 * Example:
 * - Payment on Feb 15, cutoff 20 → cycle_key = "2026-02" (ship in Feb)
 * - Payment on Feb 25, cutoff 20 → cycle_key = "2026-03" (ship in Mar)
 */

/**
 * Calculate the next cycle key based on billing date and cutoff day
 * 
 * @param billingDate - The date when the subscription was billed
 * @param cutoffDay - Day of month (1-28) after which next cycle ships
 * @returns Cycle key in format "YYYY-MM" (e.g., "2026-02")
 * 
 * @example
 * // Payment before cutoff
 * getNextCycleKey(new Date('2026-02-15'), 20) // Returns "2026-02"
 * 
 * // Payment after cutoff
 * getNextCycleKey(new Date('2026-02-25'), 20) // Returns "2026-03"
 * 
 * // Year rollover
 * getNextCycleKey(new Date('2026-12-25'), 20) // Returns "2027-01"
 */
export function getNextCycleKey(billingDate: Date, cutoffDay: number): string {
  // Validate inputs
  if (!(billingDate instanceof Date) || isNaN(billingDate.getTime())) {
    throw new Error('Invalid billing date')
  }
  
  if (cutoffDay < 1 || cutoffDay > 28) {
    throw new Error('Cutoff day must be between 1 and 28')
  }
  
  const billing = new Date(billingDate)
  const year = billing.getFullYear()
  const month = billing.getMonth() + 1 // JavaScript months are 0-indexed
  const day = billing.getDate()
  
  // If billing date is after cutoff, ship next month
  if (day > cutoffDay) {
    // Handle month rollover
    if (month === 12) {
      // December → January next year
      return `${year + 1}-01`
    } else {
      // Regular month increment
      const nextMonth = month + 1
      return `${year}-${String(nextMonth).padStart(2, '0')}`
    }
  }
  
  // Billing date is on or before cutoff, ship this month
  return `${year}-${String(month).padStart(2, '0')}`
}

/**
 * Get the current cycle key (current month)
 * 
 * @returns Current cycle key in format "YYYY-MM"
 * 
 * @example
 * // If today is Feb 15, 2026
 * getCurrentCycleKey() // Returns "2026-02"
 */
export function getCurrentCycleKey(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  return `${year}-${String(month).padStart(2, '0')}`
}

/**
 * Parse a cycle key into its components
 * 
 * @param cycleKey - Cycle key in format "YYYY-MM"
 * @returns Object with year, month, and monthName
 * 
 * @example
 * parseCycleKey("2026-02")
 * // Returns: { year: 2026, month: 2, monthName: "February" }
 */
export function parseCycleKey(cycleKey: string): {
  year: number
  month: number
  monthName: string
} {
  const match = cycleKey.match(/^(\d{4})-(\d{2})$/)
  
  if (!match) {
    throw new Error(`Invalid cycle key format: ${cycleKey}. Expected YYYY-MM`)
  }
  
  const year = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)
  
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month in cycle key: ${month}. Must be 1-12`)
  }
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  
  return {
    year,
    month,
    monthName: monthNames[month - 1]
  }
}

/**
 * Format a cycle key for display
 * 
 * @param cycleKey - Cycle key in format "YYYY-MM"
 * @returns Human-readable format (e.g., "February 2026")
 * 
 * @example
 * formatCycleKey("2026-02") // Returns "February 2026"
 */
export function formatCycleKey(cycleKey: string): string {
  const { monthName, year } = parseCycleKey(cycleKey)
  return `${monthName} ${year}`
}

/**
 * Get the next N cycle keys starting from a given cycle
 * Useful for showing upcoming shipments
 * 
 * @param startCycleKey - Starting cycle key
 * @param count - Number of cycles to generate
 * @returns Array of cycle keys
 * 
 * @example
 * getNextCycles("2026-02", 3)
 * // Returns: ["2026-02", "2026-03", "2026-04"]
 */
export function getNextCycles(startCycleKey: string, count: number): string[] {
  const { year, month } = parseCycleKey(startCycleKey)
  const cycles: string[] = []
  
  let currentYear = year
  let currentMonth = month
  
  for (let i = 0; i < count; i++) {
    cycles.push(`${currentYear}-${String(currentMonth).padStart(2, '0')}`)
    
    // Increment month
    currentMonth++
    if (currentMonth > 12) {
      currentMonth = 1
      currentYear++
    }
  }
  
  return cycles
}

