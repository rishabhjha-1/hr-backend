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

describe('Employees API', () => {
  beforeEach(async () => {
    await prisma.attendanceRecord.deleteMany()
    await prisma.employee.deleteMany()
  })

  afterAll(async () => {
    await disconnectPrisma()
  })

  it('creates an employee', async () => {
    const response = await request(app).post('/api/employees').send(employeePayload)

    expect(response.status).toBe(201)
    expect(response.body.fullName).toBe('Jane Doe')
  })

  it('returns validation errors for invalid payloads', async () => {
    const response = await request(app)
      .post('/api/employees')
      .send({ ...employeePayload, salary: -1 })

    expect(response.status).toBe(400)
  })

  it('lists employees with pagination metadata', async () => {
    await request(app).post('/api/employees').send(employeePayload)

    const response = await request(app).get('/api/employees?page=1&pageSize=10')

    expect(response.status).toBe(200)
    expect(response.body.total).toBe(1)
    expect(response.body.data).toHaveLength(1)
  })

  it('updates and deletes an employee', async () => {
    const created = await request(app).post('/api/employees').send(employeePayload)
    const id = created.body.id

    const updated = await request(app)
      .put(`/api/employees/${id}`)
      .send({ ...employeePayload, salary: 100000 })

    expect(updated.status).toBe(200)
    expect(updated.body.salary).toBe(100000)

    const deleted = await request(app).delete(`/api/employees/${id}`)
    expect(deleted.status).toBe(204)
  })
})
