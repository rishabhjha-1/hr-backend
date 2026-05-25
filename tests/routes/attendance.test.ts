import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../../src/app.js'
import { disconnectPrisma, prisma } from '../../src/lib/prisma.js'

const app = createApp()

const employeePayload = {
  fullName: 'Jane Doe',
  jobTitle: 'HR Manager',
  country: 'USA',
  salary: 95000,
  department: 'Human Resources',
  email: 'jane.doe@company.com',
  hireDate: '2020-01-15',
}

describe('Attendance API', () => {
  let employeeId = ''

  beforeEach(async () => {
    await prisma.attendanceRecord.deleteMany()
    await prisma.employee.deleteMany()

    const created = await request(app).post('/api/employees').send(employeePayload)
    employeeId = created.body.id
  })

  afterAll(async () => {
    await disconnectPrisma()
  })

  it('records and lists attendance', async () => {
    const created = await request(app).post('/api/attendance').send({
      employeeId,
      date: '2026-05-20',
      status: 'PRESENT',
      checkIn: '2026-05-20T09:00:00.000Z',
      checkOut: '2026-05-20T18:00:00.000Z',
    })

    expect(created.status).toBe(201)
    expect(created.body.employee.fullName).toBe('Jane Doe')

    const listed = await request(app).get('/api/attendance?employeeId=' + employeeId)
    expect(listed.status).toBe(200)
    expect(listed.body.total).toBe(1)
  })

  it('returns attendance summary', async () => {
    await request(app).post('/api/attendance').send({
      employeeId,
      date: '2026-05-20',
      status: 'PRESENT',
    })
    await request(app).post('/api/attendance').send({
      employeeId,
      date: '2026-05-21',
      status: 'ABSENT',
    })

    const summary = await request(app).get('/api/attendance/summary')
    expect(summary.status).toBe(200)
    expect(summary.body.totalRecords).toBe(2)
    expect(summary.body.attendanceRate).toBe(50)
  })

  it('prevents duplicate attendance for the same day', async () => {
    await request(app).post('/api/attendance').send({
      employeeId,
      date: '2026-05-20',
      status: 'PRESENT',
    })

    const duplicate = await request(app).post('/api/attendance').send({
      employeeId,
      date: '2026-05-20',
      status: 'LATE',
    })

    expect(duplicate.status).toBe(409)
  })
})
