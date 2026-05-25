import { Router, type Router as ExpressRouter } from 'express'
import { parseSelfCheckIn, parseSelfEmail } from '../domain/selfAttendanceSchema.js'
import { attendanceRepository } from '../repositories/attendanceRepository.js'
import { employeeRepository } from '../repositories/employeeRepository.js'

export const selfRouter: ExpressRouter = Router()

function weekAgo() {
  const date = new Date()
  date.setDate(date.getDate() - 14)
  return date
}

selfRouter.post('/identify', async (req, res) => {
  const parsed = parseSelfEmail(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const employee = await employeeRepository.findByEmail(parsed.data.email)
  if (!employee) {
    res.status(404).json({ error: 'No employee found with this email' })
    return
  }

  const today = await attendanceRepository.findByEmployeeAndDate(employee.id, new Date())

  res.json({ employee, today })
})

selfRouter.get('/attendance', async (req, res) => {
  const parsed = parseSelfEmail({ email: req.query.email })
  if (!parsed.success) {
    res.status(400).json({ error: 'A valid email query parameter is required' })
    return
  }

  const employee = await employeeRepository.findByEmail(parsed.data.email)
  if (!employee) {
    res.status(404).json({ error: 'No employee found with this email' })
    return
  }

  const history = await attendanceRepository.list({
    employeeId: employee.id,
    from: weekAgo(),
    to: new Date(),
    page: 1,
    pageSize: 14,
  })

  res.json({ employee, records: history.data })
})

selfRouter.post('/check-in', async (req, res) => {
  const parsed = parseSelfCheckIn(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const employee = await employeeRepository.findByEmail(parsed.data.email)
  if (!employee) {
    res.status(404).json({ error: 'No employee found with this email' })
    return
  }

  const result = await attendanceRepository.checkIn(employee.id, parsed.data.workMode)

  if (result.error === 'already_checked_in') {
    res.status(409).json({ error: 'You have already checked in today', record: result.record })
    return
  }

  res.status(201).json({ employee, record: result.record })
})

selfRouter.post('/check-out', async (req, res) => {
  const parsed = parseSelfEmail(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const employee = await employeeRepository.findByEmail(parsed.data.email)
  if (!employee) {
    res.status(404).json({ error: 'No employee found with this email' })
    return
  }

  const result = await attendanceRepository.checkOut(employee.id)

  if (result.error === 'not_checked_in') {
    res.status(400).json({ error: 'Check in before checking out' })
    return
  }

  if (result.error === 'already_checked_out') {
    res.status(409).json({ error: 'You have already checked out today', record: result.record })
    return
  }

  res.json({ employee, record: result.record })
})
