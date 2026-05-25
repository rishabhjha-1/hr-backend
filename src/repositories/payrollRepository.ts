import { computeEmployeePayroll, countDaysByStatus } from '../domain/payroll.js'
import type { AttendanceStatus } from '../domain/attendanceSchema.js'
import { startOfDay } from '../domain/attendanceSchema.js'
import { prisma } from '../lib/prisma.js'

export type PayrollListQuery = {
  page?: number
  pageSize?: number
  from?: Date
  to?: Date
  department?: string
  search?: string
}

export type PayrollLineItem = {
  employeeId: string
  fullName: string
  jobTitle: string
  department: string
  country: string
  annualSalary: number
  paidDays: number
  unpaidDays: number
  monthlySalary: number
  dailyRate: number
  grossPay: number
  deductions: number
  netPay: number
  attendanceRate: number
  dayCounts: {
    present: number
    absent: number
    late: number
    remote: number
    onLeave: number
    total: number
  }
}

export type PaginatedPayroll = {
  data: PayrollLineItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  period: { from: string; to: string }
}

export type PayrollPeriodSummary = {
  period: { from: string; to: string }
  employeeCount: number
  totalGrossPay: number
  totalDeductions: number
  totalNetPay: number
  averageNetPay: number
  totalPaidDays: number
  totalAbsentDays: number
}

function periodBounds(from?: Date, to?: Date) {
  const end = to ? startOfDay(to) : startOfDay(new Date())
  const start = from ? startOfDay(from) : startOfDay(new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000))
  return { start, end }
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

export class PayrollRepository {
  private async attendanceCountsByEmployee(start: Date, end: Date, employeeIds: string[]) {
    if (employeeIds.length === 0) {
      return new Map<string, Array<{ status: AttendanceStatus; count: number }>>()
    }

    const grouped = await prisma.attendanceRecord.groupBy({
      by: ['employeeId', 'status'],
      where: {
        employeeId: { in: employeeIds },
        date: { gte: start, lte: end },
      },
      _count: { _all: true },
    })

    const map = new Map<string, Array<{ status: AttendanceStatus; count: number }>>()

    for (const row of grouped) {
      const existing = map.get(row.employeeId) ?? []
      existing.push({ status: row.status, count: row._count._all })
      map.set(row.employeeId, existing)
    }

    return map
  }

  async list(query: PayrollListQuery = {}): Promise<PaginatedPayroll> {
    const page = Math.max(1, query.page ?? 1)
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20))
    const { start, end } = periodBounds(query.from, query.to)

    const where = {
      ...(query.department ? { department: query.department } : {}),
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search, mode: 'insensitive' as const } },
              { email: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { fullName: 'asc' },
      }),
      prisma.employee.count({ where }),
    ])

    const employeeIds = employees.map((employee) => employee.id)
    const attendanceByEmployee = await this.attendanceCountsByEmployee(start, end, employeeIds)

    const data = employees.map((employee) => {
      const statusRows = attendanceByEmployee.get(employee.id) ?? []
      const dayCounts = countDaysByStatus(statusRows)
      const payroll = computeEmployeePayroll(employee.salary, dayCounts)

      return {
        employeeId: employee.id,
        fullName: employee.fullName,
        jobTitle: employee.jobTitle,
        department: employee.department,
        country: employee.country,
        annualSalary: employee.salary,
        dayCounts,
        ...payroll,
      }
    })

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
      period: { from: toIsoDate(start), to: toIsoDate(end) },
    }
  }

  async getSummary(from?: Date, to?: Date): Promise<PayrollPeriodSummary> {
    const { start, end } = periodBounds(from, to)

    const grouped = await prisma.attendanceRecord.groupBy({
      by: ['employeeId', 'status'],
      where: { date: { gte: start, lte: end } },
      _count: { _all: true },
    })

    const byEmployee = new Map<string, Array<{ status: AttendanceStatus; count: number }>>()
    for (const row of grouped) {
      const existing = byEmployee.get(row.employeeId) ?? []
      existing.push({ status: row.status, count: row._count._all })
      byEmployee.set(row.employeeId, existing)
    }

    const employeeIds = [...byEmployee.keys()]
    if (employeeIds.length === 0) {
      return {
        period: { from: toIsoDate(start), to: toIsoDate(end) },
        employeeCount: 0,
        totalGrossPay: 0,
        totalDeductions: 0,
        totalNetPay: 0,
        averageNetPay: 0,
        totalPaidDays: 0,
        totalAbsentDays: 0,
      }
    }

    const employees = await prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      select: { id: true, salary: true },
    })

    let totalGrossPay = 0
    let totalDeductions = 0
    let totalNetPay = 0
    let totalPaidDays = 0
    let totalAbsentDays = 0

    for (const employee of employees) {
      const dayCounts = countDaysByStatus(byEmployee.get(employee.id) ?? [])
      const payroll = computeEmployeePayroll(employee.salary, dayCounts)
      totalGrossPay += payroll.grossPay
      totalDeductions += payroll.deductions
      totalNetPay += payroll.netPay
      totalPaidDays += payroll.paidDays
      totalAbsentDays += payroll.unpaidDays
    }

    return {
      period: { from: toIsoDate(start), to: toIsoDate(end) },
      employeeCount: employees.length,
      totalGrossPay: Math.round(totalGrossPay * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      totalNetPay: Math.round(totalNetPay * 100) / 100,
      averageNetPay:
        employees.length === 0
          ? 0
          : Math.round((totalNetPay / employees.length) * 100) / 100,
      totalPaidDays,
      totalAbsentDays,
    }
  }
}

export const payrollRepository = new PayrollRepository()
