import cors from 'cors'
import express, { type Express } from 'express'
import { employeesRouter } from './routes/employees.js'
import { insightsRouter } from './routes/insights.js'

export function createApp(): Express {
  const app = express()

  app.use(cors())
  app.use(express.json())

  app.get('/health', (_req, res) => {
    res.json({ status: 'healthy' })
  })

  app.use('/api/employees', employeesRouter)
  app.use('/api/insights', insightsRouter)

  return app
}
