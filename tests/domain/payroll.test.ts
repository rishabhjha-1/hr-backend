import { describe, expect, it } from 'vitest'
import {
  computeEmployeePayroll,
  countDaysByStatus,
  countPaidDays,
  WORKING_DAYS_PER_MONTH,
} from '../../src/domain/payroll.js'

describe('payroll domain', () => {
  it('counts paid days from present, late, remote, and leave', () => {
    const counts = countDaysByStatus([
      { status: 'PRESENT', count: 10 },
      { status: 'LATE', count: 2 },
      { status: 'REMOTE', count: 3 },
      { status: 'ON_LEAVE', count: 1 },
      { status: 'ABSENT', count: 4 },
    ])

    expect(countPaidDays(counts)).toBe(16)
    expect(counts.total).toBe(20)
  })

  it('computes net pay from annual salary and attendance', () => {
    const counts = countDaysByStatus([
      { status: 'PRESENT', count: 18 },
      { status: 'ABSENT', count: 2 },
    ])

    const payroll = computeEmployeePayroll(120_000, counts)
    const expectedDaily = 120_000 / 12 / WORKING_DAYS_PER_MONTH

    expect(payroll.paidDays).toBe(18)
    expect(payroll.unpaidDays).toBe(2)
    expect(payroll.grossPay).toBe(Math.round(expectedDaily * 18 * 100) / 100)
    expect(payroll.deductions).toBe(Math.round(expectedDaily * 2 * 100) / 100)
    expect(payroll.netPay).toBe(payroll.grossPay)
  })

  it('returns zero pay when there is no attendance', () => {
    const payroll = computeEmployeePayroll(90_000, countDaysByStatus([]))
    expect(payroll.grossPay).toBe(0)
    expect(payroll.netPay).toBe(0)
  })
})
