import type { Employee } from '../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import type { EmployeeInput } from '../domain/employeeSchema.js'

export type EmployeeListQuery = {
  page?: number
  pageSize?: number
  search?: string
  country?: string
  jobTitle?: string
}

export type PaginatedEmployees = {
  data: Employee[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export class EmployeeRepository {
  async create(input: EmployeeInput): Promise<Employee> {
    return prisma.employee.create({ data: input })
  }

  async findById(id: string): Promise<Employee | null> {
    return prisma.employee.findUnique({ where: { id } })
  }

  async findByEmail(email: string) {
    return prisma.employee.findFirst({
      where: { email: { equals: email.trim(), mode: 'insensitive' } },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        department: true,
        country: true,
        email: true,
      },
    })
  }

  async update(id: string, input: EmployeeInput): Promise<Employee | null> {
    try {
      return await prisma.employee.update({ where: { id }, data: input })
    } catch {
      return null
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.employee.delete({ where: { id } })
      return true
    } catch {
      return false
    }
  }

  async list(query: EmployeeListQuery = {}): Promise<PaginatedEmployees> {
    const page = Math.max(1, query.page ?? 1)
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20))
    const where = {
      ...(query.country ? { country: query.country } : {}),
      ...(query.jobTitle ? { jobTitle: query.jobTitle } : {}),
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search, mode: 'insensitive' as const } },
              { email: { contains: query.search, mode: 'insensitive' as const } },
              { jobTitle: { contains: query.search, mode: 'insensitive' as const } },
              { department: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    const [data, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { fullName: 'asc' },
      }),
      prisma.employee.count({ where }),
    ])

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    }
  }

  async countAll(): Promise<number> {
    return prisma.employee.count()
  }

  async getSalariesByCountry(country: string): Promise<number[]> {
    const employees = await prisma.employee.findMany({
      where: { country },
      select: { salary: true },
    })
    return employees.map((employee) => employee.salary)
  }

  async getSalariesByCountryAndJobTitle(
    country: string,
    jobTitle: string,
  ): Promise<number[]> {
    const employees = await prisma.employee.findMany({
      where: { country, jobTitle },
      select: { salary: true },
    })
    return employees.map((employee) => employee.salary)
  }

  async getCountrySummaries() {
    const grouped = await prisma.employee.groupBy({
      by: ['country'],
      _count: { _all: true },
      _min: { salary: true },
      _max: { salary: true },
      _avg: { salary: true },
      orderBy: { country: 'asc' },
    })

    return grouped.map((row) => ({
      country: row.country,
      count: row._count._all,
      min: row._min.salary ?? 0,
      max: row._max.salary ?? 0,
      average: Math.round((row._avg.salary ?? 0) * 100) / 100,
    }))
  }

  async getJobTitleSummariesByCountry(country: string) {
    const grouped = await prisma.employee.groupBy({
      by: ['jobTitle'],
      where: { country },
      _count: { _all: true },
      _avg: { salary: true },
      orderBy: { jobTitle: 'asc' },
    })

    return grouped.map((row) => ({
      jobTitle: row.jobTitle,
      count: row._count._all,
      averageSalary: Math.round((row._avg.salary ?? 0) * 100) / 100,
    }))
  }

  async getOrganizationSummary() {
    const [count, aggregate, countries, departments] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.aggregate({
        _min: { salary: true },
        _max: { salary: true },
        _avg: { salary: true },
      }),
      prisma.employee.groupBy({
        by: ['country'],
        _count: { _all: true },
      }),
      prisma.employee.groupBy({
        by: ['department'],
        _count: { _all: true },
        orderBy: { _count: { department: 'desc' } },
        take: 5,
      }),
    ])

    return {
      totalEmployees: count,
      minSalary: aggregate._min.salary ?? 0,
      maxSalary: aggregate._max.salary ?? 0,
      averageSalary: Math.round((aggregate._avg.salary ?? 0) * 100) / 100,
      countryCount: countries.length,
      topDepartments: departments.map((row) => ({
        department: row.department,
        count: row._count._all,
      })),
    }
  }
}

export const employeeRepository = new EmployeeRepository()
