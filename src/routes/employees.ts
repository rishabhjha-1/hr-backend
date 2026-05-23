import { Router, type Router as ExpressRouter } from 'express'
import { parseEmployeeInput } from '../domain/employeeSchema.js'
import { employeeRepository } from '../repositories/employeeRepository.js'

export const employeesRouter: ExpressRouter = Router()

employeesRouter.get('/', async (req, res) => {
  const query: Parameters<typeof employeeRepository.list>[0] = {}

  if (typeof req.query.page === 'string' && req.query.page !== '') {
    const page = Number(req.query.page)
    if (Number.isFinite(page)) query.page = page
  }

  if (typeof req.query.pageSize === 'string' && req.query.pageSize !== '') {
    const pageSize = Number(req.query.pageSize)
    if (Number.isFinite(pageSize)) query.pageSize = pageSize
  }

  if (typeof req.query.search === 'string' && req.query.search !== '') {
    query.search = req.query.search
  }

  if (typeof req.query.country === 'string' && req.query.country !== '') {
    query.country = req.query.country
  }

  if (typeof req.query.jobTitle === 'string' && req.query.jobTitle !== '') {
    query.jobTitle = req.query.jobTitle
  }

  const result = await employeeRepository.list(query)

  res.json(result)
})

employeesRouter.get('/:id', async (req, res) => {
  const employee = await employeeRepository.findById(req.params.id)
  if (!employee) {
    res.status(404).json({ error: 'Employee not found' })
    return
  }
  res.json(employee)
})

employeesRouter.post('/', async (req, res) => {
  const parsed = parseEmployeeInput(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  try {
    const employee = await employeeRepository.create(parsed.data)
    res.status(201).json(employee)
  } catch {
    res.status(409).json({ error: 'Employee with this email already exists' })
  }
})

employeesRouter.put('/:id', async (req, res) => {
  const parsed = parseEmployeeInput(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  try {
    const employee = await employeeRepository.update(req.params.id, parsed.data)
    if (!employee) {
      res.status(404).json({ error: 'Employee not found' })
      return
    }
    res.json(employee)
  } catch {
    res.status(409).json({ error: 'Employee with this email already exists' })
  }
})

employeesRouter.delete('/:id', async (req, res) => {
  const deleted = await employeeRepository.delete(req.params.id)
  if (!deleted) {
    res.status(404).json({ error: 'Employee not found' })
    return
  }
  res.status(204).send()
})
