import { z } from 'zod'

export const employeeInputSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required'),
  jobTitle: z.string().trim().min(1, 'Job title is required'),
  country: z.string().trim().min(1, 'Country is required'),
  salary: z.number().positive('Salary must be greater than zero'),
  department: z.string().trim().min(1, 'Department is required'),
  email: z.string().trim().email('A valid email is required'),
  hireDate: z.coerce.date(),
})

export type EmployeeInput = z.infer<typeof employeeInputSchema>

export function parseEmployeeInput(data: unknown) {
  return employeeInputSchema.safeParse(data)
}
