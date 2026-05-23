import { afterAll, describe, expect, it } from 'vitest'
import { disconnectPrisma } from '../../src/lib/prisma.js'
import { buildSeedEmployees, seedEmployees } from '../../src/scripts/seed.js'

describe('seed script', () => {
  afterAll(async () => {
    await disconnectPrisma()
  })

  it('builds employees using first and last name files', () => {
    const employees = buildSeedEmployees(5)

    expect(employees).toHaveLength(5)
    expect(employees[0]?.fullName.split(' ').length).toBeGreaterThanOrEqual(2)
    expect(employees[0]?.email).toContain('@company.com')
  })

  it('seeds 100 employees in under 5 seconds', async () => {
    const startedAt = performance.now()
    const count = await seedEmployees(100)
    const elapsedMs = performance.now() - startedAt

    expect(count).toBe(100)
    expect(elapsedMs).toBeLessThan(5000)
  })
})
