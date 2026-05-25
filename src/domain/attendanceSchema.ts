import { z } from 'zod'

export const attendanceStatuses = [
  'PRESENT',
  'ABSENT',
  'LATE',
  'REMOTE',
  'ON_LEAVE',
] as const

export type AttendanceStatus = (typeof attendanceStatuses)[number]

export const attendanceInputSchema = z
  .object({
    employeeId: z.string().uuid('A valid employee id is required'),
    date: z.coerce.date(),
    status: z.enum(attendanceStatuses),
    checkIn: z.coerce.date().optional(),
    checkOut: z.coerce.date().optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.checkOut && !data.checkIn) {
      ctx.addIssue({
        code: 'custom',
        message: 'Check-in is required when check-out is provided',
        path: ['checkIn'],
      })
    }

    if (data.checkIn && data.checkOut && data.checkOut <= data.checkIn) {
      ctx.addIssue({
        code: 'custom',
        message: 'Check-out must be after check-in',
        path: ['checkOut'],
      })
    }
  })

export type AttendanceInput = z.infer<typeof attendanceInputSchema>

export function parseAttendanceInput(data: unknown) {
  return attendanceInputSchema.safeParse(data)
}

export function startOfDay(date: Date): Date {
  const normalized = new Date(date)
  normalized.setUTCHours(0, 0, 0, 0)
  return normalized
}
