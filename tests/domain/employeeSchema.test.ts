import { describe, expect, it } from 'vitest'
import { parseEmployeeInput } from '../../src/domain/employeeSchema.js'

describe('employeeSchema', () => {
  const validEmployee = {
    fullName: 'Jane Doe',
    jobTitle: 'Software Engineer',
    country: 'USA',
    salary: 120000,
    department: 'Engineering',
    email: 'jane.doe@company.com',
    hireDate: '2022-05-01',
  }

  it('accepts a valid employee payload', () => {
    const result = parseEmployeeInput(validEmployee)
    expect(result.success).toBe(true)
  })

  it('rejects empty full name', () => {
    const result = parseEmployeeInput({ ...validEmployee, fullName: '  ' })
    expect(result.success).toBe(false)
  })

  it('rejects non-positive salary', () => {
    const result = parseEmployeeInput({ ...validEmployee, salary: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = parseEmployeeInput({ ...validEmployee, email: 'not-an-email' })
    expect(result.success).toBe(false)
  })

  it('coerces hire date strings into dates', () => {
    const result = parseEmployeeInput(validEmployee)
    if (!result.success) throw new Error('Expected valid employee')
    expect(result.data.hireDate).toBeInstanceOf(Date)
  })
})
