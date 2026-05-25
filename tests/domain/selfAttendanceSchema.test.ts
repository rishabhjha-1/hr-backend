import { describe, expect, it } from 'vitest'
import { deriveStatusFromCheckIn } from '../../src/domain/selfAttendanceSchema.js'

describe('deriveStatusFromCheckIn', () => {
  it('marks remote work separately', () => {
    expect(deriveStatusFromCheckIn(new Date('2026-05-20T08:00:00'), 'remote')).toBe('REMOTE')
  })

  it('marks late check-ins after 9:15', () => {
    expect(deriveStatusFromCheckIn(new Date('2026-05-20T09:20:00'), 'office')).toBe('LATE')
  })

  it('marks on-time office check-ins as present', () => {
    expect(deriveStatusFromCheckIn(new Date('2026-05-20T08:45:00'), 'office')).toBe('PRESENT')
  })
})
