import { describe, expect, it } from 'vitest'
import { computeAttendanceSummary } from '../../src/domain/attendanceSummary.js'

describe('computeAttendanceSummary', () => {
  it('returns zeroed summary for empty input', () => {
    const summary = computeAttendanceSummary([])
    expect(summary.totalRecords).toBe(0)
    expect(summary.attendanceRate).toBe(0)
  })

  it('counts present, late, and remote toward attendance rate', () => {
    const summary = computeAttendanceSummary([
      { status: 'PRESENT', count: 40 },
      { status: 'LATE', count: 5 },
      { status: 'REMOTE', count: 5 },
      { status: 'ABSENT', count: 10 },
      { status: 'ON_LEAVE', count: 5 },
    ])

    expect(summary.presentCount).toBe(50)
    expect(summary.absentCount).toBe(10)
    expect(summary.attendanceRate).toBe(83.33)
  })
})
