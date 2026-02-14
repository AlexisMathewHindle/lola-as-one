/**
 * Tests for Cycle Helper Functions
 * 
 * Run with: deno test supabase/functions/_shared/cycle-helpers.test.ts
 */

import { assertEquals, assertThrows } from 'https://deno.land/std@0.168.0/testing/asserts.ts'
import {
  getNextCycleKey,
  getCurrentCycleKey,
  parseCycleKey,
  formatCycleKey,
  getNextCycles,
} from './cycle-helpers.ts'

// ============================================================================
// getNextCycleKey Tests
// ============================================================================

Deno.test('getNextCycleKey: payment before cutoff returns current month', () => {
  const result = getNextCycleKey(new Date('2026-02-15'), 20)
  assertEquals(result, '2026-02')
})

Deno.test('getNextCycleKey: payment on cutoff day returns current month', () => {
  const result = getNextCycleKey(new Date('2026-02-20'), 20)
  assertEquals(result, '2026-02')
})

Deno.test('getNextCycleKey: payment after cutoff returns next month', () => {
  const result = getNextCycleKey(new Date('2026-02-25'), 20)
  assertEquals(result, '2026-03')
})

Deno.test('getNextCycleKey: handles year rollover (Dec to Jan)', () => {
  const result = getNextCycleKey(new Date('2026-12-25'), 20)
  assertEquals(result, '2027-01')
})

Deno.test('getNextCycleKey: handles December before cutoff', () => {
  const result = getNextCycleKey(new Date('2026-12-15'), 20)
  assertEquals(result, '2026-12')
})

Deno.test('getNextCycleKey: handles January after cutoff', () => {
  const result = getNextCycleKey(new Date('2026-01-25'), 20)
  assertEquals(result, '2026-02')
})

Deno.test('getNextCycleKey: handles single-digit months with padding', () => {
  const result = getNextCycleKey(new Date('2026-03-15'), 20)
  assertEquals(result, '2026-03')
})

Deno.test('getNextCycleKey: handles early cutoff day (5th)', () => {
  const result = getNextCycleKey(new Date('2026-02-10'), 5)
  assertEquals(result, '2026-03')
})

Deno.test('getNextCycleKey: handles late cutoff day (28th)', () => {
  const result = getNextCycleKey(new Date('2026-02-27'), 28)
  assertEquals(result, '2026-02')
})

Deno.test('getNextCycleKey: throws error for invalid date', () => {
  assertThrows(
    () => getNextCycleKey(new Date('invalid'), 20),
    Error,
    'Invalid billing date'
  )
})

Deno.test('getNextCycleKey: throws error for cutoff day < 1', () => {
  assertThrows(
    () => getNextCycleKey(new Date('2026-02-15'), 0),
    Error,
    'Cutoff day must be between 1 and 28'
  )
})

Deno.test('getNextCycleKey: throws error for cutoff day > 28', () => {
  assertThrows(
    () => getNextCycleKey(new Date('2026-02-15'), 29),
    Error,
    'Cutoff day must be between 1 and 28'
  )
})

// ============================================================================
// getCurrentCycleKey Tests
// ============================================================================

Deno.test('getCurrentCycleKey: returns current month in YYYY-MM format', () => {
  const result = getCurrentCycleKey()
  const now = new Date()
  const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  assertEquals(result, expected)
})

// ============================================================================
// parseCycleKey Tests
// ============================================================================

Deno.test('parseCycleKey: parses valid cycle key', () => {
  const result = parseCycleKey('2026-02')
  assertEquals(result, {
    year: 2026,
    month: 2,
    monthName: 'February'
  })
})

Deno.test('parseCycleKey: handles December', () => {
  const result = parseCycleKey('2026-12')
  assertEquals(result, {
    year: 2026,
    month: 12,
    monthName: 'December'
  })
})

Deno.test('parseCycleKey: handles January', () => {
  const result = parseCycleKey('2027-01')
  assertEquals(result, {
    year: 2027,
    month: 1,
    monthName: 'January'
  })
})

Deno.test('parseCycleKey: throws error for invalid format', () => {
  assertThrows(
    () => parseCycleKey('2026/02'),
    Error,
    'Invalid cycle key format'
  )
})

Deno.test('parseCycleKey: throws error for invalid month', () => {
  assertThrows(
    () => parseCycleKey('2026-13'),
    Error,
    'Invalid month in cycle key'
  )
})

Deno.test('parseCycleKey: throws error for month 00', () => {
  assertThrows(
    () => parseCycleKey('2026-00'),
    Error,
    'Invalid month in cycle key'
  )
})

// ============================================================================
// formatCycleKey Tests
// ============================================================================

Deno.test('formatCycleKey: formats cycle key for display', () => {
  const result = formatCycleKey('2026-02')
  assertEquals(result, 'February 2026')
})

Deno.test('formatCycleKey: handles December', () => {
  const result = formatCycleKey('2026-12')
  assertEquals(result, 'December 2026')
})

// ============================================================================
// getNextCycles Tests
// ============================================================================

Deno.test('getNextCycles: generates next 3 cycles', () => {
  const result = getNextCycles('2026-02', 3)
  assertEquals(result, ['2026-02', '2026-03', '2026-04'])
})

Deno.test('getNextCycles: handles year rollover', () => {
  const result = getNextCycles('2026-11', 3)
  assertEquals(result, ['2026-11', '2026-12', '2027-01'])
})

Deno.test('getNextCycles: handles single cycle', () => {
  const result = getNextCycles('2026-02', 1)
  assertEquals(result, ['2026-02'])
})

Deno.test('getNextCycles: handles 12 months', () => {
  const result = getNextCycles('2026-01', 12)
  assertEquals(result, [
    '2026-01', '2026-02', '2026-03', '2026-04',
    '2026-05', '2026-06', '2026-07', '2026-08',
    '2026-09', '2026-10', '2026-11', '2026-12'
  ])
})

