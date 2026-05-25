import type { AttendanceRecord, AttendanceStatus, Prisma } from '../generated/prisma/client.js'
import { startOfDay } from '../domain/attendanceSchema.js'
import { deriveStatusFromCheckIn } from '../domain/selfAttendanceSchema.js'
import { computeAttendanceSummary } from '../domain/attendanceSummary.js'
import type { AttendanceInput } from '../domain/attendanceSchema.js'
import { prisma } from '../lib/prisma.js'

export type AttendanceListQuery = {
  page?: number
  pageSize?: number
  employeeId?: string
  status?: AttendanceStatus
  from?: Date
  to?: Date
}

export type PaginatedAttendance = {
  data: Array<
    AttendanceRecord & {
      employee: { id: string; fullName: string; department: string; jobTitle: string }
    }
  >
  total: number
  page: number
  pageSize: number
  totalPages: number
}

function toAttendanceData(input: AttendanceInput) {
  return {
    employeeId: input.employeeId,
    date: startOfDay(input.date),
    status: input.status,
    checkIn: input.checkIn ?? null,
    checkOut: input.checkOut ?? null,
    notes: input.notes ?? null,
  }
}

export class AttendanceRepository {
  async create(input: AttendanceInput): Promise<AttendanceRecord> {
    return prisma.attendanceRecord.create({ data: toAttendanceData(input) })
  }

  async findById(id: string) {
    return prisma.attendanceRecord.findUnique({
      where: { id },
      include: {
        employee: {
          select: { id: true, fullName: true, department: true, jobTitle: true },
        },
      },
    })
  }

  async update(id: string, input: AttendanceInput) {
    try {
      return await prisma.attendanceRecord.update({
        where: { id },
        data: toAttendanceData(input),
        include: {
          employee: {
            select: { id: true, fullName: true, department: true, jobTitle: true },
          },
        },
      })
    } catch {
      return null
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.attendanceRecord.delete({ where: { id } })
      return true
    } catch {
      return false
    }
  }

  async list(query: AttendanceListQuery = {}): Promise<PaginatedAttendance> {
    const page = Math.max(1, query.page ?? 1)
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20))

    const where: Prisma.AttendanceRecordWhereInput = {
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.from || query.to
        ? {
            date: {
              ...(query.from ? { gte: startOfDay(query.from) } : {}),
              ...(query.to ? { lte: startOfDay(query.to) } : {}),
            },
          }
        : {}),
    }

    const [data, total] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        include: {
          employee: {
            select: { id: true, fullName: true, department: true, jobTitle: true },
          },
        },
      }),
      prisma.attendanceRecord.count({ where }),
    ])

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    }
  }

  async findByEmployeeAndDate(employeeId: string, date: Date) {
    return prisma.attendanceRecord.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: startOfDay(date),
        },
      },
      include: {
        employee: {
          select: { id: true, fullName: true, department: true, jobTitle: true },
        },
      },
    })
  }

  async checkIn(employeeId: string, workMode: 'office' | 'remote' = 'office') {
    const today = startOfDay(new Date())
    const now = new Date()
    const status = deriveStatusFromCheckIn(now, workMode)
    const existing = await prisma.attendanceRecord.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    })

    if (existing?.checkIn) {
      return { error: 'already_checked_in' as const, record: existing }
    }

    if (existing) {
      const record = await prisma.attendanceRecord.update({
        where: { id: existing.id },
        data: { checkIn: now, status, checkOut: null },
        include: {
          employee: {
            select: { id: true, fullName: true, department: true, jobTitle: true },
          },
        },
      })
      return { error: null, record }
    }

    const record = await prisma.attendanceRecord.create({
      data: {
        employeeId,
        date: today,
        status,
        checkIn: now,
        checkOut: null,
        notes: null,
      },
      include: {
        employee: {
          select: { id: true, fullName: true, department: true, jobTitle: true },
        },
      },
    })
    return { error: null, record }
  }

  async checkOut(employeeId: string) {
    const today = startOfDay(new Date())
    const now = new Date()
    const existing = await prisma.attendanceRecord.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    })

    if (!existing?.checkIn) {
      return { error: 'not_checked_in' as const, record: existing }
    }

    if (existing.checkOut) {
      return { error: 'already_checked_out' as const, record: existing }
    }

    const record = await prisma.attendanceRecord.update({
      where: { id: existing.id },
      data: { checkOut: now },
      include: {
        employee: {
          select: { id: true, fullName: true, department: true, jobTitle: true },
        },
      },
    })
    return { error: null, record }
  }

  async getSummary(from?: Date, to?: Date) {
    const where: Prisma.AttendanceRecordWhereInput =
      from || to
        ? {
            date: {
              ...(from ? { gte: startOfDay(from) } : {}),
              ...(to ? { lte: startOfDay(to) } : {}),
            },
          }
        : {}

    const grouped = await prisma.attendanceRecord.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
    })

    return computeAttendanceSummary(
      grouped.map((row) => ({
        status: row.status,
        count: row._count._all,
      })),
    )
  }
}

export const attendanceRepository = new AttendanceRepository()
