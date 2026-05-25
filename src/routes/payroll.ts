import { Router, type Router as ExpressRouter } from 'express'
import { payrollRepository } from '../repositories/payrollRepository.js'

export const payrollRouter: ExpressRouter = Router()

function parseDateParam(value: unknown, label: string): Date | undefined | 'invalid' {
  if (typeof value !== 'string' || value === '') {
    return undefined
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'invalid'
  }
  return date
}

payrollRouter.get('/summary', async (req, res) => {
  const from = parseDateParam(req.query.from, 'from')
  const to = parseDateParam(req.query.to, 'to')

  if (from === 'invalid' || to === 'invalid') {
    res.status(400).json({ error: 'Invalid date parameter' })
    return
  }

  const summary = await payrollRepository.getSummary(from, to)
  res.json(summary)
})

payrollRouter.get('/', async (req, res) => {
  const query: Parameters<typeof payrollRepository.list>[0] = {}

  const from = parseDateParam(req.query.from, 'from')
  const to = parseDateParam(req.query.to, 'to')

  if (from === 'invalid' || to === 'invalid') {
    res.status(400).json({ error: 'Invalid date parameter' })
    return
  }

  if (from) query.from = from
  if (to) query.to = to

  if (typeof req.query.page === 'string' && req.query.page !== '') {
    const page = Number(req.query.page)
    if (Number.isFinite(page)) query.page = page
  }

  if (typeof req.query.pageSize === 'string' && req.query.pageSize !== '') {
    const pageSize = Number(req.query.pageSize)
    if (Number.isFinite(pageSize)) query.pageSize = pageSize
  }

  if (typeof req.query.department === 'string' && req.query.department !== '') {
    query.department = req.query.department
  }

  if (typeof req.query.search === 'string' && req.query.search !== '') {
    query.search = req.query.search
  }

  const result = await payrollRepository.list(query)
  res.json(result)
})
