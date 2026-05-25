import { z } from 'zod'

export const selfEmailSchema = z.object({
  email: z.string().trim().email('A valid work email is required'),
})

export const selfCheckInSchema = selfEmailSchema.extend({
  workMode: z.enum(['office', 'remote']).default('office'),
})

export type SelfCheckInInput = z.infer<typeof selfCheckInSchema>

export function parseSelfEmail(data: unknown) {
  return selfEmailSchema.safeParse(data)
}

export function parseSelfCheckIn(data: unknown) {
  return selfCheckInSchema.safeParse(data)
}

export function deriveStatusFromCheckIn(checkIn: Date, workMode: 'office' | 'remote') {
  if (workMode === 'remote') {
    return 'REMOTE' as const
  }

  const hours = checkIn.getHours()
  const minutes = checkIn.getMinutes()
  if (hours > 9 || (hours === 9 && minutes > 15)) {
    return 'LATE' as const
  }

  return 'PRESENT' as const
}
