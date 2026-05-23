import { describe, expect, it } from 'vitest'
import {
  computeAverageSalary,
  computeSalaryStats,
  groupSalariesByKey,
} from '../../src/domain/salaryInsights.js'

describe('salaryInsights', () => {
  it('computes min, max, and average salary', () => {
    const stats = computeSalaryStats([50000, 100000, 75000])
    expect(stats).toEqual({
      min: 50000,
      max: 100000,
      average: 75000,
      count: 3,
    })
  })

  it('returns zeros for empty salary lists', () => {
    expect(computeSalaryStats([])).toEqual({
      min: 0,
      max: 0,
      average: 0,
      count: 0,
    })
  })

  it('computes average salary for a role', () => {
    expect(computeAverageSalary([80000, 90000])).toBe(85000)
  })

  it('groups salaries by key', () => {
    const grouped = groupSalariesByKey([
      { key: 'USA', salary: 100000 },
      { key: 'USA', salary: 120000 },
      { key: 'India', salary: 900000 },
    ])

    expect(grouped.get('USA')).toEqual([100000, 120000])
    expect(grouped.get('India')).toEqual([900000])
  })
})
