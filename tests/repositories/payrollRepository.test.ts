import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { disconnectPrisma, prisma } from '../../src/lib/prisma.js'
import { AttendanceRepository } from '../../src/repositories/attendanceRepository.js'
import { EmployeeRepository } from '../../src/repositories/employeeRepository.js'
import { PayrollRepository } from '../../src/repositories/payrollRepository.js'

const employeeRepository = new EmployeeRepository()
const attendanceRepository = new AttendanceRepository()
const payrollRepository = new PayrollRepository()

const sampleEmployee = {
  fullName: 'Payroll Test',
  jobTitle: 'Engineer',
  country: 'USA',
  salary: 120_000,
  department: 'Engineering',
  email: 'payroll.test@company.com',
  hireDate: new Date('2021-01-01'),
}

describe('PayrollRepository', () => {
  beforeEach(async () => {
    await prisma.attendanceRecord.deleteMany()
    await prisma.employee.deleteMany()
  })

  afterAll(async () => {
    await disconnectPrisma()
  })

  it('builds payroll from attendance in a period', async () => {
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

    const payroll = await payrollRepository.list({
      from: new Date('2026-05-20'),
      to: new Date('2026-05-21'),
      search: 'Payroll Test',
    })

    expect(payroll.data).toHaveLength(1)
    expect(payroll.data[0]?.paidDays).toBe(1)
    expect(payroll.data[0]?.unpaidDays).toBe(1)
    expect(payroll.data[0]?.grossPay).toBeGreaterThan(0)
  })

  it('summarizes payroll totals for the period', async () => {
    const employee = await employeeRepository.create(sampleEmployee)

    await attendanceRepository.create({
      employeeId: employee.id,
      date: new Date('2026-05-22'),
      status: 'PRESENT',
    })

    const summary = await payrollRepository.getSummary(
      new Date('2026-05-22'),
      new Date('2026-05-22'),
    )

    expect(summary.employeeCount).toBe(1)
    expect(summary.totalNetPay).toBeGreaterThan(0)
    expect(summary.totalPaidDays).toBe(1)
  })
})
