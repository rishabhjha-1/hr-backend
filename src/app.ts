import cors from 'cors'
import express, { type Express, type RequestHandler } from 'express'
import { createApiRateLimiter, createWriteRateLimiter } from './middleware/rateLimit.js'
import { attendanceRouter } from './routes/attendance.js'
import { employeesRouter } from './routes/employees.js'
import { insightsRouter } from './routes/insights.js'
import { payrollRouter } from './routes/payroll.js'
import { selfRouter } from './routes/self.js'

function applyWriteRateLimit(router: express.Router, limiter: RequestHandler): express.Router {
  router.use((req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
      next()
      return
    }
    limiter(req, res, next)
  })
  return router
}

export function createApp(): Express {
  const app = express()
  const apiRateLimiter = createApiRateLimiter()
  const writeRateLimiter = createWriteRateLimiter()

  app.use(cors())
  app.use(express.json())

  app.get('/health', (_req, res) => {
    res.json({ status: 'healthy' })
  })

  app.use('/api', apiRateLimiter)

  app.use('/api/employees', applyWriteRateLimit(employeesRouter, writeRateLimiter))
  app.use('/api/insights', insightsRouter)
  app.use('/api/attendance', applyWriteRateLimit(attendanceRouter, writeRateLimiter))
  app.use('/api/payroll', payrollRouter)
  app.use('/api/self', applyWriteRateLimit(selfRouter, writeRateLimiter))

  return app
}
