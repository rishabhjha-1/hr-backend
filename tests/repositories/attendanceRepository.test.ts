import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { disconnectPrisma, prisma } from '../../src/lib/prisma.js'
import { AttendanceRepository } from '../../src/repositories/attendanceRepository.js'
import { EmployeeRepository } from '../../src/repositories/employeeRepository.js'

const attendanceRepository = new AttendanceRepository()
const employeeRepository = new EmployeeRepository()

const sampleEmployee = {
  fullName: 'Alice Johnson',
  jobTitle: 'Software Engineer',
  country: 'USA',
  salary: 120000,
  department: 'Engineering',
  email: 'alice.johnson@company.com',
  hireDate: new Date('2021-03-15'),
}

describe('AttendanceRepository', () => {
  beforeEach(async () => {
    await prisma.attendanceRecord.deleteMany()
    await prisma.employee.deleteMany()
  })

  afterAll(async () => {
    await disconnectPrisma()
  })

  it('creates and lists attendance records', async () => {
    const employee = await employeeRepository.create(sampleEmployee)
    await attendanceRepository.create({
      employeeId: employee.id,
      date: new Date('2026-05-20'),
      status: 'PRESENT',
      checkIn: new Date('2026-05-20T09:00:00.000Z'),
      checkOut: new Date('2026-05-20T18:00:00.000Z'),
    })

    const result = await attendanceRepository.list({ employeeId: employee.id })

    expect(result.total).toBe(1)
    expect(result.data[0]?.status).toBe('PRESENT')
    expect(result.data[0]?.employee.fullName).toBe('Alice Johnson')
  })

  it('summarizes attendance by status', async () => {
    const employee = await employeeRepository.create(sampleEmployee)
    await attendanceRepository.create({
      employeeId: employee.id,
      date: new Date('2026-05-20'),
      status: 'PRESENT',
    })
    await attendanceRepository.create({
      employeeId: employee.id,
      date: new Date('2026-05-21'),
      status: 'ABSENT',
    })

    const summary = await attendanceRepository.getSummary()

    expect(summary.totalRecords).toBe(2)
    expect(summary.presentCount).toBe(1)
    expect(summary.absentCount).toBe(1)
  })
})
