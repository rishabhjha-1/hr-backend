import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../../src/app.js'
import { disconnectPrisma, prisma } from '../../src/lib/prisma.js'

const app = createApp()

const employeePayload = {
  fullName: 'Jane Payroll',
  jobTitle: 'Engineer',
  country: 'USA',
  salary: 96_000,
  department: 'Engineering',
  email: 'jane.payroll@company.com',
  hireDate: '2020-01-15',
}

describe('Payroll API', () => {
  let employeeId = ''

  beforeEach(async () => {
    await prisma.attendanceRecord.deleteMany()
    await prisma.employee.deleteMany()

    const created = await request(app).post('/api/employees').send(employeePayload)
    employeeId = created.body.id

    await request(app).post('/api/attendance').send({
      employeeId,
      date: '2026-05-18',
      status: 'PRESENT',
    })
    await request(app).post('/api/attendance').send({
      employeeId,
      date: '2026-05-19',
      status: 'ABSENT',
    })
  })

  afterAll(async () => {
    await disconnectPrisma()
  })

  it('lists payroll derived from attendance', async () => {
    const response = await request(app).get(
      '/api/payroll?from=2026-05-18&to=2026-05-19&search=Jane Payroll',
    )

    expect(response.status).toBe(200)
    expect(response.body.data).toHaveLength(1)
    expect(response.body.data[0].paidDays).toBe(1)
    expect(response.body.data[0].unpaidDays).toBe(1)
    expect(response.body.data[0].netPay).toBeGreaterThan(0)
  })

  it('returns payroll summary for a period', async () => {
    const response = await request(app).get('/api/payroll/summary?from=2026-05-18&to=2026-05-19')

    expect(response.status).toBe(200)
    expect(response.body.employeeCount).toBe(1)
    expect(response.body.totalNetPay).toBeGreaterThan(0)
  })
})
