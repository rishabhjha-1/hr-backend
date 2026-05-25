import cors from 'cors'
import express, { type Express } from 'express'
import { attendanceRouter } from './routes/attendance.js'
import { employeesRouter } from './routes/employees.js'
import { insightsRouter } from './routes/insights.js'
import { payrollRouter } from './routes/payroll.js'

export function createApp(): Express {
  const app = express()

  app.use(cors())
  app.use(express.json())

  app.get('/health', (_req, res) => {
    res.json({ status: 'healthy' })
  })

  app.use('/api/employees', employeesRouter)
  app.use('/api/insights', insightsRouter)
  app.use('/api/attendance', attendanceRouter)
  app.use('/api/payroll', payrollRouter)

  return app
}
