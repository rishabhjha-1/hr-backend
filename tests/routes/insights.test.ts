import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../../src/app.js'
import { disconnectPrisma, prisma } from '../../src/lib/prisma.js'

const app = createApp()

describe('Insights API', () => {
  beforeEach(async () => {
    await prisma.employee.deleteMany()
    await prisma.employee.createMany({
      data: [
        {
          fullName: 'Alice USA',
          jobTitle: 'Software Engineer',
          country: 'USA',
          salary: 100000,
          department: 'Engineering',
          email: 'alice.usa@company.com',
          hireDate: new Date('2020-01-01'),
        },
        {
          fullName: 'Bob USA',
          jobTitle: 'Software Engineer',
          country: 'USA',
          salary: 120000,
          department: 'Engineering',
          email: 'bob.usa@company.com',
          hireDate: new Date('2021-01-01'),
        },
        {
          fullName: 'Carol India',
          jobTitle: 'HR Manager',
          country: 'India',
          salary: 900000,
          department: 'Human Resources',
          email: 'carol.india@company.com',
          hireDate: new Date('2019-01-01'),
        },
      ],
    })
  })

  afterAll(async () => {
    await disconnectPrisma()
  })

  it('returns organization summary metrics', async () => {
    const response = await request(app).get('/api/insights/summary')

    expect(response.status).toBe(200)
    expect(response.body.totalEmployees).toBe(3)
    expect(response.body.countryCount).toBe(2)
  })

  it('returns country salary stats', async () => {
    const response = await request(app).get('/api/insights/countries/USA')

    expect(response.status).toBe(200)
    expect(response.body.min).toBe(100000)
    expect(response.body.max).toBe(120000)
    expect(response.body.average).toBe(110000)
  })

  it('returns average salary for a job title in a country', async () => {
    const response = await request(
      app,
    ).get('/api/insights/countries/USA/job-titles/Software%20Engineer')

    expect(response.status).toBe(200)
    expect(response.body.average).toBe(110000)
    expect(response.body.count).toBe(2)
  })
})
