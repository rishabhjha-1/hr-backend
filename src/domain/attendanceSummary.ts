import type { AttendanceStatus } from './attendanceSchema.js'

export type StatusCount = {
  status: AttendanceStatus
  count: number
}

export type AttendanceSummary = {
  totalRecords: number
  presentCount: number
  absentCount: number
  lateCount: number
  remoteCount: number
  onLeaveCount: number
  attendanceRate: number
  byStatus: StatusCount[]
}

const PRESENT_STATUSES: AttendanceStatus[] = ['PRESENT', 'LATE', 'REMOTE']

export function computeAttendanceSummary(
  counts: Array<{ status: AttendanceStatus; count: number }>,
): AttendanceSummary {
  const byStatus = counts.map((row) => ({ status: row.status, count: row.count }))
  const totalRecords = byStatus.reduce((sum, row) => sum + row.count, 0)

  const countFor = (status: AttendanceStatus) =>
    byStatus.find((row) => row.status === status)?.count ?? 0

  const presentCount = PRESENT_STATUSES.reduce((sum, status) => sum + countFor(status), 0)
  const absentCount = countFor('ABSENT')
  const lateCount = countFor('LATE')
  const remoteCount = countFor('REMOTE')
  const onLeaveCount = countFor('ON_LEAVE')

  const activeRecords = totalRecords - onLeaveCount
  const attendanceRate =
    activeRecords === 0 ? 0 : Math.round((presentCount / activeRecords) * 10000) / 100

  return {
    totalRecords,
    presentCount,
    absentCount,
    lateCount,
    remoteCount,
    onLeaveCount,
    attendanceRate,
    byStatus,
  }
}
