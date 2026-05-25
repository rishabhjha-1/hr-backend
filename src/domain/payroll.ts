import type { AttendanceStatus } from './attendanceSchema.js'

export const WORKING_DAYS_PER_MONTH = 22

/** Annual salary stored on employee; payroll uses monthly equivalent. */
export const PAID_ATTENDANCE_STATUSES: AttendanceStatus[] = [
  'PRESENT',
  'LATE',
  'REMOTE',
  'ON_LEAVE',
]

export type AttendanceDayCounts = {
  present: number
  absent: number
  late: number
  remote: number
  onLeave: number
  total: number
}

export type EmployeePayroll = {
  paidDays: number
  unpaidDays: number
  monthlySalary: number
  dailyRate: number
  grossPay: number
  deductions: number
  netPay: number
  attendanceRate: number
}

export function countDaysByStatus(
  rows: Array<{ status: AttendanceStatus; count: number }>,
): AttendanceDayCounts {
  const countFor = (status: AttendanceStatus) =>
    rows.find((row) => row.status === status)?.count ?? 0

  const present = countFor('PRESENT')
  const absent = countFor('ABSENT')
  const late = countFor('LATE')
  const remote = countFor('REMOTE')
  const onLeave = countFor('ON_LEAVE')

  return {
    present,
    absent,
    late,
    remote,
    onLeave,
    total: present + absent + late + remote + onLeave,
  }
}

export function countPaidDays(counts: AttendanceDayCounts): number {
  return counts.present + counts.late + counts.remote + counts.onLeave
}

export function computeEmployeePayroll(
  annualSalary: number,
  dayCounts: AttendanceDayCounts,
): EmployeePayroll {
  const paidDays = countPaidDays(dayCounts)
  const unpaidDays = dayCounts.absent
  const monthlySalary = annualSalary / 12
  const dailyRate = monthlySalary / WORKING_DAYS_PER_MONTH
  const grossPay = Math.round(dailyRate * paidDays * 100) / 100
  const deductions = Math.round(dailyRate * unpaidDays * 100) / 100
  const netPay = grossPay
  const attendanceRate =
    dayCounts.total === 0 ? 0 : Math.round((paidDays / dayCounts.total) * 10000) / 100

  return {
    paidDays,
    unpaidDays,
    monthlySalary: Math.round(monthlySalary * 100) / 100,
    dailyRate: Math.round(dailyRate * 100) / 100,
    grossPay,
    deductions,
    netPay,
    attendanceRate,
  }
}
