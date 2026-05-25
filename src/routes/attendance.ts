import { Router, type Router as ExpressRouter } from 'express'
import { attendanceStatuses, parseAttendanceInput } from '../domain/attendanceSchema.js'
import { attendanceRepository } from '../repositories/attendanceRepository.js'
import { employeeRepository } from '../repositories/employeeRepository.js'

export const attendanceRouter: ExpressRouter = Router()

attendanceRouter.get('/summary', async (req, res) => {
  const from = typeof req.query.from === 'string' ? new Date(req.query.from) : undefined
  const to = typeof req.query.to === 'string' ? new Date(req.query.to) : undefined

  if (from && Number.isNaN(from.getTime())) {
    res.status(400).json({ error: 'Invalid from date' })
    return
  }

  if (to && Number.isNaN(to.getTime())) {
    res.status(400).json({ error: 'Invalid to date' })
    return
  }

  const summary = await attendanceRepository.getSummary(from, to)
  res.json(summary)
})

attendanceRouter.get('/', async (req, res) => {
  const query: Parameters<typeof attendanceRepository.list>[0] = {}

  if (typeof req.query.page === 'string' && req.query.page !== '') {
    const page = Number(req.query.page)
    if (Number.isFinite(page)) query.page = page
  }

  if (typeof req.query.pageSize === 'string' && req.query.pageSize !== '') {
    const pageSize = Number(req.query.pageSize)
    if (Number.isFinite(pageSize)) query.pageSize = pageSize
  }

  if (typeof req.query.employeeId === 'string' && req.query.employeeId !== '') {
    query.employeeId = req.query.employeeId
  }

  if (
    typeof req.query.status === 'string' &&
    attendanceStatuses.includes(req.query.status as (typeof attendanceStatuses)[number])
  ) {
    query.status = req.query.status as (typeof attendanceStatuses)[number]
  }

  if (typeof req.query.from === 'string' && req.query.from !== '') {
    const from = new Date(req.query.from)
    if (Number.isNaN(from.getTime())) {
      res.status(400).json({ error: 'Invalid from date' })
      return
    }
    query.from = from
  }

  if (typeof req.query.to === 'string' && req.query.to !== '') {
    const to = new Date(req.query.to)
    if (Number.isNaN(to.getTime())) {
      res.status(400).json({ error: 'Invalid to date' })
      return
    }
    query.to = to
  }

  const result = await attendanceRepository.list(query)
  res.json(result)
})

attendanceRouter.get('/:id', async (req, res) => {
  const record = await attendanceRepository.findById(req.params.id)
  if (!record) {
    res.status(404).json({ error: 'Attendance record not found' })
    return
  }
  res.json(record)
})

attendanceRouter.post('/', async (req, res) => {
  const parsed = parseAttendanceInput(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const employee = await employeeRepository.findById(parsed.data.employeeId)
  if (!employee) {
    res.status(404).json({ error: 'Employee not found' })
    return
  }

  try {
    const record = await attendanceRepository.create(parsed.data)
    const withEmployee = await attendanceRepository.findById(record.id)
    res.status(201).json(withEmployee)
  } catch {
    res.status(409).json({ error: 'Attendance already recorded for this employee on this date' })
  }
})

attendanceRouter.put('/:id', async (req, res) => {
  const parsed = parseAttendanceInput(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const employee = await employeeRepository.findById(parsed.data.employeeId)
  if (!employee) {
    res.status(404).json({ error: 'Employee not found' })
    return
  }

  try {
    const record = await attendanceRepository.update(req.params.id, parsed.data)
    if (!record) {
      res.status(404).json({ error: 'Attendance record not found' })
      return
    }
    res.json(record)
  } catch {
    res.status(409).json({ error: 'Attendance already recorded for this employee on this date' })
  }
})

attendanceRouter.delete('/:id', async (req, res) => {
  const deleted = await attendanceRepository.delete(req.params.id)
  if (!deleted) {
    res.status(404).json({ error: 'Attendance record not found' })
    return
  }
  res.status(204).send()
})
