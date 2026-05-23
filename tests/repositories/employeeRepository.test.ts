import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { disconnectPrisma, prisma } from '../../src/lib/prisma.js'
import { EmployeeRepository } from '../../src/repositories/employeeRepository.js'

const repository = new EmployeeRepository()

const sampleEmployee = {
  fullName: 'Alice Johnson',
  jobTitle: 'Software Engineer',
  country: 'USA',
  salary: 120000,
  department: 'Engineering',
  email: 'alice.johnson@company.com',
  hireDate: new Date('2021-03-15'),
}

describe('EmployeeRepository', () => {
  beforeEach(async () => {
    await prisma.employee.deleteMany()
  })

  afterAll(async () => {
    await disconnectPrisma()
  })

  it('creates and finds an employee by id', async () => {
    const created = await repository.create(sampleEmployee)
    const found = await repository.findById(created.id)

    expect(found?.email).toBe(sampleEmployee.email)
  })

  it('updates an employee', async () => {
    const created = await repository.create(sampleEmployee)
    const updated = await repository.update(created.id, {
      ...sampleEmployee,
      salary: 130000,
    })

    expect(updated?.salary).toBe(130000)
  })

  it('deletes an employee', async () => {
    const created = await repository.create(sampleEmployee)
    const deleted = await repository.delete(created.id)
    const found = await repository.findById(created.id)

    expect(deleted).toBe(true)
    expect(found).toBeNull()
  })

  it('lists employees with pagination and search', async () => {
    await repository.create(sampleEmployee)
    await repository.create({
      ...sampleEmployee,
      fullName: 'Bob Smith',
      email: 'bob.smith@company.com',
      country: 'India',
      salary: 900000,
    })

    const page = await repository.list({ page: 1, pageSize: 1, search: 'Alice' })

    expect(page.total).toBe(1)
    expect(page.data[0]?.fullName).toBe('Alice Johnson')
  })

  it('returns country salary summaries', async () => {
    await repository.create(sampleEmployee)
    await repository.create({
      ...sampleEmployee,
      fullName: 'Bob Smith',
      email: 'bob.smith@company.com',
      salary: 80000,
    })

    const summaries = await repository.getCountrySummaries()

    expect(summaries).toHaveLength(1)
    expect(summaries[0]?.country).toBe('USA')
    expect(summaries[0]?.count).toBe(2)
  })
})
