import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../../src/app.js'
import { disconnectPrisma, prisma } from '../../src/lib/prisma.js'

const app = createApp()

const employeePayload = {
  fullName: 'Self Service User',
  jobTitle: 'Engineer',
  country: 'USA',
  salary: 80_000,
  department: 'Engineering',
  email: 'self.service@company.com',
  hireDate: '2020-01-15',
}

describe('Self attendance API', () => {
  beforeEach(async () => {
    await prisma.attendanceRecord.deleteMany()
    await prisma.employee.deleteMany()
    await request(app).post('/api/employees').send(employeePayload)
  })

  afterAll(async () => {
    await disconnectPrisma()
  })

  it('identifies an employee by work email', async () => {
    const response = await request(app)
      .post('/api/self/identify')
      .send({ email: 'self.service@company.com' })

    expect(response.status).toBe(200)
    expect(response.body.employee.fullName).toBe('Self Service User')
    expect(response.body.today).toBeNull()
  })

  it('lets an employee check in and check out from their device', async () => {
    const checkIn = await request(app)
      .post('/api/self/check-in')
      .send({ email: 'self.service@company.com', workMode: 'office' })

    expect(checkIn.status).toBe(201)
    expect(['PRESENT', 'LATE', 'REMOTE']).toContain(checkIn.body.record.status)
    expect(checkIn.body.record.checkIn).toBeTruthy()

    const checkOut = await request(app)
      .post('/api/self/check-out')
      .send({ email: 'self.service@company.com' })

    expect(checkOut.status).toBe(200)
    expect(checkOut.body.record.checkOut).toBeTruthy()
  })

  it('rejects duplicate check-in on the same day', async () => {
    await request(app)
      .post('/api/self/check-in')
      .send({ email: 'self.service@company.com', workMode: 'remote' })

    const duplicate = await request(app)
      .post('/api/self/check-in')
      .send({ email: 'self.service@company.com', workMode: 'remote' })

    expect(duplicate.status).toBe(409)
  })
})
