import { describe, expect, it } from 'vitest'
import { parseAttendanceInput } from '../../src/domain/attendanceSchema.js'

describe('attendanceSchema', () => {
  const validRecord = {
    employeeId: '550e8400-e29b-41d4-a716-446655440000',
    date: '2026-05-20',
    status: 'PRESENT',
    checkIn: '2026-05-20T09:00:00.000Z',
    checkOut: '2026-05-20T18:00:00.000Z',
    notes: 'On time',
  }

  it('accepts a valid attendance payload', () => {
    const result = parseAttendanceInput(validRecord)
    expect(result.success).toBe(true)
  })

  it('rejects check-out without check-in', () => {
    const result = parseAttendanceInput({
      ...validRecord,
      checkIn: undefined,
      checkOut: '2026-05-20T18:00:00.000Z',
    })
    expect(result.success).toBe(false)
  })

  it('rejects check-out before check-in', () => {
    const result = parseAttendanceInput({
      ...validRecord,
      checkIn: '2026-05-20T18:00:00.000Z',
      checkOut: '2026-05-20T09:00:00.000Z',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid status', () => {
    const result = parseAttendanceInput({ ...validRecord, status: 'VACATION' })
    expect(result.success).toBe(false)
  })
})
